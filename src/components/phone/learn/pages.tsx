import "server-only";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { siteUrl } from "@/lib/seo";
import { videoProvider } from "@/server/adapters/video";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { talentAttestation } from "@/server/services/attestations";
import { documentHref, documentViewer, visibleDocuments } from "@/server/services/course-documents";
import {
  getLearnerCourse,
  JOB_EXERCISES_KEY,
  lessonOutline,
  lessonParagraphs,
  lessonsOf,
  parseResources,
  requiredLessons,
} from "@/server/services/learn";
import { lessonCheck, publicCheck } from "@/server/services/learn-phone";
import { lessonResume } from "@/server/services/lesson-progress";
import { listPublicPlans } from "@/server/services/plans";
import { PhoneAttestation, type AttestationView } from "./attestation";
import { PhoneCourse, type CourseView } from "./course";
import { courseMark, courseTone, formationWords, shortTitle } from "./data";
import { PhoneLesson, type LessonView } from "./lesson";
import { LearnTexts } from "./server";

type Me = { id: string; name: string; firstName?: string | null; platformRole: string };

const coursePath = (slug: string) => `/app/learn/${encodeURIComponent(slug)}`;

/**
 * A course on the phone (planche Formation, « Détail du cours », feuilles -menu et -premium):
 * its banner, the figures, what you will know, the programme, « Enregistrer » and « Commencer ».
 * A course above the plan shows « Débloquer avec Pro » and its free first lesson.
 */
export async function PhoneCourseScreen({ user, slug }: { user: Me; slug: string }) {
  const [found, plans] = await Promise.all([
    getLearnerCourse(db, user.id, slug),
    listPublicPlans(db),
  ]);
  if (!found) notFound();
  const { t, day, duration, price, level } = await formationWords(plans);
  const { course, enrollment, open, saved } = found;
  const lessons = lessonsOf(course);
  const required = requiredLessons(course);
  const done = new Set(enrollment?.completedLessons ?? []);
  const certificate = enrollment?.certificate?.revokedAt ? null : enrollment?.certificate;
  const finished = Boolean(enrollment?.completedAt);
  const doneCount = required.filter((lesson) => done.has(lesson.id)).length;
  const currentId = finished ? null : lessons.find((lesson) => !done.has(lesson.id))?.id;
  const plan = price(course.requiredLevel);
  const preview = lessons.find((lesson) => lesson.isPreview) ?? null;
  const minutesOf = (seconds: number) => Math.max(1, Math.round(seconds / 60));

  const view: CourseView = {
    slug: course.slug,
    title: course.title,
    initials: courseMark(
      course.title,
      course.skills.map((item) => item.skill.name),
    ),
    tone: courseTone(course.slug),
    source: t("course.source", { domain: course.domain?.name ?? course.category }),
    tags: [
      t("course.lessons", { count: lessons.length }),
      duration(course.durationMinutes),
      level(course.level),
    ],
    price: plan,
    free: course.requiredLevel === "free",
    progress:
      enrollment && !finished && doneCount > 0
        ? {
            text: t("course.progress", { done: doneCount, count: required.length }),
            percent: enrollment.progress,
          }
        : null,
    outcomes: course.objectives.slice(0, 6),
    lessons: lessons.map((lesson, index) => {
      const locked = !open && !lesson.isPreview;
      const isDone = done.has(lesson.id);
      return {
        id: lesson.id,
        href: `${coursePath(course.slug)}/${lesson.id}`,
        num: index + 1,
        title: lesson.title,
        line: locked
          ? t("course.lockedLine", { duration: duration(minutesOf(lesson.durationSec)), plan })
          : duration(minutesOf(lesson.durationSec)),
        state: isDone ? "done" : lesson.id === currentId ? "current" : locked ? "locked" : "todo",
      };
    }),
    certificate: certificate
      ? {
          href: `/app/learn/attestations/${certificate.id}`,
          date: t("course.certificateOn", { date: day(certificate.issuedAt) }),
        }
      : null,
    saved,
    enrolled: Boolean(enrollment),
    open,
    cta: finished
      ? t("course.review")
      : !open
        ? t("course.unlock", { plan })
        : doneCount > 0
          ? t("course.resume", { n: lessons.findIndex((lesson) => lesson.id === currentId) + 1 })
          : t("course.start"),
    reviewHref: finished && lessons[0] ? `${coursePath(course.slug)}/${lessons[0].id}` : null,
    premium: open
      ? null
      : {
          title: t("premium.title", { course: course.title, plan }),
          text: t("premium.text", { plan }),
          trial: preview ? `${coursePath(course.slug)}/${preview.id}` : null,
        },
    share: `${siteUrl()}/formations/${course.slug}`,
  };
  return (
    <LearnTexts>
      <PhoneCourse view={view} />
    </LearnTexts>
  );
}

