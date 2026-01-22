import { cn } from "@/lib/utils";

function ToolsCard ({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
        data-slot="tools-card"
        className={cn("@container/tools h-full flex flex-col pt-0 pb-4 bg-input/30 overflow-hidden relative", className)}
        {...props}
        />
  );
}

function ToolsCardTitle ({ className, ...props }: React.ComponentProps<"h2">) {
    return (
        <h2
            data-slot="tools-card-title"
            className={cn("border-l-4 border-l-red-500 text-xl py-2 px-3", className)}
            {...props}
        />
    );
}

function ToolsCardSubtitle ({ className, ...props }: React.ComponentProps<"h3">) {
    return (
        <h3
            data-slot="tools-card-subtitle"
            className={cn("text-muted-foreground max-w-[60%] py-2 px-3", className)}
            {...props}
        />
    );
}

function ToolsCardContent ({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="tools-card-content"
            className={cn("w-full px-6 py-4", className)}
            {...props}
        />
    );
}

export { ToolsCard, ToolsCardContent, ToolsCardSubtitle, ToolsCardTitle };

