"use client";

import { useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { authClient, signInWithGoogle } from "@/lib/auth-client";
import styles from "./account-controls.module.css";

export default function AccountControls() {
  const { data: session, isPending, error: sessionError, refetch } = authClient.useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      const current = new URL(window.location.href);
      const returnTo = current.pathname === "/login"
        ? current.searchParams.get("returnTo") || "/"
        : `${current.pathname}${current.search}${current.hash}`;
      const result = await signInWithGoogle(returnTo);
      if (result.error) {
        setError("Google sign-in is unavailable. Please try again.");
        setBusy(false);
      }
    } catch {
      setError("Google sign-in is unavailable. Please try again.");
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setError(null);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError("We couldn't sign you out. Please try again.");
      } else {
        await refetch();
      }
    } catch {
      setError("We couldn't sign you out. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.control}>
      {isPending ? (
        <button className={styles.button} disabled aria-label="Checking sign-in status">
          <UserRound size={15} aria-hidden="true" />
          <span>Account</span>
        </button>
      ) : session ? (
        <details className={styles.menu}>
          <summary aria-label={`Account: ${session.user.name || session.user.email}`}>
            <span className={styles.avatar} aria-hidden="true">
              {(session.user.name || session.user.email).charAt(0).toUpperCase()}
            </span>
            <span className={styles.name}>{session.user.name || "Account"}</span>
            <ChevronDown size={13} aria-hidden="true" />
          </summary>
          <div className={styles.dropdown}>
            <strong>{session.user.name || "Your account"}</strong>
            <p>{session.user.email}</p>
            <button onClick={signOut} disabled={busy}>
              <LogOut size={15} aria-hidden="true" />
              {busy ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </details>
      ) : (
        <button className={styles.button} onClick={signIn} disabled={busy} aria-label="Sign in with Google">
          <UserRound size={15} aria-hidden="true" />
          <span>{busy ? "Opening…" : "Sign in"}</span>
        </button>
      )}
      {(error || sessionError) && (
        <div className={styles.error} role="alert">
          <p>{error || "We couldn't check your sign-in status."}</p>
          {error ? (
            <button onClick={() => setError(null)}>Dismiss</button>
          ) : (
            <button onClick={() => void refetch()}>Retry</button>
          )}
        </div>
      )}
    </div>
  );
}
