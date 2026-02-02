"use client";

import { BrokenLinksTable } from "../broken-links/broken-links-table";
import { LinkCheck } from "./web-audit";

export function BrokenLinksSection ({ brokenLinks }: { brokenLinks: LinkCheck | null }) {
    if(!brokenLinks) return null;

    return (
        <div className="@container/main overflow-hidden">
            <div className="container mx-auto">
                <div className="space-y-4 py-6 lg:py-10 px-4 xl:px-0">
                    <BrokenLinksTable links={brokenLinks.brokenLinks} />
                </div>
            </div>
        </div>
    )
}