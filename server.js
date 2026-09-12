import JSZip from "jszip"
import { execFile as execFileCallback } from "node:child_process"
import { mkdirSync, readdirSync } from "node:fs"
import { mkdtemp, readFile, rm, watch, writeFile } from "node:fs/promises"
import { minify } from "terser"
import { minify as minifyMarkup } from "html-minifier-terser"
import { compiler } from "google-closure-compiler"
import { createServer } from "node:http"
import { Packer } from "roadroller"
import { JSDOM } from "jsdom"

import WebSocket, { WebSocketServer } from "ws"
import { join, resolve } from "node:path"
import { tmpdir } from "node:os"
import { createHash } from "node:crypto"
import { promisify } from "node:util"

const execFile = promisify(execFileCallback)

const port = Number(process.env["PORT"] || 8002)
const host = "0.0.0.0"

// Custom live reload after build solution
// Usage: new EventSource(...).onmessage(e => e.data === 'reload' && location.reload())

/** @type {Res[]} */
const clients = []

function sendReload() {
  clients.forEach((client) => client.write("data: reload\n\n"))
}

const watchIgnoreFiles = [
  /^dist(?:[/\\]|$)/,
  /\.test\.[mc]?[jt]s$/,
  /\.d\.ts$/,
  /^jsconfig.json$/,
  /^package-lock.json$/,
  /^package.json$/,
  /^server.js$/,
  /^reload.js$/,
  /^manifest.js$/,
  /^eslint.config.js$/,
  /\.zip$/,
  /\.md$/,
  /\.gitignore$/,
  /\.DS_Store$/,
]

watchSource()

const server = createServer((req, res) => {
  if (req.headers["accept"] === "text/event-stream") {
    handleEventStream(req, res)
    return
  }
  serveGameSource(req, res)
})

const wss = new WebSocketServer({
  server,
  perMessageDeflate: {
    zlibDeflateOptions: {
      // See zlib defaults.
      chunkSize: 1024,
      memLevel: 7,
      level: 3,
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024,
    },
    // Other options settable:
    clientNoContextTakeover: true, // Defaults to negotiated value.
    serverNoContextTakeover: true, // Defaults to negotiated value.
    serverMaxWindowBits: 10, // Defaults to negotiated value.
    // Below options specified as default values.
    concurrencyLimit: 10, // Limits zlib concurrency for perf.
    threshold: 1024, // Size (in bytes) below which messages
    // should not be compressed if context takeover is disabled.
  },
})

/** @type {Map<number, WebSocket>} */
const connections = new Map()
let nextClientId = 1

wss.on("connection", (ws) => {
  const clientId = nextClientId++
  connections.set(clientId, ws)
  ws.send(`@${clientId}`)
  for (const [id, connection] of connections.entries()) {
    if (id !== clientId) {
      connection.send(`+${clientId}`)
    }
  }
  // log("WebSocket client connected")
  ws.on("close", () => {
    for (const [id, connection] of connections.entries()) {
      if (id !== clientId) {
        connection.send(`-${clientId}`)
      }
    }
    connections.delete(clientId)
    // log("WebSocket client disconnected")
  })
  ws.on("message", (raw, isBinary) => {
    if (isBinary) {
      throw new Error(`Binary messages are not supported in this mock server`)
    }
    /** @type {string} */
    const data = raw.toString()
    // log(`WebSocket message: ${data}`)
    if (data[0] !== "@") {
      for (const [id, connection] of connections.entries()) {
        if (id !== clientId) {
          connection.send(data)
        }
      }
      return
    }
    let [id, message] = data.match(/^@(\d+)\|(.*)$/)?.slice(1) ?? []
    if (!id || !message) {
      log(`Invalid message format: ${data}`)
      return
    }
    const conn = connections.get(Number(id))
    if (!conn) {
      log(`No connection found for id ${id}`)
      return
    }
    conn.send(message)
  })
})

/**
 * @param {Req} req
 * @param {Res} res
 */
function handleEventStream(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  })

  clients.push(res)
  // log("Client connected")

  req.on("close", () => {
    const index = clients.indexOf(res)
    if (index === -1) return
    clients.splice(index, 1)
    // log("Client disconnected")
  })
}

