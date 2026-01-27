import fs from "node:fs/promises";
import path from "node:path";

type ParsedDetect = {
  deps: string[];
  params: string[];
  body: string;
};

/**
 * Extracts AMD define([deps], function(params){ ...body... });
 * Handles nested braces by scanning and skipping strings/comments.
 */
export function extractDetectBody(source: string): ParsedDetect {
  // Optional: strip Modernizr metadata blocks; safe to keep, but this helps matching
  let s = source
    .replace(/\/\*!\s*[\s\S]*?\s*!\*\//g, "")
    .replace(/\/\*\s*DOC[\s\S]*?\*\//g, "");

  const defineIdx = s.indexOf("define");
  if (defineIdx === -1) throw new Error("No define() call found");

  // Find first "(" after "define"
  const openParen = s.indexOf("(", defineIdx);
  if (openParen === -1) throw new Error("Malformed define(): missing '('");

  // Parse deps array: define( [ ... ] , function ...
  const openBracket = findNextNonSpace(s, openParen + 1);
  if (s[openBracket] !== "[") throw new Error("Malformed define(): missing deps array '['");

  const depsEnd = findMatching(s, openBracket, "[", "]");
  const depsRaw = s.slice(openBracket + 1, depsEnd);

  const deps = Array.from(depsRaw.matchAll(/['"]([^'"]+)['"]/g)).map((m) => m[1]);

  // Find "function" after deps array
  const funcIdx = s.indexOf("function", depsEnd);
  if (funcIdx === -1) throw new Error("Malformed define(): missing function()");

  const funcOpenParen = s.indexOf("(", funcIdx);
  if (funcOpenParen === -1) throw new Error("Malformed function(): missing '('");

  const funcParamsEnd = findMatching(s, funcOpenParen, "(", ")");
  const paramsRaw = s.slice(funcOpenParen + 1, funcParamsEnd);

  const params = paramsRaw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  // Find function body block { ... }
  const funcOpenBrace = findNextNonSpace(s, funcParamsEnd + 1);
  if (s[funcOpenBrace] !== "{") throw new Error("Malformed function(): missing '{'");

  const funcBodyEnd = findMatching(s, funcOpenBrace, "{", "}");
  const body = s.slice(funcOpenBrace + 1, funcBodyEnd).trim();

  return { deps, params, body };
}

/** Backwards compatible name (optional) */
export function parseAmdDefine(source: string): ParsedDetect {
  return extractDetectBody(source);
}

function findNextNonSpace(str: string, start: number): number {
  let i = start;
  while (i < str.length && /\s/.test(str[i]!)) i++;
  return i;
}

/**
 * Finds the matching closer for a bracket/brace/paren starting at `openIndex`,
 * while skipping strings and comments.
 */
function findMatching(str: string, openIndex: number, openCh: string, closeCh: string): number {
  let depth = 0;

  let i = openIndex;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;

  while (i < str.length) {
    const ch = str[i]!;
    const next = str[i + 1];

    // Handle comments
    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      i++;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    // Start comments (only if not inside a string/template)
    if (!inSingle && !inDouble && !inTemplate) {
      if (ch === "/" && next === "/") {
        inLineComment = true;
        i += 2;
        continue;
      }
      if (ch === "/" && next === "*") {
        inBlockComment = true;
        i += 2;
        continue;
      }
    }

    // Handle string/template toggles
    if (!inDouble && !inTemplate && ch === "'" && !isEscaped(str, i)) {
      inSingle = !inSingle;
      i++;
      continue;
    }
    if (!inSingle && !inTemplate && ch === `"` && !isEscaped(str, i)) {
      inDouble = !inDouble;
      i++;
      continue;
    }
    if (!inSingle && !inDouble && ch === "`" && !isEscaped(str, i)) {
      inTemplate = !inTemplate;
      i++;
      continue;
    }

    // If we're inside a string/template, don't count braces
    if (inSingle || inDouble || inTemplate) {
      i++;
      continue;
    }

    // Count nesting
    if (ch === openCh) depth++;
    else if (ch === closeCh) {
      depth--;
      if (depth === 0) return i;
    }

    i++;
  }

  throw new Error(`Unterminated block: expected matching '${closeCh}' for '${openCh}'`);
}

function isEscaped(str: string, i: number): boolean {
  // count backslashes immediately before i
  let bs = 0;
  let j = i - 1;
  while (j >= 0 && str[j] === "\\") {
    bs++;
    j--;
  }
  return bs % 2 === 1;
}

export function getHelperModule(name: string) {
  switch (name) {
    case "docElement":
      return () => document.documentElement;

    case "createElement":
      return () => (tag: string) => document.createElement(tag);

    case "isEventSupported":
      return () => (eventName: string, element?: Element) => {
        const el = element ?? document.createElement("div");
        const prop = "on" + eventName;
        return prop in el;
      };

    case "testStyles":
      return () =>
        (rule: string, cb: (node: HTMLElement, rule: string) => void, nodes = 1, testnames?: string[]) => {
          const style = document.createElement("style");
          style.type = "text/css";
          style.textContent = rule;

          const div = document.createElement("div");
          (document.body || document.documentElement).appendChild(style);
          (document.body || document.documentElement).appendChild(div);

          for (let i = 0; i < nodes; i++) {
            div.appendChild(document.createElement("div"));
          }

          try {
            cb(div, rule);
          } finally {
            style.remove();
            div.remove();
          }
        };

    default:
      return null;
  }
}

export async function exists(p: string) {
  try { await fs.access(p); return true; } catch { return false; }
}

export async function expandDetectIds(detectIds: string[], detectsRoot: string) {
  const expanded = new Set(detectIds);
  const neededHelpers = new Set<string>();

  const queue = [...detectIds];

  while (queue.length) {
    const id = queue.pop()!;
    const filePath = path.join(detectsRoot, `${id}.js`);
    const src = await fs.readFile(filePath, "utf8");
    const parsed = parseAmdDefine(src);

    for (const dep of parsed.deps) {
      if (dep === "Modernizr") continue;

      if (dep.includes("/")) {
        const maybeId = dep.replace(/^feature-detects\//, "");
        const depPath = path.join(detectsRoot, `${maybeId}.js`);
        if (await exists(depPath)) {
          if (!expanded.has(maybeId)) {
            expanded.add(maybeId);
            queue.push(maybeId);
          }
          continue;
        }
      }

      // helper module
      neededHelpers.add(dep);
    }
  }

  return {
    expandedIds: Array.from(expanded),
    neededHelpers: Array.from(neededHelpers),
  };
}

export function compileDetect(body: string, params: string[]) {
  // Creates a function with signature (...params) => { body }
  // Example: new Function("Modernizr", "docElement", "/* body */");
  return new Function(...params, body) as (...args: any[]) => void;
}

export function resolveArgs(deps: string[], params: string[], Modernizr: any) {
  // deps and params align in Modernizr detects
  return deps.map((dep, i) => {
    if (dep === "Modernizr") return Modernizr;

    const helperFactory = getHelperModule(dep);
    if (helperFactory) return helperFactory();

    // unresolved helper: pass undefined (we’ll warn upstream)
    return undefined;
  });
}

export function minifyJs(source: string): string {
  let out = "";

  let i = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;

  let inLineComment = false;
  let inBlockComment = false;

  let lastWasSpace = false;

  while (i < source.length) {
    const ch = source[i]!;
    const next = source[i + 1];

    // comments
    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
        // treat newline like a space boundary
        if (!lastWasSpace) {
          out += " ";
          lastWasSpace = true;
        }
      }
      i++;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    // start comments (only when not in strings)
    if (!inSingle && !inDouble && !inTemplate) {
      if (ch === "/" && next === "/") {
        inLineComment = true;
        i += 2;
        continue;
      }
      if (ch === "/" && next === "*") {
        inBlockComment = true;
        i += 2;
        continue;
      }
    }

    // toggle strings/templates
    if (!inDouble && !inTemplate && ch === "'" && !isEscaped(source, i)) {
      inSingle = !inSingle;
      out += ch;
      i++;
      lastWasSpace = false;
      continue;
    }
    if (!inSingle && !inTemplate && ch === `"` && !isEscaped(source, i)) {
      inDouble = !inDouble;
      out += ch;
      i++;
      lastWasSpace = false;
      continue;
    }
    if (!inSingle && !inDouble && ch === "`" && !isEscaped(source, i)) {
      inTemplate = !inTemplate;
      out += ch;
      i++;
      lastWasSpace = false;
      continue;
    }

    // inside strings/templates: keep as-is
    if (inSingle || inDouble || inTemplate) {
      out += ch;
      i++;
      lastWasSpace = false;
      continue;
    }

    // outside strings: collapse whitespace
    if (/\s/.test(ch)) {
      if (!lastWasSpace) {
        out += " ";
        lastWasSpace = true;
      }
      i++;
      continue;
    }

    // trim spaces around common punctuation
    if ("{}();,:".includes(ch)) {
      // remove trailing space we may have added before punctuation
      if (out.endsWith(" ")) out = out.slice(0, -1);
      out += ch;
      lastWasSpace = false;
      i++;
      // skip immediate whitespace after punctuation
      while (i < source.length && /\s/.test(source[i]!)) i++;
      continue;
    }

    out += ch;
    lastWasSpace = false;
    i++;
  }

  return out.trim();
}

export function modernizrPrelude() {
  return `
(function(window, document) {
  var Modernizr = window.Modernizr || (window.Modernizr = {});
  Modernizr._config = Modernizr._config || {};

  Modernizr.addTest = function(name, test, options) {
    var result = (typeof test === 'function') ? !!test() : !!test;
    Modernizr[name] = result;

    if (options && options.aliases && options.aliases.length) {
      for (var i = 0; i < options.aliases.length; i++) {
        Modernizr[options.aliases[i]] = result;
      }
    }
  };

  Modernizr.addAsyncTest = function(fn) {
    // Async detects typically set up onload/onerror handlers.
    // Running now is correct; results will be set later via addTest().
    try { fn(); } catch (e) {}
  };

  // Common helpers used by many detects
  var docElement = document.documentElement;

  function addTest(name, test, options) {
    Modernizr.addTest(name, test, options);
  }
`;
}

export function modernizrEpilogue() {
  return `
})(window, document);
`;
}

export function emitDetect(parsed: { deps: string[]; params: string[]; body: string }) {
  // Map AMD deps -> expressions available in the prelude
  const depExpr = parsed.deps.map((dep) => {
    if (dep === "Modernizr") return "Modernizr";
    if (dep === "docElement") return "docElement";
    if (dep === "addTest") return "addTest";
    if (dep === "addAsyncTest") return "Modernizr.addAsyncTest";
    // Anything unknown: pass undefined (and optionally warn)
    return "undefined";
  });

  return `
(function(${parsed.params.join(",")}) {
${parsed.body}
})(${depExpr.join(",")});
`;
}