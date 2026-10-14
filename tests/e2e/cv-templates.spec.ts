import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { expectAccessible } from "./a11y";
import { demo, logIn } from "./session";

/**
 * Definition of done of the CV templates (docs/modeles-cv/SPECIFICATION-MODELES-CV.md § 11):
 * visual comparison, same pages in preview and PDF, every field in the PDF text, neutral PDF,
 * entitlements checked on the server. Needs poppler-utils (pdftotext, pdfinfo, pdftoppm).
 */

const FREE_TEMPLATES = [
  ["01", "classique"],
  ["02", "epure"],
  ["03", "premier-emploi"],
  ["04", "moderne"],
  ["05", "colonne"],
] as const;
const REFERENCES = "docs/modeles-cv/modeles/apercus/pages";
const BRAND = [
  [0x0f, 0x3f, 0x37],
  [0xa6, 0xf2, 0x6b],
] as const;

/** Without accents or case: pdftotext writes « Â » as « A » + a combining accent. */
const plain = (text: string) => text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();

const tmp = () => mkdtempSync(join(tmpdir(), "cv-"));

async function readyCv(page: Page, url: string) {
  await page.goto(url);
  await page.waitForFunction(() => document.body.dataset.pret === "1");
}

function pdfText(file: string) {
  return execFileSync("pdftotext", ["-layout", file, "-"]).toString();
}
function pdfPages(file: string) {
  return Number(/Pages:\s+(\d+)/.exec(execFileSync("pdfinfo", [file]).toString())?.[1]);
}

/** Pixels of the PDF close to a Jumanly colour (PPM rendering at 40 dpi). */
function brandPixels(file: string) {
  const dir = tmp();
  execFileSync("pdftoppm", ["-r", "40", file, join(dir, "p")]);
  const pages = execFileSync("ls", [dir]).toString().trim().split("\n");
  let count = 0;
  for (const name of pages) {
    const buffer = readFileSync(join(dir, name));
    // P6 header: « P6\n<w> <h>\n255\n ».
    let offset = 0;
    for (let lines = 0; lines < 3; offset++) if (buffer[offset] === 0x0a) lines++;
    for (let index = offset; index + 2 < buffer.length; index += 3) {
      const [r, g, b] = [buffer[index]!, buffer[index + 1]!, buffer[index + 2]!];
      if (BRAND.some(([R, G, B]) => Math.abs(r - R) + Math.abs(g - G) + Math.abs(b - B) < 12)) {
        count++;
      }
    }
  }
  return count;
}

