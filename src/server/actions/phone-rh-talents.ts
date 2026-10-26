"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import {
  acceptConnection,
  ConnectionError,
  ignoreConnection,
  requestConnection,
} from "@/server/services/connections";
import { HireError } from "@/server/services/hire";
import { hideSuggestion, shareTalent } from "@/server/services/hire-phone-talents";
import { createReport } from "@/server/services/moderation";
import {
  addToPool,
  createContactRequest,
  createPool,
  deletePool,
  poolChoices,
  remindProposal,
  removeFromPool,
  renamePool,
} from "@/server/services/talent-search";

const id = (value: FormDataEntryValue | null) => {
  const text = String(value ?? "");
  return /^[\w-]{1,60}$/.test(text) ? text : "";
};
const TAB = "/app/hire/talents";
const profileOf = (profileId: string) => `${TAB}/${profileId}`;

/** « Envoyer la proposition » (planche 112): the talent decides; applying stays free for them. */
export async function rhProposeTalentAction(formData: FormData) {
  const { ctx } = await requireHire(TAB, "manage");
  const profile = id(formData.get("profile"));
  const result = await createContactRequest(db, ctx, {
    profile,
    job: id(formData.get("job")),
    message: String(formData.get("message") ?? ""),
  });
  if (result.status === "sent") redirect(`${profileOf(profile)}?ok=proposee`);
  const known = ["quota", "locked", "pending", "cooldown", "blocked", "connected", "invalid"];
  redirect(
    `${profileOf(profile)}?erreur=${known.includes(result.status) ? result.status : "other"}`,
  );
}

/**
 * « Enregistrer » of « Ajouter … au vivier » (planche 113): the lists ticked keep the talent, the
 * others no longer do; a new list's name creates it with the talent in it.
 */
export async function rhSavePoolsAction(formData: FormData) {
  const { ctx } = await requireHire(TAB, "manage");
  const profile = id(formData.get("profile"));
  const ticked = new Set(formData.getAll("pool").map((value) => id(value)));
  const name = String(formData.get("nouvelle") ?? "").trim();
  try {
    const choices = (await poolChoices(db, ctx, profile)) ?? [];
    for (const choice of choices) {
      if (ticked.has(choice.id) && !choice.has) await addToPool(db, ctx, choice.id, profile);
      if (!ticked.has(choice.id) && choice.has) await removeFromPool(db, ctx, choice.id, profile);
    }
    if (name) {
      const pool = await createPool(db, ctx, { name });
      await addToPool(db, ctx, pool.id, profile);
    }
  } catch (error) {
    if (error instanceof HireError) redirect(`${profileOf(profile)}?erreur=other`);
    throw error;
  }
  redirect(`${profileOf(profile)}?ok=vivier`);
}

/** « Nouvelle liste » of the tab Vivier (planche 104): a personal list. */
export async function rhCreatePoolAction(formData: FormData) {
  const { ctx } = await requireHire(TAB, "manage");
  try {
    await createPool(db, ctx, { name: String(formData.get("name") ?? "") });
  } catch (error) {
    if (error instanceof HireError) redirect(`${TAB}?onglet=vivier&erreur=other`);
    throw error;
  }
  redirect(`${TAB}?onglet=vivier&ok=liste`);
}

/** « Retirer … de la liste » (planche 105). */
export async function rhRemoveFromPoolAction(formData: FormData) {
  const { ctx } = await requireHire(TAB, "manage");
  const pool = id(formData.get("pool"));
  try {
    await removeFromPool(db, ctx, pool, id(formData.get("profile")));
  } catch (error) {
    if (error instanceof HireError) redirect(`/app/hire/viviers/${pool}?erreur=other`);
    throw error;
  }
  redirect(`/app/hire/viviers/${pool}?ok=retire`);
}

/** « Enregistrer le nom » of the list's options. */
export async function rhRenamePoolAction(formData: FormData) {
  const { ctx } = await requireHire(TAB, "manage");
  const pool = id(formData.get("pool"));
  try {
    await renamePool(db, ctx, pool, String(formData.get("name") ?? "").slice(0, 80));
  } catch (error) {
    if (error instanceof HireError) redirect(`/app/hire/viviers/${pool}?erreur=other`);
    throw error;
  }
  redirect(`/app/hire/viviers/${pool}?ok=renomme`);
}

