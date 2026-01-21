"use client";

import { AuthCard, AuthCardContent, AuthCardFooter, AuthCardHeader, AuthCardTitle } from "@/components/auth-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { CircleAlertIcon, CircleCheckIcon, Eye, EyeOff, LoaderCircleIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { signInAction } from "../actions/sign-in";

type LoginFormProps = {
  logoutReason?: string;
  className?: React.ComponentProps<"div">;
};

export function LoginForm({ logoutReason, className, ...props }: LoginFormProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [pending, setPending] = useState(false);

  const [hasFormError, setHasFormError] = useState(false);
  const [formError, setFormError] = useState("");
  
  const toggleVisibility = () => setIsVisible(!isVisible);

  const loginFormSchema = z.object({
    email: z.email(),
    password: z
      .string()
  });

  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: standardSchemaResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof loginFormSchema>) => {
    setIsVisible(false);
    setPending(true);
    setHasFormError(false);
    setFormError("");
    await fetch("/api/users/clearReason");
    const response = await signInAction(values);
    if (!response.status) {
      setHasFormError(true);
      setFormError(response.message);
    }
    setPending(false);
  };

  return (
    <AuthCard>
      <AuthCardHeader>
        <AuthCardTitle>
          xclntDesign<br />Web Tools
        </AuthCardTitle>
      </AuthCardHeader>
      <AuthCardContent>
        <form id="xd-login-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Input
                    {...field}
                    id="xd-login-form-email"
                    aria-invalid={fieldState.invalid}
                    placeholder="Email Address"
                    className="h-12 bg-transparent text-lg! placeholder:text-lg w-full font-sans"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="relative">
                      <Input
                        {...field}
                        type={isVisible ? "text" : "password"}
                        placeholder="Password"
                        className="h-12 bg-transparent text-lg! placeholder:text-lg w-full font-sans"
                        aria-label="Password"
                      />
                      {/* Toggle password visibility button */}
                      <Button
                        className={`absolute inset-y-0 end-0 flex items-center z-2 px-2 mt-1.5 cursor-pointer text-neutral-400 rounded-e-md bg-transparent hover:bg-transparent focus:outline-none focus-visible:text-rose-500 hover-svg-rose transition-colors`}
                        type="button"
                        onClick={toggleVisibility}
                        aria-label={isVisible ? "Hide password" : "Show password"}
                        aria-pressed={isVisible}
                        aria-controls="password"
                      >
                        {isVisible ? (
                          <EyeOff />
                        ) : (
                          <Eye />
                        )}
                      </Button>
                    </div>
                </Field>
              )}
            />
          </FieldGroup>
          <div className="flex flex-row items-center justify-center mt-6">
            <Button
                  type="submit"
                  className="h-12 cursor-pointer w-full text-lg font-sans" 
              >
                  {pending ? (
                    <>
                    Logging in...
                    <LoaderCircleIcon className="size-4 animate-spin ml-2" />
                    </>
                  ) : (
                    <>
                    Log in
                    </>
                  )}
              </Button>
            </div>
        </form>
      </AuthCardContent>
      <AuthCardFooter>
      {logoutReason && (
          <>
            {logoutReason && logoutReason === "inactivity" && (
              <Alert variant="destructive" className="border-0 bg-transparent">
                <CircleAlertIcon />
                <AlertTitle>Session Expired</AlertTitle>
                <AlertDescription>
                  Your session has expired. Please log in again.
                </AlertDescription>
              </Alert>
            )}
            {logoutReason && logoutReason === "password-reset" && (
              <Alert variant="default" className="border-0 text-green-700 bg-transparent">
                <CircleCheckIcon />
                <AlertTitle>Password Reset</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your password has been reset. Please log in again.
                </AlertDescription>
              </Alert>
            )}            
            </>
      )}
      {hasFormError && (
        <Alert variant="destructive" className="border-0 bg-transparent">
          <CircleAlertIcon />
          <AlertTitle>Log In Error</AlertTitle>
          <AlertDescription>
            {formError}
          </AlertDescription>
        </Alert>
      )}
      </AuthCardFooter>
    </AuthCard>
  );
}
