import { describe, expect, it } from "vitest";
import messages from "../../messages/fr.json";
import { parseEndDate, versionChanges } from "@/server/services/admin-billing";
import { cleanFileName } from "@/server/services/admin-orgs";
import { courseReadiness, publishProblems } from "@/server/services/course-admin";
import { jobSeverity, reportSeverity, sortReports } from "@/server/services/moderation";
import { coverAt, sniffVideoType } from "@/server/services/course-media";
import { sniffDocumentType } from "@/server/storage";
import { planCosts } from "@/server/services/ai-admin";
import { listTips } from "@/server/services/contents";
import {
  deletionBlock,
  parseUntil,
  readUserFilters,
  userState,
} from "@/server/services/admin-users";
import {
  AUDIT_FAMILIES,
  AUDIT_TARGETS,
  familyOf,
  readAuditFilters,
  reasonOf,
} from "@/server/services/admin-audit";
import {
  aiSpike,
  attentionScore,
  monthKey,
  parseMonth,
  parseUsd,
  prorateCosts,
} from "@/server/services/admin-insights";
import { normalizeQuery, searchKindsFor } from "@/server/services/admin-search";

describe("journal d'audit (Admin v2)", () => {
  it("range une action dans sa famille", () => {
    expect(familyOf("user.suspend")).toBe("user");
    expect(familyOf("org.verification.verify")).toBe("org");
    expect(familyOf("match.dispute.corrected")).toBe("match");
    expect(familyOf("inconnu.action")).toBeNull();
  });

  it("retrouve le motif, quel que soit le champ qui l'a gardé", () => {
    expect(reasonOf({ reason: "Fraude" })).toBe("Fraude");
    expect(reasonOf({ note: " Nouveaux poids " })).toBe("Nouveaux poids");
    expect(reasonOf({ resolution: "Score confirmé" })).toBe("Score confirmé");
    expect(reasonOf({ reason: "" })).toBeNull();
    expect(reasonOf(null)).toBeNull();
    expect(reasonOf(["reason"])).toBeNull();
  });

  it("lit les filtres de l'adresse et ignore les valeurs inconnues", () => {
    expect(
      readAuditFilters({
        action: "user",
        cible: "user",
        periode: "7",
        auteur: " esther ",
        id: "u1",
      }),
    ).toEqual({ family: "user", target: "user", period: 7, actor: "esther", targetId: "u1" });
    expect(readAuditFilters({ action: "drop", cible: "table", periode: "3" })).toEqual({
      family: undefined,
      target: undefined,
      period: undefined,
      actor: undefined,
      targetId: undefined,
    });
  });

  it("a un libellé pour chaque famille et chaque cible du filtre", () => {
    const journal = messages.admin.journal as {
      family: Record<string, string>;
      target: Record<string, string>;
    };
    for (const family of AUDIT_FAMILIES) expect(journal.family[family], family).toBeTruthy();
    for (const target of AUDIT_TARGETS) expect(journal.target[target], target).toBeTruthy();
  });
});

describe("recherche globale (Admin v2)", () => {
  it("ne cherche que ce que le rôle peut ouvrir", () => {
    expect(searchKindsFor("platform_admin")).toEqual([
      "users",
      "organizations",
      "jobs",
      "courses",
      "plans",
    ]);
    expect(searchKindsFor("support_agent")).not.toContain("courses");
    expect(searchKindsFor("content_editor")).toEqual(["courses"]);
    expect(searchKindsFor("user")).toEqual([]);
  });

  it("nettoie la saisie", () => {
    expect(normalizeQuery("  Awa   Fictive ")).toBe("Awa Fictive");
    expect(normalizeQuery("x".repeat(300))).toHaveLength(120);
  });
});

