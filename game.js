// Only constants, no global state
var PI = Math.PI
var TAU = PI * 2
var TURBO_MAX_ENERGY = 3
var TURBO_DRAIN_PER_SECOND = 2
var TURBO_RECHARGE_PER_SECOND = 1
var PLAYER_RESPAWN_DELAY = 1000
var ACTIONS = ["up", "left", "down", "right", "action"]
var AUDIO_SINE = /** @type {const} */ ("sine")
var AUDIO_SQUARE = /** @type {const} */ ("square")
var AUDIO_TRIANGLE = /** @type {const} */ ("triangle")
var AUDIO_SAWTOOTH = /** @type {const} */ ("sawtooth")
var COLOR_RED = /** @readonly} */ "oklch(0.65 0.22 25)"
var COLOR_ORANGE = /** @readonly} */ "oklch(0.72 0.19 50)"
var COLOR_YELLOW = /** @readonly} */ "oklch(0.88 0.18 95)"
var COLOR_GREEN = /** @readonly} */ "oklch(0.74 0.18 150)"
var COLOR_CYAN = /** @readonly} */ "oklch(0.75 0.15 205)"
var COLOR_BLUE = /** @readonly} */ "oklch(0.68 0.19 255)"
var COLOR_PURPLE = /** @readonly} */ "oklch(0.70 0.20 305)"
var COLOR_FLOOR = /** @readonly} */ "#4b5563"
var COLOR_TWO = /** @readonly} */ "#374151"
var COLOR_THREE = /** @readonly} */ "#1f2937"
var COLOR_DEEP = /** @readonly} */ "#030712"
var COLOR_FAINT = /** @readonly} */ "#0004"
// prettier-ignore
var RAINBOW = [COLOR_RED, COLOR_ORANGE, COLOR_YELLOW, COLOR_GREEN, COLOR_CYAN, COLOR_BLUE, COLOR_PURPLE]

export class GameEntity {
  /** @type {GamePos} */
  _pos = { x: 0, y: 0 }
  /** @type {GamePos | null} */
  _oldPos = null
  _radius = 0
  _speed = 0
  _velocity = { x: 0, y: 0 }
  /** @type {GameVelocity} */
  _dir = { x: 1, y: 0 }
  _airHeight = 0
  _oldAirHeight = 0
  // Angles are in radians, matching CanvasRenderingContext2D.rotate().
  _angle = 0
  _oldAngle = 0
  _renderAngle = 0
  _inputIdleTime = 0
  _free = true
  // This is a render-only swim sway. It does not alter collision or network
  // positions, so fish can look alive without becoming harder to control.
  _swimWaveAmplitude = 1.1
  _swimWaveSpeed = 0.0035
}

export class GamePlayer extends GameEntity {
  _index = 0
  _opacity = 1
  /** @override */
  _radius = 5
  /** @override */
  _speed = 3
  _energy = 0
  _turboEnergy = TURBO_MAX_ENERGY
  _turboBonus = 0
  _score = 0 // Player _score
  _color = "ORANGE" // Will be set based on index
  _isBoss = false
  _isThrusting = false
  _isAngler = false
  _isFriend = false
  _isDarkfriend = false
  _isFound = false
  _isHelped = false
  _isDistressed = false
  _isGathered = false
  _homeSea = -1
  _followingPlayer = -1
  _goingHome = false
  /** @type {GamePos} */
  _friendTarget = { x: 0, y: 0 }
  _isHunting = false
  _lampTimer = 0
  _rumbl = { _duration: 0, _ready: false }
  /** @type {GamePos} */
  _spawnPoint = { x: 0, y: 0 }
  _respawnTimer = 0
  _isDead = false
  _isImpaled = false
  _hasLamp = false
  _inAir = false
  _airVelocity = 0
  _airHorizontalVelocity = 0
  /** @type {GamePos | null} */
  _airTarget = null
  _airFlightTicks = 0
  _isNarwhal = false
  _hasHorn = false
}

export class GameBackgroundPlayer extends GamePlayer {
  _remoteId = ""
  /** @type {GamePos} */
  _nextPos = { x: 0, y: 0 }
}

export class GameNarwhalBoss extends GamePlayer {
  /** @override */
  _isBoss = true
  /** @override */
  _isNarwhal = true
  /** @override */
  _isThrusting = false
  /** @override */
  _radius = 12.6
  /** @override */
  _speed = 0.35
  /** @override */
  _color = "#f8fafc"
  /** @type {GamePlayer[]} */
  _impaledPlayers = []
  _isLaunching = false
}

export class GameAnglerFish extends GamePlayer {
  /** @override */
  _isAngler = true
  /** @override */
  _radius = 10
  /** @override */
  _speed = 0.18
  /** @override */
  _color = "#050505"
  /** @type {GamePos} */
  _nextPos = { x: 100, y: 335 }
  _wasInDeep = true
}

export class GameItem extends GameEntity {
  /** @override */
  _radius = 3
  _color = "yellow"
  _isLamp = false
  _isStar = false
}

export class GameParticle extends GameEntity {
  /** @override */
  _radius = 1
  /** @override */
  _speed = 2
  /** @override */
  _velocity = { x: 0, y: 0 }
  _color = "white"
  _lifetime = 0
  _maxLifetime = 500 // 500ms _lifetime
  _isSpeedLine = false
  _trailAngle = 0
  _trailLength = 1
}

export class GameModel {
  _simulationTime = 0
  _score = 0
  _eaten = 0
  _pierced = 0
  _stars = 0
  _wasDeep = false
  _highScore = 0
  _highScoreKey = location.pathname.slice(1)
  _wasSeparated = false
  _bottomReached = false
  _frameTime = 0
  _interval = 50
  _speed = 0
  _size = 100
  _worldWidth = 700
  _worldHeight = 350
  _camera = { x: 50, y: 50 }
  _oldCamera = { x: 50, y: 50 }
  _renderCamera = { x: 50, y: 50 }
  _cameraTarget = { x: 50, y: 50 }
  _splitCameras = [
    { x: 50, y: 50 },
    { x: 50, y: 50 },
  ]
  _oldSplitCameras = [
    { x: 50, y: 50 },
    { x: 50, y: 50 },
  ]
  _splitViewActive = false
  _splitMidpoint = { x: 50, y: 50 }
  _narwhalSeen = false
  _deepReached = false
  _tunnelOpened = false
  _player2Enabled = false
  /** @type {GameInput[]} */
  _mobileInputs = [{ _action: false }, { _action: false }]
  /** @type {[{id: number, start: GamePos, current: GamePos} | null, {id: number, start: GamePos, current: GamePos} | null]} */
  _mobilePointers = [null, null]
  /** @type {[number | null, number | null]} */
  _mobileTurboPointers = [null, null]
  _gearAngles = [0, 0]
  _oldGearAngles = [0, 0]
  _gearRenderAngles = [0, 0]
  _gearInputTypes = ["keyboard", "keyboard"]
  /** @type {(GamePos | undefined)[]} */
  _gearMovement = [undefined, undefined]
  /** @type {GamePlayer[]} */
  _players = []
  /** @type {GameBackgroundPlayer[]} */
  _backgroundPlayers = []
  /** @type {GamePlayer[]} */
  _friends = []
  _friendsComplete = false
  /** @type {GameNarwhalBoss[]} */
  _bosses = []
  /** @type {GameAnglerFish[]} */
  _deepNpcs = []
  /** @type {WebSocket | undefined} */
  _ws
  /** @type {GameAudio | undefined} */
  _audio
  _clientId = ""
  _nextBroadcast = 1000
  /** @type {GamePos[]} */
  _lastBroadcastPos = []
  /** @type {GameItem[]} */
  _items = []
  /** @type {GameParticle[]} */
  _particles = []

  constructor() {
    this._speed = this._interval / 100
  }
}

export class GameView {
  _offset = { x: 0, y: 0 }
  _scale = 0
  _size = 0
}

class GameAudio {
  /** @type {AudioContext | null} */
  _context = null
  _musicTimer = 0
  _musicStep = 0
  _lastSwim = 0
  _lastNearAngler = 0
  _theme = "surface"
  _paused = false
  _enabled = true
}

/** @param {GameModel} model */
function gameEventScore(model) {
  const points = Number(
    (100 * Math.pow(10000 / Math.max(1, model._simulationTime), 0.3)).toFixed(),
  )
  model._score += points
  model._highScore = Math.max(model._highScore, model._score)
  try {
    localStorage.setItem(model._highScoreKey, String(model._highScore))
  } catch {
    // Storage can be unavailable in private browsing.
  }
  wavedashScore(model._score)
}

/** @param {GameModel} model */
function gameEventNarwhalSeen(model) {
  gameEventScore(model)
  wavedashEvent("BEWARE")
  if (model._audio) playAudioNear(model._audio)
}

/** @param {GameModel} model */
function gameEventPlayerImpaled(model) {
  gameEventScore(model)
  wavedashEvent("FLUNG")
  if (model._audio) playAudioImpale(model._audio)
}

/** @param {GameModel} model */
function gameEventHunted(model) {
  gameEventScore(model)
  wavedashEvent("HUNTED")
  if (model._audio) playAudioImpale(model._audio)
}

/** @param {GameModel} model */
function gameEventFriendRescued(model) {
  gameEventScore(model)
  wavedashEvent("FRIEND")
  if (model._audio) playAudioPickup(model._audio)
}

/** @param {GameModel} model */
function gameEventSchoolComplete(model) {
  gameEventScore(model)
  wavedashEvent("SCHOOL")
  if (model._audio) playAudioWin(model._audio)
}

/** @param {GameModel} model */
function gameEventPlayerPromoted(model) {
  gameEventScore(model)
  wavedashEvent("PROMOTED")
  if (model._audio) playAudioLaunch(model._audio)
}

/** @param {GameModel} model */
function gameEventNarwhals(model) {
  gameEventScore(model)
  wavedashEvent("NARWHALS")
  if (model._audio) playAudioWin(model._audio)
}

/** @param {GameModel} model */
function gameEventPlayerDigested(model) {
  gameEventScore(model)
  wavedashEvent("DIGESTED")
}

/** @param {GameModel} model */
function gameEventPlayerToothless(model) {
  gameEventScore(model)
  wavedashEvent("TOOTHLESS")
}

/** @param {GameModel} model */
function gameEventLoss(model) {
  gameEventScore(model)
  wavedashEvent("LOSS")
}

/** @param {GameModel} model */
function gameEventPlayerAlone(model) {
  gameEventScore(model)
  wavedashEvent("ALONE")
}

/** @param {GameModel} model */
function gameEventPlayersTogether(model) {
  gameEventScore(model)
  wavedashEvent("TOGETHER")
}

/** @param {GameModel} model */
function gameEventDeepReached(model) {
  gameEventScore(model)
  wavedashEvent("DEEP")
}

/** @param {GameModel} model */
function gameEventPlayerFlew(model) {
  gameEventScore(model)
  wavedashEvent("FLY")
  if (model._audio) playAudioLaunch(model._audio)
}

// Everything can be exported for testing/debugging
// All exports are stripped on build

const KEYS = [
  "ArrowUp",
  "ArrowLeft",
  "ArrowDown",
  "ArrowRight",
  "Space",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyE",
]
const TURBO_KEYS = ["Space", "KeyE"]

/**
 * @param {WebSocket | undefined} [ws]
 * @param {CanvasRenderingContext2D} ctx
 */
export function init(
  ws,
  ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d")),
) {
  const keyboard = initKeyboard()
  const model = new GameModel()
  try {
    model._highScore = Number(localStorage.getItem(model._highScoreKey)) || 0
  } catch {
    // Storage can be unavailable in private browsing.
  }
  model._ws = ws
  model._audio = new GameAudio()
  window.MODEL = model // DEV ONLY
  player2.hidden = false
  player2.textContent = "2P"
  restart?.addEventListener("pointerdown", (event) => {
    event.preventDefault()
    window.location.reload()
  })
  const soundButton = sound
  soundButton?.addEventListener("pointerdown", (event) => {
    event.preventDefault()
    const audio = model._audio
    if (!audio) return
    // Toggling must not depend on whether Web Audio has been initialized.
    // The first press is a user gesture, but it should still be allowed to
    // mute the default-on audio.
    const enabled = toggleAudio(audio)
    soundButton.textContent = enabled ? "🔊" : "🔇"
  })
  player2?.addEventListener("pointerdown", (event) => {
    event.preventDefault()
    model._player2Enabled = !model._player2Enabled
    if (model._player2Enabled) createLocalPlayer(model, 1)
    else discardPlayer(model, 1)
    player2.hidden = false
    player2.textContent = model._player2Enabled ? "1P" : "2P"
  })
  devListenDeep() // DEV ONLY
  devListenGather(model) // DEV ONLY
  devProxyColorCssVars() // DEV ONLY
  createLocalPlayer(model, 0)
  for (let i = 0; i < RAINBOW.length; i++) {
    const friend = new GamePlayer()
    friend._index = i + 10
    friend._isFriend = true
    friend._homeSea = i
    friend._free = false
    friend._color = /** @type {string} */ (RAINBOW[i])
    // Each friend starts three seas away from its matching home sea.
    const wrongSea = (i + 3) % RAINBOW.length
    friend._pos = {
      x: wrongSea * model._size + 15 + Math.random() * 70,
      y: 15 + Math.random() * 70,
    }
    friend._spawnPoint = { ...friend._pos }
    friend._friendTarget = {
      x: wrongSea * model._size + 15 + Math.random() * 70,
      y: 15 + Math.random() * 70,
    }
    friend._radius = 4
    friend._speed = 1.8
    model._friends.push(friend)
  }
  spawnDarkfriend(model, 4)

  const angler = new GameAnglerFish()
  angler._isHunting = false
  angler._isHunting = new URLSearchParams(location.search).has("deep") // DEV ONLY
  angler._free = !angler._isHunting
  angler._hasLamp = !angler._isHunting
  angler._pos = { x: 100, y: 335 }
  angler._nextPos = { x: 30, y: 340 }
  model._deepNpcs.push(angler)

  const narwhal = new GameNarwhalBoss()
  narwhal._free = !angler._isHunting
  narwhal._pos = { x: 80, y: 50 }
  narwhal._spawnPoint = { ...narwhal._pos }
  model._bosses.push(narwhal)

  // Create particle pool for explosions
  for (let i = 0; i < 100; i++) {
    const particle = new GameParticle()
    model._particles.push(particle)
  }

  const view = new GameView()
  resize(model, view, ctx)
  listen(model, view, ctx, keyboard)
  animate(model, view, ctx, keyboard)
  if (ws) {
    /** @type {Map<string, GameBackgroundPlayer[]>} */
    const backgroundPlayers = new Map()
    /**
     * @param {string} remoteId
     * @param {number} index
     */
    const getBackgroundPlayer = (remoteId, index) => {
      if (!remoteId || !Number.isInteger(index) || index < 0) return
      let remotes = backgroundPlayers.get(remoteId)
      if (!remotes) {
        remotes = []
        backgroundPlayers.set(remoteId, remotes)
      }
      while (remotes.length <= index) {
        const remote = new GameBackgroundPlayer()
        remote._remoteId = `${remoteId}:${remotes.length}`
        remote._index = remotes.length
        remote._free = false
        remote._radius = 3.25
        remote._opacity = 0.35
        remote._color = "white"
        remote._pos = { x: model._size / 2, y: model._size / 2 }
        remote._nextPos = { ...remote._pos }
        remotes.push(remote)
        model._backgroundPlayers.push(remote)
      }
      return remotes[index]
    }
    ws.onerror = (event) => {
      console.error("WebSocket error:", event)
    }
    ws.onopen = (_) => {}
    // js13k 2026 Online Multiplayer Game Relay
    // Offline-first
    // Your game must work offline (e.g. be playable by a single player). Online features must be optional.
    // To make your job a tiny bit easier, our relay will — besides relaying
    // your messages to all connected clients — also send you the IDs of all
    // connecting and disconnecting clients.
    // Say hello
    // ws.onopen = _ => { ws.send('hello!') }
    // Listen to others
    // ws.onmessage = event => { console.log('message', event.data) }
    // Instead of broadcasting, you can also send messages directly to another
    // client by @-addressing your message to their ID, like so:
    // ws.send(`@{ clientId }|The message to send`)
    // Other clients will be oblivious to the message and its payload, which
    // can be useful to conserve resources or simplify certain communication
    // flows.
    // This will also work if what you send() is encoded in an ArrayBuffer
    // instead of a string, so long as you use UTF-8 for the @-addressing
    // prefix.
    // Game rooms are ephemeral and disappear entirely once no more clients are
    // connected to them. Our relay does not persist any data.
    // Need to be careful not to spam with too many messages
    ws.onmessage = (event) => {
      const msg = event.data
      switch (msg[0]) {
        case "@":
          model._clientId = msg.slice(1)
          break

        case "+":
          {
            const remoteId = msg.slice(1)
            for (let i = 0; i < 2; i++) {
              getBackgroundPlayer(remoteId, i)
            }
          }
          break

        case "-":
          {
            const remotes = backgroundPlayers.get(msg.slice(1))
            if (remotes) {
              for (const remote of remotes) remote._free = true
              backgroundPlayers.delete(msg.slice(1))
            }
          }
          break

        default: {
          const [remoteId, indexText, xText, yText] = msg.split(":")
          const index = Number(indexText)
          const x = Number(xText)
          const y = Number(yText)
          const remote = remoteId
            ? getBackgroundPlayer(remoteId, index)
            : undefined
          if (remote && Number.isFinite(x) && Number.isFinite(y)) {
            remote._nextPos = { x, y }
          }
        }
      }
    }
  }
}
// Local development and GitHub Pages set this false through the bootstrap;
// release stripping removes that assignment and runs the relay init.
// eslint-disable-next-line no-useless-assignment
var initNow = true
initNow = false // DEV ONLY
// @ts-ignore
if (initNow)
  init(new WebSocket("wss://relay.js13kgames.com/narwhals-of-the-rainbow-sea"))

function devListenDeep() {
  deep?.addEventListener("pointerdown", (event) => {
    event.preventDefault()
    const url = new URL(location.href)
    if (url.searchParams.has("deep")) url.searchParams.delete("deep")
    else url.searchParams.set("deep", "1")
    location.href = url.toString()
  })
}

/** @param {GameModel} model */
function devListenGather(model) {
  const gatherButton = typeof gather === "undefined" ? undefined : gather
  gatherButton?.addEventListener(
    "pointerdown",
    /** @param {PointerEvent} event */ (event) => {
      event.preventDefault()
      gatherAllFish(model)
    },
  )
}

