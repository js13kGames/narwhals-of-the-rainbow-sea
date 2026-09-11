# Narwhals of the Rainbow Sea - My 2026 js13k game experiment

> 🎮 <https://js13kgames.com/2026/games/narwhals-of-the-rainbow-sea>
> 🎮 <https://scmx.github.io/js13k2026>

**Narwhals of the Rainbow Sea** is a colorful cooperative adventure made for
the 2026 js13k game jam with theme **Unicorns and Rainbows**.

Swim through seas of every color, discover friends who need your help, and
guide them back to the sea where they belong. Friendship is magic: stick
together, look out for one another, and work as a team to reach the depths and
overcome whatever lurks there.

Supports **1–2 local players**. Player 2 can join at any time by pressing the
**+** button.

### Controls 🎮 🎮

- **Player 1:** Arrow keys to swim, **Space** to boost
- **Player 2:** **WASD** to swim, **E** to boost
- **Gamepad:** Left stick to swim, **X / Square** to boost
- **Touch:** Drag the on-screen control; press the ⚡ button to boost

## My constraints

### Linting

- Vanilla JS with strict [typescript linting via
  JSDoc](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- npm run lint must pass
- npm t must pass
- npm run format must run

### Code style

- No build required for development and github pages. Easy to debug
- No global state. Use classes only as data structs. Pass around them as
  arguments to functions. More Testable. No `this`
- Use jsdoc type casting `/** @type {} */ (...)` when confident it's enough
  instead of extra guards. Make tsc happy while also keeping down
  amount of code
- Use global variables matching html element ids

### Mangling

- Prefix _properties with underscore so terser can mangle them
- A single game.js for the main game
- Every function can be exported for testing and debugging, but all exports are
  stripped away during build
- All lines with wavedash are stripped away during js13k build
- All lines with // DEV ONLY are stripped away during build

## Build setup

1. Inline the source HTML, CSS, and JavaScript as a raw size baseline
2. Strip wavedash, dev-only lines, exports, comments, and dead code while
   keeping the JavaScript readable; write this inspection build to
   `dist/inline/index.html`
3. Mangle and compress with Terser into `dist/terser/index.html`
4. Run Closure Compiler and Terser again into `dist/closure/index.html`
5. Run Roadroller into `dist/roadroller/index.html`

Every stage is zipped and logged as `ZIP size HTML size`. The final line reports
the bytes remaining under the 13,312-byte limit. Roadroller is queued
asynchronously and skips identical input; source changes always trigger reload,
even when a duplicate build is skipped.

## Devserver

Custom dev server that watches for changes and rebuilds for different targets.
It injects an EventSource listener so it can send reload events to browser
clients.

It has a websocket server for testing js13k online relay.
