# JUMANLY · Modèles de CV v1 (octobre 2026) : catalogue, styles et rendu de référence des 15 modèles.
# Les modèles sont NEUTRES : aucun logo, aucune couleur ni mention Jumanly dans le document produit.
# Sortie : ../modeles/ (CSS, HTML de démonstration, catalogue.json) ; rendu PDF/PNG par rendu.js.
# Usage : python3 modeles.py && NODE_PATH=/opt/node-tools/node_modules node rendu.js
import os, json, html as H, copy, shutil
from donnees import JUNIOR, SENIOR, ACADEMIQUE

ICI = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(ICI, "..", "modeles"))

# ------------------------------------------------------------------ Couleurs, polices, densités
COULEURS = [  # (code, nom, hex, recommandée ATS) · contraste sur blanc calculé (WCAG)
    ("encre", "Encre", "#1F2933", True), ("marine", "Marine", "#1B365D", True), ("petrole", "Pétrole", "#0B4F5C", True),
    ("foret", "Forêt", "#24503A", True), ("bordeaux", "Bordeaux", "#6B1E2E", True), ("prune", "Prune", "#4A2545", True),
    ("brun", "Brun", "#5A3A22", True), ("graphite", "Graphite", "#3D434A", True),
    ("bleu", "Bleu", "#1D5FBF", False), ("turquoise", "Turquoise", "#0E7C86", False), ("vert", "Vert", "#2E7D32", False),
    ("brique", "Brique", "#B23A2B", False), ("orange", "Orange brûlé", "#B4530A", False), ("violet", "Violet", "#6D3FB3", False),
    ("framboise", "Framboise", "#B0285F", False), ("acier", "Acier", "#4F6D8A", False),
]
HEX = {c[0]: c[2] for c in COULEURS}


def contraste(h):
    def lum(h):
        h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
        c = [x / 12.92 if x <= .03928 else ((x + .055) / 1.055) ** 2.4 for x in c]
        return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]
    return round(1.05 / (lum(h) + .05), 2)


POLICES = [  # (code, nom, famille CSS, recommandée, style)
    ("sora", "Sora", "'Sora'", True, "sans"), ("inter", "Inter", "'Inter'", False, "sans"),
    ("source-sans", "Source Sans 3", "'Source Sans 3'", False, "sans"), ("lato", "Lato", "'Lato'", False, "sans"),
    ("merriweather", "Merriweather", "'Merriweather'", False, "serif"), ("lora", "Lora", "'Lora'", False, "serif"),
]
FAM = {p[0]: p[2] for p in POLICES}

TITRES = {
    "fr": {"profil": "Profil", "points_forts": "Réalisations clés", "experience": "Expérience professionnelle", "formation": "Formation",
           "competences": "Compétences", "langues": "Langues", "certificats": "Certifications", "projets": "Projets",
           "engagement": "Engagement", "interets": "Centres d'intérêt", "publications": "Publications", "communications": "Communications",
           "enseignement": "Enseignements", "contact": "Contact"},
    "en": {"profil": "Profile", "points_forts": "Key achievements", "experience": "Work experience", "formation": "Education",
           "competences": "Skills", "langues": "Languages", "certificats": "Certifications", "projets": "Projects",
           "engagement": "Volunteering", "interets": "Interests", "publications": "Publications", "communications": "Talks",
           "enseignement": "Teaching", "contact": "Contact"},
}
NIVEAUX = {"fr": {1: "Notions", 2: "Intermédiaire", 3: "Avancé", 4: "Expert"}, "en": {1: "Basic", 2: "Intermediate", 3: "Advanced", 4: "Expert"}}

