import { zodResolver } from "@hookform/resolvers/zod";
import { Activity, AlertCircle, ArrowUpRight, Check, Clipboard, Clock3, LogOut, Plus, ShieldCheck, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ThemeControl } from "@/components/layout/ThemeControl";
import { getApiErrorMessage } from "@/api/axios";
import { createHost, createReceptionist, getAdminVisitors } from "@/api/admin.api";
import { useAuthStore } from "@/store/auth.store";
import type { Visitor } from "@/features/visitors/visitors.types";

const hostSchema = z.object({
    name: z.string().trim().min(2, "Enter the host's name."),
    email: z.string().trim().email("Enter a valid host email."),
});

type HostValues = z.infer<typeof hostSchema>;

function Metric({ label, value, detail, tone = "text-foreground" }: { label: string; value: number; detail: string; tone?: string }) {
    return <div className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className={`mt-4 text-3xl font-bold ${tone}`}>{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}

export default function AdminPage() {
    const navigate = useNavigate();
    const { user, clearAuth } = useAuthStore();
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [showHostForm, setShowHostForm] = useState(false);
    const [accountType, setAccountType] = useState<"host" | "receptionist">("host");
    const [credentials, setCredentials] = useState<{ email: string; temporaryPassword: string; emailSent: boolean } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const form = useForm<HostValues>({ resolver: zodResolver(hostSchema) });

    useEffect(() => {
        void getAdminVisitors().then((response) => setVisitors(response.data ?? [])).catch((requestError: unknown) => setError(getApiErrorMessage(requestError)));
    }, []);

    if (!user || user.role !== "admin") return null;

    const logout = () => {
        clearAuth();
        navigate("/login", { replace: true });
    };

    const today = new Date().toDateString();
    const todayVisitors = visitors.filter((visitor) => visitor.dateOfVisit && new Date(visitor.dateOfVisit).toDateString() === today);
    const pending = visitors.filter((visitor) => visitor.status === "Pending Approval");
    const checkedIn = visitors.filter((visitor) => visitor.status === "Checked In");
    const checkedOut = visitors.filter((visitor) => visitor.status === "Checked Out");

    const submitHost = async (values: HostValues) => {
        setError(null);
        setCredentials(null);
        try {
            const response = accountType === "host" ? await createHost(values) : await createReceptionist(values);
            if (!response.data) throw new Error("Host credentials were not returned.");
            setCredentials({ ...response.data.credentials, emailSent: response.data.emailSent });
            form.reset();
            setShowHostForm(false);
        } catch (requestError) {
            setError(getApiErrorMessage(requestError));
        }
    };

    const copyCredentials = async () => {
        if (!credentials) return;
        await navigator.clipboard.writeText(`Email: ${credentials.email}\nPassword: ${credentials.temporaryPassword}`);
        setCopied(true);
    };

    return (
        <main className="min-h-svh bg-background text-foreground">
            <div className="mx-auto w-full max-w-[1440px] px-5 py-5 sm:px-8 lg:px-12">
                <header className="flex items-center justify-between border-b border-border pb-5">
                    <div className="flex items-center gap-3"><span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck className="size-5" /></span><div><p className="font-bold tracking-tight">VisitorFlow</p><p className="text-xs text-muted-foreground">Operations console</p></div></div>
                    <div className="flex items-center gap-3"><ThemeControl /><div className="hidden text-right sm:block"><p className="text-sm font-semibold">{user.name}</p><p className="text-xs text-muted-foreground">Administrator</p></div><Button variant="ghost" onClick={logout}><LogOut /><span className="hidden sm:inline">Sign out</span></Button></div>
                </header>

                <section className="flex flex-col gap-6 py-10 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-semibold text-primary">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p><h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">The building, at a glance.</h1><p className="mt-3 max-w-xl leading-7 text-muted-foreground">Keep visitor movement, staff access, and host coverage in one calm operational view.</p></div><div className="flex gap-2"><Button className="h-11" onClick={() => { setAccountType("host"); setShowHostForm(true); }}><Plus /> Add host</Button><Button className="h-11" variant="outline" onClick={() => { setAccountType("receptionist"); setShowHostForm(true); }}><Plus /> Add receptionist</Button></div></section>

                {error && <Alert className="mb-6" variant="destructive"><AlertCircle /><AlertTitle>Admin data is unavailable</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Today&apos;s visitors" value={todayVisitors.length} detail="scheduled for today" /><Metric label="Awaiting approval" value={pending.length} detail="requests needing attention" tone="text-amber-600" /><Metric label="Inside now" value={checkedIn.length} detail="currently checked in" tone="text-emerald-600" /><Metric label="Completed visits" value={checkedOut.length} detail="all-time check-outs" tone="text-primary" /></section>

                <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
                    <section className="rounded-2xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-bold">Visitor activity</h2><p className="mt-1 text-xs text-muted-foreground">Most recent records across the building</p></div><Activity className="size-5 text-muted-foreground" /></div>{visitors.length === 0 ? <div className="px-5 py-14 text-center text-sm text-muted-foreground">No visitor records yet.</div> : <div className="divide-y divide-border">{visitors.slice(0, 8).map((visitor) => <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" key={visitor._id}><div className="min-w-0"><p className="font-semibold">{visitor.visitorName}</p><p className="mt-1 truncate text-sm text-muted-foreground">{visitor.email} · {visitor.purpose || "General visit"}</p></div><div className="flex items-center gap-4"><span className="text-sm text-muted-foreground">{visitor.dateOfVisit ? new Date(visitor.dateOfVisit).toLocaleDateString() : "No date"}</span><span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{visitor.status}</span></div></div>)}</div>}</section>
                    <aside className="space-y-5"><section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-3"><Clock3 className="size-5 text-primary" /><h2 className="font-bold">Operational pulse</h2></div><div className="mt-5 space-y-4 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Hosts and staff</span><span className="font-semibold">Protected</span></div><div className="flex justify-between"><span className="text-muted-foreground">Pending queue</span><span className="font-semibold">{pending.length ? "Needs review" : "Clear"}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Today&apos;s coverage</span><span className="font-semibold">{todayVisitors.length} visits</span></div></div></section><section className="rounded-2xl border border-primary/20 bg-primary/5 p-5"><UsersRound className="size-5 text-primary" /><h2 className="mt-4 font-bold">Manage the team</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Create host and receptionist accounts from the admin console. One-time credentials are shown after creation.</p><button className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline" onClick={() => { setAccountType("host"); setShowHostForm(true); }}>Create a host <ArrowUpRight className="size-4" /></button></section></aside>
                </div>

                {credentials && <section className="mt-8 rounded-2xl border border-emerald-300/50 bg-emerald-50 p-5 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-50"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Host account created</p><h2 className="mt-2 text-xl font-bold">Temporary credentials</h2></div><Button variant="outline" onClick={() => void copyCredentials}>{copied ? <Check /> : <Clipboard />} {copied ? "Copied" : "Copy credentials"}</Button></div><div className="mt-5 grid gap-4 rounded-xl bg-white/70 p-4 text-sm dark:bg-black/20 sm:grid-cols-2"><div><span className="opacity-70">Email</span><p className="mt-1 break-all font-semibold">{credentials.email}</p></div><div><span className="opacity-70">Temporary password</span><p className="mt-1 break-all font-mono font-semibold">{credentials.temporaryPassword}</p></div></div><p className="mt-4 text-sm opacity-75">{credentials.emailSent ? "Credentials were emailed to the host." : "The host was created, but email delivery failed."} Keep this password secure; it will not be shown again.</p></section>}
            </div>

            {showHostForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"><form className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl" onSubmit={form.handleSubmit(submitHost)}><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Team access</p><h2 className="mt-2 text-2xl font-bold">Add {accountType}</h2><p className="mt-2 text-sm text-muted-foreground">A one-time password will be generated and emailed.</p></div><button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setShowHostForm(false)}>Close</button></div><div className="mt-6 grid gap-4"><label className="grid gap-2 text-sm font-medium" htmlFor="admin-host-name">Full name<input id="admin-host-name" className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20" {...form.register("name")} />{form.formState.errors.name && <span className="text-xs text-destructive">{form.formState.errors.name.message}</span>}</label><label className="grid gap-2 text-sm font-medium" htmlFor="admin-host-email">Email<input id="admin-host-email" type="email" className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20" {...form.register("email")} />{form.formState.errors.email && <span className="text-xs text-destructive">{form.formState.errors.email.message}</span>}</label></div><Button className="mt-6 h-11 w-full" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? `Creating ${accountType}...` : `Create ${accountType}`}</Button></form></div>}
        </main>
    );
}