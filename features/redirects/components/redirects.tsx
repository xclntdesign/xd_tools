"use client";

import { ToolsCard, ToolsCardContent, ToolsCardTitle } from "@/components/tools-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@radix-ui/react-separator";
import { LoaderCircleIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

function parseSitemapXml(xml: string) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");

  // Detect parse errors (browser puts <parsererror> in the document)
  const parserError = doc.getElementsByTagName("parsererror")[0];
  if (parserError) {
    return { ok: false as const, error: "XML parse error. Make sure you pasted valid XML." };
  }

  const isUrlset = doc.getElementsByTagName("urlset").length > 0;
  const isSitemapIndex = doc.getElementsByTagName("sitemapindex").length > 0;

  if (!isUrlset && !isSitemapIndex) {
    return {
      ok: false as const,
      error: "This XML doesn’t look like a sitemap (expected <urlset> or <sitemapindex>).",
    };
  }

  const locNodes = Array.from(doc.getElementsByTagName("loc"));
  const locs = locNodes
    .map((n) => n.textContent?.trim() ?? "")
    .filter(Boolean);

  if (locs.length === 0) {
    return { ok: false as const, error: "No <loc> URLs found in the sitemap." };
  }

  // Optional: validate the <loc> strings are URLs
  const badLoc = locs.find((u) => {
    try { new URL(u); return false; } catch { return true; }
  });
  if (badLoc) {
    return { ok: false as const, error: `Invalid URL found in <loc>: ${badLoc}` };
  }

  return { ok: true as const, locs };
}

function normalizeOrigin(input: string) {
  const u = new URL(input);
  // normalize to origin only (scheme + host + port) and remove trailing slash implicitly
  return u.origin;
}

function stripTrailingSlash(u: string) {
  return u.endsWith("/") ? u.slice(0, -1) : u;
}

function basePrefix(input: string) {
  const u = new URL(input);
  // If user enters https://site.com/newsite/ => basePath="/newsite"
  const basePath = stripTrailingSlash(u.pathname);
  return u.origin + (basePath === "/" ? "" : basePath);
}

function ensureStartsWithPrefix(fullUrl: string, prefix: string) {
  return stripTrailingSlash(fullUrl).startsWith(stripTrailingSlash(prefix));
}

// Returns the suffix after the base prefix, always starting with "/" (or "/" if empty)
function relativeAfterPrefix(fullUrl: string, prefix: string) {
  const full = stripTrailingSlash(fullUrl);
  const pre = stripTrailingSlash(prefix);
  const rest = full.slice(pre.length);
  return rest.startsWith("/") ? rest : `/${rest || ""}` || "/";
}

function joinPrefixAndRelative(prefix: string, rel: string) {
  return stripTrailingSlash(prefix) + (rel.startsWith("/") ? rel : `/${rel}`);
}

function buildDefaultBetaUrl(betaBase: string, originalBase: string, originalLoc: string) {
  const origPrefix = basePrefix(originalBase);
  const betaPrefix = basePrefix(betaBase);

  // Take whatever is after the original base prefix and append to beta prefix
  const rel = relativeAfterPrefix(originalLoc, origPrefix);
  return joinPrefixAndRelative(betaPrefix, rel);
}

function canonicalizeUrl(u: string) {
  const url = new URL(u);

  // Normalize hostname: remove leading www.
  const hostname = url.hostname.replace(/^www\./i, "");

  // Normalize pathname: remove trailing slash (except root)
  const pathname =
    url.pathname === "/" ? "/" : stripTrailingSlash(url.pathname);

  return `${hostname}${pathname}${url.search}`;
}


function toFinalUrl(betaUrl: string, betaBase: string, newBase: string) {
  try {
    const betaPrefix = basePrefix(betaBase);
    const newPrefix = basePrefix(newBase);

    if (!ensureStartsWithPrefix(betaUrl, betaPrefix)) return "";

    const rel = relativeAfterPrefix(betaUrl, betaPrefix);
    return joinPrefixAndRelative(newPrefix, rel);
  } catch {
    return "";
  }
}

