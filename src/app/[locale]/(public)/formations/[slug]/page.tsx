import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { Logo } from "@/components/brand";
import { Icon, type IconName } from "@/components/brand/icon";
import { VideoPlayer } from "@/components/learn/video-player";
import { YouTubeEmbed } from "@/components/learn/youtube-embed";
import { speeds } from "@/components/learn/course-bits";
import { HeroPanel, IconTile, sectionTitle, stagger, wrap } from "@/components/site/marketing";
import { MotionRoot } from "@/components/site/motion";
import { PublicCourseCard } from "@/components/site/public-cards";
import { Avatar, ButtonLink } from "@/components/ui";
import { cx } from "@/lib/cx";
import { languageName } from "@/lib/dates";
import { durationParts } from "@/lib/format";
import { courseJsonLd, jsonLdScript, pageMetadata } from "@/lib/seo";
import { signupHref } from "@/lib/signup";
import { videoProvider } from "@/server/adapters/video";
import {
  getCourse,
  getPublicPlans,
  getSitemapEntries,
  staticSlugParams,
} from "@/server/queries/public";
import { planForCatalogLevel } from "@/server/services/plans";
import { CourseDocumentList, CoursePdfLinks } from "@/components/learn/course-documents";
import { applySiteLocale } from "@/i18n/site-locale";

// Known slugs are prerendered; a new one renders in full before responding, so that search engines
// get the whole page and a real 404 for an unknown slug.
export const instant = false;

export async function generateStaticParams() {
  const { courseSlugs } = await getSitemapEntries();
  return staticSlugParams(courseSlugs);
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/formations/[slug]">): Promise<Metadata> {
  await applySiteLocale(params);
  const { slug } = await params;
  const t = await getTranslations();
  const data = await getCourse(slug);
  if (!data) return { title: t("training.notFound.title"), robots: { index: false } };
  const { course } = data;
  const duration = durationParts(course.durationMinutes);
  return pageMetadata({
    path: `/formations/${course.slug}`,
    title: t("training.seo.title", { title: course.title }),
    description: t("training.seo.description", {
      summary: course.summary,
      duration: t(`ui.duration.${duration.key}`, duration.values),
      level: t(`trainings.filters.level.${course.level}`),
    }),
  });
}

const previewSchema = z.object({ paragraphs: z.array(z.string()) });

const lessonIcons: Record<string, IconName> = {
  video: "cours-video",
  text: "doc",
  exercise: "edit",
  quiz: "quiz",
  resource: "telecharger",
};

