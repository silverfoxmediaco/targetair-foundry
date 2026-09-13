import AuthCallback from "@/AuthCallback";
import AircraftDetail from "@/dashboard/AircraftDetail";
import Dashboard from "@/dashboard/Dashboard";
import Smoke from "@/Smoke";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Dashboard />,
    },
    {
      // Drill-down from the overview. Everything on this page is reached by
      // traversing the ontology's links out from a single Aircraft object.
      path: "/aircraft/:serialNumber",
      element: <AircraftDetail />,
    },
    {
      // Connectivity check. Exercises $link traversal one object at a time,
      // which the dashboard deliberately does not do.
      path: "/smoke",
      element: <Smoke />,
    },
    {
      // This is the route defined in your application's redirect URL
      path: "/auth/callback",
      element: <AuthCallback />,
    },
  ],
  { basename: import.meta.env.BASE_URL },
);