# ------------------------------------------------------------------ Socle commun à tous les modèles
BASE_CSS = r"""/* Modèles de CV · socle commun (v1). Unités d'impression : mm et pt. Page A4 fixe, une boîte par page. */
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#E6E8EB}
@media print{html,body{background:none}}
.cv{
  --cv-encre:#1A1D21; --cv-gris:#555B63; --cv-filet:#D5D9DE;
  --cv-doux:color-mix(in srgb,var(--cv-accent) 7%,#fff); --cv-doux2:color-mix(in srgb,var(--cv-accent) 15%,#fff);
  font-family:var(--cv-police),'Helvetica Neue',Arial,sans-serif; font-size:var(--cv-fs); line-height:1.42; color:var(--cv-encre);
  -webkit-print-color-adjust:exact; print-color-adjust:exact; font-kerning:normal;
}
/* Densité : taille du texte, espace entre sections, marges de page */
.cv.d-aeree{--cv-fs:10.25pt;--cv-esp:6.5mm;--cv-el:3.6mm;--cv-marge:17mm}
.cv.d-standard{--cv-fs:9.6pt;--cv-esp:5.4mm;--cv-el:3mm;--cv-marge:14mm}
.cv.d-compacte{--cv-fs:9pt;--cv-esp:4mm;--cv-el:2.2mm;--cv-marge:11mm}
.cv-source,.cv-page-modele{display:none}
.cv-pages{display:flex;flex-direction:column;align-items:center;gap:8mm;padding:8mm 0}
@media print{.cv-pages{gap:0;padding:0}}
.cv-page{width:210mm;height:297mm;background:#fff;position:relative;overflow:hidden;break-after:page;
  display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr) auto;grid-template-areas:"tete" "principal" "pied";
  box-shadow:0 2mm 8mm rgba(20,30,40,.12)}
@media print{.cv-page{box-shadow:none}}
.cv-deco{position:absolute;inset:0;pointer-events:none}
.cv-tete{grid-area:tete;position:relative}
.cv-principal{grid-area:principal;min-height:0;overflow:hidden;padding:0 var(--cv-marge) 6mm;position:relative}
.cv-lateral{grid-area:lateral;min-height:0;overflow:hidden;position:relative;display:none}
.cv-pied{grid-area:pied;height:9mm;padding:0 var(--cv-marge);display:flex;align-items:center;justify-content:flex-end;font-size:7.5pt;color:var(--cv-gris)}
.cv-page.suite .cv-principal{padding-top:var(--cv-marge)}
.cv-tete-suite{display:none}
/* Blocs d'identité */
.cv-nom{font-weight:600;letter-spacing:-.02em;line-height:1.08;font-size:2.55em}
.cv-titre{font-size:1.18em;font-weight:500;color:var(--cv-accent);margin-top:1.4mm}
.cv-contact{list-style:none;display:flex;flex-wrap:wrap;gap:1mm 0;font-size:.92em;color:var(--cv-gris);margin-top:2.6mm}
.cv-contact,.cv-ligne{overflow:hidden}
.cv-contact li,.cv-ligne li{margin-left:-4.6mm;margin-right:4.6mm}
.cv-contact li:last-child,.cv-ligne li:last-child{margin-right:0}
.cv-contact li::before,.cv-ligne li::before{content:"·";display:inline-block;width:4.6mm;text-align:center;color:var(--cv-gris)}
.cv-contact .lib{font-weight:600;color:var(--cv-encre)}
.cv-photo{width:30mm;height:30mm;border-radius:50%;overflow:hidden;flex:none;background:#CDD2D8}
.cv-photo img{width:100%;height:100%;object-fit:cover;display:block}
/* Sections */
.cv-sec{margin-top:var(--cv-esp)}
.cv-principal>.cv-sec:first-child,.cv-lateral>.cv-sec:first-child{margin-top:0}
.cv-st{font-size:.86em;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--cv-accent);margin-bottom:2.4mm;break-after:avoid}
.cv-st .num{display:none}
.cv-el{break-inside:avoid}
.cv-el+.cv-el{margin-top:var(--cv-el)}
.cv-it-tete{display:flex;justify-content:space-between;align-items:baseline;gap:4mm}
.cv-it-titre{font-size:1.06em;font-weight:600;line-height:1.3}
.cv-it-date{font-size:.9em;color:var(--cv-gris);white-space:nowrap;flex:none}
.cv-it-sous{color:var(--cv-accent);font-weight:500;font-size:.95em;margin-top:.4mm}
.cv-it-texte{margin-top:1mm}
.cv-it-outils{margin-top:.8mm;font-size:.9em;color:var(--cv-gris)}
.cv-puces{list-style:none;margin-top:1.2mm}
.cv-puces li{position:relative;padding-left:3.6mm}
.cv-puces li+li{margin-top:.7mm}
.cv-puces li::before{content:"";position:absolute;left:.4mm;top:.62em;width:1.3mm;height:1.3mm;border-radius:50%;background:var(--cv-accent)}
.cv-texte{text-align:left}
/* Compétences, langues, centres d'intérêt : plusieurs présentations */
.cv-liste{list-style:none}
.cv-ligne{list-style:none;display:flex;flex-wrap:wrap}
.cv-ligne .niv{color:var(--cv-gris)}
.cv-ligne .niv::before{content:" ("}.cv-ligne .niv::after{content:")"}
.cv-liste-niveau{list-style:none;display:grid;gap:1.1mm}
.cv-liste-niveau li{display:flex;justify-content:space-between;gap:3mm}
.cv-liste-niveau .niv{color:var(--cv-gris);font-size:.92em;white-space:nowrap}
.cv-chips{list-style:none;display:flex;flex-wrap:wrap;gap:1.6mm}
.cv-chips li{padding:.8mm 2.6mm;border-radius:1.6mm;background:var(--cv-doux2);font-size:.92em;font-weight:500}
.cv-chips .niv{display:none}
.cv-grille{list-style:none;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.2mm 6mm}
.cv-grille .niv{display:block;color:var(--cv-gris);font-size:.85em}
.cv-barres{list-style:none;display:grid;gap:2.2mm}
.cv-barres li{display:grid;grid-template-columns:1fr auto;row-gap:1mm}
.cv-barres .niv{font-size:.85em;color:var(--cv-gris)}
.cv-barres .jauge{grid-column:1/-1;height:1.5mm;border-radius:1mm;background:var(--cv-doux2);position:relative;overflow:hidden}
.cv-barres .jauge i{position:absolute;inset:0 auto 0 0;background:var(--cv-accent);border-radius:1mm}
.cv-points{list-style:none;display:grid;gap:1.6mm}
.cv-points li{display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:3mm}
.cv-points .pts{display:flex;gap:1.1mm}
.cv-points .pts b{width:2.1mm;height:2.1mm;border-radius:50%;background:var(--cv-accent)}
.cv-points .pts b.off{background:var(--cv-doux2)}
.cv-points .niv{grid-column:1/-1;font-size:.85em;color:var(--cv-gris)}
.cv-groupes{display:grid;gap:2mm}
.cv-groupes .grp{display:grid;grid-template-columns:30mm 1fr;gap:3mm;align-items:baseline}
.cv-groupes .grp>span{font-weight:600;font-size:.92em}
.cv-refs{list-style:none;counter-reset:ref}
.cv-refs li{counter-increment:ref;position:relative;padding-left:8mm}
.cv-refs li::before{content:"[" counter(ref) "]";position:absolute;left:0;color:var(--cv-accent);font-weight:600;font-size:.92em}
.cv-encadre{background:var(--cv-doux);border-radius:2mm;padding:3.4mm 4.4mm}
/* Accessibilité ATS : niveaux toujours écrits en toutes lettres, même quand une jauge est dessinée */
/* Colonne secondaire étroite : le niveau et la date passent sous le libellé */
.cv-lateral .cv-liste-niveau li{display:block}.cv-lateral .cv-liste-niveau .niv{display:block;font-size:.85em}
.cv-lateral .cv-it-tete{display:block}.cv-lateral .cv-it-date{display:block}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
"""

# ------------------------------------------------------------------ Les 15 modèles
# grille : "une" (une colonne), "deux-d" (colonne secondaire à droite sous l'en-tête), "lat-g" (barre latérale gauche sur toute la hauteur)
# tete / lat_tete : blocs placés dans l'en-tête (page 1) ; lateral : types de sections versées dans la colonne secondaire.
M = []


def modele(**k):
    k.setdefault("lateral", []); k.setdefault("lat_tete", []); k.setdefault("styles", {}); k.setdefault("densite", "standard")
    k.setdefault("donnees", "junior")
    M.append(k)


modele(id="classique", nom="Classique", niveau="free", grille="une", photo="sans", couleur="encre", ats="excellente", pages="1 à 2",
       public="Tous profils, candidatures en ligne", resume="Une colonne, en-tête centré, filets fins. Le plus sûr pour les logiciels de recrutement.",
       tete=["identite", "contact"], ordre=["profil", "experience", "formation", "competences", "langues", "certificats", "projets", "engagement", "interets"],
       styles={"competences": "ligne", "langues": "ligne", "interets": "ligne"},
       css=""".tpl-classique .cv-tete{padding:var(--cv-marge) var(--cv-marge) 5mm;text-align:center}
.tpl-classique .cv-nom{text-transform:uppercase;letter-spacing:.06em;font-size:2.2em;font-weight:600}
.tpl-classique .cv-titre{color:var(--cv-encre);font-weight:400;letter-spacing:.02em}
.tpl-classique .cv-contact{justify-content:center}
.tpl-classique .cv-contact li,.tpl-elegant .cv-contact li,.tpl-elegant .cv-ligne li{margin:0}
.tpl-classique .cv-contact li:first-child::before,.tpl-elegant .cv-contact li:first-child::before,.tpl-elegant .cv-ligne li:first-child::before{display:none}
.tpl-classique .cv-st{color:var(--cv-accent);border-bottom:.6pt solid var(--cv-encre);padding-bottom:1.2mm}
.tpl-classique .cv-it-sous{color:var(--cv-encre);font-style:italic;font-weight:400}
.tpl-classique .cv-puces li::before{background:var(--cv-encre)}""")

