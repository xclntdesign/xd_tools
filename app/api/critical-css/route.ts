import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 1) Protect THIS route
  const callerSecret = req.headers.get("x-caller-secret");
  if (!process.env.CRITICAL_CSS_CALLER_SECRET) {
    return NextResponse.json({ error: "Server misconfigured (missing secret)." }, { status: 500 });
  }
  if (callerSecret !== process.env.CRITICAL_CSS_CALLER_SECRET) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // 2) Parse request body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!body?.url || typeof body.url !== "string") {
    return NextResponse.json({ error: "Missing or invalid url." }, { status: 400 });
  }

  // Optional: allow passing settleMs/viewports through, no extra work needed.

  // 3) Sign upstream request (your existing scheme)
  const payload = JSON.stringify(body);
  const timestamp = Date.now().toString();

  if (!process.env.CM_API_KEY) {
    return NextResponse.json({ error: "Server misconfigured (missing CM_API_KEY)." }, { status: 500 });
  }

  const signature = crypto
    .createHmac("sha256", process.env.CM_API_KEY)
    .update(payload + timestamp)
    .digest("hex");


  // 4) Timeout so it doesn't hang
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    if (!process.env.CRITICAL_CSS_UPSTREAM_URL) {
      return NextResponse.json(
        { error: "Server misconfigured (missing CRITICAL_CSS_UPSTREAM_URL)." },
        { status: 500 }
      );
    }

    const response = await fetch(process.env.CRITICAL_CSS_UPSTREAM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signature": signature,
        "x-timestamp": timestamp,
      },
      body: payload,
      signal: controller.signal,
      cache: "no-store",
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Upstream critical-css service returned an error.",
          status: response.status,
          upstream: text,
        },
        { status: 502 }
      );
    }

    const data = text ? JSON.parse(text) : null;
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    const aborted = err?.name === "AbortError";
    return NextResponse.json(
      {
        error: aborted ? "Upstream request timed out." : "Failed to call upstream critical-css service.",
        details: err?.message ? String(err.message) : String(err),
      },
      { status: aborted ? 504 : 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
