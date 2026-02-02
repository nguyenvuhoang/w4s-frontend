import type { Config } from "tailwindcss";

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,css}'],
  corePlugins: {
    preflight: false
  },
  important: '#__next',
  plugins: [require('tailwindcss-logical'), require('./src/@core/tailwind/plugin.ts')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--app-font-family)', 'Quicksand', 'sans-serif'],
      },
    }
  }
};
export default config;
