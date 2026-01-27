"use client";

import { ToolsCard, ToolsCardContent, ToolsCardTitle } from "@/components/tools-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useVirtualizer } from "@tanstack/react-virtual";
import { LoaderCircleIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const initialSelectedIds = ['img/avif','img/webp','img/webp-alpha'];

type ModernizrDetect = {
    id: string;
    category: string;
    name: string;
    property: string;
    description: string | null;
    caniuse: string | null;
    caniuseUrl: string | null;
    caniuseEmbedUrl: string | null;
    notes: {
        name: string;
        text: string;
    }[];
    polyfills: string[];
};

export function ModernizrComponent() {
    const [pending, setPending] = useState(false);

    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<Set<string>>(
        () => new Set(initialSelectedIds)
    );
    const [detects, setDetects] = useState<ModernizrDetect[]>([]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return detects;

        return detects.filter((d) => {
            const hay = `${d.name} ${d.category} ${d.description ?? ''} ${d.id}`.toLowerCase();
            return hay.includes(q);
        });
    }, [detects, query]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            const c = a.category.localeCompare(b.category);
            return c !== 0 ? c : a.name.localeCompare(b.name);
        });
    }, [filtered]);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchDetects() {
            try {
                const response = await fetch('/modernizr-detects.json', {
                    signal: controller.signal,
                });

                if (!response.ok) throw new Error('Failed to fetch detects');

                const data = await response.json();

                const items = Array.isArray(data) ? data : data?.items;

                setDetects(Array.isArray(items) ? items : []);
            } catch (e) {
                if ((e as any)?.name !== "AbortError") {
                    console.error("Failed to load detects", e);
                    setDetects([]);
                }
            }
        }

        fetchDetects();
        return () => controller.abort();
    }, []);

    // Virtualizer
    const parentRef = useRef<HTMLDivElement | null>(null);
    const rowVirtualizer = useVirtualizer({
        count: sorted.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 68,
        overscan: 10,
        measureElement: (el) => el.getBoundingClientRect().height,
    });

    function toggle(id: string) {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelected(next);
    }

    function remove(id: string) {
        if (!selected.has(id)) return;
        const next = new Set(selected);
        next.delete(id);
        setSelected(next);
    }

    function clearAll() {
        setQuery('');
    }

    const selectedList = useMemo(() => {
        const byId = new Map(detects.map((d) => [d.id, d]));
        return Array.from(selected)
            .map((id) => byId.get(id))
            .filter(Boolean) as ModernizrDetect[];
    }, [selected, detects]);

    async function generateModernizr() {
        setPending(true);
        try {
            const res = await fetch("/api/modernizr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    detects: Array.from(selected),
                }),
            });

            const js = await res.text();

            const blob = new Blob([js], { type: "application/javascript" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "modernizr-custom.min.js";
            a.click();

            URL.revokeObjectURL(url);
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr] gap-8">
                <ToolsCard>
                    <ToolsCardTitle>Select Detects</ToolsCardTitle>
                    <ToolsCardContent>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Filter detects…"
                                aria-label="Filter detects"
                                className="sm:flex-1"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={clearAll}
                                disabled={selected.size === 0}
                            >
                                <XIcon />
                            </Button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground my-4">
                            <Badge variant="secondary">{sorted.length} visible</Badge>
                            <span>·</span>
                            <Badge variant="outline">{selected.size} selected</Badge>
                        </div>
                        
                        <Separator />

                        <div
                            ref={parentRef}
                            className="h-130 overflow-y-auto"
                            role="listbox"
                            aria-multiselectable="true"
                        >
                            <div
                                className="relative w-full"
                                style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                            >   
                                {rowVirtualizer.getVirtualItems().map((vr) => {
                                    const d = sorted[vr.index];
                                    const isChecked = selected.has(d.id);

                                    const prev = vr.index > 0 ? sorted[vr.index - 1] : null;
                                    const showHeader = !prev || prev.category !== d.category;

                                    return (
                                        <div
                                            key={d.id}
                                            className="absolute left-0 top-0 w-full"
                                            style={{ transform: `translateY(${vr.start}px)` }}
                                        >
                                            <div
                                                ref={rowVirtualizer.measureElement}
                                                data-index={vr.index}
                                            >
                                                {showHeader && (
                                                    <div className="border-y bg-muted/40 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                        {d.category}
                                                    </div>
                                                )}

                                                <div className="flex w-full items-start gap-3 border-b px-4 py-3 text-left hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex min-w-0 items-baseline gap-2">
                                                        <code className="truncate rounded bg-muted px-1.5 py-0.5 text-[12px]">
                                                            {d.name}
                                                        </code>
                                                        <span className="truncate text-xs text-muted-foreground">
                                                            — {d.id}
                                                        </span>
                                                        </div>
                                                        {d.description ? (
                                                        <p className="mt-1 line-clamp-2 text-xs text-foreground/80">
                                                            {d.description}
                                                        </p>
                                                        ) : null}
                                                    </div>
                                                    <div className="ml-4">
                                                        <Switch
                                                            checked={isChecked}
                                                            onCheckedChange={() => toggle(d.id)}
                                                            aria-label={`Toggle ${d.name}`}
                                                            className="mt-0.5"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </ToolsCardContent>
                </ToolsCard>
                <ToolsCard>
                    <ToolsCardTitle>Selected Detects</ToolsCardTitle>
                    <ToolsCardContent>
                        {selectedList.length === 0 ? (
                            <p>Please select some detects from the list.</p>
                        ) : (
                            <div className="flex flex-wrap gap-8">
                                {selectedList
                                    .slice()
                                    .sort(
                                    (a, b) =>
                                        a.category.localeCompare(b.category) ||
                                        a.name.localeCompare(b.name)
                                    )
                                    .map((d) => (
                                        <div className="flex flex-row gap-2 items-center justify-between" key={d.id}>
                                            <span className="font-medium">{d.name}</span>
                                            <Switch
                                                checked={selected.has(d.id)}
                                                onCheckedChange={() => remove(d.id)}
                                                aria-label={`Toggle ${d.name}`}
                                                className="mt-0.5"
                                            />
                                        </div>                                        
                                ))}
                            </div>
                        )}
                    </ToolsCardContent>
                </ToolsCard>
                <ToolsCard>
                    <ToolsCardTitle>Generate Modernizr</ToolsCardTitle>
                    <ToolsCardContent>
                        <Button
                            className="cursor-pointer"
                            type="button"
                            size="lg"
                            disabled={pending || selected.size === 0}
                            onClick={generateModernizr}
                        >
                            {pending ? (
                                <>
                                Generating... <LoaderCircleIcon className="size-4 animate-spin" />
                                </>
                            ) : "Generate + Download"}
                        </Button>
                    </ToolsCardContent>
                </ToolsCard>
            </div>
        </div>
    );
}