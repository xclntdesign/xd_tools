import { emitDetect, expandDetectIds, extractDetectBody, minifyJs, modernizrEpilogue, modernizrPrelude } from "@/features/modernizr/helpers/modernizr";
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const DETECTS_ROOT = path.join(process.cwd(), "node_modules", "modernizr", "feature-detects");

export async function POST(req: Request) {
  const { detects } = await req.json();
  if (!Array.isArray(detects)) {
    return NextResponse.json({ error: "Invalid detects list" }, { status: 400 });
  }

  const { expandedIds, neededHelpers } = await expandDetectIds(detects, DETECTS_ROOT);

  // Minimal Modernizr stub (enough for addTest). You can expand later if needed.
  const Modernizr: any = {
    _version: "custom-internal",
    _config: {},
    addAsyncTest(name: string, test: any) {
      this[name] = typeof test === "function" ? !!test() : !!test;
    },
  };

  const missingHelpers = new Set<string>();
  let out = modernizrPrelude();

for (const id of expandedIds) {
  const src = await fs.readFile(path.join(DETECTS_ROOT, `${id}.js`), "utf8");
  const parsed = extractDetectBody(src); // your brace-aware parser that returns deps/params/body
  out += emitDetect(parsed);
}

out += modernizrEpilogue();

  const minified = minifyJs(out);

  return new NextResponse(minified, {
    headers: {
        "Content-Type": "application/javascript",
        "Content-Disposition": 'attachment; filename="modernizr-custom.min.js"',
    },
    });
}