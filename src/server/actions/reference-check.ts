"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { allowAttempt, clientIp } from "@/server/rate-limit";
import { notify } from "@/server/services/notifications";
import { answerReferenceCheck, hashToken } from "@/server/services/reference-check";

const answerInput = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{20,80}$/),
  answer: z.enum(["confirm", "decline"]),
});

/**
 * The referent's answer, from the page opened by the e-mail (no account needed: the link is the
 * proof). The person is told in the app; their profile then shows « Vérifié » on the item.
 */
export async function answerReferenceAction(formData: FormData) {
  const parsed = answerInput.safeParse({
    token: formData.get("token"),
    answer: formData.get("answer"),
  });
  if (!parsed.success) redirect("/");
  const { token, answer } = parsed.data;
  const page = `/confirmer-reference/${token}`;
  if (!(await allowAttempt("referenceAnswer", (await clientIp()) ?? "inconnu")))
    redirect(`${page}?erreur=1`);
  const status = await answerReferenceCheck(db, token, answer);
  if (status === (answer === "confirm" ? "confirmed" : "declined")) {
    const check = await db.referenceCheck.findUnique({
      where: { tokenHash: hashToken(token) },
      select: {
        referentName: true,
        profile: { select: { userId: true } },
        experience: { select: { title: true } },
        education: { select: { degree: true } },
      },
    });
    if (check)
      await notify(db, {
        userIds: [check.profile.userId],
        type: status === "confirmed" ? "referenceConfirmed" : "referenceDeclined",
        payload: {
          name: check.referentName,
          item: check.experience?.title ?? check.education?.degree ?? "",
        },
        href: "/app/profil?onglet=apropos",
      }).catch((error) => console.error("[référent]", error));
  }
  redirect(`${page}?reponse=1`);
}
