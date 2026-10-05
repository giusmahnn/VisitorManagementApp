import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useFormPersist } from "@/hooks/use-form-persist";
import { getApiErrorMessage } from "@/api/axios";
import { createVisitor, getBookingHosts } from "./visitor.api";
import { visitorBookingDraftKey } from "./visitors.constants";
import type { CreateVisitorPayload, Visitor } from "./visitors.types";

const bookingSchema = z.object({
    visitorName: z.string().trim().min(2, "Enter your full name."),
    mobileNo: z.string().regex(/^\d{7,15}$/, "Enter a valid mobile number."),
    email: z.string().trim().email("Enter a valid email address."),
    address: z.string().trim().min(5, "Enter your address.").optional().or(z.literal("")),
    purpose: z.string().trim().min(3, "Tell us the purpose of your visit."),
    dateOfVisit: z.string().min(1, "Choose a visit date."),
    visitStartTime: z.string().min(1, "Choose a start time."),
    visitEndTime: z.string().min(1, "Choose an end time."),
    hostId: z.string().min(1, "Choose a host."),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const initialValues: BookingFormValues = {
    visitorName: "",
    mobileNo: "",
    email: "",
    address: "",
    whomToMeet: "",
    purpose: "",
    dateOfVisit: "",
    visitStartTime: "",
    visitEndTime: "",
    hostId: "",
};

function Field({
    label,
    name,
    error,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    name: string;
    error?: string;
}) {
    return (
        <label className="grid gap-2 text-sm font-medium text-foreground" htmlFor={name}>
            {label}
            <input
                id={name}
                name={name}
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
                {...props}
            />
            {error && <span className="text-xs font-normal text-destructive">{error}</span>}
        </label>
    );
}

export default function VisitorsPage() {
    const [submittedVisitor, setSubmittedVisitor] = useState<Visitor | null>(null);
    const [requestError, setRequestError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hosts, setHosts] = useState<Array<{ id: string; name: string; email: string }>>([]);
    const form = useForm<BookingFormValues>({
        resolver: zodResolver(bookingSchema),
        defaultValues: initialValues,
    });
    const { clear: clearDraft } = useFormPersist({
        storageKey: visitorBookingDraftKey,
        form,
    });

    useEffect(() => {
        void getBookingHosts().then((response) => setHosts(response.data ?? []));
    }, []);

    const submitBooking = async (values: BookingFormValues) => {
        setIsSubmitting(true);
        setRequestError(null);

        const payload: CreateVisitorPayload = {
            ...values,
            dateOfVisit: `${values.dateOfVisit}T${values.visitStartTime}:00`,
            visitEndTime: `${values.dateOfVisit}T${values.visitEndTime}:00`,
            mobileNo: Number(values.mobileNo),
            hostId: values.hostId,
        };

        try {
            const response = await createVisitor(payload);
            setSubmittedVisitor(response.data ?? null);
            clearDraft();
            form.reset(initialValues);
        } catch (error) {
            setRequestError(getApiErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submittedVisitor) {
        return (
            <main className="min-h-svh bg-background px-6 py-8 text-foreground sm:px-10">
                <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-2xl items-center justify-center">
                    <section className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-12">
                        <CheckCircle2 className="size-12 text-success" aria-hidden="true" />
                        <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-primary">Request received</p>
                        <h1 className="mt-3 text-4xl font-bold tracking-tight">Your visit is in motion.</h1>
                        <p className="mt-4 max-w-lg leading-7 text-muted-foreground">
                            We sent your request for host approval. Your access pass will be emailed after the visit is approved.
                        </p>
                        <div className="mt-8 grid gap-3 rounded-xl bg-muted/50 p-4 text-sm sm:grid-cols-2">
                            <div><span className="text-muted-foreground">Visitor ID</span><p className="mt-1 font-semibold">{submittedVisitor.visitorId}</p></div>
                            <div><span className="text-muted-foreground">Status</span><p className="mt-1 font-semibold">{submittedVisitor.status}</p></div>
                        </div>
                        <Link className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline" to="/">
                            <ArrowLeft className="size-4" /> Return home
                        </Link>
                    </section>
                </div>
            </main>
        );
    }

    const errors = form.formState.errors;

    return (
        <main className="min-h-svh bg-background px-6 py-6 text-foreground sm:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-6xl">
                <header className="flex items-center justify-between">
                    <Link className="inline-flex items-center gap-2 text-sm font-bold" to="/">
                        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><CalendarDays className="size-4" /></span>
                        VisitorFlow
                    </Link>
                    <Link className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground" to="/">
                        <ArrowLeft className="size-4" /> Back
                    </Link>
                </header>

                <div className="grid gap-10 py-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-start lg:py-20">
                    <div className="lg:sticky lg:top-10">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Visitor registration</p>
                        <h1 className="mt-4 max-w-md text-4xl font-bold tracking-tight sm:text-5xl">Tell us when to expect you.</h1>
                        <p className="mt-5 max-w-md leading-7 text-muted-foreground">Share the details of your visit and we will route the request to your host for approval.</p>
                        <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground"><span className="inline-flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground">1</span> Complete your details</div>
                        <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground"><span className="inline-flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground">2</span> Wait for host approval</div>
                        <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground"><span className="inline-flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground">3</span> Receive your access pass</div>
                    </div>

                    <form className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8" onSubmit={form.handleSubmit(submitBooking)} noValidate>
                        {requestError && (
                            <Alert className="mb-6" variant="destructive">
                                <AlertCircle />
                                <AlertTitle>Registration could not be submitted</AlertTitle>
                                <AlertDescription>{requestError}</AlertDescription>
                            </Alert>
                        )}
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field label="Full name" placeholder="e.g. Alex Morgan" {...form.register("visitorName")} error={errors.visitorName?.message} />
                            <Field label="Mobile number" type="tel" inputMode="numeric" placeholder="e.g. 9876543210" {...form.register("mobileNo")} error={errors.mobileNo?.message} />
                            <Field label="Email address" type="email" placeholder="you@example.com" {...form.register("email")} error={errors.email?.message} />
                            <label className="grid gap-2 text-sm font-medium text-foreground" htmlFor="hostId">Host<select id="hostId" className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20" {...form.register("hostId")}><option value="">Choose a host</option>{hosts.map((host) => <option key={host.id} value={host.id}>{host.name}</option>)}</select>{errors.hostId?.message && <span className="text-xs font-normal text-destructive">{errors.hostId.message}</span>}</label>
                            <Field label="Visit date" type="date" {...form.register("dateOfVisit")} error={errors.dateOfVisit?.message} />
                            <Field label="From" type="time" {...form.register("visitStartTime")} error={errors.visitStartTime?.message} />
                            <Field label="To" type="time" {...form.register("visitEndTime")} error={errors.visitEndTime?.message} />
                            <Field label="Purpose of visit" placeholder="e.g. Product review" {...form.register("purpose")} error={errors.purpose?.message} />
                            <label className="grid gap-2 text-sm font-medium text-foreground sm:col-span-2" htmlFor="address">
                                Address
                                <textarea id="address" rows={3} placeholder="Your current address" className="resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20" {...form.register("address")} />
                                {errors.address?.message && <span className="text-xs font-normal text-destructive">{errors.address.message}</span>}
                            </label>
                        </div>
                        <div className="mt-8 flex justify-end border-t border-border pt-6">
                            <Button className="h-11 px-5" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}
                                {isSubmitting ? "Submitting..." : "Request appointment"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
