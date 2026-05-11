/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Paleta PaletNum
        crema:    '#FAF6F1',
        crema2:   '#F4EDE4',
        crema3:   '#EDE0D4',
        'rosa-ll': '#F5E8E6',
        'rosa-l':  '#E8C4C0',
        rosa:     '#C9908A',
        arena:    '#B59E7D',
        'arena-l': '#D9CBBA',
        'arena-ll':'#F0EAE0',
        pizarra:  '#5C5C6E',
        'pizarra2':'#8A8A9A',
        sage:     '#8FAF8F',
        'sage-l': '#D4E8D4',
        borde:    'rgba(92,92,110,0.15)',
        // aliases para compatibilidad con código existente
        ink:      '#5C5C6E',
        ink2:     '#8A8A9A',
        paper:    '#FAF6F1',
        paper2:   '#F4EDE4',
        paper3:   '#EDE0D4',
        accent:   '#C9908A',
        accent2:  '#B59E7D',
        accent3:  '#8FAF8F',
      },
      fontFamily: {
        sans:      ['Lora', 'serif'],
        display:   ['Playfair Display', 'serif'],
        script:    ['Dancing Script', 'cursive'],
      },
      borderRadius: {
        'xl':  '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
      boxShadow: {
        'cozy':  '0 2px 12px rgba(92,92,110,0.07)',
        'cozy-md': '0 4px 20px rgba(92,92,110,0.10)',
      },
    },
  },
  plugins: [],
}