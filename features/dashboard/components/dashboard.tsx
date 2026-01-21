"use client";

import { getMainNav } from "@/app/(protected)/menu";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashboardComponent() {
    const pathname = usePathname();

    const mainNav = getMainNav({ pathname: pathname, sorted: true, omitDashboard: true });
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 w-full">
            {mainNav.map((item) => (
                <Link href={item.url} key={item.url}>
                    <div className="flex flex-col px-3 py-4 pb-12 bg-input/30 border-l-4 border-l-red-500 overflow-hidden relative h-full hover:bg-input/50 hover:border-l-red-300 transition-all duration-300" key={item.url}>
                        <h2 className="text-xl">{item.title}</h2>
                        <h3 className="text-muted-foreground max-w-[60%]">{item.description}</h3>
                        <div className="absolute -bottom-6 -right-6 opacity-15">
                            <item.icon className="size-25 text-muted-foreground" />
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}