export function RedirectBuilderComponent() {
    const [pending, setPending] = useState(false);
    const [rows, setRows] = useState<RedirectRow[]>([]);

    const [originalUrl, setOriginalUrl] = useState("");
    const [betaBaseUrl, setBetaBaseUrl] = useState("");
    const [newBaseUrl, setNewBaseUrl] = useState("");

    const [outputRedirects, setOutputRedirects] = useState<string[] | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const generatorSchema = z
        .object({
            originalUrl: z.url("Invalid URL.").min(1, "An original URL is required."),
            newUrl: z.url("Invalid URL.").min(1, "A new URL is required."),
            betaUrl: z.url("Invalid URL.").min(1, "A beta site URL is required."),
            sitemap: z.string().min(1, "Please add an XML sitemap."),
        })
        .superRefine((val, ctx) => {
            const parsed = parseSitemapXml(val.sitemap);
            if (!parsed.ok) {
                ctx.addIssue({ code: "custom", path: ["sitemap"], message: parsed.error });
                return;
            }

            // Ensure the sitemap URLs match the original base URL (origin)
            const origPrefix = basePrefix(val.originalUrl);

            // Some sitemaps can include multiple origins, but your tool expects one.
            const mismatched = parsed.locs.find((loc) => !ensureStartsWithPrefix(loc, origPrefix));

            if (mismatched) {
            ctx.addIssue({
                code: "custom",
                path: ["originalUrl"],
                message: `Original URL origin (${origPrefix}) doesn't match sitemap URL origin (e.g. ${normalizeOrigin(mismatched)}).`,
            });
            }
        });

    const form = useForm<z.infer<typeof generatorSchema>>({
        resolver: zodResolver(generatorSchema),
        defaultValues: {
            originalUrl: "",
            newUrl: "",
            betaUrl: "",
            sitemap: "",
        }
    });

    async function generateRedirects(data: z.infer<typeof generatorSchema>) {
        setPending(true);
        try {
            const parsed = parseSitemapXml(data.sitemap);
            if (!parsed.ok) {
                toast.error(parsed.error);
                return;
            }

            setOriginalUrl(data.originalUrl);
            setBetaBaseUrl(data.betaUrl);
            setNewBaseUrl(data.newUrl);

            const nextRows: RedirectRow[] = parsed.locs.map((loc, i) => {
                const beta = buildDefaultBetaUrl(data.betaUrl, data.originalUrl, loc);
                const final = toFinalUrl(beta, data.betaUrl, data.newUrl);

                const isSame =
                    final &&
                    canonicalizeUrl(loc) === canonicalizeUrl(final);

                return {
                    id: `${i}-${loc}`,
                    use: !isSame, // 🔥 auto-exclude
                    originalUrl: loc,
                    betaUrl: beta,
                };
            });


            setRows(nextRows);
        } finally {
            setPending(false);
        }
    }

    function generateRedirectText() {
        const useRows = rows.filter(r => r.use);
        const output: string[] = [];

        for (const row of useRows) {
            const final = toFinalUrl(row.betaUrl, betaBaseUrl, newBaseUrl);
            if (!final) continue;

            if (canonicalizeUrl(row.originalUrl) === canonicalizeUrl(final)) {
                continue; // 🚫 never generate self-redirects
            }

            const origPrefix = basePrefix(originalUrl);
            const relPath = relativeAfterPrefix(row.originalUrl, origPrefix); // starts with "/"
            const concatOriginal = stripTrailingSlash(relPath); // "/about" etc

            output.push(`RewriteRule ^${concatOriginal}$ ${final} [R=301,L]`);
        }

        setOutputRedirects(output);
        setDrawerOpen(true);
    }

    function copyRedirectsToClipboard() {
        if (!outputRedirects) return;
        navigator.clipboard.writeText(outputRedirects.join("\n"));
        toast.success("Copied to clipboard!");
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            <form id="redirect-build-form" onSubmit={form.handleSubmit(generateRedirects, () => {
                toast.error("One or more errors need your attention.")
            })}>
                <div className="grid grid-cols-[2fr_2fr_1fr] gap-8 items-start lg:items-center justify-between w-full">
                    <ToolsCard>
                        <ToolsCardTitle>URLs</ToolsCardTitle>
                        <ToolsCardContent>
                            <Controller
                                name="originalUrl"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid} orientation="horizontal"  className="flex flex-row gap-2 items-start justify-start mb-3">
                                        <FieldLabel className="mr-3 mt-3 whitespace-nowrap">Original URL</FieldLabel>
                                        <div className="flex flex-col w-full">
                                            <Input
                                                {...field}
                                                aria-invalid={fieldState.invalid}
                                                className={cn("mb-2 rounded-none border-0 border-b-2 max-w-full", {"border-destructive": fieldState.invalid}, {"border-green-500": !fieldState.invalid && field.value})}
                                            />
                                            <FieldDescription>
                                                Original URL must match URL in sitemap.
                                            </FieldDescription>
                                            {fieldState.invalid && (
                                                <FieldError errors={[fieldState.error]} />
                                            )}
                                        </div>
                                    </Field>
                                )}
                            />
                            <Controller
                                name="newUrl"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid} orientation="horizontal"  className="flex flex-row gap-2 items-start justify-start mb-3">
                                        <FieldLabel className="mr-3 mt-3 whitespace-nowrap">New URL</FieldLabel>
                                        <div className="flex flex-col w-full">
                                            <Input
                                                {...field}
                                                aria-invalid={fieldState.invalid}
                                                className={cn("mb-2 rounded-none border-0 border-b-2 max-w-full", {"border-destructive": fieldState.invalid}, {"border-green-500": !fieldState.invalid && field.value})}
                                            />
                                            {fieldState.invalid && (
                                                <FieldError errors={[fieldState.error]} />
                                            )}
                                        </div>
                                    </Field>
                                )}
                            />
                            <Controller
                                name="betaUrl"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid} orientation="horizontal"  className="flex flex-row gap-2 items-start justify-start">
                                        <FieldLabel className="mr-3 mt-3 whitespace-nowrap">Beta Site URL</FieldLabel>
                                        <div className="flex flex-col w-full">
                                            <Input
                                                {...field}
                                                aria-invalid={fieldState.invalid}
                                                className={cn("mb-2 rounded-none border-0 border-b-2 max-w-full", {"border-destructive": fieldState.invalid}, {"border-green-500": !fieldState.invalid && field.value})}
                                            />
                                            {fieldState.invalid && (
                                                <FieldError errors={[fieldState.error]} />
                                            )}
                                        </div>
                                    </Field>
                                )}
                            />
                        </ToolsCardContent>
                    </ToolsCard>
                    <ToolsCard>
                        <ToolsCardTitle>Sitemap</ToolsCardTitle>
                        <ToolsCardContent>
                            <Controller
                                name="sitemap"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <Textarea
                                            {...field}
                                            aria-invalid={fieldState.invalid}
                                            className={cn("mb-2 rounded-none border-0 border-b-2 max-w-full max-h-72", {"border-destructive": fieldState.invalid}, {"border-green-500": !fieldState.invalid && field.value})}
                                        />
                                        <FieldDescription>
                                            Please add an XML sitemap.
                                        </FieldDescription>
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                        </ToolsCardContent>
                    </ToolsCard>
                    <ToolsCard>
                        <ToolsCardTitle>Parse Sitemap</ToolsCardTitle>
                        <ToolsCardContent>
                            <Button
                                className="cursor-pointer"
                                type="submit"
                                size="lg"
                                disabled={pending}
                            >
                                {pending ? (
                                    <>
                                    Parsing... <LoaderCircleIcon className="size-4 animate-spin" />
                                    </>
                                ) : "Parse"}
                            </Button>
                        </ToolsCardContent>
                    </ToolsCard>
                </div>
                <div className="grid gap-4 my-4">
                    <ToolsCard>
                        <ToolsCardTitle className="border-l-blue-500">Redirect Builder</ToolsCardTitle>
                        <ToolsCardContent>
                            {rows.length > 0 && (
                                <>
                                <RedirectListEditor rows={rows} setRows={setRows} betaBaseUrl={betaBaseUrl} newBaseUrl={newBaseUrl} originalUrl={originalUrl} />
                                <Button
                                    className="cursor-pointer"
                                    type="button"
                                    size="lg"
                                    disabled={pending}
                                    onClick={generateRedirectText}
                                >
                                    {pending ? (
                                        <>
                                        Generating... <LoaderCircleIcon className="size-4 animate-spin" />
                                        </>
                                    ) : "Generate Redirects"}
                                </Button>
                                </>
                            )}
                        </ToolsCardContent>
                    </ToolsCard>
                </div>
            </form>
            <Drawer direction="right" open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Redirects</DrawerTitle>
                        <DrawerDescription>
                            Copy and paste the following into your .htaccess file.
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="no-scrollbar overflow-y-auto px-4">
                        {outputRedirects && outputRedirects.length > 0 && outputRedirects.map((r, i) => (
                            <p className="font-mono mb-2 text-sm" key={i}>{r}</p>
                        ))}
                    </div>
                    <DrawerFooter className="flex flex-row gap-4">
                        <Button
                            type="button"
                            size="lg"
                            className="cursor-pointer"
                            onClick={copyRedirectsToClipboard}
                        >
                            Copy
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="outline" type="button" className="cursor-pointer">Close</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    );
}

