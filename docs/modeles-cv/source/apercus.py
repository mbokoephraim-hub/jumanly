# Aperçus PNG des modèles à partir des PDF : pages en 150 dpi, vignettes 600 px (page 1), planche des 15 modèles.
import os, glob, subprocess, json
from PIL import Image, ImageDraw, ImageFont
ICI = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.normpath(os.path.join(ICI, "..", "modeles"))
cat = json.load(open(os.path.join(OUT, "catalogue.json")))
os.makedirs(os.path.join(OUT, "apercus", "pages"), exist_ok=True); os.makedirs(os.path.join(OUT, "apercus", "variantes"), exist_ok=True)
for f in glob.glob(os.path.join(OUT, "apercus", "**", "*.png"), recursive=True): os.remove(f)
for pdf in sorted(glob.glob(os.path.join(OUT, "pdf", "*.pdf")) + glob.glob(os.path.join(OUT, "pdf", "variantes", "*.pdf"))):
    nom = os.path.basename(pdf)[:-4]; var = "variantes" in pdf
    base = os.path.join(OUT, "apercus", "variantes" if var else "pages", nom)
    subprocess.run(["pdftoppm", "-r", "150", "-png", pdf, base], check=True)
    p1 = sorted(glob.glob(base + "-*.png"))[0]
    if not var:
        im = Image.open(p1); im.thumbnail((600, 900)); im.save(os.path.join(OUT, "apercus", nom + ".png"), optimize=True)
# Planche : 5 colonnes × 3 rangées
F = "/mnt/project-files/developpement/modeles-cv/modeles/polices/Sora-600.ttf"; F4 = F.replace("600", "400")
W, Hh, pad = 420, 594, 40
pl = Image.new("RGB", (5 * W + 6 * pad, 3 * (Hh + 110) + 2 * pad + 120), "#F2EDE5"); d = ImageDraw.Draw(pl)
d.text((pad, 40), "Modèles de CV · 5 gratuits, 10 réservés", font=ImageFont.truetype(F, 46), fill="#0F3F37")
NIV = {"free": ("Gratuit", "#A6F26B", "#0F3F37"), "starter": ("Starter et plus", "#0F3F37", "#E3F67C"), "pro": ("Pro et plus", "#0B1A1F", "#E3F67C")}
for k, m in enumerate(cat["modeles"]):
    x = pad + (k % 5) * (W + pad); y = 140 + (k // 5) * (Hh + 110)
    im = Image.open(os.path.join(OUT, m["apercu"])).convert("RGB").resize((W, Hh), Image.LANCZOS)
    pl.paste(im, (x, y))
    d.text((x, y + Hh + 16), f'{m["ordre"]:02d} · {m["nom"]}', font=ImageFont.truetype(F, 26), fill="#0F3F37")
    lab, bg, fg = NIV[m["acces"]]; ft = ImageFont.truetype(F, 18); tw = d.textlength(lab, font=ft)
    d.rounded_rectangle((x, y + Hh + 58, x + tw + 28, y + Hh + 90), 16, fill=bg); d.text((x + 14, y + Hh + 62), lab, font=ft, fill=fg)
    d.text((x + tw + 40, y + Hh + 62), ("avec photo" if m["photo"] == "option" else "sans photo") + " · ATS " + {"excellente": "excellente", "tres-bonne": "très bonne", "bonne": "bonne"}[m["lisibiliteAts"]], font=ImageFont.truetype(F4, 18), fill="#5B6B68")
pl.save(os.path.join(OUT, "planche-15-modeles.png"), optimize=True)
print("ok")
