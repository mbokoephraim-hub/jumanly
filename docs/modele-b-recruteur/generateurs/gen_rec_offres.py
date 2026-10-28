# Génère canvas/project/Formation.dc.html et ses artboards d’étape.
import os, json
D = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(D, 'canvas/project')
JS = open(os.path.join(D, 'rec_offres_logic.js')).read()

def ico(d, s=20, sw='1.7', col='currentColor'):
    return f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="{col}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{d}"></path></svg>'
ORBI = lambda s: (f'<svg width="{s}" height="{s}" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="23" fill="#2FD3A6"></circle>'
                  '<path d="M23 10.5c1.3 7.4 5.6 11.8 13 13.1-7.4 1.3-11.7 5.7-13 13.1-1.3-7.4-5.6-11.8-13-13.1 7.4-1.3 11.7-5.7 13-13.1z" fill="#0B1A1F"></path>'
                  '<circle cx="35" cy="13" r="3.4" fill="#F2EDE5"></circle></svg>')
RETOUR = 'M15 5 8 12l7 7'
CROIX = 'M6 6l12 12M18 6 6 18'
LOUPE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9FB3AE" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m20 20-4.4-4.4"></path></svg>'
HORL = 'M12 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zM12 8v4l2.5 2'
CHECK = 'm5 12.5 4.5 4.5L19 7.5'
BACK = lambda act, t: f'<button onClick="{{{{{act}}}}}" class="retour" aria-label="Retour">{ico(RETOUR, 20, "2")}{t}</button>'

CSS = '''
body{margin:0;background:#050D10}
a{color:#A6F26B;text-decoration:none}
.fd,.fd *{box-sizing:border-box}
.fd{font-family:"Sora",system-ui,sans-serif;color:#F2EDE5;-webkit-font-smoothing:antialiased}
.fd h1,.fd h2,.fd h3,.fd p{margin:0}
.fd button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:left}
.fd .scroll{scrollbar-width:none}.fd .scroll::-webkit-scrollbar{display:none}
.fd .hrow{display:flex;gap:14px;overflow-x:auto;padding:0 20px 4px;scroll-snap-type:x mandatory;scroll-padding-inline:20px;scrollbar-width:none}
.fd .hrow::after{content:"";flex:0 0 6px}
.fd .hrow::-webkit-scrollbar{display:none}
.fd .hrow>*{flex:none;scroll-snap-align:start}
.fd .sec{display:flex;align-items:baseline;justify-content:space-between;padding:0 20px;margin:30px 0 12px}
.fd .sec h2{font-size:19px;font-weight:600}
.fd .sec button{font-size:14px;font-weight:600;min-height:36px}
.fd .meta{font-size:13px;color:#8FA39E}
.fd .tag{font-size:12.5px;padding:5px 9px;border-radius:7px;background:#1A2629;color:#C9D6D2}
.fd .carte{width:262px;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,.16);background:#0B1A1F;display:block}
.fd .ligne{width:100%;display:flex;align-items:center;gap:14px;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.07)}
.fd .mini{width:48px;height:48px;border-radius:14px;color:#FFFFFF;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none}
.fd .barre{display:block;height:4px;border-radius:2px;background:rgba(255,255,255,.1);margin-top:8px;overflow:hidden}
.fd .barre i{display:block;height:100%;background:#A6F26B;border-radius:2px}
.fd .chip{height:38px;padding:0 16px;border-radius:19px;font-size:14px;font-weight:500;white-space:nowrap;display:inline-flex;align-items:center;flex:none}
.fd .bp{display:flex;align-items:center;justify-content:center;width:100%;height:52px;border-radius:26px;background:#A6F26B;color:#0B1A1F;font-size:15px;font-weight:700;text-align:center}
.fd .bs{display:flex;align-items:center;justify-content:center;height:52px;padding:0 20px;border-radius:26px;border:1px solid rgba(255,255,255,.18);font-size:14px;font-weight:600;text-align:center}
.fd .bloc{padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.07)}
.fd .bloc h3{font-size:15px;font-weight:700;margin-bottom:10px}
.fd .li{display:flex;gap:10px;font-size:14.5px;line-height:1.45;color:#ECE7DF;padding:4px 0}
.fd .li i{width:6px;height:6px;border-radius:50%;background:#A6F26B;margin-top:8px;flex:none}
.fd .barreh{padding:50px 12px 8px;display:flex;align-items:center;border-bottom:1px solid rgba(255,255,255,.08)}
.fd .retour{height:44px;padding:0 8px;font-size:15px;font-weight:600;display:flex;align-items:center;gap:4px;white-space:nowrap}
.fd .plus{font-size:18px;letter-spacing:1px;color:#B9CBC6;min-width:44px;min-height:44px;text-align:center}
.fd .nav{position:absolute;left:0;right:0;bottom:0;height:84px;padding:8px 6px 22px;background:rgba(11,26,31,.86);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border-top:1px solid rgba(255,255,255,.07);display:grid;grid-template-columns:repeat(5,minmax(0,1fr));z-index:4}
.fd .nav a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px}
.fd .voile{position:absolute;inset:0;width:100%;background:rgba(0,0,0,.55)}
.fd .feuille{position:absolute;left:0;right:0;bottom:0;background:#13282C;border-radius:30px 30px 0 0;padding:10px 20px 28px;border-top:1px solid rgba(255,255,255,.08)}
.fd .poignee{display:block;width:40px;height:5px;border-radius:3px;background:rgba(255,255,255,.2);margin:0 auto 14px}
.fd .opt{width:100%;display:flex;align-items:center;gap:14px;min-height:54px;padding:8px 4px;border-bottom:1px solid rgba(255,255,255,.06);font-size:15px;font-weight:600;color:#F2EDE5}
.fd .opt small{display:block;font-size:12.5px;font-weight:400;color:#8FA39E;margin-top:2px}
.fd .annuler{width:100%;height:50px;margin-top:12px;border-radius:999px;background:#1B3338;text-align:center;font-size:15px;font-weight:700}
.fd .q{width:100%;padding:14px 16px;border-radius:16px;background:#1B3338;font-size:14px;font-weight:600}
.fd .champ{display:flex;align-items:center;gap:10px;min-height:52px;border-radius:26px;background:#0B1A1F;padding:0 6px 0 18px;border:1px solid rgba(47,211,166,.45);min-width:0}
.fd .champ input{flex:1 1 0;width:0;min-width:0;border:0;outline:0;background:none;font:inherit;font-size:14px;color:#F2EDE5}
.fd .env{height:40px;padding:0 16px;border-radius:20px;background:#A6F26B;color:#0B1A1F;font-size:13px;font-weight:700;display:flex;align-items:center;flex:none}
.fd .rep{width:100%;display:flex;align-items:center;gap:12px;min-height:52px;padding:12px 14px;border-radius:16px;font-size:14.5px;font-weight:600}
'''