const liveReloadScript = `
    <script>
      globalThis.devWebSocket = new WebSocket("//" + location.host + "/ws");
    </script>
    <script type="module">
      const source = new EventSource(location.origin);
      source.onmessage = (event) => {
        if (event.data === "reload") window.location.reload();
      };
    </script>
`

/** @type {Map<string, string>} */
const developmentPages = new Map()

/**
 * @param {Req} req
 * @param {Res} res
 */
async function serveGameSource(req, res) {
  if (!req.url) throw new Error(`Error parsing url`)
  const url = new URL(req.url, `http://${req.headers.host}`)
  const route = url.pathname.replace(/^\//, "")
  let file = route
  if (route === "" || route === "wavedash") {
    const page = developmentPages.get(route || "index.html")
    if (page) {
      res.writeHead(200, {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache",
      })
      res.end(`${page}${liveReloadScript}`, "utf-8")
      return
    }
    file = "index.html"
  }
  if (file === "dist") file = "dist/terser/index.html"
  if (
    !/^(?:dist\/[a-z0-9_/-]+\.[a-z0-9]+|[a-z0-9_/-]+\.[a-z0-9]+)$/.test(file)
  ) {
    console.log(`Invalid file request: ${file}`)
    res.writeHead(404, {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache",
    })
    res.end(null, "utf-8")
    return
  }
  try {
    var data = await readFile(`./${file}`, { encoding: "utf-8" })
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") {
      res.writeHead(404)
      res.end(`Not found ${file}`)
      return
    }
    console.log(`Error loading ${file}: ${err}`)
    res.writeHead(500)
    res.end(`Error loading ${file}`)
    return
  }
  let contentType = "text/plain"
  if (file.endsWith(".html")) {
    data = data.replace("</body>", `${liveReloadScript}</body>`)
    contentType = "text/html"
  } else if (file.endsWith(".js")) {
    contentType = "application/javascript"
  } else if (file.endsWith(".css")) {
    contentType = "text/css"
  }
  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-cache",
  })
  res.end(data, "utf-8")
}

mkdirSync("dist", { recursive: true })

async function watchSource() {
  const folderPath = `./`
  try {
    var watcher = watch(folderPath)
  } catch (err) {
    log(`Failed to watch ${folderPath}`)
    throw new Error(`Failed to watch ${folderPath}`, { cause: err })
  }
  try {
    for await (const event of watcher) {
      switch (event.eventType) {
        case "rename":
        case "change": {
          const name = event.filename
          if (!name) break
          if (watchIgnoreFiles.some((pattern) => pattern.test(name))) break
          sendReload()
          buildSourceDebounced()
          break
        }
        default: {
          log(`Unhandled event ${event.eventType}`)
          break
        }
      }
    }
  } catch (err) {
    log(`Failed to watch ${folderPath}`)
  }
}

/** @type {NodeJS.Timeout} */
let timeout
let buildRunning = false
let buildQueued = false
let nextBuildId = 1
/** @type {string | undefined} */
let lastBuildInput
async function buildSourceDebounced() {
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    void buildSource().catch((err) => log(`Build failed: ${err}`))
  }, 200)
}

const nameCache = {}

let roadrollerRunning = false
/** @type {string | undefined} */
let roadrollerQueuedInput
/** @type {string | undefined} */
let roadrollerLastStartedInput

/**
 * Queue the newest Roadroller input. There is at most one active run and one
 * pending run; starting a run records its input so identical builds are not
 * packed again.
 *
 * @param {string} input
 * @param {string} date
 */
function queueRoadroller(input, date) {
  if (input === roadrollerLastStartedInput || input === roadrollerQueuedInput) {
    return
  }
  if (roadrollerRunning) {
    roadrollerQueuedInput = input
    return
  }
  void runRoadroller(input, date)
}

