/**
 * State carried between the sign-up steps (profile, plan, return path, e-mail being verified).
 * Kept in a short-lived httpOnly cookie; every value is checked again where it is used.
 */
import "server-only";
import { cookies } from "next/headers";
import { z } from "zod";
import { isSafeInternalPath } from "@/lib/signup";
import { signupProfiles } from "@/server/services/accounts";

const COOKIE = "jm_signup";
const MAX_AGE = 60 * 60 * 2;

const flowSchema = z.object({
  profile: z.enum(signupProfiles).optional().catch(undefined),
  plan: z.string().max(60).optional().catch(undefined),
  next: z.string().max(300).refine(isSafeInternalPath).optional().catch(undefined),
  email: z.string().max(200).optional().catch(undefined),
  /** Address of « Mot de passe oublié », until the new password is saved. */
  resetEmail: z.string().max(200).optional().catch(undefined),
});

export type SignupFlow = z.infer<typeof flowSchema>;

export async function readSignupFlow(): Promise<SignupFlow> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return {};
  try {
    return flowSchema.parse(JSON.parse(raw));
  } catch {
    return {};
  }
}

export async function writeSignupFlow(update: SignupFlow) {
  const store = await cookies();
  const next = { ...(await readSignupFlow()), ...update };
  store.set(COOKIE, JSON.stringify(next), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearSignupFlow() {
  (await cookies()).delete(COOKIE);
}
