export const endpoints = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    me: "/auth/me",
  },
  admin: {
    createHost: "/admin/hosts",
    createReceptionist: "/admin/receptionists",
  },
  host: {
    appointments: "/hosts/me/appointments",
    notifications: "/hosts/me/notifications",
    decideAppointment: (id: string) => `/hosts/me/appointments/${id}/decision`,
  },
  visitor: {
    getVisitors: "/visitors",
    createVisitor: "/visitors",
    approveVisitor: (id: string) => `/visitors/approve/${id}`,
    rejectVisitor: (id: string) => `/visitors/reject/${id}`,
    checkVisitor: "/visitors/checkUser",
    visitorReport: "/visitors/report",
    scanCheckIn: "/visitors/scan-checkin",
    scanCheckOut: "/visitors/scan-checkout",
    receptionistVisitors: "/visitors/reception/visitors",
    receptionistBookings: "/visitors/reception/bookings",
    manualCheckIn: (id: string) =>
      `/visitors/reception/visitors/${id}/check-in`,
    manualCheckOut: (id: string) =>
      `/visitors/reception/visitors/${id}/check-out`,
  },
} as const;