/** @param {string} input @param {string} date */
async function runRoadroller(input, date) {
  roadrollerRunning = true
  roadrollerLastStartedInput = input
  try {
    const packer = new Packer(
      [{ data: input, type: "text", action: "write" }],
      {},
    )
    // Use the fork's thorough release search. It is slower than the default
    // quick search, but the submission size is worth the extra build time.
    await packer.optimize(2)
    const { firstLine, secondLine } = packer.makeDecoder()
    const output = `<!doctype html><script>${firstLine}${secondLine}</script>`
    const distPath = resolve("./dist/roadroller")
    mkdirSync(distPath, { recursive: true })
    await writeFile(resolve(distPath, "index.html"), output)

    const zip = new JSZip()
    zip.file("index.html", output)
    const zipContent = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    })
    await writeFile(resolve("./dist", `roadroller-${date}.zip`), zipContent)
    await recompressZip(resolve("./dist", `roadroller-${date}.zip`))
    const recompressedZip = await readFile(
      resolve("./dist", `roadroller-${date}.zip`),
    )
    logStage("Roadrolled", recompressedZip.length, Buffer.byteLength(input))
    log(
      `${"Result".padEnd(10)} ${String(13312 - recompressedZip.length).padStart(5)} bytes left`,
    )
  } catch (err) {
    log(`Roadroller failed: ${formatError(err)} (input ${hash(input)})`)
  } finally {
    roadrollerRunning = false
    const queuedInput = roadrollerQueuedInput
    roadrollerQueuedInput = undefined
    if (queuedInput && queuedInput !== roadrollerLastStartedInput) {
      void runRoadroller(queuedInput, date)
    }
  }
}

/**
 * Read the already single-file Terser build for Roadroller.
 * @param {string} distPath
 */
async function writeRoadrollerInput(distPath) {
  return readFile(resolve(distPath, "index.html"), "utf-8")
}

async function buildSource() {
  if (buildRunning) {
    buildQueued = true
    return
  }
  buildRunning = true
  const buildId = nextBuildId++
  try {
    const initialInput = await readInitialBuildInput()
    if (initialInput === lastBuildInput) return
    const date = /** @type {string} */ (new Date().toISOString().split("T")[0])
    await Promise.all([
      rm(resolve("./dist/raw"), { recursive: true, force: true }),
      rm(resolve("./dist/inline"), { recursive: true, force: true }),
      rm(resolve("./dist/terser"), { recursive: true, force: true }),
      rm(resolve("./dist/closure"), { recursive: true, force: true }),
      rm(resolve("./dist/wavedash"), { recursive: true, force: true }),
      rm(resolve("./dist/roadroller"), { recursive: true, force: true }),
    ])
    try {
      const [rawHtml, inlineHtml, terserHtml] = await Promise.all([
        buildRawVariant(),
        buildInlineVariant(buildId),
        buildTerserVariant(buildId),
        buildVariant("wavedash"),
      ])
      await writeStage("raw", rawHtml, date, "Inline")
      await writeStage("inline", inlineHtml, date, "Stripped")
      await writeStage(
        "terser",
        await minifyReleaseHtml(terserHtml),
        date,
        "Mangled",
      )
      const closureHtml = await buildClosureVariant(terserHtml)
      await writeStage("closure", closureHtml, date, "Compiled")
    } catch (err) {
      log(`Build failed: ${formatError(err)}`)
      return
    }
    lastBuildInput = initialInput
    await buildRoadrollerVariant(date)
    await writeDevelopmentPages()
    await writeZip("wavedash", date)
  } finally {
    buildRunning = false
    if (buildQueued) {
      buildQueued = false
      void buildSource().catch((err) => log(`Build failed: ${err}`))
    }
  }
}

/** @param {string} source */
function stripDevOnlyLines(source) {
  return source
    .split("\n")
    .filter((line) => !line.includes("// DEV ONLY"))
    .join("\n")
}

/** @param {string} source */
function stripReleaseLines(source) {
  return stripDevOnlyLines(source)
    .split("\n")
    .filter((line) => !/wavedash/i.test(line))
    .map((line) => {
      if (line.startsWith("export default ")) return line
      return line.startsWith("export ") ? line.slice(7) : line
    })
    .join("\n")
}

