import AuthCallback from "@/AuthCallback";
import AircraftDetail from "@/dashboard/AircraftDetail";
import Dashboard from "@/dashboard/Dashboard";
import PartDetail from "@/dashboard/PartDetail";
import StationDetail from "@/dashboard/StationDetail";
import SupplierDetail from "@/dashboard/SupplierDetail";
import Smoke from "@/Smoke";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Dashboard />,
    },
    {
      // Drill-down from the overview. Everything on these pages is reached by
      // traversing the ontology's links out from a single object.
      path: "/aircraft/:serialNumber",
      element: <AircraftDetail />,
    },
    {
      path: "/station/:stationCode",
      element: <StationDetail />,
    },
    {
      path: "/supplier/:supplierId",
      element: <SupplierDetail />,
    },
    {
      path: "/part/:partNumber",
      element: <PartDetail />,
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