test.describe("modèles de CV : rendu (desktop)", () => {
  test.skip(({ isMobile }) => isMobile, "Un seul rendu, sur ordinateur");
  // A4 at 150 dpi: 794 CSS px × 1.5625 = 1240 px, the size of the reference images.
  test.use({ deviceScaleFactor: 1.5625, viewport: { width: 900, height: 1200 } });

  for (const [number, id] of FREE_TEMPLATES) {
    test(`« ${id} » ressemble au PDF de référence`, async ({ page }) => {
      await readyCv(page, `/dev/cv/${id}?donnees=junior&photo=1`);
      const pages = page.locator(".cv-pages > .cv-page");
      const references = execFileSync("ls", [REFERENCES])
        .toString()
        .split("\n")
        .filter((name) => name.startsWith(`${number}-${id}-`));
      await expect(pages).toHaveCount(references.length);
      for (const [index, name] of references.sort().entries()) {
        const shot = await pages.nth(index).screenshot({ animations: "disabled" });
        if (process.env.CV_SHOTS) writeFileSync(join(process.env.CV_SHOTS, name), shot);
        const reference = readFileSync(join(REFERENCES, name));
        const difference = await page.evaluate(
          async ([ours, theirs]) => {
            const load = async (base64: string) => {
              const image = new Image();
              image.src = `data:image/png;base64,${base64}`;
              await image.decode();
              return image;
            };
            const [a, b] = await Promise.all([load(ours!), load(theirs!)]);
            // Compared at a quarter of the size: the layout must match, not each glyph's pixels.
            const width = 310;
            const height = 438;
            // Halved twice: a single scaling would skip pixels instead of averaging them.
            const scaled = (source: CanvasImageSource, w: number, h: number) => {
              const canvas = document.createElement("canvas");
              canvas.width = w;
              canvas.height = h;
              canvas.getContext("2d")!.drawImage(source, 0, 0, w, h);
              return canvas;
            };
            const pixels = (image: HTMLImageElement) =>
              scaled(scaled(image, width * 2, height * 2), width, height)
                .getContext("2d")!
                .getImageData(0, 0, width, height).data;
            const [x, y] = [pixels(a), pixels(b)];
            let different = 0;
            for (let index = 0; index < x.length; index += 4) {
              const delta =
                Math.abs(x[index]! - y[index]!) +
                Math.abs(x[index + 1]! - y[index + 1]!) +
                Math.abs(x[index + 2]! - y[index + 2]!);
              if (delta > 120) different++;
            }
            return different / (width * height);
          },
          [shot.toString("base64"), reference.toString("base64")],
        );
        // Same blocks at the same places: only font rendering differs from one machine to another
        // (about 0.2 % locally, 3 % on the CI runner); another template differs by 15 % or more.
        expect(
          difference,
          `${name}: ${(difference * 100).toFixed(2)} % de pixels différents`,
        ).toBeLessThan(0.06);
      }
    });
  }

  test("le PDF garde tous les champs dans l'ordre de lecture, et le même nombre de pages que l'aperçu", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const dir = tmp();
    for (const data of ["junior", "senior", "academique"]) {
      for (const density of ["airy", "standard", "compact"]) {
        await readyCv(page, `/dev/cv/classique?donnees=${data}&densite=${density}`);
        const preview = await page.locator(".cv-pages > .cv-page").count();
        // Every text node of the pages, in document order (gauge levels included).
        const texts = await page.evaluate(() => {
          const walker = document.createTreeWalker(
            document.querySelector(".cv-pages")!,
            NodeFilter.SHOW_TEXT,
          );
          const found: string[] = [];
          while (walker.nextNode()) {
            const text = (walker.currentNode.textContent ?? "").replace(/\s+/g, " ").trim();
            // Hidden by the template (section numbers of another template): not printed.
            const parent = walker.currentNode.parentElement;
            if (text && parent?.checkVisibility() && !parent.closest(".cv-pied")) found.push(text);
          }
          return found;
        });
        const file = join(dir, `${data}-${density}.pdf`);
        writeFileSync(file, await page.pdf({ preferCSSPageSize: true, printBackground: true }));
        expect(pdfPages(file), `${data} ${density}`).toBe(preview);
        const text = plain(pdfText(file).replace(/\s+/g, " "));
        // Every word of every element, in order (gauge levels are written in the text).
        let cursor = 0;
        for (const element of texts) {
          const first = element.split(/[\s()·,]+/).find((word) => word.length > 3) ?? element;
          const word = plain(first);
          const found = text.indexOf(word, cursor);
          expect(found, `« ${first} » (${data}, ${density})`).toBeGreaterThanOrEqual(0);
          cursor = found;
        }
        expect(text).toMatch(/avance|expert/);
      }
    }
  });
});