/** @param {string} source @param {number} buildId @param {boolean} mangle @param {boolean} beautify */
async function minifyGame(source, buildId, mangle = true, beautify = false) {
  const code = stripReleaseLines(source)
  /** @type {import('terser').MinifyOptions} */
  const options = {
    module: true,
    toplevel: true,
    ecma: 2025,
    nameCache,
    mangle: mangle
      ? { toplevel: true, properties: { regex: /^_/, builtins: false } }
      : false,
    compress: {
      // A third pass is usually worthwhile for this bundle: the first two
      // passes expose additional constant-folding and dead-code opportunities.
      passes: 3,
      unsafe: true,
      unsafe_arrows: true,
      unsafe_comps: true,
      unsafe_math: true,
      unsafe_methods: true,
      unsafe_proto: true,
      unsafe_regexp: true,
      unsafe_undefined: true,
      drop_console: true,
      drop_debugger: true,
    },
    format: { beautify, comments: false },
  }
  try {
    const result = await minify(code, options)
    return result.code || ""
  } catch (err) {
    const error =
      /** @type {Error & {line?: number, col?: number, pos?: number}} */ (err)
    const line = error.line
    const col = error.col
    const lineNumber = typeof line === "number" ? line : 0
    const lines = code.split("\n")
    const nearby =
      lineNumber > 0
        ? lines
            .slice(Math.max(0, lineNumber - 2), lineNumber + 1)
            .map((value, index) => `${lineNumber - 1 + index}: ${value}`)
            .join(" | ")
        : "unavailable"
    const declarations = [
      ...code.matchAll(/\b(?:let|const|var|class|function)\s+(\w+)/g),
    ]
      .filter((match) => match[1] === error.message.match(/"([^"]+)"/)?.[1])
      .map((match) => match.index)
    log(
      `Build #${buildId}: Terser minification failed (${formatError(error)}; input ${hash(code)}; source ${Buffer.byteLength(source)}B; filtered ${Buffer.byteLength(code)}B; location ${lineNumber || "?"}:${col ?? "?"}; declarations at ${declarations.join(",") || "?"}; context ${nearby})`,
    )
    return ""
  }
}

/** @param {string} variant */
async function buildVariant(variant) {
  const dir = resolve("./dist", variant)
  mkdirSync(dir, { recursive: true })
  const [template, game, css] = await Promise.all([
    readFile("./index.html", "utf8"),
    readFile("./game.js", "utf8"),
    readFile("./game.css", "utf8"),
  ])
  const html = releaseHtml(template, variant)
  if (variant === "wavedash") {
    await writeFile(resolve(dir, "index.html"), html)
    await writeFile(resolve(dir, "game.js"), stripDevOnlyLines(game))
    await writeFile(resolve(dir, "game.css"), css)
    const wave = (await readFile("./wave.js", "utf8")).replace(
      /^import Wavedash from [^\n]+\n/m,
      "",
    )
    await writeFile(resolve(dir, "wave.js"), wave)
    return
  }
}

/** @returns {Promise<{template: string, game: string, css: string}>} */
async function readBuildInputs() {
  const [template, game, css] = await Promise.all([
    readFile("./index.html", "utf8"),
    readFile("./game.js", "utf8"),
    readFile("./game.css", "utf8"),
  ])
  return { template: releaseHtml(template, "terser"), game, css }
}

/** @returns {Promise<string>} */
async function readInitialBuildInput() {
  const files = await Promise.all(
    ["index.html", "game.js", "game.css", "wave.js", "manifest.js"].map(
      (file) => readFile(`./${file}`, "utf8"),
    ),
  )
  return hash(files.join("\0"))
}

/** @returns {Promise<string>} */
async function buildRawVariant() {
  const { template, game, css } = await readBuildInputs()
  return inlineGameAssets(template, css, stripExports(game))
}

/** @param {number} buildId @returns {Promise<string>} */
async function buildInlineVariant(buildId) {
  const { template, game, css } = await readBuildInputs()
  const readableGame = await minifyGame(game, buildId, false, true)
  if (!readableGame) throw new Error(`Readable Terser build failed`)
  return inlineGameAssets(template, css, readableGame)
}

