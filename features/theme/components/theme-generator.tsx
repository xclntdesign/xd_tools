"use client";

import { ToolsCard, ToolsCardContent, ToolsCardTitle } from "@/components/tools-card";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircleIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import SyntaxHighlighter from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { toast } from "sonner";
import z from "zod";
import { generateTheme, generateThemeCssOutputs } from "../utils";

function ThemeGeneratorComponent() {
    const [pending, setPending] = useState(false);
    const [cssOutput, setCssOutput] = useState("");
    const [tailwindOutput, setTailwindOutput] = useState("");
    const [bootstrapOutput, setBootstrapOutput] = useState("");

    const hexColorRegex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;

    const generatorSchema = z.object({
        primaryColor: z.string().regex(hexColorRegex, {
            message: "Invalid hex color code",
        }),
        secondaryColor: z.string().optional().or(z.string().regex(hexColorRegex, {
            message: "Invalid hex color code",
        })),
        tertiaryColor: z.string().optional().or(z.string().regex(hexColorRegex, {
            message: "Invalid hex color code",
        })),
    });

    const form = useForm<z.infer<typeof generatorSchema>>({
        resolver: zodResolver(generatorSchema),
        defaultValues: {
            primaryColor: "",
            secondaryColor: "",
            tertiaryColor: ""
        }
    });

    async function generateThemeColors(data: z.infer<typeof generatorSchema>) {
        setPending(true);
        try {
            const colors: string[] = [];
            colors.push(data.primaryColor);
            if(data.secondaryColor) {
                colors.push(data.secondaryColor);
            }
            if(data.tertiaryColor) {
                colors.push(data.tertiaryColor);
            }

            const theme = generateTheme(colors);

            const outputs = generateThemeCssOutputs(theme);

            setCssOutput(outputs.rootVariables);
            setTailwindOutput(outputs.tailwindVariables);
            setBootstrapOutput(outputs.bootstrapOverrides);
        } catch (err: any) {
            toast.error(err.message || "Failed to generate theme colors.");
        } finally {
            setPending(false);
        }
    }

    async function copyToClipboard(stringToCopy: string) {
        try {
            await navigator.clipboard.writeText(stringToCopy);
            toast.success("Copied to clipboard!")
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement("textarea");
            textarea.value = stringToCopy;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            toast.success("Copied to clipboard!")
        }
    }

    const [primaryColor, setPrimaryColor] = useState("");
    const [secondaryColor, setSecondaryColor] = useState("");
    const [tertiaryColor, setTertiaryColor] = useState("");
    function changeColorPreview(colorType: "primary" | "secondary" | "tertiary", color: string) {
        if(colorType === "primary") {
            if(color.length > 3) {
                setPrimaryColor(color);
            }
            form.setValue('primaryColor', color);
        } else if(colorType === "secondary") {
            if(color.length > 3) {
                setSecondaryColor(color);
            }
            form.setValue('secondaryColor', color);
        } else if(colorType === "tertiary") {
            if(color.length > 3) {
                setTertiaryColor(color);
            }
            form.setValue('tertiaryColor', color);
        }
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            <form id="color-generator-form" onSubmit={form.handleSubmit(generateThemeColors, () => {
                toast.error("One or more errors need your attention.")
            })}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 items-start">
                    <ToolsCard>
                        <ToolsCardTitle>Colors</ToolsCardTitle>
                        <ToolsCardContent>
                            <div className="flex flex-col gap-6 mb-4">
                                <Controller
                                    name="primaryColor"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <div className="flex flex-row items-center justify-between">
                                                <FieldLabel htmlFor="primaryColor">Primary Color:</FieldLabel>
                                                <em className="text-muted-foreground text-sm">required</em>
                                            </div>
                                            <div className="flex flex-row gap-4 items-center">
                                                <Input
                                                    {...field}
                                                    placeholder="Hex value (#000000, #fff, etc)"
                                                    aria-invalid={fieldState.invalid}
                                                    className={cn("max-w-full rounded-none border-0 border-b-2", {"border-destructive": fieldState.invalid}, {"border-green-500": !fieldState.invalid && field.value})}
                                                    onChange={(e) => changeColorPreview("primary", e.target.value)}
                                                />
                                                <div
                                                    className="block w-6 h-6"
                                                    style={{ backgroundColor: primaryColor }}
                                                />
                                            </div>
                                            {fieldState.invalid && (
                                                <FieldError errors={[fieldState.error]} />
                                            )}
                                        </Field>
                                    )}
                                />
                                <Controller
                                    name="secondaryColor"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <div className="flex flex-row items-center justify-between">
                                                <FieldLabel htmlFor="primaryColor">Secondary Color:</FieldLabel>
                                                <em className="text-muted-foreground text-sm">optional</em>
                                            </div>
                                            <div className="flex flex-row gap-4 items-center">
                                                <Input
                                                    {...field}
                                                    placeholder="Hex value (#000000, #fff, etc)"
                                                    aria-invalid={fieldState.invalid}
                                                    className={cn("max-w-full rounded-none border-0 border-b-2", {"border-destructive": fieldState.invalid}, {"border-green-500": !fieldState.invalid && field.value})}
                                                    onChange={(e) => changeColorPreview("secondary", e.target.value)}
                                                />
                                                <div
                                                    className="block w-6 h-6"
                                                    style={{ backgroundColor: secondaryColor }}
                                                />
                                            </div>
                                            {fieldState.invalid && (
                                                <FieldError errors={[fieldState.error]} />
                                            )}
                                        </Field>
                                    )}
                                />
                                <Controller
                                    name="tertiaryColor"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <div className="flex flex-row items-center justify-between">
                                                <FieldLabel htmlFor="primaryColor">Tertiary Color:</FieldLabel>
                                                <em className="text-muted-foreground text-sm">optional</em>
                                            </div>
                                            <div className="flex flex-row gap-4 items-center">
                                                <Input
                                                    {...field}
                                                    placeholder="Hex value (#000000, #fff, etc)"
                                                    aria-invalid={fieldState.invalid}
                                                    className={cn("max-w-full rounded-none border-0 border-b-2", {"border-destructive": fieldState.invalid}, {"border-green-500": !fieldState.invalid && field.value})}
                                                    onChange={(e) => changeColorPreview("tertiary", e.target.value)}
                                                />
                                                <div
                                                    className="block w-6 h-6"
                                                    style={{ backgroundColor: tertiaryColor }}
                                                />
                                            </div>
                                            {fieldState.invalid && (
                                                <FieldError errors={[fieldState.error]} />
                                            )}
                                        </Field>
                                    )}
                                />
                            </div>
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
                    <ToolsCard>
                        <ToolsCardTitle className="border-l-blue-500">CSS Variables</ToolsCardTitle>
                        <ToolsCardContent>
                            <div className="flex flex-col gap-2 mb-4">
                                <ScrollArea className="h-72 w-full rounded-md border bg-[rgb(68,68,68)]">
                                    <SyntaxHighlighter language="css" style={dark}>
                                        {cssOutput}
                                    </SyntaxHighlighter>
                                </ScrollArea>
                            </div>
                            <div className="flex flex-row justify-end">
                                <Button
                                    type="button"
                                    size="lg"
                                    className="cursor-pointer"
                                    onClick={() => copyToClipboard(cssOutput)}
                                >
                                    Copy CSS
                                </Button>
                            </div>
                        </ToolsCardContent>
                    </ToolsCard>
                    <ToolsCard>
                        <ToolsCardTitle className="border-l-blue-500">Tailwind Variables</ToolsCardTitle>
                        <ToolsCardContent>
                            <div className="flex flex-col gap-2 mb-4">
                                <ScrollArea className="h-72 w-full rounded-md border bg-[rgb(68,68,68)]">
                                    <SyntaxHighlighter language="css" style={dark}>
                                        {tailwindOutput}
                                    </SyntaxHighlighter>
                                </ScrollArea>
                            </div>
                            <div className="flex flex-row justify-end">
                                <Button
                                    type="button"
                                    size="lg"
                                    className="cursor-pointer"
                                    onClick={() => copyToClipboard(tailwindOutput)}
                                >
                                    Copy CSS
                                </Button>
                            </div>
                        </ToolsCardContent>
                    </ToolsCard>
                    <ToolsCard>
                        <ToolsCardTitle className="border-l-blue-500">Bootstrap Overrides</ToolsCardTitle>
                        <ToolsCardContent>
                            <div className="flex flex-col gap-2 mb-4">
                                <ScrollArea className="h-72 w-full rounded-md border bg-[rgb(68,68,68)]">
                                    <SyntaxHighlighter language="css" style={dark}>
                                        {bootstrapOutput}
                                    </SyntaxHighlighter>
                                </ScrollArea>
                            </div>
                            <div className="flex flex-row justify-end">
                                <Button
                                    type="button"
                                    size="lg"
                                    className="cursor-pointer"
                                    onClick={() => copyToClipboard(bootstrapOutput)}
                                >
                                    Copy CSS
                                </Button>
                            </div>
                        </ToolsCardContent>
                    </ToolsCard>
                </div>
            </form>
        </div>
    )
}

export { ThemeGeneratorComponent };

