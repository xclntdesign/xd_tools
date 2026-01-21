import { AppSidebar } from "@/components/app-sidebar";
import { HeaderSidebar } from "@/components/header-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { getAuthOrRedirect } from "@/features/auth/utils/get-auth-or-redirect";
import { DashboardComponent } from "@/features/dashboard/components/dashboard";

export default async function DashboardPage() {
    const user = await getAuthOrRedirect();

    return (
    <>
        <AppSidebar />
        <SidebarInset>
            <HeaderSidebar />
            <div className="flex p-4 pt-0 my-3">
                <DashboardComponent />
            </div>
        </SidebarInset>
    </>
    );
}