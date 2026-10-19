# Modèle d'attestation Jumanly (19/10/2026). python3 attestation.py && node pdf.js
# Chaque élément de sécurité est calculé à partir du numéro et de l'empreinte : deux attestations n'ont jamais le même fond.
import hashlib, math, os, random, json, base64
import qrcode

H = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(H, '..')
FONTS = '/mnt/project-files/identite-visuelle/charte-source/fonts'

SAPIN, LIME, CREME, FEUILLE, MENTHE, ARDOISE = '#0F3F37', '#A6F26B', '#F7F3EC', '#3DA14F', '#2FD3A6', '#5B6B68'

# Données d'exemple (fictives). En production, elles viennent du modèle Certificate.
DATA = dict(
    code='JMN-7K4P-2QX9',
    nom='Grâce Mbuyi',
    formation='Excel pour le travail',
    domaine='Numérique',
    heures='1 h',
    modules=6,
    score=90,
    competences=['Tableaux croisés dynamiques', 'Formules SI et RECHERCHEV', 'Graphiques'],
    date='18 octobre 2026',
    heure='14:32 UTC',
    url='jumanly.io/attestations/JMN-7K4P-2QX9',
)
# Empreinte : en production, signature Ed25519 de la charge canonique par la clé privée de Jumanly.
CHARGE = json.dumps({k: DATA[k] for k in ('code', 'nom', 'formation', 'heures', 'score', 'date')}, ensure_ascii=False, sort_keys=True)
EMPREINTE = hashlib.sha256(('jumanly-demo|' + CHARGE).encode()).hexdigest().upper()
EMP_COURTE = '·'.join(EMPREINTE[i:i + 4] for i in range(0, 24, 4))
rng = random.Random(EMPREINTE)

W, Hh = 1123, 794   # A4 paysage à 96 ppp

def pts(path):
    return 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in path)

# ---------- Guilloches ----------
def rosace(cx, cy, R, r, d, n=1800, tours=None, phase=0):
    tours = tours or r
    out = []
    for i in range(n + 1):
        t = 2 * math.pi * tours * i / n
        x = (R - r) * math.cos(t + phase) + d * math.cos((R - r) / r * t + phase)
        y = (R - r) * math.sin(t + phase) - d * math.sin((R - r) / r * t + phase)
        out.append((cx + x, cy + y))
    return pts(out)

def bande(y0, h, largeur, nb=7, freq=None):
    freq = freq or rng.uniform(17, 23)
    ch = []
    for k in range(nb):
        ph = k * math.pi / nb + rng.uniform(0, .2)
        p = [(x, y0 + h / 2 + h / 2 * math.sin(2 * math.pi * freq * x / largeur + ph) * math.cos(2 * math.pi * 3 * x / largeur + ph / 2))
             for x in [i * largeur / 1400 for i in range(1401)]]
        ch.append(f'<path d="{pts(p)}"/>')
    return ''.join(ch)

def fond():
    g = []
    # Trame fine sur toute la page (lignes ondulées croisées)
    for k in range(0, 60):
        y = 14 * k
        p = [(x, y + 5 * math.sin(x / 31 + k * .7) + 3 * math.sin(x / 13 + k)) for x in range(0, W + 8, 8)]
        g.append(f'<path d="{pts(p)}"/>')
    trame = f'<g fill="none" stroke="{SAPIN}" stroke-opacity=".045" stroke-width=".6">{"".join(g)}</g>'
    # Grande rosace derrière le nom, propre à chaque attestation
    R = rng.choice([96, 105, 112]); r = rng.choice([21, 23, 27, 29]); d = rng.uniform(40, 58)
    ros = ''.join(f'<path d="{rosace(W/2, 372, R + k*7, r, d - k*3, phase=k*.09)}"/>' for k in range(5))
    rosaces = f'<g fill="none" stroke="{FEUILLE}" stroke-opacity=".10" stroke-width=".55">{ros}</g>'
    return trame + rosaces

# ---------- Micro-texte ----------
def microtexte(code):
    m = f'JUMANLY · ATTESTATION AUTHENTIQUE · {code} · VÉRIFIABLE EN LIGNE · LEARN. GROW. CONNECT. · '
    return (m * 14)