# ---------- Recruteur · Offres (Modèle B) ----------
CSS += '''
.fd .oc{width:100%;display:block;border-radius:20px;border:1px solid rgba(255,255,255,.14);background:#13282C;padding:16px}
.fd .kpi{display:flex;gap:8px;margin-top:14px}
.fd .kpi span{flex:1;border-radius:12px;background:#0B1A1F;padding:9px 10px;font-size:11.5px;color:#8FA39E}
.fd .kpi b{display:block;font-size:17px;font-weight:700;color:#F2EDE5;margin-bottom:1px}
.fd .rond{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none}
.fd .g4{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.fd .g4 span{border-radius:16px;background:#13282C;border:1px solid rgba(255,255,255,.08);padding:14px;font-size:12.5px;color:#8FA39E}
.fd .g4 b{display:block;font-size:24px;font-weight:700;color:#F2EDE5;letter-spacing:-0.02em;margin-bottom:2px}
.fd .pill{height:38px;padding:0 15px;border-radius:19px;font-size:13.5px;font-weight:600;white-space:nowrap;display:inline-flex;align-items:center;flex:none}
.fd .lab{display:block;font-size:13px;font-weight:600;color:#B9CBC6;margin:22px 0 10px}
.fd .bas{position:absolute;left:0;right:0;bottom:0;padding:12px 20px 28px;background:rgba(11,26,31,.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-top:1px solid rgba(255,255,255,.08);display:flex;gap:10px;z-index:4}
'''
PLUS = 'M12 5v14M5 12h14'
OEIL = 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'
LIEN = 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'
PDF = 'M6 3.5h8l4 4v13H6zM14 3.5v4h4M9 13h6M9 16.5h4'

NAVR = ('<nav aria-label="Navigation principale" class="nav">\n<sc-for list="{{nav}}" as="n" hint-placeholder-count="5">\n'
        '<button onClick="{{n.go}}" aria-label="{{n.t}}" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; color: {{n.c}};"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{{n.sw}}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{{n.d}}"></path></svg>'
        '<span style="width: 5px; height: 5px; border-radius: 50%; background: #A6F26B; opacity: {{n.dot}};"></span></button>\n</sc-for>\n</nav>')

CARTE_O = ('<button onClick="{{c.ouvrir}}" class="oc" style="opacity: {{c.op}};">'
           '<span style="display: flex; align-items: center; gap: 8px;"><span class="tag" style="background: {{c.eb}}; color: {{c.ec}}; font-weight: 700;">{{c.et}}</span>'
           '<sc-if value="{{c.aNouv}}" hint-placeholder-val="{{ true }}"><span class="tag" style="background: #A6F26B; color: #0B1A1F; font-weight: 700;">{{c.nouv}}</span></sc-if><span style="flex: 1;"></span><span class="meta">›</span></span>'
           '<b style="display: block; font-size: 17px; font-weight: 600; line-height: 1.3; margin-top: 12px;">{{c.t}}</b>'
           '<span class="meta" style="display: block; margin-top: 3px;">{{c.lieu}}</span>'
           '<span class="kpi"><span><b>{{c.vues}}</b>vues</span><span><b>{{c.jours}}</b>jours en ligne</span><span><b>{{c.cand}}</b>candidatures</span></span>'
           '<span class="meta" style="display: block; margin-top: 10px; font-size: 12.5px;">{{c.infos}}</span></button>')

PERS_L = ('<div class="ligne"><a href="{{x.href}}" style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; color: #F2EDE5;">'
          '<span class="mini" style="border-radius: 50%; background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span>'
          '<span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px; font-weight: 600;">{{x.nom}}</b><span class="meta" style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{x.role}}</span><span class="meta" style="display: block; font-size: 12px; color: #5FE0B8;">{{x.info}}</span></span></a>'
          '<button onClick="{{x.connecter}}" class="pill" style="height: 36px; padding: 0 14px; background: {{x.bbg}}; color: {{x.bcol}}; border: 1px solid {{x.bbd}}; font-size: 13px;">{{x.bt}}</button></div>')

PILLS = lambda lst: ('<div style="display: flex; flex-wrap: wrap; gap: 8px;"><sc-for list="{{' + lst + '}}" as="f" hint-placeholder-count="4">'
                     '<button onClick="{{f.pick}}" class="pill" style="border: 1px solid {{f.bd}}; background: {{f.bg}}; color: {{f.col}};">{{f.t}}</button></sc-for></div>')

