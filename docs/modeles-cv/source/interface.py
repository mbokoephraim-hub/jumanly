# JUMANLY · Interface de choix et de mise en forme des modèles de CV (maquettes aux couleurs Jumanly).
# Réutilise le socle des maquettes page par page (maquettes-ui/source) ; seules ces pages-ci portent l'identité Jumanly.
# Usage : python3 interface.py && NODE_PATH=/opt/node-tools/node_modules node rendu_interface.js
import os, sys, re, json
ICI_CV = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.normpath(os.path.join(ICI_CV, "..", "..", "..", "maquettes-ui", "source"))
sys.path.insert(0, SRC)
import p_commun as C
from p_commun import *  # noqa
from p_talent import career_nav, lien, pourquoi_ligne, mtitre, VERT  # noqa
import base

OUT = os.path.normpath(os.path.join(ICI_CV, "..", "interface"))
MOD = os.path.normpath(os.path.join(ICI_CV, "..", "modeles"))
CAT = json.load(open(os.path.join(MOD, "catalogue.json")))
os.makedirs(os.path.join(OUT, "html"), exist_ok=True)


def img(chemin):  # chemin relatif au dossier modeles/, exprimé depuis le dossier de travail des maquettes (réécrit à l'écriture)
    return base.rel(os.path.join(MOD, chemin))


POL_CSS = "".join(f"@font-face{{font-family:'{f}';src:url({base.rel(os.path.join(MOD, 'polices', n))})}}"
                  for f, w, n in [("Inter", 500, "Inter-500.ttf"), ("Source Sans 3", 600, "SourceSans3-600.ttf"), ("Lato", 700, "Lato-700.ttf"),
                                  ("Merriweather", 700, "Merriweather-700.ttf"), ("Lora", 600, "Lora-600.ttf")])
CSS_X = POL_CSS + """
.vign{position:relative;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 1px 0 #E2E0DA}
.vign img{display:block;width:100%;aspect-ratio:210/297;object-fit:cover}
.vign .badges{position:absolute;left:8px;right:8px;top:8px;display:flex;justify-content:space-between}
.mcard{display:flex;flex-direction:column;gap:8px}
.mcard.sel .vign{box-shadow:0 0 0 3px #0F3F37}
.mcard.lock .vign img{filter:saturate(.9)}
.sw{width:30px;height:30px;border-radius:50%;flex:none;position:relative}
.sw.on{box-shadow:0 0 0 2px #fff,0 0 0 4px #0F3F37}
.sw.on::after{content:"";position:absolute;left:10px;top:7px;width:7px;height:12px;border:solid #fff;border-width:0 2.5px 2.5px 0;transform:rotate(45deg)}
.pol{display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:14px}
.pol.on{background:#F2EDE5;box-shadow:inset 0 0 0 1.5px #0F3F37}
.pol .aa{font-size:20px;width:34px;text-align:center}
.feuille{background:#fff;border-radius:6px;box-shadow:0 20px 50px rgba(15,63,55,.14);overflow:hidden}
.feuille img{display:block;width:100%}
.saut{display:flex;align-items:center;gap:8px;font-size:11.5px;font-weight:600;color:#3DA14F}
.saut::before,.saut::after{content:"";flex:1;border-top:1.5px dashed #3DA14F}
"""
NIV = {"free": None, "starter": "Starter", "pro": "Pro"}
GRI = {"une": "Une colonne", "deux-d": "Deux colonnes", "lat-g": "Barre latérale"}
ATS = {"excellente": "ATS excellente", "tres-bonne": "ATS très bonne", "bonne": "ATS bonne"}


def carte_modele(m, sel=False, user_niv="free", petit=False):
    verrou = m["acces"] != "free" and user_niv == "free"
    if verrou:
        b = f'<span class="tag t-sapin" style="height:24px">{ic("lock", 12, "#E3F67C")} {NIV[m["acces"]]}</span>'
    else:
        b = f'<span class="tag t-lime" style="height:24px">Inclus</span>'
    actuel = f'<span class="rond" style="width:24px;height:24px;background:#0F3F37">{ic("check", 13, "#A6F26B")}</span>' if m["id"] == "classique" else ""
    ph = ic("profil", 13, "#5B6B68") if m["photo"] == "option" else ""
    return (f'<div class="mcard{" sel" if sel else ""}{" lock" if verrou else ""}"><div class="vign"><img src="{img(m["apercu"])}"><div class="badges">{b}{actuel}</div></div>'
            f'<div class="row sb g6"><span class="w6" style="font-size:{13 if petit else 14}px">{m["nom"]}</span>{ph}</div>'
            + ("" if petit else f'<span class="xs mut" style="margin-top:-6px">{GRI[m["grille"]]} · {"photo facultative" if m["photo"] == "option" else "sans photo"}</span>')
            + f'</div>')


