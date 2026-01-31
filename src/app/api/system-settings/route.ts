import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'src/shared/data/system-settings.json')

export async function GET() {
    try {
        if (!fs.existsSync(SETTINGS_FILE_PATH)) {
            return NextResponse.json({})
        }
        const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8')
        return NextResponse.json(JSON.parse(data))
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read settings' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Create directory if it doesn't exist
        const dir = path.dirname(SETTINGS_FILE_PATH)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(body, null, 2), 'utf8')

        return NextResponse.json({ message: 'Settings saved successfully' })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }
}
