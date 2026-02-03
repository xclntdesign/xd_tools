import { getProjects } from "@/features/projects/queries/get-projects";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const supabase = await createClient();
                    
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data?.user) {
        return NextResponse.json({ error: "You are not authorized to make this request." }, { status: 401 });
    }

    const projects = await getProjects();

    if (!projects) {
        return NextResponse.json("No reports found.", { status: 200 });
    } else {
        return NextResponse.json(projects, { status: 200 });
    }
}