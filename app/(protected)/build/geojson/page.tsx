import { AppSidebar } from "@/components/app-sidebar";
import { HeaderSidebar } from "@/components/header-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { getAuthOrRedirect } from "@/features/auth/utils/get-auth-or-redirect";
import { GeoJSONBuilderComponent } from "@/features/geojson/components/geojson-builder";

export default async function GeoJSONCreatorPage() {
    const user = await getAuthOrRedirect();

    return (
    <>
        <AppSidebar />
        <SidebarInset>
            <HeaderSidebar />
            <div className="flex p-4 pt-0 my-3">
                <GeoJSONBuilderComponent />
            </div>
        </SidebarInset>
    </>
    );
}