/** @param {number} buildId @returns {Promise<string>} */
async function buildTerserVariant(buildId) {
  const { template, game, css } = await readBuildInputs()
  const minifiedGame = await minifyGame(game, buildId)
  if (!minifiedGame) throw new Error(`Terser minification failed`)
  return inlineGameAssets(template, css, minifiedGame)
}

/** @param {string} source */
function stripExports(source) {
  return source.replace(/^export (?!default\b)/gm, "")
}

/** @param {string} html @param {boolean} [minifyJS=true] */
function minifyReleaseHtml(html, minifyJS = true) {
  return minifyMarkup(html, {
    collapseWhitespace: true,
    minifyCSS: true,
    minifyJS,
    removeComments: true,
  })
}

/** @param {string} html @param {string} css @param {string} js */
function inlineGameAssets(html, css, js) {
  return html
    .replace(
      /<link rel="stylesheet" href="game\.css"\s*\/?>(?:<\/link>)?/i,
      `<style>${css}</style>`,
    )
    .replace(
      /<script type="module">([\s\S]*?)<\/script>/i,
      (_, script) =>
        `<script type="module">${js
          .replace(/\bexport default\s+function\b/, "function init")
          .replace(
            /\bexport default\s*\(([^)]*)\)\s*=>/,
            "function init($1)",
          )};${script.replace(
          /import\s+init\s+from\s*["']\.\/game\.js["'];?/,
          "",
        )}</script>`,
    )
}

/** @param {string} source @param {string} variant */
function releaseHtml(source, variant) {
  const dom = new JSDOM(source, { runScripts: "outside-only" })
  const document = dom.window.document
  if (variant !== "wavedash") {
    document.documentElement.removeAttribute("lang")
    document.querySelector("title")?.remove()
  }
  for (const element of document.querySelectorAll(
    '[data-build="site"], [data-build="dev"]',
  ))
    element.remove()
  if (variant === "wavedash") {
    for (const element of document.querySelectorAll('[data-build="game"]'))
      element.remove()
    for (const element of document.querySelectorAll(
      '[data-build="wavedash"][data-src]',
    )) {
      element.setAttribute("src", element.getAttribute("data-src") || "")
    }
  } else {
    for (const script of document.querySelectorAll(
      'script[data-build="game"]',
    ))
      script.textContent = ""
    for (const element of document.querySelectorAll('[data-build="wavedash"]'))
      element.remove()
    for (const script of document.scripts) {
      const relay = script.getAttribute("data-relay")
      if (relay && script.textContent) {
        script.textContent = script.textContent.replace(
          /new WebSocket\(`\/\/\$\{location\.host\}\/ws`\)/g,
          `new WebSocket(${JSON.stringify(relay)})`,
        )
      }
    }
  }
  for (const element of document.querySelectorAll(
    "[data-build], [data-src], [data-relay]",
  )) {
    element.removeAttribute("data-build")
    element.removeAttribute("data-src")
    element.removeAttribute("data-relay")
  }
  return dom.serialize()
}

async function writeDevelopmentPages() {
  const source = await readFile("./index.html", "utf8")
  const dom = new JSDOM(source, { runScripts: "outside-only" })
  const document = dom.window.document
  for (const element of document.querySelectorAll('[data-build="dev"]'))
    element.removeAttribute("hidden")
  developmentPages.set("index.html", dom.serialize())
  const waveDom = new JSDOM(dom.serialize(), { runScripts: "outside-only" })
  const waveDocument = waveDom.window.document
  for (const element of waveDocument.querySelectorAll('[data-build="game"]'))
    element.remove()
  for (const element of waveDocument.querySelectorAll(
    '[data-build="wavedash"][data-src]',
  ))
    element.setAttribute("src", element.getAttribute("data-src") || "")
  developmentPages.set("wavedash", waveDom.serialize())
}

/** @param {string} variant @param {string} date */
async function writeZip(variant, date) {
  const dir = resolve("./dist", variant)
  const zip = new JSZip()
  for (const file of readdirSync(dir))
    zip.file(file, await readFile(resolve(dir, file)))
  const content = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  })
  await writeFile(resolve("./dist", `${variant}-${date}.zip`), content)
  await recompressZip(resolve("./dist", `${variant}-${date}.zip`))
  return (await readFile(resolve("./dist", `${variant}-${date}.zip`))).length
}

