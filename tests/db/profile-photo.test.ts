import { afterAll, describe, expect, it } from "vitest";
import {
  PhotoError,
  photoByToken,
  photoType,
  PHOTO_MAX_BYTES,
  removePhoto,
  savePhoto,
} from "@/server/services/profile-photo";
import { cleanup, db, newUser } from "./helpers";

const users: string[] = [];
afterAll(() => cleanup(users));

const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);
const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("photo de profil (prompt 6, écran 26)", () => {
  it("reconnaît le type par les premiers octets, pas par le nom", () => {
    expect(photoType(jpeg)).toBe("image/jpeg");
    expect(photoType(png)).toBe("image/png");
    expect(photoType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });

  it("refuse un fichier qui n'est pas une image, vide ou trop lourd", async () => {
    const user = await newUser();
    users.push(user.id);
    await expect(savePhoto(db, user.id, new TextEncoder().encode("GIF89a"))).rejects.toEqual(
      new PhotoError("type"),
    );
    await expect(savePhoto(db, user.id, new Uint8Array())).rejects.toEqual(new PhotoError("size"));
    const big = new Uint8Array(PHOTO_MAX_BYTES + 1);
    big.set(jpeg);
    await expect(savePhoto(db, user.id, big)).rejects.toEqual(new PhotoError("size"));
  });

  it("change d'adresse à chaque photo ; l'ancienne ne répond plus", async () => {
    const user = await newUser();
    users.push(user.id);
    const first = await savePhoto(db, user.id, jpeg);
    const second = await savePhoto(db, user.id, png);
    expect(first).not.toBe(second);
    expect(second).toMatch(/^\/api\/photo\/[\w-]{24}$/);
    expect(await photoByToken(db, first.split("/").pop()!)).toBeNull();
    const kept = await photoByToken(db, second.split("/").pop()!);
    expect(kept?.contentType).toBe("image/png");
    expect((await db.user.findUniqueOrThrow({ where: { id: user.id } })).image).toBe(second);
  });

  it("retirer la photo rend les initiales et coupe l'adresse", async () => {
    const user = await newUser();
    users.push(user.id);
    const url = await savePhoto(db, user.id, jpeg);
    await removePhoto(db, user.id);
    expect((await db.user.findUniqueOrThrow({ where: { id: user.id } })).image).toBeNull();
    expect(await photoByToken(db, url.split("/").pop()!)).toBeNull();
  });
});