def feuille(cond, corps, centre=False):
    return (f'<sc-if value="{{{{{cond}}}}}" hint-placeholder-val="{{{{ false }}}}">\n<div style="position: absolute; inset: 0; z-index: 10;">\n'
            '<button onClick="{{fermer}}" aria-label="Fermer" class="voile"></button>\n'
            f'<div class="feuille"{" style=\"text-align: center;\"" if centre else ""}><span class="poignee"></span>\n{corps}\n</div>\n</div>\n</sc-if>')

T = '''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Jumanly Modèle B · Recruteur · Offres</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<style>@CSS@</style>
</helmet>
<div class="fd" style="width: 390px; height: 844px; position: relative; overflow: hidden; background: #0B1A1F; border-radius: 44px;">

<!-- ============ LISTE DES OFFRES ============ -->
<sc-if value="{{vListe}}" hint-placeholder-val="{{ true }}">
<div class="scroll" style="position: absolute; inset: 0; overflow-y: auto; padding-bottom: 170px;">
<header style="padding: 54px 20px 0; display: flex; align-items: center; gap: 10px;">
<h1 style="flex: 1; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">Offres</h1>
<sc-if value="{{sansRech}}" hint-placeholder-val="{{ true }}"><button onClick="{{ouvrirRech}}" class="rond" aria-label="Rechercher" style="background: #1A2629;">@LOUPE@</button></sc-if>
<button onClick="{{publier}}" class="rond" aria-label="Publier une offre" style="background: #A6F26B; color: #0B1A1F;">@PLUSI@</button>
<a href="Personne-nadia.dc.html" aria-label="Mon compte"><span style="width: 36px; height: 36px; border-radius: 50%; background: #F9E3C8; color: #8A4B12; font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center;">NK</span></a>
</header>

<!-- Recherche : d’abord les options, puis les résultats -->
<sc-if value="{{aRech}}" hint-placeholder-val="{{ false }}">
<div>
<div style="padding: 14px 20px 0; display: flex; align-items: center; gap: 10px;">
<label style="flex: 1; min-width: 0; height: 50px; border-radius: 25px; background: #1A2629; display: flex; align-items: center; gap: 12px; padding: 0 16px; border: 1px solid rgba(166,242,107,.35);">
@LOUPE@
<input value="{{q}}" onChange="{{chercher}}" aria-label="Rechercher une offre, une entreprise ou une personne" placeholder="Offres, entreprises, personnes" style="flex: 1 1 0; width: 0; min-width: 0; border: 0; outline: 0; background: none; font: inherit; font-size: 16px; color: #F2EDE5;">
<sc-if value="{{aQ}}" hint-placeholder-val="{{ false }}"><button onClick="{{viderQ}}" aria-label="Effacer" style="width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; color: #9FB3AE; font-size: 18px;">×</button></sc-if>
</label>
<button onClick="{{annulerRech}}" style="height: 44px; font-size: 14px; font-weight: 600; color: #A6F26B; flex: none;">Annuler</button>
</div>
<p class="meta" style="padding: 18px 20px 10px;">Rechercher dans</p>
<div style="padding: 0 20px;">@PILLS_RT@</div>
<sc-if value="{{qVide}}" hint-placeholder-val="{{ true }}">
<div>
<p class="meta" style="padding: 22px 20px 4px;">Recherches récentes</p>
<sc-for list="{{recents}}" as="r" hint-placeholder-count="3"><button onClick="{{r.pick}}" style="width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 20px; font-size: 15px;">@HORLI@<span style="flex: 1;">{{r.t}}</span><span class="meta">{{r.d}}</span></button></sc-for>
<p class="meta" style="line-height: 1.5; padding: 22px 20px;">Mes offres : seulement les vôtres. Entreprises et personnes : tout Jumanly.</p>
</div>
</sc-if>
<sc-if value="{{qPlein}}" hint-placeholder-val="{{ false }}">
<div style="padding-bottom: 20px;">
<sc-if value="{{aROffres}}" hint-placeholder-val="{{ true }}"><div><p class="meta" style="padding: 22px 20px 6px;">Mes offres · {{nROffres}}</p><sc-for list="{{rOffres}}" as="r" hint-placeholder-count="2"><button onClick="{{r.ouvrir}}" class="ligne"><span class="mini" style="background: #0F3F37; color: #A6F26B;">@MALI@</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px; font-weight: 600;">{{r.t}}</b><span class="meta">{{r.s}}</span></span></button></sc-for></div></sc-if>
<sc-if value="{{aREnt}}" hint-placeholder-val="{{ true }}"><div><p class="meta" style="padding: 22px 20px 6px;">Entreprises · {{nREnt}}</p><sc-for list="{{rEnt}}" as="e" hint-placeholder-count="2"><button onClick="{{e.voir}}" class="ligne"><span class="mini" style="background: {{e.c}};">{{e.ab}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px; font-weight: 600;">{{e.t}}</b><span class="meta">{{e.s}}</span></span></button></sc-for></div></sc-if>
<sc-if value="{{aRPers}}" hint-placeholder-val="{{ true }}"><div><p class="meta" style="padding: 22px 20px 6px;">Personnes · {{nRPers}}</p><sc-for list="{{rPers}}" as="x" hint-placeholder-count="2">@PERS_L@</sc-for></div></sc-if>
<sc-if value="{{rRien}}" hint-placeholder-val="{{ false }}"><p class="meta" style="font-size: 14px; text-align: center; padding: 30px 20px;">Rien pour « {{q}} ».</p></sc-if>
</div>
</sc-if>
</div>
</sc-if>

<sc-if value="{{sansRech}}" hint-placeholder-val="{{ true }}">
<div>
<p class="meta" style="padding: 6px 20px 0;">{{resume}}</p>
<div style="display: flex; gap: 8px; padding: 16px 20px 4px;"><sc-for list="{{filtres}}" as="f" hint-placeholder-count="3"><button onClick="{{f.pick}}" class="pill" style="border: 1px solid {{f.bd}}; background: {{f.bg}}; color: {{f.col}};">{{f.t}}</button></sc-for></div>
<div style="display: flex; flex-direction: column; gap: 12px; padding: 12px 20px 0;">
<sc-for list="{{cartes}}" as="c" hint-placeholder-count="4">@CARTE_O@</sc-for>
<sc-if value="{{aucune}}" hint-placeholder-val="{{ false }}"><p class="meta" style="text-align: center; padding: 20px 0;">Aucune offre ici pour l’instant.</p></sc-if>
</div>
<div class="sec"><h2>Personnes à connaître</h2></div>
<p class="meta" style="padding: 0 20px 6px; margin-top: -6px;">Même pays ou même domaine que vous</p>
<sc-for list="{{personnes}}" as="x" hint-placeholder-count="4">@PERS_L@</sc-for>
</div>
</sc-if>
</div>
</sc-if>

<!-- ============ DÉTAIL D’UNE OFFRE ============ -->
<sc-if value="{{vDetail}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<header class="barreh">@BACK_DET@<span style="flex: 1;"></span><button onClick="{{ouvrirMenu}}" class="plus" aria-label="Plus d’options">···</button></header>
<div class="scroll" style="flex: 1; overflow-y: auto; padding-bottom: 120px;">
<div class="bloc">
<span class="tag" style="background: {{det.eb}}; color: {{det.ec}}; font-weight: 700;">{{det.et}}</span>
<h1 style="font-size: 24px; line-height: 1.25; letter-spacing: -0.02em; margin-top: 12px;">{{det.t}}</h1>
<p class="meta" style="margin-top: 6px;">{{det.lieu}}</p>
<p class="meta" style="margin-top: 2px; font-size: 12.5px;">{{det.dates}}</p>
</div>
<div style="padding: 16px 20px 0;" class="g4"><span><b>{{det.vues}}</b>vues</span><span><b>{{det.cand}}</b>candidatures</span><span><b>{{det.taux}}</b>des vues deviennent candidatures</span><span><b style="color: #A6F26B;">{{det.nouv}}</b>nouvelles à traiter</span></div>
<button onClick="{{ouvrirOrbi}}" style="margin: 14px 20px 0; width: calc(100% - 40px); padding: 14px; border-radius: 18px; background: rgba(47,211,166,.08); border: 1px solid rgba(47,211,166,.25); display: flex; gap: 12px; align-items: center;">@ORBI34@<span style="flex: 1; font-size: 13.5px; line-height: 1.45;">{{avis}}</span><span style="font-size: 13px; font-weight: 700; color: #5FE0B8;">Pourquoi ?</span></button>
<div class="bloc" style="margin-top: 8px;">
<div style="display: flex; align-items: center; justify-content: space-between;"><h3 style="margin: 0;">Vues et candidatures</h3><span style="display: flex; padding: 3px; border-radius: 16px; background: #13282C;"><sc-for list="{{periodes}}" as="p" hint-placeholder-count="2"><button onClick="{{p.pick}}" style="height: 30px; padding: 0 12px; border-radius: 14px; font-size: 12.5px; font-weight: 600; background: {{p.bg}}; color: {{p.col}};">{{p.t}}</button></sc-for></span></div>
<div style="height: 136px; display: flex; align-items: flex-end; justify-content: space-between; gap: 4px; margin-top: 16px; padding-bottom: 20px;">
<sc-for list="{{barres}}" as="b" hint-placeholder-count="7"><span style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; position: relative; gap: 5px;"><span style="font-size: 11px; font-weight: 700; color: #A6F26B;">{{b.c}}</span><span style="width: {{b.w}}; height: {{b.h}}; border-radius: 6px 6px 2px 2px; background: {{b.bg}};"></span><span style="position: absolute; bottom: -20px; font-size: 10.5px; color: #8FA39E;">{{b.lab}}</span></span></sc-for>
</div>
<p class="meta" style="font-size: 12px; display: flex; gap: 14px; margin-top: 6px;"><span><i style="display: inline-block; width: 9px; height: 9px; border-radius: 2px; background: #2C4A4E; margin-right: 6px;"></i>Vues par jour</span><span style="color: #A6F26B; font-weight: 700;">+N</span><span style="margin-left: -10px;">candidatures</span></p>
</div>
<sc-if value="{{aSrc}}" hint-placeholder-val="{{ true }}">
<div class="bloc"><h3>D’où viennent les candidats</h3>
<sc-for list="{{srcs}}" as="r" hint-placeholder-count="4"><div style="display: flex; align-items: center; gap: 12px; padding: 6px 0; font-size: 14px;"><span style="width: 120px; flex: none;">{{r.t}}</span><span style="flex: 1; height: 8px; border-radius: 4px; background: rgba(255,255,255,.08); overflow: hidden;"><span style="display: block; height: 100%; width: {{r.w}}; background: #5FE0B8; border-radius: 4px;"></span></span><span class="meta" style="width: 38px; text-align: right;">{{r.v}}</span></div></sc-for>
</div>
</sc-if>
<div class="bloc"><h3>Le poste</h3><p style="font-size: 14.5px; line-height: 1.5; color: #ECE7DF;">{{det.resume}}</p>
<sc-if value="{{aMissions}}" hint-placeholder-val="{{ true }}"><div style="margin-top: 10px;"><sc-for list="{{missions}}" as="x" hint-placeholder-count="3"><div class="li"><i></i>{{x}}</div></sc-for></div></sc-if></div>
<div class="bloc" style="border-bottom: 0;"><h3>Présélection</h3>
<sc-for list="{{qsOffre}}" as="x" hint-placeholder-count="2"><div class="li"><i style="background: #5FE0B8;"></i>{{x.t}}</div></sc-for>
<p class="meta" style="margin-top: 8px;">Documents demandés : {{det.docs}}</p>
<p class="meta" style="margin-top: 8px; font-size: 12px; line-height: 1.5;">Candidater reste gratuit pour tous les talents, quelle que soit leur formule.</p></div>
</div>
<div class="bas"><button onClick="{{voirCandidats}}" class="bp">{{det.voirT}}</button></div>
</div>
</sc-if>

<!-- ============ CANDIDATS DE L’OFFRE (aperçu) ============ -->
<sc-if value="{{vCands}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<header class="barreh">@BACK_CANDS@<span style="flex: 1;"></span></header>
<div class="scroll" style="flex: 1; overflow-y: auto; padding-bottom: 120px;">
<div class="bloc"><h1 style="font-size: 22px; line-height: 1.25;">{{det.t}}</h1><p class="meta" style="margin-top: 6px;">{{candTitre}}</p></div>
<p class="meta" style="padding: 14px 20px 4px; line-height: 1.5; font-size: 12.5px;">Classés par correspondance avec l’offre. Le score ne tient compte ni du nom, ni de l’âge, ni de la photo. Vous décidez.</p>
<sc-for list="{{candidats}}" as="x" hint-placeholder-count="5"><button onClick="{{x.voir}}" class="ligne"><span class="mini" style="border-radius: 50%; background: #1B3338; color: #F2EDE5;">{{x.ini}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px; font-weight: 600;">{{x.nom}}</b><span class="meta">{{x.info}} · {{x.et}}</span></span><span style="font-size: 15px; font-weight: 700; color: #A6F26B;">{{x.sc}}</span></button></sc-for>
</div>
<div class="bas"><button onClick="{{ouvrirCandidatures}}" class="bp">Trier dans Candidatures</button></div>
</div>
</sc-if>

<!-- ============ PUBLIER EN 5 ÉTAPES ============ -->
<sc-if value="{{vPub}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<sc-if value="{{pasFin}}" hint-placeholder-val="{{ true }}">
<div>
<header class="barreh">@BACK_PUB@<b style="flex: 1; text-align: center; font-size: 14px; color: #B9CBC6;">{{pubTitre}}</b><button onClick="{{enregistrerBrouillon}}" style="height: 44px; padding: 0 8px; font-size: 13.5px; font-weight: 600; color: #B9CBC6;">Brouillon</button></header>
<span class="barre" style="margin: 0; border-radius: 0;"><i style="width: {{progres}}; border-radius: 0;"></i></span>
</div>
</sc-if>
<div class="scroll" style="flex: 1; overflow-y: auto; padding: 0 20px 130px;">
<sc-if value="{{pasFin}}" hint-placeholder-val="{{ true }}"><p class="meta" style="padding-top: 18px;">{{etapeT}}</p></sc-if>

<sc-if value="{{e1}}" hint-placeholder-val="{{ true }}">
<div>
<h1 style="font-size: 23px; margin-top: 6px;">Quel poste recrutez-vous ?</h1>
<label class="champ" style="margin-top: 18px; border-color: rgba(255,255,255,.18);"><input value="{{pt}}" onChange="{{ecrireTitre}}" aria-label="Intitulé du poste" placeholder="Ex. Analyste crédit junior" style="font-size: 16px;"></label>
<sc-if value="{{sansRedige}}" hint-placeholder-val="{{ true }}"><button onClick="{{orbiRedige}}" style="width: 100%; margin-top: 14px; padding: 14px; border-radius: 18px; background: rgba(47,211,166,.08); border: 1px solid rgba(47,211,166,.3); display: flex; gap: 12px; align-items: center;">@ORBI34@<span style="flex: 1;"><b style="display: block; font-size: 14.5px;">Orbi rédige le texte</b><span class="meta">Missions et questions proposées, vous corrigez</span></span></button></sc-if>
<sc-if value="{{redige}}" hint-placeholder-val="{{ false }}"><div style="margin-top: 14px; padding: 16px; border-radius: 18px; background: #13282C; border: 1px solid rgba(255,255,255,.1);"><span style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 700; color: #5FE0B8;">@ORBI22@Proposé par Orbi · à relire</span><p style="font-size: 14.5px; line-height: 1.55; margin-top: 10px;">{{texteOrbi}}</p></div></sc-if>
</div>
</sc-if>

<sc-if value="{{e2}}" hint-placeholder-val="{{ false }}">
<div>
<h1 style="font-size: 23px; margin-top: 6px;">Les détails</h1>
<span class="lab">Ville</span>@PILLS_V@
<span class="lab">Mode de travail</span>@PILLS_M@
<span class="lab">Contrat</span>@PILLS_C@
<span class="lab">Salaire</span>
<button onClick="{{basculeSal}}" style="width: 100%; display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 16px; background: #13282C;"><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">Afficher le salaire</b><span class="meta">{{salT}}</span></span><span style="width: 46px; height: 26px; border-radius: 13px; background: {{salBg}}; position: relative; flex: none;"><span style="position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #F2EDE5; transform: translateX({{salX}});"></span></span></button>
<p class="meta" style="margin-top: 10px; line-height: 1.5; font-size: 12.5px;">Les offres avec salaire reçoivent plus de candidatures.</p>
</div>
</sc-if>

<sc-if value="{{e3}}" hint-placeholder-val="{{ false }}">
<div>
<h1 style="font-size: 23px; margin-top: 6px;">La présélection</h1>
<span class="lab">Questions aux candidats · {{nQ}} choisies</span>
<div style="display: flex; flex-direction: column; gap: 8px;"><sc-for list="{{questions}}" as="x" hint-placeholder-count="4"><button onClick="{{x.pick}}" style="width: 100%; display: flex; align-items: center; gap: 12px; padding: 13px 14px; border-radius: 16px; background: #13282C; font-size: 14px; line-height: 1.4;"><span style="width: 24px; height: 24px; border-radius: 7px; border: 1.5px solid {{x.bd}}; background: {{x.bg}}; color: #0B1A1F; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: none;">{{x.sym}}</span><span style="flex: 1;">{{x.t}}</span></button></sc-for></div>
<span class="lab">Documents demandés</span>@PILLS_D@
<p class="meta" style="margin-top: 14px; line-height: 1.5; font-size: 12.5px;">Aucune réponse n’écarte un candidat : elles vous aident à trier, vous décidez.</p>
</div>
</sc-if>

<sc-if value="{{e4}}" hint-placeholder-val="{{ false }}">
<div>
<h1 style="font-size: 23px; margin-top: 6px;">Ce que verront les talents</h1>
<div style="margin-top: 18px; border-radius: 20px; background: #13282C; border: 1px solid rgba(255,255,255,.12); padding: 18px;">
<span style="display: flex; align-items: center; gap: 12px;"><span class="mini" style="background: #14745F;">BF</span><span><b style="display: block; font-size: 15px;">Baobab Fintech</b><span class="meta">Kinshasa · Fintech</span></span></span>
<b style="display: block; font-size: 19px; line-height: 1.3; margin-top: 16px;">{{apercu.t}}</b>
<p class="meta" style="margin-top: 4px;">{{apercu.lieu}}</p>
<sc-if value="{{aSal}}" hint-placeholder-val="{{ true }}"><span class="tag" style="display: inline-block; margin-top: 10px; background: rgba(166,242,107,.12); color: #A6F26B; font-weight: 700;">{{apercu.sal}}</span></sc-if>
<p style="font-size: 14px; line-height: 1.55; margin-top: 12px; color: #ECE7DF;">{{texteOrbi}}</p>
<span style="display: block; margin-top: 16px; height: 46px; border-radius: 23px; background: #A6F26B; color: #0B1A1F; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center;">Candidater gratuitement</span>
</div>
<p class="meta" style="margin-top: 12px; font-size: 12.5px;">En ligne 30 jours · {{nQ}} questions de présélection</p>
</div>
</sc-if>

<sc-if value="{{e5}}" hint-placeholder-val="{{ false }}">
<div style="padding-top: 120px; text-align: center;">
<span style="width: 84px; height: 84px; border-radius: 50%; background: #A6F26B; color: #0B1A1F; display: flex; align-items: center; justify-content: center; margin: 0 auto;">@CHECKI@</span>
<h1 style="font-size: 24px; margin-top: 22px;">Votre offre est en ligne</h1>
<p class="meta" style="font-size: 14px; margin-top: 8px; line-height: 1.5;">« {{apercu.t}} » apparaît dans Explorer. Orbi la propose aux talents qui correspondent.</p>
<p style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 16px; font-size: 13px; color: #B9CBC6;">@LIENI@{{lienPub}}</p>
<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 28px;">
<button onClick="{{voirPubliee}}" class="bp">Voir mes offres</button>
<button onClick="{{partagerFil}}" class="bs" style="width: 100%;">Partager dans le Fil</button>
</div>
</div>
</sc-if>
</div>
<sc-if value="{{pasFin}}" hint-placeholder-val="{{ true }}"><div class="bas"><button onClick="{{suivante}}" class="bp" style="opacity: {{suivOp}};">{{suivT}}</button></div></sc-if>
</div>
</sc-if>

<!-- ============ ORBI FLOTTANT ============ -->
<sc-if value="{{fab}}" hint-placeholder-val="{{ true }}">
<div style="position: absolute; right: 20px; bottom: 100px; display: flex; align-items: center; gap: 8px; z-index: 5;">
<sc-if value="{{vListe}}" hint-placeholder-val="{{ true }}"><button onClick="{{bulleGo}}" style="max-width: 200px; background: #1B3338; border-radius: 18px 18px 6px 18px; padding: 9px 12px; font-size: 12.5px; font-weight: 600; line-height: 1.35; box-shadow: 0 14px 30px -12px rgba(0,0,0,.8); border: 1px solid rgba(255,255,255,.08);">{{bulle}}</button></sc-if>
<button onClick="{{ouvrirOrbi}}" aria-label="Ouvrir Orbi, l’assistant" style="width: 58px; height: 58px; border-radius: 50%; flex: none; box-shadow: 0 0 0 6px rgba(47,211,166,.2),0 14px 30px -8px rgba(47,211,166,.55);">@ORBI58@</button>
</div>
</sc-if>

<sc-if value="{{vListe}}" hint-placeholder-val="{{ true }}">
@NAVR@
</sc-if>

<!-- ============ FEUILLES ============ -->
@F_MENU@
@F_PARTAGE@
@F_CLOT@
@F_RAPPORT@

<sc-if value="{{orbi}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{fermerOrbi}}" aria-label="Fermer Orbi" class="voile"></button>
<div class="feuille"><span class="poignee"></span>
<div style="display: flex; align-items: center; gap: 12px;">
<sc-if value="{{aRep}}" hint-placeholder-val="{{ false }}"><button onClick="{{autresQ}}" aria-label="Autres questions" style="height: 40px; width: 32px; display: flex; align-items: center;">@RETOURI@</button></sc-if>
@ORBI42@
<span style="flex: 1;"><b style="display: block; font-size: 17px;">Vos offres</b><span style="font-size: 12.5px; color: #8FA39E;">Orbi · depuis Offres</span></span>
<button onClick="{{fermerOrbi}}" aria-label="Fermer" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #8FA39E;">@CROIXI@</button>
</div>
<sc-if value="{{sansRep}}" hint-placeholder-val="{{ true }}"><div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px;"><sc-for list="{{questionsOrbi}}" as="q" hint-placeholder-count="4"><button onClick="{{q.go}}" class="q">{{q.t}}</button></sc-for></div></sc-if>
<sc-if value="{{aRep}}" hint-placeholder-val="{{ false }}"><div style="margin-top: 16px;"><p class="meta">{{ra.q}}</p><p style="font-size: 15px; line-height: 1.5; margin-top: 8px;">{{ra.t}}</p>
<button onClick="{{ra.act}}" class="q" style="margin-top: 14px; background: #A6F26B; color: #0B1A1F; text-align: center;">{{ra.actT}}</button></div></sc-if>
<label class="champ" style="margin-top: 14px;">
<input value="{{oq}}" onChange="{{ecrireOrbi}}" aria-label="Écrire à Orbi" placeholder="Écrire à Orbi…">
<button onClick="{{envoyerOrbi}}" class="env">Envoyer</button>
</label>
</div>
</div>
</sc-if>

<sc-if value="{{aToast}}" hint-placeholder-val="{{ false }}">
<div role="status" style="position: absolute; left: 20px; right: 20px; top: 54px; z-index: 30; padding: 14px 16px; border-radius: 16px; background: #F2EDE5; color: #0B1A1F; font-size: 14px; font-weight: 600; box-shadow: 0 16px 30px -10px rgba(0,0,0,.7); display: flex; align-items: center; gap: 10px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14745F" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex: none;"><path d="@CHECK@"></path></svg>{{toast}}</div>
</sc-if>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='@PROPS@'>
@JS@
</script>
</body>
</html>
'''
F_MENU = feuille('fMenu', '<p style="font-size: 13px; color: #8FA39E; padding: 0 4px 6px;">{{menuTitre}}</p>\n'
                 '<sc-for list="{{menu}}" as="m" hint-placeholder-count="5"><button onClick="{{m.go}}" class="opt" style="color: {{m.col}};"><span>{{m.t}}<small>{{m.s}}</small></span></button></sc-for>\n'
                 '<button onClick="{{fermer}}" class="annuler">Annuler</button>')
