"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient, signInWithGoogle } from "@/lib/auth-client";
import styles from "./login-form.module.css";

export default function LoginForm({ returnTo, oauthError }: {
  returnTo: string;
  oauthError: boolean;
}) {
  const { data: session } = authClient.useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(oauthError
    ? "Google sign-in wasn't completed. You can try again."
    : "");

  async function signIn() {
    setBusy(true);
    setError("");
    try {
      const result = await signInWithGoogle(returnTo);
      if (result.error) {
        setError("We couldn't connect to Google sign-in. Please try again.");
        setBusy(false);
      }
    } catch {
      setError("We couldn't connect to Google sign-in. Please try again.");
      setBusy(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="login-title">
      <p className="eyebrow">YOUR ACCOUNT</p>
      <h1 id="login-title">{session ? "You're signed in." : "Sign in to airaptovideo"}</h1>
      {session ? (
        <>
          <p>Signed in as {session.user.email}.</p>
          <Link className={styles.button} href={returnTo}>Continue</Link>
        </>
      ) : (
        <>
          <p>Use your Google account to sign in securely.</p>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button className={styles.button} onClick={signIn} disabled={busy}>
            {busy ? "Opening Google…" : "Continue with Google"}
          </button>
          <Link className={styles.back} href={returnTo}>Back to the website</Link>
        </>
      )}
    </section>
  );
}
