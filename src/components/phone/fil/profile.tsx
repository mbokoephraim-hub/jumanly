"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PhoneBack } from "../back";
import { PhoneIcon } from "../icon";
import { FilAvatar } from "./avatar";
import type { AuthorView, PostView } from "./data";
import { PostCard, type PostSheet } from "./post";
import { PostSheets, type SendTarget } from "./sheets";

/**
 * The page of a person or an organization reached from the Fil (lot B3): who they are, their
 * offers for an organization, and their posts. Lot B4 draws the full profiles (rangées 09-10).
 */
export function FilProfile({
  author,
  posts,
  offers,
  message,
  targets,
}: {
  author: AuthorView;
  posts: PostView[];
  offers: { href: string; title: string; line: string }[];
  /** The conversation with this person, once the connection is accepted. */
  message: string | null;
  targets: SendTarget[];
}) {
  const t = useTranslations("phoneFil");
  const [open, setOpen] = useState<{ post: PostView; sheet: PostSheet } | null>(null);
  const [gone, setGone] = useState<string[]>([]);
  return (
    <div className="nb-page nb-fil nb-fil-profil-ecran">
      <header className="nb-barre">
        <PhoneBack fallback="/app" label={t("detail.back")} text={t("detail.back")} />
        <h1>{author.name}</h1>
      </header>
      <div className="nb-fil-grand-tete nb-fil-profil-tete">
        <FilAvatar {...author} size={64} />
        <span className="nb-fil-grand-nom">
          <b className="nb-fil-nom">{author.name}</b>
          <span className="nb-meta">{author.line}</span>
        </span>
      </div>
      {message ? (
        <Link
          href={`/app/messages/${message}`}
          className="nb-bouton nb-fil-message"
          data-contour=""
        >
          <PhoneIcon name="messages" size={20} />
          {t("profileMessage")}
        </Link>
      ) : null}
      {offers.length > 0 ? (
        <section aria-labelledby="fil-offres">
          <h2 id="fil-offres" className="nb-sec">
            {t("profileOffers")}
          </h2>
          {offers.map((offer) => (
            <Link key={offer.href} href={offer.href} className="nb-ligne">
              <span className="nb-ligne-texte">
                <b>{offer.title}</b>
                <small>{offer.line}</small>
              </span>
              <PhoneIcon name="chevron" size={18} />
            </Link>
          ))}
        </section>
      ) : null}
      <section aria-labelledby="fil-publications">
        <h2 id="fil-publications" className="nb-sec">
          {t("profilePosts")}
        </h2>
        {posts.length === 0 ? <p className="nb-vide">{t("profileNoPosts")}</p> : null}
        {posts
          .filter((post) => !gone.includes(post.id))
          .map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onSheet={(target, sheet) => setOpen({ post: target, sheet })}
            />
          ))}
      </section>
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
