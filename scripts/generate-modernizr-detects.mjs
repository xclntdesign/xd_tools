import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const DETECTS_ROOT = path.join(root, "node_modules", "modernizr", "feature-detects");

// Your existing list JSON (adjust path to wherever it lives)
const LIST_FILE = path.join(root, "node_modules", "modernizr", "lib", "config-all.json");

// Output consumed by the Next.js UI
const OUT_FILE = path.join(root, "public", "modernizr-detects.json");

// Optional: nicer labels for the top-level folders you showed
const CATEGORY_MAP = {
  a: "Links",
  audio: "Audio",
  battery: "Battery",
  canvas: "Canvas",
  crypto: "Crypto",
  css: "CSS",
  dart: "Dart",
  dom: "DOM",
  elem: "Elements",
  es5: "ES5",
  es6: "ES6",
  es7: "ES7",
  es8: "ES8",
  event: "Events",
  file: "File",
  iframe: "IFrame",
  img: "Images",
  input: "Input",
  mediaquery: "Media Queries",
  network: "Network",
  link: "Link",
  script: "Script",
  speech: "Speech",
  storage: "Storage",
  style: "Style",
  svg: "SVG",
  textarea: "Textarea",
  url: "URL",
  video: "Video",
  webauthn: "WebAuthn",
  webgl: "WebGL",
  webrtc: "WebRTC",
  websockets: "WebSockets",
  window: "Window",
  workers: "Workers",
};

function categoryFromId(id) {
  const top = id.split("/")[0];
  // If it's a root detect like "contextmenu", top === id and no folder is present
  if (!id.includes("/")) return "Misc";
  return CATEGORY_MAP[top] ?? top.toUpperCase();
}

function extractHeaderJson(source) {
  const m = source.match(/\/\*!\s*([\s\S]*?)\s*!\*\//);
  if (!m) return null;
  const raw = m[1].trim();
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function extractDocBlock(source) {
  const m = source.match(/\/\*\s*DOC\s*([\s\S]*?)\*\//);
  if (!m) return "";
  return m[1]
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .trim();
}

function caniuseUrl(key) {
  if (!key) return null;
  // Search URL is robust even if the key isn’t a perfect slug
  return `https://caniuse.com/?search=${encodeURIComponent(key)}`;
}

function caniuseEmbedUrl(key) {
  if (!key) return null;
  return `https://caniuse.bitsofco.de/embed/index.html?feat=${key}&periods=future_1,current,past_1,past_2,past_3,past_4,past_5&accessible-colours=false&image-base=none`;
}

async function main() {
  const listRaw = JSON.parse(await fs.readFile(LIST_FILE, "utf8"));
  const ids = listRaw["feature-detects"];

  if (!Array.isArray(ids)) {
    throw new Error(`Expected LIST_FILE to contain {"feature-detects": [...]} at ${LIST_FILE}`);
  }

  const items = [];
  const missing = [];

  for (const id of ids) {
    const filePath = path.join(DETECTS_ROOT, `${id}.js`);
    let source;
    try {
      source = await fs.readFile(filePath, "utf8");
    } catch {
      missing.push(id);
      continue;
    }

    const header = extractHeaderJson(source) ?? {};
    const doc = extractDocBlock(source);

    items.push({
      id,                                // e.g. "css/flexbox"
      category: categoryFromId(id),       // derived
      name: header.name ?? null,          // e.g. "Context menus"
      property: header.property ?? null,  // e.g. "contextmenu"
      description: doc || null,           // from /* DOC */
      caniuse: header.caniuse ?? null,     // e.g. "menu"
      caniuseUrl: caniuseUrl(header.caniuse),
      caniuseEmbedUrl: caniuseEmbedUrl(header.caniuse),
      notes: header.notes ?? [],
      polyfills: header.polyfills ?? [],
    });
  }

  items.sort(
    (a, b) => a.category.localeCompare(b.category) || (a.name ?? a.id).localeCompare(b.name ?? b.id)
  );

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify({ generatedAt: new Date().toISOString(), items, missing }, null, 2));

  console.log(`Wrote ${items.length} detects → ${path.relative(root, OUT_FILE)}`);
  if (missing.length) {
    console.warn(`Missing ${missing.length} files (check Modernizr version / paths).`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
