"use client";

/* eslint-disable @next/next/no-img-element -- the photo just chosen, shown before sending */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { publishAction, uploadFeedImageAction } from "@/server/actions/feed";
import { FEED_POST_MAX } from "@/server/services/feed-limits";
import { FilAvatar } from "../fil/avatar";
import { shrink } from "../fil/compose";
import type { FilMe } from "../fil/feed";
import { OrbiDisc, PhoneIcon } from "../icon";
import { askOrbi } from "../orbi-bus";

const TYPES = ["texte", "photo", "offre", "evenement"] as const;
type PostType = (typeof TYPES)[number];

export type RhComposeOrg = { name: string; initials: string; logo: string | null };
export type RhComposeJob = { id: string; title: string; detail: string };

/**
 * « Nouvelle publication » of a recruiter (Modèle B recruteur, M3, planches Recruteur-fil-publier
 * and -publier-baobab): publish as oneself or, for a member who manages the offers, as the company;
 * a text, a photo, one of the company's published offers or an event; Orbi may complete the text.
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
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<{ token: string; preview: string } | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [eventAt, setEventAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const missing =
    type === "photo" && !photo
      ? t("errorPhoto")
      : type === "offre" && !jobId
        ? t("errorJob")
        : type === "evenement" && !eventAt
          ? t("errorEvent")
          : !text.trim() && type !== "photo" && type !== "offre"
            ? t("errorText")
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
        body: text,
        as,
        image: type === "photo" ? photo?.token : undefined,
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

  return (
    <div className="nb-page nb-rh-pub">
      <header className="nb-rh-pub-barre">
        <Link href="/app/hire" className="nb-rond" aria-label={t("close")}>
          <PhoneIcon name="fermer" size={22} />
        </Link>
        <h1>{t("title")}</h1>
      </header>
      <div className="nb-rh-pub-corps">
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
                if (key === "photo" && !photo) input.current?.click();
              }}
            >
              {t(`types.${key}`)}
            </button>
          ))}
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(event) => {
              choosePhoto(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
        <div className="nb-rh-pub-label nb-rh-pub-ligne">
          <label htmlFor="rh-pub-texte">{t("text")}</label>
          <span
            className="nb-meta"
            data-plein={text.length >= FEED_POST_MAX ? "" : undefined}
            aria-live="polite"
          >
            {t("count", { count: text.length, max: FEED_POST_MAX })}
          </span>
        </div>
        <div className="nb-champ nb-rh-pub-texte">
          <textarea
            id="rh-pub-texte"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setError(null);
            }}
            placeholder={t("placeholder")}
            maxLength={FEED_POST_MAX}
            rows={4}
          />
        </div>
        <button
          type="button"
          className="nb-rh-orbi-ligne"
          data-orbi=""
          onClick={() =>
            askOrbi(text.trim() ? t("orbiAsk", { text: text.trim() }) : t("orbiAskEmpty"))
          }
        >
          <OrbiDisc size={24} />
          {t("orbi")}
        </button>
        {type === "photo" ? (
          photo ? (
            <span className="nb-fil-pj-photo nb-rh-pub-photo">
              <img src={photo.preview} alt={t("photoAlt")} />
              <button
                type="button"
                className="nb-rond"
                aria-label={t("photoRemove")}
                onClick={() => setPhoto(null)}
              >
                <PhoneIcon name="fermer" size={18} />
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="nb-bouton nb-rh-pub-ajout"
              onClick={() => input.current?.click()}
            >
              {t("photoPick")}
            </button>
          )
        ) : null}
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
