"use client";

import { statesList } from "@/app/vars";
import { ToolsCard, ToolsCardContent, ToolsCardTitle } from "@/components/tools-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Field } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, ChevronsUpDownIcon, LoaderCircleIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { getGeoJSONFromZips } from "../actions/get-geojson";
import { getZipCodesFromState } from "../actions/get-zip-codes";

import type {
    Feature,
    FeatureCollection,
    MultiPolygon,
    Polygon,
} from "geojson";

type ZipProperties = {
  state: string;
  zip_code: string;
};

type ZipGeometry = Polygon | MultiPolygon;

export type ZipFeature = Feature<ZipGeometry, ZipProperties>;

export type ZipFeatureCollection = FeatureCollection<ZipGeometry, ZipProperties>;

function useDebounced<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function GeoJSONBuilderComponent() {
    const [pending, setPending] = useState(false);

    const [statesOpen, setStatesOpen] = useState(false);
    const [statesSearch, setStatesSearch] = useState("");
    const s = useDebounced(statesSearch, 250);

    const [zipsOpen, setZipsOpen] = useState(false);
    const [zipSearch, setZipSearch] = useState("");
    const q = useDebounced(zipSearch, 250);

    const [zipsLoading, setZipsLoading] = useState(false);
    const [fullZipsList, setFullZipsList] = useState<string[]>([]);
    const [selectedZipsList, setSelectedZipsList] = useState<string[]>([]);

    const [geoJson, setGeoJson] = useState<ZipFeatureCollection | null>(null);

    const mapDivRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const infoRef = useRef<google.maps.InfoWindow | null>(null);

    useEffect(() => {
        if (!geoJson) return; // <- key: don't create map until final API returned geojson
        if (!mapDivRef.current) return;
        if (typeof google === "undefined") return; // best TS-friendly guard

        (async () => {
            await google.maps.importLibrary("maps");

            if (!mapRef.current) {
                mapRef.current = new google.maps.Map(mapDivRef.current!, {
                    center: { lat: 39.5, lng: -98.35 },
                    zoom: 4,
                    mapTypeControl: false,
                });

                infoRef.current = new google.maps.InfoWindow();

                mapRef.current.data.setStyle((feature) => {
                    const tier = feature.getProperty("tier");
                    const selected = !!feature.getProperty("selected");
                    return {
                        clickable: true,
                        strokeWeight: selected ? 3 : 2,
                        strokeOpacity: 1,
                        fillOpacity: 0.25,
                        strokeColor: tier === "primary" ? "#1a73e8" : "#34a853",
                        fillColor: tier === "primary" ? "#1a73e8" : "#34a853",
                    };
                });

                mapRef.current.data.addListener("click", (e: google.maps.Data.MouseEvent) => {
                    const zip = e.feature.getProperty("zip");
                    infoRef.current?.setContent(`<strong>ZIP ${zip}</strong>`);
                    infoRef.current?.setPosition(e.latLng);
                    infoRef.current?.open({ map: mapRef.current! });
                });
            }

            renderGeoJson(mapRef.current, geoJson);
        })();
    }, [geoJson]);

    function walkGeometry(
        geometry: google.maps.Data.Geometry,
        cb: (latLng: google.maps.LatLng) => void
    ) {
        const type = geometry.getType();

        if (type === "Point") {
            cb((geometry as google.maps.Data.Point).get());
            return;
        }

        if (type === "LineString" || type === "LinearRing") {
            (geometry as google.maps.Data.LineString).getArray().forEach(cb);
            return;
        }

        // Polygon / MultiPolygon / GeometryCollection
        (geometry as any).getArray().forEach((g: google.maps.Data.Geometry) =>
            walkGeometry(g, cb)
        );
    }

    function renderGeoJson(map: google.maps.Map, fc: ZipFeatureCollection) {
        map.data.forEach((f) => map.data.remove(f));
        map.data.addGeoJson(fc);

        const bounds = new google.maps.LatLngBounds();
        let hasAny = false;

        map.data.forEach((feature) => {
            const geom = feature.getGeometry();
            if (!geom) return;
            hasAny = true;
            walkGeometry(geom, (latLng) => bounds.extend(latLng));
        });

        if (hasAny) map.fitBounds(bounds);
    }


    const buildSchema = z.object({
        state: z.string().min(2, "Please select a state."),
        zip_codes: z.array(z.string()).min(1, "Please select at least one zip code."),
    });

    const form = useForm<z.infer<typeof buildSchema>>({
        resolver: zodResolver(buildSchema),
        defaultValues: {
            state: "",
            zip_codes: [],
        }
    });

    function toggle(opt: string) {
        const exists = selectedZipsList.includes(opt);
        let newValues: string[] = [];
        if (exists) {
            newValues = selectedZipsList.filter(v => v !== opt);
        } else {
            newValues = [...selectedZipsList, opt];
        }
        setSelectedZipsList(newValues);
        form.setValue("zip_codes", newValues);
    }

    function remove(val: string) {
        let newValues: string[] = [];
        newValues = selectedZipsList.filter(v => v !== val);
        setSelectedZipsList(newValues);
        form.setValue("zip_codes", newValues);
    }

    async function updateZipCodes(state: string) {
        form.setValue("state", state);
        setSelectedZipsList([]);
        setFullZipsList([]);
        setZipsLoading(true);

        const response = await getZipCodesFromState(state);

        setFullZipsList(response.data);
        setStatesOpen(false);
        setZipsLoading(false);
    }

    async function getGeoJsonZipCodeData(data: z.infer<typeof buildSchema>) {
        setPending(true);
        const response = await getGeoJSONFromZips(data.state, data.zip_codes);
        if(response.status) {
            setGeoJson(response.data as ZipFeatureCollection);
        } else {
            toast.error(response.message);
        }
        setPending(false);
    }

    function downloadTextFile(opts: {
        filename: string;
        text: string;
        mime?: string;
    }) {
        const { filename, text, mime = "application/geo+json;charset=utf-8" } = opts;
        const blob = new Blob([text], { type: mime });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();

        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    function downloadGeoJson(featureCollection: unknown, filenameBase: string) {
        const text = JSON.stringify(featureCollection, null, 2);
        downloadTextFile({ filename: `${filenameBase}.geojson`, text });
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            <form id="color-generator-form" onSubmit={form.handleSubmit(getGeoJsonZipCodeData, () => {
                toast.error("One or more errors need your attention.")
            })}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start lg:items-center justify-between w-full">
                    <ToolsCard>
                        <ToolsCardTitle>Select State</ToolsCardTitle>
                        <ToolsCardContent>
                            <Controller
                                name="state"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <Popover open={statesOpen} onOpenChange={setStatesOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={statesOpen}
                                                    aria-invalid={fieldState.invalid}
                                                    className={cn("grow justify-between mb-2 rounded-none border-0 border-b-2 max-w-full", {"border-destructive": fieldState.invalid}, {"border-green-500": !fieldState.invalid && field.value})}
                                                >
                                                    {field.value === "" ? "Select a state..." : statesList.find((state) => state.abbreviation === field.value)?.name}
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
                                                        placeholder="Search states..."
                                                        value={statesSearch}
                                                        onValueChange={setStatesSearch}
                                                        className="w-full"
                                                    />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            No states found.
                                                        </CommandEmpty>

                                                        <CommandGroup className="max-h-48 overflow-y-auto">
                                                            {statesList.map((state) => (
                                                                <CommandItem
                                                                    key={state.abbreviation}
                                                                    value={state.abbreviation}
                                                                    onSelect={updateZipCodes}
                                                                    className="w-full"
                                                                >
                                                                    <CheckIcon className={cn("mr-2 h-4 w-4", field.value === state.abbreviation ? "opacity-100" : "opacity-0")} />
                                                                    <div className="min-w-0">
                                                                        <div className="truncate">{state.name}</div>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </Field>
                                )}
                            />
                        </ToolsCardContent>
                    </ToolsCard>
                    <ToolsCard>
                        <ToolsCardTitle>Select Zip Code(s)</ToolsCardTitle>
                        <ToolsCardContent>
                            {selectedZipsList.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {selectedZipsList.map((v) => (
                                        <Badge key={v} variant="secondary" className="gap-1">
                                            <span className="max-w-60 truncate">{v}</span>
                                            <button
                                                type="button"
                                                className="ml-1 rounded-sm opacity-70 hover:opacity-100"
                                                onClick={() => remove(v)}
                                                aria-label={`Remove ${v}`}
                                            >
                                                <XIcon className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            <Controller
                                name="zip_codes"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <Popover open={zipsOpen} onOpenChange={setZipsOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={statesOpen}
                                                    aria-invalid={fieldState.invalid}
                                                    className={cn("grow justify-between mb-2 rounded-none border-0 border-b-2 max-w-full", {"border-destructive": fieldState.invalid}, {"border-green-500": !fieldState.invalid && field.value})}
                                                >
                                                    <span className="truncate">
                                                        {selectedZipsList.length === 0 ? 'No zip codes selected.' : `${selectedZipsList.length} selected`}
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
                                                    <CommandInput
                                                        placeholder="Search zip codes..."
                                                        value={zipSearch}
                                                        onValueChange={setZipSearch}
                                                        className="w-full"
                                                    />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            {zipsLoading ? "Loading…" : "No zip codes found."}
                                                        </CommandEmpty>

                                                        <CommandGroup className="max-h-48 overflow-y-auto">
                                                            {fullZipsList.map((zip) => (
                                                                <CommandItem
                                                                    key={zip}
                                                                    value={zip}
                                                                    onSelect={() => toggle(zip)}
                                                                    className="w-full"
                                                                >
                                                                    <CheckIcon className={cn("mr-2 h-4 w-4", field.value.includes(zip) ? "opacity-100" : "opacity-0")} />
                                                                    <div className="min-w-0">
                                                                        <div className="truncate">{zip}</div>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </Field>
                                )}
                            />
                        </ToolsCardContent>
                    </ToolsCard>
                    <ToolsCard>
                        <ToolsCardTitle>Generate GeoJSON</ToolsCardTitle>
                        <ToolsCardContent>
                            <Button
                                className="cursor-pointer"
                                type="submit"
                                size="lg"
                                disabled={pending}
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
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                <ToolsCard>
                    <ToolsCardTitle className="border-l-blue-500">Map</ToolsCardTitle>
                    <ToolsCardContent>
                        <div ref={mapDivRef} className="w-full min-h-90 md:min-h-105" />
                    </ToolsCardContent>
                </ToolsCard>
                <ToolsCard>
                    <ToolsCardTitle className="border-l-blue-500">Download GeoJSON</ToolsCardTitle>
                    <ToolsCardContent>
                        <Button
                            className="cursor-pointer"
                            type="button"
                            size="lg"
                            disabled={!geoJson}
                            onClick={() => downloadGeoJson(geoJson, `service-area-${form.getValues("state") ?? "state"}`)}
                        >
                            Download GeoJSON
                        </Button>
                    </ToolsCardContent>
                </ToolsCard>
            </div>
        </div>
    );
}