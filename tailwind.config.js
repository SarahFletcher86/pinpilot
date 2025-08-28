/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./services/**/*.{ts,tsx,js,jsx}",
    "./api/**/*.{ts,tsx,js,jsx}",
    // If you later add a /public or /src folder, add it here too.
  ],
  theme: {
    extend: {
      colors: {
        primary: "#5459d4",
        accent:  "#74d6d8",
        ink:     "#1d1d1f",
        body:    "#2f2f3a",
        bg:      "#f5f6f7",
      },
      borderRadius: {
        xl:  "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};