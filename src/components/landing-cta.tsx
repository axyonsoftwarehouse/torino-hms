"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function LandingCta() {
  // null = desconhecido (evita "flash" do botão de login)
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (active) setAuthed(Boolean(data.user));
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Link href="/app" className={buttonVariants()}>
        Entrar no painel
      </Link>
      {authed === false ? (
        <Link href="/login" className={buttonVariants({ variant: "outline" })}>
          Fazer login
        </Link>
      ) : null}
    </div>
  );
}
