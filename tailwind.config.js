/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      colors: {
        primary: "#2e8b57",
        secondary: "#1e293b",
        accent: "#16a34a",
        background: '#FAF4D3',
        foreground: '#1a1a1a',
        card: '#ffffff',
        popover: '#ffffff',
        muted: '#e8e4c9',
        'muted-foreground': '#717182',
        destructive: '#d4183d',
        border: 'rgba(0, 70, 67, 0.1)',
        input: 'transparent',
        'input-background': '#ffffff',
        ring: '#004643',
        'chart-1': '#004643',
        'chart-2': '#2A9D8F',
        'chart-3': '#F4A261',
        'chart-4': '#E76F51',
        'chart-5': '#264653',
        sidebar: '#ffffff',
        'sidebar-foreground': '#1a1a1a',
        'sidebar-primary': '#004643',
        'sidebar-primary-foreground': '#ffffff',
        'sidebar-accent': '#FAF4D3',
        'sidebar-accent-foreground': '#004643',
        'sidebar-border': 'rgba(0, 70, 67, 0.1)',
        'sidebar-ring': '#004643',
      },
      boxShadow: {
        card: "0 4px 12px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};