test.describe("modèles de CV : parcours", () => {
  test("galerie, mise en forme et couleur refusée", async ({ page }) => {
    await logIn(page, demo.talentStarter);
    await page.goto("/app/career/cv");
    await page.getByRole("button", { name: "Nouveau CV" }).click();
    await expect(page).toHaveURL(/\/app\/career\/cv\/[^/?]+$/);
    const id = new URL(page.url()).pathname.split("/").pop()!;

    // Optional phone, on this CV only: kept once saved, refused when it is not a number (its place in
    // the document is checked by the unit tests).
    const details = page.locator("form").filter({ has: page.locator("#cv-phone") });
    await details.locator("#cv-phone").fill("abc");
    await details.getByRole("button").last().click();
    await expect(page.getByText("Numéro de téléphone non valide")).toBeVisible();
    await details.locator("#cv-phone").fill("+243 970 000 000");
    await details.getByRole("button").last().click();
    await expect(page).toHaveURL(/ok=1/);
    await page.goto(`/app/career/cv/${id}`);
    await expect(page.locator("#cv-phone")).toHaveValue("+243 970 000 000");

    await page.goto(`/app/career/cv/modeles?cv=${id}&modele=moderne`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Choisir un modèle");
    await expectAccessible(page);
    await page.getByRole("button", { name: "Utiliser ce modèle" }).click();
    await expect(page).toHaveURL(/vue=style/);
    await expect(page.getByText("Modèle appliqué. Votre contenu n'a pas changé.")).toBeVisible();

    // A Pro template shows its lock to a Starter account: no button to apply it.
    await page.goto(`/app/career/cv/modeles?cv=${id}&modele=academique`);
    await expect(page.locator("#detail")).toContainText("Inclus dans");
    await expect(page.getByRole("button", { name: "Utiliser ce modèle" })).toHaveCount(0);

    // Colour under 4.5:1: refused, a darker one is proposed.
    await page.goto(`/app/career/cv/${id}?vue=style`);
    await page.locator("#style-custom").fill("#FFE066");
    await page.locator("#style-custom").press("Enter");
    await expect(page.getByRole("alert").filter({ hasText: "#" })).toBeVisible();
    await expectAccessible(page);
  });

  test("un compte Free ne peut ni appliquer ni exporter un modèle réservé, même par l'API", async ({
    page,
  }) => {
    await logIn(page, demo.talentFree);
    await page.goto("/app/career/cv");
    await page.getByRole("button", { name: "Nouveau CV" }).click();
    await expect(page).toHaveURL(/\/app\/career\/cv\/[^/?]+$/);
    const id = new URL(page.url()).pathname.split("/").pop()!;

    // The apply action refuses a Pro template even when the form is forged.
    await page.goto(`/app/career/cv/modeles?cv=${id}&modele=moderne`);
    const apply = page.getByRole("button", { name: "Utiliser ce modèle" });
    await expect(apply).toBeEnabled();
    await page.waitForLoadState("networkidle");
    await apply.evaluate((button: HTMLButtonElement) => {
      const input = button.form!.querySelector<HTMLInputElement>('input[name="template"]')!;
      input.value = "executif";
      button.form!.requestSubmit(button);
    });
    await expect(page).toHaveURL(/erreur=modele/);

    // A CV left on a Pro template (plan downgraded): export refused before any rendering.
    execFileSync("pnpm", ["exec", "tsx", "tests/e2e/set-cv-template.ts", id, "executif"]);
    const api = await page.request.post(`/api/cv/${id}/export?format=pdf`);
    expect(api.status()).toBe(403);
    expect(await api.json()).toEqual({ error: "locked" });
    await page.goto(`/app/career/cv/${id}`);
    await expect(page.getByText(/Votre forfait ne comprend plus le modèle/).first()).toBeVisible();
  });

  test("le PDF exporté est neutre : ni Jumanly, ni logo, ni couleur de la marque", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await logIn(page, demo.talentPro);
    await page.goto("/app/career/cv");
    await page.getByRole("button", { name: "Nouveau CV" }).click();
    await expect(page).toHaveURL(/\/app\/career\/cv\/[^/?]+$/);
    const id = new URL(page.url()).pathname.split("/").pop()!;
    // The demo accounts use @jumanly.test addresses: the e-mail is left off this CV.
    await page.getByLabel("Afficher mon e-mail sur le CV").uncheck();
    await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
    await expect(page.getByLabel("Afficher mon e-mail sur le CV")).not.toBeChecked();

    const response = await page.request.post(`/api/cv/${id}/export?format=pdf`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("application/pdf");
    const file = join(tmp(), "cv.pdf");
    writeFileSync(file, await response.body());
    const info = execFileSync("pdfinfo", [file]).toString();
    expect(info).toMatch(/Title:\s+CV Bisimwa Fictif/);
    expect(info).toMatch(/Author:\s+Bisimwa Fictif/);
    expect(info).not.toMatch(/jumanly|chrom|skia/i);
    expect(pdfText(file)).not.toMatch(/jumanly/i);
    expect(readFileSync(file).toString("latin1")).not.toMatch(/jumanly/i);
    expect(brandPixels(file)).toBe(0);
  });
});