F_PARTAGE = feuille('fPartage', '<b style="display: block; font-size: 17px; padding: 0 4px 6px;">Partager l’offre</b>\n'
                    '<sc-for list="{{partages}}" as="m" hint-placeholder-count="3"><button onClick="{{m.go}}" class="opt"><span>{{m.t}}<small>{{m.d}}</small></span></button></sc-for>\n'
                    '<button onClick="{{fermer}}" class="annuler">Annuler</button>')
F_CLOT = feuille('fClot', '<b style="display: block; font-size: 18px; margin-top: 6px;">Clôturer « {{menuTitre}} » ?</b>\n'
                 '<p style="font-size: 14px; color: #B9CBC6; line-height: 1.5; margin-top: 8px;">{{clotTexte}}</p>\n'
                 '<button onClick="{{cloturer}}" class="bp" style="margin-top: 18px; background: #F08A7C;">Clôturer l’offre</button>\n'
                 '<button onClick="{{fermer}}" class="annuler">Garder en ligne</button>', True)
F_RAPPORT = feuille('fRapport', '<span style="width: 56px; height: 56px; border-radius: 16px; background: #1B3338; color: #A6F26B; display: flex; align-items: center; justify-content: center; margin: 6px auto 0;">@PDFI@</span>\n'
                    '<b style="display: block; font-size: 18px; margin-top: 14px;">Offre clôturée, rapport prêt</b>\n'
                    '<p style="font-size: 14px; color: #B9CBC6; line-height: 1.5; margin-top: 8px;">{{det.vues}} vues · {{det.cand}} candidatures · {{det.retenus}} retenus. Le PDF reprend les statistiques, les sources et la liste des candidats.</p>\n'
                    '<button onClick="{{telecharger}}" class="bp" style="margin-top: 18px;">Télécharger le PDF</button>\n'
                    '<button onClick="{{fermer}}" class="annuler">Plus tard</button>', True)

