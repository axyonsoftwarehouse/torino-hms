import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          SaaS multi-tenant para saúde
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Torino HMS</h1>
        <p className="mx-auto max-w-xl text-balance text-muted-foreground">
          Gestão hospitalar e clínica modular. Um núcleo para clínicas, laboratórios,
          consultórios odontológicos e hospitais — cada um habilitando só os módulos
          que precisa.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/app" className={buttonVariants()}>
          Entrar no painel
        </Link>
        <Link href="/login" className={buttonVariants({ variant: "outline" })}>
          Fazer login
        </Link>
      </div>
    </main>
  );
}