FILTRES = ["Tous (15)", "Inclus dans mon forfait (5)", "Avec photo", "Sans photo", "Une colonne", "Deux colonnes", "ATS excellente"]


# ------------------------------------------------------------------ 1 · Galerie des modèles (talent Free, modèle réservé sélectionné)
def galerie(m=False):
    C.USERS["talent"] = ("GM", "Grâce Mbuyi", "Talent · Free", 0, ("Personnel", None))
    sel = next(x for x in CAT["modeles"] if x["id"] == "bandeau")
    if m:
        cartes = "".join(carte_modele(x, x["id"] == "bandeau", petit=True) for x in CAT["modeles"][:8])
        c = (career_nav(2, True) + mtitre("Choisir un modèle", "Career · CV Data analyst")
             + f'<div class="scroll">' + "".join(f'<span class="chip{" on" if i == 0 else ""}" style="height:36px">{t}</span>' for i, t in enumerate(FILTRES[:4])) + '</div>'
             + f'<div class="row g8 xs mut">{ic("valider", 14, VERT)}<span>5 modèles inclus dans votre forfait</span></div>'
             + f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">{cartes}</div>'
             + f'<div class="card col g10" style="padding:16px;position:sticky;bottom:0"><div class="row g10"><span class="w6 f1">Bandeau</span><span class="tag t-sapin">{ic("lock", 12, "#E3F67C")} Disponible avec Starter</span></div>'
             f'<div class="row g8"><span class="btn b-ghost f1" style="height:44px">Aperçu</span><span class="btn b-sapin f1" style="height:44px">Voir les forfaits</span></div></div>')
        return app_m(c, "career")
    cartes = "".join(carte_modele(x, x["id"] == "bandeau") for x in CAT["modeles"])
    filtres = "".join(f'<span class="chip{" on" if i == 0 else ""}">{t}</span>' for i, t in enumerate(FILTRES))
    gauche = (f'<div class="col g16 f1"><div class="row g8" style="flex-wrap:wrap">{filtres}</div>'
              f'<div class="row sb"><span class="row g8 sm">{ic("valider", 16, VERT)}<b class="w6">5 modèles inclus dans votre forfait</b><span class="mut">· 10 autres avec Starter ou Pro</span></span>'
              f'<span class="row g6 sm mut">Trier : <b class="w6" style="color:#0F3F37">Recommandés</b>{ic("chev-d", 14)}</span></div>'
              f'<div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:18px 16px">{cartes}</div></div>')
    detail = (f'<div class="card col g14" style="width:372px;flex:none;padding:20px;position:sticky;top:0">'
              f'<div class="row sb"><div class="col"><span class="lab mut">Modèle</span><h2>{sel["nom"]}</h2></div><span class="tag t-sapin" style="height:28px">{ic("lock", 13, "#E3F67C")} Starter</span></div>'
              f'<div style="position:relative;border-radius:16px;overflow:hidden;background:#E9E4DA;padding:16px 16px 0"><div class="feuille"><img src="{img("apercus/pages/07-bandeau-1.png")}"></div>'
              f'<span class="tag t-blanc" style="position:absolute;left:24px;top:24px;height:26px;box-shadow:0 2px 8px rgba(0,0,0,.12)">{ic("eye", 13)} Aperçu avec votre contenu</span></div>'
              f'<span class="sm mut">{sel["description"]}</span>'
              f'<div class="row g6" style="flex-wrap:wrap"><span class="tag t-menthe">{ATS[sel["lisibiliteAts"]]}</span><span class="tag t-brume">{GRI[sel["grille"]]}</span>'
              f'<span class="tag t-brume">Photo facultative</span><span class="tag t-brume">{sel["pagesConseillees"]} page(s)</span></div>'
              + (f'<div class="row g12" style="align-items:flex-start;background:#F2EDE5;border-radius:18px;padding:14px"><span class="tile" style="width:40px;height:40px;background:#fff">{ic("lock", 18)}</span>'
                 f'<div class="col f1"><span class="w6 sm" style="font-size:13.5px">Disponible avec Starter</span><span class="xs mut">Inclus dans Starter, Pro et Premium. Changer de modèle ne modifie jamais votre contenu.</span></div></div>')
              + f'<div class="row g8"><span class="btn b-ghost f1">{ic("eye", 15)} Aperçu plein écran</span><span class="btn b-lime f1">Voir les forfaits</span></div>'
              f'<span class="xs mut" style="text-align:center">Vos CV téléchargés ne portent ni logo ni mention Jumanly.</span></div>')
    return app("career", career_nav(2) + f'<div class="row g24" style="align-items:flex-start">{gauche}{detail}</div>', "Choisir un modèle", "Career · CV Data analyst")


