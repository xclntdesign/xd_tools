import { BrokenLink } from "@/features/web-audits/components/web-audit";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isTimeoutLike(err: any) {
  return err?.name === "TimeoutError" || err?.code === 23 || /tim(e)?out/i.test(String(err?.message ?? ""));
}

function safeMessage(err: any) {
  // Avoid touching err.message directly if it's getter-only
  try {
    return typeof err?.message === "string" ? err.message : String(err);
  } catch {
    return String(err);
  }
}

export async function POST(req: Request) {
    const { LinkChecker } = await import("linkinator");
    const checker = new LinkChecker();
        
    let lastPage = "";
    let lastLink = "";

    checker.on("pagestart", (url: string) => { lastPage = url; });
    checker.on("link", (result: any) => { lastLink = result?.url ?? lastLink; });

    try {
        const body = await req.json();

        if (!body?.url) {
            return NextResponse.json({ error: "Invalid request." }, { status: 401 });
        }

        const results = await checker.check({
            path: body.url,
            recurse: true,
            checkCss: false,
            retry: true,
            timeout: 10_000,  // per-request timeout
            concurrency: 1,
            linksToSkip: [
                ".*\\?.*",   // query strings
                ".*#.*",     // fragments
                ".*/calendar/.*",
                ".*/search/.*",
                "xmlrpc.php", //comes up forbidden in some WP installs
            ],
        });

        const brokenLinks: BrokenLink[] = results.passed
        ? []
        : results.links.filter((x: any) => x.state === "BROKEN");

        return NextResponse.json({
            passed: results.passed,
            brokenLinks,
            brokenLinksCount: brokenLinks.length,
            totalLinks: results.links.length,
        });
  } catch (err: any) {
    console.error(lastPage, lastLink);
    return NextResponse.json(
        { error: "Audit failed", lastPage, lastLink },
        { status: 500 }
    );
  }
}
