import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { getSession } from "@/modules/core/session";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectParam } = await searchParams;
  const target = safeRedirectPath(redirectParam);

  // Usuário já autenticado não deve ver a tela de login.
  const session = await getSession();
  if (session) redirect(target);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <LoginForm redirectTo={target} />
    </main>
  );
}
