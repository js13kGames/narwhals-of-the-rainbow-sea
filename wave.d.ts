import WavedashSDK from "@wvdsh/sdk-js"

declare global {
  const Wavedash: typeof WavedashSDK
  const wavedash: Record<string, (...args: unknown[]) => unknown>
  const wavedashEvent: (name: string) => void
  const wavedashScore: (score: number) => void

  interface Window {
    Wavedash: typeof WavedashSDK
    wavedash: Record<string, (...args: unknown[]) => unknown>
    wavedashEvent: (name: string) => void
    wavedashScore: (score: number) => void
  }
}

export {}
