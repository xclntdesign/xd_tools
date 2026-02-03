"use client"

import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { DataTablePagination } from "./data-table-pagination"
import { Input } from "./ui/input"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[],
  tableType: string,
  defaultPageSize?: number,
}

export function DataTable<TData, TValue>({
  columns,
  data,
  tableType,
  defaultPageSize = 25,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [pagination, setPagination] = useState({
        pageIndex: 0, // current page number (0-indexed)
        pageSize: defaultPageSize, // number of rows per page
    });

    let initialView;
    if(tableType === "projects") {
        initialView = {
            columnVisibility: {
                slug: false,
                id: false,
            },
            sorting: [
                {
                    id: "jobName",
                    desc: false,
                }
            ]
        }
    } else {
        initialView = {
            columnVisibility: {
                slug: false,
                id: false,
            },
        }
    }
    
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            columnFilters,
            pagination
        },
        initialState: initialView,
        onPaginationChange: setPagination,
    })

    const router = useRouter();

  return (
    <div>
        {tableType === "projects" && (
            <div className="flex gap-3 items-center justify-end mb-2">
                <Input
                    placeholder="Search jobs..."
                    value={(table?.getColumn("jobName")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table?.getColumn("jobName")?.setFilterValue(event.target.value)
                    }
                    className="rounded-none border-0 border-b-2 max-w-64"
                />
                <Input
                    placeholder="Search clients..."
                    value={(table?.getColumn("clientName")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table?.getColumn("clientName")?.setFilterValue(event.target.value)
                    }
                    className="rounded-none border-0 border-b-2 max-w-64"
                />
            </div>
        )}
        <div className="overflow-hidden">
            <Table>
                <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                        return (
                        <TableHead key={header.id} className={cn(`text-${header.column.columnDef.meta?.style?.textAlign || 'center'} text-muted-foreground py-4 cursor-pointer`, header.column.columnDef.meta?.className)}style={{ width: header.column.columnDef.size ? header.column.columnDef.size + '%' : 'auto'}} onClick={header.column.getToggleSortingHandler()}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{ asc: <ChevronUpIcon className="inline-flex ml-1 size-4" />, desc: <ChevronDownIcon className="inline-flex ml-1 size-4" /> }[header.column.getIsSorted() as string] ?? null}
                        </TableHead>
                        )
                    })}
                    </TableRow>
                ))}
                </TableHeader>
                <TableBody>
                {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => {
                        return (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                                className={cn("hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors duration-300 ease-in-out cursor-default")}
                            >
                                {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} className={cn(`text-${cell.column.columnDef.meta?.style?.textAlign || 'center'} py-5 w-auto`, cell.column.columnDef.meta?.className)} style={{ width: cell.column.columnDef.size ? cell.column.columnDef.size + '%' : 'auto' }}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                                ))}
                            </TableRow>
                        );
                    })
                ) : (
                    <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                        No results.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
        <div className="flex items-center justify-start 2xl:justify-end space-x-2 py-4">
            <DataTablePagination table={table} />
        </div>
    </div>
  )
}