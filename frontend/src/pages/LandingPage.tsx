import {
    ArrowUpRight,
    CalendarCheck,
    CheckCircle2,
    Clock3,
    Users,
} from "lucide-react"
import { Link } from "react-router-dom"

export default function LandingPage() {
    return (
        <main className="landing-page relative flex min-h-svh flex-1 overflow-hidden">
            <div className="landing-grid" aria-hidden="true" />
            <div className="landing-orbit landing-orbit-one" aria-hidden="true" />
            <div className="landing-orbit landing-orbit-two" aria-hidden="true" />

            <div className="relative mx-auto flex w-full max-w-7xl flex-col px-6 py-6 sm:px-10 lg:px-16">
                <header className="landing-reveal landing-reveal-delay-1 flex items-center justify-between">
                    <Link to="/" className="landing-brand">
                        <span className="landing-brand-mark">
                            <CalendarCheck className="size-5" aria-hidden="true" />
                        </span>
                        <span>VisitorFlow</span>
                    </Link>
                    <span className="landing-header-note">Visitor management, without the waiting room</span>
                </header>

                <section className="landing-hero flex flex-1 items-center py-16 sm:py-20 lg:py-24">
                    <div className="landing-copy">
                        <p className="landing-eyebrow landing-reveal landing-reveal-delay-2">
                            A better welcome starts here
                        </p>
                        <h1 className="landing-title landing-reveal landing-reveal-delay-3">
                            Make every arrival <span>feel expected.</span>
                        </h1>
                        <p className="landing-description landing-reveal landing-reveal-delay-4">
                            VisitorFlow keeps appointments, arrivals, and your front desk in step, so every guest gets a clear and welcoming start.
                        </p>

                        <div className="landing-actions landing-reveal landing-reveal-delay-5">
                            <Link
                                to="/book-appointment"
                                className="landing-button landing-button-primary"
                            >
                                Book an appointment
                                <ArrowUpRight className="size-4" aria-hidden="true" />
                            </Link>
                            <Link
                                to="/login"
                                className="landing-button landing-button-secondary"
                            >
                                Login
                            </Link>
                        </div>
                    </div>

                    <div className="landing-visual landing-reveal landing-reveal-delay-4" aria-label="Visitor appointment preview">
                        <div className="landing-visual-glow" aria-hidden="true" />
                        <div className="landing-window">
                            <div className="landing-window-topbar">
                                <div className="flex gap-1.5" aria-hidden="true">
                                    <span className="landing-window-dot" />
                                    <span className="landing-window-dot" />
                                    <span className="landing-window-dot" />
                                </div>
                                <span className="landing-window-date">Tuesday, Oct 08</span>
                            </div>
                            <div className="landing-window-body">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="landing-panel-kicker">Today at the front desk</p>
                                        <p className="landing-panel-title">Good morning, team</p>
                                    </div>
                                    <span className="landing-live-dot">Live</span>
                                </div>
                                <div className="landing-visit-card landing-visit-card-featured">
                                    <div className="landing-avatar">AM</div>
                                    <div className="min-w-0 flex-1">
                                        <p className="landing-visit-name">Alex Morgan</p>
                                        <p className="landing-visit-meta"><Clock3 className="size-3.5" /> 10:30 AM <span>•</span> Product review</p>
                                    </div>
                                    <CheckCircle2 className="landing-check" aria-label="Confirmed" />
                                </div>
                                <div className="landing-visit-card">
                                    <div className="landing-avatar landing-avatar-alt">JC</div>
                                    <div className="min-w-0 flex-1">
                                        <p className="landing-visit-name">Jordan Cole</p>
                                        <p className="landing-visit-meta"><Clock3 className="size-3.5" /> 11:15 AM <span>•</span> Design sync</p>
                                    </div>
                                    <span className="landing-visit-status">Expected</span>
                                </div>
                                <div className="landing-panel-footer">
                                    <span><Users className="size-4" /> 12 visitors today</span>
                                    <span className="landing-footer-arrow"><ArrowUpRight className="size-4" /></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="landing-footer landing-reveal landing-reveal-delay-5">
                    <span>Simple for visitors.</span> Clear for your team.
                </footer>
            </div >
        </main >
    )
}
