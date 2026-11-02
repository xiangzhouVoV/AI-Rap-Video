import type { Metadata } from "next";
import LoginForm from "@/components/login-form";
import { safeAuthReturnPath } from "@/lib/auth-redirect";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ returnTo?: string | string[]; error?: string | string[] }>;
}) {
  const params = await searchParams;
  return <LoginForm returnTo={safeAuthReturnPath(params.returnTo)} oauthError={params.error !== undefined} />;
}
