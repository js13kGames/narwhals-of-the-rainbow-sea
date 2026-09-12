import test from "node:test"
import assert from "node:assert/strict"

// @ts-expect-error Node test stub for the browser-only initialization hook.
globalThis.document = /** @type {Document} */ ({
  documentElement: { style: { setProperty() {} } },
})

const {
  GameAnglerFish,
  GamePlayer,
  getDarkfriendFollowTarget,
  pierceAngler,
  updateFriends,
  updateDeepNpcs,
  updateLampInteractions,
  tunnelWaypoint,
} = await import("./game.js")

function makeModel() {
  return /** @type {import("./game.js").GameModel} */ ({
    _simulationTime: 0,
    _size: 400,
    _worldWidth: 700,
  })
}

test("darkfriend gets the same orbit target as a friend", () => {
  const model = makeModel()
  const player = new GamePlayer()
  player._pos = { x: 120, y: 220 }
  player._velocity = { x: 0, y: 0 }
  const darkfriend = new GamePlayer()
  darkfriend._isDarkfriend = true
  darkfriend._pos = { x: 128, y: 220 }

  const target = getDarkfriendFollowTarget(darkfriend, player, new Map(), model)

  assert.notDeepEqual(target, player._pos)
  assert.equal(target.x, 128)
  assert.equal(target.y, 220)
})

test("darkfriend can descend through the tunnel and resume orbiting in deep water", () => {
  const model = makeModel()
  const player = new GamePlayer()
  player._pos = { x: 120, y: 220 }
  player._velocity = { x: 0, y: 0 }
  const darkfriend = new GamePlayer()
  darkfriend._isDarkfriend = true
  darkfriend._pos = { x: 450, y: 20 }

  const tunnelTarget = getDarkfriendFollowTarget(
    darkfriend,
    player,
    new Map(),
    model,
  )
  assert.equal(tunnelTarget.x, 50)
  assert.equal(tunnelTarget.y, 20)

  darkfriend._pos = { x: 50, y: 150 }
  const deepTarget = getDarkfriendFollowTarget(
    darkfriend,
    player,
    new Map(),
    model,
  )
  assert.equal(deepTarget.x, 128)
  assert.equal(deepTarget.y, 220)
})

test("darkfriend leaves the y=100 tunnel mouth", () => {
  const model = makeModel()
  const player = new GamePlayer()
  player._pos = { x: 120, y: 220 }
  player._velocity = { x: 0, y: 0 }
  const darkfriend = new GamePlayer()
  darkfriend._isDarkfriend = true
  darkfriend._pos = { x: 50, y: 100 }

  assert.deepEqual(
    getDarkfriendFollowTarget(darkfriend, player, new Map(), model),
    { x: 50, y: 150 },
  )
})

test("darkfriend does not turn back at the lower tunnel mouth", () => {
  const model = makeModel()
  const player = new GamePlayer()
  player._pos = { x: 120, y: 150 }
  player._velocity = { x: 1, y: 0 }
  player._angle = Math.PI / 2
  model._friends = []
  const darkfriend = new GamePlayer()
  darkfriend._isDarkfriend = true
  darkfriend._pos = { x: 50, y: 150 }

  assert.deepEqual(
    getDarkfriendFollowTarget(darkfriend, player, new Map(), model),
    { x: 120, y: 151 },
  )
})

test("angler can reenter deep water through the tunnel", () => {
  const target = { x: 120, y: 220 }

  assert.deepEqual(tunnelWaypoint({ x: 50, y: 100 }, target), { x: 50, y: 150 })
  assert.deepEqual(tunnelWaypoint({ x: 50, y: 150 }, target), target)
})

test("darkfriend enters the tunnel before descending", () => {
  const model = makeModel()
  model._friends = []
  const player = new GamePlayer()
  player._pos = { x: 120, y: 220 }
  player._velocity = { x: 0, y: 0 }
  const darkfriend = new GamePlayer()
  darkfriend._isDarkfriend = true
  darkfriend._pos = { x: 450, y: 20 }

  assert.deepEqual(
    getDarkfriendFollowTarget(darkfriend, player, new Map(), model),
    { x: 50, y: 20 },
  )

  darkfriend._pos = { x: 50, y: 20 }
  assert.deepEqual(
    getDarkfriendFollowTarget(darkfriend, player, new Map(), model),
    { x: 50, y: 100 },
  )
})