function devProxyColorCssVars() {
  const root = document.documentElement
  /** @type {Map<string, string>} */
  const colorCache = new Map()

  /** @param {`--${string}`} cssVar */
  function getColor(cssVar) {
    let cssValue = colorCache.get(cssVar)
    if (cssValue) return cssValue

    cssValue = getComputedStyle(document.documentElement)
      .getPropertyValue(cssVar)
      .trim()
    colorCache.set(cssVar, cssValue)
    return cssValue
  }

  /** @param {string} initialValue @param {string} cssVarName */
  function createColorProxy(initialValue, cssVarName) {
    root.style.setProperty(`--${cssVarName}`, initialValue)
    /** @type {{ toString(): string, [prop: string | symbol]: any }} */
    const target = {
      toString() {
        return getColor(`--${cssVarName}`)
      },
    }

    return new Proxy(target, {
      get(tar, prop) {
        if (prop === "toString" || prop === Symbol.toPrimitive)
          return tar.toString
        return tar[prop]
      },
    })
  }

  const cssVarNames = /** @type {const} */ ([
    "--color-red",
    "--color-orange",
    "--color-yellow",
    "--color-green",
    "--color-cyan",
    "--color-blue",
    "--color-purple",
  ])
  function createRainbowProxy() {
    return new Proxy(/** @type {{ [prop: string | symbol]: any }} */ ({}), {
      get(tar, prop) {
        if (prop === "length") return 7
        if (typeof prop === "string" && !isNaN(Number(prop))) {
          const index = Number(prop)
          if (index >= 0 && index < 7) {
            const cssVarName = cssVarNames[index]
            if (cssVarName) return getColor(cssVarName)
          }
        }
        return tar[prop]
      },
    })
  }

  const observer = new MutationObserver(() => {
    colorCache.clear()
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["style"],
  })
  COLOR_RED = /** @type {any} */ (createColorProxy(COLOR_RED, "color-red"))
  COLOR_ORANGE = /** @type {any} */ (
    createColorProxy(COLOR_ORANGE, "color-orange")
  )
  COLOR_YELLOW = /** @type {any} */ (
    createColorProxy(COLOR_YELLOW, "color-yellow")
  )
  COLOR_GREEN = /** @type {any} */ (
    createColorProxy(COLOR_GREEN, "color-green")
  )
  COLOR_CYAN = /** @type {any} */ (createColorProxy(COLOR_CYAN, "color-cyan"))
  COLOR_BLUE = /** @type {any} */ (createColorProxy(COLOR_BLUE, "color-blue"))
  COLOR_PURPLE = /** @type {any} */ (
    createColorProxy(COLOR_PURPLE, "color-purple")
  )
  RAINBOW = /** @type {any} */ (createRainbowProxy())
}

/** @param {GameModel} model Teleport every active fish near player 1. */
function gatherAllFish(model) {
  const player = model._players[0]
  if (!player || player._free) return
  const fish = model._friends.filter(
    (friend) => !friend._free && friend._isFriend,
  )
  for (const [index, friend] of fish.entries()) {
    const angle = (index / Math.max(1, fish.length)) * TAU
    // Stay close, but just outside updateFriends' <9-unit auto-gather range
    // so the player can manually collect the fish one at a time.
    const distance = 12
    friend._pos = {
      x: wrapPosition(
        player._pos.x + Math.cos(angle) * distance,
        model._worldWidth,
      ),
      y: Math.max(
        0,
        Math.min(model._size, player._pos.y + Math.sin(angle) * distance),
      ),
    }
    friend._oldPos = null
    friend._friendTarget = { ...friend._pos }
    friend._isFound = false
    friend._isGathered = false
    friend._isDistressed = false
    friend._goingHome = false
    friend._isHelped = false
    friend._followingPlayer = -1
    friend._velocity = { x: 0, y: 0 }
  }
}

/**
 * @param {GameModel} model
 * @param {GameView} view
 * @param {CanvasRenderingContext2D} ctx
 * @param {GameKeyboard} keyboard
 */
export function listen(model, view, ctx, keyboard) {
  const resizeView = () =>
    resize(
      model,
      view,
      ctx,
      devicePixelRatio,
      globalThis.visualViewport?.width ?? innerWidth,
      globalThis.visualViewport?.height ?? innerHeight,
    )
  addEventListener("resize", resizeView)
  addEventListener("orientationchange", () => {
    requestAnimationFrame(() => requestAnimationFrame(resizeView))
  })
  globalThis.visualViewport?.addEventListener("resize", resizeView)
  initMobileControls(model, view, ctx)
  /** @param {Event} event */
  const unlockAudioOnInput = (event) => {
    // The button handler may deliberately mute the game. Do not let this
    // bubbling unlock listener immediately turn it back on.
    if (event.target === sound) return
    if (model._audio) unlockAudio(model._audio)
  }
  addEventListener("pointerdown", unlockAudioOnInput)
  // Older iOS Safari versions do not consistently expose touch input as a
  // pointer event, so keep the native gesture unlock path as well.
  addEventListener("touchstart", unlockAudioOnInput, { passive: true })
  addEventListener("keydown", (e) => {
    if (model._audio) unlockAudio(model._audio)
    keydown(e, keyboard)
  })
  addEventListener("keyup", (e) => keyup(e, keyboard))
  addEventListener("blur", () => keyboard.fill(false))
}

/**
 * @param {GameView} view
 * @param {HTMLCanvasElement} canvas
 * @returns {{controls: [GamePos, GamePos], turboCenters: [GamePos, GamePos], radius: number, innerRadius: number, cogRadius: number, gearModule: number, gearSnapRadius: number}}
 */
function getMobileControlLayout(view, canvas) {
  const radius = view._size * 0.16
  // Use one LEGO-like module for both profiles. The Z16 cog's pitch radius is
  // therefore exactly 16/24 of the fixed Z24 internal gear's pitch radius.
  // Their pitch-circle difference is the only engaged travel position.
  const gearPitchRadius = radius * 0.7
  const gearModule = (gearPitchRadius * 2) / 24
  const cogPitchRadius = (gearModule * 16) / 2
  const cogRadius = cogPitchRadius + gearModule * 0.55
  const innerRadius = radius * 0.86
  const gearSnapRadius = gearPitchRadius - cogPitchRadius
  const margin = 0
  const y = canvas.height - radius - margin
  /** @type {[GamePos, GamePos]} */
  const controls = [
    { x: radius + margin, y },
    { x: canvas.width - radius - margin, y },
  ]
  const turboCenters = controls.map((center, player) => ({
    x: center.x + (player ? -1 : 1) * radius * 1.65,
    y: center.y + radius * 0.725,
  }))
  return /** @type {{controls: [GamePos, GamePos], turboCenters: [GamePos, GamePos], radius: number, innerRadius: number, cogRadius: number, gearModule: number, gearSnapRadius: number}} */ ({
    controls,
    turboCenters,
    radius,
    innerRadius,
    cogRadius,
    gearModule,
    gearSnapRadius,
  })
}

/** @param {GameModel} model @param {GameView} view @param {CanvasRenderingContext2D} ctx */
function initMobileControls(model, view, ctx) {
  const canvas = ctx.canvas
  /** @param {PointerEvent} event */
  const point = (event) => {
    const rect = canvas.getBoundingClientRect()
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    }
  }
  /** @param {GamePos} a @param {GamePos} b */
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
  /** @param {number} player @param {number} pointerId */
  const resetPointer = (player, pointerId) => {
    if (model._mobilePointers[player]?.id !== pointerId) return
    model._mobilePointers[player] = null
    const input = model._mobileInputs[player]
    if (input) input._velocity = undefined
  }
  /** @param {number} player @param {number} pointerId */
  const resetTurbo = (player, pointerId) => {
    if (model._mobileTurboPointers[player] !== pointerId) return
    model._mobileTurboPointers[player] = null
    const turboActive = model._mobileTurboPointers.some(
      (activePointer) => activePointer !== null,
    )
    for (const input of model._mobileInputs) input._turbo = turboActive
  }

  canvas.addEventListener(
    "pointerdown",
    /** @param {PointerEvent} event */ (event) => {
      event.preventDefault()
      const position = point(event)
      const layout = getMobileControlLayout(view, canvas)
      for (let player = 0; player < 2; player++) {
        const center = layout.controls[player]
        const turboCenter = layout.turboCenters[player]
        if (!center || !turboCenter) continue
        if (
          distance(position, turboCenter) <= layout.radius * 0.55 &&
          model._mobileTurboPointers[player] === null
        ) {
          model._mobileTurboPointers[player] = event.pointerId
          for (const input of model._mobileInputs) input._turbo = true
          canvas.setPointerCapture?.(event.pointerId)
          return
        }
        if (
          distance(position, center) <= layout.innerRadius &&
          model._mobilePointers[player] === null
        ) {
          model._mobilePointers[player] = {
            id: event.pointerId,
            start: position,
            current: position,
          }
          canvas.setPointerCapture?.(event.pointerId)
          return
        }
      }
    },
  )
  canvas.addEventListener(
    "pointermove",
    /** @param {PointerEvent} event */ (event) => {
      const position = point(event)
      for (let player = 0; player < 2; player++) {
        const pointer = model._mobilePointers[player]
        if (!pointer || pointer.id !== event.pointerId) continue
        event.preventDefault()
        pointer.current = position
        const dx = position.x - pointer.start.x
        const dy = position.y - pointer.start.y
        const length = Math.hypot(dx, dy)
        const input = model._mobileInputs[player]
        if (input)
          input._velocity =
            length > 0 ? { x: dx / length, y: dy / length } : undefined
      }
    },
  )
  /** @param {PointerEvent} event */
  const endPointer = (event) => {
    resetPointer(0, event.pointerId)
    resetPointer(1, event.pointerId)
    resetTurbo(0, event.pointerId)
    resetTurbo(1, event.pointerId)
  }
  canvas.addEventListener("pointerup", endPointer)
  canvas.addEventListener("pointercancel", endPointer)
  addEventListener("blur", () => {
    model._mobilePointers = [null, null]
    model._mobileTurboPointers = [null, null]
    for (const input of model._mobileInputs) {
      input._velocity = undefined
      input._turbo = false
    }
  })
}

/** @param {GameModel} model @param {number} index */
function discardPlayer(model, index) {
  const player = model._players[index]
  if (!player) return
  player._free = true
  player._velocity = { x: 0, y: 0 }
  player._inputIdleTime = 0
}

/** @param {GameInput | undefined} input @returns {boolean} */
function hasPlayerInput(input) {
  return (
    input?._action ||
    input?._turbo ||
    (input?._velocity != null &&
      (input._velocity.x !== 0 || input._velocity.y !== 0))
  )
}

/**
 * Update a player's turbo meter. Holding turbo without moving does not spend
 * energy, but it also does not recharge until the button is released.
 *
 * @param {GamePlayer} player
 * @param {boolean} active
 * @param {boolean} requested
 * @param {number} interval
 */
function updateTurboEnergy(player, active, requested, interval) {
  const seconds = interval / 1000
  const max = TURBO_MAX_ENERGY + player._turboBonus
  if (active) {
    player._turboEnergy = Math.max(
      0,
      player._turboEnergy - TURBO_DRAIN_PER_SECOND * seconds,
    )
  } else if (!requested) {
    player._turboEnergy = Math.min(
      max,
      player._turboEnergy + TURBO_RECHARGE_PER_SECOND * seconds,
    )
  }
}

/** @param {GameModel} model @param {GamePlayer} player @param {GameVelocity} velocity @param {boolean} turbo */
function createSwimTrail(model, player, velocity, turbo) {
  if (!turbo) return
  const distance = Math.hypot(velocity.x, velocity.y)
  if (distance === 0) return
  const direction = { x: velocity.x / distance, y: velocity.y / distance }
  const perpendicular = { x: -direction.y, y: direction.x }
  const count = 6
  for (let i = 0; i < count; i++) {
    const particle = getFree(model._particles)
    if (!particle) return
    const behind = player._radius + 1 + Math.random() * 4
    const spread = (Math.random() - 0.5) * player._radius * 0.9
    particle._pos = {
      x: wrapPosition(
        player._pos.x - direction.x * behind + perpendicular.x * spread,
        model._worldWidth,
      ),
      y: clamp(
        player._pos.y - direction.y * behind + perpendicular.y * spread,
        0,
        model._worldHeight,
      ),
    }
    particle._oldPos = null
    particle._velocity = {
      x: -direction.x * 0.08,
      y: -direction.y * 0.08,
    }
    particle._trailAngle = Math.atan2(direction.y, direction.x)
    particle._trailLength = 0.7 + Math.random() * 0.6
    particle._isSpeedLine = true
    particle._radius = 0.16 + Math.random() * 0.12
    particle._color = "white"
    particle._lifetime = 0
    particle._maxLifetime = 180 + Math.random() * 100
  }
}

/**
 * @param {GameModel} model
 * @param {GameView} view
 * @param {CanvasRenderingContext2D} ctx
 * @param {GameKeyboard} keyboard
 */
export function animate(
  model,
  view,
  ctx,
  keyboard,
  loop = requestAnimationFrame,
) {
  let accumulator = 0
  let lastTime = performance.now()
  // Some browsers keep document.hasFocus() true for a visible page behind
  // another native window. Track the window focus event as well so the game
  // simulation cannot continue in that case.
  let windowFocused = document.hasFocus()
  addEventListener("blur", () => {
    windowFocused = false
    accumulator = 0
    model._frameTime = 0
    if (model._audio) pauseAudio(model._audio)
  })
  addEventListener("focus", () => {
    windowFocused = true
    accumulator = 0
    model._frameTime = 0
    lastTime = performance.now()
    if (model._audio) resumeAudio(model._audio)
  })

  loop(function callback(timeStamp) {
    const _frameTime = timeStamp - lastTime
    lastTime = timeStamp

    if (!windowFocused || !document.hasFocus()) {
      accumulator = 0
      model._frameTime = 0
      draw(model, view, ctx)
      loop(callback)
      return
    }

    accumulator += _frameTime

    model._frameTime = (accumulator % model._interval) / model._interval
    while (accumulator >= model._interval) {
      model._simulationTime += model._interval
      update(
        model,
        getInputs(
          keyboard,
          undefined,
          model._mobileInputs,
          model._player2Enabled,
        ),
      )
      updateFriends(model)
      updateNarwhals(model)
      updateDeepNpcs(model)
      updateLampInteractions(model)
      updateCamera(model)
      if (model._audio) setAudioTheme(model._audio, getMusicTheme(model))
      if (
        document.hasFocus() &&
        model._ws?.readyState === 1 &&
        model._clientId &&
        model._simulationTime >= model._nextBroadcast
      ) {
        for (let i = 0; i < 2; i++) {
          const player = model._players[i]
          const lastPos = model._lastBroadcastPos[i]
          if (
            player &&
            (!lastPos ||
              player._pos.x !== lastPos.x ||
              player._pos.y !== lastPos.y)
          ) {
            model._ws.send(
              `${model._clientId}:${i}:${player._pos.x.toFixed(2)}:${player._pos.y.toFixed(2)}`,
            )
            model._lastBroadcastPos[i] = { ...player._pos }
          }
        }
        model._nextBroadcast += 1000
      }
      accumulator -= model._interval
      for (let i = 0; i < model._players.length; i++) {
        const player = model._players[i]
        if (player && player._rumbl._duration > 0)
          player._rumbl._duration = Math.max(
            0,
            player._rumbl._duration - model._interval,
          )
        if (player && player._rumbl._ready) {
          player._rumbl._ready = false
          const gamepad = navigator.getGamepads()[i]
          if (gamepad?.connected) {
            console.log("rumbling", gamepad)
            gamepad?.vibrationActuator?.playEffect("dual-rumble", {
              startDelay: 0,
              duration: 80,
              weakMagnitude: 1,
              strongMagnitude: 1,
            })
          }
        }
      }
    }
    draw(model, view, ctx)
    loop(callback)
  })
}

/**
 * @param {KeyboardEvent} event
 * @param {GameKeyboard} keyboard
 */
export function keydown(event, keyboard) {
  const index = KEYS.indexOf(event.code)
  if (index === -1) return
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  event.preventDefault()
  keyboard[index] = true
}

/**
 * @param {KeyboardEvent} event
 * @param {GameKeyboard} keyboard
 */
export function keyup(event, keyboard) {
  const index = KEYS.indexOf(event.code)
  if (index === -1) return
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  event.preventDefault()
  keyboard[index] = false
}

/** @param {GameModel} model */
function getMusicTheme(model) {
  const anglerActive = model._deepNpcs.some(
    (npc) => !npc._free && npc._isAngler,
  )
  if (anglerActive) {
    model._deepReached = true
    return "scary"
  }

  const inDeep = model._players.some(
    (player) =>
      !player._free &&
      player._pos.y >= 150 &&
      player._pos.x >= 0 &&
      player._pos.x <= 200,
  )
  if (inDeep) {
    model._deepReached = true
    return "deep"
  }

  const narwhal = model._bosses.find((boss) => boss._isBoss && !boss._free)
  if (
    narwhal &&
    model._players.some((player) => {
      if (player._free || player._isDead) return false
      const dx = wrapDelta(player._pos.x - narwhal._pos.x, model._worldWidth)
      const dy = player._pos.y - narwhal._pos.y
      return Math.hypot(dx, dy) <= model._size / 2
    })
  ) {
    if (!model._narwhalSeen) {
      model._narwhalSeen = true
      gameEventNarwhalSeen(model)
    }
  }
  if (model._narwhalSeen && !model._deepReached) return "narwhal"
  return "surface"
}

/**
 * @param {GameModel} model
 * @param {GameView} view
 * @param {CanvasRenderingContext2D} ctx
 */
export function resize(
  model,
  view,
  ctx,
  dpr = devicePixelRatio,
  w = globalThis.visualViewport?.width ?? innerWidth,
  h = globalThis.visualViewport?.height ?? innerHeight,
) {
  const [w2, h2] = [w * dpr, h * dpr]
  ctx.canvas.style.width = w + "px"
  ctx.canvas.style.height = h + "px"
  ctx.canvas.width = w2
  ctx.canvas.height = h2
  view._size = Math.min(w2, h2)
  view._scale = view._size / model._size
  view._offset.x = (w2 - view._size) / 2
  view._offset.y = (h2 - view._size) / 2
}

/** @param {GameModel} model */
function areAllFriendsHelped(model) {
  const seaFriends = model._friends.filter((friend) => !friend._isDarkfriend)
  return seaFriends.length > 0 && seaFriends.every((friend) => friend._isHelped)
}

/**
 * @param {GameModel} model
 * @param {GameView} view
 * @param {CanvasRenderingContext2D} ctx
 */
