import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reason = searchParams.get("reason") || "unknown";

  const response = NextResponse.json({ ok: true });
  response.cookies.set("logout_reason", reason, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60, // expires in 1 min
  });

  return response;
}
