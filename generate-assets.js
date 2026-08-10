const sharp = require('./node_modules/sharp')
const path = require('path')

const assets = path.join(__dirname, 'assets')

// ─── Icon SVG (1024×1024): vertical gradient + bold white T ─────────────────

const iconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1A6FFF"/>
      <stop offset="100%" stop-color="#00B89C"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="1024" height="1024" rx="220" fill="url(#bg)"/>
  <!-- Bold white T -->
  <!-- Horizontal bar -->
  <rect x="172" y="236" width="680" height="148" rx="60" fill="white"/>
  <!-- Vertical bar -->
  <rect x="438" y="236" width="148" height="552" rx="60" fill="white"/>
</svg>
`

// ─── Splash SVG (1284×2778): dark bg + centred logo + text ──────────────────

const splashSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1284" height="2778" viewBox="0 0 1284 2778">
  <defs>
    <linearGradient id="logoGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1A6FFF"/>
      <stop offset="100%" stop-color="#00B89C"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1284" height="2778" fill="#0A1628"/>

  <!-- Logo box (280×280 centred at 642, 1220) -->
  <rect x="502" y="1080" width="280" height="280" rx="60" fill="url(#logoGrad)"/>
  <!-- T horizontal bar -->
  <rect x="548" y="1126" width="188" height="44" rx="16" fill="white"/>
  <!-- T vertical bar -->
  <rect x="621" y="1126" width="42" height="188" rx="16" fill="white"/>

  <!-- "Tripmates" -->
  <text
    x="642" y="1450"
    font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"
    font-size="96"
    font-weight="800"
    fill="white"
    text-anchor="middle"
    letter-spacing="-2"
  >Tripmates</text>

  <!-- Tagline -->
  <text
    x="642" y="1558"
    font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"
    font-size="44"
    font-weight="500"
    fill="#00B89C"
    text-anchor="middle"
    letter-spacing="0.5"
  >Find Your Crew. See The World.</text>
</svg>
`

// ─── Adaptive icon foreground SVG (1024×1024): T on transparent ─────────────

const adaptiveFgSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1A6FFF"/>
      <stop offset="100%" stop-color="#00B89C"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect x="172" y="236" width="680" height="148" rx="60" fill="white"/>
  <rect x="438" y="236" width="148" height="552" rx="60" fill="white"/>
</svg>
`

async function generate() {
  console.log('Generating app icon (1024×1024)...')
  await sharp(Buffer.from(iconSVG))
    .resize(1024, 1024)
    .png()
    .toFile(`${assets}/icon.png`)
  console.log('✓ assets/icon.png')

  console.log('Generating adaptive icon foreground (1024×1024)...')
  await sharp(Buffer.from(adaptiveFgSVG))
    .resize(1024, 1024)
    .png()
    .toFile(`${assets}/adaptive-icon.png`)
  console.log('✓ assets/adaptive-icon.png')

  console.log('Generating splash screen (1284×2778)...')
  await sharp(Buffer.from(splashSVG))
    .resize(1284, 2778)
    .png()
    .toFile(`${assets}/splash.png`)
  console.log('✓ assets/splash.png')

  console.log('\nAll assets generated!')
}

generate().catch(e => { console.error('Error:', e.message); process.exit(1) })
