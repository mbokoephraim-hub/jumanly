# Génère canvas/project/Entretien.dc.html (simulation d’entretien écrite et vocale avec Orbi) et ses artboards d’étape.
import os, json
D = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(D, 'canvas/project')
JS = open(os.path.join(D, 'entretien_logic.js')).read()

def ico(d, s=20, sw='1.8', col='currentColor'):
    return f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="{col}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{d}"></path></svg>'
ORBI = lambda s: (f'<svg width="{s}" height="{s}" viewBox="0 0 48 48" aria-hidden="true" style="flex: none; display: block;"><circle cx="24" cy="24" r="23" fill="#2FD3A6"></circle>'
                  '<path d="M23 10.5c1.3 7.4 5.6 11.8 13 13.1-7.4 1.3-11.7 5.7-13 13.1-1.3-7.4-5.6-11.8-13-13.1 7.4-1.3 11.7-5.7 13-13.1z" fill="#0B1A1F"></path>'
                  '<circle cx="35" cy="13" r="3.4" fill="#F2EDE5"></circle></svg>')
RETOUR = 'M15 5 8 12l7 7'
CROIX = 'M6 6l12 12M18 6 6 18'
CHEV = 'm9 6 6 6-6 6'
PAUSE = 'M9 5v14M15 5v14'
REPETER = 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5'
AMPOULE = 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z'
SON = 'M4 9.5v5h3.5L12 18V6L7.5 9.5zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11'
MICRO = 'M12 3.5a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3zM6 11a6 6 0 0 0 12 0M12 17v3.5'
LECTURE = 'M8 5.5v13l10.5-6.5z'
CADENAS = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>'
CHECK = 'm5 12.5 4.5 4.5L19 7.5'

CSS = '''
body{margin:0;background:#050D10}
a{color:#A6F26B;text-decoration:none}
.fd,.fd *{box-sizing:border-box}
.fd{font-family:"Sora",system-ui,sans-serif;color:#F2EDE5;-webkit-font-smoothing:antialiased}
.fd h1,.fd h2,.fd h3,.fd p{margin:0}
.fd button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:left}
.fd .scroll{scrollbar-width:none}.fd .scroll::-webkit-scrollbar{display:none}
.fd .pg{position:absolute;inset:0;overflow-y:auto;animation:entre .3s ease-out both}
.fd .meta{font-size:13px;color:#8FA39E}
.fd .h1{font-size:26px;font-weight:700;letter-spacing:-0.02em;line-height:1.22}
.fd .sous{font-size:15px;line-height:1.5;color:#B9CBC6;margin-top:8px}
.fd .gr{font-size:13px;font-weight:600;color:#8FA39E;margin:26px 0 10px}
.fd .bp{display:flex;align-items:center;justify-content:center;width:100%;height:54px;border-radius:27px;background:#A6F26B;color:#0B1A1F;font-size:15.5px;font-weight:700;text-align:center}
.fd .bs{display:flex;align-items:center;justify-content:center;width:100%;height:52px;border-radius:26px;border:1px solid rgba(255,255,255,.2);font-size:15px;font-weight:600;text-align:center;color:#F2EDE5}
.fd .barreh{padding:50px 12px 0;display:flex;align-items:center;gap:6px;min-height:94px}
.fd .retour{height:44px;padding:0 8px;display:flex;align-items:center;gap:4px;font-size:15px;font-weight:600;color:#F2EDE5;white-space:nowrap}
.fd .chip{height:40px;padding:0 16px;border-radius:20px;font-size:14px;font-weight:500;white-space:nowrap;display:inline-flex;align-items:center;flex:none}
.fd .carte{display:flex;align-items:center;gap:14px;padding:16px;border-radius:18px;transition:all .2s;width:100%}
.fd .ligne{width:100%;display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.07);color:#F2EDE5}
.fd .cad{display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 8px;border-radius:11px;background:#2A2140;color:#E4D7FF;font-size:11.5px;font-weight:700}
.fd .bas{position:absolute;left:0;right:0;bottom:0;padding:16px 20px 30px;background:linear-gradient(180deg,rgba(11,26,31,0) 0,#0B1A1F 22px);z-index:3}
.fd .voile{position:absolute;inset:0;width:100%;background:rgba(0,0,0,.6)}
.fd .feuille{position:absolute;left:0;right:0;bottom:0;background:#13282C;border-radius:30px 30px 0 0;padding:10px 20px 28px;border-top:1px solid rgba(255,255,255,.08);animation:monte .28s ease-out both}
.fd .poignee{display:block;width:40px;height:5px;border-radius:3px;background:rgba(255,255,255,.2);margin:0 auto 14px}
.fd .annuler{width:100%;height:50px;margin-top:10px;border-radius:999px;background:#1B3338;text-align:center;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;color:#F2EDE5}
.fd .rond{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:12px;color:#B9CBC6;min-width:64px}
.fd .rond span{width:52px;height:52px;border-radius:50%;background:#1B3338;display:flex;align-items:center;justify-content:center;color:#F2EDE5}
.fd .etape{display:flex;align-items:center;gap:12px;padding:10px 0;font-size:14.5px}
.fd .pastille{width:24px;height:24px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center}
.fd .tourne{border:2.5px solid rgba(47,211,166,.25);border-top-color:#2FD3A6;animation:tourne .8s linear infinite}
.fd .barreC{display:block;height:6px;border-radius:3px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:8px}
.fd .barreC i{display:block;height:100%;border-radius:3px;animation:remplit .9s ease-out both}
.fd .onde{display:flex;align-items:center;justify-content:center;gap:5px;height:60px}
.fd .onde i{display:block;width:6px;border-radius:3px;background:#A6F26B;animation:onde 1s ease-in-out infinite}
.fd .onde i:nth-child(2){animation-delay:-.2s}.fd .onde i:nth-child(3){animation-delay:-.45s}.fd .onde i:nth-child(4){animation-delay:-.1s}.fd .onde i:nth-child(5){animation-delay:-.6s}.fd .onde i:nth-child(6){animation-delay:-.3s}.fd .onde i:nth-child(7){animation-delay:-.75s}
.fd .halo{position:absolute;inset:0;border-radius:50%;border:2px solid #2FD3A6;animation:halo 1.8s ease-out infinite}
.fd .halo.b{animation-delay:.9s}
.fd .curseur{display:inline-block;width:2px;height:15px;background:#A6F26B;vertical-align:-2px;margin-left:2px;animation:clign 1s steps(2) infinite}
@keyframes entre{from{opacity:.4;transform:scale(.975)}to{opacity:1;transform:none}}
@keyframes monte{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}
@keyframes tourne{to{transform:rotate(360deg)}}
@keyframes remplit{from{width:0}}
@keyframes onde{0%,100%{height:12px}50%{height:52px}}
@keyframes halo{from{transform:scale(1);opacity:.7}to{transform:scale(1.7);opacity:0}}
@keyframes clign{to{opacity:0}}
@keyframes respire{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
@keyframes anneau{from{stroke-dasharray:0 326.7}}
@media (prefers-reduced-motion: reduce){.fd *{animation-duration:.01ms!important;animation-iteration-count:1!important}}
'''

