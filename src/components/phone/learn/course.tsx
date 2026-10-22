"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { saveCourseAction, startCourseAction } from "@/server/actions/learn-phone";
import { PhoneBack } from "../back";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import { CourseBanner, CourseSquare } from "./parts";

export type CourseView = {
  slug: string;
  title: string;
  initials: string;
  tone: number;
  /** « Data · Jumanly Formation ». */
  source: string;
  /** « 8 leçons », « 1 h 10 », « Débutant ». */
  tags: string[];
  price: string;
  free: boolean;
  progress: { text: string; percent: number } | null;
  outcomes: string[];
  lessons: {
    id: string;
    href: string;
    num: number;
    title: string;
    line: string;
    state: "done" | "current" | "locked" | "todo";
  }[];
  certificate: { href: string; date: string } | null;
  saved: boolean;
  enrolled: boolean;
  open: boolean;
  cta: string;
  /** « Revoir le cours »: the first lesson. */
  reviewHref: string | null;
  premium: { title: string; text: string; trial: string | null } | null;
  /** The public page of the course, for « Partager le cours ». */
  share: string;
};

type Sheet = "menu" | "premium";

/**
 * « Détail du cours » (planche Formation, feuilles -menu et -premium). « Commencer » enrolls and
 * opens the first lesson; a course above the plan opens « inclus dans Pro » with its free lesson.
 */
