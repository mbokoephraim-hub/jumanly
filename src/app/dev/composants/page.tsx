import type { Metadata } from "next";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Inbox, Sparkles } from "lucide-react";
import {
  Alerte,
  ArcProgression,
  Avatar,
  BarreProgression,
  Bouton,
  BoutonLien,
  Carte,
  CaseACocher,
  ChampTexte,
  Chargeur,
  EtatVide,
  GroupeRadio,
  Interrupteur,
  JaugeQuota,
  ListeDeroulante,
  Logo,
  Onglets,
  OrbeIA,
  Pastille,
  ScoreExplique,
  Squelette,
  TexteCarte,
  TitreCarte,
  ZoneTexte,
  type VarianteBouton,
} from "@/components/ui";
import { DemoModale } from "./demo-modale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("devComposants");
  // Page interne : jamais indexée par les moteurs de recherche.
  return { title: t("titre"), robots: { index: false, follow: false } };
}

function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-brume pt-8">
      <h2 className="text-h2 font-medium">{titre}</h2>
      {children}
    </section>
  );
}

function Etat({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <span className="text-legende text-ardoise">{libelle}</span>
      {children}
    </div>
  );
}

const variantes: VarianteBouton[] = ["primaire", "secondaire", "contour", "fantome", "danger"];