type RedirectRow = {
  id: string;
  use: boolean;
  originalUrl: string;
  betaUrl: string; // what user pastes/edits
};

export function RedirectRowItem({
  row,
  onChange,
  betaBaseUrl,
  newBaseUrl,
}: {
  row: RedirectRow;
  onChange: (patch: Partial<RedirectRow>) => void;
  betaBaseUrl: string;
  newBaseUrl: string;
}) {
    const [finalPreview, setFinalPreview] = useState(toFinalUrl(row.betaUrl, betaBaseUrl, newBaseUrl));

    function changeBetaUrl(newUrl: string) {
        onChange({ betaUrl: newUrl });
        const final = toFinalUrl(newUrl, betaBaseUrl, newBaseUrl);
        setFinalPreview(final);
        if(canonicalizeUrl(row.originalUrl) === canonicalizeUrl(final)) {
            onChange({ use: false });
        } else {
            onChange({ use: true });
        }
    }

  return (
    <div className="grid grid-cols-2 gap-4 items-start mb-4">
        <div className="flex flex-row gap-4 items-center">
            <Switch
                checked={row.use}
                onCheckedChange={(checked) => onChange({ use: checked })}
            />
            <Input
                type="url"
                value={row.originalUrl}
                disabled
                readOnly
                className="rounded-none border-0 border-b-2 max-w-full"
            />
        </div>
        <div className="flex flex-col gap-2">
            <Input
                type="url"
                value={row.betaUrl}
                onChange={(e) => changeBetaUrl(e.target.value)}
                placeholder="https://testing.newsite.com/target-path/"
                className="rounded-none border-0 border-b-2 max-w-full"
            />
            {!row.use && finalPreview && (
                <div className="text-xs text-muted-foreground italic">
                    No redirect needed (URL unchanged)
                </div>
            )}
            {row.use && finalPreview && (
                <div className="text-xs text-muted-foreground">Final URL: {finalPreview}</div>
            )}
        </div>
    </div>
  );
}

