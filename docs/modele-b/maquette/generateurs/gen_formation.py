# Génère canvas/project/Formation.dc.html et ses artboards d’étape.
import os, json
D = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(D, 'canvas/project')
JS = open(os.path.join(D, 'formation_logic.js')).read()

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

def couv(k, h, carre, fs):
    # couverture d’un cours : couleur du cours, cercles, carré blanc avec l’abréviation
    return (f'<div style="height: {h}px; position: relative; background: {{{{{k}.c}}}}; overflow: hidden; display: flex; align-items: center; justify-content: center;">'
            f'<svg viewBox="0 0 272 126" preserveAspectRatio="xMidYMid slice" style="position: absolute; inset: 0; width: 100%; height: 100%;" aria-hidden="true"><g fill="none" stroke="#FFFFFF" stroke-opacity=".2" stroke-width="22"><circle cx="20" cy="63" r="62"></circle><circle cx="252" cy="63" r="62"></circle></g></svg>'
            f'<span style="position: relative; width: {carre}px; height: {carre}px; border-radius: {carre*0.28:.0f}px; background: #FFFFFF; color: {{{{{k}.c}}}}; font-size: {fs}px; font-weight: 700; display: flex; align-items: center; justify-content: center; letter-spacing: -0.02em;">{{{{{k}.ab}}}}</span></div>')

CARTE = ('<button onClick="{{c.ouvrir}}" class="carte">' + couv('c', 118, 80, 26) +
         '<div style="padding: 14px 16px 16px;"><b style="display: block; font-size: 16px; font-weight: 600; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{c.t}}</b>'
         '<span style="display: block; margin-top: 4px; font-size: 13px; color: #B9CBC6;">{{c.n}} leçons · {{c.duree}}</span>'
         '<span style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px;"><span class="tag">{{c.niveau}}</span><span class="tag" style="background: {{c.pbg}}; color: {{c.pcol}}; font-weight: 700;">{{c.prix}}</span></span></div></button>')
LIGNE = ('<button onClick="{{c.ouvrir}}" class="ligne"><span class="mini" style="background: {{c.c}};">{{c.ab}}</span>'
         '<span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{c.t}}</b>'
         '<span class="meta">{{c.sous}}</span>'
         '<sc-if value="{{c.aBarre}}" hint-placeholder-val="{{ false }}"><span class="barre"><i style="width: {{c.pct}};"></i></span></sc-if></span>'
         '<span class="meta" style="color: {{c.etatCol}}; font-weight: 600;">{{c.etat}}</span></button>')

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

NAV = ('<nav aria-label="Navigation principale" class="nav">\n<sc-for list="{{nav}}" as="n" hint-placeholder-count="5">\n'
       '<a href="{{n.href}}" aria-label="{{n.t}}" style="color: {{n.c}};"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{{n.sw}}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{{n.d}}"></path></svg>'
       '<span style="width: 5px; height: 5px; border-radius: 50%; background: #A6F26B; opacity: {{n.dot}};"></span></a>\n</sc-for>\n</nav>')

