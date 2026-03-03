const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const screenshotsDir = path.join(__dirname, '..', 'docs', 'screenshots')
fs.mkdirSync(screenshotsDir, { recursive: true })

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  })
  const page = await context.newPage()

  // 1. Landing page
  console.log('Capturing landing page...')
  await page.goto('http://localhost:3002', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500) // let fonts + grain load
  await page.screenshot({ path: path.join(screenshotsDir, '01-landing.png'), fullPage: false })

  // 1b. Landing page scrolled to features
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }))
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(screenshotsDir, '02-features.png'), fullPage: false })

  // 2. Login page
  console.log('Capturing login page...')
  await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(screenshotsDir, '03-login.png'), fullPage: false })

  // 3. Signup page
  console.log('Capturing signup page...')
  await page.goto('http://localhost:3002/signup', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(screenshotsDir, '04-signup.png'), fullPage: false })

  // 4. Full landing page
  console.log('Capturing full landing page...')
  await page.goto('http://localhost:3002', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(screenshotsDir, '05-landing-full.png'), fullPage: true })

  await browser.close()
  console.log('Screenshots saved to docs/screenshots/')
})()