export function RedirectListEditor({
  rows,
  setRows,
  betaBaseUrl,
  newBaseUrl,
  originalUrl,
}: {
  rows: RedirectRow[];
  setRows: React.Dispatch<React.SetStateAction<RedirectRow[]>>;
  betaBaseUrl: string;
  newBaseUrl: string;
  originalUrl: string;
}) {
  const updateRow = (id: string, patch: Partial<RedirectRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };

    const [showMissingOnly, setShowMissingOnly] = useState(false);

    const selectAll = () => setRows(prev => prev.map(r => ({ ...r, use: true })));

    const selectNone = () => setRows(prev => prev.map(r => ({ ...r, use: false })));

    const clearBetaUrls = () => setRows(prev => prev.map(r => ({ ...r, betaUrl: "" })));

    // Only fill missing beta URLs (recommended)
    const autofillMissingBetaUrls = (betaBase: string, originalBase: string) => {
    setRows(prev =>
        prev.map(r => {
        if (r.betaUrl.trim()) return r;
        return {
            ...r,
            betaUrl: buildDefaultBetaUrl(betaBase, originalBase, r.originalUrl),
        };
        })
    );
    };

    const [query, setQuery] = useState("");

    const visibleRows = rows.filter(r => {
        if (showMissingOnly && r.betaUrl.trim() !== "") return false;

        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return r.originalUrl.toLowerCase().includes(q) || r.betaUrl.toLowerCase().includes(q);
    });

  return (
    <>
    <RedirectToolbar
        rows={rows}
        originalBaseUrl={originalUrl}
        betaBaseUrl={betaBaseUrl}
        showMissingOnly={showMissingOnly}
        setShowMissingOnly={setShowMissingOnly}
        selectAll={selectAll}
        selectNone={selectNone}
        clearBetaUrls={clearBetaUrls}
        autofillMissingBetaUrls={autofillMissingBetaUrls}
    />

    
    <div>
      {visibleRows.map((row) => (
        <RedirectRowItem
          key={row.id}
          row={row}
          onChange={(patch) => updateRow(row.id, patch)}
          betaBaseUrl={betaBaseUrl}
          newBaseUrl={newBaseUrl}
        />
      ))}
    </div>
    </>
  );
}

