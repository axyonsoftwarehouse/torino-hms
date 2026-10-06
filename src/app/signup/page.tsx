import Link from "next/link";
import { redirect } from "next/navigation";

import { SignupForm } from "@/components/signup-form";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { getSession } from "@/modules/core/session";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectParam } = await searchParams;
  const redirectTo = safeRedirectPath(redirectParam);

  const session = await getSession();
  if (session) redirect(redirectTo);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24">
      <SignupForm redirectTo={redirectTo} />
      <p className="text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link
          href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
          className="font-medium text-primary hover:underline"
        >
          Entrar
        </Link>
      </p>
    </main>
  );
}
