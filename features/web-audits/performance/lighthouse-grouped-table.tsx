import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Copy, ExternalLink } from "lucide-react";

function formatBytes(n: number) {
  const units = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatMs(n: number) {
  // show 1 decimal < 1000ms, else seconds
  if (n >= 1000) return `${(n / 1000).toFixed(2)} s`;
  return `${n.toFixed(1)} ms`;
}

function formatLhValue(value: any, valueType?: string) {
  if (value == null) return "—";

  if (valueType === "bytes" && typeof value === "number") return formatBytes(value);
  if (valueType === "ms" && typeof value === "number") return formatMs(value);
  if (valueType === "url" && typeof value === "string") return value;

  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);

  // fallback for objects/arrays
  return JSON.stringify(value);
}


type LhHeading = {
  key: string;
  label?: string;
  valueType?: string;
  subItemsHeading?: {
    key: string;
    valueType?: string;
  };
};

type LhDetailsTable = {
  type: "table";
  headings: LhHeading[];
  items: Array<Record<string, any>>;
  isEntityGrouped?: boolean;
};

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

function maybeLink(value: string) {
  const isUrl = /^https?:\/\//i.test(value);
  if (!isUrl) return null;
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => window.open(value, "_blank", "noopener,noreferrer")}
      aria-label="Open url"
    >
      <ExternalLink className="h-4 w-4" />
    </Button>
  );
}

export function LhEntityGroupedTable({ details }: { details: LhDetailsTable }) {
  const headings = details.headings ?? [];
  const items = details.items ?? [];

  if (items.length === 0) {
    return (
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        No items were reported for this audit.
      </div>
    );
  }

  // Identify the "entity" heading and the subitems headings (from your sample: url/transferSize/mainThreadTime)
  const entityHeading = headings.find((h) => h.key === "entity") ?? headings[0];
  const metricHeadings = headings.filter((h) => h.key !== entityHeading.key);

  return (
    <div className="rounded-lg border">
      <div className="p-4 flex items-center justify-between">
        <div className="text-sm font-medium">3rd-party impact</div>
        <Badge variant="outline">{items.length} entity(ies)</Badge>
      </div>
      <Separator />

      <div className="p-4 space-y-3">
        {items.map((row, idx) => {
          const entity = String(row[entityHeading.key] ?? "—");
          const sub = row.subItems?.items ?? [];
          const subCount = Array.isArray(sub) ? sub.length : 0;

          return (
            <div key={idx} className="rounded-md border">
              <div className="p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium truncate">{entity}</div>
                    {subCount ? <Badge variant="secondary">{subCount} req</Badge> : null}
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {metricHeadings.map((h) => (
                      <div key={h.key} className="rounded-md bg-muted/40 p-2">
                        <div className="text-[11px] text-muted-foreground">{h.label ?? h.key}</div>
                        <div className="mt-0.5 text-sm">
                          {formatLhValue(row[h.key], h.valueType)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(entity)} aria-label="Copy entity">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {subCount ? (
                <>
                  <Separator />
                  <Accordion type="single" collapsible>
                    <AccordionItem value="subitems">
                      <AccordionTrigger className="px-3">
                        Requests (sub-items)
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3">
                        <div className="space-y-2">
                          {sub.map((req: any, i: number) => {
                            const url = String(req.url ?? "—");
                            const transfer = req.transferSize;
                            const mt = req.mainThreadTime;

                            return (
                              <div key={i} className="rounded-md border p-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="text-xs font-mono break-all md:wrap-break-word">
                                      {url}
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                      {typeof transfer === "number" ? <span>Transfer: {formatBytes(transfer)}</span> : null}
                                      {typeof mt === "number" ? <span>Main thread: {formatMs(mt)}</span> : null}
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    {maybeLink(url)}
                                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(url)} aria-label="Copy url">
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
