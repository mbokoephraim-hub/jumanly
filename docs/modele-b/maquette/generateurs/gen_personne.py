# Génère Personne.dc.html (profil générique, prop « qui ») et un artboard par personne.
import os, json
D = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(D, 'canvas/project')
JS = open(os.path.join(D, 'personne_logic.js')).read()

ORBI = lambda s: (f'<svg width="{s}" height="{s}" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="23" fill="#2FD3A6"></circle>'
                  '<path d="M23 10.5c1.3 7.4 5.6 11.8 13 13.1-7.4 1.3-11.7 5.7-13 13.1-1.3-7.4-5.6-11.8-13-13.1 7.4-1.3 11.7-5.7 13-13.1z" fill="#0B1A1F"></path>'
                  '<circle cx="35" cy="13" r="3.4" fill="#F2EDE5"></circle></svg>')
def ico(d, s=20, sw='1.7'):
    return f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{d}"></path></svg>'
RETOUR = 'M15 5 8 12l7 7'
CROIX = 'M6 6l12 12M18 6 6 18'
VERIF = '<svg width="20" height="20" viewBox="0 0 24 24" role="img" aria-label="Identité vérifiée"><circle cx="12" cy="12" r="10" fill="#A6F26B"></circle><path d="m7.5 12.5 3 3 6-6.5" fill="none" stroke="#0B1A1F" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path></svg>'

CSS = '''
body{margin:0;background:#050D10}
a{color:#A6F26B;text-decoration:none}
.fd,.fd *{box-sizing:border-box}
.fd{font-family:"Sora",system-ui,sans-serif;color:#F2EDE5;-webkit-font-smoothing:antialiased}
.fd h1,.fd h2,.fd h3,.fd p{margin:0}
.fd button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:left}
.fd .scroll{scrollbar-width:none}.fd .scroll::-webkit-scrollbar{display:none}
.fd .rub{padding:20px 20px 4px}
.fd .rub h3{font-size:14px;font-weight:500;color:#8FA39E;margin-bottom:12px}
.fd .pil{height:38px;padding:0 15px;border-radius:19px;border:1px solid rgba(255,255,255,.28);font-size:13.5px;display:inline-flex;align-items:center;white-space:nowrap}
.fd .ligne{display:flex;gap:14px;align-items:flex-start;padding:9px 0}
.fd .rond{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex:none;font-size:12px;font-weight:700}
.fd .meta{font-size:13px;color:#8FA39E}
.fd .ligne b{display:block;font-size:15px;font-weight:500}
.fd .ligne span.d{display:block;font-size:13.5px;color:#9FB3AE;line-height:1.4;margin-top:2px}
.fd .rondbt{width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;color:#F2EDE5}
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
'''

PHOTO = 'd159cc907efe9558da98ea05e4859c51'

