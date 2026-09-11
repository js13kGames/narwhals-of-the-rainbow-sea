import {
  GameAnglerFish,
  GameModel,
  GameNarwhalBoss,
  GamePlayer,
  GameView,
  drawPlayerSprite,
} from "./game.js"

const dpr = window.devicePixelRatio || 1
const container = /** @type {HTMLDivElement} */ (
  document.querySelector("#canvases")
)
const model = new GameModel()
const view = new GameView()
view._scale = 9.6

/** @satisfies {Record<string, DebugSize>} */
const sizes = {
  friend: { width: 120, height: 80, top: 0, left: 0 },
  angler: { width: 220, height: 150, top: 25, left: 0 },
  narwhal: { width: 280, height: 120, top: 0, left: -30 },
  unicorn: { width: 380, height: 130, top: 0, left: -40 },
}

/** @type {DebugFish[]} */
const fishes = []

function main() {
  const normal = new GamePlayer()
  normal._color = "orange"
  addFish("player", normal, sizes.friend)

  const green = new GamePlayer()
  green._color = "oklch(0.74 0.18 150)"
  green._index = 1
  addFish("player 2", green, sizes.friend)

  const friend = new GamePlayer()
  friend._isFriend = true
  friend._color = "#38bdf8"
  friend._index = 2
  addFish("friend", friend, sizes.friend)

  const darkFriend = new GamePlayer()
  darkFriend._isFriend = true
  darkFriend._isDarkfriend = true
  darkFriend._color = "#050505"
  darkFriend._index = 3
  addFish("dark friend", darkFriend, sizes.friend)

  const narwhalPlayer1 = new GamePlayer()
  narwhalPlayer1._color = "orange"
  narwhalPlayer1._index = 6
  narwhalPlayer1._isNarwhal = true
  narwhalPlayer1._hasHorn = true
  narwhalPlayer1._isBoss = true
  narwhalPlayer1._radius = 9
  addFish("player 1 narwhal", narwhalPlayer1, sizes.narwhal)

  const narwhalPlayer2 = new GamePlayer()
  narwhalPlayer2._color = "oklch(0.74 0.18 150)"
  narwhalPlayer2._index = 7
  narwhalPlayer2._isNarwhal = true
  narwhalPlayer2._hasHorn = true
  narwhalPlayer2._isBoss = true
  narwhalPlayer2._radius = 9
  addFish("player 2 narwhal", narwhalPlayer2, sizes.narwhal)

  const angler = new GameAnglerFish()
  angler._hasLamp = true
  angler._index = 4
  addFish("angler", angler, sizes.angler)

  const boss = new GameNarwhalBoss()
  boss._index = 5
  addFish("narwhal unicorn", boss, sizes.unicorn)
}
/**
 * @param {string} label
 * @param {GamePlayer} player
 * @param {DebugSize} size
 */
function addFish(label, player, size) {
  const canvas = document.createElement("canvas")
  canvas.width = size.width * dpr
  canvas.height = size.height * dpr
  canvas.style.width = `${size.width}px`
  canvas.style.height = `${size.height}px`

  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"))
  ctx.scale(dpr, dpr)
  ctx.fillStyle = "#0c4a6e"
  ctx.fillRect(0, 0, size.width, size.height)
  ctx.textAlign = "center"
  ctx.textBaseline = "top"

  player._pos = { x: 50, y: 200 }
  player._angle = 0
  player._renderAngle = 0

  const text = document.createElement("div")
  text.style.textAlign = "center"
  text.style.fontSize = "12px"
  text.style.color = "#e0f2fe"
  text.textContent = `${label}`

  const article = document.createElement("article")
  article.style.display = "flex"
  article.style.flexDirection = "column"
  article.style.alignItems = "center"
  article.style.marginBottom = "16px"
  article.append(canvas)
  article.append(text)

  container.append(article)
  fishes.push({ label, player, size, ctx })
}

main()

/**
 * @param {GameModel} model
 * @param {GameView} view
 */
function draw(model, view) {
  for (const fish of fishes) {
    drawPlayerSprite(
      fish.player,
      model,
      view,
      fish.ctx,
      fish.size.width / 2 + fish.size.left,
      fish.size.height / 2 + fish.size.top,
      fish.player._radius * view._scale,
      0,
    )
  }
}

function animate(loop = requestAnimationFrame) {
  loop(function callback() {
    draw(model, view)
    loop(callback)
  })
}
animate()
