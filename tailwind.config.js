/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        accent:           'rgb(var(--accent) / <alpha-value>)',
        'accent-off':     'rgb(var(--accent-off) / <alpha-value>)',
        'accent-purple':  'rgb(var(--accent-purple) / <alpha-value>)',
        'accent-pink':    'rgb(var(--accent-pink) / <alpha-value>)',
        'accent-gold':    'rgb(var(--accent-gold) / <alpha-value>)',
        dark:             'rgb(var(--dark) / <alpha-value>)',
        darkest:          'rgb(var(--darkest) / <alpha-value>)',
        'dark-highlight': 'rgb(var(--dark-highlight) / <alpha-value>)',
        'dark-apparent':  'rgb(var(--dark-apparent) / <alpha-value>)',
        'dark-card':      'rgb(var(--dark-card) / <alpha-value>)',
      },
      fontFamily: {
        heading: 'var(--font-heading)',
        body:    'var(--font-body)',
      },
    },
  },
  plugins: [],
};
