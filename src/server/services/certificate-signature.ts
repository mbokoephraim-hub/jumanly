/**
 * Digital signature of an attestation (brief talent § 2.9): Ed25519 on a canonical payload (number,
 * holder, course, hours, score, date). The PDF prints a fingerprint of the signature; the guilloche,
 * the drawn signature and the rosette are computed from it, so two attestations never look alike.
 *
 * The key comes from `CERTIFICATE_SIGNING_KEY` (32 bytes in base64). Without it, it is derived from
 * `BETTER_AUTH_SECRET`: rotating that secret then changes `keyId`, and older signatures can no
 * longer be checked (the record in the database still says whether the attestation exists).
 */
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
  type KeyObject,
} from "node:crypto";
import type { Certificate, PrismaClient } from "@/generated/prisma/client";

type Signable = Pick<
  Certificate,
  "code" | "holderName" | "courseTitle" | "hours" | "score" | "issuedAt"
>;

/** The signed text: keys sorted, dates in ISO, nothing else. */
export function canonicalPayload(certificate: Signable) {
  return JSON.stringify({
    code: certificate.code,
    course: certificate.courseTitle,
    holder: certificate.holderName,
    hours: certificate.hours,
    issuedAt: certificate.issuedAt.toISOString(),
    score: certificate.score ?? null,
  });
}

// PKCS#8 header of an Ed25519 private key, followed by the 32-byte seed.
const PKCS8_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

function seed() {
  const configured = process.env.CERTIFICATE_SIGNING_KEY;
  if (configured) {
    const bytes = Buffer.from(configured, "base64");
    if (bytes.length !== 32)
      throw new Error("CERTIFICATE_SIGNING_KEY doit faire 32 octets (base64).");
    return bytes;
  }
  const secret = process.env.BETTER_AUTH_SECRET ?? "jumanly-local";
  return createHash("sha256").update(`jumanly-certificate|${secret}`).digest();
}

let cached: { seed: string; privateKey: KeyObject; publicKey: KeyObject; keyId: string } | null =
  null;

function keys() {
  const raw = seed();
  const id = raw.toString("hex");
  if (cached?.seed === id) return cached;
  const privateKey = createPrivateKey({
    key: Buffer.concat([PKCS8_PREFIX, raw]),
    format: "der",
    type: "pkcs8",
  });
  const publicKey = createPublicKey(privateKey);
  const keyId = createHash("sha256")
    .update(publicKey.export({ format: "der", type: "spki" }))
    .digest("hex")
    .slice(0, 16);
  cached = { seed: id, privateKey, publicKey, keyId };
  return cached;
}

export function signCertificate(certificate: Signable) {
  const { privateKey, keyId } = keys();
  const signature = sign(null, Buffer.from(canonicalPayload(certificate)), privateKey);
  return { signature: signature.toString("base64"), keyId };
}

/**
 * `valid`: the signature matches the record. `unchecked`: signed by another key (rotated) or not
 * signed yet. `invalid`: the record no longer matches what was signed.
 */
export function checkSignature(
  certificate: Signable & Pick<Certificate, "signature" | "keyId">,
): "valid" | "invalid" | "unchecked" {
  const { publicKey, keyId } = keys();
  if (!certificate.signature || certificate.keyId !== keyId) return "unchecked";
  const ok = verify(
    null,
    Buffer.from(canonicalPayload(certificate)),
    publicKey,
    Buffer.from(certificate.signature, "base64"),
  );
  return ok ? "valid" : "invalid";
}

/** Fingerprint printed on the PDF: 24 hexadecimal characters in groups of 4. */
export function fingerprint(signature: string) {
  const hex = createHash("sha256").update(signature).digest("hex").toUpperCase();
  return { full: hex, short: hex.slice(0, 24).match(/.{4}/g)!.join("-") };
}

/** Signs an attestation issued before the signature existed, on its first display. */
export async function ensureSigned<T extends Certificate>(db: PrismaClient, certificate: T) {
  if (certificate.signature) return certificate;
  const signed = signCertificate(certificate);
  const signedAt = new Date();
  await db.certificate.update({
    where: { id: certificate.id },
    data: { ...signed, signedAt },
  });
  return { ...certificate, ...signed, signedAt };
}
