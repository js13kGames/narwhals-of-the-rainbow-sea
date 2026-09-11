export {}

declare global {
  const canvas: HTMLCanvasElement
  const restart: HTMLButtonElement
  const sound: HTMLButtonElement
  const deep: HTMLButtonElement
  const gather: HTMLButtonElement
  const manifest: HTMLLinkElement
  const player2: HTMLButtonElement
  const depth: HTMLElement
  const simulationTime: HTMLElement
  const score: HTMLElement
  const highscore: HTMLElement

  type GameKeyboard = boolean[]

  type GamePos = {
    x: number
    y: number
  }

  type GameVelocity = GamePos

  type GameInput = {
    _velocity?: GameVelocity | undefined
    _action: boolean
    _turbo?: boolean | undefined
    _source?: "keyboard" | "gamepad" | "pointer"
  }

  interface Window {
    MODEL: GameModel
  }

  function zzfx(
    volume: number,
    randomness: number,
    frequency: number,
    attack: number,
    sustain: number,
    release: number,
    shape: number,
    slide: number,
    deltaSlide: number,
    pitchJump: number,
    pitchJumpTime: number,
    repeatTime: number,
    bitCrush: number,
    delay: number,
  ): void
}