function drawOceans(model, view, ctx) {
  const centerX = view._offset.x + view._size / 2
  const centerY = view._offset.y + view._size / 2
  const worldTop = centerY - model._renderCamera.y * view._scale
  const worldBottom = worldTop + model._worldHeight * view._scale
  const oceanBottom = worldTop + model._size * view._scale

  // The world is surrounded by sky above and rock below.
  ctx.fillStyle = "#7dd3fc"
  ctx.fillRect(view._offset.x, view._offset.y, view._size, view._size)
  const groundTop = Math.max(view._offset.y, oceanBottom)
  const groundGradient = ctx.createLinearGradient(
    0,
    groundTop,
    0,
    Math.min(view._offset.y + view._size, worldBottom),
  )
  groundGradient.addColorStop(0, COLOR_FLOOR)
  groundGradient.addColorStop(0.2, COLOR_TWO)
  groundGradient.addColorStop(0.72, COLOR_THREE)
  groundGradient.addColorStop(1, COLOR_DEEP)
  ctx.fillStyle = groundGradient
  ctx.fillRect(
    view._offset.x,
    groundTop,
    view._size,
    Math.max(0, view._offset.y + view._size - groundTop),
  )
  for (let ocean = 0; ocean < RAINBOW.length; ocean++) {
    for (let wrap = -1; wrap <= 1; wrap++) {
      const x =
        centerX +
        (ocean * model._size +
          wrap * model._worldWidth -
          model._renderCamera.x) *
          view._scale
      ctx.fillStyle = RAINBOW[ocean] ?? "blue"
      const width = model._size * view._scale
      const segments = 12
      const segmentWidth = width / segments
      const worldStart = ocean * model._size + wrap * model._worldWidth
      ctx.beginPath()
      for (let segment = 0; segment <= segments; segment++) {
        const worldX = worldStart + (segment / segments) * model._size
        const wave =
          Math.sin(worldX * 0.12 + model._simulationTime * 0.002) *
          0.45 *
          view._scale
        const pointX = x + segment * segmentWidth
        const pointY = worldTop + wave
        if (segment === 0) ctx.moveTo(pointX, pointY)
        else ctx.lineTo(pointX, pointY)
      }
      ctx.lineTo(x + width, oceanBottom)
      ctx.lineTo(x, oceanBottom)
      ctx.closePath()
      ctx.fill()
    }
  }

  // Blend a small band at each sea boundary so adjacent colors transition
  // instead of meeting as a hard vertical edge. Boundary 0 is the purple/red
  // world seam; the other boundaries are the ordinary sea borders.
  const fadeWidth = 8 * view._scale
  for (let boundarySea = 0; boundarySea < RAINBOW.length; boundarySea++) {
    const boundary = boundarySea * model._size
    const leftColor =
      RAINBOW[(boundarySea + RAINBOW.length - 1) % RAINBOW.length] ?? "black"
    const rightColor = RAINBOW[boundarySea] ?? "black"
    for (let wrap = -1; wrap <= 1; wrap++) {
      const boundaryX =
        centerX +
        (boundary + wrap * model._worldWidth - model._renderCamera.x) *
          view._scale
      const fade = ctx.createLinearGradient(
        boundaryX - fadeWidth / 2,
        0,
        boundaryX + fadeWidth / 2,
        0,
      )
      fade.addColorStop(0, leftColor)
      fade.addColorStop(1, rightColor)
      ctx.fillStyle = fade
      const fadeWorldLeft = boundary - fadeWidth / view._scale / 2
      const fadeWorldRight = boundary + fadeWidth / view._scale / 2
      const fadeSegments = 6
      ctx.save()
      ctx.beginPath()
      for (let segment = 0; segment <= fadeSegments; segment++) {
        const worldPoint =
          fadeWorldLeft +
          ((fadeWorldRight - fadeWorldLeft) * segment) / fadeSegments +
          wrap * model._worldWidth
        const pointX =
          centerX + (worldPoint - model._renderCamera.x) * view._scale
        const wave =
          Math.sin(worldPoint * 0.12 + model._simulationTime * 0.002) *
          0.45 *
          view._scale
        const pointY = worldTop + wave
        if (segment === 0) ctx.moveTo(pointX, pointY)
        else ctx.lineTo(pointX, pointY)
      }
      ctx.lineTo(boundaryX + fadeWidth / 2, oceanBottom)
      ctx.lineTo(boundaryX - fadeWidth / 2, oceanBottom)
      ctx.closePath()
      ctx.clip()
      ctx.fillRect(
        boundaryX - fadeWidth / 2,
        worldTop,
        fadeWidth,
        model._size * view._scale,
      )
      ctx.restore()
    }
  }

  /** @param {number} x */
  const worldX = (x) =>
    centerX +
    wrapDelta(x - model._renderCamera.x, model._worldWidth) * view._scale
  /** @param {number} y */
  const worldY = (y) => centerY + (y - model._renderCamera.y) * view._scale
  if (tunnelIsOpen(model)) {
    // A narrow tunnel below the red ocean leads into the deep sea.
    const tunnelGradient = ctx.createLinearGradient(
      0,
      worldY(100),
      0,
      worldY(150),
    )
    tunnelGradient.addColorStop(0, COLOR_RED)
    tunnelGradient.addColorStop(0.4, "#991b1b")
    tunnelGradient.addColorStop(0.72, "#450a0a")
    tunnelGradient.addColorStop(1, COLOR_DEEP)
    ctx.fillStyle = tunnelGradient
    for (let wrap = -1; wrap <= 1; wrap++) {
      ctx.fillRect(
        worldX(40 + wrap * model._worldWidth),
        worldY(100),
        20 * view._scale,
        50 * view._scale,
      )
    }

    // The deep sea is a black 200x200 region below the tunnel.
    ctx.fillStyle = COLOR_DEEP
    for (let wrap = -1; wrap <= 1; wrap++) {
      ctx.fillRect(
        worldX(wrap * model._worldWidth),
        worldY(150),
        200 * view._scale,
        200 * view._scale,
      )
    }

    // The deep sea has its own 200-unit floor, so use its actual bounds
    // instead of assuming the regular sea depth.
  }
  ctx.lineCap = "butt"
}

/** @param {GameModel} model @param {GameView} view @param {CanvasRenderingContext2D} ctx */
function drawKelp(model, view, ctx) {
  const centerX = view._offset.x + view._size / 2
  const centerY = view._offset.y + view._size / 2
  /** @param {number} x */
  const worldX = (x) =>
    centerX +
    wrapDelta(x - model._renderCamera.x, model._worldWidth) * view._scale
  /** @param {number} y */
  const worldY = (y) => centerY + (y - model._renderCamera.y) * view._scale
  /** @param {number} x @param {number} baseY @param {number} height */
  const drawPlant = (x, baseY, height) => {
    const sway = Math.sin(model._simulationTime * 0.0015 + x) * 3
    const baseX = worldX(x)
    /** @param {number} pointX */
    const kelpX = (pointX) => baseX + (pointX - x) * view._scale
    const topX = kelpX(x + sway)
    const topY = worldY(baseY - height)
    ctx.lineCap = "round"
    ctx.strokeStyle = "#14532d"
    ctx.lineWidth = 1.5 * view._scale
    ctx.beginPath()
    ctx.moveTo(baseX, worldY(baseY))
    ctx.bezierCurveTo(
      kelpX(x - sway * 0.4),
      worldY(baseY - height * 0.35),
      kelpX(x + sway * 0.8),
      worldY(baseY - height * 0.72),
      topX,
      topY,
    )
    ctx.stroke()

    ctx.fillStyle = "#166534"
    for (let leaf = 1; leaf <= 3; leaf++) {
      const leafY = baseY - (height * leaf) / 4
      const leafX = x + (sway * leaf) / 4
      const side = leaf % 2 === 0 ? 1 : -1
      ctx.beginPath()
      ctx.moveTo(kelpX(leafX), worldY(leafY))
      ctx.quadraticCurveTo(
        kelpX(leafX + side * 8),
        worldY(leafY - 5),
        kelpX(leafX + side * 13),
        worldY(leafY - 1),
      )
      ctx.quadraticCurveTo(
        kelpX(leafX + side * 7),
        worldY(leafY + 2),
        kelpX(leafX),
        worldY(leafY),
      )
      ctx.fill()
    }
  }

  /** @type {[number, number][]} */
  const kelp = [
    [12, 48],
    [30, 62],
    [58, 38],
    [92, 72],
    [126, 46],
    [158, 64],
    [188, 42],
  ]
  /** @param {number} sea @param {number} seaWidth @param {number} baseY */
  const drawKelpSea = (sea, seaWidth, baseY) => {
    const scale = seaWidth / 200
    for (const [localX, height] of kelp) {
      const x = sea * model._size + localX * scale
      drawPlant(x, baseY, height * scale)
    }
  }

  for (let sea = 1; sea < 7; sea++) {
    drawKelpSea(sea, model._size, model._size)
  }
  if (tunnelIsOpen(model)) {
    drawKelpSea(0, 200, model._worldHeight - 2)
  }
  ctx.lineCap = "butt"
}

/**
 * @param {GameModel} model
 * @param {GameView} view
 * @param {CanvasRenderingContext2D} ctx
 */
export function draw(model, view, ctx) {
  model._renderCamera.x = wrapPosition(
    model._oldCamera.x +
      wrapDelta(model._camera.x - model._oldCamera.x, model._worldWidth) *
        model._frameTime,
    model._worldWidth,
  )
  model._renderCamera.y = lerp(
    model._oldCamera.y,
    model._camera.y,
    model._frameTime,
  )

  // Black background
  ctx.fillStyle = "black"
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // Game area background
  ctx.fillStyle = "black"
  ctx.fillRect(view._offset.x, view._offset.y, view._size, view._size)

  const activePlayers = model._players.filter((player) => !player._free)
  const splitDistance = getLocalPlayerDistance(model)
  const splitThreshold = model._size * 0.9

  if (activePlayers.length === 2 && splitDistance > splitThreshold) {
    const firstPlayer = activePlayers[0]
    const secondPlayer = activePlayers[1]
    if (!firstPlayer || !secondPlayer) return
    if (!model._splitViewActive) {
      initializeSplitCameras(model)
      model._splitViewActive = true
    }
    const angle = getLocalPlayerAngle(model)
    // Keep the split geometry fixed. The cameras transition toward the
    // corresponding circle centers so the fish remains followed.
    const gameRadius = (view._size * 0.875) / 2
    const smallRadius = gameRadius / 2 + 0.6
    const [firstOffset, secondOffset] = getSplitCircleOffsets(
      angle,
      gameRadius / 2,
    )

    // Keep the two slightly-overlapped halves inside the single bezel.
    ctx.save()
    ctx.beginPath()
    ctx.arc(
      view._offset.x + view._size / 2,
      view._offset.y + view._size / 2,
      gameRadius,
      0,
      TAU,
    )
    ctx.clip()
    drawSplitGameCircle(
      model,
      view,
      ctx,
      firstPlayer,
      firstOffset,
      smallRadius,
      0,
    )
    drawSplitGameCircle(
      model,
      view,
      ctx,
      secondPlayer,
      secondOffset,
      smallRadius,
      1,
    )
    ctx.restore()
    drawGameRing(
      ctx,
      view._offset.x + view._size / 2,
      view._offset.y + view._size / 2,
      view._size / 2,
    )
  } else {
    if (model._splitViewActive) initializeReconnectCamera(model)
    model._splitViewActive = false
    drawGameCircle(model, view, ctx, activePlayers)
    drawGameRing(
      ctx,
      view._offset.x + view._size / 2,
      view._offset.y + view._size / 2,
      view._size / 2,
    )
  }

  drawMobileControls(model, view, ctx)
  drawHud(model, view, ctx)
}

/** @param {GameModel} model @param {GameView} view @param {CanvasRenderingContext2D} ctx */
function drawHud(model, view, ctx) {
  const centerX = view._offset.x + view._size / 2
  const centerY = view._offset.y + view._size / 2
  // Center labels on the embossed band's midpoint.
  const textRadius = view._size * ((0.995 + 0.875) / 4)
  const values = [
    { angle: 0, text: `${Math.floor(model._simulationTime / 1000)}s` },
    { angle: -TAU / 20, text: `${Math.round(getHudDepth(model))}m` },
    { angle: TAU / 20, text: `🏆 ${model._highScore}` },
    { angle: -TAU / 10, text: model._eaten ? `🦷 ${model._eaten}` : "" },
    { angle: TAU / 10, text: model._pierced ? `🦄 ${model._pierced}` : "" },
    { angle: -TAU / 5, text: model._stars ? `★ ${model._stars}` : "" },
  ]
  ctx.save()
  ctx.font = `${Math.max(14, view._size * 0.019)}px monospace`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillStyle = "#f5d49b"
  for (const { angle, text } of values) {
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(angle)
    ctx.fillText(text, 0, -textRadius)
    ctx.restore()
  }
  ctx.restore()
}

/** @param {GameModel} model */
function getHudDepth(model) {
  return model._players
    .filter((player) => !player._free)
    .reduce((depth, player) => Math.max(depth, player._pos.y), 0)
}

/** @param {GameModel} model @param {GameView} view @param {CanvasRenderingContext2D} ctx */
function drawMobileControls(model, view, ctx) {
  const layout = getMobileControlLayout(view, ctx.canvas)
  const { radius } = layout
  // In 1P mode either mobile control feeds player 1. The merged input is
  // stored in slot 0, but the visualization should stay on the control that
  // supplied the active movement. Since getInputs() processes left then
  // right, the last active control matches the movement that wins the merge
  // when both are held.
  let activeMobileControl = -1
  if (!model._player2Enabled) {
    for (let i = 0; i < model._mobileInputs.length; i++) {
      if (model._mobileInputs[i]?._velocity) activeMobileControl = i
    }
  }
  ctx.save()
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = `${radius * 0.28}px sans-serif`
  for (let i = 0; i < 2; i++) {
    const center = layout.controls[i]
    const turboCenter = layout.turboCenters[i]
    if (!center || !turboCenter) continue
    const { pointer, movement, gearAngle } = getMobileControlState(
      model,
      i,
      activeMobileControl,
    )
    drawMobileControl(
      model,
      ctx,
      center,
      turboCenter,
      radius,
      layout,
      gearAngle,
      pointer,
      movement,
      i === 0
        ? ["#3f1d12", "#9a3412", "#ea580c"]
        : ["#052e16", "#166534", "#22c55e"],
      model._player2Enabled ? `P${i + 1}` : "P1",
    )
  }
  ctx.restore()
}

/**
 * @param {GameModel} model
 * @param {number} index
 * @param {number} activeMobileControl
 * @returns {{pointer: {start: GamePos, current: GamePos} | null | undefined, movement: GamePos | undefined, gearAngle: number}}
 */
function getMobileControlState(model, index, activeMobileControl) {
  const onePlayer = !model._player2Enabled
  const activeControl = onePlayer && index === activeMobileControl
  const inactiveControl =
    onePlayer && activeMobileControl >= 0 && !activeControl
  const inputIndex = activeControl ? activeMobileControl : index
  const pointer = inactiveControl
    ? undefined
    : model._mobilePointers[inputIndex]
  const movement = inactiveControl
    ? undefined
    : activeControl
      ? model._mobileInputs[inputIndex]?._velocity
      : model._gearMovement[index]
  const gearTargetAngle = inactiveControl
    ? 0
    : (model._gearAngles[activeControl ? 0 : index] ?? 0)
  const keyboardInput =
    !activeControl &&
    !inactiveControl &&
    model._gearInputTypes[index] === "keyboard"
  const gearAngle = (model._gearRenderAngles[index] = keyboardInput
    ? lerpAngle(
        model._gearRenderAngles[index] ?? gearTargetAngle,
        gearTargetAngle,
        0.45,
      )
    : gearTargetAngle)
  return { pointer, movement, gearAngle }
}

/**
 * @param {GameModel} model
 * @param {CanvasRenderingContext2D} ctx
 * @param {GamePos} center
 * @param {GamePos} turboCenter
 * @param {number} radius
 * @param {{cogRadius: number, gearModule: number, gearSnapRadius: number}} layout
 * @param {number} gearAngle
 * @param {{start: GamePos, current: GamePos} | null | undefined} pointer
 * @param {GamePos | undefined} movement
 * @param {[string, string, string]} color
 * @param {string} label
 */
function drawMobileControl(
  model,
  ctx,
  center,
  turboCenter,
  radius,
  layout,
  gearAngle,
  pointer,
  movement,
  color,
  label,
) {
  let inner = center
  if (movement) {
    const dx = pointer ? pointer.current.x - pointer.start.x : movement.x
    const dy = pointer ? pointer.current.y - pointer.start.y : movement.y
    const length = pointer ? Math.hypot(dx, dy) : 1
    // The Z16 center may travel to the pitch-radius gap inside the Z24
    // socket. innerRadius is only the touch hit area, not the travel limit.
    const direction = pointer
      ? { x: dx / Math.max(1, length), y: dy / Math.max(1, length) }
      : { x: Math.cos(gearAngle), y: Math.sin(gearAngle) }
    const travel = pointer
      ? Math.min(length, layout.gearSnapRadius)
      : layout.gearSnapRadius
    if (travel > 0) {
      const snapDistance =
        !pointer || length >= layout.gearSnapRadius * 0.72
          ? layout.gearSnapRadius
          : Math.min(travel, layout.gearSnapRadius)
      inner = {
        x: center.x + direction.x * snapDistance,
        y: center.y + direction.y * snapDistance,
      }
    }
  }

  drawInternalGear(
    ctx,
    center.x,
    center.y,
    radius,
    24,
    layout.gearModule,
    color,
  )

  // A Z16 planet rolling in a fixed Z24 internal gear turns at half the
  // opposite angular speed of its center.
  drawCogWheel(
    ctx,
    inner.x,
    inner.y,
    layout.cogRadius,
    16,
    layout.gearModule,
    -gearAngle * 0.5 + PI / 16,
    "#6b7280",
    { dark: "#374151", light: "#d1d5db", faint: "#9ca3af" },
  )

  const turboWidth = radius * 0.8
  const turboHeight = radius * 0.45
  ctx.beginPath()
  ctx.roundRect(
    turboCenter.x - turboWidth / 2,
    turboCenter.y - turboHeight / 2,
    turboWidth,
    turboHeight,
    turboHeight * 0.3,
  )
  const turboActive = model._mobileTurboPointers.some(
    (activePointer) => activePointer !== null,
  )
  ctx.fillStyle = turboActive ? "#facc15aa" : "#020617bb"
  ctx.fill()
  ctx.strokeStyle = "#facc15cc"
  ctx.stroke()
  ctx.fillStyle = "#fef08a"
  ctx.fillText("⚡", turboCenter.x, turboCenter.y)
  ctx.fillStyle = "#f8fafcaa"
  ctx.fillText(label, center.x, center.y - radius * 0.9)
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} radius
 * @param {number} teeth
 * @param {number} module
 * @param {number} rotation
 * @param {string} fill
 * @param {{dark: string, light: string, faint: string}} edge
 */
function drawCogWheel(ctx, x, y, radius, teeth, module, rotation, fill, edge) {
  const path = new Path2D()
  const pitchRadius = (teeth * module) / 2
  const addendum = module * 0.55
  const dedendum = module * 0.65
  for (let i = 0; i < teeth * 4; i++) {
    const angle = rotation + ((i - 0.5) / (teeth * 4)) * TAU
    const step = i % 4
    const pointRadius =
      step === 0
        ? pitchRadius - dedendum
        : step === 1
          ? pitchRadius - dedendum + addendum * 0.4
          : pitchRadius + addendum
    const pointX = x + Math.cos(angle) * pointRadius
    const pointY = y + Math.sin(angle) * pointRadius
    if (i === 0) path.moveTo(pointX, pointY)
    else path.lineTo(pointX, pointY)
  }
  path.closePath()
  const holeRadius = radius * 0.34
  path.moveTo(x + holeRadius, y)
  path.arc(x, y, holeRadius, 0, TAU)
  const fillGradient = ctx.createLinearGradient(x, y - radius, x, y + radius)
  fillGradient.addColorStop(0, edge.light)
  fillGradient.addColorStop(0.38, fill)
  fillGradient.addColorStop(1, edge.dark)
  ctx.fillStyle = fillGradient
  ctx.fill(path, "evenodd")
  // Keep both edge colors present continuously: the gradient makes the top
  // read as the lit face and the bottom as the extruded shadow.
  const edgeGradient = ctx.createLinearGradient(x, y - radius, x, y + radius)
  edgeGradient.addColorStop(0, edge.light)
  edgeGradient.addColorStop(0.32, edge.light)
  edgeGradient.addColorStop(0.68, edge.dark)
  edgeGradient.addColorStop(1, edge.dark)
  ctx.strokeStyle = edgeGradient
  ctx.lineWidth = Math.max(1, radius * 0.022)
  ctx.stroke(path)
  const holeEdge = ctx.createLinearGradient(
    x,
    y - holeRadius,
    x,
    y + holeRadius,
  )
  holeEdge.addColorStop(0, edge.dark)
  holeEdge.addColorStop(0.48, edge.light)
  holeEdge.addColorStop(1, edge.dark)
  ctx.strokeStyle = holeEdge
  ctx.lineWidth = Math.max(1, radius * 0.028)
  ctx.beginPath()
  ctx.arc(x, y, holeRadius, 0, TAU)
  ctx.stroke()

  const ring = ctx.createLinearGradient(x - holeRadius, y, x + holeRadius, y)
  ring.addColorStop(1, edge.dark)
  ring.addColorStop(0.48, edge.faint)
  ring.addColorStop(0, edge.dark)
  ctx.strokeStyle = ring
  ctx.beginPath()
  ctx.arc(x, y, holeRadius * 2, 0, TAU)
  ctx.stroke()
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} radius
 * @param {number} teeth
 * @param {number} module
 * @param {[string, string, string]} faceColors
 */
