"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  acceptConnection,
  blockConnection,
  ConnectionError,
  ignoreConnection,
  removeConnection,
  requestConnection,
} from "@/server/services/connections";

const PAGE = "/app/compte/connexions";

const id = (value: FormDataEntryValue | null) => {
  const text = String(value ?? "");
  return /^[\w-]{1,60}$/.test(text) ? text : "";
};

function back(params: Record<string, string>): never {
  redirect(`${PAGE}?${new URLSearchParams(params)}`);
}

async function run(
  formData: FormData,
  task: (userId: string, target: string) => Promise<unknown>,
  ok: string,
  tab?: string,
) {
  const user = await requireUser(PAGE);
  const target = id(formData.get("id"));
  const view: Record<string, string> = tab ? { onglet: tab } : {};
  try {
    if (!target) throw new ConnectionError("notFound");
    await task(user.id, target);
  } catch (error) {
    if (error instanceof ConnectionError) back({ ...view, erreur: error.code });
    throw error;
  }
  back({ ...view, ok });
}

/** « Se connecter » from the search: a request, or an acceptance if they already asked me. */
export async function requestConnectionAction(formData: FormData) {
  const user = await requireUser(PAGE);
  const target = id(formData.get("id"));
  let result: Awaited<ReturnType<typeof requestConnection>>;
  try {
    if (!target) throw new ConnectionError("notFound");
    result = await requestConnection(db, user.id, target);
  } catch (error) {
    if (error instanceof ConnectionError) back({ erreur: error.code });
    throw error;
  }
  back({ ok: result === "accepted" ? "acceptee" : result === "already" ? "deja" : "envoyee" });
}

export async function acceptConnectionAction(formData: FormData) {
  await run(
    formData,
    (userId, target) => acceptConnection(db, userId, target),
    "acceptee",
    "demandes",
  );
}

export async function ignoreConnectionAction(formData: FormData) {
  await run(
    formData,
    (userId, target) => ignoreConnection(db, userId, target),
    "ignoree",
    "demandes",
  );
}

export async function removeConnectionAction(formData: FormData) {
  await run(formData, (userId, target) => removeConnection(db, userId, target), "retiree");
}

export async function blockConnectionAction(formData: FormData) {
  await run(formData, (userId, target) => blockConnection(db, userId, target), "bloquee");
}