describe("indicateurs intelligents (Admin v2, étape 2)", () => {
  it("classe d'abord l'argent et les personnes, puis l'ancienneté", () => {
    expect(attentionScore("payments", 0, false)).toBeGreaterThan(attentionScore("jobs", 0, false));
    expect(attentionScore("jobs", 10, false)).toBeGreaterThan(attentionScore("reports", 0, false));
    // The age counts for 30 days at most; a dispute past its deadline jumps ahead.
    expect(attentionScore("jobs", 90, false)).toBe(attentionScore("jobs", 30, false));
    expect(attentionScore("disputes", 7, true)).toBeGreaterThan(
      attentionScore("payments", 7, false),
    );
  });

  it("ne signale une dépense d'IA que si elle est nettement inhabituelle", () => {
    // 2 USD today against 0,50 USD a day: alert.
    expect(aiSpike(2_000_000, 15_000_000)).toEqual({
      lastDayCents: 200,
      averageCents: 50,
      factor: 3,
    });
    // Three times the average is not reached.
    expect(aiSpike(2_000_000, 30_000_000)).toBeNull();
    // A few cents are never news.
    expect(aiSpike(500_000, 0)).toBeNull();
    // First spending ever, above 1 USD.
    expect(aiSpike(1_500_000, 0)).not.toBeNull();
  });

  it("lit les montants et les mois saisis", () => {
    expect(parseUsd("120,50")).toBe(12050);
    expect(parseUsd(" 1 200.5 ")).toBe(120050);
    expect(parseUsd("")).toBe(0);
    expect(parseUsd("-3")).toBeNull();
    expect(parseUsd("12,345")).toBeNull();
    expect(parseMonth("2026-10")?.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(parseMonth("2026-13")).toBeNull();
    expect(monthKey(new Date("2026-02-01T00:00:00Z"))).toBe("2026-02");
  });

  it("compte chaque mois au prorata de sa part dans la période", () => {
    const rows = [
      { month: new Date("2026-09-01T00:00:00Z"), category: "hosting" as const, amountCents: 3000 },
      { month: new Date("2026-10-01T00:00:00Z"), category: "hosting" as const, amountCents: 3100 },
      { month: new Date("2026-08-01T00:00:00Z"), category: "other" as const, amountCents: 999 },
    ];
    // 16 September → 16 October: half of September, 15 days of October.
    const totals = prorateCosts(
      rows,
      new Date("2026-09-16T00:00:00Z"),
      new Date("2026-10-16T00:00:00Z"),
    );
    expect(totals.hosting).toBe(1500 + 1500);
    expect(totals.other).toBe(0);
  });
});

describe("utilisateurs (Admin v2, étape 3)", () => {
  const base = {
    actorId: "admin",
    targetId: "cible",
    targetRole: "user",
    otherAdmins: 1,
    ownsOrganization: false,
    status: "active",
  };

  it("bloque la suppression de soi, du dernier administrateur et d'un propriétaire", () => {
    expect(deletionBlock(base)).toBeNull();
    expect(deletionBlock({ ...base, targetId: "admin" })).toBe("self");
    expect(deletionBlock({ ...base, targetRole: "platform_admin", otherAdmins: 0 })).toBe(
      "lastAdmin",
    );
    expect(deletionBlock({ ...base, targetRole: "platform_admin", otherAdmins: 2 })).toBeNull();
    expect(deletionBlock({ ...base, ownsOrganization: true })).toBe("owner");
    expect(deletionBlock({ ...base, status: "deleted" })).toBe("deleted");
    // The job deleting accounts on schedule has no author.
    expect(deletionBlock({ ...base, actorId: null })).toBeNull();
  });

  it("accepte une date de fin entre demain et deux ans", () => {
    const now = new Date("2026-10-15T12:00:00Z");
    expect(parseUntil("2026-10-15", now)).toBeNull();
    expect(parseUntil("2026-10-16", now)?.toISOString()).toBe("2026-10-16T23:59:59.999Z");
    expect(parseUntil("2028-10-15", now)).toBeNull();
    expect(parseUntil("16/10/2026", now)).toBeNull();
  });

  it("donne l'état d'un compte et lit les filtres de la liste", () => {
    const user = { status: "active", deletionScheduledAt: null, emailVerified: true };
    expect(userState(user)).toBe("active");
    expect(userState({ ...user, emailVerified: false })).toBe("unverified");
    expect(userState({ ...user, deletionScheduledAt: new Date() })).toBe("deletionScheduled");
    expect(userState({ ...user, status: "suspended" })).toBe("suspended");
    expect(userState({ ...user, status: "deleted" })).toBe("deleted");
    expect(readUserFilters({ statut: "deleted", pays: "cd", role: "intrus" })).toMatchObject({
      state: "deleted",
      country: "CD",
      role: undefined,
    });
  });
});

describe("organisations (Admin v2, étape 4)", () => {
  it("reconnaît un justificatif à ses premiers octets, pas à son nom", () => {
    expect(sniffDocumentType(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]))).toBe(
      "application/pdf",
    );
    expect(sniffDocumentType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d]))).toBe("image/png");
    expect(sniffDocumentType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
    expect(sniffDocumentType(webp)).toBe("image/webp");
    expect(sniffDocumentType(new TextEncoder().encode("RIFF\0\0\0\0WAVEfmt "))).toBeNull();
    expect(sniffDocumentType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });

  it("nettoie le nom d'un fichier envoyé", () => {
    expect(cleanFileName("../../etc/passwd")).toBe("..-..-etc-passwd");
    expect(cleanFileName('  statuts  "2026".pdf ')).toBe("statuts -2026-.pdf");
    expect(cleanFileName("")).toBe("document");
  });
});

