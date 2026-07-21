import { AppSidebar } from "@/components/app-sidebar";
import { HeaderSidebar } from "@/components/header-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { getAuthOrRedirect } from "@/features/auth/utils/get-auth-or-redirect";
import { ThemeGeneratorComponent } from "@/features/theme/components/theme-generator";

export default async function ThemeGeneratorPage() {
    const user = await getAuthOrRedirect();

    return (
    <>
        <AppSidebar />
        <SidebarInset>
            <HeaderSidebar />
            <div className="flex p-4 pt-0 my-3">
                <ThemeGeneratorComponent />
            </div>
        </SidebarInset>
    </>
    );
}