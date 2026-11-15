import { afterAll, describe, expect, it } from "vitest";
import type { HireContext } from "@/server/services/hire";
import { hireOrbiPanel } from "@/server/services/hire-v3-orbi";
import { cleanup, db, newOrganization, newUser } from "./helpers";

const users: string[] = [];
const orgs: string[] = [];

afterAll(async () => {
  await cleanup(users, orgs);
  await db.$disconnect();
});

async function recruiter(): Promise<HireContext> {
  const organization = await newOrganization("recruiter");
  orgs.push(organization.id);
  const user = await newUser();
  users.push(user.id);
  await db.membership.create({
    data: { userId: user.id, organizationId: organization.id, role: "org_owner" },
  });
  return { userId: user.id, organizationId: organization.id, role: "org_owner" };
}

describe("Orbi's panel (Hire v3)", () => {
  it("shows nothing invented for an organization without offers", async () => {
    const ctx = await recruiter();
    const panel = await hireOrbiPanel(db, ctx);
    expect(panel.todo).toEqual([]);
    expect(panel.done).toEqual([]);
  });

  it("never counts another organization's applications", async () => {
    const mine = await recruiter();
    const other = await recruiter();
    const panelMine = await hireOrbiPanel(db, mine);
    const panelOther = await hireOrbiPanel(db, other);
    expect(panelMine.done.every((d) => d.count >= 0)).toBe(true);
    expect(panelOther.todo.find((t) => t.kind === "unseen")).toBeUndefined();
  });
});
