"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DataTable } from "@/components/data-table"; // <-- your component file
import { capitalizeFirstLetter } from "@/features/web-audits/utils";
import { AxeRuleDrawer } from "./axe-drawer"; // from Part B

type AxeGroup = "violations" | "passes" | "incomplete" | "inapplicable";

type AxeNode = {
  target?: string[];
  html?: string;
  any?: any[];
  all?: any[];
  none?: any[];
  impact?: string;
  failureSummary?: string;
};

export type AxeRuleResult = {
  id: string;
  impact?: "minor" | "moderate" | "serious" | "critical";
  tags?: string[];
  description?: string;
  help?: string;
  helpUrl?: string;
  nodes: AxeNode[];
};

export type AxeResults = Record<AxeGroup, AxeRuleResult[]>;

function impactBadgeVariant(impact?: AxeRuleResult["impact"]) {
  if (!impact) return "outline";
  return impact === "serious" || impact === "critical" ? "destructive" : "secondary";
}

function groupLabel(g: AxeGroup) {
  switch (g) {
    case "violations":
      return "violations";
    case "incomplete":
      return "incomplete";
    case "passes":
      return "passes";
    case "inapplicable":
      return "inapplicable";
  }
}

export function AxeReportViewer({ results }: { results: AxeResults }) {
  const [selected, setSelected] = React.useState<{ group: AxeGroup; rule: AxeRuleResult } | null>(null);

  const groups: AxeGroup[] = ["violations", "incomplete", "passes", "inapplicable"];

  const makeColumns = React.useCallback(
    (group: AxeGroup): ColumnDef<AxeRuleResult>[] => [
      {
        accessorKey: "help",
        header: "Rule",
        cell: ({ row }) => {
          const r = row.original;
          return <div className="font-medium truncate w-[250px] lg:w-full">{r.help ?? r.id}</div>;
        },
        meta: { style: { textAlign: "left" } },
        size: 55,
      },
      {
        accessorKey: "impact",
        header: "Impact",
        cell: ({ row }) => (
          <Badge variant={impactBadgeVariant(row.original.impact)} className="capitalize">
            {row.original.impact ?? "—"}
          </Badge>
        ),
        meta: {
          className: "hidden lg:table-cell",
          style: { textAlign: "center" }
        },
        size: 15,
      },
      {
        id: "nodesCount",
        header: "Nodes",
        cell: ({ row }) => <Badge variant="outline">{row.original.nodes?.length ?? 0}</Badge>,
        meta: {
          className: "hidden lg:table-cell",
          style: { textAlign: "center" }
        },
        size: 10,
      },
      {
        id: "tags",
        header: "Tags",
        cell: ({ row }) => {
          const tags = row.original.tags ?? [];
          return (
            <div className="flex flex-wrap gap-1 justify-start">
              {tags.slice(0, 3).map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
              {tags.length > 3 ? <Badge variant="outline">+{tags.length - 3}</Badge> : null}
            </div>
          );
        },
        meta: {
          className: "hidden lg:table-cell",
          style: { textAlign: "left" }
        },
        size: 15,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end ml-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelected({ group, rule: row.original })}
              className="cursor-pointer"
            >
              View
            </Button>
          </div>
        ),
        meta: { style: { textAlign: "right" } },
        size: 5,
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <Tabs defaultValue="violations">
        <TabsList className='flex items-center justify-center flex-wrap h-auto space-y-1 mx-auto'>
        {groups.map((g) => (
            <TabsTrigger key={g} value={g}>
            {capitalizeFirstLetter(groupLabel(g))} <Badge variant="outline" className="ml-2">{results[g]?.length ?? 0}</Badge>
            </TabsTrigger>
        ))}
        </TabsList>

        {groups.map((g) => (
          <TabsContent key={g} value={g} className="mt-4">
            <DataTable
              columns={makeColumns(g)}
              data={results[g] ?? []}
              tableType="axeRules" // avoids built-in router pushes in your DataTable :contentReference[oaicite:2]{index=2}
              defaultPageSize={25} // optional; your DataTable defaults to 25 :contentReference[oaicite:3]{index=3}
            />
          </TabsContent>
        ))}
      </Tabs>

      <AxeRuleDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        selected={selected}
      />
    </div>
  );
}