# ------------------------------------------------------------------ 2 · Mise en forme (couleur, police, densité, photo, pages, export)
def nuancier(rec):
    return "".join(f'<span class="sw{" on" if c["code"] == "marine" else ""}" style="background:{c["hex"]}" title="{c["nom"]}"></span>' for c in CAT["couleurs"] if c["recommandeeAts"] == rec)


def polices():
    h = ""
    for p in CAT["polices"]:
        on = p["code"] == "merriweather"
        t = '<span class="tag t-lime" style="height:22px">Recommandée</span>' if p["recommandee"] else ""
        fam = p["famille"]
        h += (f'<div class="pol{" on" if on else ""}"><span class="aa" style="font-family:\'{fam}\'">Aa</span><span class="f1 sm w6">{p["nom"]}</span>{t}'
              + (ic("check", 16, VERT) if on else "") + '</div>')
    return h


def bloc(titre, corps, aide=""):
    return (f'<div class="col g10"><span class="lab mut">{titre}</span>{corps}' + (f'<span class="xs mut">{aide}</span>' if aide else "") + '</div>')


def reglages(m=False):
    return (bloc("Couleur d'accent", f'<span class="xs w6">Recommandées pour les logiciels de recrutement</span><div class="row g8" style="flex-wrap:wrap">{nuancier(True)}</div>'
                 f'<span class="xs w6" style="margin-top:4px">Autres couleurs</span><div class="row g8" style="flex-wrap:wrap">{nuancier(False)}</div>'
                 f'<div class="row g8"><span class="row g8 f1" style="height:40px;border-radius:12px;background:#fff;box-shadow:inset 0 0 0 1.5px #DCE5E1;padding:0 12px;font-size:13px">'
                 f'<span class="sw" style="width:18px;height:18px;background:#1B365D"></span>#1B365D</span><span class="tag t-up">{ic("check", 12, VERT)} Contraste 12,1:1</span></div>',
                 "Le texte reste noir sur fond blanc. La couleur ne sert qu'aux titres, aux filets et aux décors.")
            + '<div class="sep"></div>'
            + bloc("Police", f'<div class="col g4">{polices()}</div>', "Toutes les polices sont intégrées au PDF.")
            + '<div class="sep"></div>'
            + bloc("Densité", segments(["Aérée", "Standard", "Compacte"], 1))
            + '<div class="sep"></div>'
            + f'<div class="row g12"><div class="col f1"><span class="sm w6">Afficher ma photo sur le CV</span><span class="xs mut">Facultatif. De nombreux recruteurs préfèrent un CV sans photo.</span></div>{interrupteur(False)}</div>'
            + '<div class="sep"></div>'
            + bloc("Langue des titres", segments(["Français", "English"], 0), "Seuls les titres de sections changent. Votre texte n'est pas traduit."))