# ---------- QR code ----------
def qr_svg(texte, taille):
    q = qrcode.QRCode(border=0, error_correction=qrcode.constants.ERROR_CORRECT_Q)
    q.add_data(texte); q.make()
    m = q.get_matrix(); n = len(m); c = taille / n
    d = ''.join(f'M{x*c:.2f} {y*c:.2f}h{c:.2f}v{c:.2f}h-{c:.2f}z' for y, row in enumerate(m) for x, v in enumerate(row) if v)
    return f'<svg viewBox="0 0 {taille} {taille}" width="{taille}" height="{taille}"><path d="{d}" fill="{SAPIN}"/></svg>'

# ---------- Signature numérique dessinée à partir de l'empreinte ----------
def signature():
    s = random.Random(EMPREINTE + 'sig')
    P = [(12, 44)]; x = 12; haut = True
    for i in range(11):
        x += s.uniform(-12, -6) if (i % 3 == 2) else s.uniform(16, 26)
        y = s.uniform(14, 24) if haut else s.uniform(36, 46)
        y += i * .9
        P.append((x, y)); haut = not haut
    P.append((x + 22, P[-1][1] - 4))
    d = f'M{P[0][0]:.1f} {P[0][1]:.1f}'
    for i in range(len(P) - 1):
        p0 = P[i - 1] if i else P[i]; p1, p2 = P[i], P[i + 1]; p3 = P[i + 2] if i + 2 < len(P) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 2.6, p1[1] + (p2[1] - p0[1]) / 2.6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 2.6, p2[1] - (p3[1] - p1[1]) / 2.6)
        d += f' C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}'
    trait = f'<path d="{d}" fill="none" stroke="{SAPIN}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>'
    sous = f'<path d="M30 60 C80 50 150 66 {x+30:.0f} 48" fill="none" stroke="{SAPIN}" stroke-width="1.3" stroke-linecap="round"/>'
    return f'<svg viewBox="0 0 230 72" width="210" height="66">{trait}{sous}</svg>'

# ---------- Sceau ----------
SYMB = f'<g transform="translate(-24 -24) scale(.4)"><rect width="120" height="120" rx="30" fill="{SAPIN}"/><g transform="translate(2.25 -4.35) scale(1.1)"><path d="M70 55 V70 A19 19 0 0 1 33.15 76.50" fill="none" stroke="#fff" stroke-width="17" stroke-linecap="round"/><circle cx="70" cy="31" r="11.5" fill="{LIME}"/></g></g>'
def sceau():
    dents = ''.join(f'<path d="M{60+56*math.cos(a):.2f} {60+56*math.sin(a):.2f} L{60+52*math.cos(a+.07):.2f} {60+52*math.sin(a+.07):.2f}"/>' for a in [i * 2 * math.pi / 90 for i in range(90)])
    ros = rosace(60, 60, 30, 7, 14, n=900)
    return f'''<svg viewBox="0 0 120 120" width="132" height="132">
<circle cx="60" cy="60" r="57" fill="{LIME}"/><g stroke="{SAPIN}" stroke-width="1" stroke-opacity=".5">{dents}</g>
<circle cx="60" cy="60" r="50" fill="#fff"/><circle cx="60" cy="60" r="50" fill="none" stroke="{SAPIN}" stroke-width="1"/>
<path d="{ros}" fill="none" stroke="{FEUILLE}" stroke-opacity=".35" stroke-width=".4"/>
<defs><path id="cercle" d="M60 60 m-40 0 a40 40 0 1 1 80 0 a40 40 0 1 1 -80 0"/></defs>
<text font-family="Sora" font-size="7.4" font-weight="700" letter-spacing="1.6" fill="{SAPIN}"><textPath href="#cercle">ATTESTATION VALIDÉE · SCEAU D’ORIGINALITÉ ·</textPath></text>
<g transform="translate(60 60)">{SYMB}</g></svg>'''

