"use client";

import { ToolsCard, ToolsCardContent, ToolsCardTitle } from "@/components/tools-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Field, FieldDescription, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { AlertCircleIcon, ChevronsUpDownIcon, LoaderCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { AxeResults } from "../accessibility/axe-rules-list";
import { LhCategoryKey, psiToCategoryModel } from "../utils";
import { AccessibilitySection } from "./accessibility";
import { BrokenLinksSection } from "./broken-links";
import { LighthouseSection } from "./lighthouse";
import { SiteInfoSection } from "./site-info";

export interface Tech {
    name: string;
    id: string;
    version: string;
    categories: string[];
    url: string;
}

export interface Meta {
    social: {
        network: string;
        url: string;
        profile: string;
    }[];
}

export interface WPTheme {
    theme_uri: string;
    theme_name: string;
    author: string;
    version: string;
    license: string;
    license_uri: string;
    template: string;
    description: string;
    tags: string;
}

export interface WebHostRecord {
    ip: string;
    type: string;
    isp_id: string;
    isp_name: string;
    isp_url: string;
}

const lighthouseReportsList = [
    {
        id: "BEST_PRACTICES",
        name: "Best Practices",
        psiName: "best-practices",
    },
    {
        id: "PERFORMANCE",
        name: "Performance",
        psiName: "performance",
    },
    {
        id: "SEO",
        name: "SEO",
        psiName: "seo",
    },
];

export interface LighthouseReport {
    performanceScore: number;
    bestPracticesScore: number;
    seoScore: number;
    performance: string;
    bestPractices: string;
    seo: string;
}

export interface BrokenLink {
    url: string;
    status?: number;
    state: string;
    parent?: string;
}

export interface LinkCheck {
    passed: boolean;
    brokenLinks: BrokenLink[];
    brokenLinksCount: number;
    totalLinks: number;
}

