"use client";

import { getMainNav } from "@/app/(protected)/menu";
import { ToolsCard, ToolsCardContent, ToolsCardSubtitle, ToolsCardTitle } from "@/components/tools-card";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashboardComponent() {
    const pathname = usePathname();

    const mainNav = getMainNav({ pathname: pathname, sorted: true, omitDashboard: true });
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 w-full">
            {mainNav.map((item) => (
                <Link href={item.url} key={item.url}>
                    <ToolsCard className="hover:bg-input/50 hover:border-l-red-300 transition-all duration-300 pb-12" key={item.url}>
                        <ToolsCardTitle>{item.title}</ToolsCardTitle>
                        <ToolsCardSubtitle>{item.description}</ToolsCardSubtitle>
                        <ToolsCardContent>
                            <div className="absolute -bottom-6 -right-6 opacity-15">
                                <item.icon className="size-25 text-muted-foreground" />
                            </div>
                        </ToolsCardContent>
                    </ToolsCard>
                </Link>
            ))}
        </div>
    );
}