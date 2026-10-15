/**
 * Authentication (docs/specifications.md, partie 10 § 10.1) with Better Auth:
 * e-mail + password (10 characters minimum, leaked passwords refused outside local and preview),
 * 6-digit e-mail code valid 15 minutes with 5 attempts, magic link, Google when configured,
 * 30-day sliding sessions in httpOnly cookies, e-mail two-step verification, rate limits.
 */
import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { emailOTP, haveIBeenPwned, magicLink, twoFactor } from "better-auth/plugins";
import { isInternalEnv } from "@/lib/env";
import { siteUrl } from "@/lib/seo";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/password";
import {
  LINK_MINUTES,
  OTP_MINUTES,
  RESET_MINUTES,
  sendMagicLink,
  sendPasswordChanged,
  sendResetPassword,
  sendVerificationCode,
} from "@/server/account-emails";
import { db } from "@/server/db";
import { bootstrapAdminIfListed } from "@/server/services/admin-bootstrap";

const DAY = 60 * 60 * 24;

async function firstNameOf(email: string) {
  const user = await db.user.findUnique({ where: { email }, select: { firstName: true } });
  return user?.firstName ?? null;
}

export const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

/** Providers offered on the entry screen, in the order of its buttons. */
export function enabledProviders() {
  return googleEnabled ? (["google"] as const) : [];
}

export const auth = betterAuth({
  appName: "Jumanly",
  baseURL: process.env.BETTER_AUTH_URL || siteUrl(),
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    minPasswordLength: PASSWORD_MIN,
    maxPasswordLength: PASSWORD_MAX,
    resetPasswordTokenExpiresIn: RESET_MINUTES * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPassword(user.email, url, await firstNameOf(user.email));
    },
    onPasswordReset: async ({ user }) => {
      await sendPasswordChanged(user.email, await firstNameOf(user.email), new Date());
    },
  },
  emailVerification: { autoSignInAfterVerification: true },
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          prompt: "select_account",
        },
      }
    : {},
  account: { accountLinking: { enabled: true, trustedProviders: ["google"] } },
  session: { expiresIn: 30 * DAY, updateAge: DAY },
  user: {
    additionalFields: {
      firstName: { type: "string", required: false },
      lastName: { type: "string", required: false },
      country: { type: "string", required: false },
      city: { type: "string", required: false },
      newsletter: { type: "boolean", required: false, defaultValue: false },
      aiConsentAt: { type: "date", required: false },
      termsAcceptedAt: { type: "date", required: false },
      // Never settable from a sign-up form.
      platformRole: { type: "string", required: false, input: false, defaultValue: "user" },
      status: { type: "string", required: false, input: false, defaultValue: "active" },
    },
  },
  databaseHooks: {
    session: {
      create: {
        // A suspended account cannot sign in; signing in again cancels a scheduled deletion.
        // The address named in ADMIN_BOOTSTRAP_EMAIL becomes administrator on its first sign-in.
        before: async (session) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: {
              id: true,
              email: true,
              emailVerified: true,
              platformRole: true,
              status: true,
              deletionScheduledAt: true,
            },
          });
          if (user?.status === "suspended") return false;
          if (user) await bootstrapAdminIfListed(db, user);
          if (user?.deletionScheduledAt) {
            await db.user.update({
              where: { id: session.userId },
              data: { deletionScheduledAt: null },
            });
          }
          return { data: session };
        },
      },
    },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 15 * 60, max: 10 },
      "/sign-up/email": { window: 60 * 60, max: 10 },
      "/request-password-reset": { window: 15 * 60, max: 5 },
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      "/sign-in/magic-link": { window: 15 * 60, max: 5 },
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: OTP_MINUTES * 60,
      allowedAttempts: 5,
      storeOTP: "hashed",
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      sendVerificationOTP: async ({ email, otp }) => {
        await sendVerificationCode(email, otp, await firstNameOf(email));
      },
    }),
    magicLink({
      expiresIn: LINK_MINUTES * 60,
      // A magic link never creates an account: sign-up goes through the 6 steps.
      disableSignUp: true,
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLink(email, url, await firstNameOf(email));
      },
    }),
    twoFactor({
      issuer: "Jumanly",
      skipVerificationOnEnable: true,
      otpOptions: {
        period: OTP_MINUTES,
        sendOTP: async ({ user, otp }) => {
          await sendVerificationCode(user.email, otp, await firstNameOf(user.email));
        },
      },
    }),
    ...(isInternalEnv() ? [] : [haveIBeenPwned()]),
    nextCookies(),
  ],
});

export type Auth = typeof auth;