modele(id="epure", nom="Épuré", niveau="free", grille="une", photo="option", couleur="graphite", ats="excellente", pages="1 à 2",
       public="Profils qui veulent un CV sobre et aéré", resume="Titres de sections dans une marge à gauche, beaucoup de blanc, photo carrée facultative.",
       tete=["identite", "contact", "photo"], ordre=["profil", "experience", "formation", "competences", "langues", "projets", "certificats", "engagement", "interets"],
       styles={"competences": "liste-niveau", "langues": "ligne", "interets": "ligne"},
       css=""".tpl-epure .cv-tete{padding:var(--cv-marge) var(--cv-marge) 7mm;display:grid;grid-template-columns:1fr auto;grid-template-areas:"id ph" "co ph";column-gap:8mm}
.tpl-epure .cv-identite{grid-area:id}.tpl-epure .cv-contact{grid-area:co;align-self:start}
.tpl-epure .cv-photo{grid-area:ph;border-radius:2mm;width:27mm;height:31mm}
.tpl-epure .cv-nom{font-weight:300;font-size:2.8em;letter-spacing:-.03em}
.tpl-epure .cv-nom .nom{font-weight:600}
.tpl-epure .cv-titre{color:var(--cv-gris);font-weight:400}
.tpl-epure .cv-sec{display:grid;grid-template-columns:34mm minmax(0,1fr);column-gap:6mm}
.tpl-epure .cv-st{grid-column:1;grid-row:1/span 30;font-size:.8em;color:var(--cv-accent);padding-top:.5mm;margin:0}
.tpl-epure .cv-el{grid-column:2}
.tpl-epure .cv-el+.cv-el{margin-top:var(--cv-el)}
.tpl-epure .cv-sec{padding-top:var(--cv-esp);margin-top:0;border-top:.5pt solid var(--cv-filet)}
.tpl-epure .cv-principal>.cv-sec:first-child{padding-top:4mm}
.tpl-epure .cv-liste-niveau{grid-template-columns:1fr 1fr;column-gap:8mm}
.tpl-epure .cv-it-sous{color:var(--cv-gris)}""")

modele(id="premier-emploi", nom="Premier emploi", niveau="free", grille="une", photo="option", couleur="petrole", ats="excellente", pages="1",
       public="Étudiants, jeunes diplômés, stages", resume="La formation et les projets passent avant l'expérience. Compétences en étiquettes.",
       tete=["photo", "identite", "contact"], ordre=["profil", "formation", "projets", "experience", "competences", "langues", "certificats", "engagement", "interets"],
       styles={"competences": "chips", "langues": "ligne", "interets": "ligne"},
       css=""".tpl-premier-emploi .cv-tete{padding:var(--cv-marge) var(--cv-marge) 6mm;display:grid;grid-template-columns:auto 1fr;grid-template-areas:"ph id" "ph co";column-gap:6mm;align-items:end}
.tpl-premier-emploi .cv-tete::after{content:"";position:absolute;left:var(--cv-marge);right:var(--cv-marge);bottom:2mm;height:.8mm;background:var(--cv-accent);border-radius:1mm}
.tpl-premier-emploi .cv-photo{grid-area:ph;width:26mm;height:26mm}
.tpl-premier-emploi .cv-identite{grid-area:id}.tpl-premier-emploi .cv-contact{grid-area:co;align-self:start}
.tpl-premier-emploi .cv-st{display:flex;align-items:center;gap:2.4mm}
.tpl-premier-emploi .cv-st::before{content:"";width:2.4mm;height:2.4mm;border-radius:.6mm;background:var(--cv-accent)}""")

modele(id="moderne", nom="Moderne", niveau="free", grille="deux-d", photo="option", couleur="bleu", ats="tres-bonne", pages="1 à 2",
       public="Tous profils", resume="En-tête teinté avec photo ronde, colonne de droite pour les compétences et les langues.",
       tete=["photo", "identite", "contact"], lateral=["competences", "langues", "certificats", "interets"],
       ordre=["profil", "experience", "formation", "projets", "engagement", "competences", "langues", "certificats", "interets"],
       styles={"competences": "liste-niveau", "langues": "liste-niveau", "interets": "chips"},
       css=""".tpl-moderne .cv-page{grid-template-columns:minmax(0,1fr) 60mm;grid-template-areas:"tete tete" "principal lateral" "pied pied"}
.tpl-moderne .cv-lateral{display:block;padding:0 var(--cv-marge) 6mm 0}
.tpl-moderne .cv-principal{padding-right:7mm}
.tpl-moderne .cv-page.suite .cv-lateral{padding-top:var(--cv-marge)}
.tpl-moderne .cv-tete{background:var(--cv-doux);padding:11mm var(--cv-marge);margin-bottom:7mm;display:grid;grid-template-columns:auto 1fr;grid-template-areas:"ph id" "ph co";column-gap:7mm;align-items:center}
.tpl-moderne .cv-photo{grid-area:ph;width:28mm;height:28mm;box-shadow:0 0 0 1.2mm #fff}
.tpl-moderne .cv-identite{grid-area:id;align-self:end}.tpl-moderne .cv-contact{grid-area:co;align-self:start}
.tpl-moderne .cv-nom{color:var(--cv-accent)}
.tpl-moderne .cv-titre{color:var(--cv-encre)}
.tpl-moderne .cv-lateral .cv-sec{border-left:.6mm solid var(--cv-doux2);padding-left:4mm}""")

modele(id="colonne", nom="Colonne", niveau="free", grille="lat-g", photo="option", couleur="foret", ats="tres-bonne", pages="1 à 2",
       public="Tous profils", resume="Barre latérale teintée à gauche avec photo, coordonnées et compétences.",
       tete=["identite"], lat_tete=["photo", "contact"], lateral=["competences", "langues", "interets"],
       ordre=["profil", "experience", "formation", "projets", "certificats", "engagement", "competences", "langues", "interets"],
       styles={"competences": "liste-niveau", "langues": "liste-niveau", "interets": "liste"},
       css=""".tpl-colonne .cv-page{grid-template-columns:66mm minmax(0,1fr);grid-template-areas:"lateral tete" "lateral principal" "lateral pied"}
.tpl-colonne .cv-lateral{display:block;background:var(--cv-doux);padding:var(--cv-marge) 7mm 8mm}
.tpl-colonne .cv-tete{padding:var(--cv-marge) var(--cv-marge) 7mm 9mm}
.tpl-colonne .cv-principal{padding-left:9mm}
.tpl-colonne .cv-lat-tete{display:flex;flex-direction:column;gap:5mm;margin-bottom:var(--cv-esp)}
.tpl-colonne .cv-photo{width:34mm;height:34mm}
.tpl-colonne .cv-contact{flex-direction:column;margin:0;gap:1.6mm;color:var(--cv-encre)}
.tpl-colonne .cv-contact li::before{display:none}.tpl-colonne .cv-contact li{margin:0}
.tpl-colonne .cv-contact .lib{display:block;font-size:.85em;color:var(--cv-accent);text-transform:uppercase;letter-spacing:.08em}
.tpl-colonne .cv-lateral .cv-liste-niveau li{display:block}
.tpl-colonne .cv-lateral .cv-liste-niveau .niv{display:block}
.tpl-colonne .cv-liste li+li{margin-top:1mm}""")

