"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth/session";
import { requireHire } from "@/server/hire-context";
import { mailVerificationRequest } from "@/server/hire-emails";
import { reportError } from "@/server/observability";
import { HireError } from "@/server/services/hire";
import {
  piecesHref,
  requestPieces,
  requestSchema,
  submitPiece,
  submitSchema,
  VerificationError,
  verificationPieces,
} from "@/server/services/hire-verification";
import { fileStorage } from "@/server/storage";

/**
 * « Dossier de vérification ». Order of CLAUDE.md: validate → session → role and right
 * (« Trier ») → service. The e-mails leave after the messages are written; a failed e-mail never
 * undoes a request.
 */

const id = (value: FormDataEntryValue | null) => String(value ?? "").slice(0, 60);
const pageOf = (jobId: string) => `/app/hire/offres/${jobId}/verification`;

export async function requestPiecesAction(formData: FormData) {
  const jobId = id(formData.get("job"));
  const due = String(formData.get("due") ?? "");
  const input = requestSchema.safeParse({
    applicationIds: formData.getAll("ids").map(id).filter(Boolean),
    pieces: verificationPieces
      .filter((kind) => formData.get(`piece-${kind}`) === "on")
      .map((kind) => ({ kind, required: formData.get(`required-${kind}`) === "on" })),
    dueAt: /^\d{4}-\d{2}-\d{2}$/.test(due) ? new Date(`${due}T23:59:00Z`) : undefined,
    message: String(formData.get("message") ?? ""),
  });
  if (!input.success || !jobId) redirect(`${pageOf(jobId)}?erreur=formulaire`);
  const { ctx } = await requireHire("/app/hire/offres", "manage", "sort");
  let sent: Awaited<ReturnType<typeof requestPieces>>;
  try {
    const t = await getTranslations("phoneRhPieces");
    const format = await getFormatter();
    sent = await requestPieces(db, ctx, jobId, input.data, t("mailDocumentName"), (values) =>
      t("ask.template", {
        company: values.company,
        jobTitle: values.jobTitle,
        date: format.dateTime(values.dueAt, { day: "numeric", month: "long" }),
      }),
    );
  } catch (error) {
    if (error instanceof HireError) redirect(`${pageOf(jobId)}?erreur=formulaire`);
    throw error;
  }
  await Promise.all(
    sent.map((item) =>
      mailVerificationRequest(item.talent, {
        company: item.company,
        jobTitle: item.jobTitle,
        date: item.dueAt,
        href: piecesHref(item.applicationId),
      }).catch((error) => reportError(error)),
    ),
  );
  refresh();
  redirect(`${pageOf(jobId)}?envoye=${sent.length}`);
}

export async function submitPieceAction(formData: FormData) {
  const applicationId = id(formData.get("application"));
  const back = piecesHref(applicationId);
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  };
  const input = submitSchema.safeParse({
    itemId: text("item"),
    certificateCode: text("certificate"),
    educationId: text("education"),
    referentName: text("referentName"),
    referentEmail: text("referentEmail"),
    note: text("note"),
  });
  if (!input.success) redirect(`${back}?erreur=formulaire`);
  const user = await requireUser(back);
  const upload = formData.get("file");
  const file =
    upload instanceof File && upload.size > 0
      ? { name: upload.name, bytes: new Uint8Array(await upload.arrayBuffer()) }
      : null;
  try {
    await submitPiece(db, fileStorage(db), user.id, { ...input.data, file });
  } catch (error) {
    if (error instanceof VerificationError) redirect(`${back}?erreur=${error.code}`);
    throw error;
  }
  refresh();
  redirect(`${back}?ok=1`);
}
