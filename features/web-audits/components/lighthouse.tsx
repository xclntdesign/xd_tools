import { PerformanceMobileReportView, PerformanceReportViewer } from "../performance/performance-report-viewer";
import { LighthouseReport } from "./web-audit";

export function LighthouseSection ({ lighthouseReports }: { lighthouseReports : LighthouseReport | null }) {
    if(!lighthouseReports) return null;

    return (
        <div className="@container/main overflow-hidden">
            <div className="container mx-auto">
                <div className="space-y-4 py-6 lg:py-10 px-4 xl:px-0">
                    <div className="hidden lg:block">
                        <PerformanceReportViewer results={lighthouseReports} />
                    </div>
                    <div className="lg:hidden">
                        <PerformanceMobileReportView results={lighthouseReports} />
                    </div>
                </div>
            </div>
        </div>
    )
}