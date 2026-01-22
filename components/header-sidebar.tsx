"use client";

import { getMainNav } from "@/app/(protected)/menu";
import { signOutAction } from "@/features/auth/actions/sign-out";
import { LogOutIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "./ui/breadcrumb";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";

export function HeaderSidebar () {
    const pathname = usePathname();

    const mainNav = getMainNav({ pathname: pathname });

    const item = mainNav.find((item) => item.url === pathname);
    if(!item) {
      return null;
    }

    async function signOut() {
      await signOutAction();
    }

    return (
        <header className="flex h-16 justify-between items-center gap-2 border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 cursor-pointer" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    <span className="text-lg">{item.title}</span>
                    {item.description && (
                      <>
                      <br /><span className="text-xs lg:text-sm text-muted-foreground">
                        {item.description}
                      </span>
                      </>
                    )}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div>
            <Button
              variant="ghost"
              type="button"
              className="cursor-pointer"
              size="icon"
              onClick={signOut}
            >
              <LogOutIcon />
            </Button>
          </div>
        </header>
    );
}