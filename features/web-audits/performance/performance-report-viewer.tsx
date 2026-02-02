"use client";

import { ScoreBadge } from "@/components/score-badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { TabsContent } from "@radix-ui/react-tabs";
import { LighthouseReport } from "../components/web-audit";
import { parseStoredRowsJson } from "../utils";
import { LighthouseCategoryList } from "./lighthouse-audit-table";

export function PerformanceReportViewer({ results }: { results: LighthouseReport }) {
    const performanceScoreDash = (results.performanceScore) ? Math.ceil((75 / 100) * results.performanceScore) : 0;
    const bestPracticesScoreDash = (results.bestPracticesScore) ? Math.ceil((75 / 100) * results.bestPracticesScore): 0;
    const seoScoreDash = (results.seoScore) ? Math.ceil((75 / 100) * results.seoScore): 0;

    const performanceResults = (results.performance) ? parseStoredRowsJson(results.performance as string) : [];
    const bestPracticesResults = (results.bestPractices) ? parseStoredRowsJson(results.bestPractices as string) : [];
    const seoResults = (results.seo) ? parseStoredRowsJson(results.seo as string) : [];

    return (
        <Tabs defaultValue="performance">
            <TabsList className="bg-transparent flex flex-row gap-x-24 items-center justify-center mb-6 w-full border-b rounded-none py-0 h-40!">
                <TabsTrigger value="performance" className="border-0 border-b-2 border-b-transparent data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:border-b-black dark:data-[state=active]:border-b-white data-[state=active]:text-neutral flex-0 rounded-none focus-visible:ring-0 dark:focus-visible:ring-0data-[state=active]:shadow-none dark:data-[state=active]:shadow-none transition-all duration-300 ease-in-out">
                    <PerformanceScoreGauge type="Performance" score={results.performanceScore} dash={performanceScoreDash} />
                </TabsTrigger>
                <TabsTrigger value="best-practices" asChild className="border-0 border-b-2 border-b-transparent data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:border-b-black dark:data-[state=active]:border-b-white data-[state=active]:text-neutral flex-0 rounded-none focus-visible:ring-0 dark:focus-visible:ring-0data-[state=active]:shadow-none dark:data-[state=active]:shadow-none transition-all duration-300 ease-in-out">
                    <button className="cursor-pointer">
                        <PerformanceScoreGauge type="Best Practices" score={results.bestPracticesScore} dash={bestPracticesScoreDash} />
                    </button>
                </TabsTrigger>
                <TabsTrigger value="seo" asChild className="border-0 border-b-2 border-b-transparent data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:border-b-black dark:data-[state=active]:border-b-white data-[state=active]:text-neutral flex-0 rounded-none focus-visible:ring-0 dark:focus-visible:ring-0data-[state=active]:shadow-none dark:data-[state=active]:shadow-none transition-all duration-300 ease-in-out">
                    <button className="cursor-pointer">
                        <PerformanceScoreGauge type="SEO" score={results.seoScore} dash={seoScoreDash} />
                    </button>
                </TabsTrigger>
            </TabsList>
            <TabsContent value="performance">
                <LighthouseCategoryList rows={performanceResults} category="performance" categoryScore={results.performanceScore} />
            </TabsContent>
            <TabsContent value="best-practices">
                <LighthouseCategoryList rows={bestPracticesResults} category="best-practices" categoryScore={results.bestPracticesScore} />
            </TabsContent>
            <TabsContent value="seo">
                <LighthouseCategoryList rows={seoResults} category="seo" categoryScore={results.seoScore} />
            </TabsContent>
        </Tabs>
    );
}

export function PerformanceMobileReportView({ results }: { results: LighthouseReport }) {
    const performanceResults = (results.performance) ? parseStoredRowsJson(results.performance as string) : [];
    const bestPracticesResults = (results.bestPractices) ? parseStoredRowsJson(results.bestPractices as string) : [];
    const seoResults = (results.seo) ? parseStoredRowsJson(results.seo as string) : [];

    return (
        <Accordion type="single" collapsible>
            <AccordionItem value="performance">
                <AccordionTrigger className="flex flex-row items-center">
                    <span className="text-xl font-semibold">Performance</span>
                    <div className="ml-auto">
                        <ScoreBadge score={results.performanceScore} />
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <LighthouseCategoryList rows={performanceResults} category="performance" categoryScore={results.performanceScore} showHeader={false} />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="best-practices">
                <AccordionTrigger className="flex flex-row items-center">
                    <span className="text-xl font-semibold">Best Practices</span>
                    <div className="ml-auto">
                        <ScoreBadge score={results.bestPracticesScore || 0} />
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <LighthouseCategoryList rows={bestPracticesResults} category="best-practices" categoryScore={results.bestPracticesScore} showHeader={false} />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="seo">
                <AccordionTrigger className="flex flex-row items-center">
                    <span className="text-xl font-semibold">SEO</span>
                    <div className="ml-auto">
                        <ScoreBadge score={results.seoScore || 0} />
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <LighthouseCategoryList rows={seoResults} category="seo" categoryScore={results.seoScore} showHeader={false} />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}

function PerformanceScoreGauge({ type, score, dash }: { type: string; score: number | null; dash: number }) {
    let strokeColor, scoreColor, scoreMessageColor;
    if(!score) {
        score = 0;
    }
    if(score < 50) {
        strokeColor = "text-destructive";
        scoreColor = "text-destructive";
        scoreMessageColor = "text-destructive-foreground";
    } else if(score < 90 && score >= 50) {
        strokeColor = "text-amber-700 dark:text-amber-300";
        scoreColor = "text-amber-600 dark:text-amber-500";
        scoreMessageColor = "text-amber-600 dark:text-amber-500";
    } else {
        strokeColor = "text-green-700 dark:text-green-300";
        scoreColor = "text-green-600 dark:text-green-500";
        scoreMessageColor = "text-green-600 dark:text-green-500";
    }

    return (
        <div className="relative size-40">
            <svg className="rotate-135 size-full" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-green-200 dark:text-neutral-700" strokeWidth="1" strokeDasharray="75 100" strokeLinecap="round"></circle>

                <circle cx="18" cy="18" r="16" fill="none" className={cn("stroke-current",strokeColor)} strokeWidth="2" strokeDasharray={`${dash} 100`} strokeLinecap="round"></circle>
            </svg>
            <div className="absolute top-1/2 start-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <span className={cn("text-4xl font-bold", scoreColor)}>{score}</span>
                <span className={cn("block text-sm whitespace-nowrap", scoreMessageColor)}>{type}</span>
            </div>
        </div>
    );
}