import { createElement, Fragment, lazy, Suspense, type ReactNode } from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import { PageLoader } from "@/components/feedback/PageLoader";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { useAuthStore } from "@/store/auth.store";

/**
 * Lazy-loaded pages — each chunk is only fetched when the user
 * navigates to that route, keeping the initial bundle small.
 */

const LandingPage = lazy(() => import("@/pages/LandingPage"));
const VisitorsPage = lazy(() => import("@/features/visitors/VisitorsPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const ReceptionistPage = lazy(() => import("@/pages/ReceptionistPage"));
// const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const RoleHomePage = lazy(() => import("@/pages/RoleHomePage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

// ─────────────────────────────────────────────────────────────
// Route guards
// ─────────────────────────────────────────────────────────────

/**
 * Redirects unauthenticated users to /login.
 * Wraps all protected dashboard routes.
 */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  if (!isAuthenticated) {
    return createElement(Navigate, {
      to: "/login",
      replace: true,
      state: { from: location.pathname },
    });
  }
  return createElement(Fragment, null, children);
}

/**
 * Redirects authenticated users away from auth pages.
 * Wraps login, forgot password, reset password.
 */
function GuestRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  if (user) {
    return createElement(Navigate, { to: `/${user.role}`, replace: true });
  }
  return createElement(Fragment, null, children);
}

/**
 * Wraps each lazy route in Suspense + ErrorBoundary.
 * Suspense shows PageLoader while the chunk is loading.
 * ErrorBoundary catches render errors so one broken page
 * doesn't crash the whole app.
 */
function RouteWrapper({ children }: { children: ReactNode }) {
  return createElement(
    ErrorBoundary,
    null,
    createElement(Suspense, { fallback: createElement(PageLoader) }, children),
  );
}

// ─────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────

export default function AppRouter() {
  return createElement(
    Routes,
    null,
    createElement(Route, {
      path: "/",
      element: createElement(RouteWrapper, null, createElement(LandingPage)),
    }),
    createElement(Route, {
      path: "/login",
      element: createElement(
        RouteWrapper,
        null,
        createElement(GuestRoute, null, createElement(LoginPage)),
      ),
    }),
    createElement(Route, {
      path: "/book-appointment",
      element: createElement(RouteWrapper, null, createElement(VisitorsPage)),
    }),
    // Public registration is disabled; admins create internal accounts.
    createElement(Route, {
      path: "/admin",
      element: createElement(
        RouteWrapper,
        null,
        createElement(ProtectedRoute, null, createElement(AdminPage)),
      ),
    }),
    createElement(Route, {
      path: "/host",
      element: createElement(
        RouteWrapper,
        null,
        createElement(
          ProtectedRoute,
          null,
          createElement(RoleHomePage, { role: "host" }),
        ),
      ),
    }),
    createElement(Route, {
      path: "/receptionist",
      element: createElement(
        RouteWrapper,
        null,
        createElement(ProtectedRoute, null, createElement(ReceptionistPage)),
      ),
    }),
    createElement(Route, {
      path: "*",
      element: createElement(RouteWrapper, null, createElement(NotFoundPage)),
    }),
  );
}
