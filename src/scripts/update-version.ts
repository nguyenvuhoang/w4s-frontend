const fs = require('fs')
const path = require('path')

const now = new Date()
const version = `${now.getFullYear()}${(now.getMonth() + 1)
  .toString()
  .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.${now
  .getHours()
  .toString()
  .padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now
  .getSeconds()
  .toString()
  .padStart(2, '0')}`

const envPath = path.resolve(__dirname, '../../.env')

let envContent = ''
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8')
}

if (envContent.includes('NEXT_PUBLIC_VERSION=')) {
  envContent = envContent.replace(/NEXT_PUBLIC_VERSION=.*/g, `NEXT_PUBLIC_VERSION=${version}`)
} else {
  envContent += `\nNEXT_PUBLIC_VERSION=${version}`
}

fs.writeFileSync(envPath, envContent)
console.log(`✅ Updated NEXT_PUBLIC_VERSION to ${version}`)
