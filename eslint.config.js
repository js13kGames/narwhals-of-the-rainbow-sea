import js from "@eslint/js"
import globals from "globals"

export default [
  {
    ignores: ["node_modules/**", "dist/**", "closure-externs.js"],
  },
  js.configs.recommended,
  {
    files: ["game.js", "wave.js", "manifest.js", "debug.js"],
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.browser,
        canvas: true,
        Wavedash: true,
        sound: true,
        player2: true,
        deep: true,
        gather: true,
        restart: true,
        manifest: true,
        wavedashEvent: true,
        wavedashScore: true,
        depth: true,
        simulationTime: true,
        score: true,
        highscore: true,
      },
    },
    rules: {
      "no-unused-vars": "off",
    },
  },
  {
    files: ["server.js", "reload.js"],
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": "off",
    },
  },
]
