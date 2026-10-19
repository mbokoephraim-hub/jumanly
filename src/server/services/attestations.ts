/**
 * Attestations of a talent (planche talent-3 § 6-7): the list, one attestation found by its id or
 * its number, the switch « Visible sur mon profil », and the public check of a number.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { checkSignature, ensureSigned } from "./certificate-signature";

const withCourse = {
  enrollment: { select: { userId: true, course: { select: { slug: true } } } },
} as const;

export async function talentAttestations(db: PrismaClient, userId: string) {
  return db.certificate.findMany({
    where: { enrollment: { userId }, revokedAt: null },
    orderBy: { issuedAt: "desc" },
    include: withCourse,
  });
}

/** One of the talent's attestations, signed if it was not yet. Null when it is not theirs. */
export async function talentAttestation(db: PrismaClient, userId: string, idOrCode: string) {
  const found = await db.certificate.findFirst({
    where: {
      enrollment: { userId },
      revokedAt: null,
      OR: [{ id: idOrCode }, { code: idOrCode.toUpperCase() }],
    },
    include: withCourse,
  });
  if (!found) return null;
  const signed = await ensureSigned(db, found);
  return { ...signed, signature: signed.signature! };
}

export async function setAttestationOnProfile(
  db: PrismaClient,
  userId: string,
  id: string,
  onProfile: boolean,
) {
  const { count } = await db.certificate.updateMany({
    where: { id, enrollment: { userId } },
    data: { onProfile },
  });
  return count > 0;
}

export type PublicCheck =
  | { state: "authentic"; signature: "valid" | "unchecked" }
  | { state: "modified" }
  | { state: "revoked" }
  | { state: "unknown" };

/** What the public page says about a number: authentic, modified, revoked or not found. */
export async function checkAttestation(db: PrismaClient, code: string) {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,40}$/.test(normalized))
    return { check: { state: "unknown" } as PublicCheck, certificate: null };
  const certificate = await db.certificate.findUnique({ where: { code: normalized } });
  if (!certificate) return { check: { state: "unknown" } as PublicCheck, certificate: null };
  if (certificate.revokedAt) return { check: { state: "revoked" } as PublicCheck, certificate };
  const signature = checkSignature(certificate);
  if (signature === "invalid") return { check: { state: "modified" } as PublicCheck, certificate };
  return { check: { state: "authentic", signature } as PublicCheck, certificate };
}
