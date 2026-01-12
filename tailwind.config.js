/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          bg: "var(--bg-color)",
          panel: "var(--bg-panel)",
          primary: "var(--accent-primary)", 
          secondary: "var(--accent-secondary)",
          muted: "var(--text-muted)",
          border: "var(--border-color)",
        },
        fontFamily: {
          sans: ["var(--font-body)", "sans-serif"],
          heading: ["var(--font-heading)", "sans-serif"],
        },
        borderRadius: {
          lg: "var(--radius-lg)",
          md: "var(--radius-md)",
          sm: "var(--radius-sm)",
        }
      },
    },
    plugins: [],
  }