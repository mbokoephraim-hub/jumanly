import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { AppPageHeader } from "@/components/app/page-header";
import { AiOrb } from "@/components/brand/ai-orb";
import { CoachChat } from "@/components/learn/coach-chat";
import { ButtonLink, EmptyState } from "@/components/ui";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { coachCourses } from "@/server/services/learn-academy";
import { coachIntents, type CoachIntent } from "@/server/services/learn-coach";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("learn.coach");
  return { title: t("seo"), robots: { index: false } };
}

const helps: Record<string, CoachIntent> = { erreur: "mistake", revision: "revision" };

/**
 * « Coach IA » of the Learn academy (ux-test, étape 2): the AI Learning Coach for every course the
 * learner follows. `?formation=&lecon=&aide=erreur` opens it on a course, a lesson and a need.
 */
export default async function LearnCoachPage({ searchParams }: PageProps<"/app/learn/coach">) {
  const params = await searchParams;
  const user = await requireUser("/app/learn/coach");
  const t = await getTranslations("learn.coach");
  const courses = await coachCourses(db, user.id);
  const messages = await getMessages();
  const text = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");
  const wanted = courses.find((course) => course.slug === text("formation"));
  const intent = helps[text("aide")];

  return (
    <div className="flex flex-col gap-5">
      <AppPageHeader eyebrow={t("eyebrow")} title={t("title")} />
      {courses.length === 0 ? (
        <EmptyState
          title={t("empty.title")}
          description={t("empty.body")}
          action={<ButtonLink href="/app/learn/explorer">{t("empty.cta")}</ButtonLink>}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0 rounded-[22px] border border-sapin/8 bg-blanc p-4 sm:p-5 lg:p-6">
            <NextIntlClientProvider
              messages={
                {
                  learn: { coach: messages.learn.coach },
                  ai: { orb: messages.ai.orb },
                } as unknown as typeof messages
              }
            >
              <CoachChat
                courses={courses}
                firstName={user.firstName ?? user.name}
                initial={{
                  slug: wanted?.slug,
                  lessonId: wanted?.lessons.some((lesson) => lesson.id === text("lecon"))
                    ? text("lecon")
                    : undefined,
                  intent: intent && coachIntents.includes(intent) ? intent : undefined,
                }}
              />
            </NextIntlClientProvider>
          </section>
          <aside className="flex flex-col gap-3 self-start rounded-[22px] bg-sapin p-5 text-blanc">
            <p className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.12em] text-neon uppercase">
              <AiOrb size={22} />
              {t("chat.coach")}
            </p>
            <p className="text-[14px] leading-6">{t("intro")}</p>
            <p className="text-[13px] leading-5 text-blanc/80">{t("rule")}</p>
          </aside>
        </div>
      )}
    </div>
  );
}
