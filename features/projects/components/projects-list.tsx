"use client";

import { DataTable } from "@/components/data-table";
import { ToolsCard, ToolsCardContent, ToolsCardTitle } from "@/components/tools-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { AlertCircleIcon, LoaderCircleIcon } from "lucide-react";

export interface ProjectListItem {
    jobName: string;
    clientName: string;
    createdAt: Date;
    updatedAt: Date;
}

const dateFormat = "MM/dd/yyyy h:mm a";

export function ProjectsListComponent() {

    const { status, data, error, isFetching } = useQuery({
        queryKey: ["aiPromptDefaults"],
        queryFn: async (): Promise<ProjectListItem[]> => {
            const response = await fetch("/api/projects/list", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            return await response.json();
        },
        refetchOnWindowFocus: false
    });

    const columns: ColumnDef<ProjectListItem>[] = [
        {
            accessorKey: "jobName",
            header: "Job Name",
            meta: { style: { textAlign: "left" } },
            size: 30
        },
        {
            accessorKey: "clientName",
            header: "Client Name",
            meta: { style: { textAlign: "left" } },
            size: 30
        },
        {
            accessorKey: "createdAt",
            header: "Created At",
            cell: ({ row }) => format(row.original.createdAt, dateFormat),
            meta: { style: { textAlign: "left" } },
            size: 20,
        },
        {
            accessorKey: "updatedAt",
            header: "Updated At",
            cell: ({ row }) => format(row.original.updatedAt, dateFormat),
            meta: { style: { textAlign: "left" } },
            size: 20,
        }
    ];

    return (
        <div className="flex flex-col gap-4 w-full">
            <ToolsCard>
                <ToolsCardTitle>Projects List</ToolsCardTitle>
                <ToolsCardContent>
                    {isFetching && (
                        <div className="flex items-center gap-6 my-4">
                            <span className="text-lg">Loading...</span> <LoaderCircleIcon className="size-8 animate-spin" />
                        </div>
                    )}
                    {status === "error" && (
                        <Alert variant="destructive">
                            <AlertCircleIcon />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error.message}</AlertDescription>
                        </Alert>
                    )}
                    {status === "success" && data && data.length > 0 && (
                        <DataTable
                            columns={columns}
                            data={data}
                            tableType="projects"
                        />
                    )}
                </ToolsCardContent>
            </ToolsCard>
        </div>                
    )
}