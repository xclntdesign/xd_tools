"use client";

import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone";
import { ToolsCard, ToolsCardContent, ToolsCardTitle } from "@/components/tools-card";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { cn, formatBytes } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { DownloadIcon, LoaderCircleIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { deleteUploadedImages } from "../actions/delete-uploads";
import { optimizeImagesAction } from "../actions/optimize-images";

const baseUploadUrl = "https://txwgoibxugopyxpzutqp.supabase.co/storage/v1/object/public/optimization/";

type ImageOptimizerRequest = {
    input_urls: string[],
    strategy: "exact" | "portrait" | "landscape" | "auto" | "fit" | "crop" | "square" | "fill" | "none";
    formats: Array<"jpg" | "png" | "webp" | "gif">;
    width?: number;
    height?: number;
}

export type ImageFormat = "jpg" | "png" | "webp" | "gif" | "avif";
export const ALL_FORMATS = ["jpg", "png", "webp", "gif", "avif"] as const;

export type StrategyOptions = "exact" | "portrait" | "landscape" | "auto" | "fit" | "crop" | "square" | "fill" | "none";

export type OptimizedImageVariant = {
  filesize: number;
  url: string;
  width: number;
  height: number;
};

export type OriginalInfo = {
  filesize: number;
  url: string;
  mime: string;
};

export type ImageResultEntry = {
  original: OriginalInfo;
  resized: Partial<Record<ImageFormat, OptimizedImageVariant>>;
};

export type ImageOptimizerResponse = {
  status: boolean;
  message: string;
  data: Record<string, ImageResultEntry> & { archive?: string };
};

type UiFileItem = {
  filename: string;
  originalUrl: string;

  originalSize?: number; // set from File.size if you captured it on select
  status: string;
  error?: string;

  resized?: Partial<Record<ImageFormat, OptimizedImageVariant>>;
};

export const strategyOptions = ["exact","portrait","landscape","auto","fit","crop","square","fill","none"];
const sortedStrategyOptions = strategyOptions.sort((a, b) => {
    if(a > b) return 1;
    if(a < b) return -1;
    return 0;
});

export function ImageOptimizerComponent() {
    const [pending, setPending] = useState(false);
    const [widthDisabled, setWidthDisabled] = useState(false);
    const [heightDisabled, setHeightDisabled] = useState(false);

    const [items, setItems] = useState<UiFileItem[]>([]);
    const processedRef = useRef<Set<string>>(new Set());
    const [archiveUrls, setArchiveUrls] = useState<string[]>([]);

    const imageOptimizerRequestSchema = z.object({
        input_urls: z.array(z.string().url()).min(1, "Add at least one image URL"),

        strategy: z.enum(strategyOptions),

        formats: z.array(z.enum(["jpg", "png", "webp", "gif", "avif"]))
            .min(1, "Select at least one format")
            .refine((vals) => new Set(vals).size === vals.length, "Formats must be unique"),

        // ✅ required, ends up as number always
        width: z
            .string(),

        height: z
            .string(),
        });

    const form = useForm<z.infer<typeof imageOptimizerRequestSchema>>({
        resolver: zodResolver(imageOptimizerRequestSchema),
        defaultValues: {
            input_urls: [],
            strategy: "auto",
            formats: ["jpg"],
            width: "0",
            height: "0",
        }
    });

    const props = useSupabaseUpload({
        bucketName: 'optimization',
        path: '',
        allowedMimeTypes: ['image/*'],
        maxFiles: 15,
        maxFileSize: 1000 * 1000 * 15, // 15MB,
        upsert: true,
    });

    useEffect(() => {
        if(!props.isSuccess) return;
        
        const newFilenames = props.successes.filter((fn) => {
            if (processedRef.current.has(fn)) return false;
            processedRef.current.add(fn);
            return true;
        });

        if (newFilenames.length === 0) return;

        setItems((prev) => [
            ...prev,
            ...newFilenames.map((filename) => ({
                filename,
                originalUrl: baseUploadUrl + filename,
                status: "uploaded",
            })),
        ]);

        const newUrls = newFilenames.map((fn) => baseUploadUrl + fn);

        const prevUrls = form.getValues("input_urls") ?? [];
        form.setValue("input_urls", [...prevUrls, ...newUrls], { shouldValidate: true });
    }, [props.isSuccess, props.successes]);

    function chunk<T>(arr: T[], size: number) {
        const out: T[][] = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
    }

    async function optimizeAll(values: z.infer<typeof imageOptimizerRequestSchema>) {
        const input_urls = values.input_urls?.length ? values.input_urls : items.map((i) => i.originalUrl);
        if (!input_urls.length) return;
        
        setPending(true);
        setArchiveUrls([]);
        
        // mark processing only for the ones we're sending
        const urlSet = new Set(input_urls);
        setItems((prev) =>
            prev.map((i) =>
                urlSet.has(i.originalUrl)
                    ? { ...i, status: "processing", error: undefined }
                    : i
                )
            );

        try {
            const chunks = chunk(input_urls, 5);

            for (const urls of chunks) {
                const res: ImageOptimizerResponse = await optimizeImagesAction({
                    ...values,
                    input_urls: urls,
                });

                // collect archive (one per chunk typically)
                const archive = res.data?.archive;
                if (archive) setArchiveUrls((prev) => [...prev, archive]);

                // merge resized results into items
                setItems((prev) =>
                    prev.map((item) => {
                        // only try to update items that were in THIS chunk
                        if (!urls.includes(item.originalUrl)) return item;

                        const entry = res.data?.[item.originalUrl];
                        if (!entry) {
                            // chunk processed but no result for this url
                            return {
                                ...item,
                                status: "error",
                                error: res.message || "No optimization result returned",
                            };
                        }

                        if (!res.status) {
                            return {
                                ...item,
                                status: "error",
                                error: res.message || "Optimization failed",
                            };
                        }

                        return {
                            ...item,
                            status: "done",
                            originalSize: entry.original.filesize,
                            resized: entry.resized,
                        };
                    })
                );
            }
        } catch (err: any) {
            setItems((prev) =>
                prev.map((i) =>
                    i.status === "processing"
                    ? { ...i, status: "error", error: err?.message ?? "Error" }
                    : i
                )
            );
        } finally {
            const filenames = items.map((i) => i.filename);
            await deleteUploadedImages(filenames);
            setPending(false);
        }
    }

    function updateWidthAndHeight(value: string) {
        form.setValue("strategy", value);

        switch(value) {
            case "auto":
            case "exact":
            case "fit":
            case "crop":
            case "fill":
                setWidthDisabled(false);
                setHeightDisabled(false);
                break;
            case "portrait":
                setWidthDisabled(true);
                setHeightDisabled(false);
                break;
            case "landscape":
            case "square":
                setWidthDisabled(false);
                setHeightDisabled(true);
                break;
            case "none":
                setWidthDisabled(true);
                setHeightDisabled(true);
                break;
        }
    }

    function resetAll() {
        form.reset();
        setItems([]);
        setArchiveUrls([]);
        processedRef.current.clear();
        props.reset();
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            <form id="color-generator-form" onSubmit={form.handleSubmit(optimizeAll, () => {
                toast.error("One or more errors need your attention.")
            })}>
                <div className="grid grid-cols-[2fr_1fr_1fr] gap-8 items-start lg:items-center justify-between w-full">
                    <ToolsCard>
                        <ToolsCardTitle>Upload Images</ToolsCardTitle>
                        <ToolsCardContent>
                            <Controller
                                name="input_urls"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <Dropzone {...props} className={cn("bg-input/20 max-w-full mb-2 rounded-none border-0 border-b-2 border-solid! border-transparent!", {"border-destructive": fieldState.invalid}, {"border-green-500": !fieldState.invalid && field.value})}>
                                            <DropzoneEmptyState />
                                            <DropzoneContent />
                                        </Dropzone>
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                        </ToolsCardContent>
                    </ToolsCard>
                    <ToolsCard>
                        <ToolsCardTitle>Output Settings</ToolsCardTitle>
                        <ToolsCardContent className="space-y-8">
                            <Controller
                                name="strategy"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid} orientation="responsive">
                                        <FieldLabel>Strategy</FieldLabel>
                                        <Select
                                            name={field.name}
                                            value={field.value}
                                            onValueChange={(value) => {
                                                updateWidthAndHeight(value);
                                            }}
                                        >
                                            <SelectTrigger
                                                id="strategy"
                                                aria-invalid={fieldState.invalid}
                                                className={cn("max-w-full mb-2 rounded-none border-0 border-b-2", {"border-destructive": fieldState.invalid}, {"border-green-500": !fieldState.invalid && field.value})}
                                            >
                                                <SelectValue placeholder="Select a strategy" />
                                            </SelectTrigger>
                                            <SelectContent position="item-aligned">
                                                {sortedStrategyOptions.map((option) => (
                                                    <SelectItem
                                                        key={option}
                                                        value={option}
                                                    >{option}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                            <Controller
                                name="formats"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid} orientation="responsive">
                                        <FieldLabel>Formats</FieldLabel>
                                        <div className="flex flex-row flex-wrap gap-6">
                                        {ALL_FORMATS.map((fmt) => {
                                            const isChecked = field.value.includes(fmt);

                                            return (
                                                <div key={fmt} className="flex items-center gap-2">
                                                    <Switch
                                                        checked={isChecked}
                                                        onCheckedChange={(checked) => {
                                                            const current = field.value ?? [];

                                                            if(checked) {
                                                                field.onChange([...current, fmt]);
                                                            } else {
                                                                field.onChange(current.filter((f) => f !== fmt));
                                                            }
                                                        }}
                                                    />
                                                    {fmt.toUpperCase()}
                                                </div>
                                            );
                                        })}
                                        </div>
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                            <div className="flex flex-row gap-4">
                                <Controller
                                    name="width"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid} orientation="responsive">
                                            <FieldLabel>Width</FieldLabel>
                                            <Input
                                                {...field}
                                                type="number"
                                                aria-invalid={fieldState.invalid}
                                                disabled={widthDisabled}
                                                className={cn("max-w-full mb-2 rounded-none border-0 border-b-2", {"border-destructive": fieldState.invalid}, {"border-green-500": !fieldState.invalid && field.value})}
                                            />
                                            {fieldState.invalid && (
                                                <FieldError errors={[fieldState.error]} />
                                            )}
                                        </Field>
                                    )}
                                />
                                <Controller
                                    name="height"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid} orientation="responsive">
                                            <FieldLabel>Height</FieldLabel>
                                            <Input
                                                {...field}
                                                type="number"
                                                aria-invalid={fieldState.invalid}
                                                disabled={heightDisabled}
                                                className={cn("max-w-full mb-2 rounded-none border-0 border-b-2", {"border-destructive": fieldState.invalid}, {"border-green-500": !fieldState.invalid && field.value})}
                                            />
                                            {fieldState.invalid && (
                                                <FieldError errors={[fieldState.error]} />
                                            )}
                                        </Field>
                                    )}
                                />
                            </div>
                        </ToolsCardContent>
                    </ToolsCard>
                    <ToolsCard>
                        <ToolsCardTitle>Optimize Images</ToolsCardTitle>
                        <ToolsCardContent className="flex flex-row gap-4">
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
                            <Button
                                className="cursor-pointer"
                                type="button"
                                size="lg"
                                variant="outline"
                                onClick={resetAll}
                            >
                                Reset
                            </Button>
                        </ToolsCardContent>
                    </ToolsCard>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mt-4">
                    {items.map((item) => {
                        return (
                            <ToolsCard key={item.filename}>
                                <ToolsCardTitle className="border-l-blue-500">Image</ToolsCardTitle>
                                <ToolsCardContent>
                                    <div className="relative w-full aspect-video">
                                        <Image
                                            src={item.originalUrl}
                                            alt={item.filename}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 25vw"
                                        />
                                    </div>
                                    {item.status === "done" && (
                                        <ul className="flex flex-col divide-y divide-gray-200 dark:divide-neutral-700">
                                            <li className="inline-flex items-center gap-x-2 py-3 px-4 text-sm font-medium">
                                                <div className="flex justify-between w-full">
                                                    <span className="text-muted-foreground">Original</span>
                                                    <div className="flex flex-row gap-2">
                                                        <span>{formatBytes(item.originalSize ?? 0)}</span>
                                                        <a href={item.originalUrl} download><DownloadIcon className="size-4" /></a>
                                                    </div>
                                                </div>
                                            </li>
                                            {item.resized && Object.entries(item.resized).map(([format, variant]) => (
                                                <li key={format} className="inline-flex items-center gap-x-2 py-3 px-4 text-sm font-medium">
                                                    <div className="flex justify-between w-full">
                                                        <span className="text-muted-foreground">{format.toUpperCase()}</span>
                                                        <div className="flex flex-row gap-2">
                                                            <span>{formatBytes(variant.filesize)}</span>
                                                            <a href={variant.url} download><DownloadIcon className="size-4" /></a>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </ToolsCardContent>
                            </ToolsCard>
                        );
                    })}
                </div>
                <div className="flex flex-row flex-wrap gap-4 mt-4">
                    {archiveUrls.map((url, index) => (
                        <Button
                            type="button"
                            size="lg"
                            key={url}
                            asChild
                        >
                            <a key={url} href={url} download><DownloadIcon className="size-4" /> Download Group {index + 1} of {archiveUrls.length}</a>
                        </Button>
                        
                    ))}
                </div>
            </form>
        </div>

    );
}