"use client";

import { ToolsCard, ToolsCardContent, ToolsCardTitle } from "@/components/tools-card";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircleIcon } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import css from "react-syntax-highlighter/dist/esm/languages/hljs/css";
import { dark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { toast } from "sonner";
import z from "zod";
import { generateCriticalCssAction } from "../actions/generate-critical-css";

SyntaxHighlighter.registerLanguage('css', css);

export function CriticalCSSComponent() {
    const elRef = useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = useState(0);

    const [pending, setPending] = useState(false);

    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [desktopCss, setDesktopCss] = useState("");
    const [mobileCss, setMobileCss] = useState("");

    const generatorSchema = z.object({
        url: z.url().min(1, "Please enter a URL."),
    });

    const form = useForm<z.infer<typeof generatorSchema>>({
        resolver: zodResolver(generatorSchema),
        defaultValues: {
            url: "",
        }
    });

    async function generateCriticalCss(data: z.infer<typeof generatorSchema>) {
        setPending(true);
        
        const response = await generateCriticalCssAction(data);
        if(response.status) {
            setDesktopCss(response.desktop);
            setMobileCss(response.mobile);
        } else {
            setErrorMessage(response.message);
            setShowError(true);
        }

        setPending(false);
    }

    async function copyToClipboard(type: "desktop" | "mobile") {
        const css = type === "desktop" ? desktopCss : mobileCss;
        try {
            await navigator.clipboard.writeText(css);
            toast.success("Copied to clipboard!")
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement("textarea");
            textarea.value = css;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            toast.success("Copied to clipboard!")
        }
    }

    useLayoutEffect(() => {
        if (!elRef.current) return;

        const el = elRef.current;

        const update = () => setWidth(el.offsetWidth);
        update();

        const ro = new ResizeObserver(() => update());
        ro.observe(el);

        return () => ro.disconnect();
    }, []);

    return (
        <div className="flex flex-col gap-4 w-full">
            <form id="color-generator-form" onSubmit={form.handleSubmit(generateCriticalCss, () => {
                toast.error("One or more errors need your attention.")
            })}>
                <div className="grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-8 items-start lg:items-center justify-between w-full">
                    <ToolsCard>
                        <ToolsCardTitle>Website URL</ToolsCardTitle>
                        <ToolsCardContent>
                            <Controller
                                name="url"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <Input
                                            {...field}
                                            aria-invalid={fieldState.invalid}
                                            className={cn("max-w-full mb-2 rounded-none border-0 border-b-2", {"border-destructive": fieldState.invalid}, {"border-green-500": !fieldState.invalid && field.value})}
                                        />
                                        <FieldDescription>
                                            Please enter a complete URL to scan.
                                        </FieldDescription>
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                        </ToolsCardContent>
                    </ToolsCard>
                    <ToolsCard>
                        <ToolsCardTitle>Generate Critical CSS</ToolsCardTitle>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <ToolsCard>
                        <ToolsCardTitle className="border-l-blue-500">Desktop CSS</ToolsCardTitle>
                        <ToolsCardContent>
                            <div className="flex flex-col gap-2 mb-4">
                                <ScrollArea className="h-[65vh] w-full border whitespace-pre-wrap" ref={elRef}>
                                    <SyntaxHighlighter language="css" style={dark} wrapLongLines={true} customStyle={{ width: `${width}px` }} >
                                        {desktopCss}
                                    </SyntaxHighlighter>
                                </ScrollArea>
                            </div>
                            <div className="flex flex-row justify-end">
                                <Button
                                    type="button"
                                    size="lg"
                                    className="cursor-pointer"
                                    onClick={() => copyToClipboard("desktop")}
                                >
                                    Copy CSS
                                </Button>
                            </div>
                        </ToolsCardContent>
                    </ToolsCard>
                    <ToolsCard>
                        <ToolsCardTitle className="border-l-blue-500">Mobile CSS</ToolsCardTitle>
                        <ToolsCardContent>
                            <div className="flex flex-col gap-2 mb-4">
                                <ScrollArea className="h-[65vh] w-full border whitespace-pre-wrap">
                                    <SyntaxHighlighter language="css" style={dark} wrapLongLines={true} customStyle={{ width: `${width}px` }}>
                                        {mobileCss}
                                    </SyntaxHighlighter>
                                </ScrollArea>
                            </div>
                            <div className="flex flex-row justify-end">
                                <Button
                                    type="button"
                                    size="lg"
                                    className="cursor-pointer"
                                    onClick={() => copyToClipboard("mobile")}
                                >
                                    Copy CSS
                                </Button>
                            </div>
                        </ToolsCardContent>
                    </ToolsCard>
                </div>
            </form>
        </div>
    );
}