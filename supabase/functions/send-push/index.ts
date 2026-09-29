// Sends Web Push alerts for one class to every enrolled student's devices.
// Called only by the database (see the push_alerts migration) with a shared
// secret; deploy with verify_jwt disabled because the caller is not a user.
//
// Body: { aula_id: string, kind: "live" | "reminder" }

import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import webpush from "npm:web-push@3.6.7";

type Kind = "live" | "reminder";

const TZ = "America/Sao_Paulo";

function message(kind: Kind, aula: { type: string; title: string; start_at: string }, turma: string) {
  const time = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(
    new Date(aula.start_at),
  );
  if (kind === "reminder") {
    return { title: "Sua aula começa em 10 minutos", body: `${turma} · ${time} · Toque para entrar.` };
  }
  if (aula.type === "lightning") {
    return { title: "Aula relâmpago começou!", body: `${turma} · Toque para entrar.` };
  }
  return { title: "Sua aula já vai começar!", body: `${turma} · ${time} · Toque para entrar.` };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const { data: config, error: configError } = await db.rpc("push_config").single();
  if (configError || !config) return new Response("Push is not configured", { status: 500 });
  if (req.headers.get("x-push-secret") !== config.push_secret) return new Response("Forbidden", { status: 403 });

  let body: { aula_id?: string; kind?: Kind };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }
  const kind: Kind = body.kind === "reminder" ? "reminder" : "live";
  if (!body.aula_id) return new Response("aula_id is required", { status: 400 });

  const { data: aula } = await db
    .from("aulas")
    .select("id, type, title, start_at, meet_link, status, turma_id, turmas(name)")
    .eq("id", body.aula_id)
    .maybeSingle();
  if (!aula || aula.status === "ended") return Response.json({ sent: 0, skipped: "class not found or ended" });

  const { data: enrolled } = await db.from("enrollments").select("person_id").eq("turma_id", aula.turma_id);
  const people = (enrolled ?? []).map((e) => e.person_id);
  if (!people.length) return Response.json({ sent: 0 });

  const { data: subs } = await db
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("person_id", people);

  webpush.setVapidDetails(config.vapid_subject, config.vapid_public_key, config.vapid_private_key);
  const turmaName = (aula.turmas as { name: string } | null)?.name ?? "";
  const payload = JSON.stringify({
    ...message(kind, aula, turmaName),
    url: aula.meet_link,
    // One notification per class: a re-sent alert replaces the previous one.
    tag: aula.id,
  });

  const ok: string[] = [];
  const gone: string[] = [];
  let failed = 0;
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
          TTL: kind === "reminder" ? 600 : 3600,
          urgency: "high",
        });
        ok.push(s.id);
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        // The device unsubscribed or the subscription expired.
        if (status === 404 || status === 410) gone.push(s.id);
        else failed++;
      }
    }),
  );

  if (ok.length) await db.from("push_subscriptions").update({ last_ok_at: new Date().toISOString() }).in("id", ok);
  if (gone.length) await db.from("push_subscriptions").delete().in("id", gone);

  return Response.json({ sent: ok.length, removed: gone.length, failed });
});
