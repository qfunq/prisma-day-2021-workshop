module.exports = {
  purge: {
    content: [
        './components/**/*.{js,ts,jsx,tsx}',
        './pages/**/*.{js,ts,jsx,tsx}',
        './schema/**/*.{js,ts,jsx,tsx}',
    ],
    options: {
        safelist: {
            standard: ['outline-none']
        }
    }
},
  darkMode: false, // or 'media' or 'class'
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
