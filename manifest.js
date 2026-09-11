manifest?.setAttribute(
  "href",
  `data:application/manifest+json,${encodeURIComponent(
    JSON.stringify({
      name: "Narwhals of the Rainbow Sea",
      short_name: "Narwhals",
      start_url: location.pathname,
      background_color: "black",
      theme_color: "black",
      display: "fullscreen",
      icons: [
        {
          src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 16 16'><text x='0' y='14'>🎏</text></svg>",
          type: "image/png",
          sizes: "48x48",
        },
      ],
    }),
  )}`,
)
