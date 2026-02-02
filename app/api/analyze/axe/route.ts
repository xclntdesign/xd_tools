import crypto from 'crypto';
import { NextResponse } from 'next/server';

const stripTrailingSlash = (str: string) => {
    return str.endsWith('/') ? str.slice(0, -1) : str;
};

export async function POST(req: Request) {
    const body = await req.json();
    const payload = JSON.stringify(body);

    if(!body.url) {
        return NextResponse.json({ error: "Invalid request." }, { status: 401 } );
    }

    const timestamp = Date.now().toString();

    const signature = crypto
        .createHmac('sha256', process.env.CM_API_KEY!)
        .update(payload + timestamp)
        .digest('hex');

    const response = await fetch("https://xd-browserless.vercel.app/api/axe", {
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

    const data = await response.json();
    return NextResponse.json(data);
}
