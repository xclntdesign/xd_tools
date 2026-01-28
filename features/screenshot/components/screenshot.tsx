"use client";

import { ToolsCard, ToolsCardContent, ToolsCardSubtitle, ToolsCardTitle } from "@/components/tools-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandList } from "@/components/ui/command";
import { FieldDescription } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CommandItem } from "cmdk";
import { AlertCircleIcon, CheckIcon, ChevronsUpDownIcon, LoaderCircleIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const screenshotDeviceList = [
    {
        id: "phone",
        name: "Phones",
        items: [
            {
                id: "iPhoneSE",
                name: "Apple iPhone SE",
                dimensions: "375x667"
            },
            {
                id: "iPhone12",
                name: "Apple iPhone 12",
                dimensions: "390x844"
            },
            {
                id: "iPhone14ProMax",
                name: "Apple iPhone 14 Pro Max",
                dimensions: "430x932"
            },
            {
                id: "Pixel5",
                name: "Google Pixel 5",
                dimensions: "393x851"
            },
            {
                id: "GalaxyS23",
                name: "Samsung Galaxy S23",
                dimensions: "360x780"
            }
        ]
    },
    {
        id: "tablets_portrait",
        name: "Tablets (Portrait)",
        items: [
            {
                id: "iPadMini",
                name: "Apple iPad Mini",
                dimensions: "768x1024"
            },
            {
                id: "iPadPro11",
                name: "Apple iPad Pro 11",
                dimensions: "834x1112"
            },
            {
                id: "iPadPro12_9",
                name: "Apple iPad Pro 12.9",
                dimensions: "1024x1366"
            },
        ]
    },
    {
        id: "tablets_landscape",
        name: "Tablets (Landscape)",
        items: [
            {
                id: "iPadMini_Landscape",
                name: "Apple iPad Mini",
                dimensions: "1024x768"
            },
            {
                id: "iPadPro11_Landscape",
                name: "Apple iPad Pro 11",
                dimensions: "1112x834"
            },
            {
                id: "iPadPro12_9_Landscape",
                name: "Apple iPad Pro 12.9",
                dimensions: "1366x1024"
            },
        ]
    },
    {
        id: "laptops",
        name: "Laptops",
        items: [
            {
                id: "MacBookAir",
                name: "Apple MacBook Air",
                dimensions: "1440x900"
            },
            {
                id: "MacBookPro14",
                name: "Apple MacBook Pro 14",
                dimensions: "1512x982",
            },
            {
                id: "WindowsLaptop",
                name: "Generic Microsoft Windows Laptop",
                dimensions: "1366x768"
            },
        ]
    },
    {
        id: "desktops",
        name: "Desktops",
        items: [
            {
                id: "DesktopHD",
                name: "Desktop (HD)",
                dimensions: "1920x1080"
            },
            {
                id: "DesktopQHD",
                name: "Desktop (QHD)",
                dimensions: "2560x1440"
            },
            {
                id: "Desktop4K",
                name: "Desktop (4K)",
                dimensions: "3840x2160"
            }
        ]
    }
]

type ScreenshotOutput = {
    imageUrl: string;
    url: string;
    device: string;
}

export function ScreenshotGeneratorComponent() {
    const [pending, setPending] = useState(false);

    const [urls, setUrls] = useState<string[]>([]);
    const ref = useRef<HTMLTextAreaElement>(null);

    const [devicesPopoverOpen, setDevicesPopoverOpen] = useState(false);
    const [devices, setDevices] = useState<string[]>([]);

    const [screenshots, setScreenshots] = useState<ScreenshotOutput[]>([]);

    function updateUrlList(event: React.ChangeEvent<HTMLTextAreaElement>) {
        const lines = event.target.value.split("\n");
        setUrls(lines);
    }

    function removeDevice(val: string) {
        let newValues: string[] = [];
        newValues = devices.filter(v => v !== val);
        setDevices(newValues);
    }

    function toggleDevice(opt: string) {
        const exists = devices.includes(opt);
        if(exists) {
            removeDevice(opt);
        } else {
            setDevices([...devices, opt]);
        }
    }

    async function generateScreenshots() {
        if(urls.length === 0 || devices.length === 0) return;

        setPending(true);
        setScreenshots([]);

        for(const url of urls) {
            for(const device of devices) {
                const imageUrl = new URL("/api/screenshot", window.location.href);
                imageUrl.searchParams.set("url", url);
                imageUrl.searchParams.set("device", device);

                const d = screenshotDeviceList.flatMap(group => group.items).find(item => item.id === device);
                if(!d) continue;

                setScreenshots(prev => [
                    ...prev,
                    { imageUrl: imageUrl.toString(), url: url, device: d.name }
                ]);
            }
        }

        setUrls([]);
        setDevices([]);
        if(ref.current) ref.current.value = "";
        setPending(false);     
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-[2fr_2fr_1fr] gap-8 items-start lg:items-center justify-between w-full">
                <ToolsCard>
                    <ToolsCardTitle>URLs</ToolsCardTitle>
                    <ToolsCardContent>
                        <Textarea
                            ref={ref}
                            className="mb-2 rounded-none border-0 border-b-2 max-w-full h-72"
                            placeholder="One URL per line."
                            onChange={updateUrlList}
                        />
                        <FieldDescription>
                            One URL per line.
                        </FieldDescription>
                    </ToolsCardContent>
                </ToolsCard>
                <ToolsCard>
                    <ToolsCardTitle>Devices</ToolsCardTitle>
                    <ToolsCardContent>
                        {devices.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {devices.map((v) => {
                                    const device = screenshotDeviceList.flatMap(group => group.items).find((item) => item.id === v);
                                    if(!device) return null;

                                    return (
                                        <Badge key={v} variant="secondary" className="gap-1">
                                            <span className="max-w-60 truncate">{device.name}</span>
                                            <button
                                                type="button"
                                                className="ml-1 rounded-sm opacity-70 hover:opacity-100"
                                                onClick={() => removeDevice(device.id)}
                                                aria-label={`Remove ${device.id}`}
                                            >
                                                <XIcon className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}
                        <Popover open={devicesPopoverOpen} onOpenChange={setDevicesPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={devicesPopoverOpen}
                                    className="grow justify-between mb-2 rounded-none border-0 border-b-2 w-full"
                                >
                                    <span className="truncate">
                                        {devices.length === 0 ? 'No devices selected.' : `${devices.length} selected`}
                                    </span>
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
                                    <CommandList>
                                        <CommandEmpty>
                                            No devices found.
                                        </CommandEmpty>
                                        {screenshotDeviceList.map((grp) => (
                                            <CommandGroup key={grp.id} heading={grp.name}>
                                                {grp.items.map((item) => (
                                                    <CommandItem
                                                        key={item.id}
                                                        value={item.id}
                                                        onSelect={() => toggleDevice(item.id)}
                                                        className="w-full flex flex-row gap-2 px-2 cursor-pointer justify-between"
                                                    >
                                                        <div className="min-w-0 py-1 flex flex-row gap-4 items-center cursor-pointer">
                                                            <div className="truncate">{item.name}</div> <div className="text-xs text-muted-foreground">{`(${item.dimensions})`}</div>
                                                        </div>
                                                        <CheckIcon className={cn("mr-2 h-4 w-4", devices.includes(item.id) ? "opacity-100" : "opacity-0")} />
                                                    </CommandItem>
                                                ))}
                                                </CommandGroup>
                                            ))}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </ToolsCardContent>
                </ToolsCard>
                <ToolsCard>
                    <ToolsCardTitle>Generate Screenshots</ToolsCardTitle>
                    <ToolsCardContent>
                        <Button
                            className="cursor-pointer"
                            type="button"
                            size="lg"
                            disabled={pending}
                            onClick={generateScreenshots}
                        >
                            {pending ? (
                                <>
                                Generating... <LoaderCircleIcon className="size-4 animate-spin" />
                                </>
                            ) : "Generate"}
                        </Button>
                    </ToolsCardContent>
                </ToolsCard>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 items-start lg:items-center w-full">
                {!pending && screenshots.length > 0 && screenshots.map((screenshot, index) => (
                    <ToolsCard key={index}>
                        <ToolsCardTitle className="border-l-blue-500">{screenshot.device}</ToolsCardTitle>
                        <ToolsCardSubtitle>{screenshot.url}</ToolsCardSubtitle>
                        <ToolsCardContent>
                            <ScreenshotImage src={screenshot.imageUrl} url={screenshot.url} device={screenshot.device} />
                        </ToolsCardContent>
                    </ToolsCard>
                ))}
            </div>
        </div>
    );
}

function safeFilename(input: string) {
  return input
    .replace(/^https?:\/\//, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 120);
}

function ScreenshotImage({ src, url, device }: { src: string, url: string, device: string }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    useEffect(() => {
        let objectUrl: string | null = null;
        const controller = new AbortController();

        async function load() {
            try {
                setLoading(true);
                setError(false);
                setBlobUrl(null);

                const res = await fetch(src, { signal: controller.signal });
                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    throw new Error(text || `Request failed: ${res.status}`);
                }

                const contentType = res.headers.get("content-type") || "";
                if (!contentType.includes("image/jpeg") && !contentType.startsWith("image/")) {
                    const text = await res.text().catch(() => "");
                    throw new Error(`Expected image, got "${contentType}". Body: ${text.slice(0, 200)}`);
                }

                const blob = await res.blob();
                objectUrl = URL.createObjectURL(blob);
                setBlobUrl(objectUrl);
                setLoading(false);
            } catch (e) {
                if ((e as any)?.name === "AbortError") return;
                setLoading(false);
                setError(true);
            }
        }

        load();

        return () => {
            controller.abort();
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [src]);

    const filename = `screenshot_${safeFilename(device)}_${safeFilename(url)}.jpg`;
    
    return (
        <div className="relative w-full">
            {loading && !error && (
                <div className="flex justify-center items-center p-8">
                    <LoaderCircleIcon className="size-8 animate-spin" />
                </div>
            )}
            {error && (
                <Alert variant="destructive" className="w-full">
                    <AlertCircleIcon />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        Screenshot failed to load.
                    </AlertDescription>
                </Alert>
            )}
            {!loading && !error && blobUrl && (
                <>
                <img
                    src={blobUrl}
                    alt={`Screenshot of ${url} on ${device}`}
                    className="max-w-full h-auto"
                    onLoad={() => setLoading(false)}
                    onError={() => {
                        setLoading(false);
                        setError(true);
                    }}
                />
                <Button
                    asChild
                    className="cursor-pointer mt-2"
                    size="lg"
                >
                    <a href={blobUrl} download={filename}>
                        Download
                    </a>
                </Button>
                </>
            )}
        </div>
    )
}