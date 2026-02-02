"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckIcon, Copy, ExternalLink, XIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { LhAuditRow } from "../utils";
import { LhEntityGroupedTable } from "./lighthouse-grouped-table";

function extractLearnMoreUrl(description?: string) {
  // Lighthouse descriptions often include markdown links: [Learn more](https://...)
  if (!description) return null;
  const match = description.match(/\((https?:\/\/[^\s)]+)\)/);
  return match?.[1] ?? null;
}

function scoreLabel(score: number | null, mode?: string) {
  if (mode === "notApplicable") return "N/A";
  if (mode === "informative") return "Informative";
  if (mode === "manual") return "Manual";
  if (score === null) return "—";
  return `${Math.round(score * 100)}`;
}

export function LighthouseAuditDrawer({
  open,
  onOpenChange,
  row,
  showCloseX = true
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: LhAuditRow | null;
  showCloseX?: boolean;
}) {
  const audit = row?.audit;
  const learnMore = extractLearnMoreUrl(audit?.description);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[50vw] sm:max-w-[50vw] p-0" showCloseX={showCloseX} onOpenAutoFocus={(event) => event.preventDefault()}>
        {!row || !audit ? (
          <div className="flex h-full flex-col">
            <SheetHeader className="p-6 pb-4">
              <SheetTitle>
                Select Audit
              </SheetTitle>
              <SheetDescription className="mt-1">
                Select an audit to view details.
              </SheetDescription>
            </SheetHeader>
          <div className="px-3 pb-5 text-right">
                <SheetClose asChild>
                    <Button className="cursor-pointer">Close</Button>
                </SheetClose>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <SheetHeader className="p-6 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <SheetTitle className="text-lg leading-tight">
                    <span className="block truncate">{audit.title}</span>
                  </SheetTitle>
                  <SheetDescription className="mt-1">
                    <span className="block truncate">Audit: {audit.id}</span>
                  </SheetDescription>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Lighthouse</Badge>
                    <Badge variant="outline">Best Practices</Badge>
                    <Badge variant="secondary" className="capitalize">
                      {row.group.replace("best-practices-", "").replaceAll("-", " ")}
                    </Badge>
                    <Badge variant="outline">Mode: {audit.scoreDisplayMode ?? "—"}</Badge>
                    <Badge variant="outline">Score: {scoreLabel(audit.score ?? null, audit.scoreDisplayMode)}</Badge>
                    <Badge variant="outline">Details: {audit.details?.type ?? "—"}</Badge>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  <div className="flex justify-end gap-2">
                    {learnMore ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => window.open(learnMore, "_blank", "noopener,noreferrer")} className="cursor-pointer">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>More help available</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : null}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(audit.id)} className="cursor-pointer">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                          <p>Copy Audit ID</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {audit.description ? (
                <div className="mt-4 rounded-lg border p-4 text-sm text-muted-foreground">
                  <div className="font-medium text-foreground">What this means</div>
                  <ReactMarkdown>{audit?.description}</ReactMarkdown>
                </div>
              ) : null}
            </SheetHeader>

            <Separator />

            <Tabs defaultValue="evidence" className="flex flex-1 flex-col overflow-hidden">
              <div className="px-6 pt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="evidence" className="cursor-pointer">Evidence</TabsTrigger>
                  <TabsTrigger value="raw" className="cursor-pointer">Raw</TabsTrigger>
                  <TabsTrigger value="meta" className="cursor-pointer">Meta</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="evidence" className="flex-1 overflow-hidden min-w-0">
                <ScrollArea className="h-full">
                  <div className="px-6 py-4 space-y-4">
                    <EvidenceBlock audit={audit} />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="raw" className="flex-1 overflow-hidden min-w-0">
                <ScrollArea className="h-full">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Raw audit JSON</div>
                      <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(JSON.stringify(audit, null, 2))}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                    <pre className="mt-3 rounded-lg border bg-muted p-3 text-xs overflow-auto whitespace-pre-wrap wrap-break-word md:whitespace-pre">
                      {JSON.stringify(audit, null, 2)}
                    </pre>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="meta" className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="px-6 py-4 text-sm text-muted-foreground space-y-2">
                    <div>
                      <span className="font-medium text-foreground">Score:</span> {String(audit.score ?? "—")}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Display mode:</span> {audit.scoreDisplayMode ?? "—"}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Display value:</span> {audit.displayValue ?? "—"}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Numeric value:</span> {audit.numericValue ?? "—"} {audit.numericUnit ?? ""}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
            <div className="px-3 py-5 text-right">
                <SheetClose asChild>
                    <Button className="cursor-pointer">Close</Button>
                </SheetClose>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function parseTableValue(value: any, type?: string) {
  if(value.type) {
    if(value.type === "source-location") {
      return JSON.stringify(value, null, 2);
    }
    if(value.type === "node") {
      return String(value.selector);
    }
    return String(value.value);
  } else {
    if(type === "bytes") {
      const val = Number(value).toLocaleString();
      return String(val);
    }
    if(type === "ms") {
      const val = Number(value).toFixed(2).toLocaleString();
      return String(val + " ms");
    }
    return String(value);
  }
}