def logo():
    s = open('/mnt/project-files/identite-visuelle/logos/logo-horizontal/jumanly-logo-principal.svg').read()
    import re
    s = re.sub(r'<metadata>.*?</metadata>', '', s, flags=re.S)
    return s.replace('width="2313" height="480"', 'width="173" height="36"')

def font_face():
    out = ''
    for poids, f in [(300, 'Light'), (400, 'Regular'), (500, 'Medium'), (600, 'SemiBold'), (700, 'Bold')]:
        b64 = base64.b64encode(open(f'{FONTS}/Sora-{f}.ttf', 'rb').read()).decode()
        out += f"@font-face{{font-family:Sora;font-weight:{poids};src:url(data:font/ttf;base64,{b64}) format('truetype')}}"
    return out

d = DATA
comp = ''.join(f'<span>{c}</span>' for c in d['competences'])
html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Attestation {d["code"]} · Jumanly</title>
<style>{font_face()}
@page{{size:297mm 210mm;margin:0}}
*{{box-sizing:border-box;margin:0}}
html,body{{background:#E6E0D5;font-family:Sora,sans-serif;color:{SAPIN};-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.page{{position:relative;width:{W}px;height:{Hh}px;background:{CREME};overflow:hidden;margin:0 auto}}
.page>svg.fond{{position:absolute;inset:0}}
.cadre{{position:absolute;inset:22px;border:1.4px solid {SAPIN};border-radius:6px}}
.cadre2{{position:absolute;inset:30px;border:.6px solid {SAPIN};border-radius:3px;opacity:.6}}
.micro{{position:absolute;left:36px;right:36px;font-size:3.6px;letter-spacing:.35px;white-space:nowrap;overflow:hidden;color:{SAPIN};opacity:.75;font-weight:600}}
.micro.h{{top:24.5px}}.micro.b{{bottom:24.5px}}
.micro.v{{top:36px;bottom:36px;left:auto;right:auto;width:4px;writing-mode:vertical-rl}}
.micro.g{{left:24px}}.micro.d{{right:24px}}
.bande{{position:absolute;left:36px;right:36px;height:24px}}
.bande.h{{top:40px}}.bande.b{{bottom:40px}}
.coin{{position:absolute;width:40px;height:40px;border-color:{LIME};border-style:solid}}
.coin.a{{top:44px;left:44px;border-width:4px 0 0 4px;border-radius:10px 0 0 0}}.coin.b{{top:44px;right:44px;border-width:4px 4px 0 0;border-radius:0 10px 0 0}}
.coin.c{{bottom:44px;left:44px;border-width:0 0 4px 4px;border-radius:0 0 0 10px}}.coin.d{{bottom:44px;right:44px;border-width:0 4px 4px 0;border-radius:0 0 10px 0}}
.filigrane{{position:absolute;right:86px;top:190px;opacity:.03}}
.tete{{position:absolute;top:78px;left:92px;right:92px;display:flex;justify-content:space-between;align-items:center}}
.num{{text-align:right;font-size:10.5px;line-height:1.5;color:{ARDOISE}}}.num b{{display:block;font-size:13px;color:{SAPIN};letter-spacing:.06em}}
.centre{{position:absolute;top:160px;left:120px;right:120px;text-align:center;display:flex;flex-direction:column;align-items:center}}
.grand{{font-size:50px;font-weight:700;letter-spacing:.22em;line-height:1;padding-left:.22em}}
.sous{{margin-top:10px;font-size:15px;font-weight:500;letter-spacing:.32em;text-transform:uppercase;color:{FEUILLE}}}
.trait{{width:120px;height:4px;border-radius:2px;background:{LIME};margin:18px 0 16px}}
.dec{{font-size:13px;color:{ARDOISE};letter-spacing:.04em}}
.nom{{font-size:44px;font-weight:600;letter-spacing:-.02em;margin:6px 0 12px}}
.txt{{font-size:13.5px;line-height:1.65;max-width:700px;color:#2B4A44}}
.txt b{{color:{SAPIN};font-weight:600}}
.comp{{display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap}}
.comp span{{font-size:11px;font-weight:600;padding:5px 12px;border-radius:999px;background:rgba(166,242,107,.35);border:1px solid rgba(15,63,55,.15)}}
.pied{{position:absolute;left:92px;right:92px;bottom:96px;display:grid;grid-template-columns:1fr 150px 1fr;align-items:end;gap:20px}}
.sig{{font-size:10px;color:{ARDOISE};line-height:1.5}}.sig b{{display:block;font-size:11.5px;color:{SAPIN}}}
.sig .ligne{{width:210px;border-top:1px solid {SAPIN};margin:2px 0 6px}}
.emp{{font-size:8.5px;letter-spacing:.06em;color:{SAPIN};font-weight:600}}
.sceau{{display:flex;justify-content:center;margin-bottom:-6px}}
.verif{{display:flex;gap:12px;align-items:flex-end;justify-content:flex-end;text-align:right;font-size:10px;color:{ARDOISE};line-height:1.5}}
.verif b{{display:block;color:{SAPIN};font-size:11.5px}}
.verif .qr{{padding:6px;background:#fff;border-radius:8px;border:1px solid rgba(15,63,55,.2)}}
.base{{position:absolute;left:0;right:0;bottom:72px;text-align:center;font-size:8.5px;color:{ARDOISE};letter-spacing:.04em}}
</style></head><body>
<div class="page">
<svg class="fond" viewBox="0 0 {W} {Hh}" width="{W}" height="{Hh}">{fond()}</svg>
<svg class="bande h" viewBox="0 0 {W-72} 24" preserveAspectRatio="none"><g fill="none" stroke="{FEUILLE}" stroke-opacity=".35" stroke-width=".5">{bande(0, 24, W-72)}</g></svg>
<svg class="bande b" viewBox="0 0 {W-72} 24" preserveAspectRatio="none"><g fill="none" stroke="{FEUILLE}" stroke-opacity=".35" stroke-width=".5">{bande(0, 24, W-72)}</g></svg>
<div class="cadre"></div><div class="cadre2"></div>
<div class="micro h">{microtexte(d["code"])}</div><div class="micro b">{microtexte(d["code"])}</div>
<div class="micro v g">{microtexte(d["code"])}</div><div class="micro v d">{microtexte(d["code"])}</div>
<span class="coin a"></span><span class="coin b"></span><span class="coin c"></span><span class="coin d"></span>
<svg class="filigrane" viewBox="23.5 19.5 58 78" width="260" height="350"><path d="M70 55 V70 A19 19 0 0 1 33.15 76.50" fill="none" stroke="{SAPIN}" stroke-width="17" stroke-linecap="round"/><circle cx="70" cy="31" r="11.5" fill="{SAPIN}"/></svg>
<div class="tete">{logo()}<div class="num"><b>N° {d["code"]}</b>Délivrée le {d["date"]}</div></div>
<div class="centre">
<div class="grand">ATTESTATION</div><div class="sous">de réussite</div><span class="trait"></span>
<div class="dec">Jumanly atteste que</div>
<div class="nom">{d["nom"]}</div>
<p class="txt">a suivi et réussi la formation <b>« {d["formation"]} »</b> ({d["domaine"]}, {d["heures"]}, {d["modules"]} modules),<br>avec un résultat de <b>{d["score"]} %</b> à l’évaluation finale. Compétences validées :</p>
<div class="comp">{comp}</div>
</div>
<div class="pied">
<div class="sig">{signature()}<div class="ligne"></div><b>Direction pédagogique, Jumanly</b>Signé électroniquement le {d["date"]} à {d["heure"]}<div class="emp">Empreinte {EMP_COURTE}</div></div>
<div class="sceau">{sceau()}</div>
<div class="verif"><div><b>Vérifier l’authenticité</b>Scannez le code ou rendez-vous sur<br>{d["url"]}</div><span class="qr">{qr_svg("https://" + d["url"], 82)}</span></div>
</div>
<div class="base">Une plateforme développée par The Growth Lab · Learn. Grow. Connect. · Ce document n’a de valeur que s’il est confirmé en ligne.</div>
</div></body></html>'''
open(os.path.join(OUT, 'attestation-jumanly.html'), 'w').write(html)
print('ok', len(html), EMP_COURTE)
