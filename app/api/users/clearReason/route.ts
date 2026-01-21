import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    (await cookies()).set("logout_reason", "", { maxAge: 0 });
    return NextResponse.json({ message: "Success" }, { status: 200 });
}