modele(id="executif", nom="Exécutif", niveau="starter", grille="une", photo="sans", couleur="bordeaux", ats="excellente", pages="2",
       public="Cadres, managers, profils expérimentés", resume="Réalisations clés mises en avant dans un encadré, titres de sections soulignés jusqu'au bord.",
       tete=["identite", "contact"], ordre=["profil", "points_forts", "experience", "formation", "competences", "langues", "certificats", "engagement", "interets"],
       styles={"competences": "grille", "langues": "ligne", "interets": "ligne"}, donnees="senior",
       css=""".tpl-executif .cv-deco{border-top:4mm solid var(--cv-accent)}
.tpl-executif .cv-tete{padding:calc(var(--cv-marge) + 3mm) var(--cv-marge) 6mm;display:grid;grid-template-columns:1fr auto;column-gap:8mm;align-items:end}
.tpl-executif .cv-contact{flex-direction:column;align-items:flex-end;margin:0;gap:.8mm}
.tpl-executif .cv-contact li::before{display:none}.tpl-executif .cv-contact li{margin:0}
.tpl-executif .cv-nom{font-size:2.7em}
.tpl-executif .cv-titre{text-transform:uppercase;letter-spacing:.1em;font-size:.95em;font-weight:600}
.tpl-executif .cv-st{display:flex;align-items:center;gap:3mm}
.tpl-executif .cv-st::after{content:"";flex:1;height:.6pt;background:var(--cv-filet)}
.tpl-executif .sec-points_forts .cv-el{background:var(--cv-doux);border-left:1mm solid var(--cv-accent);padding:3.4mm 4.4mm}
.tpl-executif .sec-points_forts .cv-puces li{font-weight:500}
.tpl-executif .cv-page.suite .cv-deco{border-top-width:1.5mm}""")

modele(id="bandeau", nom="Bandeau", niveau="starter", grille="deux-d", photo="option", couleur="marine", ats="tres-bonne", pages="1 à 2",
       public="Tous profils, secteurs commerciaux et services", resume="Bandeau plein de couleur en haut, photo ronde cerclée de blanc, colonne de droite.",
       tete=["photo", "identite", "contact"], lateral=["competences", "langues", "certificats", "interets"],
       ordre=["profil", "experience", "formation", "projets", "engagement", "competences", "langues", "certificats", "interets"],
       styles={"competences": "liste-niveau", "langues": "liste-niveau", "interets": "chips"},
       css=""".tpl-bandeau .cv-page{grid-template-columns:minmax(0,1fr) 62mm;grid-template-areas:"tete tete" "principal lateral" "pied pied"}
.tpl-bandeau .cv-tete{background:var(--cv-accent);color:#fff;padding:12mm var(--cv-marge);margin-bottom:8mm;display:grid;grid-template-columns:auto 1fr;grid-template-areas:"ph id" "ph co";column-gap:8mm;align-items:center}
.tpl-bandeau .cv-photo{grid-area:ph;width:32mm;height:32mm;box-shadow:0 0 0 1.4mm #fff}
.tpl-bandeau .cv-identite{grid-area:id;align-self:end}.tpl-bandeau .cv-contact{grid-area:co;align-self:start;color:rgba(255,255,255,.85)}
.tpl-bandeau .cv-contact .lib{color:#fff}.tpl-bandeau .cv-contact li::before{color:rgba(255,255,255,.5)}
.tpl-bandeau .cv-titre{color:#fff;opacity:.9}
.tpl-bandeau .cv-lateral{display:block;padding:0 var(--cv-marge) 6mm 0}
.tpl-bandeau .cv-principal{padding-right:8mm}
.tpl-bandeau .cv-page.suite .cv-lateral{padding-top:var(--cv-marge)}
.tpl-bandeau .cv-page.suite .cv-tete-suite{display:block;grid-area:tete;height:5mm;background:var(--cv-accent)}
.tpl-bandeau .cv-lateral .cv-sec{background:var(--cv-doux);border-radius:2mm;padding:4mm}
.tpl-bandeau .cv-chips li{background:#fff}""")

modele(id="contraste", nom="Contraste", niveau="starter", grille="lat-g", photo="option", couleur="petrole", ats="bonne", pages="1 à 2",
       public="Profils qui veulent se démarquer à l'impression", resume="Barre latérale foncée en texte blanc, compétences et langues en pastilles.",
       tete=["identite"], lat_tete=["photo", "contact"], lateral=["competences", "langues", "interets"],
       ordre=["profil", "experience", "formation", "projets", "certificats", "engagement", "competences", "langues", "interets"],
       styles={"competences": "points", "langues": "points", "interets": "liste"},
       css=""".tpl-contraste .cv-page{grid-template-columns:70mm minmax(0,1fr);grid-template-areas:"lateral tete" "lateral principal" "lateral pied"}
.tpl-contraste .cv-lateral{display:block;background:var(--cv-accent);color:#fff;padding:var(--cv-marge) 8mm 8mm}
.tpl-contraste .cv-lateral .cv-st{color:#fff;border-bottom:.6pt solid rgba(255,255,255,.35);padding-bottom:1.4mm}
.tpl-contraste .cv-lateral .niv{color:rgba(255,255,255,.75)}
.tpl-contraste .cv-lateral .pts b{background:#fff}.tpl-contraste .cv-lateral .pts b.off{background:rgba(255,255,255,.25)}
.tpl-contraste .cv-lat-tete{display:flex;flex-direction:column;gap:6mm;margin-bottom:var(--cv-esp)}
.tpl-contraste .cv-photo{width:40mm;height:40mm;align-self:center;box-shadow:0 0 0 1.2mm rgba(255,255,255,.25)}
.tpl-contraste .cv-contact{flex-direction:column;margin:0;gap:1.8mm;color:#fff}
.tpl-contraste .cv-contact li::before{display:none}.tpl-contraste .cv-contact li{margin:0}
.tpl-contraste .cv-contact .lib{display:block;font-size:.82em;opacity:.7;text-transform:uppercase;letter-spacing:.08em;color:#fff}
.tpl-contraste .cv-tete{padding:calc(var(--cv-marge) + 4mm) var(--cv-marge) 8mm 10mm}
.tpl-contraste .cv-principal{padding-left:10mm}
.tpl-contraste .cv-nom{font-size:2.9em;color:var(--cv-accent)}
.tpl-contraste .cv-titre{color:var(--cv-encre)}
.tpl-contraste .cv-liste li+li{margin-top:1mm}""")