/** @param {string} archivePath */
async function recompressZip(archivePath) {
  try {
    await execFile("advzip", [
      "--recompress",
      "--shrink-insane",
      "--iter",
      "1000",
      archivePath,
    ])
  } catch (err) {
    // Keep the JSZip result when advzip is unavailable or fails on a platform.
    log(`advzip unavailable: ${formatError(err)}`)
  }
}

/** @param {string} variant @param {string} html @param {string} date @param {string} label */
async function writeStage(variant, html, date, label) {
  const dir = resolve("./dist", variant)
  mkdirSync(dir, { recursive: true })
  await writeFile(resolve(dir, "index.html"), html)
  const zipSize = await writeZip(variant, date)
  logStage(label, zipSize, Buffer.byteLength(html))
}

/** @param {string} label @param {number} zipSize @param {number} htmlSize */
function logStage(label, zipSize, htmlSize) {
  log(
    `${label.padEnd(10)} ${String(zipSize).padStart(5)} ${String(htmlSize).padStart(10)}`,
  )
}

/** @param {string} date */
async function buildRoadrollerVariant(date) {
  const dir = resolve("./dist/roadroller")
  mkdirSync(dir, { recursive: true })
  const input = await writeRoadrollerInput(resolve("./dist/closure"))
  queueRoadroller(input, date)
}

/**
 * Run Closure Compiler on the inlined Terser JavaScript before minifying the
 * complete HTML, so Roadroller receives the final HTML-minified output.
 */
/** @param {string} source @returns {Promise<string>} */
async function buildClosureVariant(source) {
  const match = source.match(/<script type="module">([\s\S]*?)<\/script>/i)
  if (!match) throw new Error(`Terser build has no module script`)
  const script = match[1]
  if (script === undefined) throw new Error(`Terser module script is empty`)

  const closureOutput = await compileClosureScript(script)
  const output = await minifyClosureScript(closureOutput)
  const placeholder = "__closure_script_placeholder__"
  return minifyReleaseHtml(
    source.replace(match[0], `<script>${placeholder}</script>`),
    false,
  ).then((value) =>
    value.replace(
      `<script>${placeholder}</script>`,
      () => `<script>${output}</script>`,
    ),
  )
}

/** @param {string} source @returns {Promise<string>} */
async function minifyClosureScript(source) {
  const result = await minify(source, {
    ecma: 2025,
    compress: true,
    mangle: true,
    format: { comments: false },
  })
  const output = result.code || ""
  if (!output) throw new Error(`Terser produced empty Closure output`)
  return output
}

/** @param {string} source @returns {Promise<string>} */
function compileClosureScript(source) {
  return (async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "js13k-closure-"))
    const inputPath = join(tempDir, "input.js")
    await writeFile(inputPath, source)
    try {
      return await new Promise((resolveOutput, reject) => {
        new compiler({
          compilation_level: "ADVANCED",
          env: "BROWSER",
          externs: [resolve("./closure-externs.js")],
          language_in: "ECMASCRIPT_NEXT",
          language_out: "ECMASCRIPT_NEXT",
          js: inputPath,
          warning_level: "QUIET",
        }).run((exitCode, stdOut, stdErr) => {
          if (exitCode !== 0) {
            reject(new Error(stdErr || `exit code ${exitCode}`))
            return
          }
          resolveOutput(stdOut)
        })
      })
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })()
}

server.listen(port, host, onListen)
void buildSource().catch((err) => log(`Initial build failed: ${err}`))

function onListen() {
  const info = server.address()
  if (info && typeof info !== "string") {
    const { address, port } = info
    log(`Server is running on http://${address}:${port}`)
  }
}

/** @param {string} message */
function log(message) {
  const now = new Date().toISOString().slice(11, 23)
  console.log(`${now} ${message}`)
}

/** @param {unknown} error */
function formatError(error) {
  if (error instanceof Error) {
    return error.stack || `${error.name}: ${error.message}`
  }
  return String(error)
}

/** @param {string} value */
function hash(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12)
}
