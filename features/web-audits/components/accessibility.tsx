import { AxeReportViewer, AxeResults } from "../accessibility/axe-rules-list";

export function AccessibilitySection ({ accessibilityReports }: { accessibilityReports : AxeResults | null }) {
    if(!accessibilityReports) return null;

    return (
        <div className="@container/main overflow-hidden">
            <div className="container mx-auto">
                <div className="space-y-4 py-6 lg:py-10 px-4 xl:px-0">
                    <AxeReportViewer results={accessibilityReports} />
                </div>
            </div>
        </div>
    )
}