BK = lambda act, t: f'<button onClick="{{{{{act}}}}}" class="retour">{ico(RETOUR, 20, "2")}{t}</button>'
BK_LIEN = f'<a href="{{{{deHref}}}}" class="retour">{ico(RETOUR, 20, "2")}{{{{deT}}}}</a>'
def toggle(val, bg, x, act, label):
    return (f'<button onClick="{{{{{act}}}}}" role="switch" aria-checked="{{{{{val}}}}}" aria-label="{label}" style="width: 48px; height: 28px; border-radius: 14px; background: {{{{{bg}}}}}; position: relative; flex: none;">'
            f'<span style="position: absolute; left: 4px; top: 4px; width: 20px; height: 20px; border-radius: 50%; background: #0B1A1F; transform: translateX({{{{{x}}}}}); transition: transform .2s;"></span></button>')
def etapes(lst):
    return (f'<sc-for list="{{{{{lst}}}}}" as="e" hint-placeholder-count="4"><div class="etape">'
            '<sc-if value="{{e.fait}}" hint-placeholder-val="{{ true }}"><span class="pastille" style="background: #A6F26B; color: #0B1A1F;">' + ico(CHECK, 14, '3') + '</span></sc-if>'
            '<sc-if value="{{e.encours}}" hint-placeholder-val="{{ false }}"><span class="pastille tourne"></span></sc-if>'
            '<sc-if value="{{e.attente}}" hint-placeholder-val="{{ false }}"><span class="pastille" style="border: 2px solid rgba(255,255,255,.16);"></span></sc-if>'
            '<span style="flex: 1; color: {{e.col}};">{{e.t}}</span></div></sc-for>')
ONDE = '<span class="onde" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>'

