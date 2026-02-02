import { getWebAudits } from "@/features/web-audits/queries/get-audits";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const supabase = await createClient();
                    
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data?.user) {
        return NextResponse.json({ error: "You are not authorized to make this request." }, { status: 401 });
    }

    const audits = await getWebAudits();

    if (!audits) {
        return NextResponse.json("No reports found.", { status: 200 });
    } else {
        return NextResponse.json(audits, { status: 200 });
    }
}