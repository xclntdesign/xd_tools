import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const stripTrailingSlash = (str: string) => {
    return str.endsWith('/') ? str.slice(0, -1) : str;
};

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const url = searchParams.get("url");
    const device = searchParams.get("device");

    if(!url) {
        return NextResponse.json({ error: "Invalid request." }, { status: 401 } );
    }

    const payload = JSON.stringify({
        url: stripTrailingSlash(url),
        device: device,
    });

    const timestamp = Date.now().toString();

    const signature = crypto
        .createHmac('sha256', process.env.CM_API_KEY!)
        .update(payload + timestamp)
        .digest('hex');

    const response = await fetch("https://xd-browserless.vercel.app/api/screenshot", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Signature': signature,
            'X-Timestamp': timestamp
        },
        body: payload
    });

    if(!response) {
        return NextResponse.json({ error: "Invalid request type." }, { status: 401 } );
    }

    const data = await response.blob();

    const headers = new Headers();
    headers.set('Content-Type', 'image/jpeg');
    return new NextResponse(data, { status: 200, headers });
}