/**
 * A lesson on the phone (planches Formation-lecon, -quiz, feuille -menu de la leçon): the video,
 * « À retenir », the quick question, « Orbi explique autrement », then « Précédente » and
 * « Leçon suivante ». A quiz shows its questions on one page; an exercise is handed in as a file.
 */
export async function PhoneLessonScreen({
  user,
  slug,
  lessonId,
  attempt,
  exercise,
}: {
  user: Me;
  slug: string;
  lessonId: string;
  attempt: string | null;
  exercise: string | null;
}) {
  const [found, plans] = await Promise.all([
    getLearnerCourse(db, user.id, slug),
    listPublicPlans(db),
  ]);
  if (!found) notFound();
  const { course, enrollment, open } = found;
  const lessons = lessonsOf(course);
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  const current = lessons[index];
  if (!current) notFound();
  const follows = open && Boolean(enrollment);
  if (!follows && !current.isPreview) redirect(coursePath(course.slug));
  const locked =
    current.jobSpecific && !(await can(db, { type: "user", id: user.id }, JOB_EXERCISES_KEY));
  if (locked) redirect(coursePath(course.slug));

  const { t, duration, price } = await formationWords(plans);
  const done = new Set(enrollment?.completedLessons ?? []);
  const outline = lessonOutline(current.content);
  const paragraphs = lessonParagraphs(current.content);
  const playback = current.kind === "video" ? videoProvider().playback(current.videoId) : null;
  const minutes = Math.max(1, Math.round(current.durationSec / 60));
  const tAll = await getTranslations();
  const resumeAt = playback && follows ? await lessonResume(db, user.id, current.id) : 0;
  const clock = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  const previous = lessons[index - 1];
  const reachablePrevious = previous && (follows || previous.isPreview) ? previous : null;
  const last = index === lessons.length - 1;

  const quiz =
    current.kind === "quiz"
      ? await db.quiz.findUnique({
          where: { lessonId: current.id },
          include: { questions: { orderBy: { order: "asc" } } },
        })
      : null;
  // The files of the lesson (supports, PDF), in the lesson's menu.
  const documents = (
    await visibleDocuments(db, course, await documentViewer(db, user, course))
  ).filter((document) => document.lessonId === current.id || !document.lessonId);
  const files = [
    ...parseResources(current.resources).map((resource) => ({
      title: resource.title,
      href: resource.url,
    })),
    ...documents.map((document) => ({ title: document.title, href: documentHref(document.id) })),
  ];
  const shownAttempt =
    quiz && attempt
      ? await db.quizAttempt.findFirst({
          where: { id: attempt, userId: user.id, quizId: quiz.id },
          select: { score: true, passed: true },
        })
      : null;

  const view: LessonView = {
    id: current.id,
    slug: course.slug,
    courseHref: coursePath(course.slug),
    courseShort: shortTitle(course.title),
    num: index + 1,
    position: t("lesson.position", { n: index + 1, count: lessons.length }),
    percent: Math.round((100 * Math.max(done.size, index)) / Math.max(1, lessons.length)),
    title: current.title,
    line: current.transcript
      ? t("lesson.lineCaptions", { duration: duration(minutes) })
      : duration(minutes),
    tone: courseTone(course.slug),
    video: playback
      ? {
          src: playback.src,
          poster: playback.poster ?? null,
          lowMp4: playback.lowMp4 ?? null,
          length: clock(current.durationSec || minutes * 60),
          captions: Boolean(current.transcript),
          labels: {
            quality: tAll("learn.player.quality.text"),
            auto: tAll("learn.player.quality.auto"),
            low: tAll("learn.player.quality.low"),
            speed: tAll("learn.player.speed.text"),
            speedValues: {},
            error: tAll("learn.player.error.text"),
            retry: tAll("learn.player.error.retry"),
            lowBandwidth: tAll("learn.player.lowBandwidth"),
            textOnly: tAll("apprendre.lesson.textOnly"),
          },
          resume: follows
            ? {
                lessonId: current.id,
                at: resumeAt,
                endpoint: "/api/learn/position",
                resumed: tAll("learn.player.resume.text", { time: clock(resumeAt) }),
                restart: tAll("learn.player.resume.restart"),
              }
            : null,
        }
      : null,
    lead: current.kind === "video" ? null : (outline.brief ?? paragraphs[0] ?? null),
    takeaways: outline.takeaways.length > 0 ? outline.takeaways : outline.steps.map((s) => s.title),
    check: publicCheck(lessonCheck(current.content)),
    kind: current.kind,
    quiz: quiz
      ? {
          passing: quiz.passingScore,
          questions: quiz.questions.map((question) => ({
            id: question.id,
            prompt: question.prompt,
            type: question.type,
            options: question.options,
          })),
          result: shownAttempt
            ? t(shownAttempt.passed ? "quiz.passed" : "quiz.failed", {
                score: shownAttempt.score,
                passing: quiz.passingScore,
              })
            : null,
          passed: Boolean(shownAttempt?.passed),
        }
      : null,
    exerciseProblem: exercise,
    done: done.has(current.id),
    follows,
    previous: reachablePrevious ? `${coursePath(course.slug)}/${reachablePrevious.id}` : null,
    nextLabel: last ? t("lesson.finishCourse") : t("lesson.next"),
    unlock: follows ? null : t("course.unlock", { plan: price(course.requiredLevel) }),
    files,
    context: t("lesson.orbiContext", { lesson: current.title, course: course.title }),
  };
  return (
    <LearnTexts>
      <PhoneLesson view={view} />
    </LearnTexts>
  );
}

