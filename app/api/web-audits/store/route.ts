import { storeWebAudit } from "@/features/web-audits/actions/store-audit";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const body = await req.json();

    if(!body.url || !body.details) {
        return NextResponse.json({ error: "Invalid request." }, { status: 401 } );
    }

    const { status, message, description, data } = await storeWebAudit(body.url, body.details);
    
    if(!status) {
        return NextResponse.json({ error: description }, { status: 500 } );
    }

    return NextResponse.json({ auditId: data }, { status: 200 } );
}