def mise_en_forme(m=False):
    C.USERS["talent"] = ("GM", "Grâce Mbuyi", "Talent · Pro", 0, ("Personnel", None))
    p1, p2 = img("apercus/variantes/classique-merriweather-marine-1.png"), img("apercus/variantes/classique-merriweather-marine-2.png")
    if m:
        c = (mtitre("Mise en forme", "Mon CV · Classique", f'<span class="btn s b-sapin">{ic("telecharger", 14, "#fff")} PDF</span>')
             + f'<div class="row g8"><span class="chip">Contenu</span><span class="chip on">Mise en forme</span><span class="chip">Aperçu</span></div>'
             + f'<div style="height:300px;overflow:hidden;border-radius:16px;background:#E9E4DA;padding:14px 40px 0"><div class="feuille"><img src="{p1}"></div></div>'
             + f'<div class="row sb"><span class="sm w6">2 pages · Format A4</span>{lien("Changer de modèle", True)}</div>'
             + f'<div class="card col g16" style="padding:18px">{reglages(True)}</div>')
        return app_m(c, "career")
    modele = (f'<div class="row g12"><div class="vign" style="width:58px;flex:none;border-radius:8px"><img src="{img("apercus/01-classique.png")}"></div>'
              f'<div class="col f1"><span class="w6">Classique</span><span class="xs mut">Lisible par les logiciels de recrutement</span></div>{lien("Changer")}</div>')
    gauche = (f'<div class="card col g16" style="width:340px;flex:none;padding:20px"><div class="row g8"><span class="chip">Contenu</span><span class="chip on">Mise en forme</span></div>'
              f'{modele}<div class="sep"></div>{reglages()}</div>')
    centre = (f'<div class="col g12 f1" style="align-items:center"><div class="row g8" style="align-self:stretch"><span class="tag t-up">{ic("check", 12, VERT)} Enregistré</span>'
              f'<div style="flex:1"></div><span class="btn s b-ghost">{ic("partager", 15)} Partager</span><span class="btn s b-sapin">{ic("telecharger", 15, "#fff")} PDF</span></div>'
              f'<div class="feuille" style="width:540px"><img src="{p1}"></div><span class="saut" style="width:540px">Saut de page avant « Engagement »</span>'
              f'<div class="feuille" style="width:540px;height:300px"><img src="{p2}"></div><span class="xs mut">2 pages · Format A4</span></div>')
    pages = (f'<div class="card col g12" style="padding:18px"><div class="row sb"><span class="w6">Pages</span><span class="tag t-brume">2 sur 3 au maximum</span></div>'
             f'<div class="row g10">' + "".join(f'<div class="col g6" style="flex:1;align-items:center"><div class="vign" style="width:100%;border-radius:6px{";box-shadow:0 0 0 2px #0F3F37" if i == 0 else ""}"><img src="{p}"></div><span class="xs mut">Page {i + 1}</span></div>' for i, p in enumerate([p1, p2]))
             + f'<div class="col g6" style="flex:1;align-items:center"><div style="width:100%;aspect-ratio:210/297;border-radius:6px;border:1.5px dashed #9FB3AD;display:grid;place-items:center">{ic("plus", 20, "#5B6B68")}</div><span class="xs mut">Ajouter</span></div></div>'
             f'<span class="btn s b-ghost" style="width:100%">{ic("plus", 13)} Commencer une nouvelle page ici</span>'
             f'<span class="btn s b-ghost" style="width:100%">Faire tenir sur une page</span>'
             f'<span class="xs mut">Les recruteurs lisent surtout la première page. Au-delà de deux pages, nous vous le signalons.</span></div>')
    export = (f'<div class="card col g12" style="padding:18px"><span class="w6">Exporter mon CV</span>'
              + "".join(f'<div class="row g10" style="padding:10px 12px;border-radius:14px;{"background:#F2EDE5;box-shadow:inset 0 0 0 1.5px #0F3F37" if i == 0 else "box-shadow:inset 0 0 0 1.5px #DCE5E1"}">'
                        f'{ic("doc", 17)}<span class="f1 sm w6">{t}</span>{ic("check", 15, VERT) if i == 0 else ""}</div>' for i, t in enumerate(["PDF (recommandé)", "Word"]))
              + f'<span class="xs mut">CV-Grace-Mbuyi.pdf · 2 pages · texte sélectionnable</span>'
              f'<span class="btn b-sapin" style="width:100%">{ic("telecharger", 15, "#fff")} Télécharger</span>'
              f'<span class="xs mut" style="text-align:center">Votre CV ne porte ni logo ni mention Jumanly.</span></div>')
    droite = f'<div class="col g16" style="width:300px;flex:none">{pages}{export}</div>'
    return app("career", career_nav(2) + f'<div class="row g20" style="align-items:flex-start">{gauche}{centre}{droite}</div>', "Mon CV", "Career · CV Data analyst · Mise en forme")


ECRANS = [("01-galerie-modeles-desktop", lambda: galerie(False), 1440), ("01-galerie-modeles-mobile", lambda: galerie(True), 390),
          ("02-mise-en-forme-desktop", lambda: mise_en_forme(False), 1440), ("02-mise-en-forme-mobile", lambda: mise_en_forme(True), 390)]


def reecrire(h):
    """Les chemins relatifs sont calculés depuis maquettes-ui/source/html : on les ré-exprime depuis interface/html."""
    def fix(mo):
        u = mo.group(2)
        if u.startswith(("data:", "http", "#")):
            return mo.group(0)
        a = os.path.normpath(os.path.join(base.HTML, u))
        return mo.group(1) + os.path.relpath(a, os.path.join(OUT, "html")) + mo.group(3)
    h = re.sub(r'(src=")([^"]+)(")', fix, h)
    return re.sub(r'(url\()([^)\'"]+)(\))', fix, h)


if __name__ == "__main__":
    jobs = []
    for nom, f, w in ECRANS:
        h = f().replace("</style>", CSS_X + "</style>", 1)
        p = os.path.join(OUT, "html", nom + ".html")
        open(p, "w").write(reecrire(h))
        jobs.append([p, os.path.join(OUT, nom + ".pdf"), os.path.join(OUT, nom + ".png"), w, 2 if w == 390 else 1])
    json.dump({"pages": jobs}, open(os.path.join(ICI_CV, "jobs-interface.json"), "w"))
    print(len(jobs), "écrans")