/** « Supprimer la liste »: the list goes, the talents and their profiles stay. */
export async function rhDeletePoolAction(formData: FormData) {
  const { ctx } = await requireHire(TAB, "manage");
  const pool = id(formData.get("pool"));
  try {
    await deletePool(db, ctx, pool);
  } catch (error) {
    if (error instanceof HireError) redirect(`/app/hire/viviers/${pool}?erreur=other`);
    throw error;
  }
  redirect(`${TAB}?onglet=vivier&ok=supprime`);
}

/** « Masquer ce profil de mes suggestions » (planche 114). */
export async function rhHideTalentAction(formData: FormData) {
  const { ctx } = await requireHire(TAB, "manage");
  const profile = id(formData.get("profile"));
  try {
    await hideSuggestion(db, ctx, profile);
  } catch (error) {
    if (error instanceof HireError) redirect(`${profileOf(profile)}?erreur=other`);
    throw error;
  }
  redirect(`${TAB}?ok=masque`);
}

/** « Partager le profil à un collègue » (planche 114). */
export async function rhShareTalentAction(formData: FormData) {
  const { ctx } = await requireHire(TAB, "readApplications");
  const profile = id(formData.get("profile"));
  try {
    await shareTalent(db, ctx, profile, id(formData.get("member")));
  } catch (error) {
    if (error instanceof HireError) redirect(`${profileOf(profile)}?erreur=other`);
    throw error;
  }
  redirect(`${profileOf(profile)}?ok=partage`);
}

const reasons = z.enum(["impersonation", "inappropriate", "spam", "harassment", "other"]);

/** « Signaler ce profil » (planche 114): the moderation queue; the talent never learns who. */
export async function rhReportTalentAction(formData: FormData) {
  const { user } = await requireHire(TAB, "readApplications");
  const profile = id(formData.get("profile"));
  const reason = reasons.safeParse(formData.get("reason"));
  if (!profile || !reason.success) redirect(`${profileOf(profile)}?erreur=other`);
  const result = await createReport(db, user.id, {
    targetType: "profile",
    targetId: profile,
    reason: reason.data,
  });
  if (result === "notFound") redirect(`${profileOf(profile)}?erreur=other`);
  redirect(`${profileOf(profile)}?ok=signale`);
}

const back = (value: FormDataEntryValue | null) => {
  const text = String(value ?? "");
  return text.startsWith(`${TAB}`) && !text.includes("//") ? text.split("?")[0]! : TAB;
};

/** « Se connecter » (planches 106 and 108): a request between two people, never a candidature. */
export async function rhConnectAction(formData: FormData) {
  const { user } = await requireHire(TAB, "readApplications");
  const page = back(formData.get("retour"));
  const tab = page === TAB ? "onglet=reseau&" : "";
  try {
    await requestConnection(db, user.id, id(formData.get("id")));
  } catch (error) {
    if (error instanceof ConnectionError) redirect(`${page}?${tab}erreur=other`);
    throw error;
  }
  redirect(`${page}?${tab}ok=invitation`);
}

/** « Accepter » or « × » of « Invitations reçues » (planche 106). */
export async function rhAnswerInvitationAction(formData: FormData) {
  const { user } = await requireHire(TAB, "readApplications");
  const accept = formData.get("answer") === "accept";
  try {
    if (accept) await acceptConnection(db, user.id, id(formData.get("id")));
    else await ignoreConnection(db, user.id, id(formData.get("id")));
  } catch (error) {
    if (error instanceof ConnectionError) redirect(`${TAB}?onglet=reseau&erreur=other`);
    throw error;
  }
  redirect(`${TAB}?onglet=reseau&ok=${accept ? "relation" : "ignoree"}`);
}

/** « Relancer » a proposal that waits (planche 107), once. */
export async function rhRemindProposalAction(formData: FormData) {
  const { ctx } = await requireHire(TAB, "manage");
  const done = await remindProposal(db, ctx, id(formData.get("id")));
  redirect(`${TAB}?onglet=propositions&${done ? "ok=relance" : "erreur=other"}`);
}
