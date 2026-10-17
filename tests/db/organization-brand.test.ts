import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";
import {
  BRAND_IMAGE_MAX_BYTES,
  BrandImageError,
  removeBrandImage,
  saveBrandImage,
} from "@/server/services/organization-brand";
import { fakeStorage, PUBLIC_PREFIX } from "@/server/storage";
import { cleanup, db, newOrganization } from "./helpers";

const orgs: string[] = [];
afterAll(() => cleanup([], orgs));

const image = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: "#14745F" } })
    .jpeg()
    .toBuffer()
    .then((buffer) => new Uint8Array(buffer));

describe("bannière et logo de l'entreprise (prompt 4 bis, écrans 63 à 66)", () => {
  it("enregistre la bannière en WebP 3:1 dans trois largeurs, et l'adresse sur l'organisation", async () => {
    const org = await newOrganization("company");
    orgs.push(org.id);
    const storage = fakeStorage();
    const url = await saveBrandImage(db, storage, org.id, "banner", await image(1200, 900));
    expect(url).toMatch(new RegExp(`^/medias/orgs/${org.id}/banner-[\\w-]+-1000\\.webp$`));
    const key = `${PUBLIC_PREFIX}${url.slice("/medias/".length)}`;
    for (const width of [640, 1000, 1500]) {
      const file = await storage.get(key.replace("-1000.webp", `-${width}.webp`));
      expect(file?.contentType).toBe("image/webp");
      const meta = await sharp(file!.bytes).metadata();
      expect([meta.width, meta.height]).toEqual([width, Math.round(width / 3)]);
    }
    expect((await db.organization.findUniqueOrThrow({ where: { id: org.id } })).banner).toBe(url);
  });

  it("remplace l'ancien logo, puis le retire", async () => {
    const org = await newOrganization("company");
    orgs.push(org.id);
    const storage = fakeStorage();
    const first = await saveBrandImage(db, storage, org.id, "logo", await image(300, 200));
    const second = await saveBrandImage(db, storage, org.id, "logo", await image(400, 400));
    expect(second).not.toBe(first);
    const keyOf = (url: string) => `${PUBLIC_PREFIX}${url.slice("/medias/".length)}`;
    expect(await storage.get(keyOf(first))).toBeNull();
    expect(await storage.get(keyOf(second))).not.toBeNull();
    await removeBrandImage(db, storage, org.id, "logo");
    expect(await storage.get(keyOf(second))).toBeNull();
    expect((await db.organization.findUniqueOrThrow({ where: { id: org.id } })).logo).toBeNull();
  });

  it("refuse ce qui n'est pas une image, un fichier vide ou trop lourd", async () => {
    const org = await newOrganization("company");
    orgs.push(org.id);
    const storage = fakeStorage();
    const pdf = new TextEncoder().encode("%PDF-1.7");
    await expect(saveBrandImage(db, storage, org.id, "logo", pdf)).rejects.toEqual(
      new BrandImageError("fileType"),
    );
    await expect(
      saveBrandImage(db, storage, org.id, "logo", new TextEncoder().encode("<svg/>")),
    ).rejects.toEqual(new BrandImageError("fileType"));
    await expect(saveBrandImage(db, storage, org.id, "logo", new Uint8Array())).rejects.toEqual(
      new BrandImageError("fileSize"),
    );
    await expect(
      saveBrandImage(db, storage, org.id, "banner", new Uint8Array(BRAND_IMAGE_MAX_BYTES + 1)),
    ).rejects.toEqual(new BrandImageError("fileSize"));
    expect((await db.organization.findUniqueOrThrow({ where: { id: org.id } })).logo).toBeNull();
  });
});
