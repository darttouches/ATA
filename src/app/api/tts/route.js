import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');
    const lang = searchParams.get('lang') || 'ar';
    
    if (!text) return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 });

    try {
        const url = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=${lang}&q=${encodeURIComponent(text)}`;
        
        // Fetch audio stream from Google TTS bypassing frontend restrictions
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) throw new Error(`Google TTS API returned ${response.status}`);
        
        const buffer = await response.arrayBuffer();
        
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'public, max-age=86400'
            }
        });
    } catch (error) {
        console.error('TTS Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error generating TTS' }, { status: 500 });
    }
}
