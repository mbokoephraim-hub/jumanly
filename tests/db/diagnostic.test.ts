import { afterAll, describe, expect, it } from "vitest";
import { ruleDiagnostic } from "@/server/services/diagnostic";
import { answersSchema } from "@/server/services/diagnostic-scoring";
import {
  demandedSkills,
  discardDraft,
  getDraft,
  runDiagnosticReminders,
  saveDiagnostic,
  saveDraft,
  scheduleReminder,
} from "@/server/services/diagnostic-store";
import { cleanup, db, newUser } from "./helpers";

const users: string[] = [];
afterAll(async () => {
  await cleanup(users);
  await db.$disconnect();
});

const answers = answersSchema.parse({
  situation: "a3",
  goal: "a3",
  targetRole: "Comptable",
  experience: "a3",
  education: "bachelor",
  cvStatus: "a2",
  coverLetter: "a2",
  onlineProfile: "a2",
  confidence: 3,
  interviews: "a2",
  pitch: "a2",
  applications: "a2",
  obstacle: "a3",
  time: "a2",
  mobility: "a2",
  workMode: "a2",
  contacts: "a2",
});

describe("diagnostic · brouillon, enregistrement, rappel", () => {
  it("garde chaque réponse pour reprendre plus tard, puis l'efface une fois le bilan établi", async () => {
    const user = await newUser();
    users.push(user.id);
    expect(await getDraft(db, user.id)).toBeNull();
    expect(await saveDraft(db, user.id, { situation: "a2", targetRole: "Comptable" }, 3)).toBe(
      true,
    );
    expect(await saveDraft(db, user.id, { situation: "zz" }, 4)).toBe(false);
    const draft = await getDraft(db, user.id);
    expect(draft?.step).toBe(3);
    expect(draft?.answers).toMatchObject({ situation: "a2", targetRole: "Comptable" });

    const diagnostic = await saveDiagnostic(db, {
      userId: user.id,
      level: "simple",
      answers,
      result: ruleDiagnostic(answers),
      stage: "Construction",
    });
    expect(await getDraft(db, user.id)).toBeNull();
    const notification = await db.notification.findFirstOrThrow({ where: { userId: user.id } });
    expect(notification.type).toBe("diagnosticReady");
    expect(notification.href).toBe(`/app/career/diagnostic?bilan=${diagnostic.id}`);
    await discardDraft(db, user.id);
  });

  it("« Refaire dans 30 jours » : une seule notification, 30 jours après le diagnostic", async () => {
    const user = await newUser();
    users.push(user.id);
    const diagnostic = await db.careerDiagnostic.create({
      data: { userId: user.id, level: "simple", answers: {}, result: {} },
    });
    const other = await newUser();
    users.push(other.id);
    expect(await scheduleReminder(db, other.id, diagnostic.id)).toBeNull();
    const at = await scheduleReminder(db, user.id, diagnostic.id);
    expect(at?.getTime()).toBe(diagnostic.createdAt.getTime() + 30 * 86_400_000);

    const day29 = new Date(diagnostic.createdAt.getTime() + 29 * 86_400_000);
    expect(await runDiagnosticReminders(db, day29, [user.id])).toBe(0);
    const day31 = new Date(diagnostic.createdAt.getTime() + 31 * 86_400_000);
    expect(await runDiagnosticReminders(db, day31, [user.id])).toBe(1);
    expect(await runDiagnosticReminders(db, day31, [user.id])).toBe(0);
    const sent = await db.notification.findMany({
      where: { userId: user.id, type: "diagnosticReminder" },
    });
    expect(sent).toHaveLength(1);
  });

  it("compte les vraies offres publiées comparées", async () => {
    const all = await demandedSkills(db, "");
    expect(all.scope).toBe("all");
    expect(all.offers).toBe(
      await db.job.count({ where: { status: "published" } }).then((n) => Math.min(n, 200)),
    );
    expect(all.skills.length).toBeLessThanOrEqual(5);
    const none = await demandedSkills(db, "Zzzzzzzz introuvable");
    expect(none.scope).toBe("all");
  });
});