HTML = f'''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Jumanly Modèle B · Profil d’une personne</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<style>{CSS}</style>
</helmet>
<div class="fd" style="width: 390px; height: 844px; position: relative; overflow: hidden; background: #0B1A1F; border-radius: 44px;">
<div class="scroll" style="position: absolute; inset: 0; overflow-y: auto; padding-bottom: 120px;">

<div style="height: 150px; position: relative; overflow: hidden; background: {{{{x.ban}}}};">
<svg viewBox="0 0 390 150" preserveAspectRatio="xMidYMid slice" style="position: absolute; inset: 0; width: 100%; height: 100%;" aria-hidden="true"><g fill="none" stroke="#FFFFFF" stroke-opacity=".22" stroke-width="3"><path d="M0 90 Q100 50 195 90 T390 90"></path><path d="M0 115 Q100 75 195 115 T390 115"></path><path d="M0 65 Q100 25 195 65 T390 65"></path></g><circle cx="330" cy="30" r="22" fill="#A6F26B" opacity=".85"></circle></svg>
<a href="{{{{retourHref}}}}" aria-label="Retour" class="rondbt" style="position: absolute; left: 20px; top: 46px;">{ico('M19 12H5M11 6l-6 6 6 6', 20, '2.2')}</a>
<button onClick="{{{{ouvrirMenu}}}}" aria-label="Plus d’options" class="rondbt" style="position: absolute; right: 20px; top: 46px; font-size: 18px; letter-spacing: 1px; justify-content: center;">···</button>
</div>

<div style="padding: 0 20px; position: relative;">
<sc-if value="{{{{x.photo}}}}" hint-placeholder-val="{{{{ true }}}}"><img src="/_blob/{PHOTO}" alt="Photo de Patrick Ilunga" style="position: absolute; left: 20px; top: -52px; width: 104px; height: 104px; border-radius: 50%; object-fit: cover; object-position: 50% 22%; box-shadow: 0 0 0 4px #0B1A1F;"></sc-if>
<sc-if value="{{{{x.sansPhoto}}}}" hint-placeholder-val="{{{{ false }}}}"><span style="position: absolute; left: 20px; top: -52px; width: 104px; height: 104px; border-radius: 50%; background: {{{{x.c}}}}; color: {{{{x.lc}}}}; font-size: 32px; font-weight: 700; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 4px #0B1A1F;">{{{{x.lg}}}}</span></sc-if>
<div style="display: flex; justify-content: flex-end; gap: 10px; padding-top: 12px; min-height: 58px;">
<sc-if value="{{{{connecte}}}}" hint-placeholder-val="{{{{ false }}}}"><a href="{{{{x.msg}}}}" aria-label="Écrire à {{{{x.prenom}}}}" style="width: 46px; height: 46px; border-radius: 50%; border: 1px solid rgba(255,255,255,.35); display: flex; align-items: center; justify-content: center; color: #F2EDE5;">{ico('M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.5A7.5 7.5 0 1 1 20 11.5z')}</a></sc-if>
<sc-if value="{{{{recue}}}}" hint-placeholder-val="{{{{ false }}}}"><button onClick="{{{{ignorer}}}}" style="height: 46px; padding: 0 18px; border-radius: 23px; font-size: 14px; font-weight: 600; color: #B9CBC6; border: 1px solid rgba(255,255,255,.2);">Ignorer</button></sc-if>
<button onClick="{{{{connecter}}}}" style="height: 46px; padding: 0 22px; border-radius: 23px; font-size: 15px; font-weight: 700; background: {{{{bt.bg}}}}; color: {{{{bt.col}}}}; border: 1px solid {{{{bt.bd}}}};">{{{{bt.t}}}}</button>
</div>
<div style="margin-top: 12px;">
<h1 style="font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 8px;">{{{{x.n}}}}<sc-if value="{{{{x.verif}}}}" hint-placeholder-val="{{{{ true }}}}">{VERIF}</sc-if></h1>
<p class="meta" style="font-size: 14px; margin-top: 2px;">@{{{{x.handle}}}} · {{{{x.ville}}}}</p>
<p style="font-size: 15px; margin-top: 10px;">{{{{x.role}}}}<sc-if value="{{{{x.aEnt}}}}" hint-placeholder-val="{{{{ true }}}}"> chez <sc-if value="{{{{x.entPage}}}}" hint-placeholder-val="{{{{ false }}}}"><a href="Entreprise.dc.html" style="font-weight: 600;">{{{{x.ent}}}}</a></sc-if><sc-if value="{{{{x.entTexte}}}}" hint-placeholder-val="{{{{ true }}}}"><b style="font-weight: 600;">{{{{x.ent}}}}</b></sc-if></sc-if></p>
<div style="display: flex; gap: 18px; margin-top: 10px; font-size: 13.5px; color: #B9CBC6;"><span><b style="color: #F2EDE5;">{{{{x.conn}}}}</b> connexions</span><span><b style="color: #F2EDE5;">{{{{x.commun}}}}</b> en commun</span></div>
<p class="meta" style="margin-top: 10px;">{{{{note}}}}</p>
<sc-if value="{{{{bloque}}}}" hint-placeholder-val="{{{{ false }}}}"><div style="margin-top: 12px; padding: 12px 14px; border-radius: 16px; background: rgba(255,138,122,.1); border: 1px solid rgba(255,138,122,.35); display: flex; align-items: center; gap: 10px; font-size: 13.5px;"><span style="flex: 1;">Vous avez bloqué {{{{x.prenom}}}}. Il ou elle ne peut plus vous écrire.</span><button onClick="{{{{debloquer}}}}" style="font-weight: 700; color: #A6F26B; min-height: 36px;">Débloquer</button></div></sc-if>
</div>
</div>

<div class="scroll" role="tablist" aria-label="Rubriques du profil" style="display: flex; gap: 4px; overflow-x: auto; margin-top: 16px; border-bottom: 1px solid rgba(255,255,255,.12); padding: 0 6px;">
<sc-for list="{{{{onglets}}}}" as="o" hint-placeholder-count="3">
<button role="tab" aria-selected="{{{{o.sel}}}}" onClick="{{{{o.pick}}}}" style="height: 48px; padding: 0 14px; font-size: 15px; font-weight: {{{{o.fw}}}}; color: {{{{o.col}}}}; position: relative; white-space: nowrap; flex: none;">{{{{o.t}}}}<span style="position: absolute; left: 8px; right: 8px; bottom: -1px; height: 3px; border-radius: 2px; background: #F2EDE5; opacity: {{{{o.on}}}};"></span></button>
</sc-for>
</div>

<sc-if value="{{{{oAbout}}}}" hint-placeholder-val="{{{{ true }}}}">
<div>
<div class="rub"><h3>À propos</h3><p style="font-size: 15px; line-height: 1.55;">{{{{x.about}}}}</p></div>
<div class="rub"><h3>Compétences</h3><div style="display: flex; flex-wrap: wrap; gap: 8px;"><sc-for list="{{{{x.comp}}}}" as="c" hint-placeholder-count="4"><span class="pil">{{{{c}}}}</span></sc-for></div></div>
<div class="rub"><h3>Expérience</h3><sc-for list="{{{{x.exp}}}}" as="e" hint-placeholder-count="2"><div class="ligne"><span class="rond" style="background: {{{{e.c}}}}; color: {{{{e.lc}}}};">{{{{e.lg}}}}</span><span><b>{{{{e.t}}}}</b><span class="d">{{{{e.d}}}}</span></span></div></sc-for></div>
<div class="rub"><h3>Formation</h3><sc-for list="{{{{x.form}}}}" as="e" hint-placeholder-count="2"><div class="ligne"><span class="rond" style="background: {{{{e.c}}}}; color: {{{{e.lc}}}};">{{{{e.lg}}}}</span><span><b>{{{{e.t}}}}</b><span class="d">{{{{e.d}}}}</span></span></div></sc-for></div>
<div class="rub" style="padding-bottom: 20px;"><h3>Langues</h3><div style="display: flex; flex-wrap: wrap; gap: 8px;"><sc-for list="{{{{x.lang}}}}" as="c" hint-placeholder-count="3"><span class="pil">{{{{c}}}}</span></sc-for></div></div>
</div>
</sc-if>

<sc-if value="{{{{oPub}}}}" hint-placeholder-val="{{{{ false }}}}">
<div>
<sc-if value="{{{{x.aPub}}}}" hint-placeholder-val="{{{{ true }}}}">
<article style="display: flex; gap: 12px; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,.08);">
<sc-if value="{{{{x.photo}}}}" hint-placeholder-val="{{{{ true }}}}"><img src="/_blob/{PHOTO}" alt="" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; object-position: 50% 22%; flex: none;"></sc-if>
<sc-if value="{{{{x.sansPhoto}}}}" hint-placeholder-val="{{{{ false }}}}"><span style="width: 40px; height: 40px; border-radius: 50%; background: {{{{x.c}}}}; color: {{{{x.lc}}}}; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: none;">{{{{x.lg}}}}</span></sc-if>
<div style="flex: 1; min-width: 0;">
<div style="display: flex; gap: 6px; align-items: center; font-size: 14px;"><b>{{{{x.n}}}}</b><span class="meta">{{{{x.pubH}}}}</span></div>
<p style="font-size: 15px; line-height: 1.48; margin-top: 3px;">{{{{x.pub}}}}</p>
<a href="{{{{x.pubLien}}}}" style="font-size: 14px; font-weight: 600; display: inline-flex; margin-top: 8px; min-height: 32px; align-items: center;">{{{{x.pubLienT}}}}</a>
</div>
</article>
</sc-if>
<sc-if value="{{{{x.sansPub}}}}" hint-placeholder-val="{{{{ false }}}}"><p class="meta" style="font-size: 14px; text-align: center; padding: 40px 20px;">{{{{x.prenom}}}} n’a encore rien publié.</p></sc-if>
</div>
</sc-if>

<sc-if value="{{{{oReal}}}}" hint-placeholder-val="{{{{ false }}}}">
<div>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 14px 20px;">
<sc-for list="{{{{x.real}}}}" as="r" hint-placeholder-count="3"><div style="border-radius: 18px; overflow: hidden; border: 1px solid rgba(255,255,255,.12);"><div style="height: 130px; background: {{{{r.c}}}}; position: relative;"><svg viewBox="0 0 170 130" preserveAspectRatio="xMidYMid slice" style="position: absolute; inset: 0; width: 100%; height: 100%;" aria-hidden="true"><path d="M20 100 L55 72 L85 82 L115 46 L150 58" fill="none" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"></path></svg></div><div style="padding: 10px 12px 12px;"><b style="display: block; font-size: 14px;">{{{{r.t}}}}</b><span class="meta">{{{{r.d}}}}</span></div></div></sc-for>
</div>
<sc-if value="{{{{x.sansReal}}}}" hint-placeholder-val="{{{{ false }}}}"><p class="meta" style="font-size: 14px; text-align: center; padding: 30px 20px;">Aucune réalisation pour l’instant.</p></sc-if>
</div>
</sc-if>
</div>

<button onClick="{{{{ouvrirOrbi}}}}" aria-label="Ouvrir Orbi, l’assistant" style="position: absolute; right: 20px; bottom: 100px; width: 58px; height: 58px; border-radius: 50%; z-index: 5; box-shadow: 0 0 0 6px rgba(47,211,166,.2),0 14px 30px -8px rgba(47,211,166,.55);">{ORBI(58)}</button>

<nav aria-label="Navigation principale" class="nav">
<sc-for list="{{{{nav}}}}" as="n" hint-placeholder-count="5">
<a href="{{{{n.href}}}}" aria-label="{{{{n.t}}}}" style="color: {{{{n.c}}}};"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{{{{n.sw}}}}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{{{{n.d}}}}"></path></svg><span style="width: 5px; height: 5px; border-radius: 50%; background: #A6F26B; opacity: {{{{n.dot}}}};"></span></a>
</sc-for>
</nav>

<!-- Feuille ··· -->
<sc-if value="{{{{fMenu}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{{{fermer}}}}" aria-label="Fermer" class="voile"></button>
<div class="feuille"><span class="poignee"></span>
<p style="font-size: 13px; color: #8FA39E; padding: 0 4px 6px;">{{{{x.n}}}}</p>
<sc-for list="{{{{menu}}}}" as="m" hint-placeholder-count="4"><button onClick="{{{{m.go}}}}" class="opt" style="color: {{{{m.col}}}};"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{{{{m.d}}}}"></path></svg><span>{{{{m.t}}}}<small>{{{{m.s}}}}</small></span></button></sc-for>
<button onClick="{{{{fermer}}}}" class="annuler">Annuler</button>
</div>
</div>
</sc-if>

<!-- Feuille signaler -->
<sc-if value="{{{{fSignaler}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{{{fermer}}}}" aria-label="Fermer" class="voile"></button>
<div class="feuille"><span class="poignee"></span>
<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;"><button onClick="{{{{ouvrirMenu}}}}" aria-label="Retour" style="height: 40px; width: 32px; display: flex; align-items: center;">{ico(RETOUR, 20, '2')}</button><b style="font-size: 17px;">Signaler le profil</b></div>
<p style="font-size: 13px; color: #8FA39E; padding: 0 4px 8px;">{{{{x.prenom}}}} ne saura pas que c’est vous.</p>
<sc-for list="{{{{raisons}}}}" as="m" hint-placeholder-count="4"><button onClick="{{{{m.go}}}}" class="opt">{{{{m.t}}}}</button></sc-for>
<button onClick="{{{{fermer}}}}" class="annuler">Annuler</button>
</div>
</div>
</sc-if>

<!-- Feuille bloquer -->
<sc-if value="{{{{fBloquer}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{{{fermer}}}}" aria-label="Fermer" class="voile"></button>
<div class="feuille" style="text-align: center;"><span class="poignee"></span>
<b style="display: block; font-size: 18px; margin-top: 6px;">{{{{bq.t}}}}</b>
<p style="font-size: 14px; color: #B9CBC6; line-height: 1.5; margin-top: 8px;">{{{{bq.d}}}}</p>
<button onClick="{{{{bloquer}}}}" style="width: 100%; height: 50px; margin-top: 18px; border-radius: 999px; background: #FF8A7A; color: #0B1A1F; text-align: center; font-size: 15px; font-weight: 700;">{{{{bq.b}}}}</button>
<button onClick="{{{{fermer}}}}" class="annuler">Annuler</button>
</div>
</div>
</sc-if>

<!-- Feuille Orbi -->
<sc-if value="{{{{orbi}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{{{fermerOrbi}}}}" aria-label="Fermer Orbi" class="voile"></button>
<div class="feuille"><span class="poignee"></span>
<div style="display: flex; align-items: center; gap: 12px;">
<sc-if value="{{{{aRep}}}}" hint-placeholder-val="{{{{ false }}}}"><button onClick="{{{{autresQ}}}}" aria-label="Autres questions" style="height: 40px; width: 32px; display: flex; align-items: center;">{ico(RETOUR, 20, '2')}</button></sc-if>
{ORBI(42)}
<span style="flex: 1;"><b style="display: block; font-size: 17px;">{{{{orbiTitre}}}}</b><span style="font-size: 12.5px; color: #8FA39E;">Orbi · sur le profil de {{{{x.prenom}}}}</span></span>
<button onClick="{{{{fermerOrbi}}}}" aria-label="Fermer" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #8FA39E;">{ico(CROIX)}</button>
</div>
<sc-if value="{{{{sansRep}}}}" hint-placeholder-val="{{{{ true }}}}"><div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px;"><sc-for list="{{{{questions}}}}" as="q" hint-placeholder-count="3"><button onClick="{{{{q.go}}}}" class="q">{{{{q.t}}}}</button></sc-for></div></sc-if>
<sc-if value="{{{{aRep}}}}" hint-placeholder-val="{{{{ false }}}}"><div style="margin-top: 16px;"><p class="meta">{{{{ra.q}}}}</p><p style="font-size: 15px; line-height: 1.5; margin-top: 8px;">{{{{ra.t}}}}</p>
<sc-if value="{{{{ra.aAct}}}}" hint-placeholder-val="{{{{ false }}}}"><button onClick="{{{{ra.act}}}}" class="q" style="margin-top: 14px; background: #A6F26B; color: #0B1A1F; text-align: center;">{{{{ra.actT}}}}</button></sc-if></div></sc-if>
<label class="champ" style="margin-top: 14px;">
<input value="{{{{oq}}}}" onChange="{{{{ecrireOrbi}}}}" aria-label="Écrire à Orbi" placeholder="Écrire à Orbi…">
<button onClick="{{{{envoyerOrbi}}}}" class="env">Envoyer</button>
</label>
</div>
</div>
</sc-if>

<sc-if value="{{{{aToast}}}}" hint-placeholder-val="{{{{ false }}}}">
<div role="status" style="position: absolute; left: 20px; right: 20px; top: 54px; z-index: 30; padding: 14px 16px; border-radius: 16px; background: #F2EDE5; color: #0B1A1F; font-size: 14px; font-weight: 600; box-shadow: 0 16px 30px -10px rgba(0,0,0,.7); display: flex; align-items: center; gap: 10px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14745F" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex: none;"><path d="m5 12.5 4.5 4.5L19 7.5"></path></svg>{{{{toast}}}}</div>
</sc-if>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"qui":{{"editor":"enum","options":["pi","jk","nk","rn","dl","sm","ak","mt","at","ek","jm","rm","sn","mk","cm"],"default":"pi"}},"onglet":{{"editor":"enum","options":["pub","about","real"],"default":"about"}},"connecte":{{"editor":"boolean","default":false}},"$preview":{{"width":390,"height":844}}}}'>
{JS}
</script>
</body>
</html>
'''
open(os.path.join(P, 'Personne.dc.html'), 'w').write(HTML)

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
<dc-import name="Personne" {attrs} hint-size="390px,844px"></dc-import>
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
PAGES = json.load(open(os.path.join(D, 'personnes_pages.json')))
for fn, titre, qui in PAGES:
    importer(fn, titre, {'qui': qui})
importer('Personne-real.dc.html', 'Patrick · Réalisations', {'qui': 'pi', 'onglet': 'real'})
print('ok', len(PAGES))

# transitions douces (voir transitions_lib.py)
import transitions_lib as _tl
_p = os.path.join(P, "Personne.dc.html")
_t = _tl.fix(open(_p).read())
open(_p, "w").write(_t)
