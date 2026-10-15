import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { personalData, personalDataResponseInit } from "@/server/services/personal-data";

/**
 * « Télécharger mes données » (partie 10): everything Jumanly holds about the person, as JSON.
 * Passwords, tokens and other people's data are never included.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const data = await personalData(db, user.id);
  return new NextResponse(
    JSON.stringify(data, null, 2),
    personalDataResponseInit("jumanly-mes-donnees.json"),
  );
}