export function RedirectToolbar({
  rows,
  originalBaseUrl,
  betaBaseUrl,
  showMissingOnly,
  setShowMissingOnly,
  selectAll,
  selectNone,
  clearBetaUrls,
  autofillMissingBetaUrls,
  // optional
  // autofillAllBetaUrls,
}: {
  rows: RedirectRow[];
  originalBaseUrl: string;
  betaBaseUrl: string;
  showMissingOnly: boolean;
  setShowMissingOnly: (v: boolean) => void;

  selectAll: () => void;
  selectNone: () => void;
  clearBetaUrls: () => void;
  autofillMissingBetaUrls: (betaBase: string, originalBase: string) => void;
  // autofillAllBetaUrls?: (betaBase: string, originalBase: string) => void;
}) {
  const includedCount = rows.filter((r) => r.use).length;
  const missingBetaCount = rows.filter((r) => !r.betaUrl.trim()).length;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={selectAll}>
          Select all
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={selectNone}>
          Select none
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button type="button" variant="outline" size="sm" onClick={clearBetaUrls}>
          Clear beta URLs
        </Button>

        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => autofillMissingBetaUrls(betaBaseUrl, originalBaseUrl)}
        >
          Auto-fill missing beta URLs
        </Button>

      </div>

      <div className="ml-auto flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch checked={showMissingOnly} onCheckedChange={setShowMissingOnly} />
          <span className="text-sm text-muted-foreground">Missing beta only</span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            Included: {includedCount}/{rows.length}
          </Badge>
          <Badge variant={missingBetaCount > 0 ? "destructive" : "secondary"}>
            Missing beta: {missingBetaCount}
          </Badge>
        </div>
      </div>
    </div>
  );
}