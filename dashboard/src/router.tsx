import AuthCallback from "@/AuthCallback";
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
