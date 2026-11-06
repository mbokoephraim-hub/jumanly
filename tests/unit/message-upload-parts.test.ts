import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  MediaError,
  UPLOAD_MAX_BYTES,
  UPLOAD_PART_BYTES,
  storeUpload,
  storeUploadPart,
  takeUploadParts,
} from "@/server/services/message-media";

// Only the clean-up of old parts reaches the database; the files stay in the fake storage.
const db = { storedFile: { deleteMany: async () => ({ count: 0 }) } } as unknown as PrismaClient;
const previous = process.env.STORAGE_DRIVER;

beforeAll(() => {
  process.env.STORAGE_DRIVER = "fake";
});
afterAll(() => {
  process.env.STORAGE_DRIVER = previous;
});

/** A PDF of `size` bytes: its signature, then filler. */
const pdf = (size: number) => {
  const bytes = new Uint8Array(size).fill(0x20);
  bytes.set([0x25, 0x50, 0x44, 0x46], 0);
  return bytes;
};

describe("documents de la messagerie envoyés en plusieurs parties", () => {
  it("accepte un diplôme scanné de 8 Mo, envoyé en parties de 3 Mo", async () => {
    const file = pdf(8 * 1024 * 1024);
    const id = "a1b2c3d4e5f6a7b8c9d0e1f2";
    for (let index = 0; index * UPLOAD_PART_BYTES < file.byteLength; index++)
      await storeUploadPart(
        db,
        "talent",
        id,
        index,
        file.slice(index * UPLOAD_PART_BYTES, (index + 1) * UPLOAD_PART_BYTES),
      );
    const bytes = await takeUploadParts(db, "talent", id, 3);
    expect(Buffer.compare(bytes, file)).toBe(0);
    const upload = await storeUpload(db, "conv", bytes, "diplome.pdf");
    expect(upload).toMatchObject({ name: "diplome.pdf", type: "application/pdf" });
    // The parts are gone once the document is put back together.
    await expect(takeUploadParts(db, "talent", id, 3)).rejects.toBeInstanceOf(MediaError);
  });

  it("refuse une partie trop lourde, un identifiant douteux ou un document de plus de 10 Mo", async () => {
    await expect(
      storeUploadPart(db, "talent", "ffffffffffffffffffff", 0, pdf(UPLOAD_PART_BYTES + 1)),
    ).rejects.toMatchObject({ code: "size" });
    await expect(storeUploadPart(db, "talent", "../autre", 0, pdf(10))).rejects.toMatchObject({
      code: "type",
    });
    await expect(
      storeUpload(db, "conv", pdf(UPLOAD_MAX_BYTES + 1), "trop.pdf"),
    ).rejects.toMatchObject({ code: "size" });
  });

  it("ne mélange pas les parties de deux personnes", async () => {
    const id = "0123456789abcdef0123";
    await storeUploadPart(db, "talent", id, 0, pdf(100));
    await expect(takeUploadParts(db, "recruteur", id, 1)).rejects.toBeInstanceOf(MediaError);
  });
});
