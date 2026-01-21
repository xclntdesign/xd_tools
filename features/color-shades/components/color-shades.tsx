"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import chroma from "chroma-js";
import { useMemo, useState } from "react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import css from "react-syntax-highlighter/dist/esm/languages/hljs/css";
import { dark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import slugify from "slugify";
import { toast } from "sonner";

SyntaxHighlighter.registerLanguage('css', css);

export function ColorShadesComponent() {
    const [colorName, setColorName] = useState("");
    const [colorDefinition, setColorDefinition] = useState("");

    const [colorNameError, setColorNameError] = useState("");
    const [colorDefinitionError, setColorDefinitionError] = useState("");

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

    function generateColors() {
        if(!colorName) {
            setColorNameError("Please enter a color name.");
            return;
        } else {
            setColorNameError("");
        };

        if(!colorDefinition) {
            setColorDefinitionError("Please enter a color definition.");
            return;
        } else {
            setColorDefinitionError("");
        };

        if(!chroma.valid(colorDefinition)) {
            setColorDefinitionError("Invalid color: " + colorDefinition);
            return;
        } else {
            setColorDefinitionError("");
        }

        setHexList([]);
        setRgbList([]);
        setColors([]);

        let localColors: [number, number, number][] = [];
        let localRgbList: string[] = [];
        let localHexList: string[] = [];

        tints.forEach((tint) => {
            const color = chroma(colorDefinition).tint(tint);
            localColors.push(color.rgb());
        });

        localColors.push(chroma(colorDefinition).rgb());

        shades.forEach((shade) => {
            const color = chroma(colorDefinition).darken(shade);
            localColors.push(color.rgb());
        });

        const slug = slugify(colorName, { lower: true, strict: true, locale: "en" });

        localColors.forEach((color, index) => {
            const rgbString = `--${slug}-${colorNumbers[index]}-rgb: `;
            const hexString = `--${slug}-${colorNumbers[index]}: `;

            localRgbList.push(rgbString + color[0] + ", " + color[1] + ", " + color[2]);
            localHexList.push(hexString + chroma(color).hex());
        });

        setColors(localColors);
        setRgbList(localRgbList);
        setHexList(localHexList);
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
        <>
            <div className="flex flex-col mb-3 w-full">
                <Card className="py-2 w-full">
                    <CardContent className="flex flex-col md:flex-row gap-8 items-start lg:items-center justify-between">
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-row items-center gap-2">
                                <span className="text-2xl font-bold">1{`)`}</span>
                                <span className="text-xl font-medium">Color Name</span>
                            </div>
                            <div className="ml-6">
                                <Input
                                    name="colorName"
                                    value={colorName}
                                    onChange={(e) => setColorName(e.target.value)}
                                    className="max-w-full mb-2"
                                />
                                <span className="text-muted-foreground text-sm">Give this color a name.</span>
                                <span className="text-destructive-foreground text-sm">{colorNameError}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-row items-center gap-2">
                                <span className="text-2xl font-bold">2{`)`}</span>
                                <span className="text-xl font-medium">Color Definition</span>
                            </div>
                            <div className="ml-6">
                                <Input
                                    name="colorDefinition"
                                    value={colorDefinition}
                                    onChange={(e) => setColorDefinition(e.target.value)}
                                    className="max-w-full mb-2"
                                />
                                <span className="text-muted-foreground text-sm">Define your color. For RGB use the <span className="text-black dark:text-white">255, 255, 255</span> format. For HEX use the <span className="text-black dark:text-white">#FFFFFF</span> format.</span>
                                <span className="text-destructive-foreground text-sm">{colorDefinitionError}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="ml-6">
                                <Button
                                    className="cursor-pointer"
                                    onClick={generateColors}
                                    type="button"
                                    size="lg"
                                >
                                    Generate
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Card className="py-6 w-full h-full">
                        <CardContent>
                            <div className="flex flex-row items-center mb-4">
                                <span className="text-xl font-medium">Colors</span>
                            </div>
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
                        </CardContent>
                    </Card>
                    <Card className="py-6 w-full h-full">
                        <CardContent>
                            <div className="flex flex-row items-center mb-4">
                                <span className="text-xl font-medium">CSS</span>
                            </div>
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
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}