describe("forfaits et abonnements (étape 5)", () => {
  const now = new Date("2026-10-15T10:00:00Z");
  it("une nouvelle fin d'abonnement vient après la fin actuelle, à deux ans au plus", () => {
    const end = new Date("2026-11-01T00:00:00Z");
    expect(parseEndDate("2026-12-01", end, now)?.toISOString()).toBe("2026-12-01T23:59:59.999Z");
    expect(parseEndDate("2026-10-20", end, now)).toBeNull();
    expect(parseEndDate("2026-02-30", end, now)).toBeNull();
    expect(parseEndDate("2029-01-01", end, now)).toBeNull();
    expect(parseEndDate("demain", end, now)).toBeNull();
  });

  it("une version de forfait liste ce qui a changé, champs et droits", () => {
    expect(
      versionChanges({
        fields: { name: "Pro", priceCents: 1299, isPublic: true },
        before: { name: "Pro", priceCents: 999, isPublic: true },
        entitlements: [{ key: "ai.credits.monthly", from: "100", to: "150" }],
        reason: "Ajustement",
      }),
    ).toEqual([
      { field: "priceCents", from: "999", to: "1299" },
      { field: "ai.credits.monthly", from: "100", to: "150" },
    ]);
    expect(versionChanges(null)).toEqual([]);
  });
});

describe("formations : prête à publier (étape 6)", () => {
  const quiz = (questions: number) => ({
    kind: "quiz",
    quiz: { questions: Array.from({ length: questions }, () => ({})) },
  });
  const course = (change: Record<string, unknown> = {}) =>
    ({
      title: "Bien négocier son salaire",
      summary: "Résumé",
      description: "Description",
      instructor: "Formatrice fictive",
      coverUrl: "/medias/courses/c1/cover-abc-960.webp",
      certificateEnabled: true,
      audience: "Talents",
      objectives: ["Préparer un argumentaire"],
      status: "draft",
      modules: [{ lessons: [{ kind: "text", quiz: null }, quiz(2)] }],
      ...change,
    }) as unknown as Parameters<typeof courseReadiness>[0];

  it("une formation complète est prête, à 100 %", () => {
    const readiness = courseReadiness(course());
    expect(readiness.ready).toBe(true);
    expect(readiness.percent).toBe(100);
    expect(readiness.steps.find((step) => step.step === "publish")?.done).toBe(false);
  });

  it("l'attestation demande un quiz avec des questions, la couverture est obligatoire", () => {
    expect(
      publishProblems(course({ modules: [{ lessons: [{ kind: "text", quiz: null }] }] })),
    ).toEqual(["certificateQuiz"]);
    expect(publishProblems(course({ coverUrl: null }))).toEqual(["cover"]);
    expect(publishProblems(course({ modules: [{ lessons: [quiz(0)] }] }))).toEqual([
      "quiz",
      "certificateQuiz",
    ]);
  });

  it("chaque manque est rangé dans son étape ; le public ne bloque pas", () => {
    const readiness = courseReadiness(course({ coverUrl: null, audience: "" }));
    expect(readiness.ready).toBe(false);
    expect(readiness.steps.find((step) => step.step === "info")?.missing).toEqual(["cover"]);
    expect(readiness.steps.find((step) => step.step === "audience")?.done).toBe(false);
    expect(publishProblems(course({ audience: "" }))).toEqual([]);
    expect(readiness.percent).toBe(75);
  });

  it("reconnaît une vidéo MP4 ou WebM à ses premiers octets", () => {
    expect(sniffVideoType(new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70]))).toBe(
      "video/mp4",
    );
    expect(sniffVideoType(new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0]))).toBe("video/webm");
    expect(sniffVideoType(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0, 0, 0, 0]))).toBeNull();
    expect(coverAt("/medias/courses/c1/cover-abc-960.webp", 480)).toBe(
      "/medias/courses/c1/cover-abc-480.webp",
    );
  });
});