export function PhoneCourse({ view }: { view: CourseView }) {
  const t = useTranslations("phoneLearn");
  const router = useRouter();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [saved, setSaved] = useState(view.saved);
  const [pending, start] = useTransition();
  const close = () => setSheet(null);

  const toggleSave = (fromMenu = false) =>
    start(async () => {
      const result = await saveCourseAction(view.slug).catch(() => null);
      if (!result?.ok) {
        showToast({ message: t("error"), tone: "error" });
        return;
      }
      setSaved(result.value);
      if (fromMenu) close();
      showToast({ message: result.value ? t("course.savedToast") : t("course.unsavedToast") });
    });

  /** « Commencer », a lesson of the programme: enroll when needed, then the lesson. */
  const openLesson = (lessonId?: string) => {
    if (!view.open) {
      setSheet("premium");
      return;
    }
    if (view.reviewHref && !lessonId) {
      router.push(view.reviewHref);
      return;
    }
    start(async () => {
      const result = await startCourseAction(view.slug, lessonId).catch(() => null);
      if (!result?.ok) {
        if (result?.error === "locked") setSheet("premium");
        else showToast({ message: t("error"), tone: "error" });
        return;
      }
      router.push(result.value);
    });
  };

  const share = async () => {
    close();
    try {
      if (navigator.share) {
        await navigator.share({ title: view.title, url: view.share });
        return;
      }
      await navigator.clipboard.writeText(view.share);
      showToast({ message: t("course.shared") });
    } catch {}
  };

  return (
    <div className="nb-page nb-fo nb-fo-cours">
      <header className="nb-barre nb-ex-barre">
        <PhoneBack fallback="/app/learn" label={t("title")} text={t("title")} />
        <span className="nb-ex-vide-h" />
        <button
          type="button"
          className="nb-fo-plus"
          aria-label={t("course.more")}
          onClick={() => setSheet("menu")}
        >
          <PhoneIcon name="plusOptions" size={20} />
        </button>
      </header>

      <CourseBanner initials={view.initials} tone={view.tone} />
      <div className="nb-fo-bloc">
        <span className="nb-meta">{view.source}</span>
        <h1 className="nb-fo-titre">{view.title}</h1>
        <div className="nb-fo-tags">
          {view.tags.map((tag) => (
            <span key={tag} className="nb-fo-tag">
              {tag}
            </span>
          ))}
          <span className="nb-fo-tag" data-ton={view.free ? "lime" : "plan"}>
            {view.price}
          </span>
        </div>
        {view.progress ? (
          <div className="nb-fo-progres">
            <span className="nb-meta">{view.progress.text}</span>
            <span className="nb-fo-barre" aria-hidden>
              <i style={{ width: `${view.progress.percent}%` }} />
            </span>
          </div>
        ) : null}
      </div>
      {view.outcomes.length > 0 ? (
        <section className="nb-fo-bloc" aria-labelledby="fo-saurez">
          <h2 id="fo-saurez">{t("course.outcomes")}</h2>
          <ul className="nb-fo-points">
            {view.outcomes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <section aria-labelledby="fo-programme">
        <div className="nb-fo-bloc" data-sans-filet="">
          <h2 id="fo-programme">{t("course.programme")}</h2>
        </div>
        <ol className="nb-fo-programme">
          {view.lessons.map((lesson) => (
            <li key={lesson.id}>
              <button
                type="button"
                className="nb-fo-lecon"
                data-etat={lesson.state}
                disabled={pending}
                onClick={() =>
                  lesson.state === "locked"
                    ? setSheet("premium")
                    : view.enrolled
                      ? router.push(lesson.href)
                      : openLesson(lesson.id)
                }
              >
                <span className="nb-fo-num" aria-hidden>
                  {lesson.state === "done" ? (
                    <PhoneIcon name="coche" size={16} stroke={2.6} />
                  ) : lesson.state === "locked" ? (
                    "·"
                  ) : (
                    lesson.num
                  )}
                </span>
                <span className="nb-fo-ligne-t">
                  <b>{lesson.title}</b>
                  <small className="nb-meta">
                    {lesson.line}
                    {lesson.state === "done" ? (
                      <span className="sr-only"> · {t("course.lessonDone")}</span>
                    ) : null}
                  </small>
                </span>
                {lesson.state === "current" ? (
                  <span className="nb-fo-encours">{t("course.current")}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ol>
        {view.certificate ? (
          <Link href={view.certificate.href} className="nb-fo-lecon">
            <span className="nb-fo-num" data-plein="" aria-hidden>
              <PhoneIcon name="coche" size={16} stroke={2.6} />
            </span>
            <span className="nb-fo-ligne-t">
              <b>{t("course.certificate")}</b>
              <small className="nb-meta">{view.certificate.date}</small>
            </span>
            <span className="nb-fo-encours">{t("course.see")}</span>
          </Link>
        ) : null}
      </section>

      <div className="nb-ex-bas">
        <button
          type="button"
          className="nb-ex-enreg"
          aria-pressed={saved}
          disabled={pending}
          onClick={() => toggleSave()}
        >
          {saved ? t("course.saved") : t("course.save")}
        </button>
        <button
          type="button"
          className="nb-bouton nb-fo-cta"
          data-plein=""
          disabled={pending}
          onClick={() => openLesson()}
        >
          {view.cta}
        </button>
      </div>

      <PhoneSheet
        open={sheet === "menu"}
        onClose={close}
        label={view.title}
        closeLabel={t("close")}
      >
        <p className="nb-fo-feuille-t">{view.title}</p>
        <button type="button" className="nb-opt" onClick={share}>
          <span>
            {t("course.share")}
            <small>{t("course.shareLine")}</small>
          </span>
        </button>
        <button
          type="button"
          className="nb-opt"
          disabled={pending}
          onClick={() => toggleSave(true)}
        >
          <span>
            {saved ? t("course.unsave") : t("course.save")}
            <small>{t("course.saveLine")}</small>
          </span>
        </button>
        <Link href="/app/compte/aide" className="nb-opt" data-alerte="">
          <span>
            {t("report")}
            <small>{t("reportLine")}</small>
          </span>
        </Link>
        <button type="button" className="nb-annuler" onClick={close}>
          {t("cancel")}
        </button>
      </PhoneSheet>

      {view.premium ? (
        <PhoneSheet
          open={sheet === "premium"}
          onClose={close}
          label={view.premium.title}
          closeLabel={t("close")}
          className="nb-fo-premium"
        >
          <CourseSquare initials={view.initials} tone={view.tone} size={48} />
          <b>{view.premium.title}</b>
          <p>{view.premium.text}</p>
          <Link href="/app/abonnement" className="nb-bouton" data-plein="" data-large="">
            {t("premium.plans")}
          </Link>
          {view.premium.trial ? (
            <Link href={view.premium.trial} className="nb-annuler">
              {t("premium.trial")}
            </Link>
          ) : (
            <button type="button" className="nb-annuler" onClick={close}>
              {t("cancel")}
            </button>
          )}
        </PhoneSheet>
      ) : null}
    </div>
  );
}
