import { cn } from "@/lib/utils";

function AuthCard({ className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="auth-card"
            className={cn("@container/auth w-[320px] flex flex-col items-center justify-center gap-6", className)}
            {...props}
        />
    )
}

function AuthCardHeader({ className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="auth-card-header"
            className={cn("@container/auth-header flex flex-col items-center justify-center gap-4 w-full", className)}
            {...props}
        />
    )
}

function AuthCardTitle({ className, ...props }: React.ComponentProps<"h1">) {
    return (
        <h1
            data-slot="auth-card-title"
            className={cn("font-sans font-semibold text-4xl leading-10 text-center", className)}
            {...props}
        />
    )
}

function AuthCardDescription({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="auth-card-description"
            className={cn("text-muted-foreground text-sm w-full text-center", className)}
            {...props}
        />
    );
}

function AuthCardContent({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="auth-card-content"
            className={cn("w-full px-6 py-4", className)}
            {...props}
        />
    );
}

function AuthCardFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
          data-slot="auth-card-footer"
          className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
          {...props}
        />
      )
}


export { AuthCard, AuthCardContent, AuthCardDescription, AuthCardFooter, AuthCardHeader, AuthCardTitle };

