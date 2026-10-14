import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthCard, AuthHeading, SignupFooter, SignupStepper } from "@/components/auth/auth-card";
import { VerifyEmailForm } from "@/components/auth/forms";
import { Skeleton } from "@/components/ui";
import { interpolate, slot } from "@/lib/interpolate";
import { CODE_DIGITS } from "@/lib/password";
import { pageMetadata } from "@/lib/seo";
import { db } from "@/server/db";
import { readSignupFlow } from "@/server/signup-flow";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signup.verify");
  return pageMetadata({
    path: "/inscription/verification",
    title: t("seo.title"),
    description: t("title"),
    noindex: true,
  });
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] w-full max-w-[520px] rounded-card" />}>
      <VerifyStep />
    </Suspense>
  );
}

/** Step 4 · the 6-digit code sent by e-mail, valid 15 minutes, 5 attempts (mockup 02-07). */
async function VerifyStep() {
  const flow = await readSignupFlow();
  if (!flow.email) redirect("/inscription");
  const t = await getTranslations("signup");
  const plan = flow.plan
    ? await db.plan.findUnique({ where: { code: flow.plan }, select: { priceCents: true } })
    : null;
  return (
    <AuthCard className="jm-rise lg:pt-16">
      <SignupStepper current="verify" paid={Boolean(plan?.priceCents)} />
      <AuthHeading
        icon="message"
        title={t("verify.title")}
        subtitle={interpolate(t("verify.subtitle", { digits: CODE_DIGITS, email: slot("email") }), {
          email: <strong className="font-semibold text-sapin">{flow.email}</strong>,
        })}
      />
      <VerifyEmailForm email={flow.email} />
      <SignupFooter back="/inscription" />
    </AuthCard>
  );
}