/** Public course page (mockup 01-11): what one learns, the program, and the plan that opens it. */
export default async function TrainingPage({ params }: PageProps<"/[locale]/formations/[slug]">) {
  await applySiteLocale(params);
  const { slug } = await params;
  const t = await getTranslations();
  const [data, plans] = await Promise.all([getCourse(slug), getPublicPlans()]);
  if (!data) notFound();
  const { course, related, documents } = data;

  const requiredPlan = planForCatalogLevel(plans, course.requiredLevel);
  const isFree = course.requiredLevel === "free";
  const lessons = course.modules.flatMap((module) => module.lessons);
  const duration = durationParts(course.durationMinutes);
  const durationText = t(`ui.duration.${duration.key}`, duration.values);
  const startHref = signupHref({
    profil: "talent",
    forfait: requiredPlan?.code,
    suite: `/app/learn/${course.slug}`,
  });
  const preview = lessons.find((lesson) => lesson.isPreview);
  const previewModule = preview
    ? course.modules.find((module) => module.lessons.some((lesson) => lesson.id === preview.id))
    : undefined;
  const previewText = preview ? previewSchema.safeParse(preview.content) : null;
  // Preview lessons are public (partie 12, E5): their video plays without an account.
  const previewVideo = preview?.kind === "video" ? videoProvider().playback(preview.videoId) : null;
  const lessonTime = (seconds: number) => {
    const parts = durationParts(Math.max(1, Math.round(seconds / 60)));
    return t("training.program.lessonDuration", {
      duration: t(`ui.duration.${parts.key}`, parts.values),
    });
  };

  const jsonLd = courseJsonLd({
    ...course,
    plan: requiredPlan,
    free: isFree,
  });

  const facts: { icon: IconName; text: string }[] = [
    { icon: "horloge", text: t("training.meta.duration", { duration: durationText }) },
    {
      icon: "objectif",
      text: t("training.meta.level", { level: t(`trainings.filters.level.${course.level}`) }),
    },
    { icon: "cours-video", text: t("training.meta.lessons", { count: lessons.length }) },
    ...(course.certificateEnabled
      ? [{ icon: "certificat" as const, text: t("training.meta.certificate") }]
      : []),
    {
      icon: "langue",
      text: t("training.meta.language", { language: languageName(course.language) }),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD is built from database values, serialized with "<" escaped.
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />
      <MotionRoot />

      {/* Hero: the course on the left, the access card on the right */}
      <HeroPanel className="pt-6 pb-12 lg:pt-12 lg:pb-16">
        <div
          className={cx(wrap, "relative flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-16")}
        >
          <div className="flex min-w-0 flex-1 flex-col items-start gap-4 lg:pt-2">
            <nav aria-label={t("ui.breadcrumb")} className="jm-rise" style={stagger(0)}>
              <ol className="flex flex-wrap items-center gap-1.5 text-[13px] leading-[18px]">
                <li className="flex items-center gap-1.5">
                  <Link
                    href="/formations"
                    className="font-medium text-feuille-fonce hover:underline"
                  >
                    {t("training.breadcrumb.trainings")}
                  </Link>
                  <Icon name="chev-r" className="size-3.5 text-ardoise" />
                </li>
                <li className="flex items-center gap-1.5">
                  <Link
                    href={`/formations?theme=${encodeURIComponent(course.category)}`}
                    className="font-medium text-feuille-fonce hover:underline"
                  >
                    {course.category}
                  </Link>
                  <Icon name="chev-r" className="size-3.5 text-ardoise" />
                </li>
                <li
                  aria-current="page"
                  className="max-w-[220px] truncate font-medium sm:max-w-none"
                >
                  {course.title}
                </li>
              </ol>
            </nav>
            <div className="jm-rise flex flex-wrap gap-2" style={stagger(1)}>
              <span
                className={cx(
                  "inline-flex h-7 items-center gap-1.5 rounded-pill px-3 text-xs font-semibold",
                  isFree || !requiredPlan ? "bg-lime text-sapin" : "bg-sapin text-blanc",
                )}
              >
                {!isFree && requiredPlan && <Icon name="lock" className="size-3.5" />}
                {isFree || !requiredPlan
                  ? t("training.badge.free")
                  : t("training.badge.plan", { plan: requiredPlan.name })}
              </span>
              <span className="inline-flex h-7 items-center rounded-pill bg-brume px-3 text-xs font-semibold">
                {course.category}
              </span>
            </div>
            <h1
              className="jm-word text-[36px] leading-10 font-semibold tracking-[-0.035em] lg:text-[56px] lg:leading-[60px]"
              style={stagger(2)}
            >
              {course.title}
            </h1>
            <p
              className="jm-rise max-w-[760px] text-[17px] leading-[26px] text-sapin/85 lg:text-lg lg:leading-7"
              style={stagger(3)}
            >
              {course.summary}
            </p>
            {course.instructor && (
              <p
                className="jm-rise flex items-center gap-3 text-sm font-semibold"
                style={stagger(4)}
              >
                <Avatar name={course.instructor} size="md" />
                {course.instructor}
              </p>
            )}
            <ul
              className="jm-rise flex max-w-[720px] flex-wrap gap-x-6 gap-y-2.5 text-[13px] leading-[18px]"
              style={stagger(5)}
            >
              {facts.map((fact) => (
                <li key={fact.text} className="flex items-center gap-1.5">
                  <Icon name={fact.icon} className="size-4 shrink-0 text-feuille-fonce" />
                  {fact.text}
                </li>
              ))}
            </ul>
          </div>

          <aside
            className="jm-rise flex flex-col gap-4 rounded-[28px] bg-blanc p-4 shadow-[0_30px_60px_rgba(11,26,31,0.12)] lg:w-[400px] lg:shrink-0 lg:p-[18px]"
            style={stagger(3)}
          >
            {/* Preview screen: leads to the playable preview lower on the page */}
            <div className="relative flex h-[200px] flex-col justify-between overflow-hidden rounded-[22px] bg-sapin p-4 text-blanc lg:h-[220px]">
              <div className="relative flex flex-wrap gap-2">
                {preview && (
                  <span className="inline-flex h-[22px] items-center rounded-pill bg-lime px-2.5 text-[10.5px] font-semibold text-sapin">
                    {t("training.program.preview")}
                  </span>
                )}
                {preview && previewModule && (
                  <span className="inline-flex h-[22px] items-center rounded-pill px-2.5 text-[10.5px] font-semibold ring-1 ring-blanc/60 ring-inset">
                    {t("training.preview.position", {
                      module: previewModule.order,
                      lesson: preview.order,
                    })}
                  </span>
                )}
              </div>
              {preview ? (
                <a
                  href="#apercu"
                  className="jm-pulse absolute top-1/2 left-1/2 flex size-[68px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-lime text-sapin shadow-[0_0_0_10px_rgba(166,242,107,0.22)]"
                >
                  <Icon name="play" className="size-7" />
                  <span className="sr-only">{t("training.preview.play")}</span>
                </a>
              ) : (
                <span
                  aria-hidden
                  className="absolute top-1/2 left-1/2 flex size-[68px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-lime/90 text-sapin"
                >
                  <Icon name="learn" className="size-7" />
                </span>
              )}
              <div className="relative flex flex-col gap-1.5">
                <p className="text-[15px] leading-5 font-semibold">
                  {preview?.title ?? course.modules[0]?.title ?? course.title}
                </p>
                {preview && (
                  <p aria-hidden className="flex items-center gap-2 text-[10.5px] text-blanc/75">
                    <span className="h-1 w-6 rounded-pill bg-lime" />
                    <span className="h-1 flex-1 rounded-pill bg-blanc/25" />
                    {lessonTime(preview.durationSec)}
                  </p>
                )}
              </div>
            </div>
            {!isFree && requiredPlan && (
              <p className="flex items-start gap-3 rounded-[18px] bg-blanc p-3.5 text-[13px] leading-5">
                <IconTile icon="lock" size={34} className="rounded-[12px] bg-sapin text-lime" />
                {t("training.cta.requiredPlan", { plan: requiredPlan.name })}
              </p>
            )}
            <ButtonLink href={startHref} size="lg" fullWidth iconAfter={<Icon name="chev-r" />}>
              {isFree ? t("training.cta.startFree") : t("training.cta.start")}
            </ButtonLink>
            {!isFree && (
              <ButtonLink href="/tarifs" variant="tertiary" fullWidth>
                {t("training.cta.seePlans")}
              </ButtonLink>
            )}
            <p className="flex items-start justify-center gap-2 px-2 text-center text-xs leading-[17px] text-ardoise">
              <Icon name="check" className="mt-px size-4 shrink-0 text-feuille-fonce" />
              {t("training.cta.note")}
            </p>
          </aside>
        </div>
      </HeroPanel>

      <section className="bg-papier py-12 lg:py-20">
        <div className={cx(wrap, "flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16")}>
          <div className="flex min-w-0 flex-1 flex-col gap-10 lg:gap-12">
            <div data-reveal className="flex flex-col gap-3">
              <h2 className="text-2xl leading-[30px] font-semibold tracking-[-0.015em]">
                {t("training.about.title")}
              </h2>
              <p className="text-[15px] leading-6">{course.description}</p>
            </div>
            {course.objectives.length > 0 && (
              <div data-reveal className="flex flex-col gap-4">
                <h2 className="text-2xl leading-[30px] font-semibold tracking-[-0.015em]">
                  {t("training.objectives.title")}
                </h2>
                <ul className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
                  {course.objectives.map((objective) => (
                    <CheckItem key={objective}>{objective}</CheckItem>
                  ))}
                </ul>
              </div>
            )}
            <div data-reveal className="flex flex-col gap-4">
              <h2 className="text-2xl leading-[30px] font-semibold tracking-[-0.015em]">
                {t("training.audience.title")}
              </h2>
              <ul className="flex flex-col gap-3">
                {course.audience
                  .split(/\n+/)
                  .map((line) => line.replace(/^[-•]\s*/, "").trim())
                  .filter(Boolean)
                  .map((line) => (
                    <CheckItem key={line}>{line}</CheckItem>
                  ))}
              </ul>
            </div>
            <div className="flex flex-col gap-4">
              <h2 data-reveal className="text-2xl leading-[30px] font-semibold tracking-[-0.015em]">
                {t("training.program.title")}
              </h2>
              <ol className="flex flex-col gap-3">
                {course.modules.map((module, index) => (
                  <li key={module.id} data-reveal style={stagger(index % 4)}>
                    <details open={index < 2} className="group rounded-[20px] bg-blanc">
                      <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-4 lg:px-5 [&::-webkit-details-marker]:hidden">
                        <span
                          aria-hidden
                          className={cx(
                            "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                            index === 0 ? "bg-lime" : "bg-blanc",
                          )}
                        >
                          {module.order}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="text-[15px] leading-5 font-semibold">
                            {t("training.program.module", {
                              number: module.order,
                              title: module.title,
                            })}
                          </span>
                          <span className="text-xs leading-4 text-ardoise">
                            {t("training.meta.lessons", { count: module.lessons.length })}
                          </span>
                        </span>
                        <span
                          aria-hidden
                          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blanc transition-colors group-open:bg-sapin group-open:text-lime"
                        >
                          <Icon
                            name="chev-d"
                            className="size-4 transition-transform group-open:rotate-180"
                          />
                        </span>
                      </summary>
                      <ul className="mx-4 flex flex-col border-t border-brume pb-2 lg:mx-5">
                        {module.lessons.map((lesson) => (
                          <li
                            key={lesson.id}
                            className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-brume/70 py-3 text-[13px] leading-[18px] last:border-b-0"
                          >
                            <Icon
                              name={lessonIcons[lesson.kind] ?? "doc"}
                              className="size-4 shrink-0"
                            />
                            <span className="min-w-0 flex-1">{lesson.title}</span>
                            <span className="flex items-center gap-3 text-[11px] text-ardoise">
                              {lessonTime(lesson.durationSec)}
                              {lesson.isPreview ? (
                                <span className="inline-flex h-[22px] items-center gap-1 rounded-pill bg-lime px-2 font-semibold text-sapin">
                                  <Icon name="play" className="size-3" />
                                  {t("training.program.preview")}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Icon name="lock" className="size-3.5" />
                                  <span className="max-sm:sr-only">
                                    {t("training.program.locked")}
                                  </span>
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                ))}
              </ol>
            </div>
            {course.certificateEnabled && (
              <div
                data-reveal
                className="relative flex flex-col gap-6 overflow-hidden rounded-[32px] bg-lime-clair p-6 text-sapin lg:flex-row lg:items-center lg:p-8"
              >
                <CertificateSample
                  label={t("training.meta.certificate")}
                  intro={t("training.certificate.sample.intro")}
                  text={t("training.certificate.sample.text", {
                    title: course.title,
                    duration: durationText,
                  })}
                />
                <div className="relative flex flex-1 flex-col items-start gap-3">
                  <IconTile icon="certificat" size={44} className="bg-sapin text-lime" />
                  <h2 className="text-2xl leading-[30px] font-semibold tracking-[-0.015em]">
                    {t("training.certificate.title")}
                  </h2>
                  <p className="text-[15px] leading-6">{t("training.certificate.text")}</p>
                </div>
              </div>
            )}
          </div>

          {/* Side column: on phones the preview comes right under the hero */}
          <div className="order-first flex flex-col gap-4 lg:sticky lg:top-24 lg:order-none lg:w-[400px] lg:shrink-0">
            {preview && (
              <div
                id="apercu"
                data-reveal
                className="flex scroll-mt-24 flex-col gap-3 rounded-[24px] bg-blanc p-6"
              >
                <h2 className="text-lg font-semibold">{t("training.preview.title")}</h2>
                <p className="text-[13.5px] leading-5 text-ardoise">{t("training.preview.text")}</p>
                <details className="group">
                  <summary className="inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-pill bg-sapin px-4 text-[13px] font-semibold text-blanc group-open:mb-4 [&::-webkit-details-marker]:hidden">
                    <Icon name="play" className="size-4 text-lime" />
                    {t("training.preview.play")}
                  </summary>
                  <div className="flex flex-col gap-3">
                    <h3 className="text-[15px] font-semibold">{preview.title}</h3>
                    {previewVideo?.youtube && (
                      <YouTubeEmbed id={previewVideo.youtube} title={preview.title} />
                    )}
                    {previewVideo && !previewVideo.youtube && (
                      <VideoPlayer
                        src={previewVideo.src}
                        poster={previewVideo.poster}
                        lowMp4={previewVideo.lowMp4}
                        title={preview.title}
                        labels={{
                          quality: t("learn.player.quality.text"),
                          auto: t("learn.player.quality.auto"),
                          low: t("learn.player.quality.low"),
                          speed: t("learn.player.speed.text"),
                          speedValues: Object.fromEntries(
                            speeds.map((speed) => [
                              speed,
                              t("learn.player.speed.value", { speed: speed.replace(".", ",") }),
                            ]),
                          ),
                          error: t("learn.player.error.text"),
                          retry: t("learn.player.error.retry"),
                          lowBandwidth: t("learn.player.lowBandwidth"),
                        }}
                      />
                    )}
                    {previewText?.success &&
                      previewText.data.paragraphs.map((paragraph) => (
                        <p key={paragraph} className="text-[15px] leading-7">
                          {paragraph}
                        </p>
                      ))}
                  </div>
                </details>
              </div>
            )}
            <CourseDocumentList
              id="documents"
              title={t("learn.documents.publicTitle")}
              documents={documents}
              single
              className="rounded-[24px] bg-blanc p-6"
            />
            <CoursePdfLinks
              id="course-pdf"
              slug={course.slug}
              className="rounded-[24px] bg-blanc p-6"
            />
            {course.instructor && (
              <div
                data-reveal
                className="hidden flex-col gap-3 rounded-[24px] bg-blanc p-6 lg:flex"
              >
                <p className="flex items-center gap-3">
                  <Avatar name={course.instructor} size="md" />
                  <span className="flex flex-col">
                    <span className="text-[15px] font-semibold">{course.instructor}</span>
                    <span className="text-xs text-ardoise">{t("training.instructor.role")}</span>
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-papier py-12 lg:py-20">
          <div className={cx(wrap, "flex flex-col gap-6 lg:gap-8")}>
            <div data-reveal className="flex items-center justify-between gap-4">
              <h2 className={sectionTitle}>{t("training.related.title")}</h2>
              <ButtonLink
                href="/formations"
                variant="tertiary"
                size="sm"
                iconAfter={<Icon name="chev-r" />}
                className="hidden bg-blanc sm:inline-flex"
              >
                {t("training.notFound.cta")}
              </ButtonLink>
            </div>
            <ul className="grid gap-4 md:grid-cols-3 lg:gap-5">
              {related.map((item, index) => (
                <li
                  key={item.slug}
                  data-reveal
                  className="flex [&>article]:flex-1"
                  style={stagger(index)}
                >
                  <PublicCourseCard
                    course={item}
                    plans={plans}
                    index={index + 2}
                    variant="catalog"
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 text-[14.5px] leading-[22px]">
      <span
        aria-hidden
        className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-lime-clair text-feuille-fonce"
      >
        <Icon name="check" className="size-3" />
      </span>
      {children}
    </li>
  );
}

/** A sample of the certificate, without a name: the visitor sees what they will receive. */
function CertificateSample({ label, intro, text }: { label: string; intro: string; text: string }) {
  return (
    <div
      aria-hidden
      className="jm-float relative flex w-full max-w-[260px] shrink-0 -rotate-2 flex-col gap-2 rounded-[18px] bg-blanc p-4 shadow-[0_20px_40px_rgba(15,63,55,0.18)]"
    >
      <span className="flex items-center justify-between gap-2">
        <Logo variant="tile" height={24} />
        <span className="text-[8.5px] font-semibold tracking-[0.12em] uppercase">{label}</span>
      </span>
      <span className="text-[10px] text-ardoise">{intro}</span>
      <span className="h-3.5 w-28 rounded-pill bg-sapin/80" />
      <span className="text-[10px] leading-[14px]">{text}</span>
      <span className="flex items-center justify-between">
        <span className="h-2 w-20 rounded-pill bg-brume" />
        <Icon name="certificat" className="size-4 text-feuille-fonce" />
      </span>
    </div>
  );
}
