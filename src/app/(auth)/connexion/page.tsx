import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EntryScreen } from "@/components/auth/entry-screen";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("login.seo");
  return pageMetadata({
    path: "/connexion",
    title: t("title"),
    description: t("description"),
    noindex: true,
  });
}

/** Sign-in (docs/refonte-connexion, replaces mockup 02-01): the entry screen on « Se connecter ». */
export default function LoginPage({ searchParams }: PageProps<"/connexion">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-nuit" />}>
      <Login searchParams={searchParams} />
    </Suspense>
  );
}

async function Login({ searchParams }: Pick<PageProps<"/connexion">, "searchParams">) {
  return <EntryScreen mode="login" params={await searchParams} />;
}
