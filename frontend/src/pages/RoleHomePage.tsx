import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Check, Clock3, LogOut, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/api/axios";
import { createHostAppointment, decideHostAppointment, getHostAppointments, getHostNotifications } from "@/api/host.api";
import { useAuthStore } from "@/store/auth.store";
import type { Visitor } from "@/features/visitors/visitors.types";

const bookingSchema = z.object({
    visitorName: z.string().trim().min(2, "Enter the visitor's name."),
    mobileNo: z.string().regex(/^\d{7,15}$/, "Enter a valid mobile number."),
    email: z.string().email("Enter a valid email."),
    purpose: z.string().trim().min(3, "Add a purpose."),
    dateOfVisit: z.string().min(1, "Choose a date."),
    visitStartTime: z.string().min(1, "Choose a start time."),
    visitEndTime: z.string().min(1, "Choose an end time."),
}).refine((values) => values.visitStartTime < values.visitEndTime, {
    path: ["visitEndTime"],
    message: "End time must be after start time.",
});

type BookingValues = z.infer<typeof bookingSchema>;

function toRange(values: BookingValues) {
    return {
        ...values,
        mobileNo: Number(values.mobileNo),
        dateOfVisit: `${values.dateOfVisit}T${values.visitStartTime}:00`,
        visitEndTime: `${values.dateOfVisit}T${values.visitEndTime}:00`,
    };
}

