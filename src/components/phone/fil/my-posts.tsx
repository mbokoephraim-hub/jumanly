"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PhoneBack } from "../back";
import type { PostView } from "./data";
import { PostCard, type PostSheet } from "./post";
import { PostSheets, type SendTarget } from "./sheets";

/** « Mes publications »: the person's posts, each with « ··· » to change or delete it. */
export function MyPosts({ posts, targets }: { posts: PostView[]; targets: SendTarget[] }) {
  const t = useTranslations("phoneFil");
  const [open, setOpen] = useState<{ post: PostView; sheet: PostSheet } | null>(null);
  const [gone, setGone] = useState<string[]>([]);
  const shown = posts.filter((post) => !gone.includes(post.id));
  return (
    <div className="nb-page nb-fil">
      <header className="nb-barre">
        <PhoneBack fallback="/app" label={t("detail.back")} text={t("detail.back")} />
        <h1>{t("mine.title")}</h1>
      </header>
      <p className="nb-meta nb-fil-mes-aide">{t("mine.hint")}</p>
      {shown.length === 0 ? (
        <p className="nb-vide">
          {t("profileNoPosts")} <Link href="/app/fil/publier">{t("mine.write")}</Link>
        </p>
      ) : null}
      {shown.map((post) => (
        <PostCard
          key={post.key}
          post={post}
          from="mes-publications"
          onSheet={(target, sheet) => setOpen({ post: target, sheet })}
        />
      ))}
      <PostSheets
        post={open?.post ?? null}
        sheet={open?.sheet ?? null}
        onSheet={(sheet) => setOpen((current) => (current ? { ...current, sheet } : current))}
        onClose={() => setOpen(null)}
        onHidden={(post) => setGone((current) => [...current, post.id])}
        targets={targets}
      />
    </div>
  );
}
