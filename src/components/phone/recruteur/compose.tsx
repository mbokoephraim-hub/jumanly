"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { publishAction, uploadFeedImageAction } from "@/server/actions/feed";
import { postTextSchema } from "@/server/services/feed-limits";
import { FilAvatar } from "../fil/avatar";
import { shrink } from "../fil/compose";
import type { FilMe } from "../fil/feed";
import { PostImagePicker, PostPreview, PostTextFields } from "../fil/post-fields";
import { OrbiDisc } from "../icon";
import { askOrbi } from "../orbi-bus";

const TYPES = ["texte", "offre", "evenement"] as const;
type PostType = (typeof TYPES)[number];

export type RhComposeOrg = { name: string; initials: string; logo: string | null };
export type RhComposeJob = { id: string; title: string; detail: string };

/**
 * « Nouvelle publication » of a recruiter (Modèle B recruteur, M3; docs/fil-menu-publication § 2,
 * planche Publier-recruteur): publish as oneself or, for a member who manages the offers, as the
 * company; a title and a text with their counters, an image in the Fil's shape, one of the
 * company's published offers or an event, and the preview in the Fil. Orbi may complete the text.
 */
export function PhoneRecruiterCompose({
  me,
  org,
  jobs,
  startAsOrg,
}: {
  me: FilMe;
  /** The company, only when the person may publish in its name. */
  org: RhComposeOrg | null;
  jobs: RhComposeJob[];
  startAsOrg: boolean;
}) {
  const t = useTranslations("phoneRhFil.compose");
  const router = useRouter();
  const [as, setAs] = useState<"me" | "org">(startAsOrg && org ? "org" : "me");
  const [type, setType] = useState<PostType>("texte");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<{ token: string; preview: string } | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [eventAt, setEventAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const missing = !postTextSchema.safeParse({ title, body: text }).success
    ? t("errorTitle")
    : type === "offre" && !jobId
      ? t("errorJob")
      : type === "evenement" && !eventAt
        ? t("errorEvent")
        : null;

  const choosePhoto = (file: File | undefined) => {
    if (!file) return;
    start(async () => {
      try {
        const blob = await shrink(file);
        const form = new FormData();
        form.append("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
        const result = await uploadFeedImageAction(form);
        if (!result.ok) throw new Error(result.error);
        setPhoto({ token: result.value, preview: URL.createObjectURL(blob) });
        setError(null);
      } catch {
        showToast({ message: t("photoError"), tone: "error" });
      }
    });
  };

  const publish = () => {
    if (pending) return;
    if (missing) {
      setError(missing);
      return;
    }
    start(async () => {
      const result = await publishAction({
        title,
        body: text,
        as,
        image: photo?.token,
        jobId: type === "offre" ? (jobId ?? undefined) : undefined,
        eventAt: type === "evenement" ? new Date(eventAt).toISOString() : undefined,
      });
      if (!result.ok) {
        setError(t("failed"));
        return;
      }
      showToast({ message: t("done") });
      router.replace("/app/hire");
    });
  };

  const who = [
    { key: "me" as const, name: me.name, line: t("asMe"), initials: me.initials, image: me.image },
    ...(org
      ? [
          {
            key: "org" as const,
            name: org.name,
            line: t("asOrg"),
            initials: org.initials,
            image: org.logo,
          },
        ]
      : []),
  ];

  const shown = as === "org" && org ? who[1] : who[0];
  return (
    <div className="nb-page nb-rh-pub">
      <header className="nb-barre nb-fil-pub-barre">
        <Link href="/app/hire" className="nb-fil-annuler">
          {t("cancel")}
        </Link>
        <h1>{t("title")}</h1>
      </header>
      <div className="nb-rh-pub-corps">
        <p className="nb-rh-pub-auteur">
          <FilAvatar initials={me.initials} image={me.image} tone={0} org={false} me size={36} />
          <b>{me.name}</b>
          {as === "org" && org ? (
            <span className="nb-meta">{t("onBehalf", { org: org.name })}</span>
          ) : null}
        </p>
        {org ? (
          <>
            <p className="nb-rh-pub-label" id="rh-pub-qui">
              {t("as")}
            </p>
            <div role="radiogroup" aria-labelledby="rh-pub-qui" className="nb-rh-pub-qui">
              {who.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="radio"
                  aria-checked={as === item.key}
                  className="nb-rh-pub-carte"
                  onClick={() => setAs(item.key)}
                >
                  <FilAvatar
                    initials={item.initials}
                    image={item.image}
                    tone={0}
                    org={item.key === "org"}
                    me={item.key === "me"}
                    size={44}
                  />
                  <span>
                    <b>{item.name}</b>
                    <span className="nb-meta">{item.line}</span>
                  </span>
                  <span className="nb-rh-pub-point" aria-hidden />
                </button>
              ))}
            </div>
            <p className="nb-meta nb-rh-pub-note">
              {as === "org" ? t("seenOrg", { org: org.name }) : t("seenMe", { org: org.name })}
            </p>
          </>
        ) : null}
        <PostTextFields
          id="rh-pub"
          title={title}
          body={text}
          onTitle={(value) => {
            setTitle(value);
            setError(null);
          }}
          onBody={(value) => {
            setText(value);
            setError(null);
          }}
        />
        <button
          type="button"
          className="nb-rh-orbi-ligne"
          data-orbi=""
          onClick={() =>
            askOrbi(
              title.trim() || text.trim()
                ? t("orbiAsk", { text: [title.trim(), text.trim()].filter(Boolean).join(" · ") })
                : t("orbiAskEmpty"),
            )
          }
        >
          <OrbiDisc size={24} />
          {t("orbi")}
        </button>
        <PostImagePicker
          photo={photo}
          onFile={choosePhoto}
          onRemove={() => setPhoto(null)}
          busy={pending}
        />
        <p className="nb-rh-pub-label" id="rh-pub-type">
          {t("type")}
        </p>
        <div role="radiogroup" aria-labelledby="rh-pub-type" className="nb-rh-pub-types">
          {TYPES.map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={type === key}
              className="nb-chip"
              onClick={() => {
                setType(key);
                setError(null);
              }}
            >
              {t(`types.${key}`)}
            </button>
          ))}
        </div>
        {type === "offre" ? (
          <>
            <p className="nb-rh-pub-label" id="rh-pub-offre">
              {t("job")}
            </p>
            {jobs.length === 0 ? (
              <p className="nb-meta">
                {t("noJob")}{" "}
                <Link href="/app/hire/offres/nouvelle" className="nb-lien">
                  {t("noJobLink")}
                </Link>
              </p>
            ) : (
              <div role="radiogroup" aria-labelledby="rh-pub-offre" className="nb-rh-pub-offres">
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    role="radio"
                    aria-checked={jobId === job.id}
                    className="nb-rh-pub-carte"
                    onClick={() => {
                      setJobId(job.id);
                      setError(null);
                    }}
                  >
                    <span>
                      <b>{job.title}</b>
                      <span className="nb-meta">{job.detail}</span>
                    </span>
                    <span className="nb-rh-pub-point" aria-hidden />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : null}
        {type === "evenement" ? (
          <>
            <label className="nb-rh-pub-label" htmlFor="rh-pub-date">
              {t("eventAt")}
            </label>
            <div className="nb-champ">
              <input
                id="rh-pub-date"
                type="datetime-local"
                value={eventAt}
                onChange={(event) => {
                  setEventAt(event.target.value);
                  setError(null);
                }}
              />
            </div>
          </>
        ) : null}
      </div>
      <PostPreview
        author={{
          name: shown.name,
          initials: shown.initials,
          image: shown.image,
          org: shown.key === "org",
        }}
        title={title}
        body={text}
        image={photo?.preview ?? null}
      />
      <div className="nb-bas">
        {error ? (
          <p className="nb-erreur" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          className="nb-bp"
          aria-disabled={pending || undefined}
          onClick={publish}
        >
          {t("submit")}
        </button>
      </div>
    </div>
  );
}
