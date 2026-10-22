"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { isSafeInternalPath } from "@/lib/signup";
import { stepHref } from "@/lib/signup-params";
import { db } from "@/server/db";
import { emailField } from "@/server/services/accounts";
import { readSignupFlow, writeSignupFlow } from "@/server/signup-flow";
import { signUp, type AuthFormState } from "./auth";

/**
 * « Créer votre compte » on the phone (Modèle B, Accueil): the e-mail first, kept in the sign-up
 * cookie, then the password (`/inscription/compte`), then the code. A talent only: a recruiter signs
 * up the same way with `profil=rh` (Modèle B recruteur, M2).
 */
export async function rememberSignupEmail(
  _: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = emailField.safeParse(formData.get("email"));
  const typed = String(formData.get("email") ?? "").slice(0, 200);
  if (!email.success)
    return { status: "invalid", errors: { email: "email" }, values: { email: typed } };
  const nextValue = String(formData.get("next") ?? "");
  const next = nextValue && isSafeInternalPath(nextValue) ? nextValue : undefined;
  const forfait = String(formData.get("forfait") ?? "").slice(0, 60);
  const plan = forfait
    ? await db.plan.findFirst({
        where: { code: forfait, family: "talent", priceCents: { gt: 0 } },
        select: { code: true },
      })
    : null;
  // A recruiter (Modèle B recruteur, M2): no plan at sign-up, the company comes at step 5.
  if (formData.get("profil") === "rh") {
    await writeSignupFlow({ profile: "rh", email: email.data, plan: undefined, next });
    redirect(stepHref("/inscription/compte", { profil: "rh", suite: next }));
  }
  await writeSignupFlow({ profile: "talent", email: email.data, plan: plan?.code, next });
  redirect(stepHref("/inscription/compte", { profil: "talent", forfait: plan?.code, suite: next }));
}

/** « grace.mbuyi » → « Grace Mbuyi »: a first name until step 1 of the profile, where it is corrected. */
function nameFromEmail(email: string, fallback: string) {
  const local = email.split("@")[0] ?? "";
  const words = local
    .split(/[._-]+/)
    .map((word) => word.replace(/[^\p{L}]/gu, ""))
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0]!.toUpperCase() + word.slice(1).toLowerCase());
  return words.length > 0 ? words.join(" ").slice(0, 80) : fallback;
}

/**
 * « Choisissez un mot de passe » (phone): the account is created with the e-mail of the first step
 * and a provisional name taken from it; « En continuant, vous acceptez » stands for the consent.
 * Then the 6-digit code, as on a computer.
 */
export async function phoneSignUp(
  state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const flow = await readSignupFlow();
  if (!flow.email) redirect("/inscription");
  const t = await getTranslations("phoneAccueil");
  formData.set("email", flow.email);
  formData.set("name", nameFromEmail(flow.email, t("profile.name.fallback")));
  if (flow.profile === "rh") {
    formData.set("profile", "rh");
    formData.set("phone", "1");
  } else formData.set("profile", "talent");
  formData.set("terms", "on");
  return signUp(state, formData);
}
