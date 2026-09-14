import { signIn } from "@/client";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Component to render at `/auth/callback`
 * This calls signIn() again to save the token, and then navigates the user to the dashboard. Not to "/", which is
 * the public landing page — arriving back there after signing in reads as
 * the sign-in having failed.
 */
function AuthCallback(): React.ReactElement {
  const [error, setError] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  // This effect conflicts with React 18 strict mode in development
  // https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development
  useEffect(() => {
    signIn()
      .then(() => navigate("/dashboard", { replace: true }))
      .catch((e: unknown) => {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError(String(e));
        }
      });
  }, [navigate]);
  return <div>{error != null ? error : "Authenticating…"}</div>;
}

export default AuthCallback;
