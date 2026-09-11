export {}

declare global {
  type DebugSize = {
    width: number
    height: number
    top: number
    left: number
  }

  type DebugFish = {
    label: string
    player: GamePlayer
    size: DebugSize
    ctx: CanvasRenderingContext2D
  }
}