/** Vitrine de la bibliothèque de composants, avec tous leurs états. */
export default function PageComposants() {
  const t = useTranslations("devComposants");
  const e = useTranslations("devComposants.etats");
  const optionsPays = [
    { valeur: "cd", libelle: t("champs.paysA") },
    { valeur: "cm", libelle: t("champs.paysB") },
    { valeur: "sn", libelle: t("champs.paysC") },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <Logo hauteur={36} />
        <h1 className="text-[32px] leading-10 font-semibold md:text-h1">{t("titre")}</h1>
        <p className="max-w-2xl text-ardoise">{t("intro")}</p>
        <div className="flex flex-wrap gap-2">
          <BoutonLien href="/" variante="contour" taille="sm">
            {t("gabaritPublic")}
          </BoutonLien>
          <BoutonLien href="/app" variante="contour" taille="sm">
            {t("gabaritEspace")}
          </BoutonLien>
        </div>
      </header>

      <Section titre={t("sections.couleurs")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {(
            [
              ["sapin", "bg-sapin"],
              ["lime", "bg-lime"],
              ["creme", "bg-creme border border-brume"],
              ["feuille", "bg-feuille"],
              ["mentheIa", "bg-menthe-ia"],
              ["nuit", "bg-nuit"],
              ["neon", "bg-neon"],
              ["ardoise", "bg-ardoise"],
              ["brume", "bg-brume"],
              ["ambre", "bg-ambre"],
              ["corail", "bg-corail"],
              ["mentheClaire", "bg-menthe-claire"],
            ] as const
          ).map(([cle, classe]) => (
            <div key={cle} className="flex flex-col gap-2">
              <div className={`h-16 rounded-petit ${classe}`} />
              <span className="text-legende">{t(`couleurs.${cle}`)}</span>
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="h-20 rounded-composant bg-degrade-signature" />
          <div className="h-20 rounded-composant bg-degrade-intelligence" />
          <div className="h-20 rounded-composant bg-degrade-profondeur" />
        </div>
      </Section>

      <Section titre={t("sections.typographie")}>
        <p className="text-display font-semibold">{t("typo.display")}</p>
        <p className="text-h1 font-semibold">{t("typo.h1")}</p>
        <p className="text-h2 font-medium">{t("typo.h2")}</p>
        <p className="text-label font-medium text-feuille">{t("typo.label")}</p>
        <p className="text-corps">{t("typo.corps")}</p>
        <p className="text-legende font-light">{t("typo.legende")}</p>
      </Section>

      <Section titre={t("sections.boutons")}>
        <div className="flex flex-col gap-6">
          {variantes.map((variante) => (
            <div key={variante} className="flex flex-wrap items-end gap-4">
              <Etat libelle={t(`variantes.${variante}`)}>
                <Bouton variante={variante}>{t("boutons.action")}</Bouton>
              </Etat>
              <Etat libelle={e("icone")}>
                <Bouton variante={variante} icone={<ArrowRight aria-hidden className="size-4" />}>
                  {t("boutons.action")}
                </Bouton>
              </Etat>
              <Etat libelle={e("chargement")}>
                <Bouton variante={variante} chargement>
                  {t("boutons.action")}
                </Bouton>
              </Etat>
              <Etat libelle={e("desactive")}>
                <Bouton variante={variante} disabled>
                  {t("boutons.action")}
                </Bouton>
              </Etat>
            </div>
          ))}
          <div className="flex flex-wrap items-end gap-4">
            <Etat libelle={e("petit")}>
              <Bouton taille="sm">{t("boutons.action")}</Bouton>
            </Etat>
            <Etat libelle={e("moyen")}>
              <Bouton taille="md">{t("boutons.action")}</Bouton>
            </Etat>
            <Etat libelle={e("grand")}>
              <Bouton taille="lg">{t("boutons.action")}</Bouton>
            </Etat>
            <Etat libelle={e("lien")}>
              <BoutonLien href="/app" variante="secondaire">
                {t("boutons.lien")}
              </BoutonLien>
            </Etat>
          </div>
        </div>
      </Section>

      <Section titre={t("sections.champs")}>
        <div className="grid gap-6 md:grid-cols-2">
          <ChampTexte
            id="demo-nom"
            label={t("champs.nom")}
            placeholder={t("champs.nomExemple")}
            requis
          />
          <ChampTexte
            id="demo-email"
            type="email"
            label={t("champs.email")}
            aide={t("champs.emailAide")}
          />
          <ChampTexte
            id="demo-erreur"
            label={t("champs.email")}
            defaultValue={t("champs.emailInvalide")}
            erreur={t("champs.emailErreur")}
            requis
          />
          <ChampTexte
            id="demo-desactive"
            label={t("champs.desactive")}
            defaultValue={t("champs.valeurFixe")}
            disabled
          />
          <ListeDeroulante
            id="demo-pays"
            label={t("champs.pays")}
            invite={t("champs.paysInvite")}
            options={optionsPays}
          />
          <ListeDeroulante
            id="demo-pays-erreur"
            label={t("champs.pays")}
            invite={t("champs.paysInvite")}
            options={optionsPays}
            erreur={t("champs.paysErreur")}
            requis
          />
          <div className="md:col-span-2">
            <ZoneTexte id="demo-bio" label={t("champs.bio")} aide={t("champs.bioAide")} />
          </div>
        </div>
      </Section>

      <Section titre={t("sections.choix")}>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="flex flex-col gap-3">
            <CaseACocher id="demo-case-1" label={t("choix.conditions")} />
            <CaseACocher
              id="demo-case-2"
              label={t("choix.alertes")}
              aide={t("choix.alertesAide")}
              defaultChecked
            />
            <CaseACocher id="demo-case-3" label={e("desactive")} disabled />
          </div>
          <GroupeRadio
            legende={t("choix.profil")}
            nom="demo-profil"
            valeurParDefaut="talent"
            options={[
              { valeur: "talent", libelle: t("choix.talent") },
              { valeur: "recruteur", libelle: t("choix.recruteur") },
              { valeur: "entreprise", libelle: t("choix.entreprise"), desactive: true },
            ]}
          />
          <div className="flex flex-col gap-4">
            <Interrupteur
              id="demo-switch-1"
              label={t("choix.profilVisible")}
              aide={t("choix.profilVisibleAide")}
              actif
            />
            <Interrupteur id="demo-switch-2" label={t("choix.emails")} />
            <Interrupteur id="demo-switch-3" label={e("desactive")} desactive />
          </div>
        </div>
      </Section>

      <Section titre={t("sections.pastilles")}>
        <div className="flex flex-wrap gap-2">
          <Pastille>{t("pastilles.neutre")}</Pastille>
          <Pastille ton="sapin">{t("pastilles.sapin")}</Pastille>
          <Pastille ton="lime">{t("pastilles.lime")}</Pastille>
          <Pastille ton="succes">{t("pastilles.succes")}</Pastille>
          <Pastille ton="alerte">{t("pastilles.alerte")}</Pastille>
          <Pastille ton="erreur">{t("pastilles.erreur")}</Pastille>
          <Pastille ton="ia" icone={<OrbeIA className="size-2.5" />}>
            {t("pastilles.ia")}
          </Pastille>
        </div>
      </Section>

      <Section titre={t("sections.cartes")}>
        <div className="grid gap-4 md:grid-cols-3">
          <Carte>
            <TitreCarte>{t("cartes.standardTitre")}</TitreCarte>
            <TexteCarte>{t("cartes.standardTexte")}</TexteCarte>
          </Carte>
          <Carte apparence="teinte">
            <TitreCarte>{t("cartes.teinteTitre")}</TitreCarte>
            <TexteCarte>{t("cartes.teinteTexte")}</TexteCarte>
          </Carte>
          <Carte apparence="sombre">
            <TitreCarte>{t("cartes.sombreTitre")}</TitreCarte>
            <TexteCarte>{t("cartes.sombreTexte")}</TexteCarte>
          </Carte>
        </div>
      </Section>

      <Section titre={t("sections.alertes")}>
        <div className="grid gap-3 md:grid-cols-2">
          <Alerte titre={t("alertes.infoTitre")}>{t("alertes.infoTexte")}</Alerte>
          <Alerte ton="succes" titre={t("alertes.succesTitre")}>
            {t("alertes.succesTexte")}
          </Alerte>
          <Alerte
            ton="alerte"
            titre={t("alertes.alerteTitre")}
            action={
              <BoutonLien href="/tarifs" variante="secondaire" taille="sm">
                {t("alertes.alerteAction")}
              </BoutonLien>
            }
          >
            {t("alertes.alerteTexte")}
          </Alerte>
          <Alerte ton="erreur" titre={t("alertes.erreurTitre")}>
            {t("alertes.erreurTexte")}
          </Alerte>
        </div>
      </Section>

      <Section titre={t("sections.avatars")}>
        <div className="flex items-center gap-4">
          <Avatar nom={t("avatars.nom")} taille="sm" />
          <Avatar nom={t("avatars.nom")} />
          <Avatar nom={t("avatars.nom")} taille="lg" />
        </div>
      </Section>

      <Section titre={t("sections.onglets")}>
        <Onglets
          onglets={[
            {
              id: "talents",
              libelle: t("onglets.talents"),
              contenu: <p>{t("onglets.talentsTexte")}</p>,
            },
            {
              id: "recruteurs",
              libelle: t("onglets.recruteurs"),
              contenu: <p>{t("onglets.recruteursTexte")}</p>,
            },
            {
              id: "entreprises",
              libelle: t("onglets.entreprises"),
              contenu: <p>{t("onglets.entreprisesTexte")}</p>,
            },
          ]}
        />
      </Section>

      <Section titre={t("sections.progression")}>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <BarreProgression valeur={64} label={t("progression.profil")} />
            <BarreProgression valeur={35} label={t("progression.formation")} ton="lime" />
            <div className="flex gap-6">
              <ArcProgression valeur={64} label={t("progression.profil")} />
              <ArcProgression valeur={100} label={t("progression.formation")} />
            </div>
          </div>
          <div className="flex flex-col gap-5">
            <JaugeQuota libelle={t("progression.quotaNormal")} utilise={3} limite={10} />
            <JaugeQuota libelle={t("progression.quotaProche")} utilise={17} limite={20} />
            <JaugeQuota libelle={t("progression.quotaAtteint")} utilise={5} limite={5} />
            <JaugeQuota libelle={t("progression.quotaIllimite")} utilise={42} limite={null} />
          </div>
        </div>
      </Section>

      <Section titre={t("sections.ia")}>
        <div className="max-w-md">
          <ScoreExplique
            titre={t("ia.offre")}
            score={87}
            explication={
              <ul className="list-disc pl-5">
                <li>{t("ia.raison1")}</li>
                <li>{t("ia.raison2")}</li>
                <li>{t("ia.raison3")}</li>
              </ul>
            }
          />
        </div>
      </Section>

      <Section titre={t("sections.chargement")}>
        <div className="flex flex-wrap items-center gap-6">
          <Chargeur taille="sm" />
          <Chargeur />
          <Chargeur taille="lg" />
        </div>
        <Carte className="flex max-w-md flex-col gap-3">
          <Squelette className="h-5 w-2/3" />
          <Squelette className="h-4 w-full" />
          <Squelette className="h-4 w-5/6" />
        </Carte>
      </Section>

      <Section titre={t("sections.vide")}>
        <EtatVide
          icone={<Inbox aria-hidden className="size-6" />}
          titre={t("vide.titre")}
          description={t("vide.texte")}
          action={
            <BoutonLien href="/offres" icone={<Sparkles aria-hidden className="size-4" />}>
              {t("vide.action")}
            </BoutonLien>
          }
        />
      </Section>

      <Section titre={t("sections.modale")}>
        <div>
          <DemoModale />
        </div>
      </Section>
    </div>
  );
}