function EvidenceBlock({ audit }: { audit: any }) {
  const details = audit.details;

  if (!details) {
    return (
      <div className="rounded-lg border p-4">
        <div className="text-sm font-medium">Evidence</div>
        <div className="mt-2 text-sm text-muted-foreground">
          {audit.displayValue ? audit.displayValue : "No detailed evidence was provided for this audit."}
        </div>
      </div>
    );
  }

  if (details.type === "table" && details.isEntityGrouped) {
    return <LhEntityGroupedTable details={details} />;
  }

  if (details.type === "table") {
    const headings = details.headings ?? [];
    const items: Array<Record<string, any>> = details.items ?? [];

    return (
      <div className="rounded-lg border">
        <div className="p-4 flex items-center justify-between">
          <div className="text-sm font-medium">Evidence table</div>
          <Badge variant="outline">{items.length} row(s)</Badge>
        </div>
        <Separator />
        {items.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No items were reported for this audit.
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Simple responsive table-ish rendering (better than a real <table> on mobile) */}
            {items.map((it, idx) => (
              <div key={idx} className="rounded-md border p-3 space-y-2">
                {headings.map((h: any) => (
                  <div key={h.key} className="text-sm">
                    <div className="text-xs text-muted-foreground">{h.label ?? h.key}</div>
                    <div className="mt-0.5 wrap-break-word whitespace-pre-wrap font-mono text-xs md:text-sm md:font-sans">
                      {parseTableValue(it[h.key] ?? "-", h.valueType)}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if(details.type === "checklist") {
    const items: Record<string, { value: boolean; label: string }> = details.items ?? {};
    const checklist = Object.entries(items).map(([key, val]) => ({
      id: key,
      ...val,
    }));

    return (
      <div className="rounded-lg border p-4">
        <div className="p-4 flex items-center justify-between">
          <div className="text-sm font-medium">Evidence List</div>
          <Badge variant="outline">{checklist.length} item(s)</Badge>
        </div>
        <Separator />
        <ul className="w-full flex flex-col divide-y divide-line-2">
          {checklist.map((it, idx) => (
            <li className="inline-flex items-center gap-x-2 py-3 gap-4 text-sm font-medium text-foreground w-full" key={idx}>
              {it.value ? <CheckIcon className="text-green-500 size-4" /> : <XIcon className="text-red-500 size-4" />}
              {it.label}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if(details.type === "list") {
    return (
      <>
      {details.items.length > 0 && details.items.map((item: any, idx: number) => {
        const aud = {
          details: item
        };
        return <EvidenceBlock key={idx} audit={aud} />
      })}
      </>
    )
  }

  if(details.type === "node") {
    return (
      <div className="rounded-lg border p-4">
          <div className="p-4 flex items-center justify-between">
            <div className="text-sm font-medium">Node</div>
          </div>
          <Separator />
          <div className="p-4 space-y-3">
            <div className="mt-0.5 wrap-break-word whitespace-pre-wrap font-mono text-xs md:text-sm md:font-sans">
              {details.selector}
            </div>
          </div>
      </div>
    );
  }

  if(details.type === "text") {
    return (
      <div className="rounded-lg border p-4">
        <div className="text-sm font-medium">Evidence</div>
        <pre className="mt-3 rounded-md bg-muted p-3 text-xs overflow-auto whitespace-pre-wrap wrap-break-word md:whitespace-pre">
          {details.value}
        </pre>
      </div>
    )
  }

  if(details.type === "list-section") {
    const aud = {
      details: details.value
    };
    return <EvidenceBlock key={details.key} audit={aud} />
  }

  if(details.type === "network-tree") {
    type ChainValue = {
      navStartToEndTime: string;
      transferSize: number;
    }
    type ChainsMap = Record<string, ChainValue>;
    return (
      <div className="p-4 space-y-3">
        {Object.entries(details.chains as ChainsMap).map(([key, val]) => (
          <>
          <div className="rounded-md border p-3 space-y-2">
              <div className="text-sm">
                <div className="text-xs text-muted-foreground">Start to End Time</div>
                <div className="mt-0.5 wrap-break-word whitespace-pre-wrap font-mono text-xs md:text-sm md:font-sans">
                  {val.navStartToEndTime} ms
                </div>
              </div>
          </div>
          <div className="rounded-md border p-3 space-y-2">
              <div className="text-sm">
                <div className="text-xs text-muted-foreground">Transfer Size</div>
                <div className="mt-0.5 wrap-break-word whitespace-pre-wrap font-mono text-xs md:text-sm md:font-sans">
                  {Number(val.transferSize).toLocaleString()}
                </div>
              </div>
          </div>
          </>
        ))}
      </div>
    )
  }

  if (details.type === "opportunity") {
    const headings: Array<{ key: string; label?: string; valueType?: string }> = details.headings ?? [];
    const items: Array<Record<string, any>> = details.items ?? [];

    const sortKey: string | undefined = details.sortedBy?.[0];
    const sortedItems = sortKey
      ? [...items].sort((a, b) => Number(b?.[sortKey] ?? 0) - Number(a?.[sortKey] ?? 0))
      : items;

    return (
      <div className="rounded-lg border">
        <div className="p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium">Opportunity</div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {typeof details.overallSavingsMs === "number" ? (
                <Badge variant="outline">{details.overallSavingsMs.toLocaleString()} ms est. savings</Badge>
              ) : null}
              {typeof details.overallSavingsBytes === "number" ? (
                <Badge variant="outline">{details.overallSavingsBytes.toLocaleString()} bytes est. savings</Badge>
              ) : null}
              {sortKey ? <Badge variant="secondary">Sorted by {sortKey}</Badge> : null}
            </div>
          </div>

          <Badge variant="outline">{sortedItems.length} row(s)</Badge>
        </div>

        <Separator />

        {sortedItems.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No items were reported for this opportunity.
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {sortedItems.map((it, idx) => (
              <div key={idx} className="rounded-md border p-3 space-y-2">
                {headings.map((h) => {
                  const raw = it?.[h.key];

                  // Special handling for URL
                  if (h.valueType === "url") {
                    const url = typeof raw === "string" ? raw : "";
                    return (
                      <div key={h.key} className="text-sm">
                        <div className="text-xs text-muted-foreground">{h.label ?? h.key}</div>
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 inline-flex items-center gap-1 break-all font-mono text-xs md:text-sm md:font-sans underline underline-offset-2"
                          >
                            {url}
                            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                          </a>
                        ) : (
                          <div className="mt-0.5 font-mono text-xs md:text-sm md:font-sans">-</div>
                        )}
                      </div>
                    );
                  }

                  // Default rendering (bytes, numbers, strings, etc.)
                  return (
                    <div key={h.key} className="text-sm">
                      <div className="text-xs text-muted-foreground">{h.label ?? h.key}</div>
                      <div className="mt-0.5 wrap-break-word whitespace-pre-wrap font-mono text-xs md:text-sm md:font-sans">
                        {parseTableValue(raw ?? "-", h.valueType)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Fallback for other details types
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm font-medium">Evidence</div>
      <div className="mt-2 text-sm text-muted-foreground">
        Details type: <span className="font-mono">{details.type}</span>
      </div>
      <pre className="mt-3 rounded-md bg-muted p-3 text-xs overflow-auto whitespace-pre-wrap wrap-break-word md:whitespace-pre">
        {JSON.stringify(details, null, 2)}
      </pre>
    </div>
  );
}
