"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const DEMO_EMAIL = "demo@torino.com.br";
const DEMO_PASSWORD = "Demo@123456";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function fillDemoCredentials() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Entrar no Torino HMS</CardTitle>
        <CardDescription>Acesse com suas credenciais.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <a href="/signup" className="font-medium text-primary hover:underline">
              Criar conta
            </a>
          </p>
        </form>
        <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">Acesso de demonstração</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fillDemoCredentials}
            >
              Usar credenciais
            </Button>
          </div>
          <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
            <div className="flex gap-2">
              <dt className="font-medium text-foreground/80">E-mail:</dt>
              <dd className="font-mono">{DEMO_EMAIL}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-foreground/80">Senha:</dt>
              <dd className="font-mono">{DEMO_PASSWORD}</dd>
            </div>
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}
