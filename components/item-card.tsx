import { cn } from "@/lib/utils";

function ItemCard ({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
        data-slot="item-card"
        className={cn("@container/tools h-full flex flex-col px-3 bg-input/30 overflow-hidden relative", className)}
        {...props}
        />
  );
}

function ItemCardTitle ({ className, ...props }: React.ComponentProps<"h2">) {
    return (
        <h2
            data-slot="item-card-title"
            className={cn("text-xl font-semibold py-2", className)}
            {...props}
        />
    );
}

function ItemCardSubtitle ({ className, ...props }: React.ComponentProps<"h3">) {
    return (
        <h3
            data-slot="item-card-subtitle"
            className={cn("py-2", className)}
            {...props}
        />
    );
}

function ItemCardContent ({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="item-card-content"
            className={cn("w-full py-4 text-muted-foreground truncate", className)}
            {...props}
        />
    );
}

export { ItemCard, ItemCardContent, ItemCardSubtitle, ItemCardTitle };

