/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // darkMode intentionally left at Tailwind's default 'media' strategy:
  // the visitor's OS decides, as the incumbent site worked. The dark:
  // utilities are restyled into the Glenride warm-ink dark world
  // (night / night-deep / night-card grounds, cream text) — see REDESIGN-BRIEF.md.
  theme: {
    extend: {
      colors: {
        paper: "#FAF5EC",
        "paper-deep": "#F3ECDC",
        ink: "#221D18",
        "ink-soft": "#57504A",
        sienna: "#E97451",
        "sienna-deep": "#B84A2B",
        line: "rgba(34, 29, 24, 0.12)",
        // Warm-ink dark world
        night: "#1B1611",
        "night-deep": "#241D16",
        "night-card": "#2A231C",
        cream: "#F3ECDC",
        "cream-soft": "#CFC6B4",
        "line-dark": "rgba(250, 245, 236, 0.14)",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "Georgia", "serif"],
        serif: ['"Newsreader"', "Georgia", "serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          '"Liberation Mono"',
          '"Courier New"',
          "monospace",
        ],
      },
    },
  },
  plugins: [],
}
