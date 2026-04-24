/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        "jj-blue": "#1e80ff",
        "jj-text": "#1d2129",
        "jj-subtext": "#86909c",
        "jj-border": "#e5e6eb",
      },
    },
  },
  plugins: [],
};
