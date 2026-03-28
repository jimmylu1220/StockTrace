/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        up: '#ef4444',      // Red for price increase (TW convention)
        down: '#22c55e',    // Green for price decrease (TW convention)
        'up-us': '#22c55e', // Green for US convention
        'down-us': '#ef4444',
      },
    },
  },
  plugins: [],
}