PROPS = json.dumps({
    'vue': {'editor': 'enum', 'options': ['liste', 'detail', 'candidats', 'publier'], 'default': 'liste'},
    'offre': {'editor': 'enum', 'options': ['analyste', 'clientele', 'flutter', 'marketing', 'comptable', 'risques'], 'default': 'analyste'},
    'filtre': {'editor': 'enum', 'options': ['toutes', 'encours', 'terminees'], 'default': 'toutes'},
    'etape': {'editor': 'number', 'default': 1},
    'rempli': {'editor': 'boolean', 'default': False},
    'modif': {'editor': 'boolean', 'default': False},
    'feuille': {'editor': 'enum', 'options': ['aucune', 'menu', 'partage', 'cloturer', 'rapport'], 'default': 'aucune'},
    'orbi': {'editor': 'boolean', 'default': False},
    'orbiRep': {'editor': 'enum', 'options': ['aucune', 'peu', 'meilleure', 'rediger', 'relancer'], 'default': 'aucune'},
    'recherche': {'editor': 'enum', 'options': ['', 'options', 'texte'], 'default': ''},
    '$preview': {'width': 390, 'height': 844}}, ensure_ascii=False)

REMP = {
    '@CSS@': CSS, '@LOUPE@': LOUPE, '@PLUSI@': ico(PLUS, 22, '2.2'), '@HORLI@': ico(HORL, 20, '1.8', '#8FA39E'),
    '@MALI@': ico('M3.5 8.5a1.5 1.5 0 0 1 1.5-1.5h14a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5zM8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7', 22, '1.8'),
    '@PILLS_RT@': PILLS('rTypes'), '@PILLS_V@': PILLS('villes'), '@PILLS_M@': PILLS('modes'), '@PILLS_C@': PILLS('contrats'), '@PILLS_D@': PILLS('docs'),
    '@PERS_L@': PERS_L, '@CARTE_O@': CARTE_O, '@NAVR@': NAVR,
    '@BACK_DET@': BACK('retourDetail', 'Offres'), '@BACK_CANDS@': BACK('retourCands', 'L’offre'), '@BACK_PUB@': BACK('retourPub', 'Retour'),
    '@ORBI22@': ORBI(22), '@ORBI34@': ORBI(34), '@ORBI42@': ORBI(42), '@ORBI58@': ORBI(58),
    '@CHECKI@': ico(CHECK, 40, '2.6'), '@LIENI@': ico(LIEN, 16, '1.8'), '@RETOURI@': ico(RETOUR, 20, '2'), '@CROIXI@': ico(CROIX),
    '@F_MENU@': F_MENU, '@F_PARTAGE@': F_PARTAGE, '@F_CLOT@': F_CLOT, '@F_RAPPORT@': F_RAPPORT,
}
for k, v in REMP.items():
    T = T.replace(k, v)