modele(id="parcours", nom="Parcours", niveau="starter", grille="une", photo="option", couleur="turquoise", ats="tres-bonne", pages="1 à 2",
       public="Parcours riches, reconversions", resume="Frise chronologique : dates à gauche, ligne verticale et pastilles pour chaque étape.",
       tete=["identite", "contact", "photo"], ordre=["profil", "experience", "formation", "projets", "engagement", "competences", "langues", "certificats", "interets"],
       styles={"competences": "chips", "langues": "ligne", "interets": "ligne"},
       css=""".tpl-parcours .cv-tete{padding:var(--cv-marge) var(--cv-marge) 7mm;display:grid;grid-template-columns:1fr auto;grid-template-areas:"id ph" "co ph";column-gap:8mm;align-items:center}
.tpl-parcours .cv-identite{grid-area:id}.tpl-parcours .cv-contact{grid-area:co;align-self:start}.tpl-parcours .cv-photo{grid-area:ph;width:28mm;height:28mm}
.tpl-parcours .cv-sec{padding-left:31mm}
.tpl-parcours .cv-st{margin-left:-31mm}
.tpl-parcours .sec-experience .cv-el,.tpl-parcours .sec-formation .cv-el,.tpl-parcours .sec-engagement .cv-el,.tpl-parcours .sec-projets .cv-el{position:relative}
.tpl-parcours .cv-sec .cv-el::before{content:"";position:absolute;left:-6.2mm;top:-.2mm;bottom:calc(-1 * var(--cv-el));border-left:.5mm solid var(--cv-doux2)}
.tpl-parcours .cv-sec .cv-el:last-child::before{bottom:0}
.tpl-parcours .cv-sec .cv-el::after{content:"";position:absolute;left:-7.4mm;top:.35em;width:2.9mm;height:2.9mm;border-radius:50%;background:#fff;border:.6mm solid var(--cv-accent)}
.tpl-parcours .cv-it-tete{display:block}
.tpl-parcours .cv-it-date{position:absolute;left:-31mm;top:.1em;width:22mm;text-align:right;white-space:normal;font-weight:600;color:var(--cv-accent)}
.tpl-parcours .sec-profil .cv-el::before,.tpl-parcours .sec-profil .cv-el::after,.tpl-parcours .sec-competences .cv-el::before,.tpl-parcours .sec-competences .cv-el::after,
.tpl-parcours .sec-langues .cv-el::before,.tpl-parcours .sec-langues .cv-el::after,.tpl-parcours .sec-interets .cv-el::before,.tpl-parcours .sec-interets .cv-el::after,
.tpl-parcours .sec-certificats .cv-el::before,.tpl-parcours .sec-certificats .cv-el::after{display:none}""")

modele(id="compact", nom="Compact", niveau="starter", grille="une", photo="sans", couleur="encre", ats="excellente", pages="1",
       public="Longues carrières à faire tenir sur une page", resume="Marges réduites, en-tête sur une ligne, compétences en trois colonnes.",
       tete=["identite", "contact"], ordre=["profil", "experience", "formation", "competences", "langues", "certificats", "projets", "engagement", "interets"],
       styles={"competences": "grille", "langues": "ligne", "interets": "ligne"}, densite="compacte",
       css=""".tpl-compact .cv-tete{padding:var(--cv-marge) var(--cv-marge) 3.5mm;border-bottom:1.4pt solid var(--cv-accent);margin:0 var(--cv-marge) 4.5mm;padding-left:0;padding-right:0}
.tpl-compact .cv-identite{display:flex;align-items:baseline;gap:4mm;flex-wrap:wrap}
.tpl-compact .cv-nom{font-size:2.1em}
.tpl-compact .cv-titre{margin:0;font-size:1.1em}
.tpl-compact .cv-contact{margin-top:1.6mm}
.tpl-compact .cv-st{font-size:.82em;margin-bottom:1.6mm;padding-bottom:.8mm;border-bottom:.5pt solid var(--cv-filet)}
.tpl-compact .cv-it-sous{display:inline}
.tpl-compact .cv-puces{margin-top:.8mm}""")

modele(id="academique", nom="Académique", niveau="pro", grille="une", photo="sans", couleur="marine", ats="excellente", pages="2 à 3",
       public="Enseignants, chercheurs, candidatures à des bourses", resume="Sections numérotées, publications et communications en références, plusieurs pages.",
       tete=["identite", "contact"], ordre=["profil", "formation", "experience", "publications", "communications", "projets", "enseignement", "competences", "langues", "engagement"],
       styles={"competences": "ligne", "langues": "ligne", "interets": "ligne"}, donnees="academique",
       css=""".tpl-academique .cv-tete{padding:var(--cv-marge) var(--cv-marge) 6mm;border-bottom:.6pt solid var(--cv-encre);margin:0 var(--cv-marge) 6mm;padding-left:0;padding-right:0}
.tpl-academique .cv-nom{font-size:2.3em;font-weight:600}
.tpl-academique .cv-titre{color:var(--cv-encre);font-weight:400;font-style:italic}
.tpl-academique .cv-st .num{display:inline}
.tpl-academique .cv-st{text-transform:none;letter-spacing:0;font-size:1.12em;font-weight:600;border-bottom:.5pt solid var(--cv-filet);padding-bottom:1mm}
.tpl-academique .cv-suite>.cv-st::after{content:" (suite)";font-weight:400;color:var(--cv-gris)}
.tpl-academique .cv-it-sous{color:var(--cv-encre);font-style:italic;font-weight:400}
.tpl-academique .cv-page.suite .cv-tete-suite{display:flex;justify-content:space-between;grid-area:tete;padding:8mm var(--cv-marge) 0;font-size:.85em;color:var(--cv-gris)}
.tpl-academique .cv-page.suite .cv-principal{padding-top:6mm}
.tpl-academique .cv-refs li+li{margin-top:1.4mm}""")

modele(id="creatif", nom="Créatif", niveau="pro", grille="deux-d", photo="option", couleur="brique", ats="bonne", pages="1 à 2",
       public="Communication, design, métiers créatifs", resume="Monogramme ou photo en grand, nom très présent, colonne de cartes teintées à droite.",
       tete=["photo", "identite", "contact"], lateral=["competences", "langues", "certificats", "interets"],
       ordre=["profil", "experience", "projets", "formation", "engagement", "competences", "langues", "certificats", "interets"],
       styles={"competences": "chips", "langues": "points", "interets": "chips"},
       css=""".tpl-creatif .cv-page{grid-template-columns:minmax(0,1fr) 64mm;grid-template-areas:"tete tete" "principal lateral" "pied pied"}
.tpl-creatif .cv-tete{padding:var(--cv-marge) var(--cv-marge) 9mm;display:grid;grid-template-columns:auto 1fr;grid-template-areas:"ph id" "ph co";column-gap:8mm;align-items:end}
.tpl-creatif .cv-photo,.tpl-creatif .cv-mono{grid-area:ph;width:38mm;height:38mm;border-radius:6mm 6mm 6mm 0}
.tpl-creatif .cv-mono{display:grid;place-items:center;background:var(--cv-accent);color:#fff;font-size:3.4em;font-weight:700;letter-spacing:-.04em}
.tpl-creatif .cv-identite{grid-area:id}.tpl-creatif .cv-contact{grid-area:co;align-self:start}
.tpl-creatif .cv-nom{font-size:3.3em;font-weight:700;letter-spacing:-.04em;line-height:.98}
.tpl-creatif .cv-nom .nom{display:block;color:var(--cv-accent)}
.tpl-creatif .cv-lateral{display:block;padding:0 var(--cv-marge) 6mm 0}
.tpl-creatif .cv-principal{padding-right:8mm}
.tpl-creatif .cv-page.suite .cv-lateral{padding-top:var(--cv-marge)}
.tpl-creatif .cv-lateral .cv-sec{background:var(--cv-doux);border-radius:4mm 4mm 4mm 0;padding:4.5mm}
.tpl-creatif .cv-st{display:flex;align-items:center;gap:2.4mm;letter-spacing:.08em}
.tpl-creatif .cv-st::before{content:"";width:5mm;height:1.6mm;border-radius:1mm;background:var(--cv-accent)}
.tpl-creatif .cv-chips li{background:#fff}""")