function drawInternalGear(ctx, x, y, radius, teeth, module, faceColors) {
  const pitchRadius = (teeth * module) / 2
  const addendum = module * 0.55
  const dedendum = module * 0.65
  const outerRadius = pitchRadius - addendum
  const rootRadius = pitchRadius + dedendum
  const toothPath = new Path2D()
  const pointCount = teeth * 4
  for (let i = 0; i < pointCount; i++) {
    const angle = ((i - 0.5) / pointCount) * TAU
    const step = i % 4
    const pointRadius =
      step === 0
        ? rootRadius
        : step === 1
          ? rootRadius - addendum * 0.4
          : outerRadius
    const pointX = x + Math.cos(angle) * pointRadius
    const pointY = y + Math.sin(angle) * pointRadius
    if (i === 0) toothPath.moveTo(pointX, pointY)
    else toothPath.lineTo(pointX, pointY)
  }
  toothPath.closePath()

  const face = ctx.createLinearGradient(x, y - radius, x, y + radius)
  face.addColorStop(0, faceColors[0])
  face.addColorStop(0.5, faceColors[1])
  face.addColorStop(1, faceColors[2])
  ctx.fillStyle = face
  ctx.fill(toothPath, "evenodd")

  const socketEdge = ctx.createLinearGradient(x, y - radius, x, y + radius)
  socketEdge.addColorStop(0, "#374151")
  socketEdge.addColorStop(0.32, "#374151")
  socketEdge.addColorStop(0.68, "#d1d5db")
  socketEdge.addColorStop(1, "#6b7280")
  ctx.strokeStyle = socketEdge
  ctx.lineWidth = Math.max(1, radius * 0.022)
  ctx.stroke(toothPath)
  // Recessed edge: dark above and light below, the inverse of the cog's
  // raised outer edge.
  const lowerEdge = ctx.createLinearGradient(x, y - radius, x, y + radius)
  lowerEdge.addColorStop(0, "#080c11")
  lowerEdge.addColorStop(0.45, "#080c11")
  lowerEdge.addColorStop(0.55, "#6f8191")
  lowerEdge.addColorStop(1, "#aab8c3")
  ctx.strokeStyle = lowerEdge
  ctx.lineWidth = Math.max(1, radius * 0.022)
  // ctx.stroke(toothPath)
}

/** @param {CanvasRenderingContext2D} ctx @param {number} x @param {number} y @param {number} radius */
function drawGameRing(ctx, x, y, radius) {
  ctx.save()
  const outerRadius = radius * 0.995
  const innerRadius = radius * 0.875
  ctx.beginPath()
  ctx.arc(x, y, outerRadius, 0, TAU)
  ctx.arc(x, y, innerRadius, 0, TAU, true)
  const bandGradient = ctx.createLinearGradient(
    x,
    y - outerRadius,
    x,
    y + outerRadius,
  )
  bandGradient.addColorStop(0, "#2b1d15")
  bandGradient.addColorStop(0.48, "#18100c")
  bandGradient.addColorStop(1, "#080605")
  ctx.fillStyle = bandGradient
  ctx.fill("evenodd")

  // Restrict both edge strokes to the band. This keeps every embossed pixel
  // outside the game circle even though the canvas stroke is centered on a
  // path by default.
  ctx.beginPath()
  ctx.arc(x, y, outerRadius, 0, TAU)
  ctx.arc(x, y, innerRadius, 0, TAU, true)
  ctx.clip()
  const outerEdge = ctx.createLinearGradient(
    x,
    y - outerRadius,
    x,
    y + outerRadius,
  )
  outerEdge.addColorStop(0, "#63452f")
  outerEdge.addColorStop(0.5, "#352218")
  outerEdge.addColorStop(1, "#080605")
  ctx.strokeStyle = outerEdge
  ctx.lineWidth = Math.max(2, radius * 0.018)
  ctx.beginPath()
  ctx.arc(x, y, outerRadius, 0, TAU)
  ctx.stroke()

  const innerEdge = ctx.createLinearGradient(
    x,
    y - innerRadius,
    x,
    y + innerRadius,
  )
  innerEdge.addColorStop(0, "#080605")
  innerEdge.addColorStop(0.5, "#352218")
  innerEdge.addColorStop(1, "#63452f")
  ctx.strokeStyle = innerEdge
  ctx.lineWidth = Math.max(2, radius * 0.018)
  ctx.beginPath()
  ctx.arc(x, y, outerRadius, 0, TAU)
  ctx.beginPath()
  ctx.arc(x, y, innerRadius, 0, TAU)
  ctx.stroke()
  ctx.restore()
}

/**
 * Draw one circular playfield. In split view, `players` contains only the
 * local player belonging to that circle and `offset` moves the circle's
 * center away from the normal camera center.
 *
 * @param {GameModel} model
 * @param {GameView} view
 * @param {CanvasRenderingContext2D} ctx
 * @param {GamePlayer[]} players
 * @param {{x: number, y: number}} [offset]
 * @param {number} [radius]
 * @param {number} [contentScale]
 */
function drawGameCircle(
  model,
  view,
  ctx,
  players,
  offset = { x: 0, y: 0 },
  radius = (view._size * 0.875) / 2,
  contentScale = 1,
) {
  const centerX = view._offset.x + view._size / 2 + offset.x
  const centerY = view._offset.y + view._size / 2 + offset.y
  // This is the explicit inner radius of the shared bezel. Keeping this
  // independent from the viewport radius prevents split mode from shrinking
  // the fish into two undersized circles.
  const playRadius = radius

  ctx.save()
  ctx.beginPath()
  ctx.arc(centerX, centerY, playRadius, 0, TAU)
  ctx.clip()
  ctx.save()
  if (contentScale !== 1) {
    ctx.translate(centerX, centerY)
    ctx.scale(contentScale, contentScale)
    ctx.translate(-centerX, -centerY)
  }

  drawOceans(model, view, ctx)

  for (const item of model._items) {
    if (item._free) continue
    drawItem(item, model, view, ctx)
  }
  for (const friend of model._friends) {
    if (friend._free || !friend._isFriend) continue
    drawPlayer(friend, model, view, ctx)
  }
  for (const player of model._backgroundPlayers) {
    if (player._free) continue
    drawPlayer(player, model, view, ctx)
  }
  for (const boss of model._bosses) {
    if (boss._free) continue
    boss._isThrusting = false
    drawPlayer(boss, model, view, ctx)
  }
  for (const npc of model._deepNpcs) {
    if (npc._free) continue
    drawPlayer(npc, model, view, ctx)
  }
  for (const player of players) {
    drawPlayer(player, model, view, ctx)
  }
  for (const particle of model._particles) {
    if (particle._free) continue
    drawParticle(particle, model, view, ctx)
  }
  drawKelp(model, view, ctx)
  ctx.restore()
  ctx.restore()
}

/**
 * Draw a player's half-sized playfield using that player's smooth camera.
 * The offset moves only the clipping circle. The camera target handles the
 * player's later movement toward that circle's center.
 *
 * @param {GameModel} model
 * @param {GameView} view
 * @param {CanvasRenderingContext2D} ctx
 * @param {GamePlayer} player
 * @param {{x: number, y: number}} offset
 * @param {number} radius
 * @param {number} cameraIndex
 */
function drawSplitGameCircle(
  model,
  view,
  ctx,
  player,
  offset,
  radius,
  cameraIndex,
) {
  const previousCamera = model._renderCamera
  model._renderCamera = getSplitRenderCamera(model, cameraIndex)
  drawGameCircle(model, view, ctx, [player], offset, radius)
  model._renderCamera = previousCamera
}

/** @param {GameModel} model @param {number} index */
function getSplitRenderCamera(model, index) {
  const camera = model._splitCameras[index]
  const oldCamera = model._oldSplitCameras[index]
  if (!camera || !oldCamera) return model._renderCamera
  return {
    x: wrapPosition(
      oldCamera.x +
        wrapDelta(camera.x - oldCamera.x, model._worldWidth) * model._frameTime,
      model._worldWidth,
    ),
    y: lerp(oldCamera.y, camera.y, model._frameTime),
  }
}

/** @param {GameModel} model */
function initializeSplitCameras(model) {
  model._splitMidpoint.x = model._renderCamera.x
  model._splitMidpoint.y = model._renderCamera.y
  for (let i = 0; i < 2; i++) {
    const camera = model._splitCameras[i]
    const oldCamera = model._oldSplitCameras[i]
    const player = model._players[i]
    if (!camera || !oldCamera || !player) continue
    camera.x = model._renderCamera.x
    camera.y = model._renderCamera.y
    oldCamera.x = model._renderCamera.x
    oldCamera.y = model._renderCamera.y
  }
}

/** @param {GameModel} model */
function initializeReconnectCamera(model) {
  const first = model._splitCameras[0]
  const second = model._splitCameras[1]
  if (!first || !second) return
  const x = wrapPosition(
    first.x + wrapDelta(second.x - first.x, model._worldWidth) / 2,
    model._worldWidth,
  )
  const y = (first.y + second.y) / 2
  model._camera.x = x
  model._camera.y = y
  model._oldCamera.x = x
  model._oldCamera.y = y
  model._renderCamera.x = x
  model._renderCamera.y = y
}

/** @param {GameModel} model */
function getLocalPlayerDistance(model) {
  const first = model._players[0]
  const second = model._players[1]
  if (!first || first._free || !second || second._free) return 0
  const dx = wrapDelta(second._pos.x - first._pos.x, model._worldWidth)
  const dy = second._pos.y - first._pos.y
  return Math.hypot(dx, dy)
}

/**
 * Find the two fixed circle centers along the player separation direction.
 *
 * @param {number} angle
 * @param {number} radius
 * @returns {[{x: number, y: number}, {x: number, y: number}]}
 */
function getSplitCircleOffsets(angle, radius) {
  const x = Math.cos(angle) * radius
  const y = Math.sin(angle) * radius
  return [
    { x: -x, y: -y },
    { x, y },
  ]
}

/** @param {GameModel} model */
function getLocalPlayerAngle(model) {
  const first = model._players[0]
  const second = model._players[1]
  if (!first || !second) return 0
  const dx = wrapDelta(second._pos.x - first._pos.x, model._worldWidth)
  const dy = second._pos.y - first._pos.y
  let angle = Math.atan2(dy, dx)
  const maxHorizontalDistance = model._worldWidth / 2
  const turnStart = maxHorizontalDistance - model._size / 2
  const turn = clamp(
    (Math.abs(dx) - turnStart) / (maxHorizontalDistance - turnStart),
    0,
    1,
  )
  if (turn > 0) {
    if (angle < -PI / 2) angle += TAU
    angle = lerpAngle(angle, PI / 2, turn)
  }
  return angle
}

/**
 * @param {GamePlayer} player
 * @param {GameModel} model
 * @param {GameView} view
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} screenX
 * @param {number} screenY
 * @param {number} entityRadius
 * @param { number} screenAngle
 */
