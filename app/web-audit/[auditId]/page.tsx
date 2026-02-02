import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccessibilitySection } from "@/features/web-audits/components/accessibility";
import { BrokenLinksSection } from "@/features/web-audits/components/broken-links";
import { LighthouseSection } from "@/features/web-audits/components/lighthouse";
import { SiteInfoSection } from "@/features/web-audits/components/site-info";
import { CompletedAudits } from "@/features/web-audits/components/web-audit";
import { getWebAuditByClientId } from "@/features/web-audits/queries/get-audits";
import { format } from "date-fns";
import { AlertCircleIcon } from "lucide-react";
import { notFound } from "next/navigation";

type ClientEditProps = {
    params: Promise<{
        auditId: string;
    }>;
    searchParams: Promise<{
        [key: string]: string | string[] | undefined
    }>;
}

function getDateDifferenceInDays(dateString1: Date, dateString2: Date) {
    // Convert strings to Date objects
    const date1 = dateString1;
    const date2 = dateString2;

    // Calculate the difference in milliseconds
    const timeDifference = Math.abs(date2.getTime() - date1.getTime());

    // Conversion factor for milliseconds to days (1000ms * 60s * 60m * 24h)
    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    // Convert the time difference to days
    const daysDifference = Math.floor(timeDifference / millisecondsPerDay);

    return daysDifference;
}

export default async function WebAuditCustomerViewPage({ params, searchParams }: ClientEditProps) {
    const { auditId } = await params;
    const isAdmin = (await searchParams).isAdmin;

    if(!auditId) {
        notFound();
    }

    const { status, message, description, data } = await getWebAuditByClientId(auditId);
    if(!status) {
        notFound();
    }

    const maxDays = 30;
    const difference = getDateDifferenceInDays(new Date(), new Date(data.created_at));
    if(difference > maxDays && !isAdmin) {
        return (
            <div className="grid grid-cols-1 gap-6 px-8 py-30 xl:py-50 2xl:px-50 lg:items-center">
                <div className="relative z-20">
                    <h1 className="text-5xl 2xl:text-7xl font-medium mb-6 text-red-500 dark:text-neutral-300 homePageHero___title **:pb-3 **:-mb-3 text-center">This audit has expired.</h1>
                    <div className="dark:*:text-neutral-300 lg:text-lg 2xl:text-xl leading-7 2xl:leading-9 text-center">
                        <p className="mb-4">We're sorry, but this audit has expired. Please contact xclntDesign if you would like another audit performed.</p>
                    </div>
                </div>
            </div>
        )
    }

    const completedAudits: CompletedAudits = JSON.parse(data.audit_details);
    const dateFormat = "PPPP h:mm a";
    
    return (
        <div className="w-xs lg:container lg:px-6 xl:px-0 mx-auto">
            <Card className="mt-4 py-2!">
                <CardContent className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-xl">Web Audit for <strong>{data.audit_url}</strong></span>
                    </div>
                    <div className="flex flex-col lg:text-right">
                        <span className="text-sm">Performed by xclntDesign</span>
                        <span className="text-sm text-muted-foreground">{format(data.created_at, dateFormat)}</span>
                    </div>
                </CardContent>
            </Card>
            <Alert variant="destructive" className="max-w-sm my-4 lg:hidden">
                <AlertCircleIcon />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>Full reports only available on larger screens.</AlertDescription>
            </Alert>
            <div className="flex flex-col">
                <Tabs defaultValue="site-info" className="w-full mt-8">
                    <TabsList variant="line" className="max-w-xs mx-auto">
                        <TabsTrigger value="site-info" className="cursor-pointer lg:text-xl">Site Info</TabsTrigger>
                        <TabsTrigger value="performance" className="cursor-pointer lg:text-xl">Performance</TabsTrigger>
                        <TabsTrigger value="accessibility" className="cursor-pointer lg:text-xl">Accessibility</TabsTrigger>
                        <TabsTrigger value="broken-links" className="cursor-pointer lg:text-xl">Broken Links</TabsTrigger>
                    </TabsList>
                    <TabsContent value="site-info" className="w-full">
                        <SiteInfoSection tech={completedAudits.tech} meta={completedAudits.meta} wpTheme={completedAudits.wpTheme} webHost={completedAudits.webHost} />
                    </TabsContent>
                    <TabsContent value="performance" className="w-full">
                        <LighthouseSection lighthouseReports={completedAudits.lighthouseReports} />
                    </TabsContent>
                    <TabsContent value="accessibility" className="w-full">
                        <AccessibilitySection accessibilityReports={completedAudits.accessibilityReports} />
                    </TabsContent>
                    <TabsContent value="broken-links" className="w-full">
                        <BrokenLinksSection brokenLinks={completedAudits.brokenLinks} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}