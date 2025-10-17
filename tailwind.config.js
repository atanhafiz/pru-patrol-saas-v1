/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
      extend: {
        colors: {
          primary: "#1A1A40",
          accent: "#00A8E8",
          soft: "#EFF6FC",
        },
        fontFamily: {
          sans: ["Manrope", "sans-serif"],
        },
      },
    },
    plugins: [],
  };
  