describe("modération : gravité et ordre de la file (étape 7)", () => {
  it("les signalements graves passent d'abord, puis les plus anciens", () => {
    const at = (day: number) => new Date(Date.UTC(2026, 9, day));
    const sorted = sortReports([
      { id: "spam-ancien", reason: "spam", createdAt: at(1) },
      { id: "arnaque-recente", reason: "scam", createdAt: at(10) },
      { id: "faux-ancien", reason: "fakeJob", createdAt: at(2) },
      { id: "harcelement-ancien", reason: "harassment", createdAt: at(3) },
    ]);
    expect(sorted.map((item) => item.id)).toEqual([
      "harcelement-ancien",
      "arnaque-recente",
      "faux-ancien",
      "spam-ancien",
    ]);
    expect([
      reportSeverity("scam"),
      reportSeverity("personalData"),
      reportSeverity("other"),
    ]).toEqual([2, 1, 0]);
  });

  it("une demande de paiement pèse plus qu'une organisation récente", () => {
    expect(jobSeverity(["payment"])).toBeGreaterThan(jobSeverity(["newOrg"]));
    expect(jobSeverity([])).toBe(0);
  });
});

describe("Admin v2 · étape 8 : coût de l'IA et fiches conseils", () => {
  const row = (key: string, costMicroUsd: number, people: number) => ({
    key,
    calls: 1,
    credits: 1,
    people,
    failures: 0,
    inputTokens: 0,
    outputTokens: 0,
    costMicroUsd,
  });
  const plans = [
    { code: "fictif_mois", name: "Mensuel", priceCents: 1000, interval: "month" },
    { code: "fictif_an", name: "Annuel", priceCents: 12000, interval: "year" },
    { code: "fictif_gratuit", name: "Gratuit", priceCents: 0, interval: "month" },
  ];

  it("alerte quand l'IA coûte 30 % du prix mensuel ou plus", () => {
    // 10 USD a month; 3 USD of AI per person = 30 %.
    const [monthly, yearly, free] = planCosts(
      [
        row("fictif_mois", 6_000_000, 2),
        row("fictif_an", 1_000_000, 1),
        row("fictif_gratuit", 5, 1),
      ],
      plans,
    );
    expect(monthly).toMatchObject({ perPersonMicroUsd: 3_000_000, alert: true });
    expect(monthly!.share).toBeCloseTo(0.3);
    // A yearly plan counts per month: 120 USD a year = 10 USD a month.
    expect(yearly).toMatchObject({ monthlyCents: 1000, alert: false });
    expect(free).toMatchObject({ share: null, alert: false });
  });

  it("propose les six sujets prévus, sans texte tant qu'ils ne sont pas écrits", () => {
    const tips = listTips(messages, {});
    expect(tips.map((tip) => tip.id)).toEqual([
      "cv",
      "letter",
      "interview",
      "salary",
      "firstJob",
      "network",
    ]);
    expect(tips.every((tip) => !tip.published && !tip.saved && tip.body === "")).toBe(true);
  });
});