modele(id="tech", nom="Tech", niveau="pro", grille="une", photo="sans", couleur="violet", ats="tres-bonne", pages="1 à 2",
       public="Développeurs, data, métiers du numérique", resume="Compétences regroupées par domaine, projets avant l'expérience, outils indiqués sous chaque poste.",
       tete=["identite", "contact"], ordre=["profil", "competences", "projets", "experience", "formation", "certificats", "langues", "engagement", "interets"],
       styles={"competences": "groupes", "langues": "ligne", "interets": "ligne"},
       css=""".tpl-tech .cv-tete{padding:var(--cv-marge) var(--cv-marge) 6mm}
.tpl-tech .cv-nom{font-size:2.5em;font-weight:700}
.tpl-tech .cv-titre{display:inline-block;margin-top:2mm;padding:.8mm 2.6mm;border-radius:1.4mm;background:var(--cv-doux2);color:var(--cv-accent);font-weight:600;font-size:1.02em}
.tpl-tech .cv-st{text-transform:none;letter-spacing:0;font-size:1.15em;color:var(--cv-encre);display:flex;align-items:center;gap:2.4mm}
.tpl-tech .cv-st::before{content:"";width:1.2mm;height:1.05em;border-radius:.6mm;background:var(--cv-accent)}
.tpl-tech .cv-groupes .cv-chips li{background:none;box-shadow:inset 0 0 0 .5pt var(--cv-accent);color:var(--cv-accent);padding:.5mm 2.2mm}
.tpl-tech .cv-it-outils{color:var(--cv-accent);font-weight:500}
.tpl-tech .cv-it-outils::before{content:"Outils : ";color:var(--cv-gris);font-weight:400}""")

modele(id="elegant", nom="Élégant", niveau="pro", grille="une", photo="option", couleur="prune", ats="tres-bonne", pages="1 à 2",
       public="Hôtellerie, juridique, relation client, profils seniors", resume="En-tête centré avec photo ronde, titres centrés entre deux filets.",
       tete=["photo", "identite", "contact"], ordre=["profil", "experience", "formation", "competences", "langues", "certificats", "projets", "engagement", "interets"],
       styles={"competences": "grille", "langues": "ligne", "interets": "ligne"},
       css=""".tpl-elegant .cv-tete{padding:var(--cv-marge) var(--cv-marge) 5mm;display:flex;flex-direction:column;align-items:center;text-align:center}
.tpl-elegant .cv-photo{width:26mm;height:26mm;margin-bottom:4mm;box-shadow:0 0 0 .6mm #fff,0 0 0 1.1mm var(--cv-accent)}
.tpl-elegant .cv-nom{font-weight:400;font-size:2.5em;letter-spacing:.01em}
.tpl-elegant .cv-titre{text-transform:uppercase;letter-spacing:.18em;font-size:.88em;font-weight:500}
.tpl-elegant .cv-contact{justify-content:center}
.tpl-elegant .cv-st{display:flex;align-items:center;gap:4mm;justify-content:center;letter-spacing:.2em;font-weight:600}
.tpl-elegant .cv-st::before,.tpl-elegant .cv-st::after{content:"";flex:1;height:.5pt;background:var(--cv-accent);opacity:.45}
.tpl-elegant .sec-profil .cv-el{text-align:center;font-style:italic;padding:0 8mm}
.tpl-elegant .sec-langues .cv-ligne,.tpl-elegant .sec-interets .cv-ligne{justify-content:center}""")

modele(id="visuel", nom="Visuel", niveau="pro", grille="lat-g", photo="option", couleur="framboise", ats="bonne", pages="1 à 2",
       public="Profils qui veulent montrer leurs niveaux d'un coup d'œil", resume="Grande photo, jauges de compétences et pastilles de langues (niveaux aussi écrits en toutes lettres).",
       tete=["identite"], lat_tete=["photo", "contact"], lateral=["competences", "langues", "interets"],
       ordre=["profil", "experience", "formation", "projets", "certificats", "engagement", "competences", "langues", "interets"],
       styles={"competences": "barres", "langues": "points", "interets": "chips"},
       css=""".tpl-visuel .cv-page{grid-template-columns:72mm minmax(0,1fr);grid-template-areas:"lateral tete" "lateral principal" "lateral pied"}
.tpl-visuel .cv-lateral{display:block;background:var(--cv-doux);padding:0 8mm 8mm}
.tpl-visuel .cv-page.suite .cv-lateral{padding-top:var(--cv-marge)}
.tpl-visuel .cv-lat-tete{display:flex;flex-direction:column;gap:6mm;margin:0 -8mm var(--cv-esp)}
.tpl-visuel .cv-photo{width:72mm;height:78mm;border-radius:0}
.tpl-visuel .cv-contact{flex-direction:column;margin:0;gap:1.8mm;padding:0 8mm;color:var(--cv-encre)}
.tpl-visuel .cv-contact li::before{display:none}.tpl-visuel .cv-contact li{margin:0}
.tpl-visuel .cv-contact .lib{display:block;font-size:.82em;color:var(--cv-accent);text-transform:uppercase;letter-spacing:.08em}
.tpl-visuel:not(.photo-on) .cv-lat-tete{padding-top:var(--cv-marge)}
.tpl-visuel .cv-tete{padding:calc(var(--cv-marge) + 6mm) var(--cv-marge) 8mm 10mm;position:relative}
.tpl-visuel .cv-tete::after{content:"";position:absolute;left:10mm;bottom:3mm;width:16mm;height:1.2mm;border-radius:1mm;background:var(--cv-accent)}
.tpl-visuel .cv-principal{padding-left:10mm}
.tpl-visuel .cv-nom{font-size:3em;font-weight:700;letter-spacing:-.035em}
.tpl-visuel .cv-chips li{background:#fff}""")

# ------------------------------------------------------------------ Rendu HTML d'un CV
DONNEES = {"junior": JUNIOR, "senior": SENIOR, "academique": ACADEMIQUE}
PHOTO = ("data:image/svg+xml;utf8," +
         "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23CDD2D8'/>"
         "<circle cx='50' cy='40' r='18' fill='%23EEF0F2'/><path d='M14 100c3-22 18-33 36-33s33 11 36 33z' fill='%23EEF0F2'/></svg>")


def e(t):
    return H.escape(str(t), quote=True)


def periode(it):
    d, f = it.get("debut", ""), it.get("fin", "")
    return f"{e(d)} – {e(f)}" if d and f and d != f else e(f or d)


def bloc_identite(d):
    i = d["info"]
    return (f'<div class="cv-identite"><h1 class="cv-nom"><span class="prenom">{e(i["prenom"])}</span> <span class="nom">{e(i["nom"])}</span></h1>'
            f'<p class="cv-titre">{e(i["titre"])}</p></div>')


