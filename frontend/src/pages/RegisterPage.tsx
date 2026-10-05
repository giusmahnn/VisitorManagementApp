import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CalendarCheck, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/api/axios";
import { register } from "@/api/auth.api";

const registerSchema = z.object({
    name: z.string().trim().min(2, "Enter your name."),
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(8, "Use at least 8 characters."),
    confirmation: z.string(),
}).refine((values) => values.password === values.confirmation, { path: ["confirmation"], message: "Passwords must match." });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const navigate = useNavigate();
    const [requestError, setRequestError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const form = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });
    const errors = form.formState.errors;

    const submit = async ({ name, email, password }: RegisterValues) => {
        setIsSubmitting(true);
        setRequestError(null);
        try {
            await register({ name, email, password });
            navigate("/login", { replace: true, state: { registered: true } });
        } catch (error) {
            setRequestError(getApiErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-svh bg-background px-6 py-6 text-foreground sm:px-10">
            <div className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-2xl items-center justify-center">
                <form className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10" onSubmit={form.handleSubmit(submit)} noValidate>
                    <Link className="inline-flex items-center gap-2 text-sm font-bold" to="/"><span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><CalendarCheck className="size-4" /></span>VisitorFlow</Link>
                    <Link className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" to="/login"><ArrowLeft className="size-4" /> Back to sign in</Link>
                    <h1 className="mt-7 text-4xl font-bold tracking-tight">Create your host account.</h1>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">Host self-registration creates a host account. Admins create receptionist and additional host accounts.</p>
                    {requestError && <Alert className="mt-6" variant="destructive"><AlertTitle>Registration failed</AlertTitle><AlertDescription>{requestError}</AlertDescription></Alert>}
                    <div className="mt-7 grid gap-5 sm:grid-cols-2">
                        <label className="grid gap-2 text-sm font-medium" htmlFor="name">Full name<input id="name" autoComplete="name" className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20" {...form.register("name")} />{errors.name && <span className="text-xs font-normal text-destructive">{errors.name.message}</span>}</label>
                        <label className="grid gap-2 text-sm font-medium" htmlFor="email">Email<input id="email" type="email" autoComplete="email" className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20" {...form.register("email")} />{errors.email && <span className="text-xs font-normal text-destructive">{errors.email.message}</span>}</label>
                        <label className="grid gap-2 text-sm font-medium" htmlFor="password">Password<input id="password" type="password" autoComplete="new-password" className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20" {...form.register("password")} />{errors.password && <span className="text-xs font-normal text-destructive">{errors.password.message}</span>}</label>
                        <label className="grid gap-2 text-sm font-medium" htmlFor="confirmation">Confirm password<input id="confirmation" type="password" autoComplete="new-password" className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20" {...form.register("confirmation")} />{errors.confirmation && <span className="text-xs font-normal text-destructive">{errors.confirmation.message}</span>}</label>
                    </div>
                    <Button className="mt-8 h-11 w-full" type="submit" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="animate-spin" /> : <ArrowRight />} {isSubmitting ? "Creating account..." : "Create host account"}</Button>
                </form>
            </div>
        </main>
    );
}