import { chromium, devices } from "@playwright/test";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ ...devices["Pixel 7"], baseURL: "http://localhost:3100" });
await p.goto("/connexion");
const f = p.locator("form").filter({ has: p.locator('input[name="password"]') });
await f.locator('input[name="email"]').fill("talent.pro@jumanly.test");
await f.locator('input[name="password"]').fill("Demo-Jumanly-2026");
await p.getByRole("button", { name: "Se connecter", exact: true }).click();
await p.waitForURL((u) => !u.pathname.startsWith("/connexion"));
for (const u of ["/app", "/app/jobs", "/app/career"]) {
  await p.goto(u);
  await p.waitForTimeout(2000);
  await p.screenshot({ path: "/tmp/claude-0/s" + u.replace(/\//g, "_") + ".png" });
}
await b.close();
