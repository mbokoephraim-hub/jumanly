import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CareerTexts } from "@/components/phone/career/server";
import { handleOf } from "@/components/phone/career/data";
import { HeadForm } from "@/components/phone/career/edit";
import { initialsOf, toneOf } from "@/components/phone/fil/data";
import { parseSocialLinks, SOCIAL_KINDS, type SocialKind } from "@/lib/social-links";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getFullProfile } from "@/server/services/profile";
import { isPhone } from "@/server/view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneCareer.form");
  return { title: t("headTitle"), robots: { index: false } };
}

/**
 * « Modifier le profil » on the phone (Modèle B, planche Carrière-modifier). On a tablet or a
 * computer, the profile's own window does it.
 */
export default async function CareerEditPage() {
  const user = await requireUser("/app/career/profil");
  if (!(await isPhone())) redirect("/app/profil?fenetre=modifier");
  const profile = await getFullProfile(db, user.id);
  const name = profile.user.name;
  const socials = parseSocialLinks(profile.socialLinks);
  return (
    <CareerTexts>
      <HeadForm
        values={{
          name,
          handle: profile.handle ?? handleOf(name),
          handleChosen: profile.handle !== null,
          socials: Object.fromEntries(
            SOCIAL_KINDS.map((kind) => [kind, socials[kind] ?? ""]),
          ) as Record<SocialKind, string>,
          showEmail: profile.showEmail,
          headline: profile.headline ?? "",
          city: profile.user.city ?? "",
          summary: profile.summary ?? "",
          availability: profile.availability,
          image: profile.user.image,
          banner: profile.banner,
          initials: initialsOf(name),
          tone: toneOf(name, false),
        }}
      />
    </CareerTexts>
  );
}