HTML = f'''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Jumanly Modèle B · Formation</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<style>{CSS}</style>
</helmet>
<div class="fd" style="width: 390px; height: 844px; position: relative; overflow: hidden; background: #0B1A1F; border-radius: 44px;">

<!-- ============ ACCUEIL ============ -->
<sc-if value="{{{{vAccueil}}}}" hint-placeholder-val="{{{{ true }}}}">
<div class="scroll" style="position: absolute; inset: 0; overflow-y: auto; padding-bottom: 170px;">
<header style="padding: 54px 20px 0; display: flex; align-items: center; gap: 12px;">
<h1 style="flex: 1; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">Formation</h1>
<a href="Carriere.dc.html" aria-label="Ma carrière"><span style="width: 36px; height: 36px; border-radius: 50%; background: #A6F26B; color: #0B1A1F; font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center;">GM</span></a>
</header>

<div style="padding: 14px 20px 0; display: flex; align-items: center; gap: 10px;">
<label style="flex: 1; min-width: 0; height: 50px; border-radius: 25px; background: #1A2629; display: flex; align-items: center; gap: 12px; padding: 0 16px;">
{LOUPE}
<input value="{{{{fq}}}}" onChange="{{{{chercher}}}}" onFocus="{{{{focusRech}}}}" aria-label="Rechercher un cours, une leçon ou une attestation" placeholder="Cours, compétences, attestations" style="flex: 1 1 0; width: 0; min-width: 0; border: 0; outline: 0; background: none; font: inherit; font-size: 16px; color: #F2EDE5;">
<sc-if value="{{{{aFq}}}}" hint-placeholder-val="{{{{ false }}}}"><button onClick="{{{{viderFq}}}}" aria-label="Effacer" style="width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; color: #9FB3AE; font-size: 18px;">×</button></sc-if>
</label>
<sc-if value="{{{{aRech}}}}" hint-placeholder-val="{{{{ false }}}}"><button onClick="{{{{annulerRech}}}}" style="height: 44px; font-size: 14px; font-weight: 600; color: #A6F26B; flex: none;">Annuler</button></sc-if>
</div>

<!-- Recherche : d’abord les options, puis les résultats -->
<sc-if value="{{{{aRech}}}}" hint-placeholder-val="{{{{ false }}}}">
<div>
<p class="meta" style="padding: 18px 20px 10px;">Rechercher dans</p>
<div style="display: flex; flex-wrap: wrap; gap: 8px; padding: 0 20px;"><sc-for list="{{{{fTypes}}}}" as="f" hint-placeholder-count="5"><button onClick="{{{{f.pick}}}}" class="chip" style="height: 38px; border: 1px solid {{{{f.bd}}}}; background: {{{{f.bg}}}}; color: {{{{f.col}}}}; font-size: 13.5px; font-weight: 600;">{{{{f.t}}}}</button></sc-for></div>
<sc-if value="{{{{fVide}}}}" hint-placeholder-val="{{{{ true }}}}">
<div>
<p class="meta" style="padding: 22px 20px 4px;">Reprendre</p>
<button onClick="{{{{reprendre}}}}" class="ligne" style="border: 0;"><span class="mini" style="background: #B07A12;">BI</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px; font-weight: 600;">{{{{enCours.t}}}}</b><span class="meta">Leçon {{{{enCours.l}}}} sur {{{{enCours.n}}}} · {{{{enCours.lt}}}}</span></span><span class="meta" style="color: #A6F26B; font-weight: 600;">Reprendre</span></button>
<p class="meta" style="padding: 14px 20px 4px;">Recherches récentes</p>
<sc-for list="{{{{recents}}}}" as="r" hint-placeholder-count="3"><button onClick="{{{{r.pick}}}}" style="width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 20px; font-size: 15px;">{ico(HORL, 20, '1.8', '#8FA39E')}<span style="flex: 1;">{{{{r.t}}}}</span><span class="meta">{{{{r.d}}}}</span></button></sc-for>
<p class="meta" style="padding: 18px 20px 10px;">Compétences demandées dans vos offres</p>
<div style="display: flex; flex-wrap: wrap; gap: 8px; padding: 0 20px;"><sc-for list="{{{{populaires}}}}" as="r" hint-placeholder-count="5"><button onClick="{{{{r.pick}}}}" style="height: 36px; padding: 0 14px; border-radius: 18px; background: #1A2629; font-size: 13.5px; white-space: nowrap;">{{{{r.t}}}}</button></sc-for></div>
<p class="meta" style="line-height: 1.5; padding: 22px 20px;">Tapez une lettre : cours, leçons et attestations s’affichent tout de suite.</p>
</div>
</sc-if>
<sc-if value="{{{{fPlein}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="padding-bottom: 20px;">
<sc-if value="{{{{rCours}}}}" hint-placeholder-val="{{{{ true }}}}"><div><p class="meta" style="padding: 22px 20px 6px;">Cours · {{{{nCours}}}}</p><sc-for list="{{{{resCours}}}}" as="c" hint-placeholder-count="2">{LIGNE}</sc-for></div></sc-if>
<sc-if value="{{{{rLecons}}}}" hint-placeholder-val="{{{{ true }}}}"><div><p class="meta" style="padding: 22px 20px 6px;">Leçons · {{{{nLecons}}}}</p><sc-for list="{{{{resLecons}}}}" as="l" hint-placeholder-count="2"><button onClick="{{{{l.ouvrir}}}}" class="ligne"><span class="mini" style="width: 40px; height: 40px; border-radius: 12px; font-size: 12px; background: {{{{l.c}}}};">{{{{l.num}}}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px; font-weight: 600;">{{{{l.t}}}}</b><span class="meta">{{{{l.cours}}}} · {{{{l.d}}}}</span></span></button></sc-for></div></sc-if>
<sc-if value="{{{{rAtt}}}}" hint-placeholder-val="{{{{ true }}}}"><div><p class="meta" style="padding: 22px 20px 6px;">Attestations · {{{{nAtt}}}}</p><sc-for list="{{{{resAtt}}}}" as="a" hint-placeholder-count="1"><button onClick="{{{{a.ouvrir}}}}" class="ligne"><span class="mini" style="background: #0F3F37; color: #A6F26B;">{ico(CHECK, 22, '2.2')}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px; font-weight: 600;">{{{{a.t}}}}</b><span class="meta">Obtenue le {{{{a.date}}}}</span></span></button></sc-for></div></sc-if>
<sc-if value="{{{{rRien}}}}" hint-placeholder-val="{{{{ false }}}}"><div style="text-align: center; padding: 30px 20px;"><p class="meta" style="font-size: 14px;">Aucun cours pour « {{{{fq}}}} ».</p><button onClick="{{{{demanderOrbi}}}}" style="margin-top: 12px; font-size: 14px; font-weight: 700; color: #5FE0B8; min-height: 40px;">Demander à Orbi de trouver un cours</button></div></sc-if>
</div>
</sc-if>
</div>
</sc-if>

<sc-if value="{{{{sansRech}}}}" hint-placeholder-val="{{{{ true }}}}">
<div>
<div role="tablist" aria-label="Choisir une rubrique" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 14px; border-bottom: 1px solid rgba(255,255,255,.08);">
<sc-for list="{{{{onglets}}}}" as="o" hint-placeholder-count="3"><button role="tab" aria-selected="{{{{o.sel}}}}" onClick="{{{{o.pick}}}}" style="height: 46px; text-align: center; font-size: 14px; font-weight: {{{{o.fw}}}}; color: {{{{o.col}}}}; position: relative;">{{{{o.t}}}}<span style="position: absolute; left: 26%; right: 26%; bottom: -1px; height: 3px; border-radius: 2px; background: #A6F26B; opacity: {{{{o.on}}}};"></span></button></sc-for>
</div>

<!-- Pour vous -->
<sc-if value="{{{{oPour}}}}" hint-placeholder-val="{{{{ true }}}}">
<div>
<button onClick="{{{{reprendre}}}}" style="display: block; width: calc(100% - 40px); margin: 18px 20px 0; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,.14); background: #13282C;">
<div style="height: 120px; position: relative; background: #B07A12; overflow: hidden;">
<svg viewBox="0 0 350 120" preserveAspectRatio="xMidYMid slice" style="position: absolute; inset: 0; width: 100%; height: 100%;" aria-hidden="true"><g fill="#FFFFFF" fill-opacity=".9"><rect x="40" y="62" width="26" height="40" rx="4"></rect><rect x="78" y="44" width="26" height="58" rx="4"></rect><rect x="116" y="54" width="26" height="48" rx="4"></rect></g><rect x="154" y="28" width="26" height="74" rx="4" fill="#A6F26B"></rect><circle cx="280" cy="60" r="30" fill="none" stroke="#FFFFFF" stroke-opacity=".9" stroke-width="10" stroke-dasharray="120 200"></circle></svg>
<span style="position: absolute; right: 16px; bottom: 14px; width: 48px; height: 48px; border-radius: 50%; background: #F2EDE5; color: #0B1A1F; display: flex; align-items: center; justify-content: center;"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"></path></svg></span>
</div>
<div style="padding: 14px 16px 16px;">
<span class="meta" style="font-weight: 600; color: #A6F26B;">Continuer</span>
<b style="display: block; font-size: 17px; margin-top: 4px;">{{{{enCours.t}}}}</b>
<span class="meta" style="display: block; margin-top: 2px;">Leçon {{{{enCours.l}}}} sur {{{{enCours.n}}}} · {{{{enCours.lt}}}} · {{{{enCours.ld}}}}</span>
<span class="barre" style="margin-top: 12px;"><i style="width: {{{{enCours.pct}}}};"></i></span>
</div>
</button>

<div style="margin: 14px 20px 0; padding: 14px; border-radius: 18px; background: rgba(47,211,166,.08); border: 1px solid rgba(47,211,166,.25); display: flex; gap: 12px; align-items: center;">
{ORBI(34)}
<span style="flex: 1; font-size: 13.5px; line-height: 1.45;">Power BI est demandé dans 4 de vos offres. Il vous reste {{{{enCours.reste}}}} leçons.</span>
<button onClick="{{{{orbiPourquoi}}}}" style="font-size: 13px; font-weight: 700; color: #5FE0B8; min-height: 36px;">Pourquoi ?</button>
</div>

<div class="sec"><h2>Pour vos offres</h2><button onClick="{{{{toutVoir}}}}">Tout voir</button></div>
<div class="hrow" style="gap: 8px; padding-bottom: 16px;"><sc-for list="{{{{chips}}}}" as="f" hint-placeholder-count="5"><button onClick="{{{{f.pick}}}}" class="chip" style="border: 1px solid {{{{f.bd}}}}; background: {{{{f.bg}}}}; color: {{{{f.col}}}};">{{{{f.t}}}}</button></sc-for></div>
<div class="hrow"><sc-for list="{{{{cartes}}}}" as="c" hint-placeholder-count="3">{CARTE}</sc-for></div>

<div class="sec"><h2>Avant votre entretien</h2></div>
<button onClick="{{{{ouvrirEntretien}}}}" class="ligne" style="border-top: 1px solid rgba(255,255,255,.07);"><span class="mini" style="background: #1E4E79;">EN</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px; font-weight: 600;">Réussir son entretien</b><span class="meta">6 leçons · 45 min · jeudi 10 h avec Nadia</span></span><span class="meta" style="color: #A6F26B; font-weight: 600;">Gratuit</span></button>
<a href="Entretien-formation.dc.html" class="ligne" style="color: #F2EDE5;">{ORBI(48)}<span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px; font-weight: 600;">Répéter avec Orbi</b><span class="meta">À l’oral ou par écrit · 5 à 15 min</span></span><span class="meta">›</span></a>
</div>
</sc-if>

<!-- Mes cours -->
<sc-if value="{{{{oMes}}}}" hint-placeholder-val="{{{{ false }}}}">
<div>
<p class="meta" style="padding: 18px 20px 4px;">En cours</p>
<sc-for list="{{{{mesEnCours}}}}" as="c" hint-placeholder-count="1">{LIGNE}</sc-for>
<p class="meta" style="padding: 22px 20px 4px;">Terminés</p>
<sc-for list="{{{{mesFinis}}}}" as="c" hint-placeholder-count="2">{LIGNE}</sc-for>
<p class="meta" style="padding: 22px 20px 4px;">Enregistrés</p>
<sc-for list="{{{{mesEnr}}}}" as="c" hint-placeholder-count="1">{LIGNE}</sc-for>
<sc-if value="{{{{sansEnr}}}}" hint-placeholder-val="{{{{ false }}}}"><p class="meta" style="padding: 10px 20px; line-height: 1.5;">Touchez « Enregistrer » sur un cours pour le garder ici.</p></sc-if>
</div>
</sc-if>

<!-- Attestations -->
<sc-if value="{{{{oAtt}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="padding: 18px 20px 0; display: flex; flex-direction: column; gap: 12px;">
<p class="meta">{{{{attTitre}}}}</p>
<sc-for list="{{{{attestations}}}}" as="a" hint-placeholder-count="2"><button onClick="{{{{a.ouvrir}}}}" style="width: 100%; border-radius: 18px; border: 1px solid rgba(166,242,107,.3); background: linear-gradient(160deg, #123B38 0%, #13282C 100%); padding: 16px; display: flex; gap: 14px; align-items: center;"><span class="mini" style="background: #A6F26B; color: #0B1A1F;">{ico(CHECK, 22, '2.4')}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px;">{{{{a.t}}}}</b><span class="meta">Obtenue le {{{{a.date}}}} · {{{{a.score}}}}</span></span><span class="meta">›</span></button></sc-for>
<p class="meta" style="line-height: 1.5; padding-top: 4px;">Chaque attestation a un lien de vérification. Elle s’ajoute seule à votre profil dans Carrière.</p>
</div>
</sc-if>
</div>
</sc-if>
</div>
</sc-if>

<!-- ============ DÉTAIL D’UN COURS ============ -->
<sc-if value="{{{{vCours}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<header class="barreh">{BACK('retour', '{{retourT}}')}<span style="flex: 1;"></span><button onClick="{{{{ouvrirMenu}}}}" class="plus" aria-label="Plus d’options">···</button></header>
<div class="scroll" style="flex: 1; overflow-y: auto; padding-bottom: 110px;">
{couv('co', 150, 96, 30)}
<div class="bloc">
<span class="meta">{{{{co.dom}}}} · Jumanly Formation</span>
<h1 style="font-size: 24px; line-height: 1.25; letter-spacing: -0.02em; margin-top: 6px;">{{{{co.t}}}}</h1>
<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px;"><span class="tag">{{{{co.n}}}} leçons</span><span class="tag">{{{{co.duree}}}}</span><span class="tag">{{{{co.niveau}}}}</span><span class="tag" style="background: {{{{co.pbg}}}}; color: {{{{co.pcol}}}}; font-weight: 700;">{{{{co.prix}}}}</span></div>
<sc-if value="{{{{co.aBarre}}}}" hint-placeholder-val="{{{{ false }}}}"><div style="margin-top: 14px;"><span class="meta">{{{{co.fait}}}} leçons sur {{{{co.n}}}} terminées</span><span class="barre"><i style="width: {{{{co.pct}}}};"></i></span></div></sc-if>
</div>
<div class="bloc"><h3>Vous saurez</h3><sc-for list="{{{{co.acquis}}}}" as="x" hint-placeholder-count="3"><div class="li"><i></i>{{{{x}}}}</div></sc-for></div>
<div class="bloc" style="padding-bottom: 6px;"><h3>Programme</h3></div>
<sc-for list="{{{{lecons}}}}" as="l" hint-placeholder-count="6"><button onClick="{{{{l.ouvrir}}}}" class="ligne"><span style="width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid {{{{l.bd}}}}; background: {{{{l.bg}}}}; color: {{{{l.col}}}}; font-size: 12.5px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: none;">{{{{l.sym}}}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 14.5px; font-weight: {{{{l.fw}}}}; color: {{{{l.tc}}}};">{{{{l.t}}}}</b><span class="meta">{{{{l.d}}}}</span></span><span class="meta" style="color: #A6F26B; font-weight: 600;">{{{{l.etat}}}}</span></button></sc-for>
<sc-if value="{{{{co.aAtt}}}}" hint-placeholder-val="{{{{ false }}}}"><button onClick="{{{{voirAttCours}}}}" class="ligne"><span class="mini" style="width: 32px; height: 32px; border-radius: 50%; background: #A6F26B; color: #0B1A1F;">{ico(CHECK, 16, '2.6')}</span><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">Attestation obtenue</b><span class="meta">Le {{{{co.date}}}}</span></span><span class="meta" style="color: #A6F26B; font-weight: 600;">Voir</span></button></sc-if>
</div>
<div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 12px 20px 28px; background: rgba(11,26,31,.92); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-top: 1px solid rgba(255,255,255,.08); display: flex; gap: 10px;">
<button onClick="{{{{enregistrer}}}}" class="bs" style="color: {{{{co.ec}}}};">{{{{co.et}}}}</button>
<button onClick="{{{{commencer}}}}" class="bp" style="flex: 1; width: auto;">{{{{co.cta}}}}</button>
</div>
</div>
</sc-if>

<!-- ============ LEÇON ============ -->
<sc-if value="{{{{vLecon}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<header class="barreh">{BACK('retourCours', '{{co.court}}')}<b style="flex: 1; text-align: center; font-size: 14px; color: #B9CBC6;">Leçon {{{{le.num}}}} sur {{{{co.n}}}}</b><button onClick="{{{{ouvrirMenuLecon}}}}" class="plus" aria-label="Réglages de la leçon">···</button></header>
<span class="barre" style="margin: 0; border-radius: 0;"><i style="width: {{{{le.pctCours}}}}; border-radius: 0;"></i></span>
<div class="scroll" style="flex: 1; overflow-y: auto; padding-bottom: 120px;">
<button onClick="{{{{lire}}}}" aria-label="{{{{le.lireLab}}}}" style="display: block; width: 100%; height: 206px; position: relative; background: {{{{co.c}}}}; overflow: hidden;">
<svg viewBox="0 0 390 206" preserveAspectRatio="xMidYMid slice" style="position: absolute; inset: 0; width: 100%; height: 100%;" aria-hidden="true"><g fill="#FFFFFF" fill-opacity=".85"><rect x="70" y="110" width="36" height="56" rx="5"></rect><rect x="122" y="80" width="36" height="86" rx="5"></rect><rect x="174" y="96" width="36" height="70" rx="5"></rect></g><rect x="226" y="52" width="36" height="114" rx="5" fill="#A6F26B"></rect><path d="M60 166h250" stroke="#FFFFFF" stroke-opacity=".6" stroke-width="3"></path></svg>
<span style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 64px; height: 64px; border-radius: 50%; background: rgba(11,26,31,.75); color: #F2EDE5; display: flex; align-items: center; justify-content: center; opacity: {{{{le.playOp}}}};"><svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"></path></svg></span>
<span style="position: absolute; left: 16px; right: 16px; bottom: 12px; display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 600; color: #FFFFFF;"><span>{{{{le.temps}}}}</span><span style="flex: 1; height: 4px; border-radius: 2px; background: rgba(255,255,255,.3); overflow: hidden;"><span style="display: block; height: 100%; width: {{{{le.pctVideo}}}}; background: #FFFFFF;"></span></span><span>{{{{le.duree}}}}</span></span>
</button>
<div class="bloc">
<h1 style="font-size: 21px; line-height: 1.3;">{{{{le.t}}}}</h1>
<p class="meta" style="margin-top: 6px;">{{{{le.d}}}} · sous-titres en français</p>
</div>
<div class="bloc"><h3>À retenir</h3><sc-for list="{{{{le.points}}}}" as="x" hint-placeholder-count="3"><div class="li"><i></i>{{{{x}}}}</div></sc-for></div>
<div class="bloc" style="border-bottom: 0;">
<h3>Question rapide</h3>
<p style="font-size: 15px; line-height: 1.45; margin-bottom: 12px;">{{{{le.q}}}}</p>
<div style="display: flex; flex-direction: column; gap: 8px;"><sc-for list="{{{{reponses}}}}" as="r" hint-placeholder-count="3"><button onClick="{{{{r.pick}}}}" class="rep" style="background: {{{{r.bg}}}}; border: 1px solid {{{{r.bd}}}}; color: {{{{r.col}}}};"><span style="flex: 1;">{{{{r.t}}}}</span><span style="font-weight: 700;">{{{{r.sym}}}}</span></button></sc-for></div>
<sc-if value="{{{{aFeedback}}}}" hint-placeholder-val="{{{{ false }}}}"><p style="font-size: 14px; line-height: 1.5; margin-top: 12px; color: {{{{fbCol}}}};">{{{{feedback}}}}</p></sc-if>
<button onClick="{{{{orbiExpliquer}}}}" style="margin-top: 14px; font-size: 13.5px; font-weight: 700; color: #5FE0B8; min-height: 40px; display: flex; align-items: center; gap: 8px;">{ORBI(24)}Orbi explique autrement</button>
</div>
</div>
<div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 12px 20px 28px; background: rgba(11,26,31,.92); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-top: 1px solid rgba(255,255,255,.08); display: flex; gap: 10px;">
<sc-if value="{{{{le.aPrec}}}}" hint-placeholder-val="{{{{ true }}}}"><button onClick="{{{{precedente}}}}" class="bs">Précédente</button></sc-if>
<button onClick="{{{{suivante}}}}" class="bp" style="flex: 1; width: auto; opacity: {{{{suivOp}}}};">{{{{suivT}}}}</button>
</div>
</div>
</sc-if>

<!-- ============ COURS TERMINÉ / ATTESTATION ============ -->
<sc-if value="{{{{vAtt}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<header class="barreh">{BACK('retourAtt', '{{attRetourT}}')}<span style="flex: 1;"></span></header>
<div class="scroll" style="flex: 1; overflow-y: auto; padding: 18px 20px 40px;">
<sc-if value="{{{{attNouvelle}}}}" hint-placeholder-val="{{{{ false }}}}"><div style="text-align: center; padding-bottom: 18px;"><b style="display: block; font-size: 22px;">Bravo Grâce !</b><p class="meta" style="font-size: 14px; margin-top: 6px;">Vous avez terminé « {{{{at.t}}}} ».</p></div></sc-if>
<div style="border-radius: 22px; background: #F2EDE5; color: #0B1A1F; padding: 22px; position: relative; overflow: hidden;">
<svg viewBox="0 0 300 200" style="position: absolute; right: -40px; top: -30px; width: 220px; height: 150px;" aria-hidden="true"><circle cx="150" cy="100" r="80" fill="none" stroke="#A6F26B" stroke-width="22" opacity=".55"></circle></svg>
<span style="position: relative; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #14745F;">Attestation Jumanly</span>
<b style="position: relative; display: block; font-size: 21px; line-height: 1.25; margin-top: 10px;">{{{{at.t}}}}</b>
<p style="position: relative; font-size: 14px; margin-top: 14px;">Décernée à <b>Grâce Mbuyi</b></p>
<p style="position: relative; font-size: 13px; color: #4A5A56; margin-top: 4px;">Le {{{{at.date}}}} · score final {{{{at.score}}}}</p>
<p style="position: relative; font-size: 12.5px; color: #4A5A56; margin-top: 16px;">Vérification : jumanly.io/v/{{{{at.code}}}}</p>
</div>
<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
<button onClick="{{{{ajouterProfil}}}}" class="bp" style="opacity: {{{{profilOp}}}};">{{{{profilT}}}}</button>
<a href="Fil-publier.dc.html" class="bs" style="color: #F2EDE5; width: 100%;">Partager dans le Fil</a>
<button onClick="{{{{telecharger}}}}" class="bs" style="width: 100%;">Télécharger en PDF</button>
</div>
<sc-if value="{{{{attNouvelle}}}}" hint-placeholder-val="{{{{ false }}}}"><button onClick="{{{{retourAccueil}}}}" style="width: 100%; margin-top: 16px; font-size: 14px; font-weight: 700; color: #A6F26B; min-height: 44px; text-align: center;">Voir d’autres cours</button></sc-if>
</div>
</div>
</sc-if>

<!-- ============ ORBI FLOTTANT ============ -->
<sc-if value="{{{{fab}}}}" hint-placeholder-val="{{{{ true }}}}">
<div style="position: absolute; right: 20px; bottom: 100px; display: flex; align-items: center; gap: 8px; z-index: 5;">
<button onClick="{{{{orbiEntretien}}}}" style="max-width: 200px; background: #1B3338; border-radius: 18px 18px 6px 18px; padding: 9px 12px; font-size: 12.5px; font-weight: 600; line-height: 1.35; box-shadow: 0 14px 30px -12px rgba(0,0,0,.8); border: 1px solid rgba(255,255,255,.08);">Réviser pour l’entretien de jeudi ?</button>
<button onClick="{{{{ouvrirOrbi}}}}" aria-label="Ouvrir Orbi, l’assistant" style="width: 58px; height: 58px; border-radius: 50%; flex: none; box-shadow: 0 0 0 6px rgba(47,211,166,.2),0 14px 30px -8px rgba(47,211,166,.55);">{ORBI(58)}</button>
</div>
</sc-if>

<sc-if value="{{{{vAccueil}}}}" hint-placeholder-val="{{{{ true }}}}">
{NAV}
</sc-if>

<!-- ============ FEUILLES ============ -->
<sc-if value="{{{{fMenu}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{{{fermer}}}}" aria-label="Fermer" class="voile"></button>
<div class="feuille"><span class="poignee"></span>
<p style="font-size: 13px; color: #8FA39E; padding: 0 4px 6px;">{{{{menuTitre}}}}</p>
<sc-for list="{{{{menu}}}}" as="m" hint-placeholder-count="3"><button onClick="{{{{m.go}}}}" class="opt" style="color: {{{{m.col}}}};"><span>{{{{m.t}}}}<small>{{{{m.s}}}}</small></span></button></sc-for>
<button onClick="{{{{fermer}}}}" class="annuler">Annuler</button>
</div>
</div>
</sc-if>

<sc-if value="{{{{fPremium}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{{{fermer}}}}" aria-label="Fermer" class="voile"></button>
<div class="feuille" style="text-align: center;"><span class="poignee"></span>
<span class="mini" style="margin: 6px auto 0; background: {{{{co.c}}}};">{{{{co.ab}}}}</span>
<b style="display: block; font-size: 18px; margin-top: 14px;">« {{{{co.t}}}} » est inclus dans {{{{co.prix}}}}</b>
<p style="font-size: 14px; color: #B9CBC6; line-height: 1.5; margin-top: 8px;">{{{{premiumD}}}}</p>
<a href="Carriere-abonnement.dc.html" class="bp" style="margin-top: 18px;">Voir les formules</a>
<button onClick="{{{{essaiLecon}}}}" class="annuler">Essayer la première leçon</button>
</div>
</div>
</sc-if>

<sc-if value="{{{{orbi}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{{{fermerOrbi}}}}" aria-label="Fermer Orbi" class="voile"></button>
<div class="feuille"><span class="poignee"></span>
<div style="display: flex; align-items: center; gap: 12px;">
<sc-if value="{{{{aRep}}}}" hint-placeholder-val="{{{{ false }}}}"><button onClick="{{{{autresQ}}}}" aria-label="Autres questions" style="height: 40px; width: 32px; display: flex; align-items: center;">{ico(RETOUR, 20, '2')}</button></sc-if>
{ORBI(42)}
<span style="flex: 1;"><b style="display: block; font-size: 17px;">{{{{orbiTitre}}}}</b><span style="font-size: 12.5px; color: #8FA39E;">Orbi · depuis Formation</span></span>
<button onClick="{{{{fermerOrbi}}}}" aria-label="Fermer" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #8FA39E;">{ico(CROIX)}</button>
</div>
<sc-if value="{{{{sansRep}}}}" hint-placeholder-val="{{{{ true }}}}"><div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px;"><sc-for list="{{{{questions}}}}" as="q" hint-placeholder-count="4"><button onClick="{{{{q.go}}}}" class="q">{{{{q.t}}}}</button></sc-for></div></sc-if>
<sc-if value="{{{{aRep}}}}" hint-placeholder-val="{{{{ false }}}}"><div style="margin-top: 16px;"><p class="meta">{{{{ra.q}}}}</p><p style="font-size: 15px; line-height: 1.5; margin-top: 8px;">{{{{ra.t}}}}</p>
<sc-if value="{{{{ra.aBtn}}}}" hint-placeholder-val="{{{{ false }}}}"><button onClick="{{{{ra.act}}}}" class="q" style="margin-top: 14px; background: #A6F26B; color: #0B1A1F; text-align: center;">{{{{ra.actT}}}}</button></sc-if>
<sc-if value="{{{{ra.aLien}}}}" hint-placeholder-val="{{{{ false }}}}"><a href="{{{{ra.href}}}}" class="q" style="display: block; margin-top: 14px; background: #A6F26B; color: #0B1A1F; text-align: center;">{{{{ra.actT}}}}</a></sc-if></div></sc-if>
<label class="champ" style="margin-top: 14px;">
<input value="{{{{oq}}}}" onChange="{{{{ecrireOrbi}}}}" aria-label="Écrire à Orbi" placeholder="Écrire à Orbi…">
<button onClick="{{{{envoyerOrbi}}}}" class="env">Envoyer</button>
</label>
</div>
</div>
</sc-if>

<sc-if value="{{{{aToast}}}}" hint-placeholder-val="{{{{ false }}}}">
<div role="status" style="position: absolute; left: 20px; right: 20px; top: 54px; z-index: 30; padding: 14px 16px; border-radius: 16px; background: #F2EDE5; color: #0B1A1F; font-size: 14px; font-weight: 600; box-shadow: 0 16px 30px -10px rgba(0,0,0,.7); display: flex; align-items: center; gap: 10px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14745F" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex: none;"><path d="{CHECK}"></path></svg>{{{{toast}}}}</div>
</sc-if>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"onglet":{{"editor":"enum","options":["pour","mes","att"],"default":"pour"}},"vue":{{"editor":"enum","options":["accueil","cours","lecon","attestation"],"default":"accueil"}},"cours":{{"editor":"enum","options":["pbi","sql","xl","ent","ang","fin","mkt","py"],"default":"pbi"}},"lecon":{{"editor":"number","default":3}},"reponse":{{"editor":"number","default":-1}},"nouvelle":{{"editor":"boolean","default":false}},"feuille":{{"editor":"enum","options":["aucune","menu","menuLecon","premium"],"default":"aucune"}},"orbi":{{"editor":"boolean","default":false}},"orbiRep":{{"editor":"enum","options":["aucune","pourquoi","entretien","sql","temps","expliquer"],"default":"aucune"}},"recherche":{{"editor":"enum","options":["","options","texte"],"default":""}},"$preview":{{"width":390,"height":844}}}}'>
{JS}
</script>
</body>
</html>
'''
open(os.path.join(P, 'Formation.dc.html'), 'w').write(HTML)

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
<dc-import name="Formation" {attrs} hint-size="390px,844px"></dc-import>
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
    ('Formation-mes-cours.dc.html', 'Formation · Mes cours', {'onglet': 'mes'}),
    ('Formation-attestations.dc.html', 'Formation · Attestations', {'onglet': 'att'}),
    ('Formation-cours.dc.html', 'Formation · Cours Power BI', {'vue': 'cours', 'cours': 'pbi'}),
    ('Formation-lecon.dc.html', 'Formation · Leçon 3', {'vue': 'lecon', 'cours': 'pbi', 'lecon': '3'}),
    ('Formation-quiz.dc.html', 'Formation · Question rapide corrigée', {'vue': 'lecon', 'cours': 'pbi', 'lecon': '3', 'reponse': '0'}),
    ('Formation-fini.dc.html', 'Formation · Cours terminé', {'vue': 'attestation', 'cours': 'pbi', 'nouvelle': 'true'}),
    ('Formation-attestation.dc.html', 'Formation · Attestation SQL', {'vue': 'attestation', 'cours': 'sql'}),
    ('Formation-premium.dc.html', 'Formation · Cours inclus dans Pro', {'vue': 'cours', 'cours': 'ang', 'feuille': 'premium'}),
    ('Formation-menu.dc.html', 'Formation · Menu du cours', {'vue': 'cours', 'cours': 'pbi', 'feuille': 'menu'}),
    ('Formation-orbi.dc.html', 'Formation · Orbi', {'orbi': 'true', 'orbiRep': 'pourquoi'}),
    ('Formation-recherche.dc.html', 'Formation · Rechercher : les options', {'recherche': 'options'}),
    ('Formation-recherche-texte.dc.html', 'Formation · Une lettre tapée', {'recherche': 'texte'}),
]
for fn, t, pr in PAGES:
    importer(fn, t, pr)
json.dump([p[0] for p in PAGES], open(os.path.join(D, 'formation_pages.json'), 'w'))
print('ok')

# transitions douces (voir transitions_lib.py)
import transitions_lib as _tl
_p = os.path.join(P, "Formation.dc.html")
_t = _tl.fix(open(_p).read())
open(_p, "w").write(_t)
