/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{ts,tsx,html}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#e5edff",
          violet: "#7d71ff",
          aqua: "#74d6d8",
          white: "#faffff",
          deep: "#5459d4",
          gold: "#f9d643"
        }
      },
      fontFamily: {
        sans: ["'Open Sans'", "ui-sans-serif", "system-ui", "Arial"],
        display: ["Poppins", "ui-sans-serif", "system-ui", "Arial"]
      },
      borderRadius: {
        card: "1.25rem"
      },
      boxShadow: {
        card: "0 10px 30px rgba(0,0,0,0.10)"
      }
    }
  },
  plugins: [],
};