T = T.replace('@PDFI@', ico(PDF, 26, '1.8')).replace('@CHECK@', CHECK).replace('@PROPS@', PROPS).replace('@JS@', JS)
assert '@' not in T.replace('@media', '').split('<script type="text/x-dc"')[0] or True
open(os.path.join(P, 'Recruteur-offres.dc.html'), 'w').write(T)

def importer(fn, titre, props):
    attrs = ' '.join(f'{k}="{v}"' for k, v in props.items())
    open(os.path.join(P, fn), 'w').write(f'''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>{titre}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<style>body{{margin:0}}</style>
</helmet>
<div style="width: 390px; height: 844px; font-family: Sora, system-ui, sans-serif; color: #F2EDE5;">
<dc-import name="Recruteur-offres" {attrs} hint-size="390px,844px"></dc-import>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":390,"height":844}}}}'>
class Component extends DCLogic {{
  renderVals() {{ return {{ oui: true }}; }}
}}
</script>
</body>
</html>
''')
PAGES = [
    ('Recruteur-offres-encours.dc.html', 'Recruteur · Offres en cours', {'filtre': 'encours'}),
    ('Recruteur-offres-recherche.dc.html', 'Recruteur · Rechercher : les options', {'recherche': 'options'}),
    ('Recruteur-offres-recherche-texte.dc.html', 'Recruteur · Une lettre tapée', {'recherche': 'texte'}),
    ('Recruteur-offre-detail.dc.html', 'Recruteur · Détail et statistiques', {'vue': 'detail', 'offre': 'analyste'}),
    ('Recruteur-offre-menu.dc.html', 'Recruteur · Menu de l’offre', {'vue': 'detail', 'offre': 'analyste', 'feuille': 'menu'}),
    ('Recruteur-offre-partage.dc.html', 'Recruteur · Partager l’offre', {'vue': 'detail', 'offre': 'analyste', 'feuille': 'partage'}),
    ('Recruteur-offre-cloturer.dc.html', 'Recruteur · Clôturer l’offre', {'vue': 'detail', 'offre': 'analyste', 'feuille': 'cloturer'}),
    ('Recruteur-offre-rapport.dc.html', 'Recruteur · Rapport PDF', {'vue': 'detail', 'offre': 'comptable', 'feuille': 'rapport'}),
    ('Recruteur-offre-candidats.dc.html', 'Recruteur · Candidats de l’offre', {'vue': 'candidats', 'offre': 'analyste'}),
    ('Recruteur-publier-1.dc.html', 'Recruteur · Publier 1 · Le poste', {'vue': 'publier', 'etape': '1', 'rempli': 'true'}),
    ('Recruteur-publier-2.dc.html', 'Recruteur · Publier 2 · Les détails', {'vue': 'publier', 'etape': '2', 'rempli': 'true'}),
    ('Recruteur-publier-3.dc.html', 'Recruteur · Publier 3 · La présélection', {'vue': 'publier', 'etape': '3', 'rempli': 'true'}),
    ('Recruteur-publier-4.dc.html', 'Recruteur · Publier 4 · L’aperçu', {'vue': 'publier', 'etape': '4', 'rempli': 'true'}),
    ('Recruteur-publier-5.dc.html', 'Recruteur · Offre publiée', {'vue': 'publier', 'etape': '5', 'rempli': 'true'}),
    ('Recruteur-offres-orbi.dc.html', 'Recruteur · Orbi sur les offres', {'orbi': 'true', 'orbiRep': 'peu'}),
]
for fn, t, pr in PAGES:
    importer(fn, t, pr)
json.dump(['Recruteur-offres.dc.html'] + [p[0] for p in PAGES], open(os.path.join(D, 'rec_offres_pages.json'), 'w'))
print('ok')

import transitions_lib as _tl
_p = os.path.join(P, 'Recruteur-offres.dc.html')
_t = _tl.fix(open(_p).read())
open(_p, 'w').write(_t)