test("darkfriend update reaches its deep formation target", () => {
  const model = makeModel()
  model._size = 100
  model._worldHeight = 350
  model._speed = 0.5
  model._friends = []
  model._players = []

  const player = new GamePlayer()
  player._index = 0
  player._free = false
  player._pos = { x: 120, y: 220 }
  player._velocity = { x: 0, y: 0 }

  const darkfriend = new GamePlayer()
  darkfriend._isFriend = true
  darkfriend._isDarkfriend = true
  darkfriend._free = false
  darkfriend._followingPlayer = 0
  darkfriend._pos = { x: 450, y: 20 }
  darkfriend._speed = 1.8

  model._players.push(player)
  model._friends.push(darkfriend)

  const maxTicks = 2000
  let reached = false
  for (let tick = 0; tick < maxTicks; tick++) {
    updateFriends(model)
    const target = getDarkfriendFollowTarget(
      darkfriend,
      player,
      new Map([[0, [darkfriend]]]),
      model,
    )
    if (
      Math.hypot(target.x - darkfriend._pos.x, target.y - darkfriend._pos.y) <
      0.01
    ) {
      reached = true
      break
    }
  }

  assert.equal(reached, true)
  assert.ok(Math.abs(darkfriend._pos.x - 128) < 0.01)
  assert.ok(Math.abs(darkfriend._pos.y - 220) < 0.01)
})

test("angler reenters deep water through the tunnel", () => {
  const model = makeModel()
  model._size = 100
  model._worldHeight = 350
  model._speed = 0.5
  model._interval = 50
  model._players = []
  model._friends = []

  const player = new GamePlayer()
  player._free = false
  player._pos = { x: 120, y: 220 }
  const angler = new GameAnglerFish()
  angler._free = false
  angler._isHunting = false
  angler._pos = { x: 450, y: 20 }
  angler._nextPos = { x: 120, y: 220 }
  model._players.push(player)
  model._deepNpcs = [angler]

  const maxTicks = 10000
  let reached = false
  for (let tick = 0; tick < maxTicks; tick++) {
    updateDeepNpcs(model)
    if (angler._pos.y >= 150) {
      reached = true
      break
    }
  }

  assert.equal(reached, true)
  assert.ok(angler._pos.x >= 0 && angler._pos.x <= 200)
})

test("deep exit spawns one star and pickup extends boost", () => {
  const model = makeModel()
  model._size = 100
  model._worldHeight = 350
  model._players = []
  model._items = []
  model._deepNpcs = []
  model._stars = 0

  const player = new GamePlayer()
  player._free = false
  player._pos = { x: 100, y: 220 }
  const angler = new GameAnglerFish()
  angler._free = false
  model._players.push(player)
  model._deepNpcs.push(angler)

  updateLampInteractions(model)
  assert.equal(model._items.length, 0)
  player._pos = { x: 100, y: 100 }
  updateLampInteractions(model)
  assert.equal(model._items.filter((item) => !item._free).length, 1)

  const star = model._items[0]
  if (!star) throw new Error("star was not spawned")
  player._pos = { ...star._pos }
  updateLampInteractions(model)
  assert.equal(star._free, true)
  assert.equal(model._stars, 1)
  assert.equal(player._turboBonus, 1)
})

test("piercing an angler spawns at most one additional angler", () => {
  const model = makeModel()
  model._deepNpcs = []
  model._particles = []
  model._pierced = 0
  const angler = new GameAnglerFish()
  angler._free = false
  model._deepNpcs.push(angler)

  pierceAngler(angler, model)
  assert.equal(model._deepNpcs.length, 2)
  assert.equal(model._deepNpcs.filter((npc) => npc._isAngler).length, 2)
  assert.equal(
    model._friends?.filter((friend) => friend._isDarkfriend).length ?? 0,
    0,
  )

  pierceAngler(angler, model)
  assert.equal(model._deepNpcs.length, 2)
})
