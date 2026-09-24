import Link from "next/link";

import { SignupForm } from "@/components/signup-form";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  const redirectTo = redirect && redirect.startsWith("/") ? redirect : "/app";

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
