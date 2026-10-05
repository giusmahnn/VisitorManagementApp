import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CalendarCheck, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/api/axios";
import { login } from "@/api/auth.api";
import { useAuthStore } from "@/store/auth.store";

const loginSchema = z.object({
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(1, "Enter your password."),
});

type LoginValues = z.infer<typeof loginSchema>;

const rolePath = {
    admin: "/admin",
    host: "/host",
    receptionist: "/receptionist",
} as const;

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [requestError, setRequestError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
    const errors = form.formState.errors;

    const submit = async (values: LoginValues) => {
        setIsSubmitting(true);
        setRequestError(null);

        try {
            const response = await login(values);

            if (!response.data) {
                throw new Error("Login response did not include authentication data.");
            }

            setAuth(response.data.token, response.data.user);
            const requestedPath = (location.state as { from?: string } | null)?.from;
            navigate(requestedPath || rolePath[response.data.user.role], { replace: true });
        } catch (error) {
            setRequestError(getApiErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-svh bg-background px-6 py-6 text-foreground sm:px-10">
            <div className="mx-auto grid min-h-[calc(100svh-3rem)] w-full max-w-6xl items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
                <section>
                    <Link className="inline-flex items-center gap-2 text-sm font-bold" to="/">
                        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><CalendarCheck className="size-4" /></span>
                        VisitorFlow
                    </Link>
                    <p className="mt-16 text-xs font-bold uppercase tracking-[0.18em] text-primary">Team access</p>
                    <h1 className="mt-4 max-w-md text-5xl font-bold tracking-tight">Welcome back to the front desk.</h1>
                    <p className="mt-5 max-w-md leading-7 text-muted-foreground">Use one account entry point. Your role determines the workspace you see next.</p>
                </section>

                <form className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8" onSubmit={form.handleSubmit(submit)} noValidate>
                    <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Admin, host, and receptionist accounts use the same login.</p>
                    {requestError && <Alert className="mt-6" variant="destructive"><AlertTitle>Sign in failed</AlertTitle><AlertDescription>{requestError}</AlertDescription></Alert>}
                    <div className="mt-7 grid gap-5">
                        <label className="grid gap-2 text-sm font-medium" htmlFor="email">Email address<div className="relative"><Mail className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><input id="email" type="email" autoComplete="email" className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20" {...form.register("email")} /></div>{errors.email && <span className="text-xs font-normal text-destructive">{errors.email.message}</span>}</label>
                        <label className="grid gap-2 text-sm font-medium" htmlFor="password">Password<div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><input id="password" type="password" autoComplete="current-password" className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20" {...form.register("password")} /></div>{errors.password && <span className="text-xs font-normal text-destructive">{errors.password.message}</span>}</label>
                    </div>
                    <Button className="mt-8 h-11 w-full" type="submit" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="animate-spin" /> : <ArrowRight />} {isSubmitting ? "Signing in..." : "Sign in"}</Button>
                    {/* Host accounts are created internally by administrators. */}
                </form>
            </div>
        </main>
    );
}