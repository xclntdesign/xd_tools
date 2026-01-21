"use client"

import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut
} from "lucide-react"

import { gradientsList } from "@/app/vars"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { signOutAction } from "@/features/auth/actions/sign-out"
import { UserMetadataType } from "@/features/auth/types"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function NavUser({
  user,
}: {
  user: UserMetadataType
}) {
  const { isMobile } = useSidebar()

  const gradientToUse = user.avatar && !user.avatar.includes('.svg') && gradientsList.find((item) => item.name === user.avatar);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {user.avatar.includes('.svg') && (
                  <AvatarImage src={`/avatars/${user.avatar}`} alt={user.firstName + ' ' + user.lastName} />
                )}
                {user.avatar && gradientToUse && !user.avatar.includes('.svg') ? (
                  <div className={cn("w-full h-full rounded-full bg-linear-to-tr", gradientToUse.colors)}></div>
                ) : (
                  <AvatarFallback className="rounded-lg">{user.firstName[0] + user.lastName[0]}</AvatarFallback>
                )}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.firstName + ' ' + user.lastName}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {user.avatar.includes('.svg') && (
                    <AvatarImage src={`/avatars/${user.avatar}`} alt={user.firstName + ' ' + user.lastName} />
                  )}
                  {user.avatar && gradientToUse && !user.avatar.includes('.svg') ? (
                    <div className={cn("w-full h-full rounded-full bg-linear-to-tr", gradientToUse.colors)}></div>
                  ) : (
                    <AvatarFallback className="rounded-lg">{user.firstName[0] + user.lastName[0]}</AvatarFallback>
                  )}
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.firstName + ' ' + user.lastName}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={`/${user.client.slug}/account`} className="cursor-pointer">
                  <BadgeCheck />
                  Account
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOutAction()} className="cursor-pointer">
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
