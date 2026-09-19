import Wavedash from "https://esm.sh/@wvdsh/sdk-js"
import { init } from "./game.js"

globalThis.Wavedash ??= Wavedash

export function wavedashEvent(name) {
  const sdk = globalThis.Wavedash
  if (!sdk) return
  try {
    void sdk.setAchievement(name, true)
  } catch {
    /**/
  }
}

let leaderboardId

export function wavedashScore(score) {
  const sdk = globalThis.Wavedash
  if (!sdk || !leaderboardId || !Number.isFinite(score)) return
  try {
    void sdk.uploadLeaderboardScore(leaderboardId, score, true)
  } catch {
    /**/
  }
}

async function setupLeaderboard() {
  const sdk = globalThis.Wavedash
  if (!sdk) return
  try {
    const response = await sdk.getOrCreateLeaderboard(
      "score",
      sdk.LeaderboardSortOrder.DESC,
      sdk.LeaderboardDisplayType.NUMERIC,
    )
    if (response.success) leaderboardId = response.data.id
  } catch {
    /**/
  }
}

globalThis.wavedashEvent = wavedashEvent
globalThis.wavedashScore = wavedashScore
Wavedash.init({ debug: true })
void setupLeaderboard()
init(undefined)