export function drawPlayerSprite(
  player,
  model,
  view,
  ctx,
  screenX,
  screenY,
  entityRadius,
  screenAngle,
  darken = false,
) {
  const screenRadius = entityRadius
  ctx.save()
  ctx.translate(screenX, screenY)
  const facingLeft = Math.cos(screenAngle) < 0
  if (facingLeft) {
    // Mirror left-facing fish and only tilt them away from horizontal. This
    // keeps the eye and lamp above the body for southwest-facing movement.
    ctx.scale(-1, 1)
    ctx.rotate(PI - screenAngle)
  } else {
    ctx.rotate(screenAngle)
  }
  ctx.translate(-screenX, -screenY)

  if (player._isBoss && player._isThrusting) {
    ctx.strokeStyle = "#ffffffcc"
    ctx.lineWidth = 0.22 * view._scale
    ctx.lineCap = "round"
    for (const offset of [-0.32, 0, 0.32]) {
      ctx.beginPath()
      ctx.moveTo(screenX - screenRadius * 1.1, screenY + screenRadius * offset)
      ctx.lineTo(
        screenX - screenRadius * (1.65 + Math.abs(offset)),
        screenY + screenRadius * offset,
      )
      ctx.stroke()
    }
    ctx.lineCap = "butt"
  }

  if (player._isAngler) {
    const mouthY = screenY + screenRadius * 0.12

    // The angler has teeth on both jaws, pointing into the open mouth.
    ctx.fillStyle = "#f8fafc"
    ctx.save()
    let [sx, sy] = [screenX + screenRadius * 0.22, mouthY - screenRadius * 0.05]
    ctx.translate(sx, sy)
    ctx.rotate(-PI * (5 / 16))
    ctx.beginPath()
    ctx.fill()
    for (const toothX of [0, 0.15, 0.3, 0.45]) {
      ctx.beginPath()
      ctx.moveTo(screenRadius * toothX, screenRadius * 0.2)
      ctx.lineTo(screenRadius * (toothX - 0.005), screenRadius * 0.03)
      ctx.lineTo(screenRadius * (toothX + 0.08), screenRadius * 0.03)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()

    ctx.save()
    ;[sx, sy] = [screenX + screenRadius * 0.22, mouthY - screenRadius * 0.03]
    ctx.translate(sx, sy)
    ctx.rotate(PI * -(2 / 16))
    for (const toothX of [0, 0.15, 0.3, 0.45]) {
      ctx.beginPath()
      ctx.moveTo(screenRadius * toothX, screenRadius * 0.16)
      ctx.lineTo(screenRadius * (toothX + 0.045), screenRadius * 0.06)
      ctx.lineTo(screenRadius * (toothX + 0.09), screenRadius * 0.16)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()

    // Lure
    const lureX = screenX + screenRadius * 0.72
    const lureY = screenY - screenRadius * 0.8
    ctx.strokeStyle = "#111827"
    ctx.lineWidth = 0.25 * view._scale
    ctx.beginPath()
    ctx.moveTo(screenX + screenRadius * 0.42, screenY - screenRadius * 0.16)
    ctx.arc(
      screenX + screenRadius * 0.58,
      screenY - screenRadius * 0.5,
      screenRadius * 0.23,
      PI * 0.9,
      -PI * 0.4,
    )
    ctx.lineTo(lureX, lureY)
    ctx.stroke()
  }

  const bodyX = screenX + screenRadius * 0.1
  const bodyRadiusX = screenRadius * 0.9
  const bodyRadiusY = screenRadius * 0.55

  // Tail fin path
  const p1 = new Path2D()
  p1.moveTo(screenX - screenRadius * 0.55, screenY - screenRadius * 0.2)
  p1.arc(
    screenX - screenRadius * 0.85,
    screenY - screenRadius * 0.2,
    screenRadius * 0.3,
    0,
    PI,
    true,
  )
  p1.lineTo(screenX - screenRadius * 1.05, screenY)
  p1.lineTo(screenX - screenRadius * 1.15, screenY + screenRadius * 0.2)
  p1.arc(
    screenX - screenRadius * 0.85,
    screenY + screenRadius * 0.2,
    screenRadius * 0.3,
    PI,
    0,
    true,
  )

  // Keep the tail and body as separate filled paths. The tail is a narrow,
  // heart-shaped fin; filling the combined outline can leave it looking like
  // a square when Canvas resolves the self-intersecting join.
  ctx.save()
  ctx.clip(p1)
  if (player._isAngler || player._isFriend) {
    ctx.fillStyle = player._isAngler ? "#050505" : player._color
    ctx.fillRect(
      screenX - screenRadius * 1.2,
      screenY - screenRadius * 0.5,
      screenRadius * 0.7,
      screenRadius * 1,
    )
  } else {
    const stripeHeight = screenRadius / RAINBOW.length
    for (let i = 0; i < RAINBOW.length; i++) {
      ctx.beginPath()
      ctx.rect(
        screenX - screenRadius * 1.2,
        screenY - screenRadius * 0.5 + i * stripeHeight,
        screenRadius * 0.7,
        stripeHeight + 1,
      )
      ctx.fillStyle = RAINBOW[i] ?? "red"
      ctx.fill()
      ctx.lineWidth = 0.1 * view._scale
      ctx.strokeStyle = COLOR_FAINT
      ctx.stroke()
    }
  }
  ctx.restore()

  if (player._isAngler) {
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 0.22 * view._scale
    for (const offset of [-0.18, 0, 0.18]) {
      ctx.beginPath()
      ctx.moveTo(
        screenX - screenRadius * 0.62,
        screenY + screenRadius * offset - screenRadius * 0.1,
      )
      ctx.lineTo(
        screenX - screenRadius * 1.03,
        screenY + screenRadius * offset + screenRadius * 0.08,
      )
      ctx.stroke()
    }
  }

  // Angler body has an open, tooth-matched mouth. Keep its dedicated path.
  if (player._isAngler) {
    const p1 = new Path2D()
    p1.moveTo(bodyX - bodyRadiusX * 0.95, screenY - bodyRadiusY * 0.2)
    p1.bezierCurveTo(
      bodyX - bodyRadiusX * 0.65,
      screenY - bodyRadiusY * 0.9,
      bodyX + bodyRadiusX * 0.15,
      screenY - bodyRadiusY,
      bodyX + bodyRadiusX * 0.55,
      screenY - bodyRadiusY * 0.55,
    )
    p1.ellipse(
      bodyX + bodyRadiusX * 0.4,
      screenY - bodyRadiusY * 0.09,
      bodyRadiusX * 0.1,
      bodyRadiusX * 0.3,
      PI * 0.2,
      -PI * 0.7,
      PI * 0.5,
      true,
    )
    p1.ellipse(
      bodyX + bodyRadiusX * 0.5,
      screenY + bodyRadiusY * 0.11,
      bodyRadiusX * 0.1,
      bodyRadiusX * 0.3,
      PI * -0.65,
      PI * -0.6,
      PI * 0.65,
      true,
    )
    p1.bezierCurveTo(
      bodyX + bodyRadiusX * 1.25,
      screenY + bodyRadiusY,
      bodyX - bodyRadiusX * 0.65,
      screenY + bodyRadiusY * 0.9,
      bodyX - bodyRadiusX * 0.95,
      screenY + bodyRadiusY * 0.2,
    )
    ctx.fillStyle = player._color
    ctx.fill(p1)
  }

  const p2 = new Path2D()
  // Outline uses the tail plus the normal silhouette, matching the old
  // renderer and avoiding a dark line across the shared tail/body join.
  const p3 = new Path2D()
  // p3.moveTo(bodyX - bodyRadiusX * 0.95, screenY - bodyRadiusY * 0.2)
  // p3.lineTo(screenX - screenRadius * 0.55, screenY - screenRadius * 0.2)
  p3.arc(
    screenX - screenRadius * 0.85,
    screenY - screenRadius * 0.2,
    screenRadius * 0.3,
    PI * -0.13,
    PI,
    true,
  )
  p3.lineTo(screenX - screenRadius * 1.05, screenY)
  p3.lineTo(screenX - screenRadius * 1.15, screenY + screenRadius * 0.2)
  p3.arc(
    screenX - screenRadius * 0.85,
    screenY + screenRadius * 0.2,
    screenRadius * 0.3,
    PI,
    PI * 0.13,
    true,
  )

  const p4 = new Path2D()
  // p4.lineTo(bodyX - bodyRadiusX * 0.95, screenY + bodyRadiusY * 0.2)
  p4.moveTo(bodyX - bodyRadiusX * 1, screenY)
  p4.bezierCurveTo(
    bodyX - bodyRadiusX * 0.98,
    screenY + bodyRadiusY * 0.9,
    bodyX + bodyRadiusX * 0.15,
    screenY + bodyRadiusY,
    bodyX + bodyRadiusX * 0.75,
    screenY + bodyRadiusY * 0.35,
  )
  p4.bezierCurveTo(
    bodyX + bodyRadiusX * 0.98,
    screenY + bodyRadiusY * 0.08,
    bodyX + bodyRadiusX * 0.98,
    screenY - bodyRadiusY * 0.08,
    bodyX + bodyRadiusX * 0.75,
    screenY - bodyRadiusY * 0.35,
  )
  p4.bezierCurveTo(
    bodyX + bodyRadiusX * 0.15,
    screenY - bodyRadiusY,
    bodyX - bodyRadiusX * 0.98,
    screenY - bodyRadiusY * 0.9,
    bodyX - bodyRadiusX,
    screenY,
  )
  if (!player._isAngler) {
    ctx.fillStyle = player._color
    ctx.fill(p4)
  }
  p2.addPath(p3)
  p2.addPath(p4)
  if (!player._isAngler) {
    ctx.strokeStyle = "#0009"
    ctx.lineWidth = 0.3 * view._scale
    ctx.stroke(p2)
  }

  if (player._isNarwhal) {
    const horn = new Path2D()
    horn.moveTo(screenX + screenRadius * 0.83, screenY - screenRadius * 0.14)
    horn.lineTo(screenX + screenRadius * 1.8, screenY)
    horn.lineTo(screenX + screenRadius * 0.83, screenY + screenRadius * 0.14)

    ctx.save()
    ctx.clip(horn)
    ctx.save()
    ctx.translate(screenX + screenRadius * 1.1, screenY) // + screenRadius)
    ctx.rotate(-PI * 0.3)
    const stripeHeight = (screenRadius / RAINBOW.length) * 0.8
    // Walk the palette backwards, but keep the painted stripe positions moving
    // forwards. The stripes overlap, so using colorIndex for both would cover
    // most of the horn with the final color drawn.
    for (let i = 0; i < RAINBOW.length; i++) {
      ctx.beginPath()
      ctx.rect(
        screenRadius * -0.3,
        screenRadius * -0.35 + i * stripeHeight,
        screenRadius * 0.8,
        stripeHeight * 1.7,
      )
      ctx.fillStyle = RAINBOW[RAINBOW.length - 1 - i] ?? COLOR_RED
      ctx.fill()
      ctx.lineWidth = 0.1 * view._scale
      ctx.strokeStyle = "#0004"
      ctx.stroke()
    }
    ctx.restore()
    ctx.restore()

    ctx.strokeStyle = "#0009"
    ctx.stroke(horn)
  }

  // One big, slightly goofy eye on the front of the fish
  const isIdle = player._velocity.x === 0 && player._velocity.y === 0
  const twitchTime = (model._simulationTime + player._index * 2100) % 5000
  const twitch =
    isIdle && twitchTime < 180 ? Math.sin((twitchTime / 180) * PI) : 0
  const twitchX = isIdle ? twitch * screenRadius * 0.07 : 0
  const twitchY = isIdle ? twitch * screenRadius * 0.04 : 0
  const eyeX = screenX + screenRadius * (player._isAngler ? 0.22 : 0.55)
  const eyeY = screenY - screenRadius * (player._isAngler ? 0.3 : 0)
  // The angler is larger by radius, but keeps the same eye size as a normal
  // player fish instead of scaling the eye with its body.
  const eyeRadius = (player._isAngler ? entityRadius / 2 : screenRadius) * 0.3
  ctx.fillStyle = "white"
  ctx.beginPath()
  ctx.arc(eyeX, eyeY, eyeRadius, 0, TAU)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = "black"
  ctx.beginPath()
  ctx.arc(
    eyeX + eyeRadius * 0.15 + twitchX,
    eyeY + twitchY,
    eyeRadius * 0.42,
    0,
    TAU,
  )
  ctx.fill()

  if (player._isAngler) {
    const lureX = screenX + screenRadius * 0.72
    const lureY = screenY - screenRadius * 0.8
    const lampLit =
      player._pos.y >= 150 && player._pos.x >= 0 && player._pos.x <= 200
    ctx.fillStyle = lampLit ? "#fef08a" : "#475569"
    ctx.beginPath()
    ctx.arc(lureX, lureY, screenRadius * 0.16, 0, TAU)
    ctx.fill()
    ctx.strokeStyle = lampLit ? "#facc15" : "#334155"
    ctx.stroke()
  }

  if (player._hasLamp && !player._isAngler) {
    const lampLit =
      player._pos.y >= 150 && player._pos.x >= 0 && player._pos.x <= 200
    const lampX = screenX + screenRadius * 0.25
    const lampY = screenY - screenRadius * 0.8
    ctx.strokeStyle = lampLit ? "#fef08a" : "#475569"
    ctx.lineWidth = 0.25 * view._scale
    ctx.beginPath()
    ctx.moveTo(screenX + screenRadius * 0.2, screenY - screenRadius * 0.25)
    ctx.lineTo(lampX, lampY)
    ctx.stroke()
    ctx.fillStyle = lampLit ? "#fef08a" : "#475569"
    ctx.beginPath()
    ctx.arc(lampX, lampY, screenRadius * 0.16, 0, TAU)
    ctx.fill()
    ctx.strokeStyle = lampLit ? "#facc15" : "#334155"
    ctx.stroke()
  }

  if (darken) {
    ctx.save()
    ctx.globalAlpha = 0.62
    ctx.fillStyle = "#000"
    ctx.fill(p2)
    ctx.restore()
  }

  ctx.restore()
}

/** @param {number} screenX @param {number} screenY @param {number} radius @param {number} angle */
function getAnglerLampPosition(screenX, screenY, radius, angle) {
  const localX = radius * 0.72
  const localY = -radius * 0.8
  const facingLeft = Math.cos(angle) < 0
  const mirroredX = facingLeft ? -localX : localX
  const rotation = facingLeft ? PI - angle : angle
  return {
    x: screenX + mirroredX * Math.cos(rotation) - localY * Math.sin(rotation),
    y: screenY + mirroredX * Math.sin(rotation) + localY * Math.cos(rotation),
  }
}

/**
 * @param {GamePlayer} player
 * @param {GameModel} model
 * @param {GameView} view
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawPlayer(player, model, view, ctx) {
  if (player._isDead) return
  if (!isDeepEntityVisible(player, model)) return
  const inUnlitDeep =
    model._players.includes(player) &&
    player._pos.y >= 150 &&
    player._pos.x <= 200 &&
    !player._hasLamp &&
    !model._deepNpcs.some((npc) => {
      if (npc._free || !npc._hasLamp) return false
      const dx = npc._pos.x - player._pos.x
      const dy = npc._pos.y - player._pos.y
      return Math.hypot(dx, dy) < 18
    })

  const { x, y, _radius } = resolveEntity(player, model, view)
  const angle = resolveAngle(player, model)
  const lampLit =
    player._hasLamp &&
    player._pos.y >= 150 &&
    player._pos.x >= 0 &&
    player._pos.x <= 200

  ctx.save()
  ctx.globalAlpha = player._opacity
  if (lampLit) {
    const lamp = player._isAngler
      ? getAnglerLampPosition(x, y, _radius, angle)
      : { x, y }
    ctx.globalAlpha *= 0.12
    ctx.fillStyle = "#fef08a"
    ctx.beginPath()
    ctx.arc(lamp.x, lamp.y, 18 * view._scale, 0, TAU)
    ctx.fill()
    ctx.globalAlpha = player._opacity
  }
  if (player._isFriend && !player._isAngler)
    drawFriendMarker(player, ctx, x, y, _radius)
  drawPlayerSprite(player, model, view, ctx, x, y, _radius, angle, inUnlitDeep)
  ctx.restore()
}

/** @param {GamePlayer} friend @param {CanvasRenderingContext2D} ctx @param {number} x @param {number} y @param {number} radius */
function drawFriendMarker(friend, ctx, x, y, radius) {
  if (friend._followingPlayer >= 0) return
  ctx.save()
  ctx.globalAlpha *= 0.8

  const badgeY = y - radius * 1.9
  ctx.beginPath()
  ctx.arc(x, badgeY, radius * 0.72, 0, TAU)
  ctx.fillStyle = "#020617dd"
  ctx.fill()
  ctx.strokeStyle = "#f8fafcdd"
  ctx.lineWidth = Math.max(1, radius * 0.18)
  ctx.stroke()
  ctx.fillStyle = friend._isDistressed
    ? "#facc15"
    : friend._isHelped || friend._isGathered
      ? "#fb7185"
      : "#f8fafc"
  ctx.font = `${radius * 0.9}px emoji`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(
    friend._isDistressed
      ? "😰"
      : friend._isHelped || friend._isGathered
        ? "❤"
        : "💔",
    x,
    badgeY + radius * 0.04,
  )
  ctx.restore()
}

/**
 * @param {GameItem} item
 * @param {GameModel} model
 * @param {GameView} view
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawItem(item, model, view, ctx) {
  if (!isDeepEntityVisible(item, model)) return
  const { x, y, _radius } = resolveEntity(item, model, view)
  ctx.beginPath()
  ctx.arc(x, y, _radius, 0, TAU)
  ctx.closePath()
  ctx.fillStyle = item._color
  ctx.fill()
  ctx.strokeStyle = "#0009"
  ctx.lineWidth = 0.3 * view._scale
  ctx.stroke()
}

/** @param {number} value @param {number} size */
function wrapDelta(value, size) {
  return ((((value + size / 2) % size) + size) % size) - size / 2
}

/** @param {number} value @param {number} size */
function wrapPosition(value, size) {
  return ((value % size) + size) % size
}

/** @param {GamePos} pos @param {GameModel} model */
function isSwimmable(pos, model) {
  if (pos.y >= 0 && pos.y <= model._size) return true
  if (!tunnelIsOpen(model)) return false
  if (pos.y >= 150 && pos.y <= 350 && pos.x >= 0 && pos.x <= 200) return true
  return pos.y > model._size && pos.y < 150 && pos.x >= 40 && pos.x <= 60
}

/** @param {GameModel} model */
function tunnelIsOpen(model) {
  if (!model._tunnelOpened) {
    const anglerActive = model._deepNpcs.some(
      (npc) => npc._isAngler && !npc._free,
    )
    if (areAllFriendsHelped(model) || model._deepReached || anglerActive)
      model._tunnelOpened = true
  }
  return model._tunnelOpened
}

/**
 * Return a waypoint that makes a route between the surface and deep water use
 * the narrow tunnel. The darkfriend and angler both use this because their
 * direct target may be on the other side of the tunnel walls.
 *
 * @param {GamePos} from
 * @param {GamePos} target
 * @returns {GamePos}
 */
export function tunnelWaypoint(from, target) {
  const tunnelX = 50
  const inTunnelX = from.x >= 40 && from.x <= 60
  if (target.y >= 150) {
    if (from.y < 150) {
      if (inTunnelX) return { x: tunnelX, y: 150 }
      return { x: tunnelX, y: from.y <= 100 ? 100 : 150 }
    }
    if (from.y <= 150.5 && !inTunnelX) {
      return { x: tunnelX, y: 150 }
    }
  } else if (target.y <= 100) {
    if (from.y > 100.5) {
      return inTunnelX ? { x: tunnelX, y: 100 } : { x: tunnelX, y: 150 }
    }
    if (from.y >= 99.5 && !inTunnelX) {
      return { x: tunnelX, y: 100 }
    }
  }
  return target
}

/** @param {GameModel} model */
function updateCamera(model) {
  const activePlayers = model._players.filter((player) => !player._free)
  if (activePlayers.length === 0) return
  const first = activePlayers[0]
  if (!first) return
  let targetX = first._pos.x
  let targetY = first._pos.y
  const second = activePlayers[1]
  if (second) {
    const dx = wrapDelta(second._pos.x - first._pos.x, model._worldWidth)
    targetX = wrapPosition(first._pos.x + dx / 2, model._worldWidth)
    targetY = (first._pos.y + second._pos.y) / 2
  }
  model._cameraTarget.x = targetX
  model._cameraTarget.y = targetY
  model._oldCamera = { ...model._camera }
  model._camera.x = wrapPosition(
    model._camera.x +
      wrapDelta(targetX - model._camera.x, model._worldWidth) * 0.12,
    model._worldWidth,
  )
  model._camera.y = lerp(model._camera.y, targetY, 0.12)
  updateSplitCameras(model)
}

/** @param {GameModel} model */
function updateSplitCameras(model) {
  const first = model._players[0]
  const second = model._players[1]
  if (!first || first._free || !second || second._free) return

  const angle = getLocalPlayerAngle(model)
  const directionX = Math.cos(angle)
  const directionY = Math.sin(angle)
  // Match the centers of the two fixed inner circles (87.5% of the bezel
  // diameter), expressed in world units for the camera targets.
  const splitRadius = (model._size * 0.875) / 4
  const distance = getLocalPlayerDistance(model)
  const splitThreshold = model._size * 0.9
  const recenterRange = model._size - splitThreshold
  const recenter = clamp((distance - splitThreshold) / recenterRange, 0, 1)
  const rawBetweenX = wrapPosition(
    first._pos.x +
      wrapDelta(second._pos.x - first._pos.x, model._worldWidth) / 2,
    model._worldWidth,
  )
  const rawBetweenY = (first._pos.y + second._pos.y) / 2
  model._splitMidpoint.x = wrapPosition(
    model._splitMidpoint.x +
      wrapDelta(rawBetweenX - model._splitMidpoint.x, model._worldWidth) * 0.12,
    model._worldWidth,
  )
  model._splitMidpoint.y = lerp(model._splitMidpoint.y, rawBetweenY, 0.12)
  const betweenX = model._splitMidpoint.x
  const betweenY = model._splitMidpoint.y

  for (let i = 0; i < 2; i++) {
    const player = model._players[i]
    if (!player || player._free) continue
    const camera = model._splitCameras[i]
    const oldCamera = model._oldSplitCameras[i]
    if (!camera || !oldCamera) continue

    const side = i === 0 ? -1 : 1
    const centeredTargetX = wrapPosition(
      player._pos.x - side * splitRadius * directionX,
      model._worldWidth,
    )
    const targetX = wrapPosition(
      betweenX +
        wrapDelta(centeredTargetX - betweenX, model._worldWidth) * recenter,
      model._worldWidth,
    )
    const centeredTargetY = player._pos.y - side * splitRadius * directionY
    const targetY = lerp(betweenY, centeredTargetY, recenter)

    oldCamera.x = camera.x
    oldCamera.y = camera.y
    camera.x = wrapPosition(
      camera.x + wrapDelta(targetX - camera.x, model._worldWidth) * 0.12,
      model._worldWidth,
    )
    camera.y = lerp(camera.y, targetY, 0.12)
  }
}

/** @param {GameNarwhalBoss} boss */
function getNarwhalHornTip(boss) {
  return {
    x: boss._pos.x + Math.cos(boss._angle) * boss._radius * 1.8,
    y: boss._pos.y + Math.sin(boss._angle) * boss._radius * 1.8,
  }
}

/** @param {GameNarwhalBoss} boss @param {GamePlayer} player @param {GameModel} model */
function impalePlayer(boss, player, model) {
  player._isImpaled = true
  player._velocity = { x: 0, y: 0 }
  player._inAir = false
  if (model._audio) playAudioImpale(model._audio)
  // The throw itself awards FLUNG in launchImpaledPlayers.
  createExplosion(player._pos, "#facc15", model)
  if (!boss._impaledPlayers.includes(player)) boss._impaledPlayers.push(player)
}

/** @param {GameNarwhalBoss} boss */
function attachImpaledPlayers(boss) {
  const tip = getNarwhalHornTip(boss)
  for (const player of boss._impaledPlayers) {
    const nextPos = {
      x: wrapPosition(tip.x, 700),
      y: Math.max(0, Math.min(100, tip.y)),
    }
    // After the first attachment, interpolate from the previous horn
    // position so the player follows the narwhal's rendered motion.
    const wasAttached = player._oldPos !== null
    player._oldPos = wasAttached ? { ...player._pos } : { ...nextPos }
    player._pos.x = nextPos.x
    player._pos.y = nextPos.y
    player._oldAngle = player._angle
    // The horn enters the fish broadside, so render the impaled fish
    // perpendicular to the narwhal instead of nose-to-tail.
    player._angle = boss._angle + PI / 2
    if (!wasAttached) player._renderAngle = player._angle
  }
}

/** @param {GameModel} model @param {GameNarwhalBoss} boss */
function launchImpaledPlayers(model, boss) {
  if (model._audio) playAudioLaunch(model._audio)
  gameEventPlayerImpaled(model)
  for (const player of boss._impaledPlayers) {
    const target = {
      // Throw to the opposite side from where the narwhal caught the player,
      // rather than the player's old spawn sea.
      x: wrapPosition(player._pos.x + model._worldWidth / 2, model._worldWidth),
      // Players always land on top of the ocean after being thrown.
      y: 0,
    }
    const dx = wrapDelta(target.x - player._pos.x, model._worldWidth)
    // The launch follows this same upward/opposite-side vector, so make the
    // narwhal visibly face the direction it throws.
    const throwAngle =
      Math.sign(dx) === 0 ? -PI / 2 : Math.atan2(-1, Math.sign(dx))
    boss._oldAngle = boss._angle
    boss._angle = throwAngle
    player._airTarget = target
    player._airFlightTicks = 47
    player._inAir = true
    player._oldAirHeight = player._airHeight
    player._airHeight = 0
    player._airVelocity = 2.8
    player._airHorizontalVelocity = dx / player._airFlightTicks
    player._airHeight = 0
    player._dir = { x: Math.sign(dx), y: -1 }
    player._angle = throwAngle
    player._oldAngle = throwAngle
    player._isImpaled = false
  }
  boss._impaledPlayers = []
  boss._isLaunching = true
}

/** @param {GamePlayer} friend @param {GamePos} target @param {GameModel} model */
function moveFriendTowards(friend, target, model) {
  const dx = wrapDelta(target.x - friend._pos.x, model._worldWidth)
  const dy = target.y - friend._pos.y
  const distance = Math.hypot(dx, dy)
  if (distance < 2) return false
  const dir = { x: dx / distance, y: dy / distance }
  friend._oldPos = { ...friend._pos }
  friend._dir = dir
  friend._velocity = dir
  friend._oldAngle = friend._angle
  friend._angle = Math.atan2(dir.y, dir.x)
  const step = Math.min(distance, friend._speed * model._speed)
  friend._pos.x = wrapPosition(friend._pos.x + dir.x * step, model._worldWidth)
  friend._pos.y = Math.max(
    0,
    Math.min(model._size, friend._pos.y + dir.y * step),
  )
  return true
}

/**
 * Return a stable formation target behind a player. The slots fan out from
 * the player's facing direction so followers do not converge on one point.
 *
 * @param {GamePlayer} friend
 * @param {GamePlayer} player
 * @param {Map<number, GamePlayer[]>} followersByPlayer
 * @param {GameModel} model
 * @returns {GamePos}
 */
export function getFriendFollowTarget(
  friend,
  player,
  followersByPlayer,
  model,
) {
  const followers = followersByPlayer.get(player._index) ?? []
  const slot = Math.max(0, followers.indexOf(friend))
  const count = followers.length
  const playerIsStill = player._velocity.x === 0 && player._velocity.y === 0
  if (playerIsStill) {
    const orbitAngle =
      model._simulationTime * 0.006 + (slot / Math.max(1, count)) * TAU
    return {
      x: wrapPosition(
        player._pos.x + Math.cos(orbitAngle) * 8,
        model._worldWidth,
      ),
      y: clamp(player._pos.y + Math.sin(orbitAngle) * 8, 0, model._size),
    }
  }
  const gatherableFriends = model._friends.filter(
    (candidate) => candidate._isFriend && !candidate._isDarkfriend,
  )
  if (
    friend._isDistressed &&
    count === gatherableFriends.length &&
    gatherableFriends.every(
      (candidate) => candidate._followingPlayer === player._index,
    )
  ) {
    const orbitAngle =
      model._simulationTime * 0.012 + (slot / Math.max(1, count)) * TAU
    return {
      x: wrapPosition(
        player._pos.x + Math.cos(orbitAngle) * 10,
        model._worldWidth,
      ),
      y: Math.max(
        0,
        Math.min(model._size, player._pos.y + Math.sin(orbitAngle) * 10),
      ),
    }
  }
  const spread = count <= 1 ? 0 : (slot / (count - 1) - 0.5) * 0.9
  const angle = player._angle + PI + spread
  const distance = 6
  return {
    x: wrapPosition(
      player._pos.x + Math.cos(angle) * distance,
      model._worldWidth,
    ),
    y: Math.max(
      0,
      Math.min(model._size, player._pos.y + Math.sin(angle) * distance),
    ),
  }
}

/**
 * Get a darkfriend's normal formation target while preserving the tunnel
 * route needed when the target is in deep water.
 *
 * @param {GamePlayer} friend
 * @param {GamePlayer} player
 * @param {Map<number, GamePlayer[]>} followersByPlayer
 * @param {GameModel} model
 * @returns {GamePos}
 */
export function getDarkfriendFollowTarget(
  friend,
  player,
  followersByPlayer,
  model,
) {
  const orbitTarget = getFriendFollowTarget(
    friend,
    player,
    followersByPlayer,
    model,
  )
  // Route based on the player's actual depth, not the orbit point. The orbit
  // can bob across the surface/deep boundary and otherwise makes the fish
  // repeatedly reverse at the tunnel entrance.
  // Start routing as soon as the player reaches the tunnel, not only after
  // the player has already entered deep water. This keeps the darkfriend's
  // descent looking like ordinary formation following.
  if (player._pos.y >= 100 && friend._pos.y < 150) {
    const inTunnel = friend._pos.x >= 40 && friend._pos.x <= 60
    if (!inTunnel)
      return {
        x: 50,
        y: friend._pos.y,
      }
    // Give the fish a little clearance below the boundary once it is close
    // enough to otherwise get trapped by floating-point rounding at y=150.
    if (friend._pos.y < 100) return { x: 50, y: 100 }
    return {
      x: 50,
      y: friend._pos.y >= 149.5 ? 151 : Math.min(player._pos.y, 150),
    }
  }
  // The first orbit point after reaching the lower mouth can still be just
  // above the boundary while the player is moving. Keep the fish aimed into
  // deep water instead of sending it back up the tunnel. The shared friend
  // target clamps Y to the surface size, so once the player is deep its Y is
  // no longer useful. Follow the player's actual deep-water depth instead of
  // creating a fixed target around y=200.
  if (player._pos.y >= 150 && friend._pos.y >= 150 && orbitTarget.y < 150) {
    return { x: orbitTarget.x, y: Math.max(151, player._pos.y) }
  }
  const routeTarget = tunnelWaypoint(friend._pos, player._pos)
  if (routeTarget.x !== player._pos.x || routeTarget.y !== player._pos.y)
    return routeTarget
  return orbitTarget
}

/** @param {GameModel} model */
export function updateFriends(model) {
  /** @type {Map<number, GamePlayer[]>} */
  const followersByPlayer = new Map()
  for (const friend of model._friends) {
    if (
      friend._free ||
      !friend._isFriend ||
      friend._isHelped ||
      friend._goingHome ||
      friend._followingPlayer < 0
    )
      continue
    const followers = followersByPlayer.get(friend._followingPlayer) ?? []
    followers.push(friend)
    followersByPlayer.set(friend._followingPlayer, followers)
  }

  for (const friend of model._friends) {
    if (friend._free || !friend._isFriend) continue

    if (friend._isHelped) {
      const dx = wrapDelta(
        friend._friendTarget.x - friend._pos.x,
        model._worldWidth,
      )
      const dy = friend._friendTarget.y - friend._pos.y
      if (Math.hypot(dx, dy) < 2) {
        friend._friendTarget = {
          x: friend._homeSea * model._size + 15 + Math.random() * 70,
          y: 20 + Math.random() * 60,
        }
        continue
      }
      const distance = Math.hypot(dx, dy)
      const dir = { x: dx / distance, y: dy / distance }
      friend._oldPos = { ...friend._pos }
      friend._dir = dir
      friend._velocity = dir
      friend._oldAngle = friend._angle
      friend._angle = Math.atan2(dir.y, dir.x)
      const step = Math.min(distance, friend._speed * model._speed)
      friend._pos.x = wrapPosition(
        friend._pos.x + dir.x * step,
        model._worldWidth,
      )
      friend._pos.y = Math.max(
        0,
        Math.min(model._size, friend._pos.y + dir.y * step),
      )
      continue
    }

    if (friend._followingPlayer < 0) {
      const nearbyPlayers = model._players.filter((candidate) => {
        if (candidate._free || candidate._isImpaled) return false
        const dx = wrapDelta(
          candidate._pos.x - friend._pos.x,
          model._worldWidth,
        )
        return Math.hypot(dx, candidate._pos.y - friend._pos.y) < 9
      })
      const gatheredCounts = new Map()
      for (const candidate of model._friends) {
        if (candidate._followingPlayer >= 0)
          gatheredCounts.set(
            candidate._followingPlayer,
            (gatheredCounts.get(candidate._followingPlayer) ?? 0) + 1,
          )
      }
      const gatherer = nearbyPlayers.sort(
        (a, b) =>
          (gatheredCounts.get(b._index) ?? 0) -
          (gatheredCounts.get(a._index) ?? 0),
      )[0]
      if (gatherer) {
        friend._isFound = true
        friend._isGathered = friend._isDistressed
        friend._followingPlayer = gatherer._index
      } else {
        const currentSea = Math.floor(friend._pos.x / model._size)
        if (!moveFriendTowards(friend, friend._friendTarget, model)) {
          friend._friendTarget = {
            x: currentSea * model._size + 15 + Math.random() * 70,
            y: 15 + Math.random() * 70,
          }
        }
      }
      continue
    }

    let player = model._players[friend._followingPlayer]
    if (!player || player._free || player._isDead) {
      friend._followingPlayer = -1
      continue
    }
    if (friend._isDistressed) {
      const followingPlayerIndex = player._index
      const nearbyPlayers = model._players.filter((candidate) => {
        if (candidate._free || candidate._isImpaled) return false
        const dx = wrapDelta(
          candidate._pos.x - friend._pos.x,
          model._worldWidth,
        )
        return Math.hypot(dx, candidate._pos.y - friend._pos.y) < 9
      })
      const currentCount = model._friends.filter(
        (candidate) => candidate._followingPlayer === followingPlayerIndex,
      ).length
      const gatherer = nearbyPlayers.sort(
        (a, b) =>
          model._friends.filter(
            (candidate) => candidate._followingPlayer === b._index,
          ).length -
          model._friends.filter(
            (candidate) => candidate._followingPlayer === a._index,
          ).length,
      )[0]
      if (
        gatherer &&
        gatherer._index !== player._index &&
        model._friends.filter(
          (candidate) => candidate._followingPlayer === gatherer._index,
        ).length > currentCount
      ) {
        friend._followingPlayer = gatherer._index
        player = gatherer
      }
    }
    const sea = Math.min(
      6,
      Math.floor(wrapPosition(player._pos.x, model._worldWidth) / model._size),
    )
    const isHome =
      !friend._isDistressed &&
      !friend._isDarkfriend &&
      sea === friend._homeSea &&
      player._pos.y <= model._size
    if (isHome && !friend._goingHome) {
      friend._goingHome = true
      friend._friendTarget = {
        x: friend._homeSea * model._size + 50,
        y: 55,
      }
    }
    if (friend._isDarkfriend && friend._pos.y >= 150) {
      friend._hasLamp = true
    }
    if (friend._isDarkfriend && friend._pos.y >= 300) {
      friend._isFriend = false
      friend._isAngler = true
      friend._isHelped = true
      friend._followingPlayer = -1
      friend._radius = 10
      gameEventHunted(model)
      createExplosion(friend._pos, "#ef4444", model)
      // The angler becomes a fast hunter once it has been found.
      friend._speed = 0.45
      friend._hasLamp = false
      friend._lampTimer = 200
      const angler = /** @type {GameAnglerFish} */ (friend)
      angler._nextPos = { x: 100, y: 335 }
      model._deepNpcs[0] = angler
      continue
    }
    if (friend._goingHome) {
      const homeDx = wrapDelta(
        friend._friendTarget.x - friend._pos.x,
        model._worldWidth,
      )
      const homeDy = friend._friendTarget.y - friend._pos.y
      if (Math.hypot(homeDx, homeDy) < 8) {
        gameEventFriendRescued(model)
        friend._isHelped = true
        friend._followingPlayer = -1
        friend._goingHome = false
        friend._velocity = { x: 0, y: 0 }
        continue
      }
    }

    let targetPos = friend._goingHome
      ? friend._friendTarget
      : getFriendFollowTarget(friend, player, followersByPlayer, model)
    if (friend._isDarkfriend && !friend._goingHome) {
      // Follow the same orbit formation as regular friends. Only replace the
      // orbit target with a tunnel waypoint while changing between surface
      // and deep water, so the darkfriend resumes circling once it arrives.
      targetPos = getDarkfriendFollowTarget(
        friend,
        player,
        followersByPlayer,
        model,
      )
    }
    const dx = wrapDelta(targetPos.x - friend._pos.x, model._worldWidth)
    const dy = targetPos.y - friend._pos.y
    const distance = Math.hypot(dx, dy)
    if (distance === 0) continue
    const dir = { x: dx / distance, y: dy / distance }
    friend._oldPos = { ...friend._pos }
    friend._dir = dir
    friend._velocity = dir
    friend._oldAngle = friend._angle
    friend._angle = Math.atan2(dir.y, dir.x)
    const step = Math.min(distance, friend._speed * model._speed)
    let nextX = wrapPosition(friend._pos.x + dir.x * step, model._worldWidth)
    const maxY = friend._isDarkfriend ? 350 : model._size
    let nextY = Math.max(0, Math.min(maxY, friend._pos.y + dir.y * step))

    if (friend._isDarkfriend) {
      // The tunnel is only 20 units wide. Move on one axis at a time while
      // entering or leaving it so the fish cannot cut through a wall at a
      // diagonal or get stuck straddling the mouth.
      const inTunnelDepth = friend._pos.y >= 100 && friend._pos.y < 150
      const outsideTunnel = friend._pos.x < 40 || friend._pos.x > 60
      if (inTunnelDepth && outsideTunnel) {
        nextX = wrapPosition(
          friend._pos.x + clamp(50 - friend._pos.x, -step, step),
          model._worldWidth,
        )
        nextY = friend._pos.y
      } else if (inTunnelDepth && !outsideTunnel) {
        nextX = friend._pos.x
      }
    }

    friend._pos.x = nextX
    friend._pos.y = nextY
  }

  const gatherableFriends = model._friends.filter(
    (friend) => friend._isFriend && !friend._isDarkfriend,
  )
  const fishAreAfraid = gatherableFriends.every(
    (friend) => friend._isDistressed,
  )
  for (const player of model._players) {
    if (
      !player._free &&
      !player._isNarwhal &&
      gatherableFriends.length > 0 &&
      fishAreAfraid &&
      gatherableFriends.every(
        (friend) => friend._followingPlayer === player._index,
      )
    ) {
      transformPlayerToNarwhal(player, model)
    }
  }

  if (!model._friendsComplete && areAllFriendsHelped(model)) {
    model._friendsComplete = true
    gameEventSchoolComplete(model)
    const boss = model._bosses[0]
    if (boss) boss._free = false
  }
}

/** @param {GameModel} model */
function distressFriends(model) {
  for (const friend of model._friends) {
    if (friend._free || !friend._isFriend || friend._isDarkfriend) continue
    friend._isHelped = false
    friend._isDistressed = true
    friend._isGathered = false
    friend._isFound = false
    friend._followingPlayer = -1
    friend._goingHome = false
  }
}

/** @param {GamePlayer} player @param {GameModel} model */
function transformPlayerToNarwhal(player, model) {
  player._isNarwhal = true
  player._hasHorn = true
  player._isBoss = true
  player._radius = 9
  gameEventPlayerPromoted(model)
  if (
    model._players.length > 1 &&
    model._players.every((candidate) => candidate._isNarwhal)
  )
    gameEventNarwhals(model)
  createExplosion(player._pos, "#67e8f9", model)
}

/** @param {GameModel} model */
function updateNarwhals(model) {
  for (const boss of model._bosses) {
    if (boss._free) continue

    if (boss._isLaunching) {
      boss._oldPos = { ...boss._pos }
      boss._pos.y -= boss._speed * model._speed * 12
      boss._velocity = { x: 0, y: -1 }
      boss._dir = { x: 0, y: -1 }
      boss._oldAngle = boss._angle
      boss._angle = -PI / 2
      if (boss._pos.y <= -30) boss._isLaunching = false
      continue
    }

    const hasImpaledPlayers = boss._impaledPlayers.length > 0
    // Once the narwhal has caught anyone, it must finish the throw before
    // considering another player. Otherwise two-player mode can make it
    // abandon the escape run and repeatedly switch targets.
    const playerTarget = hasImpaledPlayers
      ? undefined
      : model._players.find((player) => !player._free && !player._isImpaled)
    const nearPlayer =
      playerTarget &&
      Math.hypot(
        playerTarget._pos.x - boss._pos.x,
        playerTarget._pos.y - boss._pos.y,
      ) < 32
    boss._isThrusting = Boolean(nearPlayer && !hasImpaledPlayers)
    const racingToEdge = hasImpaledPlayers && !playerTarget
    const target = racingToEdge
      ? { _pos: { x: model._size, y: 0 } }
      : playerTarget
    if (!target) {
      continue
    }

    // The boss can only chase within the red ocean.
    const targetX = Math.max(0, Math.min(model._size, target._pos.x))
    const targetY = Math.max(0, Math.min(model._size, target._pos.y))
    const dx = targetX - boss._pos.x
    const dy = targetY - boss._pos.y
    const distance = Math.hypot(dx, dy)
    boss._oldPos = { ...boss._pos }
    if (distance === 0) {
      boss._velocity = { x: 0, y: 0 }
    } else {
      const dir = { x: dx / distance, y: dy / distance }
      boss._dir = dir
      boss._velocity = dir
      boss._oldAngle = boss._angle
      boss._angle = Math.atan2(dir.y, dir.x)
      const step = Math.min(
        distance,
        boss._speed *
          model._speed *
          (hasImpaledPlayers ? 12 : nearPlayer ? 3 : 1),
      )
      boss._pos.x = Math.max(
        0,
        Math.min(model._size, boss._pos.x + dir.x * step),
      )
      boss._pos.y = Math.max(
        0,
        Math.min(model._size, boss._pos.y + dir.y * step),
      )
    }

    attachImpaledPlayers(boss)
    const tip = getNarwhalHornTip(boss)
    const impaledCount = boss._impaledPlayers.length
    for (const player of model._players) {
      if (player._free || player._isImpaled) continue
      const playerDx = wrapDelta(player._pos.x - tip.x, model._worldWidth)
      const playerDy = player._pos.y - tip.y
      const thrustHitDistance = boss._radius + player._radius + 4
      if (
        boss._isThrusting &&
        Math.hypot(playerDx, playerDy) <= thrustHitDistance
      ) {
        impalePlayer(boss, player, model)
        player._airHeight = 1.5
        player._oldAirHeight = 0
      }
    }

    if (boss._impaledPlayers.length > impaledCount) {
      attachImpaledPlayers(boss)
    }
    // Release as soon as the horn reaches open air; the narwhal's body can
    // continue racing upward separately.
    if (racingToEdge && getNarwhalHornTip(boss).y <= 0) {
      launchImpaledPlayers(model, boss)
    }
  }
}

/** @param {GameModel} model */
export function updateDeepNpcs(model) {
  for (const npc of model._deepNpcs) {
    if (npc._isDead) {
      npc._respawnTimer -= model._interval
      if (npc._respawnTimer <= 0) {
        npc._isDead = false
        npc._free = false
        npc._pos = {
          x: Math.random() * 200,
          y: 300 + Math.random() * 45,
        }
        npc._nextPos = { x: 100, y: 335 }
        npc._isHunting = true
      }
      continue
    }
    if (npc._free) continue
    const wasInDeep = npc._pos.y >= 150
    if (npc._lampTimer > 0) {
      npc._lampTimer -= model._interval
      if (npc._lampTimer <= 0) {
        npc._hasLamp = true
        npc._isHunting = true
      }
    }

    let target = npc._nextPos
    if (npc._isHunting) {
      let player
      let nearestDistance = Infinity
      for (const candidate of model._players) {
        if (
          candidate._free ||
          candidate._isDead ||
          !isSwimmable(candidate._pos, model)
        ) {
          continue
        }
        const nearDx = wrapDelta(
          candidate._pos.x - npc._pos.x,
          model._worldWidth,
        )
        const nearDy = candidate._pos.y - npc._pos.y
        const distance = Math.hypot(nearDx, nearDy)
        if (distance < 32 && model._audio) playAudioNear(model._audio)
        if (distance < nearestDistance) {
          nearestDistance = distance
          player = candidate
        }
      }
      if (player) {
        target = player._pos
        const dx = wrapDelta(player._pos.x - npc._pos.x, model._worldWidth)
        const dy = player._pos.y - npc._pos.y
        if (Math.hypot(dx, dy) < 7) {
          player._isDead = true
          model._eaten++
          gameEventPlayerDigested(model)
          createExplosion(player._pos, "#f87171", model)
          releaseFollowers(model, player._index)
          player._respawnTimer = PLAYER_RESPAWN_DELAY
          player._velocity = { x: 0, y: 0 }
          player._inAir = false
          player._airTarget = null
          player._hasLamp = false
          if (model._audio) playAudioEaten(model._audio)
          if (model._audio) playAudioImpale(model._audio)
        }
      } else {
        const friend = model._friends.find(
          (candidate) =>
            candidate._isFriend &&
            !candidate._isDarkfriend &&
            !candidate._free &&
            Math.hypot(
              wrapDelta(candidate._pos.x - npc._pos.x, model._worldWidth),
              candidate._pos.y - npc._pos.y,
            ) < 60,
        )
        if (friend) target = friend._pos
      }
    }
    const dx = target.x - npc._pos.x
    const dy = target.y - npc._pos.y
    const distance = Math.hypot(dx, dy)
    if (distance < 1) {
      npc._nextPos = {
        x: Math.random() * model._worldWidth,
        y: Math.random() * model._size,
      }
      continue
    }
    target = tunnelWaypoint(npc._pos, target)
    const routeDx = wrapDelta(target.x - npc._pos.x, model._worldWidth)
    const routeDy = target.y - npc._pos.y
    const routeDistance = Math.hypot(routeDx, routeDy)
    // Keep steering anglers onto the tunnel centre even when the remaining
    // waypoint distance is less than the normal one-pixel cutoff.
    if (routeDistance < (npc._isAngler ? 0.01 : 1)) continue
    const dir = { x: routeDx / routeDistance, y: routeDy / routeDistance }
    const speed = npc._isHunting
      ? npc._speed * 8
      : npc._hasLamp
        ? npc._speed * 2
        : npc._speed
    const step = Math.min(routeDistance, speed * model._speed)
    let next = {
      x: wrapPosition(npc._pos.x + dir.x * step, model._worldWidth),
      y: Math.max(0, Math.min(model._worldHeight, npc._pos.y + dir.y * step)),
    }
    if (npc._isAngler) {
      // The angler is wider than the tunnel. Center it before changing depth
      // and move one axis at a time so a diagonal step cannot wedge it on a
      // wall or leave it oscillating at the entrance.
      const inTransition = npc._pos.y >= 100 && npc._pos.y <= 150
      const centeredInTunnel = Math.abs(npc._pos.x - 50) < 0.01
      if (inTransition && !centeredInTunnel) {
        next = {
          x: wrapPosition(
            npc._pos.x + clamp(50 - npc._pos.x, -step, step),
            model._worldWidth,
          ),
          y: npc._pos.y,
        }
      } else if (inTransition && centeredInTunnel) {
        next = { x: npc._pos.x, y: npc._pos.y + dir.y * step }
      }
    }
    if (!isSwimmable(next, model)) {
      // Enter the tunnel horizontally before descending if the direct
      // diagonal step crosses its walls. This is also the recovery path for
      // an angler that was spawned just outside the tunnel mouth.
      const inTunnelApproach =
        npc._pos.y >= 100 &&
        npc._pos.y <= 150 &&
        Math.abs(npc._pos.x - 50) >= 0.01
      if (npc._isAngler && inTunnelApproach) {
        next = {
          x: wrapPosition(
            npc._pos.x + clamp(50 - npc._pos.x, -step, step),
            model._worldWidth,
          ),
          y: npc._pos.y,
        }
      } else {
        const horizontal = { x: next.x, y: npc._pos.y }
        const vertical = { x: npc._pos.x, y: next.y }
        if (isSwimmable(horizontal, model)) next = horizontal
        else if (isSwimmable(vertical, model)) next = vertical
        else {
          npc._velocity = { x: 0, y: 0 }
          continue
        }
      }
    }
    npc._oldPos = { ...npc._pos }
    npc._dir = dir
    npc._velocity = dir
    npc._oldAngle = npc._angle
    npc._angle = Math.atan2(dir.y, dir.x)
    npc._pos.x = next.x
    npc._pos.y = next.y
    if (npc._isAngler && wasInDeep && npc._pos.y < 150) {
      distressFriends(model)
    }
    if (npc._isAngler) handleAnglerCollisions(npc, model)
  }
}

/** @param {GamePlayer} friend @param {GameModel} model */
function respawnFriend(friend, model) {
  const currentSea = Math.floor(
    wrapPosition(friend._pos.x, model._worldWidth) / model._size,
  )
  let sea = Math.floor(Math.random() * 7)
  if (sea === currentSea) sea = (sea + 1) % 7
  friend._pos = {
    x: sea * model._size + 15 + Math.random() * 70,
    y: 15 + Math.random() * 70,
  }
  friend._oldPos = null
  friend._friendTarget = { ...friend._pos }
  friend._isHelped = false
  friend._isFound = false
  friend._isDistressed = true
  friend._isGathered = false
  friend._followingPlayer = -1
  friend._goingHome = false
}

/** @param {GameModel} model @param {number} playerIndex */
function releaseFollowers(model, playerIndex) {
  for (const friend of model._friends) {
    if (friend._followingPlayer === playerIndex) friend._followingPlayer = -1
  }
}

/** @param {GameAnglerFish} angler @param {GameModel} model */
function handleAnglerCollisions(angler, model) {
  for (const friend of model._friends) {
    if (
      !friend._isFriend ||
      friend._isDarkfriend ||
      friend._free ||
      friend._followingPlayer >= 0 ||
      Math.hypot(
        wrapDelta(friend._pos.x - angler._pos.x, model._worldWidth),
        friend._pos.y - angler._pos.y,
      ) >
        angler._radius + friend._radius
    )
      continue
    respawnFriend(friend, model)
    gameEventLoss(model)
    if (model._audio) playAudioFriendEaten(model._audio)
  }

  for (const player of model._players) {
    if (player._free || player._isDead || player._isImpaled) continue
    const dx = wrapDelta(angler._pos.x - player._pos.x, model._worldWidth)
    const dy = angler._pos.y - player._pos.y
    if (Math.hypot(dx, dy) > angler._radius + player._radius) continue
    if (player._isNarwhal && player._hasHorn) {
      const facing = { x: Math.cos(player._angle), y: Math.sin(player._angle) }
      const distance = Math.hypot(dx, dy)
      const aimed =
        distance > 0 && (facing.x * dx + facing.y * dy) / distance > 0.45
      if (aimed) {
        pierceAngler(angler, model)
        return
      }
      player._hasHorn = false
      player._isNarwhal = false
      player._isBoss = false
      gameEventPlayerToothless(model)
      player._radius = 5
      player._isDead = true
      model._eaten++
      gameEventPlayerDigested(model)
      createExplosion(player._pos, "#67e8f9", model)
      releaseFollowers(model, player._index)
      player._respawnTimer = PLAYER_RESPAWN_DELAY
      player._velocity = { x: 0, y: 0 }
      if (model._audio) playAudioEaten(model._audio)
    } else {
      player._isDead = true
      model._eaten++
      gameEventPlayerDigested(model)
      createExplosion(player._pos, "#f87171", model)
      releaseFollowers(model, player._index)
      player._respawnTimer = PLAYER_RESPAWN_DELAY
      player._velocity = { x: 0, y: 0 }
      if (model._audio) playAudioEaten(model._audio)
    }
  }
}

/** @param {GameAnglerFish} angler @param {GameModel} model */
export function pierceAngler(angler, model) {
  model._pierced++
  if (model._deepNpcs.length < 2) {
    const second = new GameAnglerFish()
    second._free = false
    second._isHunting = true
    second._hasLamp = true
    second._pos = { x: Math.random() * 200, y: 300 + Math.random() * 45 }
    second._nextPos = { x: 100, y: 335 }
    model._deepNpcs.push(second)
  }
  angler._isDead = true
  angler._respawnTimer = 1800
  angler._isHunting = false
  angler._velocity = { x: 0, y: 0 }
  if (model._audio) playAudioImpale(model._audio)
  createExplosion(angler._pos, "#f8fafc", model)
}

/** @param {GameModel} model */
function spawnDeepStar(model) {
  if (model._items.some((item) => !item._free && item._isStar)) return
  const star = new GameItem()
  star._isStar = true
  star._free = false
  star._color = "#facc15"
  star._pos = { x: Math.random() * 200, y: 300 + Math.random() * 45 }
  model._items.push(star)
}

/** @param {GameModel} model */
export function updateLampInteractions(model) {
  const angler = model._deepNpcs.some((npc) => npc._isAngler && !npc._free)
  const inDeep = model._players.some(
    (player) =>
      !player._free &&
      !player._isDead &&
      player._pos.y >= 150 &&
      player._pos.x >= 0 &&
      player._pos.x <= 200,
  )
  if (model._wasDeep && !inDeep && angler) spawnDeepStar(model)
  model._wasDeep = inDeep

  for (const star of model._items) {
    if (star._free || !star._isStar) continue
    const player = model._players.find(
      (candidate) =>
        !candidate._free &&
        !candidate._isDead &&
        candidate._pos.y >= 150 &&
        Math.hypot(
          wrapDelta(candidate._pos.x - star._pos.x, model._worldWidth),
          candidate._pos.y - star._pos.y,
        ) <
          candidate._radius + star._radius,
    )
    if (!player) continue
    star._free = true
    model._stars++
    player._turboBonus++
    player._turboEnergy = Math.min(
      TURBO_MAX_ENERGY + player._turboBonus,
      player._turboEnergy + 1,
    )
    if (model._audio) playAudioPickup(model._audio)
  }
}

/** @param {GameEntity} entity @param {GameModel} model */
function isDeepEntityVisible(entity, model) {
  if (entity._pos.y < 150 || entity._pos.x > 200) return true
  if (model._players.some((player) => player === entity)) return true
  const carriers = model._players.filter(
    (player) => !player._free && player._hasLamp,
  )
  if (entity instanceof GamePlayer && entity._hasLamp) return true
  return carriers.some((player) => {
    const dx = wrapDelta(entity._pos.x - player._pos.x, model._worldWidth)
    const dy = entity._pos.y - player._pos.y
    return Math.hypot(dx, dy) < 18
  })
}

/** @param {GamePlayer} player @param {boolean} turbo @param {GameModel} model */
function startJump(player, turbo = false, model) {
  player._inAir = true
  player._airTarget = null
  player._airFlightTicks = 0
  const horizontalDirection = Math.sign(player._dir.x)
  if (horizontalDirection !== 0 && player._pos.y <= 0)
    gameEventPlayerFlew(model)
  const jumpSpeed = turbo ? 2.4 : 1.6
  player._airVelocity = turbo ? 1.8 : 1.6
  player._airHorizontalVelocity = horizontalDirection * jumpSpeed
  player._oldAirHeight = player._airHeight
  player._dir = { x: horizontalDirection, y: -1 }
  player._oldAngle = player._angle
  player._angle =
    horizontalDirection === 0 ? -PI / 2 : Math.atan2(-1, horizontalDirection)
}

/** @param {GamePlayer} player @param {GameModel} model */
function updateJump(player, model) {
  player._oldPos = { ...player._pos }
  player._oldAirHeight = player._airHeight
  player._airHeight += player._airVelocity
  player._airVelocity -= 0.12
  if (player._airTarget) {
    const ticks = Math.max(1, player._airFlightTicks)
    const dx = wrapDelta(player._airTarget.x - player._pos.x, model._worldWidth)
    const dy = player._airTarget.y - player._pos.y
    player._airHorizontalVelocity = dx / ticks
    player._pos.x = wrapPosition(player._pos.x + dx / ticks, model._worldWidth)
    player._pos.y += dy / ticks
    player._airFlightTicks--
  } else {
    player._pos.x = wrapPosition(
      player._pos.x + player._airHorizontalVelocity,
      model._worldWidth,
    )
  }

  if (player._airHeight <= 0 && player._airVelocity < 0) {
    player._airHeight = 0
    player._airVelocity = 0
    player._airHorizontalVelocity = 0
    player._inAir = false
    if (player._airTarget) {
      player._pos.x = player._airTarget.x
      player._pos.y = player._airTarget.y
      player._airTarget = null
      player._airFlightTicks = 0
    }
    player._dir = { x: Math.sign(player._dir.x), y: 0 }
    player._oldAngle = player._angle
    player._angle = player._dir.x === 0 ? 0 : Math.atan2(0, player._dir.x)
    return
  }

  player._dir = {
    x: Math.sign(player._airHorizontalVelocity),
    y: player._airVelocity >= 0 ? -1 : 1,
  }
  player._oldAngle = player._angle
  player._angle =
    player._dir.x === 0
      ? player._dir.y < 0
        ? -PI / 2
        : PI / 2
      : Math.atan2(player._dir.y, player._dir.x)
}

/**
 * @param {GameModel} model
 * @param {GameInput[]} inputs
 */
export function update(model, inputs) {
  const playersSeparated = getLocalPlayerDistance(model) > model._size * 0.9
  if (playersSeparated && !model._wasSeparated) gameEventPlayerAlone(model)
  if (!playersSeparated && model._wasSeparated) gameEventPlayersTogether(model)
  model._wasSeparated = playersSeparated

  // Keep the control visualization independent of which input device is
  // active, including before an optional second player has spawned.
  for (let i = 0; i < 2; i++) {
    const velocity = inputs[i]?._velocity
    const movement = velocity && Math.hypot(velocity.x, velocity.y)
    const inputSource = inputs[i]?._source
    if (inputSource) model._gearInputTypes[i] = inputSource
    if (movement && movement > 0) {
      model._oldGearAngles[i] = model._gearAngles[i] ?? 0
      model._gearMovement[i] = {
        x: velocity.x / movement,
        y: velocity.y / movement,
      }
      model._gearAngles[i] = Math.atan2(velocity.y, velocity.x)
    } else {
      model._gearMovement[i] = undefined
    }
  }

  const secondInput = inputs[1]
  const secondPlayer = model._players[1]
  if (model._player2Enabled && hasPlayerInput(secondInput)) {
    const player =
      secondPlayer && !secondPlayer._free
        ? secondPlayer
        : createLocalPlayer(model, 1)
    player._inputIdleTime = 0
  }

  for (let i = 0, n = model._players.length; i < n; i++) {
    const player = model._players[i]
    if (!player || player._free || player._isImpaled) continue
    if (player._pos.y >= model._worldHeight && !model._bottomReached) {
      model._bottomReached = true
      gameEventDeepReached(model)
    }

    if (player._isDead) {
      player._respawnTimer -= model._interval
      // Skip update while dead
      if (player._respawnTimer > 0) continue

      const respawnPoint = randomSeaSpawn(model)
      Object.assign(player._pos, respawnPoint)
      player._spawnPoint = { ...respawnPoint }
      player._oldPos = null
      player._oldAngle = player._angle
      player._renderAngle = player._angle
      player._velocity = { x: 0, y: 0 }
      player._turboEnergy = TURBO_MAX_ENERGY
      player._airHeight = 0
      player._oldAirHeight = 0
      player._airHorizontalVelocity = 0
      player._inAir = false
      player._isDead = false
      player._respawnTimer = 0
    }

    player._oldPos = null
    player._oldAirHeight = player._airHeight
    const input = inputs[i]
    const turboRequested = Boolean(input?._turbo)

    if (i === 1 && hasPlayerInput(input)) player._inputIdleTime = 0

    if (
      !player._inAir &&
      input?._velocity &&
      input._velocity.y < 0 &&
      player._pos.y <= 0
    ) {
      const turbo = turboRequested && player._turboEnergy > 0
      startJump(player, turbo, model)
      updateTurboEnergy(player, turbo, turboRequested, model._interval)
    }

    if (player._inAir) {
      if (!input?._velocity?.y) {
        updateTurboEnergy(player, false, turboRequested, model._interval)
      }
      player._velocity = { x: 0, y: 0 }
      updateJump(player, model)
      continue
    }

    // Apply movement only while an input direction is held.
    if (input?._velocity) {
      const turbo = turboRequested && player._turboEnergy > 0
      applyVelocity(input._velocity, player, model, turbo ? 2.5 : 1)
      createSwimTrail(model, player, input._velocity, turbo)
      updateTurboEnergy(player, turbo, turboRequested, model._interval)
      if (input._velocity.x !== 0 || input._velocity.y !== 0) {
        if (model._audio) playAudioSwim(model._audio)
      }
    } else {
      updateTurboEnergy(player, false, turboRequested, model._interval)
      player._velocity = { x: 0, y: 0 }
    }
  }
  for (const remote of model._backgroundPlayers) {
    if (remote._free) continue
    remote._oldPos = { ...remote._pos }
    const dx = wrapDelta(remote._nextPos.x - remote._pos.x, model._worldWidth)
    const dy = remote._nextPos.y - remote._pos.y
    const distance = Math.hypot(dx, dy)
    if (distance > 0) {
      remote._dir = { x: dx / distance, y: dy / distance }
      remote._oldAngle = remote._angle
      remote._angle = Math.atan2(dy, dx)
      const step = Math.min(distance, remote._speed * model._speed)
      remote._pos.x = wrapPosition(
        remote._pos.x + (dx / distance) * step,
        model._worldWidth,
      )
      remote._pos.y += (dy / distance) * step
    }
  }
  // Update _particles
  for (const particle of model._particles) {
    if (particle._free) continue
    particle._lifetime += model._interval
    if (particle._lifetime >= particle._maxLifetime) {
      particle._free = true
      continue
    }
    particle._oldPos = null
    if (particle._velocity) {
      applyVelocity(particle._velocity, particle, model)
    }
  }
}

/**
 * Create explosion _particles at a position
 * @param {GamePos} pos
 * @param {string} color
 * @param {GameModel} model
 */
export function createExplosion(pos, color, model) {
  const particleCount = 15
  for (let i = 0; i < particleCount; i++) {
    const particle = getFree(model._particles)
    if (particle) {
      particle._pos = { ...pos }
      particle._oldPos = null
      particle._color = color
      particle._isSpeedLine = false
      particle._lifetime = 0
      particle._free = false
      // Random _velocity in all directions
      const angle = Math.random() * TAU
      const _speed = 1 + Math.random() * 2
      particle._velocity = {
        x: Math.cos(angle) * _speed,
        y: Math.sin(angle) * _speed,
      }
    }
  }
}

/**
 * @param {GameParticle} particle
 * @param {GameModel} model
 * @param {GameView} view
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawParticle(particle, model, view, ctx) {
  if (!isDeepEntityVisible(particle, model)) return
  const { x, y, _radius } = resolveEntity(particle, model, view)
  // Calculate alpha based on _lifetime (fade out)
  const alpha = 1.0 - particle._lifetime / particle._maxLifetime

  ctx.globalAlpha = alpha
  ctx.strokeStyle = particle._color
  ctx.fillStyle = particle._color
  if (particle._isSpeedLine) {
    const length = particle._trailLength * view._scale
    const dx = Math.cos(particle._trailAngle) * length
    const dy = Math.sin(particle._trailAngle) * length
    ctx.lineWidth = Math.max(0.7, _radius * 0.65)
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(x - dx, y - dy)
    ctx.lineTo(x + dx, y + dy)
    ctx.stroke()
    ctx.lineCap = "butt"
  } else {
    ctx.beginPath()
    ctx.arc(x, y, _radius, 0, TAU)
    ctx.closePath()
    ctx.fill()
  }
  ctx.globalAlpha = 1.0
}

/**
 * @param {GameVelocity} _velocity
 * @param {GameEntity} entity
 * @param {GameModel} model
 * @param {number} [speedMultiplier]
 */
export function applyVelocity(_velocity, entity, model, speedMultiplier = 1) {
  if (_velocity.x !== 0 || _velocity.y !== 0) {
    entity._dir = { ..._velocity }
    entity._oldAngle = entity._angle
    if (_velocity.x === 0) {
      entity._angle = _velocity.y < 0 ? -PI / 2 : PI / 2
    } else {
      entity._angle = Math.atan2(_velocity.y, _velocity.x)
    }
  }

  const dx = _velocity.x * entity._speed * model._speed * speedMultiplier
  const dy = _velocity.y * entity._speed * model._speed * speedMultiplier
  let x = wrapPosition(entity._pos.x + dx, model._worldWidth)
  let y = Math.max(0, Math.min(model._worldHeight, entity._pos.y + dy))
  // Wrap horizontally around the full world; clamp the ocean surface/bottom.
  if (!isSwimmable({ x, y }, model)) {
    const horizontal = { x, y: entity._pos.y }
    const vertical = { x: entity._pos.x, y }
    if (isSwimmable(horizontal, model)) x = horizontal.x
    else x = entity._pos.x
    if (isSwimmable(vertical, model)) y = vertical.y
    else y = entity._pos.y
  }
  entity._oldPos = { ...entity._pos }
  Object.assign(entity._velocity, _velocity)
  Object.assign(entity._pos, { x, y })
}

/**
 * @param {GamePos} _pos
 * @param {GameView} view
 */
export function resolvePos(_pos, view) {
  return {
    x: view._offset.x + _pos.x * view._scale,
    y: view._offset.y + _pos.y * view._scale,
  }
}

/**
 * @param {GamePos} _pos
 * @param {GameModel} model
 * @param {GameView} view
 */
function resolveWorldPos(_pos, model, view) {
  const x =
    view._offset.x +
    view._size / 2 +
    wrapDelta(_pos.x - model._renderCamera.x, model._worldWidth) * view._scale
  const y =
    view._offset.y +
    view._size / 2 +
    (_pos.y - model._renderCamera.y) * view._scale
  return { x, y }
}

/**
 * @param {GameEntity} entity
 * @param {GameModel} model
 * @param {GameView} view
 */
export function resolveEntity(entity, model, view) {
  let { x, y } = resolveWorldPos(entity._pos, model, view)
  if (entity._oldPos) {
    // Detect world wrapping before interpolating between simulation ticks.
    const dx = Math.abs(entity._pos.x - entity._oldPos.x)
    const dy = Math.abs(entity._pos.y - entity._oldPos.y)
    const wrappedX = dx > model._worldWidth / 2
    const wrappedY = dy > model._worldHeight / 2

    if (wrappedY) {
      // Vertical movement is clamped, so a large jump is a real reposition.
      ;({ x, y } = resolveWorldPos(entity._pos, model, view))
    } else {
      const t = model._frameTime
      const interpolated = {
        // Unwrap the short path before interpolating. This turns 699 -> 0
        // into 699 -> 700 instead of skipping a rendered frame at the seam.
        x: wrappedX
          ? entity._oldPos.x +
            wrapDelta(entity._pos.x - entity._oldPos.x, model._worldWidth) * t
          : lerp(entity._oldPos.x, entity._pos.x, t),
        y: lerp(entity._oldPos.y, entity._pos.y, t),
      }
      ;({ x, y } = resolveWorldPos(interpolated, model, view))
    }
  }
  const airHeight = lerp(
    entity._oldAirHeight,
    entity._airHeight,
    model._frameTime,
  )
  y -= airHeight * view._scale
  if (entity instanceof GamePlayer) {
    const phase = entity._index * 1.7
    const wave =
      Math.sin(model._simulationTime * entity._swimWaveSpeed + phase) *
      entity._swimWaveAmplitude *
      view._scale
    // Sway perpendicular to the fish's heading, rather than always moving
    // vertically. This makes the same animation read naturally in any
    // direction and remains purely visual.
    x -= Math.sin(entity._renderAngle) * wave
    y += Math.cos(entity._renderAngle) * wave
  }
  let _radius = entity._radius * view._scale
  return { x, y, _radius }
}

/**
 * @param {GameEntity} entity
 * @param {GameModel} model
 */
export function resolveAngle(entity, model) {
  let target = entity._angle
  if (entity._oldPos) {
    const delta =
      ((((entity._angle - entity._oldAngle + PI) % TAU) + TAU) % TAU) - PI
    // Interpolate the simulation tick on the shortest path. Exact reversals
    // are allowed to turn smoothly instead of choosing a random side.
    if (Math.abs(delta) < PI) {
      target = lerpAngle(entity._oldAngle, entity._angle, model._frameTime)
    }
  }

  // A second, small render-only filter prevents quick input/dead-zone changes
  // from making the fish visibly alternate between two headings.
  if (!Number.isFinite(entity._renderAngle)) entity._renderAngle = target
  entity._renderAngle = lerpAngle(entity._renderAngle, target, 0.45)
  return entity._renderAngle
}

/**
 * Interpolate between angles using the shortest rotation direction.
 * @param {number} a
 * @param {number} b
 * @param {number} t
 */
export function lerpAngle(a, b, t) {
  const delta = ((((b - a + PI) % TAU) + TAU) % TAU) - PI
  return a + delta * t
}

/**
 * @param {number} [oldAngle]
 * @returns {number}
 */
export function randomAngle(oldAngle) {
  if (!oldAngle) return Math.random() * TAU
  const _offset = Math.random() * PI * 0.25 - PI * 0.125
  return (oldAngle + _offset + TAU) % TAU
}

/**
 * @param {GameVelocity} [oldVelocity]
 * @returns {GameVelocity}
 */
export function randomVelocity(oldVelocity) {
  let oldAngle = oldVelocity
    ? Math.atan2(oldVelocity.y, oldVelocity.x)
    : undefined
  const oldDistance = oldVelocity ? Math.hypot(oldVelocity.x, oldVelocity.y) : 0
  const angle = randomAngle(oldAngle)
  const distance = clamp((oldDistance || 1) + Math.random() * 0.125, 0, 1)
  return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance }
}

/**
 * @param {GameModel} model
 * @returns {GamePos}
 */
export function randomPos(model) {
  return { x: Math.random() * model._size, y: Math.random() * model._size }
}

/**
 * @param {GameEntity} a
 * @param {GameEntity} b
 * @returns {boolean}
 */
export function collides(a, b) {
  const dx = a._pos.x - b._pos.x
  const dy = a._pos.y - b._pos.y
  const dist = Math.hypot(dx, dy)
  return dist < a._radius + b._radius
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * @param {GamePos} a
 * @param {GamePos} b
 * @param {number} t
 * @returns {GamePos}
 */
export function lerpPos(a, b, t) {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
  }
}

/**
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @returns {number}
 */
export function lerp(a, b, t) {
  return a + (b - a) * t
}

/**
 * @param {GameKeyboard} keyboard
 * @param {(Gamepad | null)[]} gamepads
 * @param {GameInput[]} mobileInputs
 * @param {boolean} player2Enabled
 * @returns {GameInput[]}
 */
export function getInputs(
  keyboard,
  gamepads = navigator.getGamepads(),
  mobileInputs = [],
  player2Enabled = true,
) {
  /** @type {GameInput[]} */
  const inputs = []
  for (const gamepad of gamepads) {
    if (!gamepad?.connected) continue

    // Left stick (axes 0 and 1) for movement
    let [x, y] = gamepad.axes.slice(0, 2)
    x ??= 0
    y ??= 0
    let _velocity = { x: 0, y: 0 }
    if (Math.abs(x) + Math.abs(y) >= 0.5) {
      _velocity = { x, y }
    }

    // RT (Right Trigger) is typically button 7 or button 6, check both
    // Also check if it's an analog trigger (value > 0.5) or digital button
    const rtButton =
      gamepad.buttons[7]?.pressed || gamepad.buttons[6]?.pressed || false
    const rtValue = gamepad.buttons[7]?.value || gamepad.buttons[6]?.value || 0
    const rtPressed = rtButton || rtValue > 0.5

    // Shoot when RT is pressed (and optionally with right stick direction)
    const _action = rtPressed
    const _turbo = gamepad.buttons[2]?.pressed ?? false

    inputs[gamepad.index] = { _velocity, _action, _turbo, _source: "gamepad" }
  }
  for (let i = 0, n = ACTIONS.length; i < n; i++) {
    if (inputs[i]) continue
    let [up, left, down, right, _action] =
      /** @type {[boolean, boolean, boolean, boolean, boolean]} */ (
        keyboard.slice(i * n, i * n + n)
      )

    let x = (left ? -1 : 0) + (right ? 1 : 0)
    let y = (up ? -1 : 0) + (down ? 1 : 0)
    const dist = Math.hypot(x, y)
    if (dist > 0) x /= dist
    if (dist > 0) y /= dist
    let _velocity
    if (x !== 0 || y !== 0) _velocity = { x, y }
    const turboKey = TURBO_KEYS[i]
    const _turbo = turboKey
      ? (keyboard[KEYS.indexOf(turboKey)] ?? false)
      : false

    if (_velocity || _action || _turbo)
      inputs[i] = { _velocity, _action, _turbo, _source: "keyboard" }
  }
  for (let i = 0; i < mobileInputs.length; i++) {
    const mobileInput = mobileInputs[i]
    if (!mobileInput?._velocity && !mobileInput?._turbo) continue
    if (player2Enabled) {
      inputs[i] = {
        _velocity: mobileInput._velocity,
        _action: false,
        _turbo: mobileInput._turbo,
        _source: "pointer",
      }
      continue
    }
    const current = inputs[0]
    inputs[0] = {
      _velocity: mobileInput._velocity || current?._velocity,
      _action: false,
      _turbo: Boolean(mobileInput._turbo || current?._turbo),
      _source: "pointer",
    }
  }
  return inputs
}

/**
 * @template {GameEntity} T
 * @param {T[]} collection
 * @returns {T | void}
 */
export function getFree(collection) {
  for (const item of collection) {
    if (!item._free) continue
    item._free = false
    return item
  }
}

/**
 * @returns {GameKeyboard}
 */
export function initKeyboard() {
  return Array(KEYS.length).fill(false)
}

/** @param {GameModel} model */
function randomSeaSpawn(model) {
  const sea = Math.floor(Math.random() * 7)
  return {
    x: sea * model._size + 15 + Math.random() * 70,
    y: 15 + Math.random() * 70,
  }
}

/** @param {GameModel} model @param {number} sea */
function spawnDarkfriend(model, sea = Math.floor(Math.random() * 7)) {
  const x = sea * model._size + 15 + Math.random() * 70
  const y = 15 + Math.random() * 70
  const dark = new GamePlayer()
  dark._index =
    17 + model._friends.filter((friend) => friend._isDarkfriend).length
  dark._isFriend = true
  dark._isDarkfriend = true
  dark._free = false
  dark._color = "#050505"
  dark._pos = { x, y }
  dark._spawnPoint = { ...dark._pos }
  dark._friendTarget = { ...dark._pos }
  dark._radius = 4
  dark._speed = 1.8
  model._friends.push(dark)
  return dark
}

/**
 * @param {GameModel} model
 * @param {number} index
 */
function createLocalPlayer(model, index) {
  const playerIndex = Number.isInteger(index) ? index : 0
  model._players ??= []
  let player = new GamePlayer()
  player._index = playerIndex
  player._free = false
  player._color = playerIndex === 0 ? "orange" : "green"
  const firstPlayer = model._players[0]
  const adjacentOffsets = [
    { x: 8, y: 0 },
    { x: -8, y: 0 },
    { x: 0, y: 8 },
    { x: 0, y: -8 },
  ]
  const pos =
    playerIndex === 1 && firstPlayer && !firstPlayer._free
      ? (adjacentOffsets
          .map((offset) => ({
            x: wrapPosition(firstPlayer._pos.x + offset.x, model._worldWidth),
            y: Math.max(
              0,
              Math.min(model._worldHeight, firstPlayer._pos.y + offset.y),
            ),
          }))
          .find((candidate) => isSwimmable(candidate, model)) ??
        randomSeaSpawn(model))
      : randomSeaSpawn(model)
  Object.assign(player._pos, pos)
  player._spawnPoint = { ...pos }
  player._isDead = false
  player._respawnTimer = 0
  model._players[playerIndex] = player
  return player
}

/** @param {GameAudio} audio @param {string} theme */
function setAudioTheme(audio, theme) {
  if (audio._theme === theme) return
  audio._theme = theme
  audio._musicStep = 0
}

/** @param {GameAudio} audio */
function startAudio(audio) {
  if (!audio._enabled || audio._paused) return
  if (!audio._context) {
    const AudioContext = window.AudioContext
    if (!AudioContext) return
    audio._context = new AudioContext()
  }
  const context = /** @type {AudioContext} */ (audio._context)
  // iOS starts Web Audio suspended and requires an actual user gesture to
  // both resume it and schedule an oscillator. The inaudible short tone is
  // the unlock step; later sounds are scheduled after resume completes.
  if (context.state !== "running") {
    audioTone(audio, 1, 0.01, AUDIO_SINE, 0.0001)
    void context
      .resume()
      .then(() => {
        if (audio._musicTimer && audio._enabled) playMusicNote(audio)
      })
      .catch(() => {})
  }
  if (!audio._musicTimer) {
    audio._musicTimer = window.setInterval(() => playMusicNote(audio), 460)
    if (context.state === "running") playMusicNote(audio)
  }
}

/** @param {GameAudio} audio */
function pauseAudio(audio) {
  audio._paused = true
  if (audio._musicTimer) window.clearInterval(audio._musicTimer)
  audio._musicTimer = 0
  if (audio._context?.state === "running") void audio._context.suspend()
}

/** @param {GameAudio} audio */
function resumeAudio(audio) {
  if (!audio._context || !audio._enabled) return
  audio._paused = false
  if (audio._context.state === "suspended") {
    void audio._context
      .resume()
      .then(() => startAudio(audio))
      .catch(() => {})
  } else {
    startAudio(audio)
  }
}

/** @param {GameAudio} audio @param {boolean} enabled */
function setAudioEnabled(audio, enabled) {
  audio._enabled = enabled
  if (!enabled) {
    if (audio._musicTimer) window.clearInterval(audio._musicTimer)
    audio._musicTimer = 0
    return
  }
  startAudio(audio)
}

/** @param {GameAudio} audio */
function toggleAudio(audio) {
  setAudioEnabled(audio, !audio._enabled)
  return audio._enabled
}

/** @param {GameAudio} audio */
function unlockAudio(audio) {
  // Unlocking Web Audio is separate from enabling it. Input gestures must
  // never undo an explicit mute.
  if (!audio._enabled) return false
  startAudio(audio)
  return true
}

/** @param {GameAudio} audio */
function playMusicNote(audio) {
  /** @type {Record<string, {notes: number[], duration: number, type: OscillatorType, volume: number}>} */
  const themes = {
    surface: {
      notes: [196, 220, 247, 262, 294, 330, 370, 330, 294, 262, 220, 196],
      duration: 0.38,
      type: AUDIO_SINE,
      volume: 0.021,
    },
    narwhal: {
      notes: [82.41, 87.31, 82.41, 92.5, 82.41, 87.31],
      duration: 0.3,
      type: AUDIO_TRIANGLE,
      volume: 0.028,
    },
    deep: {
      notes: [55, 58.27, 46.25, 51.91, 41.2, 46.25],
      duration: 0.5,
      type: AUDIO_TRIANGLE,
      volume: 0.025,
    },
    scary: {
      notes: [65.41, 61.74, 51.91, 49, 61.74, 43.65],
      duration: 0.42,
      type: AUDIO_SAWTOOTH,
      volume: 0.028,
    },
  }
  const theme = themes[audio._theme] ?? themes["surface"]
  if (!theme) return
  audioTone(
    audio,
    theme.notes[audio._musicStep++ % theme.notes.length] ?? 110,
    theme.duration,
    theme.type,
    theme.volume,
  )
}

/** @param {GameAudio} audio @param {number} frequency @param {number} duration @param {OscillatorType} type @param {number} volume @param {number} [slide] */
function audioTone(audio, frequency, duration, type, volume, slide = 0) {
  if (!audio._enabled) return
  const context = audio._context
  if (!context) return
  const now = context.currentTime
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, now)
  if (slide)
    oscillator.frequency.linearRampToValueAtTime(
      frequency + slide,
      now + duration,
    )
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(now)
  oscillator.stop(now + duration + 0.02)
}

