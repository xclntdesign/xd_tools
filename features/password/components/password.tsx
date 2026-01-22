"use client";

import { ToolsCard, ToolsCardContent, ToolsCardTitle } from "@/components/tools-card";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircleIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { generateEncryptedPasswords } from "../actions/generate-encrypted-passwords";
import { generateSecurePassword } from "../actions/generate-password";

export function PasswordGeneratorComponent() {
    const [pending, setPending] = useState(false);

    const [password, setPassword] = useState("");
    const [v2Password, setV2Password] = useState("");
    const [v4Password, setV4Password] = useState("");

    const generatorSchema = z.object({
        length: z.string(),
        useLowercase: z.boolean(),
        useUppercase: z.boolean(),
        useNumbers: z.boolean(),
        useSymbols: z.boolean(),
    });

    const form = useForm<z.infer<typeof generatorSchema>>({
        resolver: zodResolver(generatorSchema),
        defaultValues: {
            length: "24",
            useLowercase: true,
            useUppercase: true,
            useNumbers: true,
            useSymbols: false,
        }
    });

    async function generatePassword(data: z.infer<typeof generatorSchema>) {
        setPending(true);
        try {
            const pw = generateSecurePassword(parseInt(data.length), {
                lowercase: data.useLowercase,
                uppercase: data.useUppercase,
                numbers: data.useNumbers,
                symbols: data.useSymbols,
            });

            setPassword(pw);

            const encPws = await generateEncryptedPasswords(pw);
            
            setV2Password(encPws.v2);
            setV4Password(encPws.v4);
        } catch (err: any) {
            toast.error(err.message || "Failed to generate password.");
        } finally {
            setPending(false);
        }
    }

    async function copyToClipboard(type: "password" | "v2" | "v4") {
        const pw = type === "password" ? password : (type === "v2" ? v2Password : v4Password);
        try {
            await navigator.clipboard.writeText(pw);
            toast.success("Copied to clipboard!")
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement("textarea");
            textarea.value = pw;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            toast.success("Copied to clipboard!")
        }
    }

    function resetPasswordGenerator() {
        form.reset({
            length: "24",
            useLowercase: true,
            useUppercase: true,
            useNumbers: true,
            useSymbols: false,
        });
        setPassword("");
        setV2Password("");
        setV4Password("");
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            <form id="color-generator-form" onSubmit={form.handleSubmit(generatePassword, () => {
                toast.error("One or more errors need your attention.")
            })}>
                <div className="grid grid-cols-[2fr_1fr] gap-8 items-start lg:items-center justify-between w-full">
                    <ToolsCard>
                        <ToolsCardTitle>Password Options</ToolsCardTitle>
                        <ToolsCardContent className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                            <Controller
                                name="length"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid} orientation="horizontal" className="flex flex-row gap-2 items-start justify-start">
                                        <FieldLabel className="mr-3 mt-3">Length</FieldLabel>
                                        <div className="flex flex-col w-full">
                                            <Input
                                                {...field}
                                                aria-invalid={fieldState.invalid}
                                                className={cn("mb-2 rounded-none border-0 border-b-2 max-w-full", {"border-destructive": fieldState.invalid}, {"border-green-500": !fieldState.invalid && field.value})}
                                            />
                                            {fieldState.invalid && (
                                                <FieldError errors={[fieldState.error]} />
                                            )}
                                        </div>
                                    </Field>
                                )}
                            />
                            <div className="flex flex-col gap-4">
                                <Controller
                                    name="useLowercase"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid} orientation="horizontal">
                                            <Switch
                                                name={field.name}
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                aria-invalid={fieldState.invalid}
                                                className={cn("data-[state=checked]:bg-green-500", {"border-destructive": fieldState.invalid}, {"border-green-500": !fieldState.invalid && field.value})}
                                            />
                                            <FieldContent>
                                                <FieldLabel>Use lowercase <span className="text-muted-foreground">a...z</span></FieldLabel>
                                            </FieldContent>
                                        </Field>
                                    )}
                                />
                                <Controller
                                    name="useUppercase"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid} orientation="horizontal">
                                            <Switch
                                                name={field.name}
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                aria-invalid={fieldState.invalid}
                                                className={cn("data-[state=checked]:bg-green-500", {"border-destructive": fieldState.invalid}, {"border-green-500": !fieldState.invalid && field.value})}
                                            />
                                            <FieldContent>
                                                <FieldLabel>Use uppercase <span className="text-muted-foreground">A...Z</span></FieldLabel>
                                            </FieldContent>
                                        </Field>
                                    )}
                                />
                                <Controller
                                    name="useNumbers"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid} orientation="horizontal">
                                            <Switch
                                                name={field.name}
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                aria-invalid={fieldState.invalid}
                                                className={cn("data-[state=checked]:bg-green-500", {"border-destructive": fieldState.invalid}, {"border-green-500": !fieldState.invalid && field.value})}
                                            />
                                            <FieldContent>
                                                <FieldLabel>Use numbers <span className="text-muted-foreground">0...9</span></FieldLabel>
                                            </FieldContent>
                                        </Field>
                                    )}
                                />
                                <Controller
                                    name="useSymbols"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid} orientation="horizontal">
                                            <Switch
                                                name={field.name}
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                aria-invalid={fieldState.invalid}
                                                className={cn("data-[state=checked]:bg-green-500", {"border-destructive": fieldState.invalid}, {"border-green-500": !fieldState.invalid && field.value})}
                                            />
                                            <FieldContent>
                                                <FieldLabel>Use symbols</FieldLabel>
                                            </FieldContent>
                                        </Field>
                                    )}
                                />
                            </div>
                        </ToolsCardContent>
                    </ToolsCard>
                    <ToolsCard>
                        <ToolsCardTitle>Generate Password</ToolsCardTitle>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                    <ToolsCard>
                        <ToolsCardTitle className="border-l-blue-500">Password</ToolsCardTitle>
                        <ToolsCardContent>
                            <div className="flex flex-col gap-2 mb-4">
                                <Input
                                    name="password"
                                    value={password}
                                    readOnly={true}
                                    className={cn("mb-2 rounded-none border-0 border-b-2 max-w-full")}
                                />
                            </div>
                            <div className="flex flex-row justify-end">
                                <Button
                                    type="button"
                                    size="lg"
                                    className="cursor-pointer"
                                    onClick={() => copyToClipboard("password")}
                                >
                                    Copy Password
                                </Button>
                            </div>
                        </ToolsCardContent>
                    </ToolsCard>
                    <ToolsCard>
                        <ToolsCardTitle className="border-l-blue-500">RevCMS v2/v3 Database Password</ToolsCardTitle>
                        <ToolsCardContent>
                            <div className="flex flex-col gap-2 mb-4">
                                <Input
                                    name="v2Password"
                                    value={v2Password}
                                    readOnly={true}
                                    className={cn("mb-2 rounded-none border-0 border-b-2 max-w-full")}
                                />
                            </div>
                            <div className="flex flex-row justify-end">
                                <Button
                                    type="button"
                                    size="lg"
                                    className="cursor-pointer"
                                    onClick={() => copyToClipboard("v2")}
                                >
                                    Copy Password
                                </Button>
                            </div>
                        </ToolsCardContent>
                    </ToolsCard>
                    <ToolsCard>
                        <ToolsCardTitle className="border-l-blue-500">RevCMS v4/v5 Database Password</ToolsCardTitle>
                        <ToolsCardContent>
                            <div className="flex flex-col gap-2 mb-4">
                                <Input
                                    name="v4Password"
                                    value={v4Password}
                                    readOnly={true}
                                    className={cn("mb-2 rounded-none border-0 border-b-2 max-w-full")}
                                />
                            </div>
                            <div className="flex flex-row justify-end">
                                <Button
                                    type="button"
                                    size="lg"
                                    className="cursor-pointer"
                                    onClick={() => copyToClipboard("v4")}
                                >
                                    Copy Password
                                </Button>
                            </div>
                        </ToolsCardContent>
                    </ToolsCard>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="cursor-pointer"
                    onClick={resetPasswordGenerator}
                >
                    Reset
                </Button>
            </form>
        </div>
    );
}