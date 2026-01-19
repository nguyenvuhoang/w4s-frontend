

export async function POST() {
    return new Response(JSON.stringify({ message: 'App cookie cleared' }), {
        status: 200,
        headers: {
            'Set-Cookie': 'app=; Path=/; Max-Age=0; SameSite=Strict; Secure',
            'Content-Type': 'application/json'
        }
    })
}