def bloc_contact(d):
    i = d["info"]
    li = [f'<li>{e(i["ville"])}</li>', f'<li>{e(i["email"])}</li>'] + [f'<li><span class="lib">{e(l["libelle"])}</span> {e(l["url"])}</li>' for l in i["liens"]]
    return f'<ul class="cv-contact">{"".join(li)}</ul>'


def bloc_photo(d, tpl):
    i = d["info"]
    if tpl["id"] == "creatif" and not reglages_photo(d, tpl):
        return f'<div class="cv-mono" aria-hidden="true">{e(i["prenom"][0])}{e(i["nom"][0])}</div>'
    if not reglages_photo(d, tpl):
        return ""
    return f'<div class="cv-photo"><img src="{PHOTO}" alt=""></div>'


def reglages_photo(d, tpl):
    return tpl["photo"] == "option" and d["info"].get("photo")


def liste_comp(items, style, lg):
    niv = NIVEAUX[lg]
    if style == "groupes":
        groupes = {}
        for c in items:
            groupes.setdefault(c.get("groupe") or "", []).append(c)
        return '<div class="cv-groupes">' + "".join(
            f'<div class="grp"><span>{e(g)}</span><ul class="cv-chips">' + "".join(f'<li>{e(c["nom"])}<span class="sr"> ({niv[c["niveau"]]})</span></li>' for c in cs) + '</ul></div>'
            for g, cs in groupes.items()) + '</div>'
    out = []
    for c in items:
        n = c["niveau"]
        if style == "barres":
            out.append(f'<li><span>{e(c["nom"])}</span><span class="niv">{niv[n]}</span><span class="jauge" aria-hidden="true"><i style="width:{n * 25}%"></i></span></li>')
        elif style == "points":
            pts = "".join(f'<b class="{"" if k < n else "off"}"></b>' for k in range(4))
            out.append(f'<li><span>{e(c["nom"])}</span><span class="pts" aria-hidden="true">{pts}</span><span class="niv sr">{niv[n]}</span></li>')
        elif style in ("chips", "liste"):
            out.append(f'<li>{e(c["nom"])}<span class="sr"> ({niv[n]})</span></li>')
        else:
            out.append(f'<li><span>{e(c["nom"])}</span> <span class="niv">{niv[n]}</span></li>')
    cls = {"ligne": "cv-ligne", "liste-niveau": "cv-liste-niveau", "chips": "cv-chips", "grille": "cv-grille", "barres": "cv-barres",
           "points": "cv-points", "liste": "cv-liste"}[style]
    return f'<ul class="{cls}">{"".join(out)}</ul>'


def liste_langues(items, style):
    out = []
    for l in items:
        if style == "points":
            n = min(4, max(1, l.get("note", 3) - 1 if l.get("note", 3) == 5 else l.get("note", 3)))
            n = 4 if l.get("note") == 5 else n
            pts = "".join(f'<b class="{"" if k < n else "off"}"></b>' for k in range(4))
            out.append(f'<li><span>{e(l["nom"])}</span><span class="pts" aria-hidden="true">{pts}</span><span class="niv">{e(l["niveau"])}</span></li>')
        elif style == "liste":
            out.append(f'<li><b style="font-weight:600">{e(l["nom"])}</b> · {e(l["niveau"])}</li>')
        else:
            out.append(f'<li><span>{e(l["nom"])}</span> <span class="niv">{e(l["niveau"])}</span></li>')
    cls = {"ligne": "cv-ligne", "liste-niveau": "cv-liste-niveau", "points": "cv-points", "liste": "cv-liste"}[style]
    return f'<ul class="{cls}">{"".join(out)}</ul>'


def element(it, avec_puces=True):
    sous = " · ".join(x for x in [it.get("organisation", ""), it.get("lieu", "")] if x)
    h = (f'<div class="cv-el"><div class="cv-it-tete"><h3 class="cv-it-titre">{e(it["titre"])}</h3>'
         + (f'<span class="cv-it-date">{periode(it)}</span>' if it.get("debut") or it.get("fin") else "") + '</div>'
         + (f'<p class="cv-it-sous">{e(sous)}</p>' if sous else "")
         + (f'<p class="cv-it-texte">{e(it["texte"])}</p>' if it.get("texte") else "")
         + (f'<p class="cv-it-outils">{e(it["outils"])}</p>' if it.get("outils") else "")
         + (f'<ul class="cv-puces">{"".join(f"<li>{e(p)}</li>" for p in it["puces"])}</ul>' if avec_puces and it.get("puces") else "")
         + '</div>')
    return h


def section(typ, d, tpl, zone, lg, sec=None, num=0):
    titre = (sec or {}).get("titre_perso") or TITRES[lg].get(typ, typ)
    st = tpl["styles"]
    corps = ""
    if typ == "profil":
        corps = f'<div class="cv-el"><p class="cv-texte">{e(d["profil"])}</p></div>'
    elif typ == "points_forts":
        if not d.get("points_forts"):
            return ""
        corps = f'<div class="cv-el"><ul class="cv-puces">{"".join(f"<li>{e(p)}</li>" for p in d["points_forts"])}</ul></div>'
    elif typ == "competences":
        corps = f'<div class="cv-el">{liste_comp(sec["items"], st.get("competences", "ligne"), lg)}</div>'
    elif typ == "langues":
        corps = f'<div class="cv-el">{liste_langues(sec["items"], st.get("langues", "ligne"))}</div>'
    elif typ == "interets":
        s = st.get("interets", "ligne")
        cls = {"ligne": "cv-ligne", "chips": "cv-chips", "liste": "cv-liste"}[s]
        corps = f'<div class="cv-el"><ul class="{cls}">{"".join(f"<li>{e(i["nom"])}</li>" for i in sec["items"])}</ul></div>'
    elif typ in ("publications", "communications"):
        corps = "".join(f'<div class="cv-el"><ol class="cv-refs" start="{k + 1}" style="counter-reset:ref {k}"><li>{e(i["titre"])}</li></ol></div>' for k, i in enumerate(sec["items"]))
    elif typ == "certificats":
        corps = "".join(f'<div class="cv-el"><div class="cv-it-tete"><h3 class="cv-it-titre" style="font-size:1em">{e(i["titre"])}</h3><span class="cv-it-date">{e(i.get("fin", ""))}</span></div>'
                        f'<p class="cv-it-sous" style="font-weight:400">{e(i.get("organisation", ""))}</p></div>' for i in sec["items"])
    else:
        corps = "".join(element(i) for i in sec["items"])
    return f'<section class="cv-sec sec-{typ}" data-zone="{zone}" data-type="{typ}"><h2 class="cv-st"><span class="num">{num}. </span>{e(titre)}</h2>{corps}</section>'