HTML = '''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Jumanly Modèle B · Simulation d’entretien</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet">
<style>%CSS%</style>
</helmet>
<div class="fd" style="width: 390px; height: 844px; position: relative; overflow: hidden; background: #0B1A1F; border-radius: 44px;">

<!-- ============ RÉGLAGES ============ -->
<sc-if value="{{vChoix}}" hint-placeholder-val="{{ true }}">
<div style="position: absolute; inset: 0;">
<div class="pg scroll" style="padding-bottom: 130px;">
<div class="barreh" style="justify-content: space-between; padding-right: 20px;">%BK_LIEN%<button onClick="{{ouvrirHist}}" style="height: 44px; font-size: 14px; font-weight: 600; color: #A6F26B;">Mes simulations</button></div>
<div style="padding: 4px 20px 0;">
<h1 class="h1">S’entraîner pour l’entretien</h1>
<div style="display: flex; align-items: center; gap: 12px; margin-top: 16px; padding: 14px; border-radius: 18px; background: #13282C;"><span style="width: 44px; height: 44px; border-radius: 13px; background: #0F3F37; color: #A6F26B; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: none;">BF</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px;">Analyste de données junior</b><span class="meta">Baobab Fintech · jeudi 22 oct., 10 h</span></span></div>
<div style="display: flex; align-items: flex-start; gap: 10px; margin-top: 12px; padding: 12px 14px; border-radius: 16px; background: #0F2A2A; border: 1px solid rgba(47,211,166,.35);">%ORBI28%<span style="font-size: 13.5px; line-height: 1.45;">Je prépare les questions à partir de l’offre de Baobab et de votre CV Data.</span></div>

<p class="gr">Comment</p>
<div style="display: flex; gap: 6px; padding: 4px; border-radius: 26px; background: #13282C;"><sc-for list="{{modes}}" as="m" hint-placeholder-count="2"><button onClick="{{m.pick}}" style="flex: 1; height: 54px; border-radius: 22px; background: {{m.bg}}; color: {{m.col}}; text-align: center; transition: all .2s;"><b style="display: block; font-size: 15px;">{{m.t}}</b><span style="font-size: 11.5px; color: {{m.sc}};">{{m.sous}}</span></button></sc-for></div>
<p style="margin-top: 10px; font-size: 13px; font-weight: 600; color: {{bandeauCol}};">{{bandeau}}</p>

<p class="gr">Durée</p>
<div style="display: flex; gap: 8px;"><sc-for list="{{durees}}" as="d" hint-placeholder-count="3"><button onClick="{{d.pick}}" style="flex: 1; padding: 14px 10px; border-radius: 18px; border: 1.5px solid {{d.bd}}; background: {{d.bg}}; text-align: center; position: relative;"><b style="display: block; font-size: 18px; opacity: {{d.op}};">{{d.t}}</b><span class="meta" style="font-size: 12px;">{{d.sous}}</span>
<sc-if value="{{d.verrou}}" hint-placeholder-val="{{ false }}"><span class="cad" style="position: absolute; top: -10px; right: 8px;">%CADENAS%{{d.cadenas}}</span></sc-if></button></sc-for></div>

<p class="gr">Sur quoi</p>
<div style="display: flex; flex-direction: column; gap: 8px;"><sc-for list="{{focusListe}}" as="f" hint-placeholder-count="7"><button onClick="{{f.pick}}" class="carte" style="border: 1.5px solid {{f.bd}}; background: {{f.bg}};"><span style="flex: 1; opacity: {{f.op}};"><b style="display: block; font-size: 15px;">{{f.t}}</b><span class="meta">{{f.d}}</span></span>
<sc-if value="{{f.verrou}}" hint-placeholder-val="{{ false }}"><span class="cad">%CADENAS%{{f.cadenas}}</span></sc-if>
<span style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid {{f.rb}}; background: {{f.rbg}}; color: #0B1A1F; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex: none;">{{f.sym}}</span></button></sc-for></div>

<p class="gr">Ton du recruteur</p>
<div style="display: flex; gap: 8px;"><sc-for list="{{tons}}" as="t" hint-placeholder-count="2"><button onClick="{{t.pick}}" class="chip" style="border: 1px solid {{t.bd}}; background: {{t.bg}}; color: {{t.col}};">{{t.t}}</button></sc-for></div>
<p class="meta" style="margin-top: 20px; line-height: 1.5;">Vos réponses restent privées. Le recruteur ne voit jamais vos simulations.</p>
</div>
</div>
<div class="bas"><button onClick="{{preparer}}" class="bp">{{preparerT}}</button></div>
</div>
</sc-if>

<!-- ============ TÉLÉCHARGEMENT DES QUESTIONS ============ -->
<sc-if value="{{vDl}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0;">
<div class="pg scroll" style="padding-bottom: 150px;">
<div class="barreh">%BK_REGLAGES%</div>
<div style="padding: 10px 20px 0; text-align: center;">
<span style="position: relative; display: block; width: 96px; height: 96px; margin: 0 auto;"><sc-if value="{{dlEnCours}}" hint-placeholder-val="{{ true }}"><span><span class="halo"></span><span class="halo b"></span></span></sc-if><span style="position: absolute; inset: 0; animation: respire 2s ease-in-out infinite;">%ORBI96%</span></span>
<sc-if value="{{dlEnCours}}" hint-placeholder-val="{{ true }}"><h1 class="h1" style="margin-top: 22px;">Orbi prépare votre entretien</h1></sc-if>
<sc-if value="{{dlFini}}" hint-placeholder-val="{{ false }}"><h1 class="h1" style="margin-top: 22px;">C’est prêt</h1></sc-if>
<p class="sous">{{nQT}}</p>
</div>
<div style="margin: 22px 20px 0; padding: 6px 16px; border-radius: 18px; background: #13282C;">%ETAPES_DL%</div>
<sc-if value="{{dlFini}}" hint-placeholder-val="{{ false }}"><div style="padding: 0 20px;">
<p class="meta" style="margin-top: 14px; line-height: 1.5;">Les questions sont sur votre téléphone : la simulation continue même si la connexion coupe.</p>
<button onClick="{{basculerVoirQ}}" style="margin-top: 14px; font-size: 14px; font-weight: 700; color: #A6F26B; min-height: 40px;">{{voirQT}}</button>
<sc-if value="{{voirQ}}" hint-placeholder-val="{{ false }}"><div><sc-for list="{{apercu}}" as="a" hint-placeholder-count="6"><div class="ligne" style="align-items: flex-start;"><span class="meta" style="width: 20px; font-weight: 700;">{{a.n}}</span><span style="flex: 1; font-size: 14.5px; line-height: 1.45;">{{a.t}}</span></div></sc-for></div></sc-if>
</div></sc-if>
</div>
<div class="bas">
<sc-if value="{{dlFini}}" hint-placeholder-val="{{ false }}"><button onClick="{{commencer}}" class="bp">Commencer</button></sc-if>
<sc-if value="{{dlEnCours}}" hint-placeholder-val="{{ true }}"><button onClick="{{retourChoix}}" class="bs">Annuler</button></sc-if>
<sc-if value="{{dlFini}}" hint-placeholder-val="{{ false }}"><button onClick="{{retourChoix}}" class="bs" style="margin-top: 10px; border: 0; height: 40px;">Modifier les réglages</button></sc-if>
</div>
</div>
</sc-if>

<!-- ============ AVANT DE COMMENCER : MICRO ============ -->
<sc-if value="{{vMicro}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0;">
<div class="pg scroll" style="padding-bottom: 150px;">
<div class="barreh">%BK_QUESTIONS%</div>
<div style="padding: 4px 20px 0;">
<h1 class="h1">Avant de commencer</h1>
<p class="sous">Orbi pose la question à voix haute, vous répondez comme devant Nadia.</p>
<div style="margin-top: 22px; padding: 20px; border-radius: 20px; background: #13282C; text-align: center;">
<sc-if value="{{microNon}}" hint-placeholder-val="{{ true }}"><div><span style="width: 64px; height: 64px; margin: 0 auto; border-radius: 50%; background: #1B3338; display: flex; align-items: center; justify-content: center;">%MICRO28%</span><b style="display: block; font-size: 16px; margin-top: 12px;">Le micro est nécessaire</b><p class="meta" style="margin-top: 4px;">Rien n’est gardé après votre bilan.</p><button onClick="{{demanderMicro}}" class="bs" style="margin-top: 14px; height: 46px;">Autoriser le micro</button></div></sc-if>
<sc-if value="{{microOk}}" hint-placeholder-val="{{ false }}"><div>%ONDE%<b style="display: block; font-size: 16px; margin-top: 8px; color: #A6F26B;">On vous entend bien</b><p class="meta" style="margin-top: 4px;">Dites quelques mots pour tester.</p></div></sc-if>
</div>
<p class="gr">Pour bien se lancer</p>
<div style="display: flex; flex-direction: column; gap: 10px; font-size: 14.5px;">
<p style="display: flex; gap: 10px;"><i style="width: 6px; height: 6px; border-radius: 50%; background: #A6F26B; margin-top: 8px; flex: none;"></i>Un endroit calme, téléphone à 20 cm.</p>
<p style="display: flex; gap: 10px;"><i style="width: 6px; height: 6px; border-radius: 50%; background: #A6F26B; margin-top: 8px; flex: none;"></i>Une respiration avant chaque réponse.</p>
<p style="display: flex; gap: 10px;"><i style="width: 6px; height: 6px; border-radius: 50%; background: #A6F26B; margin-top: 8px; flex: none;"></i>Un exemple et un chiffre par réponse.</p>
</div>
<div style="display: flex; align-items: center; gap: 14px; margin-top: 22px; padding: 16px; border-radius: 18px; background: #13282C;"><span style="flex: 1;"><b style="display: block; font-size: 15px;">Afficher le texte des questions</b><span class="meta">Utile si le son est faible</span></span>%TOGGLE_ST%</div>
<button onClick="{{passerEcrit}}" style="margin-top: 16px; font-size: 14px; font-weight: 700; color: #F2EDE5; min-height: 40px;">Je préfère par écrit</button>
</div>
</div>
<div class="bas">
<sc-if value="{{microOk}}" hint-placeholder-val="{{ false }}"><button onClick="{{demarrer}}" class="bp">Je suis prête</button></sc-if>
<sc-if value="{{microNon}}" hint-placeholder-val="{{ true }}"><button onClick="{{demanderMicro}}" class="bp" style="opacity: .45;">Je suis prête</button></sc-if>
</div>
</div>
</sc-if>

<!-- ============ ENTRETIEN EN COURS ============ -->
<sc-if value="{{vAppel}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; background: radial-gradient(120% 70% at 50% 30%, #12302F 0, #0B1A1F 70%);">
<div style="padding: 54px 20px 0;">
<div style="display: flex; gap: 4px;"><sc-for list="{{progression}}" as="b" hint-placeholder-count="6"><span style="flex: 1; height: 4px; border-radius: 2px; background: {{b.bg}};"></span></sc-for></div>
<div style="display: flex; align-items: center; justify-content: space-between; margin-top: 14px;">
<button onClick="{{mettrePause}}" aria-label="Mettre en pause" style="width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,.08); display: flex; align-items: center; justify-content: center;">%PAUSE%</button>
<span style="text-align: center;"><b style="display: block; font-size: 14px;">{{qNum}}</b><span class="meta">{{chrono}} {{chronoT}}</span></span>
<button onClick="{{demanderQuitter}}" style="height: 44px; padding: 0 14px; border-radius: 22px; background: rgba(240,138,124,.14); color: #F08A7C; font-size: 13.5px; font-weight: 700;">Terminer</button>
</div>
</div>

<sc-if value="{{vocal}}" hint-placeholder-val="{{ true }}"><div>
<div style="position: absolute; left: 0; right: 0; top: 168px; text-align: center;">
<span style="position: relative; display: block; width: 132px; height: 132px; margin: 0 auto;">
<sc-if value="{{orbiParle}}" hint-placeholder-val="{{ true }}"><span><span class="halo"></span><span class="halo b"></span></span></sc-if>
<span style="position: absolute; inset: 0; animation: respire 2.4s ease-in-out infinite;">%ORBI132%</span></span>
<p style="margin-top: 18px; font-size: 13px; font-weight: 700; letter-spacing: .04em; color: #5FE0B8;">{{etat}}</p>
</div>
<div style="position: absolute; left: 24px; right: 24px; top: 372px; text-align: center;">
<sc-if value="{{relance}}" hint-placeholder-val="{{ false }}"><span style="display: inline-block; margin-bottom: 10px; padding: 4px 10px; border-radius: 10px; background: rgba(244,196,99,.14); color: #F4C463; font-size: 12px; font-weight: 700;">Relance</span></sc-if>
<sc-if value="{{aSousTitres}}" hint-placeholder-val="{{ true }}"><p style="font-size: 21px; font-weight: 600; line-height: 1.35;">« {{q.q}} »</p></sc-if>
<sc-if value="{{vousParlez}}" hint-placeholder-val="{{ false }}"><div style="margin-top: 14px;">%ONDE%</div></sc-if>
<sc-if value="{{aTrans}}" hint-placeholder-val="{{ false }}"><p style="margin-top: 8px; font-size: 13.5px; line-height: 1.5; color: #B9CBC6; text-align: left; max-height: 62px; overflow: hidden;">{{transLive}}<span class="curseur"></span></p></sc-if>
</div>
<div style="position: absolute; left: 20px; right: 20px; bottom: 30px;">
<div style="display: flex; justify-content: space-around; margin-bottom: 18px;">
<button onClick="{{repeter}}" class="rond"><span>%REPETER%</span>Répéter</button>
<button onClick="{{indice}}" class="rond"><span>%AMPOULE%</span>Indice</button>
<button onClick="{{basculerMuet}}" class="rond"><span>%SON%</span>{{muetT}}</button>
</div>
<sc-if value="{{orbiParle}}" hint-placeholder-val="{{ true }}"><button onClick="{{repondre}}" class="bs">Répondre maintenant</button></sc-if>
<sc-if value="{{vousParlez}}" hint-placeholder-val="{{ false }}"><button onClick="{{suivante}}" class="bp">{{finiT}}</button></sc-if>
</div>
</div></sc-if>

<sc-if value="{{ecrit}}" hint-placeholder-val="{{ false }}"><div style="position: absolute; left: 0; right: 0; top: 160px; bottom: 0; display: flex; flex-direction: column; padding: 0 20px 30px;">
<div style="display: flex; gap: 10px; align-items: flex-start;">%ORBI32%<div style="flex: 1; padding: 14px 16px; border-radius: 4px 18px 18px 18px; background: #13282C; font-size: 16px; font-weight: 600; line-height: 1.4;">{{q.q}}</div></div>
<button onClick="{{indice}}" style="align-self: flex-start; margin: 10px 0 0 42px; font-size: 13.5px; font-weight: 700; color: #5FE0B8; min-height: 36px;">Un indice ?</button>
<textarea value="{{rep}}" onChange="{{ecrireRep}}" aria-label="Votre réponse" placeholder="Écrivez votre réponse comme vous la diriez…" style="flex: 1; margin-top: 12px; width: 100%; border-radius: 18px; background: #13282C; border: 1px solid rgba(255,255,255,.12); padding: 16px; font: inherit; font-size: 15px; line-height: 1.5; color: #F2EDE5; resize: none; outline: 0;">{{rep}}</textarea>
<div style="display: flex; align-items: center; gap: 12px; margin-top: 12px;"><span class="meta" style="flex: 1;">{{nMots}} · visez 60 à 120</span><button onClick="{{envoyerEcrit}}" class="bp" style="width: auto; padding: 0 26px;">Envoyer</button></div>
</div></sc-if>

<sc-if value="{{pause}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; z-index: 8; display: flex; align-items: center; justify-content: center; padding: 0 30px;">
<span class="voile" style="pointer-events: none;"></span>
<div style="position: relative; width: 100%; padding: 24px 20px 20px; border-radius: 24px; background: #13282C; text-align: center; animation: entre .25s ease-out both;">
<b style="display: block; font-size: 20px;">En pause</b><p class="meta" style="margin-top: 6px;">Le chrono est arrêté.</p>
<button onClick="{{reprendre}}" class="bp" style="margin-top: 18px;">Reprendre</button>
<button onClick="{{recommencerQ}}" class="bs" style="margin-top: 10px;">Recommencer la question</button>
<button onClick="{{demanderQuitter}}" style="margin-top: 12px; width: 100%; height: 40px; text-align: center; font-size: 14.5px; font-weight: 700; color: #F08A7C;">Arrêter la simulation</button>
</div>
</div>
</sc-if>
</div>
</sc-if>

<!-- ============ ANALYSE ============ -->
<sc-if value="{{vAnalyse}}" hint-placeholder-val="{{ false }}">
<div class="pg" style="display: flex; flex-direction: column; justify-content: center; padding: 0 20px;">
<span style="position: relative; display: block; width: 96px; height: 96px; margin: 0 auto;"><span class="halo"></span><span class="halo b"></span><span style="position: absolute; inset: 0;">%ORBI96%</span></span>
<h1 class="h1" style="margin-top: 24px; text-align: center;">Orbi analyse vos réponses</h1>
<div style="margin-top: 22px; padding: 6px 16px; border-radius: 18px; background: #13282C;">%ETAPES_AN%</div>
</div>
</sc-if>

<!-- ============ BILAN ============ -->
<sc-if value="{{vBilan}}" hint-placeholder-val="{{ false }}">
<div class="pg scroll" style="padding-bottom: 40px;">
<div class="barreh" style="justify-content: space-between;">
<sc-if value="{{bilanRetourNormal}}" hint-placeholder-val="{{ true }}"><a href="{{finHref}}" class="retour" aria-label="Fermer et revenir">%CROIX22%</a></sc-if>
<sc-if value="{{bilanRetourHist}}" hint-placeholder-val="{{ false }}">%BK_HIST%</sc-if>
<span class="meta" style="padding-right: 20px;">Privé · vous seule</span>
</div>
<div style="padding: 0 20px; text-align: center;">
<span style="position: relative; display: block; width: 124px; height: 124px; margin: 0 auto;"><svg width="124" height="124" viewBox="0 0 112 112" aria-hidden="true" style="position: absolute; inset: 0; transform: rotate(-90deg);"><circle cx="56" cy="56" r="52" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="6"></circle><circle cx="56" cy="56" r="52" fill="none" stroke="#A6F26B" stroke-width="6" stroke-linecap="round" stroke-dasharray="{{globalDash}}" style="animation: anneau 1.1s ease-out both;"></circle></svg>
<span style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;"><b style="font-size: 34px; line-height: 1;">{{global}}</b><span class="meta">sur 100</span></span></span>
<h1 class="h1" style="margin-top: 14px;">Votre bilan</h1>
<p class="sous" style="margin-top: 4px;">{{bilanSous}}</p>
</div>
<div style="padding: 0 20px;">
<div style="margin-top: 20px; display: flex; flex-direction: column; gap: 16px;"><sc-for list="{{crit}}" as="c" hint-placeholder-count="4"><div><div style="display: flex; justify-content: space-between; font-size: 14.5px;"><b>{{c.t}}</b><b style="color: {{c.col}};">{{c.v}}</b></div><span class="barreC"><i style="width: {{c.pct}}; background: {{c.col}};"></i></span><p class="meta" style="margin-top: 6px; line-height: 1.45;">{{c.pq}}</p></div></sc-for></div>
<div style="margin-top: 22px; display: flex; flex-direction: column; gap: 8px;">
<div style="padding: 14px 16px; border-radius: 16px; background: rgba(166,242,107,.08);"><b style="font-size: 13px; color: #A6F26B;">Ce qui marche</b><p style="font-size: 14px; line-height: 1.45; margin-top: 6px;">{{fort1}}</p><p style="font-size: 14px; line-height: 1.45; margin-top: 4px;">{{fort2}}</p></div>
<div style="padding: 14px 16px; border-radius: 16px; background: rgba(244,196,99,.08);"><b style="font-size: 13px; color: #F4C463;">À travailler avant jeudi</b><p style="font-size: 14px; line-height: 1.45; margin-top: 6px;">{{mieux1}}</p><p style="font-size: 14px; line-height: 1.45; margin-top: 4px;">{{mieux2}}</p></div>
</div>
<p class="gr">Question par question</p>
<sc-for list="{{liste}}" as="l" hint-placeholder-count="6"><button onClick="{{l.ouvrir}}" class="ligne" style="align-items: flex-start;"><span class="meta" style="width: 18px; font-weight: 700; padding-top: 1px;">{{l.n}}</span><span style="flex: 1; font-size: 14.5px; line-height: 1.4;">{{l.t}}</span><b style="font-size: 14px; color: {{l.col}};">{{l.s}}</b>%CHEV%</button></sc-for>
<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 22px;">
<button onClick="{{refaireFaibles}}" class="bp">Refaire les 2 questions faibles</button>
<button onClick="{{enregistrer}}" class="bs">{{enregT}}</button>
<button onClick="{{recommencer}}" class="bs">Nouvelle simulation</button>
<a href="{{finHref}}" class="bs" style="border: 0;">Retour : {{finT}}</a>
</div>
</div>
</div>
</sc-if>

<!-- ============ DÉTAIL D’UNE RÉPONSE ============ -->
<sc-if value="{{vReponse}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0;">
<div class="pg scroll" style="padding-bottom: 150px;">
<div class="barreh">%BK_BILAN%</div>
<div style="padding: 4px 20px 0;">
<div style="display: flex; justify-content: space-between; align-items: center;"><span class="meta">Question {{detail.n}}</span><b style="font-size: 15px; color: {{detail.col}};">{{detail.s}} / 100</b></div>
<h1 style="font-size: 21px; font-weight: 700; line-height: 1.35; margin-top: 8px;">{{detail.q}}</h1>
<div style="margin-top: 18px; display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 18px; background: #13282C;">
<button onClick="{{basculerEcoute}}" aria-label="{{ecouteT}}" style="width: 44px; height: 44px; border-radius: 50%; background: #A6F26B; color: #0B1A1F; display: flex; align-items: center; justify-content: center; flex: none;">%LECTURE%</button>
<span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 14px;">{{ecouteT}}</b><span class="meta">{{detail.duree}}</span></span>
<sc-if value="{{ecoute}}" hint-placeholder-val="{{ false }}"><span style="transform: scale(.5); transform-origin: right center; width: 60px;">%ONDE%</span></sc-if>
</div>
<p class="gr">Ce que vous avez dit</p>
<p style="font-size: 14.5px; line-height: 1.55; color: #D5DEDB;">« {{detail.trans}} »</p>
<div style="margin-top: 18px; display: flex; flex-direction: column; gap: 8px;">
<div style="padding: 14px 16px; border-radius: 16px; background: rgba(166,242,107,.08);"><b style="font-size: 13px; color: #A6F26B;">Ce qui marche</b><p style="font-size: 14px; line-height: 1.45; margin-top: 6px;">{{detail.bien}}</p></div>
<div style="padding: 14px 16px; border-radius: 16px; background: rgba(244,196,99,.08);"><b style="font-size: 13px; color: #F4C463;">À améliorer</b><p style="font-size: 14px; line-height: 1.45; margin-top: 6px;">{{detail.mieux}}</p></div>
<div style="display: flex; gap: 10px; padding: 14px 16px; border-radius: 16px; background: #0F2A2A; border: 1px solid rgba(47,211,166,.35);">%ORBI28%<span><b style="font-size: 13px; color: #5FE0B8;">Conseil d’Orbi</b><p style="font-size: 14px; line-height: 1.45; margin-top: 4px;">{{detail.conseil}}</p></span></div>
</div>
</div>
</div>
<div class="bas">
<button onClick="{{refaireQ}}" class="bp">Refaire cette question</button>
<sc-if value="{{aSuivanteR}}" hint-placeholder-val="{{ true }}"><button onClick="{{suivanteR}}" class="bs" style="margin-top: 10px; border: 0; height: 40px;">Question suivante</button></sc-if>
</div>
</div>
</sc-if>

<!-- ============ HISTORIQUE ============ -->
<sc-if value="{{vHist}}" hint-placeholder-val="{{ false }}">
<div class="pg scroll">
<div class="barreh">%BK_REGLAGES%</div>
<div style="padding: 4px 20px 0;">
<h1 class="h1">Mes simulations</h1>
<p class="sous">Gardées 90 jours, visibles par vous seule.</p>
<div style="margin-top: 14px;"><sc-for list="{{hist}}" as="h" hint-placeholder-count="3"><button onClick="{{h.ouvrir}}" class="ligne"><span style="flex: 1;"><b style="display: block; font-size: 15px;">{{h.t}}</b><span class="meta">{{h.d}}</span></span><b style="font-size: 16px; color: {{h.col}};">{{h.s}}</b>%CHEV%</button></sc-for></div>
</div>
</div>
</sc-if>

<!-- ============ FEUILLES ============ -->
<sc-if value="{{fFormule}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{fermer}}" aria-label="Fermer" class="voile"></button>
<div class="feuille" style="text-align: center;"><span class="poignee"></span>
<span style="width: 64px; height: 64px; margin: 4px auto 0; border-radius: 50%; background: #2A2140; color: #E4D7FF; display: flex; align-items: center; justify-content: center;">%MICRO28%</span>
<b style="display: block; font-size: 18px; margin-top: 14px; line-height: 1.35;">{{formuleTitre}}</b>
<p style="font-size: 14px; color: #B9CBC6; line-height: 1.5; margin-top: 8px;">{{formuleD}}</p>
<a href="Carriere-abonnement.dc.html" class="bp" style="margin-top: 18px;">Voir les formules</a>
<sc-if value="{{essaiDispo}}" hint-placeholder-val="{{ true }}"><button onClick="{{garderEssai}}" class="annuler">Garder l’essai de 5 min</button></sc-if>
<button onClick="{{fermer}}" class="annuler" style="background: none;">Plus tard</button>
</div>
</div>
</sc-if>

<sc-if value="{{fMicro}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center;">
<span class="voile" style="pointer-events: none;"></span>
<div role="alertdialog" aria-label="Accès au micro" style="position: relative; width: 280px; border-radius: 18px; background: rgba(44,56,58,.96); text-align: center; overflow: hidden;">
<p style="padding: 20px 18px 6px; font-size: 16px; font-weight: 700; line-height: 1.35;">« Jumanly » souhaite accéder au micro</p>
<p style="padding: 0 18px 18px; font-size: 13px; color: #C9D6D2; line-height: 1.45;">Pour vos simulations d’entretien avec Orbi.</p>
<div style="display: flex; border-top: 1px solid rgba(255,255,255,.12);"><button onClick="{{refuserMicro}}" style="flex: 1; height: 48px; text-align: center; font-size: 15px; color: #8FD3FF;">Refuser</button><button onClick="{{autoriserMicro}}" style="flex: 1; height: 48px; text-align: center; font-size: 15px; font-weight: 700; color: #8FD3FF; border-left: 1px solid rgba(255,255,255,.12);">Autoriser</button></div>
</div>
</div>
</sc-if>

<sc-if value="{{fIndice}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{fermerIndice}}" aria-label="Fermer" class="voile"></button>
<div class="feuille"><span class="poignee"></span>
<div style="display: flex; align-items: center; gap: 12px;">%ORBI42%<span><b style="display: block; font-size: 17px;">Un indice</b><span class="meta">Le chrono continue</span></span></div>
<p style="font-size: 15.5px; line-height: 1.5; margin-top: 14px;">{{q.aide}}</p>
<p class="gr" style="margin-top: 18px;">La méthode STAR</p>
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
<span style="padding: 12px; border-radius: 14px; background: #1B3338; font-size: 13px;"><b style="color: #A6F26B;">S</b>ituation : où, quand</span>
<span style="padding: 12px; border-radius: 14px; background: #1B3338; font-size: 13px;"><b style="color: #A6F26B;">T</b>âche : votre rôle</span>
<span style="padding: 12px; border-radius: 14px; background: #1B3338; font-size: 13px;"><b style="color: #A6F26B;">A</b>ction : ce que vous faites</span>
<span style="padding: 12px; border-radius: 14px; background: #1B3338; font-size: 13px;"><b style="color: #A6F26B;">R</b>ésultat : un chiffre</span>
</div>
<button onClick="{{fermerIndice}}" class="annuler" style="background: #A6F26B; color: #0B1A1F;">Je réponds</button>
</div>
</div>
</sc-if>

<sc-if value="{{fQuitter}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; z-index: 12;">
<button onClick="{{continuerApres}}" aria-label="Fermer" class="voile"></button>
<div class="feuille"><span class="poignee"></span>
<b style="display: block; font-size: 18px; padding: 0 4px;">Arrêter la simulation ?</b>
<p style="font-size: 14px; color: #B9CBC6; line-height: 1.5; margin-top: 8px; padding: 0 4px;">{{quitterD}}</p>
<button onClick="{{finirMaintenant}}" class="bp" style="margin-top: 18px;">Voir le bilan de ces réponses</button>
<button onClick="{{quitter}}" class="annuler" style="color: #F08A7C;">Arrêter sans bilan</button>
<button onClick="{{continuerApres}}" class="annuler" style="background: none;">Continuer l’entretien</button>
</div>
</div>
</sc-if>

<sc-if value="{{aToast}}" hint-placeholder-val="{{ false }}">
<div role="status" style="position: absolute; left: 20px; right: 20px; top: 54px; z-index: 30; padding: 14px 16px; border-radius: 16px; background: #F2EDE5; color: #0B1A1F; font-size: 14px; font-weight: 600; box-shadow: 0 16px 30px -10px rgba(0,0,0,.7);">{{toast}}</div>
</sc-if>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='%PROPS%'>
%JS%
</script>
</body>
</html>
'''
PROPS = {
    'vue': {'editor': 'enum', 'options': ['choix', 'telechargement', 'micro', 'appel', 'analyse', 'bilan', 'reponse', 'historique'], 'default': 'choix'},
    'de': {'editor': 'enum', 'options': ['candidature', 'orbi', 'formation'], 'default': 'candidature'},
    'formule': {'editor': 'enum', 'options': ['Free', 'Starter', 'Pro', 'Premium'], 'default': 'Free'},
    'mode': {'editor': 'enum', 'options': ['vocal', 'ecrit'], 'default': 'vocal'},
    'duree': {'editor': 'number', 'default': 10},
    'focus': {'editor': 'enum', 'options': ['complet', 'experiences', 'technique', 'motivation', 'situation', 'pieges', 'anglais'], 'default': 'experiences'},
    'feuille': {'editor': 'enum', 'options': ['aucune', 'formule', 'micro', 'indice', 'quitter'], 'default': 'aucune'},
    'pret': {'editor': 'boolean', 'default': False}, 'dl': {'editor': 'number', 'default': 0},
    'micro': {'editor': 'boolean', 'default': False}, 'qi': {'editor': 'number', 'default': 0},
    'phase': {'editor': 'enum', 'options': ['orbi', 'vous'], 'default': 'orbi'},
    'pause': {'editor': 'boolean', 'default': False}, 'relance': {'editor': 'boolean', 'default': False},
    'repRempli': {'editor': 'boolean', 'default': False}, 'an': {'editor': 'number', 'default': 0},
    'ri': {'editor': 'number', 'default': 1}, 'essaiPris': {'editor': 'boolean', 'default': False},
    '$preview': {'width': 390, 'height': 844}
}
REP = {
    '%CSS%': CSS, '%BK_LIEN%': BK_LIEN, '%BK_REGLAGES%': BK('retourChoix', 'Réglages'), '%BK_QUESTIONS%': BK('retourDl', 'Questions'),
    '%BK_BILAN%': BK('retourBilan', 'Bilan'), '%BK_HIST%': BK('retourHist', 'Mes simulations'),
    '%ORBI28%': ORBI(28), '%ORBI32%': ORBI(32), '%ORBI42%': ORBI(42), '%ORBI96%': ORBI(96), '%ORBI132%': ORBI(132),
    '%CADENAS%': CADENAS, '%CHEV%': ico(CHEV, 18, '2', '#8FA39E'), '%CROIX22%': ico(CROIX, 22, '2'),
    '%PAUSE%': ico(PAUSE, 18, '2.4'), '%REPETER%': ico(REPETER, 22), '%AMPOULE%': ico(AMPOULE, 22), '%SON%': ico(SON, 22),
    '%MICRO28%': ico(MICRO, 28), '%LECTURE%': '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"></path></svg>',
    '%ONDE%': ONDE, '%ETAPES_DL%': etapes('etapesDl'), '%ETAPES_AN%': etapes('etapesAn'),
    '%TOGGLE_ST%': toggle('sousTitres', 'stBg', 'stX', 'basculerST', 'Afficher le texte des questions'),
    '%PROPS%': json.dumps(PROPS, ensure_ascii=False),
}
out = HTML
for k, v in REP.items():
    out = out.replace(k, v)
