"use client";

import { createAuthClient } from "better-auth/react";
import { safeAuthReturnPath } from "./auth-redirect";

// The browser always uses the public same-origin /api/auth endpoint.
export const authClient = createAuthClient({
  basePath: "/api/auth",
  fetchOptions: { credentials: "include", cache: "no-store" },
});

export async function signInWithGoogle(returnTo: string) {
  const path = safeAuthReturnPath(returnTo);
  return authClient.signIn.social({
    provider: "google",
    callbackURL: `${window.location.origin}${path}`,
    errorCallbackURL: `${window.location.origin}/login?returnTo=${encodeURIComponent(path)}`,
  });
}