export default function RoleHomePage({ role }: { role: "admin" | "host" | "receptionist" }) {
    const navigate = useNavigate();
    const { user, clearAuth } = useAuthStore();
    const [appointments, setAppointments] = useState<Visitor[]>([]);
    const [notifications, setNotifications] = useState<Visitor[]>([]);
    const [showBooking, setShowBooking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const bookingForm = useForm<BookingValues>({ resolver: zodResolver(bookingSchema) });

    if (!user || user.role !== role) return <Navigate to="/login" replace />;

    const logout = () => {
        clearAuth();
        navigate("/login", { replace: true });
    };

    if (role !== "host") {
        return <Navigate to={`/${role}`} replace />;
    }

    const loadDashboard = async () => {
        try {
            const [appointmentsResponse, notificationsResponse] = await Promise.all([
                getHostAppointments(),
                getHostNotifications(),
            ]);
            setAppointments(appointmentsResponse.data ?? []);
            setNotifications(notificationsResponse.data ?? []);
        } catch (requestError) {
            setError(getApiErrorMessage(requestError));
        }
    };

    useEffect(() => {
        void loadDashboard();
    }, []);

    const submitBooking = async (values: BookingValues) => {
        try {
            setError(null);
            await createHostAppointment(toRange(values));
            bookingForm.reset();
            setShowBooking(false);
            await loadDashboard();
        } catch (requestError) {
            setError(getApiErrorMessage(requestError));
        }
    };

    const decide = async (id: string, decision: "approve" | "reject") => {
        try {
            await decideHostAppointment(id, decision);
            await loadDashboard();
        } catch (requestError) {
            setError(getApiErrorMessage(requestError));
        }
    };

    const today = new Date().toDateString();
    const todayAppointments = appointments.filter((appointment) => appointment.dateOfVisit && new Date(appointment.dateOfVisit).toDateString() === today);
    const inside = todayAppointments.filter((appointment) => appointment.status === "Checked In").length;
    const completed = todayAppointments.filter((appointment) => appointment.status === "Checked Out").length;

    return (
        <main className="min-h-svh bg-background text-foreground">
            <div className="mx-auto w-full max-w-6xl px-5 py-5 sm:px-8 lg:px-12">
                <header className="flex items-center justify-between border-b border-border pb-5">
                    <div className="flex items-center gap-3"><span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><CalendarDays className="size-5" /></span><div><p className="font-bold">VisitorFlow</p><p className="text-xs text-muted-foreground">Host desk</p></div></div>
                    <Button variant="ghost" onClick={logout}><LogOut /> Sign out</Button>
                </header>
                <section className="flex flex-col justify-between gap-5 py-10 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-success">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p><h1 className="mt-2 text-4xl font-bold tracking-tight">Good morning, {user.name.split(" ")[0]}.</h1><p className="mt-3 text-muted-foreground">Here is the shape of your visitor day.</p></div><Button onClick={() => setShowBooking(true)}><Plus /> Create booking</Button></section>
                {error && <Alert variant="destructive"><AlertTitle>Something went wrong</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                <section className="mt-6 grid gap-4 sm:grid-cols-3"><Metric label="Today" value={todayAppointments.length} detail="scheduled visitors" /><Metric label="Inside now" value={inside} detail="currently with you" tone="text-success" /><Metric label="Completed" value={completed} detail="checked out today" /></section>
                <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]"><section className="rounded-2xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-bold">Today's appointments</h2><p className="mt-1 text-xs text-muted-foreground">Visitor details and appointment ranges</p></div><Clock3 className="size-5 text-muted-foreground" /></div><div className="divide-y divide-border">{todayAppointments.length === 0 ? <p className="px-5 py-12 text-center text-sm text-muted-foreground">No appointments scheduled for today.</p> : todayAppointments.map((appointment) => <div className="flex items-center justify-between gap-4 px-5 py-4" key={appointment._id}><div><p className="font-semibold">{appointment.visitorName}</p><p className="mt-1 text-sm text-muted-foreground">{appointment.purpose || "General visit"} · {appointment.email}</p></div><div className="text-right text-sm"><p>{formatTime(appointment.dateOfVisit)} - {formatTime(appointment.visitEndTime)}</p><span className="mt-1 inline-block rounded-full bg-muted px-3 py-1 text-xs font-semibold">{appointment.status}</span></div></div>)}</div></section><section className="rounded-2xl border border-warning/30 bg-warning/10"><div className="border-b border-warning/30 px-5 py-4"><h2 className="font-bold">Needs your decision</h2><p className="mt-1 text-xs text-muted-foreground">New visitor requests</p></div>{notifications.length === 0 ? <p className="px-5 py-10 text-center text-sm text-muted-foreground">You are all caught up.</p> : notifications.map((notification) => <div className="border-b border-warning/30 px-5 py-4" key={notification._id}><p className="font-semibold">{notification.visitorName}</p><p className="mt-1 text-xs text-muted-foreground">{formatTime(notification.dateOfVisit)} - {formatTime(notification.visitEndTime)}</p><div className="mt-3 flex gap-2"><Button size="sm" onClick={() => void decide(notification._id, "approve")}><Check /> Accept</Button><Button size="sm" variant="outline" onClick={() => void decide(notification._id, "reject")}>Decline</Button></div></div>)}</section></div>
            </div>
            {showBooking && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"><form className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl" onSubmit={bookingForm.handleSubmit(submitBooking)}><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">New booking</p><h2 className="mt-2 text-2xl font-bold">Bring someone into your day</h2></div><button type="button" onClick={() => setShowBooking(false)}><X /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Input label="Visitor name" register={bookingForm.register("visitorName")} error={bookingForm.formState.errors.visitorName?.message} /><Input label="Mobile number" register={bookingForm.register("mobileNo")} error={bookingForm.formState.errors.mobileNo?.message} /><Input label="Visitor email" type="email" register={bookingForm.register("email")} error={bookingForm.formState.errors.email?.message} /><Input label="Purpose" register={bookingForm.register("purpose")} error={bookingForm.formState.errors.purpose?.message} /><Input label="Date" type="date" register={bookingForm.register("dateOfVisit")} error={bookingForm.formState.errors.dateOfVisit?.message} /><Input label="From" type="time" register={bookingForm.register("visitStartTime")} error={bookingForm.formState.errors.visitStartTime?.message} /><Input label="To" type="time" register={bookingForm.register("visitEndTime")} error={bookingForm.formState.errors.visitEndTime?.message} /></div><Button className="mt-6 w-full" type="submit">Create booking</Button></form></div>}
        </main>
    );
}

function Metric({ label, value, detail, tone = "text-foreground" }: { label: string; value: number; detail: string; tone?: string }) {
    return <div className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className={`mt-3 text-3xl font-bold ${tone}`}>{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}

function Input({ label, type = "text", register, error }: { label: string; type?: string; register: UseFormRegisterReturn; error?: string }) {
    return <label className="grid gap-2 text-sm font-medium">{label}<input type={type} className="h-11 rounded-lg border border-input bg-background px-3 text-sm" {...register} />{error && <span className="text-xs text-destructive">{error}</span>}</label>;
}

function formatTime(value?: string) {
    return value ? new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";
}