/** @param {GameAudio} audio */
export function playAudioSwim(audio) {
  const now = performance.now()
  if (now - audio._lastSwim < 220) return
  audio._lastSwim = now
  audioTone(audio, 220, 0.1, AUDIO_SINE, 0.009, -60)
}
/** @param {GameAudio} audio */
export function playAudioImpale(audio) {
  audioTone(audio, 95, 0.22, AUDIO_SAWTOOTH, 0.08, -55)
}
/** @param {GameAudio} audio */
export function playAudioLaunch(audio) {
  audioTone(audio, 130, 0.65, AUDIO_TRIANGLE, 0.07, 220)
}
/** @param {GameAudio} audio */
export function playAudioPickup(audio) {
  audioTone(audio, 520, 0.14, AUDIO_SINE, 0.05, 180)
}
/** @param {GameAudio} audio */
export function playAudioWin(audio) {
  audioTone(audio, 330, 0.18, AUDIO_SINE, 0.05, 110)
  setTimeout(() => audioTone(audio, 494, 0.35, AUDIO_SINE, 0.05, 160), 130)
}
/** @param {GameAudio} audio */
export function playAudioEaten(audio) {
  audioTone(audio, 70, 0.28, AUDIO_SAWTOOTH, 0.1, -45)
  audioTone(audio, 180, 0.12, AUDIO_SQUARE, 0.04, -90)
}
/** @param {GameAudio} audio */
export function playAudioFriendEaten(audio) {
  audioTone(audio, 180, 0.16, AUDIO_SINE, 0.06, -90)
  audioTone(audio, 72, 0.3, AUDIO_TRIANGLE, 0.05, -20)
}
/** @param {GameAudio} audio */
export function playAudioNear(audio) {
  const now = performance.now()
  if (now - audio._lastNearAngler < 1400) return
  audio._lastNearAngler = now
  audioTone(audio, 72, 0.4, AUDIO_SINE, 0.035, -18)
}
