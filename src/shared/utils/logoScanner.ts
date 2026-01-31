import fs from 'fs'
import path from 'path'

export type ScannedLogo = {
    name: string
    url: string
}

export const scanLogos = (): ScannedLogo[] => {
    const logoDir = path.join(process.cwd(), 'public/images/logobank')

    try {
        if (!fs.existsSync(logoDir)) {
            return []
        }

        const files = fs.readdirSync(logoDir)

        return files
            .filter(file => {
                const ext = path.extname(file).toLowerCase()
                return ['.svg', '.png', '.jpg', '.jpeg', '.webp'].includes(ext)
            })
            .map(file => {
                const name = path.parse(file).name
                    .replace(/[-_]/g, ' ')
                    .replace(/\b\w/g, c => c.toUpperCase())

                return {
                    name,
                    url: `/images/logobank/${file}`
                }
            })
    } catch (error) {
        console.error('Error scanning logos:', error)
        return []
    }
}
