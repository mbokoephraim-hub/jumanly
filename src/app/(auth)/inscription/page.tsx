import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EntryScreen } from "@/components/auth/entry-screen";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signup.profile.seo");
  return pageMetadata({ path: "/inscription", title: t("title"), description: t("description") });
}

/**
 * Sign-up, step 1 (docs/refonte-connexion, replaces mockup 02-04): the entry screen on « Créer un
 * compte », with « Vous êtes » and the e-mail. « Continuer » leads to the plan step.
 */
export default function SignupEntryPage({ searchParams }: PageProps<"/inscription">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-nuit" />}>
      <SignupEntry searchParams={searchParams} />
    </Suspense>
  );
}

async function SignupEntry({ searchParams }: Pick<PageProps<"/inscription">, "searchParams">) {
  return <EntryScreen mode="signup" params={await searchParams} />;
}
