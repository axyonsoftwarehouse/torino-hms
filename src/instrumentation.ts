export async function register() {
  // Garante o fuso horário do Brasil em ambientes UTC (ex.: Vercel).
  // O nome "TZ" é reservado como env var na Vercel, então fixamos aqui.
  if (!process.env.TZ) {
    process.env.TZ = "America/Sao_Paulo";
  }
}
