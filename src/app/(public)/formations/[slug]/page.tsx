import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { Icon } from "@/components/brand/icon";
import { VideoPlayer, speeds } from "@/components/learn/video-player";
import { CourseListing } from "@/components/site/listings";
import { Breadcrumb } from "@/components/site/navigation-bits";
import { CheckList } from "@/components/site/sections";
import { Badge, ButtonLink } from "@/components/ui";
import { languageName } from "@/lib/dates";
import { durationParts } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { signupHref } from "@/lib/signup";
import { videoProvider } from "@/server/adapters/video";
import { getCourse, getPublicPlans, getSitemapEntries } from "@/server/queries/public";
import { planForCatalogLevel } from "@/server/services/plans";

// Known slugs are prerendered; a new one renders in full before responding, so that search engines
// get the whole page and a real 404 for an unknown slug.
export const instant = false;

export async function generateStaticParams() {
  const { courseSlugs } = await getSitemapEntries();
  return courseSlugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/formations/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations();
  const data = await getCourse(slug);
  if (!data) return { title: { absolute: t("training.notFound.title") }, robots: { index: false } };
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

export default async function TrainingPage({ params }: PageProps<"/formations/[slug]">) {
  const { slug } = await params;
  const t = await getTranslations();
  const [data, plans] = await Promise.all([getCourse(slug), getPublicPlans()]);
  if (!data) notFound();
  const { course, related } = data;

  const requiredPlan = planForCatalogLevel(plans, course.requiredLevel);
  const isFree = course.requiredLevel === "free";
  const lessons = course.modules.flatMap((module) => module.lessons);
  const duration = durationParts(course.durationMinutes);
  const startHref = signupHref({
    profil: "talent",
    forfait: requiredPlan?.code,
    suite: `/app/learn/${course.slug}`,
  });
  const preview = lessons.find((lesson) => lesson.isPreview);
  const previewText = preview ? previewSchema.safeParse(preview.content) : null;
  // Preview lessons are public (partie 12, E5): their video plays without an account.
  const previewVideo = preview?.kind === "video" ? videoProvider().playback(preview.videoId) : null;

  return (
    <>
      <section className="bg-creme">
        <div className="mx-auto grid max-w-7xl gap-8 page-x py-10 md:py-14 lg:grid-cols-[1.6fr_1fr]">
          <div className="flex flex-col items-start gap-5">
            <Breadcrumb
              items={[
                { label: t("training.breadcrumb.trainings"), href: "/formations" },
                { label: course.title },
              ]}
            />
            <Badge tone={isFree ? "learn" : "sapin"}>
              {isFree || !requiredPlan
                ? t("training.badge.free")
                : t("training.badge.plan", { plan: requiredPlan.name })}
            </Badge>
            <h1 className="text-display">{course.title}</h1>
            <p className="max-w-2xl text-lg leading-8 text-ardoise">{course.summary}</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[15px]">
              <li className="flex items-center gap-1.5">
                <Icon name="horloge" className="size-5" />
                {t("training.meta.duration", {
                  duration: t(`ui.duration.${duration.key}`, duration.values),
                })}
              </li>
              <li className="flex items-center gap-1.5">
                <Icon name="objectif" className="size-5" />
                {t("training.meta.level", { level: t(`trainings.filters.level.${course.level}`) })}
              </li>
              <li className="flex items-center gap-1.5">
                <Icon name="cours-video" className="size-5" />
                {t("training.meta.lessons", { count: lessons.length })}
              </li>
              <li className="flex items-center gap-1.5">
                <Icon name="langue" className="size-5" />
                {t("training.meta.language", { language: languageName(course.language) })}
              </li>
              {course.certificateEnabled && (
                <li className="flex items-center gap-1.5">
                  <Icon name="certificat" className="size-5" />
                  {t("training.meta.certificate")}
                </li>
              )}
            </ul>
          </div>
          <aside className="flex flex-col gap-4 self-start rounded-card bg-blanc p-6">
            {!isFree && requiredPlan && (
              <p className="text-[15px] leading-6">
                {t("training.cta.requiredPlan", { plan: requiredPlan.name })}
              </p>
            )}
            <ButtonLink href={startHref} size="lg" fullWidth>
              {isFree ? t("training.cta.startFree") : t("training.cta.start")}
            </ButtonLink>
            {!isFree && (
              <ButtonLink href="/tarifs" variant="tertiary" fullWidth>
                {t("training.cta.seePlans")}
              </ButtonLink>
            )}
            <p className="text-ardoise text-caption">{t("training.cta.note")}</p>
          </aside>
        </div>
      </section>

      <section className="bg-blanc">
        <div className="mx-auto grid max-w-7xl gap-10 page-x py-12 lg:grid-cols-[1.6fr_1fr]">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-3">
              <h2 className="text-h1">{t("training.about.title")}</h2>
              <p className="text-[17px] leading-8">{course.description}</p>
            </div>
            {course.objectives.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-h2">{t("training.objectives.title")}</h2>
                <CheckList items={course.objectives} />
              </div>
            )}
            <div className="flex flex-col gap-3">
              <h2 className="text-h2">{t("training.audience.title")}</h2>
              <p className="text-[17px] leading-8">{course.audience}</p>
            </div>
            <div className="flex flex-col gap-4">
              <h2 className="text-h2">{t("training.program.title")}</h2>
              <ol className="flex flex-col gap-3">
                {course.modules.map((module) => (
                  <li key={module.id} className="rounded-card bg-creme p-5">
                    <h3 className="font-semibold">
                      {t("training.program.module", { number: module.order, title: module.title })}
                    </h3>
                    <ul className="mt-3 flex flex-col gap-2 text-[15px]">
                      {module.lessons.map((lesson) => {
                        const lessonDuration = durationParts(
                          Math.max(1, Math.round(lesson.durationSec / 60)),
                        );
                        return (
                          <li
                            key={lesson.id}
                            className="flex flex-wrap items-center justify-between gap-2"
                          >
                            <span className="flex items-center gap-2">
                              <Icon
                                name={lesson.isPreview ? "cours-video" : "securite"}
                                className="size-4 shrink-0"
                              />
                              {lesson.title}
                            </span>
                            <span className="flex items-center gap-2 text-sm text-ardoise">
                              {lesson.isPreview ? (
                                <Badge tone="learn">{t("training.program.preview")}</Badge>
                              ) : (
                                <span className="sr-only">{t("training.program.locked")}</span>
                              )}
                              {t("training.program.lessonDuration", {
                                duration: t(
                                  `ui.duration.${lessonDuration.key}`,
                                  lessonDuration.values,
                                ),
                              })}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="flex flex-col gap-4 self-start">
            {preview && (
              <div className="flex flex-col gap-3 rounded-card bg-lime p-6 text-sapin">
                <h2 className="text-h2">{t("training.preview.title")}</h2>
                <p className="text-[15px]">{t("training.preview.text")}</p>
                <h3 className="font-semibold">{preview.title}</h3>
                {previewVideo && (
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
            )}
            {course.certificateEnabled && (
              <div className="flex flex-col gap-3 rounded-card bg-creme p-6">
                <Icon name="certificat" duo className="size-10" />
                <h2 className="text-h2">{t("training.certificate.title")}</h2>
                <p className="text-[15px] leading-6 text-ardoise">
                  {t("training.certificate.text")}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-creme">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 page-x py-12">
            <h2 className="text-h1">{t("training.related.title")}</h2>
            <ul className="grid gap-4 md:grid-cols-3">
              {related.map((item) => (
                <li key={item.slug} className="flex [&>article]:flex-1">
                  <CourseListing course={item} plans={plans} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
