import { getWebAuditByClientId } from "@/features/web-audits/queries/get-audits";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const body = await req.json();
    const payload = JSON.stringify(body);

    if(!body.id) {
        return NextResponse.json({ error: "Invalid request." }, { status: 401 } );
    }

    const { status, message, description, data } = await getWebAuditByClientId(body.id);
    
    if(!status) {
        return NextResponse.json({ error: description }, { status: 500 } );
    }

    return NextResponse.json(data, { status: 200 } );
}