"use client"

import * as React from "react"

import { getMainNav } from "@/app/(protected)/menu"
import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarRail
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  const mainNav = getMainNav({ pathname: pathname });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={mainNav} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