out = out.replace('%JS%', JS)
open(os.path.join(P, 'Entretien.dc.html'), 'w').write(out)

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
<dc-import name="Entretien" {attrs} hint-size="390px,844px"></dc-import>
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
PRO = {'formule': 'Pro'}
PAGES = [
    ('Entretien-ecrit.dc.html', 'Entretien · Par écrit, ouvert depuis Orbi', {'mode': 'ecrit', 'de': 'orbi'}),
    ('Entretien-oral-orbi.dc.html', 'Entretien · À l’oral, ouvert depuis Orbi', {'de': 'orbi'}),
    ('Entretien-formation.dc.html', 'Entretien · Ouvert depuis Formation', {'de': 'formation'}),
    ('Entretien-pro.dc.html', 'Entretien · Réglages en Pro : 10 min, expériences', PRO),
    ('Entretien-formule.dc.html', 'Entretien · Ce qui demande Pro', {'feuille': 'formule', 'duree': '5'}),
    ('Entretien-telechargement.dc.html', 'Entretien · Orbi télécharge les questions', {'vue': 'telechargement', 'dl': '2', **PRO}),
    ('Entretien-pret.dc.html', 'Entretien · Questions prêtes', {'vue': 'telechargement', 'pret': 'true', **PRO}),
    ('Entretien-micro.dc.html', 'Entretien · Test du micro', {'vue': 'micro', 'micro': 'true', **PRO}),
    ('Entretien-orbi-parle.dc.html', 'Entretien vocal · Orbi pose la question', {'vue': 'appel', 'qi': '1', **PRO}),
    ('Entretien-a-vous.dc.html', 'Entretien vocal · À vous, Orbi écoute', {'vue': 'appel', 'qi': '1', 'phase': 'vous', **PRO}),
    ('Entretien-relance.dc.html', 'Entretien vocal · Orbi relance', {'vue': 'appel', 'qi': '1', 'relance': 'true', **PRO}),
    ('Entretien-indice.dc.html', 'Entretien vocal · Indice', {'vue': 'appel', 'qi': '2', 'phase': 'vous', 'feuille': 'indice', **PRO}),
    ('Entretien-pause.dc.html', 'Entretien vocal · En pause', {'vue': 'appel', 'qi': '2', 'pause': 'true', **PRO}),
    ('Entretien-arreter.dc.html', 'Entretien vocal · Arrêter ?', {'vue': 'appel', 'qi': '3', 'pause': 'true', 'feuille': 'quitter', **PRO}),
    ('Entretien-ecrit-question.dc.html', 'Entretien écrit · Une question', {'vue': 'appel', 'mode': 'ecrit', 'qi': '1', 'phase': 'vous', 'repRempli': 'true', **PRO}),
    ('Entretien-analyse.dc.html', 'Entretien · Orbi analyse', {'vue': 'analyse', 'an': '1', **PRO}),
    ('Entretien-bilan.dc.html', 'Entretien · Bilan', {'vue': 'bilan', **PRO}),
    ('Entretien-reponse.dc.html', 'Entretien · Détail d’une réponse', {'vue': 'reponse', 'ri': '1', **PRO}),
    ('Entretien-historique.dc.html', 'Entretien · Mes simulations', {'vue': 'historique', **PRO}),
]
for fn, t, pr in PAGES:
    importer(fn, t, pr)
json.dump([[p[0], p[1]] for p in PAGES], open(os.path.join(D, 'entretien_pages.json'), 'w'), ensure_ascii=False)
print('ok', len(out))

# transitions douces (voir transitions_lib.py)
import transitions_lib as _tl
_p = os.path.join(P, "Entretien.dc.html")
_t = _tl.fix(open(_p).read())
open(_p, "w").write(_t)
