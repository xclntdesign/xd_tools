"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LhAuditRow, LhCategoryKey } from "../utils";
import { LighthouseAuditDrawer } from "./lighthouse-audit-drawer";

function lhScoreLabel(score: number | null, mode?: string) {
  if (mode === "notApplicable") return "N/A";
  if (mode === "informative") return "Info";
  if (mode === "manual") return "Manual";
  if (score == null) return "—";
  return `${Math.round(score * 100)}`;
}

function lhScoreVariant(score: number | null, mode?: string) {
  if (mode === "informative" || mode === "manual" || mode === "notApplicable") return "outline";
  if (score == null) return "outline";
  if (score === 0) return "destructive";
  if (score === 1) return "secondary";
  return "outline";
}

function prettyCategory(category: LhCategoryKey) {
  if (category === "best-practices") return "Best Practices";
  if (category === "seo") return "SEO";
  return "Performance";
}

export function LighthouseCategoryList({
  category,
  rows,
  categoryScore,
  filterByCategory = true,
  defaultPageSize = 25,
  showHeader = true,
}: {
  category: LhCategoryKey;
  rows: LhAuditRow[] | null;
  categoryScore?: number | null;
  filterByCategory?: boolean;
  defaultPageSize?: number;
  showHeader?: boolean;
}) {
  if(!rows) return;

  const [selected, setSelected] = React.useState<LhAuditRow | null>(null);

  const data = React.useMemo(
    () => (filterByCategory ? rows.filter((r) => r.category === category) : rows),
    [rows, category, filterByCategory]
  );

  const columns = React.useMemo<ColumnDef<LhAuditRow>[]>(() => {
    const base: ColumnDef<LhAuditRow>[] = [
      {
        accessorKey: "title",
        header: "Audit",
        cell: ({ row }) => <div className="font-medium w-[180px] truncate lg:w-full">{row.original.title}</div>,
        meta: { style: { textAlign: "left" } },
        size: 55,
      },
      {
        accessorKey: "score",
        header: "Score",
        cell: ({ row }) => (
          <Badge variant={lhScoreVariant(row.original.score, row.original.scoreDisplayMode)} className="size-10 p-2">
            {lhScoreLabel(row.original.score, row.original.scoreDisplayMode)}
          </Badge>
        ),
        meta: { style: { textAlign: "center" } },
        size: 10,
      },
      {
        accessorKey: "detailsType",
        header: "Details",
        cell: ({ row }) => <Badge variant="outline">{row.original.detailsType ?? "—"}</Badge>,
        meta: {
          className: "hidden lg:table-cell",
          style: { textAlign: "center" }
        },
        size: 10,
      },
      {
        accessorKey: "displayValue",
        header: "Value",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground truncate max-w-[260px]">
            {row.original.displayValue ?? "—"}
          </div>
        ),
        meta: {
          className: "hidden lg:table-cell",
          style: { textAlign: "left" }
        },
        size: 20,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end ml-8">
            <Button variant="outline" size="sm" onClick={() => setSelected(row.original)} className="cursor-pointer">
              View
            </Button>
          </div>
        ),
        meta: { style: { textAlign: "right" } },
        size: 5,
      },
    ];

    // Category-specific columns (optional)
    if (category === "best-practices") {
      base.splice(1, 0, {
        accessorKey: "group",
        header: "Group",
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.group.replace("best-practices-", "").replaceAll("-", " ")}
          </Badge>
        ),
        meta: {
          className: "hidden lg:table-cell",
          style: { textAlign: "center" }
        },
        size: 12,
      });
    }

    if (category === "performance") {
      base.splice(base.length - 2, 0, {
        id: "numeric",
        header: "Numeric",
        cell: ({ row }) => {
          const n = row.original.numericValue;
          const u = row.original.numericUnit;
          return <div className="text-sm text-muted-foreground">{typeof n === "number" ? `${Math.round(n)} ${u ?? ""}` : "—"}</div>;
        },
        meta: {
          className: "hidden lg:table-cell",
          style: { textAlign: "left" }
        },
        size: 12,
      });
    }

    return base;
  }, [category]);

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xl font-semibold">{prettyCategory(category)}</div>
          <Badge variant="outline">Audits: {data.length}</Badge>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        tableType={`lh-${category}`}
        defaultPageSize={defaultPageSize}
      />

      <LighthouseAuditDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        row={selected}
        showCloseX={false}
      />
    </div>
  );
}
