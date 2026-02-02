"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Copy, ExternalLink } from "lucide-react";
import * as React from "react";

type AxeGroup = "violations" | "passes" | "incomplete" | "inapplicable";

type AxeCheck = { id: string; data?: any; message: string; relatedNodes?: any[]; impact?: string };
type AxeNode = { target?: string[]; html?: string; any?: AxeCheck[]; all?: AxeCheck[]; none?: AxeCheck[]; impact?: string; failureSummary?: string };

type AxeRuleResult = {
  id: string;
  impact?: "minor" | "moderate" | "serious" | "critical";
  tags?: string[];
  description?: string;
  help?: string;
  helpUrl?: string;
  nodes: AxeNode[];
};

export function AxeRuleDrawer({
  open,
  onOpenChange,
  selected,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: { group: AxeGroup; rule: AxeRuleResult } | null;
}) {
  const rule = selected?.rule;
  const group = selected?.group;

  if (!rule || !group) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[560px] sm:w-[640px] p-0" />
      </Sheet>
    );
  }

  const nodes = rule.nodes ?? [];
  const nodeCount = nodes.length;

  // Heuristic: group+virtualize when big OR repetitive message
  const shouldGroup =
    nodeCount > 8 ||
    (group === "violations" && rule.id === "region"); // you can refine this

  const headerBadge = (() => {
    switch (group) {
      case "violations":
        return <Badge variant="destructive">Violation</Badge>;
      case "incomplete":
        return <Badge variant="secondary">Needs review</Badge>;
      case "passes":
        return <Badge variant="outline">Pass</Badge>;
      case "inapplicable":
        return <Badge variant="outline">N/A</Badge>;
    }
  })();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[50vw] sm:max-w-[50vw] p-0" showCloseX={false} onOpenAutoFocus={(event) => event.preventDefault()}>
        <div className="flex h-full flex-col">
          <SheetHeader className="p-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <SheetTitle className="text-lg leading-tight">
                  <span className="block truncate">{rule.help ?? rule.id}</span>
                </SheetTitle>
                <SheetDescription className="mt-1">
                  <span className="block truncate">Rule: {rule.id}</span>
                </SheetDescription>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {headerBadge}
                  <Badge variant="outline">aXe</Badge>
                  {rule.impact ? (
                    <Badge variant={rule.impact === "serious" || rule.impact === "critical" ? "destructive" : "secondary"} className="capitalize">
                      {rule.impact}
                    </Badge>
                  ) : (
                    <Badge variant="outline">—</Badge>
                  )}
                  <Badge variant="outline">Nodes: {nodeCount}</Badge>
                  {(rule.tags ?? []).slice(0, 6).map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2">
                <div className="flex justify-end gap-2">
                  {rule.helpUrl ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => window.open(rule.helpUrl!, "_blank", "noopener,noreferrer")} className="cursor-pointer">
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
                        <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(rule.id)} className="cursor-pointer">
                            <Copy className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Copy Rule ID</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Overview blurb (group-aware) */}
            <div className="mt-4 rounded-lg border p-4">
              <div className="text-sm font-medium">What this means</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {rule.description ?? "—"}
              </div>

              <div className="mt-3 text-sm">
                <span className="font-medium">Goal: </span>
                <span className="text-muted-foreground">{rule.help ?? "—"}</span>
              </div>

              {group === "passes" ? (
                <div className="mt-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  This rule passed for the scanned nodes. Keep it as a regression guard.
                </div>
              ) : group === "inapplicable" ? (
                <div className="mt-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  This rule didn’t apply to the page (no matching patterns were found).
                </div>
              ) : group === "incomplete" ? (
                <div className="mt-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  aXe couldn’t determine a pass/fail automatically. Review the nodes manually.
                </div>
              ) : (
                <div className="mt-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  Fixing this should reduce risk and improve accessibility for keyboard/screen reader users.
                </div>
              )}
            </div>
          </SheetHeader>

          <Separator />

          <Tabs defaultValue="evidence" className="flex flex-1 flex-col overflow-hidden">
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="evidence" className="cursor-pointer">Evidence</TabsTrigger>
                <TabsTrigger value="checks" className="cursor-pointer">Checks</TabsTrigger>
                <TabsTrigger value="raw" className="cursor-pointer">Raw</TabsTrigger>
                <TabsTrigger value="meta" className="cursor-pointer">Meta</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="evidence" className="flex-1 overflow-hidden min-w-0">
              <ScrollArea className="h-full">
                <div className="px-6 py-4">
                  {shouldGroup ? <GroupedEvidence nodes={nodes} /> : <FlatEvidence nodes={nodes} />}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="checks" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="px-6 py-4 space-y-3">
                  {nodes.slice(0, 25).map((n, idx) => (
                    <div key={idx} className="rounded-lg border p-4">
                      <div className="text-sm font-medium">Instance #{idx + 1}</div>
                      <div className="mt-1 text-xs text-muted-foreground font-mono">{n.target?.[0] ?? "(no target)"}</div>
                      <div className="mt-3 space-y-2">
                        {(n.any ?? []).map((c) => (
                          <div key={c.id} className="rounded-md border p-3">
                            <div className="text-sm font-medium">{c.id}</div>
                            <div className="mt-1 text-sm text-muted-foreground">{c.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {nodes.length > 25 ? (
                    <div className="text-xs text-muted-foreground">
                      Showing first 25 instances. Use Evidence grouping to navigate large sets.
                    </div>
                  ) : null}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="raw" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Raw rule JSON</div>
                    <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(JSON.stringify(rule, null, 2))}>
                      <Copy className="h-4 w-4 mr-2" />Copy
                    </Button>
                  </div>
                  <pre className="mt-3 overflow-auto rounded-lg border bg-muted p-3 text-xs">
                    {JSON.stringify(rule, null, 2)}
                  </pre>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="meta" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="px-6 py-4 text-sm text-muted-foreground space-y-2">
                  <div><span className="font-medium text-foreground">Group:</span> {group}</div>
                  <div><span className="font-medium text-foreground">Rule id:</span> {rule.id}</div>
                  <div><span className="font-medium text-foreground">Impact:</span> {rule.impact ?? "—"}</div>
                  <div><span className="font-medium text-foreground">Tags:</span> {(rule.tags ?? []).join(", ") || "—"}</div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
            <div className="px-3 pb-5 text-right">
                <SheetClose asChild>
                    <Button className="cursor-pointer">Close</Button>
                </SheetClose>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FlatEvidence({ nodes }: { nodes: AxeNode[] }) {
  return (
    <div className="space-y-3">
      {nodes.map((n, idx) => (
        <div key={idx} className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{n.target?.[0] ?? "(no target)"}</div>
              {n.failureSummary ? <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{n.failureSummary}</div> : null}
            </div>
            <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(n.target?.[0] ?? "")}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {n.html ? <pre className="mt-3 rounded-md bg-muted p-3 text-xs overflow-auto">{n.html}</pre> : null}
        </div>
      ))}
    </div>
  );
}

function clusterKey(selector: string) {
  const idMatch = selector.match(/#([A-Za-z0-9\-_]+)/);
  if (idMatch?.[1]) {
    const id = idMatch[1];
    const prefix = id.includes("-") ? id.split("-")[0] : id;
    return id.includes("-") ? `#${prefix}-*` : `#${id}`;
  }
  const cls = selector.match(/\.([A-Za-z0-9\-_]+)/)?.[1];
  if (cls) return cls.startsWith("slick") ? ".slick-*" : `.${cls}`;
  return "Other";
}

function GroupedEvidence({ nodes }: { nodes: AxeNode[] }) {
  const groups = React.useMemo(() => {
    const m = new Map<string, AxeNode[]>();
    for (const n of nodes) {
      const sel = n.target?.[0] ?? "";
      const k = clusterKey(sel);
      m.set(k, [...(m.get(k) ?? []), n]);
    }
    return Array.from(m.entries()).map(([key, items]) => ({ key, items })).sort((a, b) => b.items.length - a.items.length);
  }, [nodes]);

  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g.key} className="rounded-lg border">
          <div className="flex items-center justify-between p-4">
            <div className="font-mono text-sm">{g.key}</div>
            <Badge variant="outline">{g.items.length}</Badge>
          </div>
          <Separator />
          <VirtualNodeList nodes={g.items} />
        </div>
      ))}
    </div>
  );
}

function VirtualNodeList({ nodes }: { nodes: AxeNode[] }) {
  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 62,
    overscan: 8,
  });

  return (
    <div ref={parentRef} className="h-[260px] overflow-auto">
      <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
        {rowVirtualizer.getVirtualItems().map((v) => {
          const n = nodes[v.index];
          const sel = n.target?.[0] ?? "(no target)";
          return (
            <div
              key={v.key}
              className="absolute left-0 top-0 w-full border-b p-3 hover:bg-muted/40"
              style={{ transform: `translateY(${v.start}px)` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{sel}</div>
                  {n.html ? <div className="mt-1 text-xs text-muted-foreground truncate">{n.html.replace(/\s+/g, " ").trim()}</div> : null}
                </div>
                <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(sel)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
