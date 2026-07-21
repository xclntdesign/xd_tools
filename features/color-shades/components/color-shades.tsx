"use client";

import { ToolsCard, ToolsCardContent, ToolsCardTitle } from "@/components/tools-card";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import chroma from "chroma-js";
import { LoaderCircleIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import css from "react-syntax-highlighter/dist/esm/languages/hljs/css";
import { dark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import slugify from "slugify";
import { toast } from "sonner";
import z from "zod";

SyntaxHighlighter.registerLanguage('css', css);

export function ColorShadesComponent() {
    const [pending, setPending] = useState(false);

    const [colors, setColors] = useState<[number, number, number][]>([]);
    const [hexList, setHexList] = useState<string[]>([]);
    const [rgbList, setRgbList] = useState<string[]>([]);

    const differenceAmount = 16.666667;

    let tints: number[] = [];
    for(let count = 5; count > 0; count--) {
        tints.push((differenceAmount * count) / 100);
    }

    let shades: number[] = [];
    for(let count = 1; count < 6; count++) {
        shades.push((differenceAmount * count) / 100);
    }

    const colorNumbers: number[] = [50,100,200,300,400,500,600,700,800,900,950];

    const cssOutput = useMemo(() => {
        if (!rgbList.length && !hexList.length) return "";

        return `:root {\n  ${rgbList.join("\n  ")}\n  ${hexList.join("\n  ")}\n}`;
    }, [rgbList, hexList]);

    const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

    // Strictly matches "r,g,b" (exactly 3 numbers), with optional spaces
    const RGB_RE = /^\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*$/;

    const ColorDefinition = z
        .string()
        .trim()
        .superRefine((v, ctx) => {
            if (HEX_RE.test(v)) return;

            const m = v.match(RGB_RE);
            if (!m) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Color must be hex (#RGB/#RRGGBB) or RGB as 'r,g,b'",
            });
            return;
            }

            const r = Number(m[1]);
            const g = Number(m[2]);
            const b = Number(m[3]);

            // Range check
            if (r > 255 || g > 255 || b > 255) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "RGB values must be between 0 and 255",
            });
            }
        })
        .transform((v) => {
            // Fail closed: only transform if it matches one of the two shapes
            if (HEX_RE.test(v)) return chroma(v).hex();

            const m = v.match(RGB_RE);
            if (!m) {
            // This should never happen if you only call `.parse()`,
            // but it prevents "undefined behavior" if something slips through.
            throw new Error("Invalid color format");
            }

            const r = Number(m[1]);
            const g = Number(m[2]);
            const b = Number(m[3]);

            return chroma(r, g, b).hex();
        });

    const generatorSchema = z.object({
        colorName: z.string().trim().min(1, "Please enter a color name."),
        colorDefinition: ColorDefinition,
    });

    const form = useForm<z.infer<typeof generatorSchema>>({
        resolver: zodResolver(generatorSchema),
        defaultValues: {
            colorName: "",
            colorDefinition: "",
        }
    });

    function generateColors(data: z.infer<typeof generatorSchema>) {
        setPending(true);

        setHexList([]);
        setRgbList([]);
        setColors([]);

        const cD = data.colorDefinition;
        const cN = data.colorName;

        let localColors: [number, number, number][] = [];
        let localRgbList: string[] = [];
        let localHexList: string[] = [];

        tints.forEach((tint) => {
            const color = chroma(cD).tint(tint);
            localColors.push(color.rgb());
        });

        localColors.push(chroma(cD).rgb());

        shades.forEach((shade) => {
            const color = chroma(cD).darken(shade);
            localColors.push(color.rgb());
        });

        const slug = slugify(cN, { lower: true, strict: true, locale: "en" });

        localColors.forEach((color, index) => {
            const rgbString = `--${slug}-${colorNumbers[index]}-rgb: `;
            const hexString = `--${slug}-${colorNumbers[index]}: `;

            localRgbList.push(rgbString + color[0] + ", " + color[1] + ", " + color[2] + ";");
            localHexList.push(hexString + chroma(color).hex() + ";");
        });

        setColors(localColors);
        setRgbList(localRgbList);
        setHexList(localHexList);
        setPending(false);
    }

    async function copyToClipboard() {
        try {
            await navigator.clipboard.writeText(cssOutput);
            toast.success("Copied to clipboard!")
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement("textarea");
            textarea.value = cssOutput;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            toast.success("Copied to clipboard!")
        }
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            <form id="color-generator-form" onSubmit={form.handleSubmit(generateColors, () => {
                toast.error("One or more errors need your attention.")
            })}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start lg:items-center justify-between w-full">
                    <ToolsCard>
                        <ToolsCardTitle>Color Name</ToolsCardTitle>
                        <ToolsCardContent>
                            <Controller
                                name="colorName"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <Input
                                            {...field}
                                            aria-invalid={fieldState.invalid}
                                            className={cn("max-w-full mb-2 rounded-none border-0 border-b-2", {"border-destructive": fieldState.invalid}, {"border-green-500": !fieldState.invalid && field.value})}
                                        />
                                        <FieldDescription>
                                            Give this color a name.
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
                        <ToolsCardTitle>Color Definition</ToolsCardTitle>
                        <ToolsCardContent>
                            <Controller
                                name="colorDefinition"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <Input
                                            {...field}
                                            aria-invalid={fieldState.invalid}
                                            className={cn("max-w-full mb-2 rounded-none border-0 border-b-2", {"border-destructive": fieldState.invalid},{"border-green-500": !fieldState.invalid && field.value})}
                                        />
                                        <FieldDescription>
                                            Define your color. For RGB use the <span className="text-black dark:text-white">255, 255, 255</span> format. For HEX use the <span className="text-black dark:text-white">#FFFFFF</span> format.
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
                        <ToolsCardTitle>Generate CSS</ToolsCardTitle>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <ToolsCard>
                    <ToolsCardTitle className="border-l-blue-500">Colors</ToolsCardTitle>
                    <ToolsCardContent>
                        <div className="flex flex-row flex-wrap gap-6">
                            {colors.map((color, index) => (
                                <Tooltip key={index}>
                                    <TooltipTrigger>
                                        <div className="p-8 aspect-square rounded-lg mb-2" style={{ backgroundColor: chroma(color).hex() }} />
                                        <span>{colorNumbers[index]}</span>
                                    </TooltipTrigger>
                                    <TooltipContent className="font-semibold text-center">
                                        RGB: {color[0]}, {color[1]}, {color[2]}
                                        <br />
                                        HEX: {chroma(color).hex()}
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    </ToolsCardContent>
                </ToolsCard>
                <ToolsCard>
                    <ToolsCardTitle className="border-l-blue-500">CSS</ToolsCardTitle>
                    <ToolsCardContent>
                        <div className="flex flex-col gap-2 mb-4">
                            <SyntaxHighlighter language="css" style={dark}>
                                {cssOutput}
                            </SyntaxHighlighter>
                        </div>
                        <div className="flex flex-row justify-end">
                            <Button
                                type="button"
                                size="lg"
                                className="cursor-pointer"
                                onClick={copyToClipboard}
                            >
                                Copy CSS
                            </Button>
                        </div>
                    </ToolsCardContent>
                </ToolsCard>
            </div>
        </div>
    );
}