import { zodResolver } from "@hookform/resolvers/zod";
import { Check, LogOut, QrCode, Search, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/api/axios";
import { getHosts } from "@/api/host.api";
import { createReceptionBooking, getReceptionVisitors, manualCheckIn, manualCheckOut, scanCheckIn, scanCheckOut } from "@/api/reception.api";
import { useAuthStore } from "@/store/auth.store";
import type { Visitor } from "@/features/visitors/visitors.types";

const bookingSchema = z.object({
    visitorName: z.string().trim().min(2, "Enter the visitor name."),
    mobileNo: z.string().regex(/^\d{7,15}$/, "Enter a valid mobile number."),
    email: z.string().email("Enter a valid email."),
    purpose: z.string().trim().min(3, "Add a purpose."),
    dateOfVisit: z.string().min(1, "Choose a date."),
    visitStartTime: z.string().min(1, "Choose a start time."),
    visitEndTime: z.string().min(1, "Choose an end time."),
    hostId: z.string().min(1, "Choose a host."),
}).refine((values) => values.visitStartTime < values.visitEndTime, { path: ["visitEndTime"], message: "End time must be after start time." });

type BookingValues = z.infer<typeof bookingSchema>;
type Host = { id: string; name: string; email: string };

export default function ReceptionistPage() {
    const navigate = useNavigate();
    const { user, clearAuth } = useAuthStore();
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [hosts, setHosts] = useState<Host[]>([]);
    const [query, setQuery] = useState("");
    const [qrText, setQrText] = useState("");
    const [qrMode, setQrMode] = useState<"check-in" | "check-out">("check-in");
    const [showBooking, setShowBooking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const form = useForm<BookingValues>({ resolver: zodResolver(bookingSchema) });

    useEffect(() => {
        void Promise.all([getReceptionVisitors(), getHosts()]).then(([visitorResponse, hostResponse]) => {
            setVisitors(visitorResponse.data ?? []);
            setHosts((hostResponse.data ?? []) as Host[]);
        }).catch((requestError: unknown) => setError(getApiErrorMessage(requestError)));
    }, []);

    if (!user || user.role !== "receptionist") return null;

    const refresh = async () => {
        const response = await getReceptionVisitors();
        setVisitors(response.data ?? []);
    };

    const act = async (action: () => Promise<unknown>, successMessage: string) => {
        try { setError(null); await action(); await refresh(); setMessage(successMessage); }
        catch (requestError) { setError(getApiErrorMessage(requestError)); }
    };

    const submitBooking = async (values: BookingValues) => {
        await act(() => createReceptionBooking({ ...values, mobileNo: Number(values.mobileNo), dateOfVisit: `${values.dateOfVisit}T${values.visitStartTime}:00`, visitEndTime: `${values.dateOfVisit}T${values.visitEndTime}:00` }), "Booking created and sent to the host.");
        form.reset();
        setShowBooking(false);
    };

    const visibleVisitors = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return visitors;
        return visitors.filter((visitor) => [visitor.visitorName, visitor.email, visitor.visitorId, String(visitor.mobileNo)].some((value) => value.toLowerCase().includes(normalized)));
    }, [query, visitors]);

    const inside = visitors.filter((visitor) => visitor.status === "Checked In");
    const today = visitors.filter((visitor) => visitor.dateOfVisit && new Date(visitor.dateOfVisit).toDateString() === new Date().toDateString());
    const logout = () => { clearAuth(); navigate("/login", { replace: true }); };

    return (
        <main className="min-h-svh bg-background text-foreground"><div className="mx-auto w-full max-w-7xl px-5 py-5 sm:px-8 lg:px-12">
            <header className="flex items-center justify-between border-b border-border pb-5"><div className="flex items-center gap-3"><span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><UserRound className="size-5" /></span><div><p className="font-bold">VisitorFlow</p><p className="text-xs text-muted-foreground">Reception desk</p></div></div><Button variant="ghost" onClick={logout}><LogOut /> Sign out</Button></header>
            <section className="flex flex-col justify-between gap-5 py-10 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-primary">Front desk control</p><h1 className="mt-2 text-4xl font-bold tracking-tight">Keep arrivals moving.</h1><p className="mt-3 text-muted-foreground">Scan passes, find guests, and keep the building's live visitor list accurate.</p></div><Button onClick={() => setShowBooking(true)}><UserRound /> Create booking</Button></section>
            {error && <Alert variant="destructive"><AlertTitle>Desk action failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}{message && <Alert className="mt-4"><AlertTitle>Done</AlertTitle><AlertDescription>{message}</AlertDescription></Alert>}
            <section className="mt-6 grid gap-4 sm:grid-cols-3"><Metric label="Today's visits" value={today.length} /><Metric label="Inside now" value={inside.length} tone="text-success" /><Metric label="Need check-out" value={inside.length} tone="text-warning" /></section>
            <div className="mt-8 grid gap-8 xl:grid-cols-[22rem_minmax(0,1fr)]"><aside className="space-y-5"><section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-3"><QrCode className="size-5 text-primary" /><h2 className="font-bold">QR desk</h2></div><div className="mt-4 flex gap-2"><Button size="sm" variant={qrMode === "check-in" ? "default" : "outline"} onClick={() => setQrMode("check-in")}>Check in</Button><Button size="sm" variant={qrMode === "check-out" ? "default" : "outline"} onClick={() => setQrMode("check-out")}>Check out</Button></div><textarea className="mt-4 min-h-24 w-full rounded-lg border border-input bg-background p-3 text-sm" placeholder="Paste scanned QR content here" value={qrText} onChange={(event) => setQrText(event.target.value)} /><Button className="mt-3 w-full" onClick={() => void act(() => qrMode === "check-in" ? scanCheckIn(qrText) : scanCheckOut(qrText), `${qrMode === "check-in" ? "Check-in" : "Check-out"} completed.`)}><QrCode /> Process QR</Button></section><section className="rounded-2xl border border-warning/30 bg-warning/10 p-5"><h2 className="font-bold">People to check out</h2><div className="mt-4 space-y-3">{inside.length === 0 ? <p className="text-sm text-muted-foreground">Everyone is accounted for.</p> : inside.map((visitor) => <div className="flex items-center justify-between gap-3 text-sm" key={visitor._id}><span className="truncate font-semibold">{visitor.visitorName}</span><Button size="xs" variant="outline" onClick={() => void act(() => manualCheckOut(visitor._id), "Check-out completed.")}>Out</Button></div>)}</div></section></aside>
                <section className="rounded-2xl border border-border bg-card"><div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold">Visitor queue</h2><p className="mt-1 text-xs text-muted-foreground">Search by name, email, phone, or visitor ID.</p></div><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><input className="h-9 rounded-lg border border-input bg-background pl-9 pr-3 text-sm" placeholder="Find a visitor" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div><div className="divide-y divide-border">{visibleVisitors.map((visitor) => <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between" key={visitor._id}><div><p className="font-semibold">{visitor.visitorName}</p><p className="mt-1 text-sm text-muted-foreground">{visitor.visitorId} · {visitor.email} · {formatRange(visitor)}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{visitor.status}</span>{visitor.status === "Approved" && <Button size="sm" onClick={() => void act(() => manualCheckIn(visitor._id), "Check-in completed.")}><Check /> Check in</Button>}{visitor.status === "Checked In" && <Button size="sm" variant="outline" onClick={() => void act(() => manualCheckOut(visitor._id), "Check-out completed.")}>Check out</Button>}</div></div>)}</div></section></div>
        </div>{showBooking && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"><form className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl" onSubmit={form.handleSubmit(submitBooking)}><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">New booking</p><h2 className="mt-2 text-2xl font-bold">Book a guest with a host</h2></div><button type="button" onClick={() => setShowBooking(false)}><X /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Input label="Visitor name" register={form.register("visitorName")} /><Input label="Mobile number" register={form.register("mobileNo")} /><Input label="Visitor email" type="email" register={form.register("email")} /><Input label="Purpose" register={form.register("purpose")} /><Input label="Date" type="date" register={form.register("dateOfVisit")} /><Input label="From" type="time" register={form.register("visitStartTime")} /><Input label="To" type="time" register={form.register("visitEndTime")} /><select className="h-11 rounded-lg border border-input bg-background px-3 text-sm sm:col-span-2" {...form.register("hostId")}><option value="">Select host</option>{hosts.map((host) => <option value={host.id} key={host.id}>{host.name} · {host.email}</option>)}</select></div><Button className="mt-6 w-full" type="submit">Create booking</Button></form></div>}</main>
    );
}

function Metric({ label, value, tone = "text-foreground" }: { label: string; value: number; tone?: string }) { return <div className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className={`mt-3 text-3xl font-bold ${tone}`}>{value}</p></div>; }
function Input({ label, type = "text", register }: { label: string; type?: string; register: UseFormRegisterReturn }) { return <label className="grid gap-2 text-sm font-medium">{label}<input type={type} className="h-11 rounded-lg border border-input bg-background px-3 text-sm" {...register} /></label>; }
function formatRange(visitor: Visitor) { const format = (value?: string) => value ? new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""; return `${format(visitor.dateOfVisit)} - ${format(visitor.visitEndTime)}`; }