def rendre(tpl, d=None, couleur=None, police="sora", densite=None, lg="fr", photo=None, autonome=True, rel="..", max_pages=3):
    d = copy.deepcopy(d or DONNEES[tpl["donnees"]])
    if photo is not None:
        d["info"]["photo"] = photo
    couleur = couleur or tpl["couleur"]
    densite = densite or tpl["densite"]
    acc = HEX.get(couleur, couleur)
    secs = {s["type"]: s for s in d["sections"]}
    # Sections de la colonne secondaire (seulement si le modèle en a une)
    a_lateral = tpl["grille"] in ("deux-d", "lat-g")
    src = []
    for typ in tpl["ordre"]:
        if typ not in ("profil", "points_forts") and typ not in secs:
            continue
        zone = "lateral" if a_lateral and typ in tpl["lateral"] else "principal"
        src.append(section(typ, d, tpl, zone, lg, secs.get(typ), len(src) + 1))
    # Sections présentes dans les données mais absentes de l'ordre du modèle : ajoutées à la fin (rien ne se perd)
    for typ, s in secs.items():
        if typ not in tpl["ordre"]:
            src.append(section(typ, d, tpl, "principal", lg, s, len(src) + 1))
    blocs = {"identite": bloc_identite(d), "contact": bloc_contact(d), "photo": bloc_photo(d, tpl)}
    tete = "".join(f'<div data-bloc-tete=".cv-tete">{blocs[b]}</div>' for b in tpl["tete"] if blocs[b])
    tete += "".join(f'<div data-bloc-tete=".cv-lat-tete">{blocs[b]}</div>' for b in tpl["lat_tete"] if blocs[b])
    i = d["info"]
    lat_tete = '<div class="cv-lat-tete" data-page1></div>' if tpl["lat_tete"] else ""
    page = (f'<div class="cv-page"><div class="cv-deco"></div><header class="cv-tete" data-page1></header>'
            f'<div class="cv-tete-suite"><span>{e(i["prenom"])} {e(i["nom"])}</span><span>{e(i["titre"])}</span></div>'
            f'<main class="cv-principal"></main><aside class="cv-lateral">{lat_tete}</aside><footer class="cv-pied"></footer></div>')
    cls = f'cv tpl-{tpl["id"]} d-{densite}' + (" photo-on" if reglages_photo(d, tpl) else "")
    article = (f'<article class="{cls}" lang="{lg}" data-modele="{tpl["id"]}" data-max-pages="{max_pages}" style="--cv-accent:{acc};--cv-police:{FAM.get(police, police)}">'
               f'<div class="cv-source">{tete.replace("<div data-bloc-tete", "<div style=display:contents data-bloc-tete")}{"".join(src)}</div>'
               f'<template class="cv-page-modele">{page}</template><div class="cv-pages"></div></article>')
    if not autonome:
        return article
    return (f'<!doctype html><html lang="{lg}"><head><meta charset="utf-8"><title>CV {e(i["prenom"])} {e(i["nom"])}</title>'
            f'<link rel="stylesheet" href="{rel}/polices/polices.css"><link rel="stylesheet" href="{rel}/css/cv-base.css">'
            f'<link rel="stylesheet" href="{rel}/css/modele-{tpl["id"]}.css"></head><body>{article}'
            f'<script src="{rel}/js/pagination.js"></script></body></html>')


# ------------------------------------------------------------------ Écriture des fichiers
def ecrire():
    for sous in ("css", "js", "html", "html/variantes"):
        os.makedirs(os.path.join(OUT, sous), exist_ok=True)
    open(os.path.join(OUT, "css", "cv-base.css"), "w").write(BASE_CSS)
    shutil.copy(os.path.join(ICI, "pagination.js"), os.path.join(OUT, "js", "pagination.js"))
    jobs = []
    for n, t in enumerate(M, 1):
        open(os.path.join(OUT, "css", f"modele-{t['id']}.css"), "w").write(f"/* Modèle « {t['nom']} » ({t['id']}) · {t['resume']} */\n" + t["css"].strip() + "\n")
        f = os.path.join(OUT, "html", f"{n:02d}-{t['id']}.html")
        open(f, "w").write(rendre(t))
        jobs.append(dict(html=f, nom=f"{n:02d}-{t['id']}"))
    # Variantes pour montrer le dynamisme : couleur, police, densité, photo, langue des titres
    var = [("moderne", dict(couleur="petrole", police="lato"), "moderne-petrole-lato"),
           ("colonne", dict(photo=False, couleur="bordeaux"), "colonne-sans-photo-bordeaux"),
           ("classique", dict(police="merriweather", couleur="marine"), "classique-merriweather-marine"),
           ("bandeau", dict(lg="en", couleur="foret"), "bandeau-anglais-foret"),
           ("executif", dict(densite="compacte"), "executif-compacte"),
           ("creatif", dict(photo=False), "creatif-monogramme"),
           ("visuel", dict(couleur="bleu", police="inter"), "visuel-bleu-inter"),
           ("tech", dict(d=SENIOR), "tech-senior-2-pages")]
    for tid, kw, nom in var:
        t = next(x for x in M if x["id"] == tid)
        f = os.path.join(OUT, "html", "variantes", f"{nom}.html")
        open(f, "w").write(rendre(t, rel="../..", **kw))
        jobs.append(dict(html=f, nom="variantes/" + nom))
    cat = {
        "version": "1.0", "date": "2026-10-14",
        "regle": "Les modèles ne portent aucun logo, aucune couleur et aucune mention Jumanly.",
        "couleurs": [dict(code=c, nom=nm, hex=h, recommandeeAts=r, contrasteSurBlanc=contraste(h)) for c, nm, h, r in COULEURS],
        "polices": [dict(code=c, nom=nm, famille=f.strip("'"), recommandee=r, style=s) for c, nm, f, r, s in POLICES],
        "densites": {"aeree": {"taillePt": 10.25, "marges": "17 mm"}, "standard": {"taillePt": 9.6, "marges": "14 mm"}, "compacte": {"taillePt": 9, "marges": "11 mm"}},
        "pages": {"min": 1, "max": 3, "alerteAuDela": 2},
        "acces": {"free": "Tous les forfaits (Free inclus)", "starter": "Starter, Pro, Premium", "pro": "Pro, Premium"},
        "modeles": [dict(ordre=n, id=t["id"], nom=t["nom"], acces=t["niveau"], gratuit=t["niveau"] == "free", grille=t["grille"], photo=t["photo"],
                         couleurParDefaut=t["couleur"], policeParDefaut="sora", densiteParDefaut=t["densite"], lisibiliteAts=t["ats"],
                         pagesConseillees=t["pages"], public=t["public"], description=t["resume"], ordreSections=t["ordre"],
                         colonneSecondaire=t["lateral"], enTete=t["tete"], enTeteLaterale=t["lat_tete"], presentations=t["styles"],
                         css=f"css/modele-{t['id']}.css", apercu=f"apercus/{n:02d}-{t['id']}.png")
                    for n, t in enumerate(M, 1)],
    }
    json.dump(cat, open(os.path.join(OUT, "catalogue.json"), "w"), ensure_ascii=False, indent=2)
    json.dump(jobs, open(os.path.join(ICI, "jobs.json"), "w"), ensure_ascii=False, indent=1)
    # Données d'exemple au format de l'application
    os.makedirs(os.path.join(OUT, "donnees"), exist_ok=True)
    for k, d in DONNEES.items():
        json.dump(d, open(os.path.join(OUT, "donnees", f"exemple-{k}.json"), "w"), ensure_ascii=False, indent=2)
    print(len(M), "modèles,", len(jobs), "fichiers HTML")


if __name__ == "__main__":
    ecrire()