export interface CompletedAudits {
    tech: Tech[] | null;
    meta: Meta | null;
    wpTheme: WPTheme[] | null;
    webHost: WebHostRecord[] | null;
    lighthouseReports: LighthouseReport | null;
    accessibilityReports: AxeResults | null;
    brokenLinks: LinkCheck | null;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface StoredAudits {
    id: number;
    audit_details: string;
    audit_url: string;
    created_at: Date;
}

const dateFormat = "MM/dd/yyyy h:mm a";

export function WebAuditComponent() {
    const [pending, setPending] = useState(false);
    const [previousPending, setPreviousPending] = useState(false);

    const [loadingMessage, setLoadingMessage] = useState("");
    const [loadingError, setLoadingError] = useState("");

    const [tech, setTech] = useState<Tech[] | null>(null);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [wpTheme, setWpTheme] = useState<WPTheme[] | null>(null);
    const [webHost, setWebHost] = useState<WebHostRecord[] | null>(null);
    const [lighthouseReports, setLighthouseReports] = useState<LighthouseReport | null>(null);
    const [accessibilityReports, setAccessibilityReports] = useState<AxeResults | null>(null);
    const [brokenLinks, setBrokenLinks] = useState<LinkCheck | null>(null);

    const [auditsFinished, setAuditsFinished] = useState(false);
    const [completedAudits, setCompletedAudits] = useState<CompletedAudits | null>(null);
    const [completionTime, setCompletionTime] = useState<{
        minutes: number;
        seconds: number;
    }>({
        minutes: 0,
        seconds: 0,
    });
    
    const [storedAudits, setStoredAudits] = useState<StoredAudits[] | null>(null);
    const [storedAuditsOpen, setStoredAuditsOpen] = useState(false);
    const [storedAuditId, setStoredAuditId] = useState<string | null>(null);
    const [storedAuditsSearch, setStoredAuditsSearch] = useState("");
    const [storedAudit, setStoredAudit] = useState<StoredAudits | null>(null);

    const generatorSchema = z.object({
         url: z.url("Invalid URL").min(1, "Full URL is required."),
    });

    type GeneratorFormInput = z.input<typeof generatorSchema>;

    const form = useForm<GeneratorFormInput>({
        resolver: zodResolver(generatorSchema),
        defaultValues: {
            url: "",
        }
    });

    const RATE_LIMIT_MS = 12_000;

    let lastLimitedCall = 0;
    async function rateLimitedFetch(input: RequestInfo | URL, init?: RequestInit) {
        const now = Date.now();
        const wait = Math.max(0, RATE_LIMIT_MS - (now - lastLimitedCall));
        if (wait) await sleep(wait);
        lastLimitedCall = Date.now();
        return fetch(input, init);
    }

    function getDateDiffInMinsSecs(date1: Date, date2: Date) {
        // Get the absolute difference in milliseconds
        let delta = Math.abs(date2.getTime() - date1.getTime());

        // Calculate minutes
        // Math.floor() ensures we get only the full minutes
        const minutes = Math.floor(delta / 60000); // 1000ms * 60s

        // Calculate remaining seconds
        // The modulo operator (%) gives the remainder after dividing by 60 seconds (in milliseconds)
        delta -= minutes * 60000;
        const seconds = Math.floor(delta / 1000); // 1000ms in a second

        return {
            minutes: minutes,
            seconds: seconds
        };
    }

    useEffect(() => {
        async function fetchStoredAudits() {
            const response = await fetch("/api/web-audits/list", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",                
                }
            });

            if(!response.ok) {
                setLoadingMessage("");
                setLoadingError("Failed to fetch stored audits.");
            }

            const json = await response.json();
            setStoredAudits(json.data);
        }

        fetchStoredAudits();
    }, []);

    async function generateWebAudit(data: GeneratorFormInput) {
        setPending(true);
        if(data.url) {
            const url = data.url;
            const start = new Date();

            setLoadingMessage("Analyzing website technology...");
            let tmpTech: Tech[] = [];
            const techFetchUrl = new URL("https://whatcms.org/API/Tech");
            techFetchUrl.searchParams.set("url", url);
            techFetchUrl.searchParams.set("key", process.env.NEXT_PUBLIC_WHATCMS_API_KEY!);
            try {
                const techResponse = await rateLimitedFetch(techFetchUrl.toString());
                if(!techResponse.ok) {
                    setLoadingMessage("");
                    setLoadingError("Failed to fetch website technology.");
                    setPending(false);
                    throw new Error("Failed to fetch website technology.")
                }
                const techJson = await techResponse.json();
                tmpTech = techJson.results;
                setTech(techJson.results);
                setMeta(techJson.meta);
            } catch (err) {
                setLoadingMessage("");
                setLoadingError(err as string);
            }

            if(tmpTech.length > 0) {
                const findWp = tmpTech.find((tech: Tech) => tech.name === "WordPress");
                if(findWp) {
                    setLoadingMessage("Analyzing WordPress themes...");
                    const wpThemeUrl = new URL("https://www.themedetect.com/API/Theme");
                    wpThemeUrl.searchParams.set("url", url);
                    wpThemeUrl.searchParams.set("key", process.env.NEXT_PUBLIC_WHATCMS_API_KEY!);
                    try {
                        const wpThemeResponse = await rateLimitedFetch(wpThemeUrl.toString());
                        if(!wpThemeResponse.ok) {
                            setLoadingMessage("");
                            setLoadingError("Failed to fetch WordPress themes.");
                            setPending(false);
                            throw new Error("Failed to fetch WordPress themes.")
                        }
                        const wpThemeJson = await wpThemeResponse.json();
                        setWpTheme(wpThemeJson.results);
                    } catch (err) {
                        setLoadingMessage("");
                        setLoadingError(err as string);
                    }
                }
            }

            setLoadingMessage("Analyzing web hosting...");
            const hostingFetchUrl = new URL("https://www.who-hosts-this.com/API/Host");
            hostingFetchUrl.searchParams.set("url", url);
            hostingFetchUrl.searchParams.set("key", process.env.NEXT_PUBLIC_WHATCMS_API_KEY!);
            try {
                const hostingResponse = await rateLimitedFetch(hostingFetchUrl.toString());
                if(!hostingResponse.ok) {
                    setLoadingMessage("");
                    setLoadingError("Failed to fetch web hosting.");
                    setPending(false);
                    throw new Error("Failed to fetch web hosting.")
                }
                const hostingJson = await hostingResponse.json();
                setWebHost(hostingJson.results);
            } catch (err) {
                setLoadingMessage("");
                setLoadingError(err as string);
            }

            let reportObj: LighthouseReport = {
                performanceScore: 0,
                bestPracticesScore: 0,
                seoScore: 0,
                performance: "",
                bestPractices: "",
                seo: "",
            };
            for(const report of lighthouseReportsList) {
                setLoadingMessage(`Analyzing PageSpeed Insights for ${report.name}...`);
                try {
                    const lighthouseResponse = await fetch('/api/analyze/lighthouse', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ url: url, report: report.id }),
                    });

                    if(!lighthouseResponse.ok) {
                        setLoadingMessage("");
                        setLoadingError(`Failed to fetch PageSpeed Insights for ${report.name}.`);
                        setPending(false);
                        throw new Error(`Failed to fetch PageSpeed Insights for ${report.name}.`)
                    }

                    const lighthouseData = await lighthouseResponse.json();
                    const { categoryScore, rows } = psiToCategoryModel(lighthouseData, report.psiName as LhCategoryKey);

                    if(report.id === "BEST_PRACTICES") {
                        reportObj.bestPracticesScore = categoryScore;
                        reportObj.bestPractices = JSON.stringify(rows);
                    } else if(report.id === "PERFORMANCE") {
                        reportObj.performanceScore = categoryScore;
                        reportObj.performance = JSON.stringify(rows);
                    } else if(report.id === "SEO") {
                        reportObj.seoScore = categoryScore;
                        reportObj.seo = JSON.stringify(rows);
                    }
                } catch (err) {
                    setLoadingMessage("");
                    setLoadingError(err as string);
                }
            }
            setLighthouseReports(reportObj);

            setLoadingMessage('Analyzing accessibility...');
            try {
                const accessibilityResponse = await fetch('/api/analyze/axe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: url }),
                });

                if(!accessibilityResponse.ok) {
                    setLoadingMessage("");
                    setLoadingError("Failed to fetch accessibility.");
                    setPending(false);
                    throw new Error("Failed to fetch accessibility.")
                }

                const accessibilityData = await accessibilityResponse.json();
                setAccessibilityReports(accessibilityData);
            } catch (err) {
                setLoadingMessage("");
                setLoadingError(err as string);
            }

            setLoadingMessage("Checking website for broken links...");
            try {
                const brokenLinksResponse = await fetch('/api/analyze/broken-links', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: url }),
                });

                if(!brokenLinksResponse.ok) {
                    setLoadingMessage("");
                    setLoadingError("Failed to fetch broken links.");
                    setPending(false);
                    throw new Error("Failed to fetch broken links.")
                }

                const brokenLinksData = await brokenLinksResponse.json();
                setBrokenLinks(brokenLinksData as LinkCheck);
            } catch (err) {
                setLoadingMessage("");
                setLoadingError(err as string);
            }
            setLoadingMessage("");
            setAuditsFinished(true);

            const end = new Date();
            const diff = getDateDiffInMinsSecs(start, end);
            setCompletionTime(diff);
        }

        setPending(false);
    }

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if(!auditsFinished || isMounted || storedAuditId) return; //audits already done, don't do it again

        const completed = {
            tech: tech,
            meta: meta,
            wpTheme: wpTheme,
            webHost: webHost,
            lighthouseReports: lighthouseReports,
            accessibilityReports: accessibilityReports,
            brokenLinks: brokenLinks,
        }

        async function storeAudit() {
            const response = await fetch("/api/web-audits/store", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",                
                },
                body: JSON.stringify({
                    details: JSON.stringify(completed),
                    url: form.getValues("url") ?? "",
                })
            });

            if(!response.ok) {
                toast.error("Failed to store audit.");
            }

            const json = await response.json();
            if(json.error) {
                toast.error(json.error);
            }
        }
        
        storeAudit();
 
        setCompletedAudits(completed);
        setIsMounted(true);
    }, [tech, meta, wpTheme, webHost, lighthouseReports, accessibilityReports, brokenLinks]);

    function urlToFilenameSafe(url: string): string {
        return url
            .trim()
            // Remove protocol (http:// or https://)
            .replace(/^https?:\/\//, "")
            // Remove leading www.
            .replace(/^www\./, "")
            // Remove query string + hash
            .replace(/[?#].*$/, "")
            // Replace slashes with dashes
            .replace(/\//g, "-")
            // Replace invalid filename characters
            .replace(/[^a-zA-Z0-9-_]/g, "-")
            // Collapse multiple dashes
            .replace(/-+/g, "-")
            // Remove trailing dash
            .replace(/^-|-$/g, "")
            // Lowercase for consistency
            .toLowerCase();
    }

    function createStoredAudit(val: string) {
        setStoredAuditId(val);
        setStoredAudit(storedAudits?.find((audit: StoredAudits) => audit.id.toString() === val) ?? null);
        setStoredAuditsOpen(false);
    }

    async function retrieveWebAudit() {
        setPreviousPending(true);
        if(!storedAuditId) {
            setPreviousPending(false);
            toast.error("Please select a previous audit.");
            return;
        }

        const response = await fetch("/api/web-audits/get", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",                
            },
            body: JSON.stringify({
                id: storedAuditId,
            })
        });

        if(!response.ok) {
            throw new Error("Failed to fetch stored audit.");
        }

        const json = await response.json();
        if(json.error) {
            throw new Error(json.error);
        }

        setTech(json.tech);
        setMeta(json.meta);
        setWpTheme(json.wpTheme);
        setWebHost(json.webHost);
        setLighthouseReports(json.lighthouseReports);
        setAccessibilityReports(json.accessibilityReports);
        setBrokenLinks(json.brokenLinks);
        setAuditsFinished(true);

        const completed = {
            tech: json.tech,
            meta: json.meta,
            wpTheme: json.wpTheme,
            webHost: json.webHost,
            lighthouseReports: json.lighthouseReports,
            accessibilityReports: json.accessibilityReports,
            brokenLinks: json.brokenLinks,
        };
        setCompletedAudits(completed);

        setPreviousPending(false);
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-2 gap-8 items-start lg:items-center justify-between w-full">
                <ToolsCard>
                    <ToolsCardTitle>Scan Website</ToolsCardTitle>
                    <ToolsCardContent>
                        <form id="web-audit-form" onSubmit={form.handleSubmit(generateWebAudit, () => {
                            toast.error("One or more errors need your attention.")
                        })}>
                            <Controller
                                name="url"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <Input
                                            {...field}
                                            aria-invalid={fieldState.invalid}
                                            className={cn("rounded-none border-0 border-b-2 max-w-full", {"border-destructive": fieldState.invalid}, {"border-green-500": !fieldState.invalid && field.value})}
                                        />
                                        <FieldDescription>
                                            Enter the full URL you wish to inspect.
                                        </FieldDescription>
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                            <div className="flex flex-col mt-4 items-end justify-end">
                                <div className="flex flex-row gap-4 items-center">
                                    <Button
                                        className="cursor-pointer"
                                        type="submit"
                                        size="lg"
                                        disabled={pending || previousPending || completedAudits !== null}
                                    >
                                        {pending ? (
                                            <>
                                            Scanning... <LoaderCircleIcon className="size-4 animate-spin" />
                                            </>
                                        ) : "Scan"}
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground mt-4">This scan may take several minutes.</p>
                                {completionTime.minutes > 0 || completionTime.seconds > 0 && (
                                    <div className="mt-4">
                                        Time to Complete: {completionTime.minutes}m {completionTime.seconds}s
                                    </div>
                                )}
                            </div>
                        </form>
                    </ToolsCardContent>
                </ToolsCard>
                <ToolsCard>
                    <ToolsCardTitle>Previous Audits</ToolsCardTitle>
                    <ToolsCardContent>
                        {!storedAudits && (
                            <LoaderCircleIcon className="size-8 animate-spin" />
                        )}
                        {storedAudits && (
                            <Field>
                                <Popover open={storedAuditsOpen} onOpenChange={setStoredAuditsOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={storedAuditsOpen}
                                            className={cn("grow justify-between mb-2 rounded-none border-0 border-b-2 max-w-full")}
                                        >
                                            {(!storedAuditId && !storedAudit) ? "Select an audit..." : (
                                                <>
                                                {storedAudit?.audit_url} <span className="text-sm text-muted-foreground">({format(storedAudit?.created_at ?? new Date(), dateFormat)})</span>
                                                </>
                                            )}
                                            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        align="start"
                                        sideOffset={4}
                                        className="p-0"
                                        style={{ width: "var(--radix-popover-trigger-width"}}
                                    >
                                        <Command>
                                            <CommandInput
                                                placeholder="Search audits..."
                                                value={storedAuditsSearch}
                                                onValueChange={setStoredAuditsSearch}
                                                className="max-w-full" 
                                            />

                                            <CommandList>
                                                <CommandEmpty>
                                                    No audits found.
                                                </CommandEmpty>

                                                <CommandGroup className="max-h-48 overflow-y-auto">
                                                    {storedAudits?.map((audit: StoredAudits) => (
                                                        <CommandItem
                                                            key={audit.id}
                                                            value={audit.id.toString()}
                                                            onSelect={createStoredAudit}
                                                            className="w-full"
                                                        >
                                                            <div className="min-w-0">
                                                                {audit.audit_url} ({format(audit.created_at, dateFormat)})
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FieldDescription>
                                    Select a previous audit to view.
                                </FieldDescription>
                            </Field>
                        )}
                        <div className="flex flex-col mt-4 items-end justify-end">
                            <div className="flex flex-row gap-4 items-center">
                                <Button
                                    className="cursor-pointer"
                                    type="button"
                                    size="lg"
                                    disabled={pending || previousPending || completedAudits !== null}
                                    onClick={retrieveWebAudit}
                                >
                                    {previousPending ? (
                                        <>
                                        Retrieving... <LoaderCircleIcon className="size-4 animate-spin" />
                                        </>
                                    ) : "Retrieve"}
                                </Button>
                            </div>
                        </div>
                    </ToolsCardContent>
                </ToolsCard>
            </div>
            <div className="grid grid-cols-1 mt-4">
                {pending && (
                    <div className="flex justify-center items-center gap-6 my-4">
                        <span className="text-lg">{loadingMessage}</span>
                        <LoaderCircleIcon className="size-8 animate-spin" />
                    </div>
                )}
                {loadingError && (
                    <Alert variant="destructive" className="max-w-sm">
                        <AlertCircleIcon />
                        <AlertTitle>Audit Error</AlertTitle>
                        <AlertDescription>{loadingError.toString()}</AlertDescription>
                    </Alert>
                )}
                {auditsFinished && completedAudits && (
                    <>
                    <div className="flex flex-row justify-end">
                        <Button
                            className="cursor-pointer"
                            variant="outline"
                            type="button"
                            size="lg"
                            onClick={() => {
                                form.reset({
                                    url: "",
                                });
                                setTech(null);
                                setMeta(null);
                                setWpTheme(null);
                                setWebHost(null);
                                setLighthouseReports(null);
                                setAccessibilityReports(null);
                                setBrokenLinks(null);
                                setAuditsFinished(false);
                                setCompletedAudits(null);
                                setCompletionTime({
                                    minutes: 0,
                                    seconds: 0,
                                });
                                setStoredAuditId(null);
                                setStoredAudit(null);
                                setStoredAuditsOpen(false);
                                setStoredAuditsSearch("");
                                setLoadingError("");
                                setLoadingMessage("");
                                setPending(false);
                                setPreviousPending(false);
                            }}
                        >
                            Reset
                        </Button>
                    </div>
                    <Tabs defaultValue="site-info" className="w-full">
                        <TabsList variant="line" className="max-w-xs mx-auto">
                            <TabsTrigger value="site-info" className="cursor-pointer text-xl">Site Info</TabsTrigger>
                            <TabsTrigger value="performance" className="cursor-pointer text-xl">Performance</TabsTrigger>
                            <TabsTrigger value="accessibility" className="cursor-pointer text-xl">Accessibility</TabsTrigger>
                            <TabsTrigger value="broken-links" className="cursor-pointer text-xl">Broken Links</TabsTrigger>
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
                    </>
                )}
            </div>
        </div>
    )
}