/**
 * An attestation on the phone (planches Formation-fini, -attestation): « Bravo Grâce ! » when it
 * was just earned, the card with the verification link, « Ajouter à mon profil », « Partager dans
 * le Fil », « Télécharger en PDF » and « Voir d’autres cours ».
 */
export async function PhoneAttestationScreen({
  user,
  id,
  fresh,
}: {
  user: Me;
  id: string;
  fresh: boolean;
}) {
  const [certificate, plans] = await Promise.all([
    talentAttestation(db, user.id, id),
    listPublicPlans(db),
  ]);
  if (!certificate) notFound();
  const { t, day } = await formationWords(plans);
  const verify = `${siteUrl()}/attestations/${certificate.code}`;
  const course = certificate.enrollment.course;
  const view: AttestationView = {
    id: certificate.id,
    fresh,
    hello: user.firstName
      ? t("certificate.bravo", { name: user.firstName })
      : t("certificate.bravoAnon"),
    finished: t("certificate.finished", { course: certificate.courseTitle }),
    title: certificate.courseTitle,
    holder: certificate.holderName,
    line:
      certificate.score !== null
        ? t("certificate.line", { date: day(certificate.issuedAt), score: certificate.score })
        : t("certificate.lineNoScore", { date: day(certificate.issuedAt) }),
    verify: verify.replace(/^https?:\/\//, ""),
    verifyHref: verify,
    onProfile: certificate.onProfile,
    pdf: `/app/learn/attestations/${certificate.id}/pdf`,
    fil: `/app/fil/publier?attestation=${certificate.id}`,
    back: fresh
      ? { href: "/app/learn?onglet=attestations", label: shortTitle(certificate.courseTitle) }
      : { href: "/app/learn?onglet=attestations", label: t("title") },
    courseHref: course ? coursePath(course.slug) : "/app/learn",
  };
  return (
    <LearnTexts>
      <PhoneAttestation view={view} />
    </LearnTexts>
  );
}
