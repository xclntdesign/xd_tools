import { BrokenLink } from "@/features/web-audits/components/web-audit";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // important

export async function POST(req: Request) {
    const body = await req.json();
    const payload = JSON.stringify(body);

    if(!body.url) {
        return NextResponse.json({ error: "Invalid request." }, { status: 401 } );
    }

    const { LinkChecker } = await import("linkinator");
    
    const checker = new LinkChecker();
    const results = await checker.check({
        path: body.url,
        recurse: true,
        checkCss: true,
        retry: true,
        timeout: 10000,
        concurrency: 5,
    });

    let brokenLinks: BrokenLink[] = [];
    if(!results.passed) {
        brokenLinks = results.links.filter(x => x.state === "BROKEN");
    }

    return NextResponse.json({ 
        passed: results.passed,
        brokenLinks: brokenLinks,
        brokenLinksCount: brokenLinks.length,
        totalLinks: results.links.length,
     });
}