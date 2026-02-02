import { DataTable } from "@/components/data-table";
import { getHttpStatusMessage } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { BrokenLink } from "../components/web-audit";

export function BrokenLinksTable ( { links }: { links: BrokenLink[] }) {
    const columns: ColumnDef<BrokenLink>[] = [
        {
            id: "url",
            header: "Broken Link",
            cell: ({ row }) => {
                const r = row.original;
                return (
                    <div className="truncate w-full">{r.url}</div>
                )
            },
            meta: { style: { textAlign: "left" } },
            size: 40
        },
        {
            id: "parent",
            header: "Found On",
            cell: ({ row }) => {
                const r = row.original;
                return (
                    <div className="truncate w-full">{r.parent && r.parent !== "" ? r.parent : "N/A"}</div>
                )
            },
            meta: { style: { textAlign: "left" } },
            size: 40
        },
        {
            id: "status",
            header: "Status",
            cell: ({ row }) => getHttpStatusMessage(row.original.status),
            meta: { style: { textAlign: "left" } },
            size: 20
        }
    ];

    return (
        <DataTable
            columns={columns}
            data={links}
            tableType="brokenLinks"
        />
    );
}