# Génère canvas/project/Accueil.dc.html (ouverture, logo animé, inscription, détails du profil) et ses artboards d’étape.
import os, json
D = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(D, 'canvas/project')
JS = open(os.path.join(D, 'accueil_logic.js')).read()

def ico(d, s=20, sw='1.8', col='currentColor'):
    return f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="{col}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{d}"></path></svg>'
ORBI = lambda s: (f'<svg width="{s}" height="{s}" viewBox="0 0 48 48" aria-hidden="true" style="flex: none;"><circle cx="24" cy="24" r="23" fill="#2FD3A6"></circle>'
                  '<path d="M23 10.5c1.3 7.4 5.6 11.8 13 13.1-7.4 1.3-11.7 5.7-13 13.1-1.3-7.4-5.6-11.8-13-13.1 7.4-1.3 11.7-5.7 13-13.1z" fill="#0B1A1F"></path>'
                  '<circle cx="35" cy="13" r="3.4" fill="#F2EDE5"></circle></svg>')
RETOUR = 'M15 5 8 12l7 7'
CROIX = 'M6 6l12 12M18 6 6 18'
CHEV = 'm9 6 6 6-6 6'
LOUPE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9FB3AE" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m20 20-4.4-4.4"></path></svg>'

# Logo officiel (identite-visuelle/logos) : symbole J + tête, logotype « jumanly » avec point lime
J_TRAIT = 'M70 55 V70 A19 19 0 0 1 33.15 76.50'
TYPE_D = open(os.path.join(D, 'logotype_path.txt')).read().strip()
def symbole(s, anim=''):
    c = lambda k: f' class="{k}"' if anim else ''
    return (f'<svg width="{s}" height="{s}" viewBox="0 0 120 120" aria-hidden="true" style="display: block; overflow: visible;">'
            f'<rect{c(anim + "-carre")} width="120" height="120" rx="30" fill="#A6F26B"></rect>'
            f'<g transform="translate(2.25 -4.35) scale(1.1)"><path{c(anim + "-trait")} d="{J_TRAIT}" fill="none" stroke="#0F3F37" stroke-width="17" stroke-linecap="round" stroke-dasharray="72"></path>'
            f'<circle{c(anim + "-tete")} cx="70" cy="31" r="11.5" fill="#0F3F37"></circle></g></svg>')
def logotype(w, anim=''):
    h = round(w * 997 / 3945, 1)
    pt = f' class="{anim}-point"' if anim else ''
    return (f'<svg width="{w}" height="{h}" viewBox="-8 -773 3945 997" aria-label="jumanly" role="img" style="display: block; overflow: visible;">'
            f'<path d="{TYPE_D}" fill="#F2EDE5"></path><circle{pt} cx="166.5" cy="-687.5" r="89" fill="#A6F26B"></circle></svg>')
def lockup(sym, w):
    return f'<span style="display: inline-flex; align-items: center; gap: {round(sym*0.32)}px;">{symbole(sym)}{logotype(w)}</span>'

GOOGLE = '<span class="fo" style="background: #FFFFFF; color: #4285F4; font-size: 14px; font-weight: 800; border-radius: 50%;">G</span>'
APPLE = ('<span class="fo"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#F2EDE5" d="M16.5 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.5-3.7zM14.3 5.8c.6-.8 1.1-1.8 1-2.8-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.7-1 2.7 1 .1 2-.5 2.7-1.3z"></path></svg></span>')
LINKEDIN = '<span class="fo" style="background: #0A66C2; color: #FFFFFF; font-size: 12px; font-weight: 800; border-radius: 5px;">in</span>'

CSS = '''
body{margin:0;background:#050D10}
a{color:#A6F26B;text-decoration:none}
.fd,.fd *{box-sizing:border-box}
.fd{font-family:"Sora",system-ui,sans-serif;color:#F2EDE5;-webkit-font-smoothing:antialiased}
.fd h1,.fd h2,.fd h3,.fd p{margin:0}
.fd button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:left}
.fd .scroll{scrollbar-width:none}.fd .scroll::-webkit-scrollbar{display:none}
.fd .pg{position:absolute;inset:0;overflow-y:auto;animation:entre .35s ease-out both}
.fd .meta{font-size:13px;color:#8FA39E}
.fd .h1{font-size:28px;font-weight:700;letter-spacing:-0.02em;line-height:1.2}
.fd .sous{font-size:15px;line-height:1.5;color:#B9CBC6;margin-top:10px}
.fd .bp{display:flex;align-items:center;justify-content:center;width:100%;height:54px;border-radius:27px;background:#A6F26B;color:#0B1A1F;font-size:15.5px;font-weight:700;text-align:center}
.fd .bs{display:flex;align-items:center;justify-content:center;width:100%;height:54px;border-radius:27px;border:1px solid rgba(255,255,255,.2);font-size:15px;font-weight:600;text-align:center;color:#F2EDE5}
.fd .bf{display:flex;align-items:center;gap:12px;width:100%;height:54px;padding:0 18px;border-radius:27px;border:1px solid rgba(255,255,255,.16);font-size:15px;font-weight:600}
.fd .bf b{flex:1;text-align:center;font-weight:600;margin-right:22px}
.fd .fo{width:22px;height:22px;display:flex;align-items:center;justify-content:center;flex:none}
.fd .lab{display:block;font-size:13px;font-weight:600;color:#B9CBC6;margin:0 0 8px 4px}
.fd .in{width:100%;height:54px;border-radius:16px;background:#13282C;border:1px solid rgba(255,255,255,.12);padding:0 16px;font:inherit;font-size:16px;color:#F2EDE5;outline:0}
.fd .in:focus{border-color:#A6F26B}
.fd .in::placeholder{color:#6F8580}
.fd .erreur{font-size:13px;color:#FFB4A8;margin:8px 4px 0}
.fd .lien{font-size:14px;font-weight:700;color:#A6F26B;min-height:40px;display:inline-flex;align-items:center}
.fd .barreh{padding:50px 12px 0;display:flex;align-items:center;gap:8px;min-height:94px}
.fd .retour{width:44px;height:44px;display:flex;align-items:center;justify-content:center;flex:none;color:#F2EDE5}
.fd .chip{height:40px;padding:0 16px;border-radius:20px;font-size:14px;font-weight:500;white-space:nowrap;display:inline-flex;align-items:center;flex:none}
.fd .ligne{width:100%;display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.07);color:#F2EDE5}
.fd .bas{position:absolute;left:0;right:0;bottom:0;padding:16px 20px 30px;background:linear-gradient(180deg,rgba(11,26,31,0) 0,#0B1A1F 22px);z-index:3}
.fd .voile{position:absolute;inset:0;width:100%;background:rgba(0,0,0,.6)}
.fd .feuille{position:absolute;left:0;right:0;bottom:0;background:#13282C;border-radius:30px 30px 0 0;padding:10px 20px 28px;border-top:1px solid rgba(255,255,255,.08);animation:monte .28s ease-out both}
.fd .poignee{display:block;width:40px;height:5px;border-radius:3px;background:rgba(255,255,255,.2);margin:0 auto 14px}
.fd .opt{width:100%;display:flex;align-items:center;gap:14px;min-height:60px;padding:10px 4px;border-bottom:1px solid rgba(255,255,255,.06);font-size:15px;font-weight:600;color:#F2EDE5}
.fd .opt small{display:block;font-size:12.5px;font-weight:400;color:#8FA39E;margin-top:2px}
.fd .annuler{width:100%;height:50px;margin-top:12px;border-radius:999px;background:#1B3338;text-align:center;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center}
.fd .q{width:100%;padding:14px 16px;border-radius:16px;background:#1B3338;font-size:14px;font-weight:600}
.fd .av{width:40px;height:40px;border-radius:50%;background:#A6F26B;color:#0B1A1F;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none}
.fd .flag{width:30px;height:21px;border-radius:4px;flex:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}
.fd .tag{font-size:12.5px;padding:5px 9px;border-radius:7px;background:#1A2629;color:#C9D6D2}
@keyframes entre{from{opacity:.4;transform:scale(.975)}to{opacity:1;transform:none}}
@keyframes monte{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}
@keyframes flotte{0%,100%{transform:translateY(0) rotate(var(--r,0deg))}50%{transform:translateY(-8px) rotate(var(--r,0deg))}}
.fd .flotte{animation:flotte 5s ease-in-out infinite}
.fd .flotte2{animation:flotte 6s ease-in-out -2s infinite}

/* ===== Ouverture : le logo s’anime ===== */
.fd .spl{position:absolute;inset:0;background:#0B1A1F;overflow:hidden}
.fd .halo{position:absolute;left:50%;top:416px;width:420px;height:420px;margin:-210px 0 0 -210px;border-radius:50%;background:radial-gradient(circle,rgba(166,242,107,.22) 0,rgba(166,242,107,0) 62%);animation:halo 2.6s ease-out .5s both}
@keyframes halo{0%{transform:scale(.3);opacity:0}45%{opacity:1}100%{transform:scale(1.15);opacity:.45}}
.fd .lgs{position:absolute;left:0;top:0;width:72px;height:72px;animation:glisse .62s cubic-bezier(.65,0,.35,1) 1.35s both}
@keyframes glisse{from{transform:translateX(118px)}to{transform:none}}
.fd .lgs-in{width:72px;height:72px;animation:carre .62s cubic-bezier(.34,1.56,.64,1) both}
@keyframes carre{0%{transform:scale(0) rotate(-14deg)}65%{transform:scale(1.08) rotate(2deg)}100%{transform:none}}
.fd .lg-trait{animation:trait .55s ease-out .35s both}
@keyframes trait{from{stroke-dashoffset:72}to{stroke-dashoffset:0}}
.fd .lg-tete{animation:tete .55s cubic-bezier(.34,1.56,.64,1) .82s both}
@keyframes tete{0%{transform:translateY(-70px);opacity:0}55%{opacity:1}100%{transform:none;opacity:1}}
.fd .lgt{position:absolute;left:86px;top:8px;animation:texte .6s cubic-bezier(.22,1,.36,1) 1.55s both}
@keyframes texte{from{clip-path:inset(0 100% 0 0);transform:translateX(-14px);opacity:0}to{clip-path:inset(0 0 0 0);transform:none;opacity:1}}
.fd .lg-point{transform-box:fill-box;transform-origin:center;animation:point .45s cubic-bezier(.34,1.56,.64,1) 2.1s both}
@keyframes point{0%{transform:scale(0)}70%{transform:scale(1.4)}100%{transform:scale(1)}}
.fd .slogan{position:absolute;left:0;right:0;top:486px;text-align:center;font-size:17px;font-weight:500;color:#B9CBC6;letter-spacing:.01em}
.fd .slogan span{display:inline-block;animation:mot .5s ease-out both}
.fd .slogan span:nth-child(1){animation-delay:2.4s}.fd .slogan span:nth-child(2){animation-delay:2.6s;color:#F2EDE5}.fd .slogan span:nth-child(3){animation-delay:2.8s;color:#A6F26B}
@keyframes mot{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.fd .porteur{position:absolute;left:0;right:0;bottom:46px;text-align:center;font-size:12.5px;color:#6F8580;animation:mot .6s ease-out 3s both}
.fd .court{position:absolute;left:159px;top:380px;width:72px;height:72px}
.fd .court .lgs-in{animation-duration:.5s}
.fd .court .lg-trait{animation-delay:.25s;animation-duration:.4s}
.fd .court .lg-tete{animation-delay:.55s;animation-duration:.45s}
.fd .onde{position:absolute;inset:0;border-radius:22px;border:2px solid #A6F26B;animation:onde .9s ease-out 1s both}
@keyframes onde{from{transform:scale(1);opacity:.8}to{transform:scale(1.9);opacity:0}}
@media (prefers-reduced-motion: reduce){.fd *,.fd *::before{animation-duration:.01ms!important;animation-delay:0s!important}}
'''

def page(contenu):
    return contenu

H_RETOUR = lambda act, label='Retour': f'<button onClick="{{{{{act}}}}}" class="retour" aria-label="{label}">{ico(RETOUR, 22, "2")}</button>'

def toggle(val, bg, x, act, label):
    return (f'<button onClick="{{{{{act}}}}}" role="switch" aria-checked="{{{{{val}}}}}" aria-label="{label}" style="width: 48px; height: 28px; border-radius: 14px; background: {{{{{bg}}}}}; position: relative; flex: none;">'
            f'<span style="position: absolute; left: 4px; top: 4px; width: 20px; height: 20px; border-radius: 50%; background: #0B1A1F; transform: translateX({{{{{x}}}}}); transition: transform .2s;"></span></button>')

SPLASH_LONG = ('<div class="spl"><span class="halo"></span>'
    '<div style="position: absolute; left: 41px; top: 380px; width: 308px; height: 72px;">'
    '<div class="lgs"><div class="lgs-in">' + symbole(72, 'lg') + '</div></div>'
    '<div class="lgt">' + logotype(222, 'lg') + '</div></div>'
    '<p class="slogan"><span>Learn.</span> <span>Grow.</span> <span>Connect.</span></p>'
    '<p class="porteur">Une plateforme développée par The Growth Lab</p></div>')
SPLASH_COURT = ('<div class="spl"><span class="halo" style="animation-delay: .2s; animation-duration: 1.4s;"></span>'
    '<div class="court"><span class="onde"></span><div class="lgs-in">' + symbole(72, 'lg') + '</div></div></div>')

HTML = '''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Jumanly Modèle B · Ouverture et inscription</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet">
<style>%CSS%</style>
</helmet>
<div class="fd" style="width: 390px; height: 844px; position: relative; overflow: hidden; background: #0B1A1F; border-radius: 44px;">

<!-- ============ OUVERTURE : logo animé (deux copies pour rejouer) ============ -->
<sc-if value="{{vOuverture}}" hint-placeholder-val="{{ true }}">
<div style="position: absolute; inset: 0;" role="img" aria-label="Jumanly, Learn. Grow. Connect.">
<sc-if value="{{longA}}" hint-placeholder-val="{{ true }}">%SPLASH_LONG%</sc-if>
<sc-if value="{{longB}}" hint-placeholder-val="{{ false }}">%SPLASH_LONG%</sc-if>
<sc-if value="{{courtA}}" hint-placeholder-val="{{ false }}">%SPLASH_COURT%</sc-if>
<sc-if value="{{courtB}}" hint-placeholder-val="{{ false }}">%SPLASH_COURT%</sc-if>
</div>
</sc-if>

<!-- ============ BIENVENUE ============ -->
<sc-if value="{{vBienvenue}}" hint-placeholder-val="{{ false }}">
<div class="pg" style="overflow: hidden;">
<div style="position: absolute; left: 0; right: 0; top: 58px; display: flex; justify-content: center;">%LOCK_PETIT%</div>
<button onClick="{{suivantSlide}}" aria-label="Écran suivant" style="position: absolute; left: 0; right: 0; top: 104px; height: 400px; display: block;">

<sc-if value="{{s0}}" hint-placeholder-val="{{ true }}">
<span style="position: absolute; inset: 0; animation: entre .45s ease-out both;">
<span class="flotte" style="--r: -4deg; position: absolute; left: 64px; top: 40px; width: 262px; border-radius: 18px; overflow: hidden; border: 1px solid rgba(255,255,255,.16); background: #0B1A1F; box-shadow: 0 30px 60px -20px rgba(0,0,0,.8);">
<span style="height: 124px; background: #B07A12; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;"><svg viewBox="0 0 272 126" preserveAspectRatio="xMidYMid slice" style="position: absolute; inset: 0; width: 100%; height: 100%;" aria-hidden="true"><g fill="none" stroke="#FFFFFF" stroke-opacity=".2" stroke-width="22"><circle cx="20" cy="63" r="62"></circle><circle cx="252" cy="63" r="62"></circle></g></svg><span style="position: relative; width: 78px; height: 78px; border-radius: 22px; background: #FFFFFF; color: #B07A12; font-size: 26px; font-weight: 700; display: flex; align-items: center; justify-content: center;">BI</span></span>
<span style="display: block; padding: 14px 16px 16px;"><b style="display: block; font-size: 16px; font-weight: 600;">Power BI : les bases</b><span class="meta" style="display: block; margin-top: 4px;">Leçon 3 sur 8 · 1 h 10</span>
<span style="display: block; height: 4px; border-radius: 2px; background: rgba(255,255,255,.1); margin-top: 12px; overflow: hidden;"><i style="display: block; width: 25%; height: 100%; background: #A6F26B;"></i></span>
<span style="display: flex; gap: 6px; margin-top: 12px;"><span class="tag">Débutant</span><span class="tag" style="background: rgba(166,242,107,.14); color: #A6F26B; font-weight: 700;">Gratuit</span></span></span></span>
<span class="flotte2" style="--r: 5deg; position: absolute; right: 26px; top: 300px; display: flex; align-items: center; gap: 10px; padding: 12px 16px 12px 12px; border-radius: 18px; background: #13282C; border: 1px solid rgba(255,255,255,.1); box-shadow: 0 20px 40px -16px rgba(0,0,0,.8);"><span style="width: 34px; height: 34px; border-radius: 50%; background: #A6F26B; color: #0B1A1F; display: flex; align-items: center; justify-content: center;">%CHECK%</span><span><b style="display: block; font-size: 14px;">SQL pour l’analyse</b><span class="meta">Attestation obtenue</span></span></span>
</span>
</sc-if>

<sc-if value="{{s1}}" hint-placeholder-val="{{ false }}">
<span style="position: absolute; inset: 0; animation: entre .45s ease-out both;">
<span class="flotte" style="--r: -2deg; position: absolute; left: 56px; top: 34px; width: 278px; padding: 26px 20px 22px; border-radius: 24px; background: #13282C; border: 1px solid rgba(255,255,255,.1); text-align: center; box-shadow: 0 30px 60px -20px rgba(0,0,0,.8);">
<span style="position: relative; display: block; width: 112px; height: 112px; margin: 0 auto;"><svg width="112" height="112" viewBox="0 0 112 112" aria-hidden="true" style="position: absolute; inset: 0; transform: rotate(-90deg);"><circle cx="56" cy="56" r="52" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="5"></circle><circle cx="56" cy="56" r="52" fill="none" stroke="#A6F26B" stroke-width="5" stroke-linecap="round" stroke-dasharray="228.7 326.7"></circle></svg>
<img src="{{photo}}" alt="Grâce Mbuyi" style="position: absolute; left: 10px; top: 10px; width: 92px; height: 92px; border-radius: 50%; object-fit: cover;"></span>
<b style="display: block; font-size: 18px; margin-top: 14px;">Grâce Mbuyi</b><span class="meta" style="display: block; margin-top: 4px;">Cap · Analyste de données</span>
<span style="display: inline-block; margin-top: 12px; padding: 6px 12px; border-radius: 14px; background: rgba(166,242,107,.14); color: #A6F26B; font-size: 13px; font-weight: 700;">Profil complété à 70 %</span></span>
<span class="flotte2" style="--r: -3deg; position: absolute; left: 22px; top: 312px; width: 270px; display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 18px; background: #0F2A2A; border: 1px solid rgba(47,211,166,.4); box-shadow: 0 20px 40px -16px rgba(0,0,0,.8);">%ORBI30%<span style="font-size: 13.5px; line-height: 1.45;">Ajoutez une réalisation : votre profil gagne 12 points.</span></span>
</span>
</sc-if>

<sc-if value="{{s2}}" hint-placeholder-val="{{ false }}">
<span style="position: absolute; inset: 0; animation: entre .45s ease-out both;">
<span class="flotte" style="--r: 3deg; position: absolute; left: 64px; top: 30px; width: 262px; border-radius: 18px; overflow: hidden; border: 1px solid rgba(255,255,255,.16); background: #0B1A1F; box-shadow: 0 30px 60px -20px rgba(0,0,0,.8);">
<span style="height: 120px; background: #0F3F37; display: flex; align-items: center; justify-content: center;"><span style="width: 74px; height: 74px; border-radius: 20px; background: #FFFFFF; color: #0F3F37; font-size: 24px; font-weight: 800; display: flex; align-items: center; justify-content: center;">BF</span></span>
<span style="display: block; padding: 14px 16px 16px;"><b style="display: block; font-size: 16px; font-weight: 600;">Analyste de données junior</b><span style="display: block; margin-top: 4px; font-size: 13px; color: #B9CBC6;">Baobab Fintech · KINSHASA</span>
<span style="display: flex; gap: 6px; margin-top: 12px;"><span class="tag">CDI</span><span class="tag">Hybride</span><span class="tag" style="background: rgba(166,242,107,.14); color: #A6F26B; font-weight: 700;">86 % pour vous</span></span></span></span>
<span class="flotte2" style="--r: -2deg; position: absolute; left: 30px; top: 296px; width: 300px; display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 18px; background: #13282C; border: 1px solid rgba(255,255,255,.1); box-shadow: 0 20px 40px -16px rgba(0,0,0,.8);"><span class="av" style="width: 34px; height: 34px; font-size: 12px; background: #0F3F37; color: #A6F26B;">NK</span><span><b style="display: block; font-size: 13px;">Nadia Kalala · Baobab Fintech</b><span style="display: block; font-size: 13.5px; line-height: 1.4; margin-top: 3px; color: #D5DEDB;">Votre profil nous intéresse. Êtes-vous disponible jeudi ?</span></span></span>
</span>
</sc-if>
</button>

<div style="position: absolute; left: 24px; right: 24px; top: 506px;">
<p style="font-size: 12.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #A6F26B;">{{sl.mot}}</p>
<h1 style="font-size: 26px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.22; margin-top: 8px;">{{sl.t}}</h1>
<p class="sous" style="margin-top: 8px;">{{sl.d}}</p>
</div>
<div style="position: absolute; left: 18px; top: 650px; display: flex; gap: 6px;"><sc-for list="{{points}}" as="d" hint-placeholder-count="3"><button onClick="{{d.pick}}" aria-label="{{d.t}}" style="height: 24px; display: flex; align-items: center;"><span style="display: block; width: {{d.w}}; height: 7px; border-radius: 4px; background: {{d.bg}}; transition: width .25s;"></span></button></sc-for></div>
<div style="position: absolute; left: 20px; right: 20px; bottom: 30px; display: flex; flex-direction: column; gap: 10px;">
<button onClick="{{versInscription}}" class="bp">Créer un compte</button>
<button onClick="{{versConnexion}}" class="bs">Se connecter</button>
</div>
</div>
</sc-if>

<!-- ============ INSCRIPTION ============ -->
<sc-if value="{{vInscription}}" hint-placeholder-val="{{ false }}">
<div class="pg scroll" style="padding-bottom: 30px;">
<div class="barreh">%BK_BIENV%</div>
<div style="padding: 4px 20px 0;">
<h1 class="h1">Créer votre compte</h1>
<p class="sous">Gratuit. Trois minutes suffisent.</p>
<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 28px;">
<button onClick="{{google}}" class="bf">%GOOGLE%<b>Continuer avec Google</b></button>
<button onClick="{{apple}}" class="bf">%APPLE%<b>Continuer avec Apple</b></button>
<button onClick="{{linkedin}}" class="bf">%LINKEDIN%<b>Continuer avec LinkedIn</b></button>
</div>
<div style="display: flex; align-items: center; gap: 12px; margin: 26px 0 22px;"><span style="flex: 1; height: 1px; background: rgba(255,255,255,.1);"></span><span class="meta">ou avec votre e-mail</span><span style="flex: 1; height: 1px; background: rgba(255,255,255,.1);"></span></div>
<label><span class="lab">Adresse e-mail</span><input class="in" type="email" value="{{email}}" onChange="{{ecrireEmail}}" placeholder="prenom.nom@gmail.com" aria-label="Adresse e-mail"></label>
<sc-if value="{{errEmail}}" hint-placeholder-val="{{ false }}"><p class="erreur">Entrez une adresse e-mail valide, par exemple grace.mbuyi@gmail.com.</p></sc-if>
<button onClick="{{continuerEmail}}" class="bp" style="margin-top: 16px; opacity: {{emailOp}};">Continuer</button>
<p style="text-align: center; margin-top: 20px; font-size: 14px; color: #B9CBC6;">Déjà inscrite ou inscrit ? <button onClick="{{versConnexion}}" class="lien">Se connecter</button></p>
<p style="text-align: center; margin-top: 18px; font-size: 12.5px; line-height: 1.6; color: #8FA39E;">En continuant, vous acceptez les <button onClick="{{legalCond}}" style="color: #F2EDE5; text-decoration: underline; font-size: 12.5px;">Conditions</button> et la <button onClick="{{legalConf}}" style="color: #F2EDE5; text-decoration: underline; font-size: 12.5px;">Politique de confidentialité</button>.</p>
</div>
</div>
</sc-if>

<!-- ============ CODE ============ -->
<sc-if value="{{vCode}}" hint-placeholder-val="{{ false }}">
<div class="pg scroll">
<div class="barreh">%BK_MODIF%</div>
<div style="padding: 4px 20px 0;">
<h1 class="h1">Vérifiez votre boîte mail</h1>
<p class="sous">Nous avons envoyé un code à 6 chiffres à <b style="color: #F2EDE5;">{{emailAff}}</b>.</p>
<label style="position: relative; display: flex; gap: 8px; margin-top: 30px;">
<sc-for list="{{cases}}" as="c" hint-placeholder-count="6"><span style="flex: 1; height: 62px; border-radius: 16px; background: #13282C; border: 1.5px solid {{c.bd}}; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 700;">{{c.c}}</span></sc-for>
<input value="{{code}}" onChange="{{ecrireCode}}" inputmode="numeric" autocomplete="one-time-code" aria-label="Code à 6 chiffres" style="position: absolute; inset: 0; width: 100%; opacity: 0; font-size: 16px; border: 0;">
</label>
<sc-if value="{{errCode}}" hint-placeholder-val="{{ false }}"><p class="erreur">Le code contient 6 chiffres.</p></sc-if>
<button onClick="{{remplirCode}}" style="margin-top: 16px; height: 44px; padding: 0 16px; border-radius: 22px; background: #1B3338; font-size: 14px; font-weight: 600;">Depuis Mail : 482 913</button>
<button onClick="{{verifier}}" class="bp" style="margin-top: 26px; opacity: {{codeOp}};">Vérifier</button>
<div style="display: flex; justify-content: space-between; margin-top: 14px;"><button onClick="{{renvoyer}}" class="lien">Renvoyer le code</button><button onClick="{{modifierEmail}}" class="lien" style="color: #F2EDE5;">Changer d’adresse</button></div>
<p class="meta" style="margin-top: 14px; line-height: 1.5;">Pas reçu ? Regardez dans les spams. Le code reste valable 10 minutes.</p>
</div>
</div>
</sc-if>

<!-- ============ MOT DE PASSE ============ -->
<sc-if value="{{vMdp}}" hint-placeholder-val="{{ false }}">
<div class="pg scroll">
<div class="barreh">%BK_CODE%</div>
<div style="padding: 4px 20px 0;">
<h1 class="h1">Choisissez un mot de passe</h1>
<p class="sous">Pour vous reconnecter avec {{emailAff}}.</p>
<label style="display: block; margin-top: 28px;"><span class="lab">Mot de passe</span>
<span style="position: relative; display: block;"><input class="in" type="{{typeMdp}}" value="{{mdp}}" onChange="{{ecrireMdp}}" aria-label="Mot de passe" style="padding-right: 92px;">
<button onClick="{{basculerMdp}}" style="position: absolute; right: 8px; top: 7px; height: 40px; padding: 0 12px; font-size: 13.5px; font-weight: 700; color: #A6F26B;">{{voirT}}</button></span></label>
<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 16px;">
<sc-for list="{{regles}}" as="r" hint-placeholder-count="3"><span style="display: flex; align-items: center; gap: 10px; font-size: 14px; color: {{r.col}};"><span style="width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid {{r.bd}}; background: {{r.bg}}; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800;">{{r.sym}}</span>{{r.t}}</span></sc-for>
</div>
<sc-if value="{{errMdp}}" hint-placeholder-val="{{ false }}"><p class="erreur">Votre mot de passe doit cocher les trois règles.</p></sc-if>
<button onClick="{{suggererMdp}}" style="margin-top: 20px; height: 44px; padding: 0 16px; border-radius: 22px; background: #1B3338; font-size: 14px; font-weight: 600;">Utiliser un mot de passe fort suggéré</button>
<button onClick="{{validerMdp}}" class="bp" style="margin-top: 26px; opacity: {{mdpOp}};">Créer mon compte</button>
</div>
</div>
</sc-if>

<!-- ============ CONNEXION ============ -->
<sc-if value="{{vConnexion}}" hint-placeholder-val="{{ false }}">
<div class="pg scroll" style="padding-bottom: 30px;">
<div class="barreh">%BK_BIENV%</div>
<div style="padding: 4px 20px 0;">
<h1 class="h1">Bon retour</h1>
<p class="sous">Connectez-vous pour retrouver votre Fil.</p>
<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 26px;">
<button onClick="{{google}}" class="bf">%GOOGLE%<b>Continuer avec Google</b></button>
<button onClick="{{apple}}" class="bf">%APPLE%<b>Continuer avec Apple</b></button>
<button onClick="{{linkedin}}" class="bf">%LINKEDIN%<b>Continuer avec LinkedIn</b></button>
</div>
<div style="display: flex; align-items: center; gap: 12px; margin: 24px 0 20px;"><span style="flex: 1; height: 1px; background: rgba(255,255,255,.1);"></span><span class="meta">ou</span><span style="flex: 1; height: 1px; background: rgba(255,255,255,.1);"></span></div>
<label><span class="lab">Adresse e-mail</span><input class="in" type="email" value="{{cEmail}}" onChange="{{ecrireCEmail}}" aria-label="Adresse e-mail"></label>
<label style="display: block; margin-top: 14px;"><span class="lab">Mot de passe</span><input class="in" type="password" value="{{cMdp}}" onChange="{{ecrireCMdp}}" aria-label="Mot de passe"></label>
<button onClick="{{trousseau}}" style="margin-top: 12px; width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 16px; background: #1B3338;"><span class="av" style="width: 34px; height: 34px; font-size: 12px;">GM</span><span style="flex: 1;"><b style="display: block; font-size: 14px;">grace.mbuyi@gmail.com</b><span class="meta">Mot de passe enregistré sur ce téléphone</span></span></button>
<sc-if value="{{errConn}}" hint-placeholder-val="{{ false }}"><p class="erreur">Entrez votre e-mail et votre mot de passe.</p></sc-if>
<div style="margin-top: 20px;">
<sc-if value="{{connOk}}" hint-placeholder-val="{{ false }}"><a href="Fil.dc.html" class="bp">Se connecter</a></sc-if>
<sc-if value="{{connPas}}" hint-placeholder-val="{{ true }}"><button onClick="{{refuserConn}}" class="bp" style="opacity: .45;">Se connecter</button></sc-if>
</div>
<div style="display: flex; justify-content: space-between; margin-top: 12px;"><button onClick="{{versOubli}}" class="lien" style="color: #F2EDE5;">Mot de passe oublié ?</button><button onClick="{{versInscription}}" class="lien">Créer un compte</button></div>
</div>
</div>
</sc-if>

<!-- ============ MOT DE PASSE OUBLIÉ ============ -->
<sc-if value="{{vOubli}}" hint-placeholder-val="{{ false }}">
<div class="pg scroll">
<div class="barreh">%BK_CONN%</div>
<div style="padding: 4px 20px 0;">
<sc-if value="{{oPas}}" hint-placeholder-val="{{ true }}"><div>
<h1 class="h1">Mot de passe oublié</h1>
<p class="sous">Nous vous envoyons un lien pour en choisir un nouveau.</p>
<label style="display: block; margin-top: 28px;"><span class="lab">Adresse e-mail</span><input class="in" type="email" value="{{oEmail}}" onChange="{{ecrireOEmail}}" placeholder="prenom.nom@gmail.com" aria-label="Adresse e-mail"></label>
<sc-if value="{{errOubli}}" hint-placeholder-val="{{ false }}"><p class="erreur">Entrez l’adresse de votre compte.</p></sc-if>
<button onClick="{{envoyerLien}}" class="bp" style="margin-top: 18px;">Envoyer le lien</button>
</div></sc-if>
<sc-if value="{{oEnvoye}}" hint-placeholder-val="{{ false }}"><div style="padding-top: 60px; text-align: center;">
<span style="width: 76px; height: 76px; margin: 0 auto; border-radius: 50%; background: rgba(166,242,107,.14); color: #A6F26B; display: flex; align-items: center; justify-content: center;">%MAIL%</span>
<h1 class="h1" style="margin-top: 22px;">Lien envoyé</h1>
<p class="sous">Ouvrez le message envoyé à <b style="color: #F2EDE5;">{{oEmailAff}}</b> depuis ce téléphone. Le lien reste valable 30 minutes.</p>
<button onClick="{{versConnexion}}" class="bp" style="margin-top: 30px;">Revenir à la connexion</button>
<button onClick="{{renvoyerLien}}" class="lien" style="margin-top: 10px;">Renvoyer le lien</button>
</div></sc-if>
</div>
</div>
</sc-if>

<!-- ============ DÉTAILS DU PROFIL ============ -->
<sc-if value="{{vProfil}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0;">
<div class="barreh" style="gap: 10px; padding-right: 20px;">%BK_PREC%
<div style="flex: 1; display: flex; gap: 5px;"><sc-for list="{{barres}}" as="b" hint-placeholder-count="6"><span style="flex: 1; height: 4px; border-radius: 2px; background: {{b.bg}}; transition: background .3s;"></span></sc-for></div>
<sc-if value="{{aPasser}}" hint-placeholder-val="{{ false }}"><button onClick="{{passer}}" style="height: 44px; padding: 0 2px 0 8px; font-size: 14px; font-weight: 600; color: #B9CBC6;">Passer</button></sc-if>
</div>
<div class="scroll" style="position: absolute; left: 0; right: 0; top: 94px; bottom: 0; overflow-y: auto; padding: 14px 20px 150px;">
<p class="meta">{{etapeT}}</p>

<sc-if value="{{e1}}" hint-placeholder-val="{{ true }}"><div style="animation: entre .35s ease-out both;">
<h1 class="h1" style="margin-top: 8px;">Comment vous appelez-vous ?</h1>
<p class="sous">C’est le nom que verront les recruteurs.</p>
<sc-if value="{{viaFour}}" hint-placeholder-val="{{ false }}"><p style="margin-top: 14px; font-size: 13.5px; color: #5FE0B8;">Repris de votre compte {{fourT}}. Vous pouvez le corriger.</p></sc-if>
<label style="display: block; margin-top: 24px;"><span class="lab">Prénom</span><input class="in" value="{{prenom}}" onChange="{{ecrirePrenom}}" aria-label="Prénom" placeholder="Grâce"></label>
<label style="display: block; margin-top: 14px;"><span class="lab">Nom</span><input class="in" value="{{nom}}" onChange="{{ecrireNom}}" aria-label="Nom" placeholder="Mbuyi"></label>
</div></sc-if>

<sc-if value="{{e2}}" hint-placeholder-val="{{ false }}"><div style="animation: entre .35s ease-out both;">
<h1 class="h1" style="margin-top: 8px;">Ajoutez une photo</h1>
<p class="sous">Un visage net, un fond simple. Les recruteurs vous reconnaissent plus vite.</p>
<div style="display: flex; justify-content: center; margin-top: 34px;">
<sc-if value="{{sansPhoto}}" hint-placeholder-val="{{ true }}"><button onClick="{{prendrePhoto}}" aria-label="Ajouter une photo" style="width: 168px; height: 168px; border-radius: 50%; border: 2px dashed rgba(255,255,255,.25); background: #13282C; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;"><span style="font-size: 40px; font-weight: 700; color: #8FA39E;">{{ini}}</span><span style="font-size: 13px; font-weight: 700; color: #A6F26B;">Ajouter</span></button></sc-if>
<sc-if value="{{aPhoto}}" hint-placeholder-val="{{ false }}"><button onClick="{{prendrePhoto}}" aria-label="Changer la photo" style="position: relative; width: 168px; height: 168px; border-radius: 50%; animation: entre .4s ease-out both;"><img src="{{photo}}" alt="Votre photo" style="width: 168px; height: 168px; border-radius: 50%; object-fit: cover; box-shadow: 0 0 0 4px #0B1A1F, 0 0 0 6px #A6F26B;"></button></sc-if>
</div>
<sc-if value="{{aPhoto}}" hint-placeholder-val="{{ false }}"><div style="margin-top: 26px; display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 16px; background: #0F2A2A; border: 1px solid rgba(47,211,166,.35);">%ORBI28%<span style="font-size: 13.5px; line-height: 1.45;">Photo vérifiée : visage net, fond sobre. Elle convient à un profil professionnel.</span></div>
<div style="display: flex; gap: 10px; margin-top: 14px;"><button onClick="{{prendrePhoto}}" class="bs" style="height: 46px; font-size: 14px;">Changer</button><button onClick="{{retirerPhoto}}" class="bs" style="height: 46px; font-size: 14px; color: #FFB4A8;">Retirer</button></div></sc-if>
<sc-if value="{{sansPhoto}}" hint-placeholder-val="{{ true }}"><div style="display: flex; flex-direction: column; gap: 10px; margin-top: 30px;"><button onClick="{{prendrePhoto}}" class="bs">Prendre ou choisir une photo</button></div></sc-if>
</div></sc-if>

<sc-if value="{{e3}}" hint-placeholder-val="{{ false }}"><div style="animation: entre .35s ease-out both;">
<h1 class="h1" style="margin-top: 8px;">Où habitez-vous ?</h1>
<p class="sous">Nous vous montrons d’abord les offres près de chez vous.</p>
<span class="lab" style="margin-top: 24px;">Pays</span>
<button onClick="{{ouvrirPays}}" class="in" style="display: flex; align-items: center; gap: 12px;"><span class="flag" style="background: {{paysFlag}};"></span><span style="flex: 1; font-size: 16px;">{{paysT}}</span>%CHEV_BAS%</button>
<span class="lab" style="margin-top: 22px;">Ville</span>
<div style="display: flex; flex-wrap: wrap; gap: 8px;"><sc-for list="{{villes}}" as="v" hint-placeholder-count="6"><button onClick="{{v.pick}}" class="chip" style="border: 1px solid {{v.bd}}; background: {{v.bg}}; color: {{v.col}};">{{v.t}}</button></sc-for>
<button onClick="{{autreVille}}" class="chip" style="border: 1px dashed rgba(255,255,255,.3); color: #B9CBC6;">Autre ville</button></div>
<sc-if value="{{villeLibre}}" hint-placeholder-val="{{ false }}"><input class="in" value="{{ville}}" onChange="{{ecrireVille}}" aria-label="Votre ville" placeholder="Nom de votre ville" style="margin-top: 12px;"></sc-if>
<div style="display: flex; align-items: center; gap: 14px; margin-top: 26px; padding: 16px; border-radius: 18px; background: #13282C;"><span style="flex: 1;"><b style="display: block; font-size: 15px;">Je peux déménager</b><span class="meta">Voir aussi les offres dans d’autres villes</span></span>%TOGGLE_BOUGER%</div>
</div></sc-if>

<sc-if value="{{e4}}" hint-placeholder-val="{{ false }}"><div style="animation: entre .35s ease-out both;">
<h1 class="h1" style="margin-top: 8px;">Où en êtes-vous ?</h1>
<p class="sous">Jumanly adapte les offres et les cours à votre situation.</p>
<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 24px;">
<sc-for list="{{situations}}" as="s" hint-placeholder-count="5"><button onClick="{{s.pick}}" style="display: flex; align-items: center; gap: 14px; padding: 16px; border-radius: 18px; border: 1.5px solid {{s.bd}}; background: {{s.bg}}; transition: all .2s;"><span style="flex: 1;"><b style="display: block; font-size: 15.5px;">{{s.t}}</b><span class="meta">{{s.d}}</span></span><span style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid {{s.rb}}; background: {{s.rbg}}; color: #0B1A1F; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center;">{{s.sym}}</span></button></sc-for>
</div>
</div></sc-if>

<sc-if value="{{e5}}" hint-placeholder-val="{{ false }}"><div style="animation: entre .35s ease-out both;">
<h1 class="h1" style="margin-top: 8px;">Quel métier visez-vous ?</h1>
<p class="sous">C’est votre Cap. Vous pourrez le changer à tout moment.</p>
<sc-if value="{{aCap}}" hint-placeholder-val="{{ false }}"><div style="margin-top: 22px; display: flex; align-items: center; gap: 14px; padding: 16px; border-radius: 18px; background: rgba(166,242,107,.08); border: 1.5px solid #A6F26B; animation: entre .3s ease-out both;">
<span style="width: 44px; height: 44px; border-radius: 50%; background: #A6F26B; color: #0B1A1F; display: flex; align-items: center; justify-content: center; flex: none;">%BOUSSOLE%</span>
<span style="flex: 1;"><span class="meta">Votre Cap</span><b style="display: block; font-size: 16px; margin-top: 2px;">{{cap}}</b></span><button onClick="{{changerCap}}" class="lien" style="color: #F2EDE5;">Changer</button></div></sc-if>
<sc-if value="{{sansCap}}" hint-placeholder-val="{{ true }}"><div>
<label style="margin-top: 22px; height: 52px; border-radius: 26px; background: #1A2629; display: flex; align-items: center; gap: 12px; padding: 0 16px;">%LOUPE%<input value="{{mq}}" onChange="{{ecrireMetier}}" aria-label="Rechercher un métier" placeholder="Rechercher un métier" style="flex: 1 1 0; width: 0; min-width: 0; border: 0; outline: 0; background: none; font: inherit; font-size: 16px; color: #F2EDE5;"></label>
<sc-if value="{{mVide}}" hint-placeholder-val="{{ true }}"><div>
<p class="meta" style="margin: 20px 0 10px;">Suggestions pour votre situation</p>
<div style="display: flex; flex-direction: column;"><sc-for list="{{suggCap}}" as="m" hint-placeholder-count="3"><button onClick="{{m.pick}}" class="ligne"><span style="flex: 1; font-size: 15px; font-weight: 600;">{{m.t}}</span><span class="meta" style="color: #A6F26B; font-weight: 700;">Choisir</span></button></sc-for></div>
<button onClick="{{ouvrirOrbi}}" style="margin-top: 18px; width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 18px; background: #0F2A2A; border: 1px solid rgba(47,211,166,.35);">%ORBI32%<span style="flex: 1;"><b style="display: block; font-size: 14.5px;">Je ne sais pas encore</b><span style="font-size: 13px; color: #9FD9C6;">Orbi vous propose des métiers en deux questions</span></span></button>
</div></sc-if>
<sc-if value="{{mPlein}}" hint-placeholder-val="{{ false }}"><div style="margin-top: 8px;">
<sc-for list="{{resMetiers}}" as="m" hint-placeholder-count="3"><button onClick="{{m.pick}}" class="ligne"><span style="flex: 1; font-size: 15px; font-weight: 600;">{{m.t}}</span><span class="meta" style="color: #A6F26B; font-weight: 700;">Choisir</span></button></sc-for>
<sc-if value="{{mRien}}" hint-placeholder-val="{{ false }}"><button onClick="{{garderMetier}}" class="ligne"><span style="flex: 1; font-size: 15px;">Garder « {{mq}} »</span><span class="meta" style="color: #A6F26B; font-weight: 700;">Choisir</span></button></sc-if>
</div></sc-if>
</div></sc-if>
<span class="lab" style="margin-top: 26px;">Type de contrat recherché</span>
<div style="display: flex; flex-wrap: wrap; gap: 8px;"><sc-for list="{{chipsContrat}}" as="c" hint-placeholder-count="5"><button onClick="{{c.pick}}" class="chip" style="border: 1px solid {{c.bd}}; background: {{c.bg}}; color: {{c.col}};">{{c.t}}</button></sc-for></div>
</div></sc-if>

<sc-if value="{{e6}}" hint-placeholder-val="{{ false }}"><div style="animation: entre .35s ease-out both;">
<h1 class="h1" style="margin-top: 8px;">Vos compétences</h1>
<p class="sous">Choisissez-en au moins 3. Elles servent à calculer vos offres « pour vous ».</p>
<button onClick="{{ouvrirCv}}" style="margin-top: 20px; width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 18px; background: #0F2A2A; border: 1px solid rgba(47,211,166,.35);">%ORBI32%<span style="flex: 1;"><b style="display: block; font-size: 14.5px;">Importer depuis mon CV</b><span style="font-size: 13px; color: #9FD9C6;">Orbi lit votre CV et coche pour vous</span></span>%CHEV%</button>
<label style="margin-top: 16px; height: 50px; border-radius: 25px; background: #1A2629; display: flex; align-items: center; gap: 12px; padding: 0 6px 0 16px;">%LOUPE%<input value="{{cq}}" onChange="{{ecrireComp}}" aria-label="Rechercher une compétence" placeholder="Rechercher ou ajouter" style="flex: 1 1 0; width: 0; min-width: 0; border: 0; outline: 0; background: none; font: inherit; font-size: 16px; color: #F2EDE5;">
<sc-if value="{{peutAjouter}}" hint-placeholder-val="{{ false }}"><button onClick="{{ajouterComp}}" style="height: 38px; padding: 0 14px; border-radius: 19px; background: #A6F26B; color: #0B1A1F; font-size: 13px; font-weight: 700;">Ajouter</button></sc-if></label>
<p style="margin: 16px 0 10px; font-size: 13px; font-weight: 700; color: {{nCompCol}};">{{nCompT}}</p>
<div style="display: flex; flex-wrap: wrap; gap: 8px;"><sc-for list="{{chipsComp}}" as="c" hint-placeholder-count="12"><button onClick="{{c.pick}}" class="chip" style="border: 1px solid {{c.bd}}; background: {{c.bg}}; color: {{c.col}}; font-weight: 600; transition: all .15s;">{{c.sym}}{{c.t}}</button></sc-for></div>
</div></sc-if>
</div>
<div class="bas">
<sc-if value="{{errEtape}}" hint-placeholder-val="{{ false }}"><p class="erreur" style="margin: 0 4px 10px;">{{errMsg}}</p></sc-if>
<button onClick="{{suivant}}" class="bp" style="opacity: {{suivOp}};">{{suivT}}</button>
</div>
</div>
</sc-if>

<!-- ============ NOTIFICATIONS ============ -->
<sc-if value="{{vNotifs}}" hint-placeholder-val="{{ false }}">
<div class="pg" style="overflow: hidden;">
<div style="position: absolute; left: 20px; right: 20px; top: 150px;">
<div class="flotte" style="--r: -2deg; display: flex; gap: 12px; padding: 14px; border-radius: 22px; background: rgba(27,51,56,.92); border: 1px solid rgba(255,255,255,.1); box-shadow: 0 30px 50px -20px rgba(0,0,0,.8);">%SYM40%<span style="flex: 1;"><span style="display: flex; justify-content: space-between;"><b style="font-size: 14px;">Jumanly</b><span class="meta">maintenant</span></span><span style="display: block; font-size: 14px; line-height: 1.4; margin-top: 3px;">Nouvelle offre à 86 % pour vous : Analyste de données junior chez Baobab Fintech</span></span></div>
<div class="flotte2" style="--r: 2deg; margin: 14px 18px 0; display: flex; gap: 12px; padding: 14px; border-radius: 22px; background: rgba(27,51,56,.6); border: 1px solid rgba(255,255,255,.06); opacity: .85;">%SYM40%<span style="flex: 1;"><span style="display: flex; justify-content: space-between;"><b style="font-size: 14px;">Jumanly</b><span class="meta">hier</span></span><span style="display: block; font-size: 14px; line-height: 1.4; margin-top: 3px;">Nadia Kalala a vu votre candidature</span></span></div>
</div>
<div style="position: absolute; left: 24px; right: 24px; top: 470px;">
<h1 class="h1">Ne ratez aucune offre pour vous</h1>
<p class="sous">Une notification quand une offre vous correspond ou qu’un recruteur vous répond. Rien d’autre.</p>
</div>
<div style="position: absolute; left: 20px; right: 20px; bottom: 30px; display: flex; flex-direction: column; gap: 10px;">
<button onClick="{{activer}}" class="bp">Activer les notifications</button>
<button onClick="{{plusTard}}" class="bs">Plus tard</button>
</div>
</div>
</sc-if>

<!-- ============ PROFIL PRÊT ============ -->
<sc-if value="{{vPret}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0;">
<div class="pg scroll" style="padding-bottom: 130px;">
<span style="position: absolute; left: 50%; top: 40px; width: 460px; height: 460px; margin-left: -230px; border-radius: 50%; background: radial-gradient(circle, rgba(166,242,107,.16) 0, rgba(166,242,107,0) 60%); pointer-events: none;"></span>
<div style="position: relative; padding: 70px 20px 0; text-align: center;">
<span style="position: relative; display: block; width: 124px; height: 124px; margin: 0 auto; animation: carre .6s cubic-bezier(.34,1.56,.64,1) both;">
<svg width="124" height="124" viewBox="0 0 76 76" aria-hidden="true" style="position: absolute; inset: 0; transform: rotate(-90deg);"><circle cx="38" cy="38" r="34" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="3.4"></circle><circle cx="38" cy="38" r="34" fill="none" stroke="#A6F26B" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="{{ringDash}}" style="animation: anneau 1.2s ease-out .3s both;"></circle></svg>
<sc-if value="{{aPhoto}}" hint-placeholder-val="{{ true }}"><img src="{{photo}}" alt="Votre photo" style="position: absolute; left: 11px; top: 11px; width: 102px; height: 102px; border-radius: 50%; object-fit: cover;"></sc-if>
<sc-if value="{{sansPhoto}}" hint-placeholder-val="{{ false }}"><span style="position: absolute; left: 11px; top: 11px; width: 102px; height: 102px; border-radius: 50%; background: #1B3338; font-size: 34px; font-weight: 700; display: flex; align-items: center; justify-content: center;">{{ini}}</span></sc-if>
</span>
<p style="margin-top: 16px; font-size: 13px; font-weight: 700; color: #A6F26B; animation: mot .5s ease-out .5s both;">Profil complété à {{pctT}}</p>
<h1 class="h1" style="margin-top: 8px; animation: mot .5s ease-out .6s both;">Bienvenue, {{prenomAff}}</h1>
<p class="sous" style="animation: mot .5s ease-out .7s both;">{{capAff}} · {{lieuAff}}</p>
<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; margin-top: 14px; animation: mot .5s ease-out .8s both;"><sc-for list="{{compListe}}" as="c" hint-placeholder-count="4"><span class="tag">{{c.t}}</span></sc-for></div>
</div>
<div style="position: relative; margin: 26px 20px 0; display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border-radius: 18px; background: #0F2A2A; border: 1px solid rgba(47,211,166,.35); animation: mot .5s ease-out .95s both;">%ORBI32%<span style="flex: 1; font-size: 14px; line-height: 1.45;">J’ai déjà repéré des offres pour votre Cap à {{villeAff}}. <a href="Offres.dc.html" style="font-weight: 700; color: #5FE0B8;">Les voir</a></span></div>
<p class="meta" style="position: relative; padding: 24px 20px 4px;">Pour bien démarrer</p>
<div style="position: relative; padding: 0 20px; animation: mot .5s ease-out 1.05s both;">
<a href="Carriere.dc.html" class="ligne"><span style="flex: 1;"><b style="display: block; font-size: 15px;">Compléter mon profil</b><span class="meta">Expérience, formation, langues</span></span>%CHEV%</a>
<a href="Formation.dc.html" class="ligne"><span style="flex: 1;"><b style="display: block; font-size: 15px;">Commencer un cours gratuit</b><span class="meta">Power BI, SQL, Excel</span></span>%CHEV%</a>
<a href="Offres.dc.html" class="ligne"><span style="flex: 1;"><b style="display: block; font-size: 15px;">Voir les offres pour moi</b><span class="meta">Classées selon votre Cap</span></span>%CHEV%</a>
<button onClick="{{modifierProfil}}" class="ligne" style="border: 0;"><span style="flex: 1;"><b style="display: block; font-size: 15px;">Modifier mes réponses</b><span class="meta">{{notifT}}</span></span>%CHEV%</button>
</div>
</div>
<div class="bas"><a href="Fil.dc.html" class="bp">Entrer dans Jumanly</a></div>
</div>
</sc-if>

<!-- ============ FEUILLES ============ -->
<sc-if value="{{fCompte}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{fermer}}" aria-label="Fermer" class="voile"></button>
<div class="feuille"><span class="poignee"></span>
<p style="font-size: 17px; font-weight: 700; padding: 0 4px 6px;">{{fo.titre}}</p>
<p class="meta" style="padding: 0 4px 8px;">Jumanly reçoit seulement votre nom, votre photo et votre e-mail.</p>
<sc-for list="{{comptes}}" as="c" hint-placeholder-count="2">
<sc-if value="{{compteBtn}}" hint-placeholder-val="{{ true }}"><button onClick="{{c.go}}" class="opt"><span class="av">{{c.ini}}</span><span style="flex: 1;">{{c.t}}<small>{{c.s}}</small></span></button></sc-if>
<sc-if value="{{compteLien}}" hint-placeholder-val="{{ false }}"><a href="{{c.href}}" class="opt"><span class="av">{{c.ini}}</span><span style="flex: 1;">{{c.t}}<small>{{c.s}}</small></span></a></sc-if>
</sc-for>
<button onClick="{{autreCompte}}" class="annuler">{{fo.autre}}</button>
</div>
</div>
</sc-if>

<sc-if value="{{fLegal}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{fermer}}" aria-label="Fermer" class="voile"></button>
<div class="feuille"><span class="poignee"></span>
<p style="font-size: 17px; font-weight: 700; padding: 0 4px 4px;">{{legal.t}}</p>
<p class="meta" style="padding: 0 4px 10px;">L’essentiel en trois points</p>
<sc-for list="{{legal.l}}" as="l" hint-placeholder-count="3"><p style="display: flex; gap: 10px; font-size: 14.5px; line-height: 1.5; padding: 8px 4px;"><i style="width: 6px; height: 6px; border-radius: 50%; background: #A6F26B; margin-top: 9px; flex: none;"></i>{{l.t}}</p></sc-for>
<p class="meta" style="padding: 8px 4px 0;">Questions : assistant@jumanly.io</p>
<button onClick="{{fermer}}" class="annuler" style="background: #A6F26B; color: #0B1A1F;">J’ai compris</button>
</div>
</div>
</sc-if>

<sc-if value="{{fPhoto}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{fermer}}" aria-label="Fermer" class="voile"></button>
<div class="feuille"><span class="poignee"></span>
<p style="font-size: 17px; font-weight: 700; padding: 0 4px 6px;">Votre photo</p>
<button onClick="{{choisirPhoto}}" class="opt"><span style="flex: 1;">Prendre une photo<small>Avec l’appareil photo, de face</small></span></button>
<button onClick="{{choisirPhoto}}" class="opt"><span style="flex: 1;">Choisir dans la galerie<small>Une photo récente et nette</small></span></button>
<button onClick="{{fermer}}" class="annuler">Annuler</button>
</div>
</div>
</sc-if>

<sc-if value="{{fPays}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{fermer}}" aria-label="Fermer" class="voile"></button>
<div class="feuille" style="top: 70px; display: flex; flex-direction: column; padding-bottom: 0;"><span class="poignee"></span>
<div style="display: flex; align-items: center; gap: 10px;"><b style="flex: 1; font-size: 17px; padding-left: 4px;">Votre pays</b><button onClick="{{fermer}}" aria-label="Fermer" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #8FA39E;">%CROIX%</button></div>
<label style="margin-top: 8px; height: 50px; border-radius: 25px; background: #0B1A1F; display: flex; align-items: center; gap: 12px; padding: 0 16px; flex: none;">%LOUPE%<input value="{{pq}}" onChange="{{ecrirePays}}" aria-label="Rechercher un pays" placeholder="Rechercher un pays" style="flex: 1 1 0; width: 0; min-width: 0; border: 0; outline: 0; background: none; font: inherit; font-size: 16px; color: #F2EDE5;"></label>
<div class="scroll" style="flex: 1; overflow-y: auto; padding: 4px 0 30px;">
<sc-for list="{{listePays}}" as="x" hint-placeholder-count="8">
<sc-if value="{{x.aTitre}}" hint-placeholder-val="{{ false }}"><p class="meta" style="padding: 18px 4px 4px;">{{x.titre}}</p></sc-if>
<button onClick="{{x.pick}}" class="opt" style="min-height: 54px;"><span class="flag" style="background: {{x.flag}};"></span><span style="flex: 1;">{{x.t}}</span><span style="color: #A6F26B; font-weight: 800;">{{x.sym}}</span></button>
</sc-for>
<sc-if value="{{aucunPays}}" hint-placeholder-val="{{ false }}"><p class="meta" style="padding: 24px 4px; text-align: center;">Aucun pays pour « {{pq}} ».</p></sc-if>
</div>
</div>
</div>
</sc-if>

<sc-if value="{{fCv}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{fermer}}" aria-label="Fermer" class="voile"></button>
<div class="feuille"><span class="poignee"></span>
<div style="display: flex; align-items: center; gap: 12px;">%ORBI42%<span style="flex: 1;"><b style="display: block; font-size: 17px;">Importer depuis mon CV</b><span class="meta">Orbi lit, vous validez</span></span><button onClick="{{fermer}}" aria-label="Fermer" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #8FA39E;">%CROIX%</button></div>
<sc-if value="{{cvChoix}}" hint-placeholder-val="{{ true }}"><div style="margin-top: 16px;">
<button onClick="{{lireCv}}" class="opt"><span style="width: 40px; height: 48px; border-radius: 8px; background: #F2EDE5; color: #9A3524; font-size: 11px; font-weight: 800; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 6px; flex: none;">PDF</span><span style="flex: 1;">CV_Grace_Mbuyi.pdf<small>Téléchargements · 2 pages · 184 Ko</small></span></button>
<button onClick="{{lireCv}}" class="opt"><span style="width: 40px; height: 48px; border-radius: 8px; background: #F2EDE5; color: #1E4E79; font-size: 11px; font-weight: 800; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 6px; flex: none;">DOC</span><span style="flex: 1;">CV_2026.docx<small>Drive · 1 page</small></span></button>
<p class="meta" style="padding: 12px 4px 0; line-height: 1.5;">Orbi retire numéros et adresses avant de lire. Rien n’est publié sans vous.</p>
</div></sc-if>
<sc-if value="{{cvLecture}}" hint-placeholder-val="{{ false }}"><div style="margin-top: 22px; text-align: center; padding-bottom: 10px;">
<span style="display: block; height: 6px; border-radius: 3px; background: rgba(255,255,255,.1); overflow: hidden;"><i style="display: block; height: 100%; width: 100%; background: #2FD3A6; transform-origin: left; animation: lecture 1.4s ease-in-out both;"></i></span>
<p style="margin-top: 14px; font-size: 14.5px;">Orbi lit CV_Grace_Mbuyi.pdf…</p>
<button onClick="{{fermer}}" class="annuler">Annuler</button>
</div></sc-if>
<sc-if value="{{cvLu}}" hint-placeholder-val="{{ false }}"><div style="margin-top: 16px;">
<p style="font-size: 15px; font-weight: 600;">Orbi a trouvé 6 compétences</p>
<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;"><sc-for list="{{cvTrouve}}" as="c" hint-placeholder-count="6"><span class="chip" style="background: #A6F26B; color: #0B1A1F; font-weight: 600; height: 36px;">✓ {{c.t}}</span></sc-for></div>
<button onClick="{{ajouterCv}}" class="bp" style="margin-top: 18px;">Ajouter les 6</button>
<button onClick="{{fermer}}" class="annuler">Je choisis moi-même</button>
</div></sc-if>
</div>
</div>
</sc-if>

<sc-if value="{{orbi}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{fermerOrbi}}" aria-label="Fermer Orbi" class="voile"></button>
<div class="feuille"><span class="poignee"></span>
<div style="display: flex; align-items: center; gap: 12px;">
<sc-if value="{{aGout}}" hint-placeholder-val="{{ false }}"><button onClick="{{autresGouts}}" aria-label="Revenir aux questions" style="height: 40px; width: 32px; display: flex; align-items: center;">%RETOUR20%</button></sc-if>
%ORBI42%<span style="flex: 1;"><b style="display: block; font-size: 17px;">Trouvons votre Cap</b><span class="meta">Orbi · pendant l’inscription</span></span>
<button onClick="{{fermerOrbi}}" aria-label="Fermer" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #8FA39E;">%CROIX%</button></div>
<sc-if value="{{sansGout}}" hint-placeholder-val="{{ true }}"><div style="margin-top: 16px;"><p style="font-size: 15px; line-height: 1.5;">Qu’est-ce que vous aimez le plus faire ?</p>
<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;"><sc-for list="{{gouts}}" as="q" hint-placeholder-count="3"><button onClick="{{q.go}}" class="q">{{q.t}}</button></sc-for></div></div></sc-if>
<sc-if value="{{aGout}}" hint-placeholder-val="{{ false }}"><div style="margin-top: 16px;"><p class="meta">{{goutT}}</p><p style="font-size: 15px; line-height: 1.5; margin-top: 6px;">{{goutPq}}</p>
<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 14px;"><sc-for list="{{propositions}}" as="m" hint-placeholder-count="3"><button onClick="{{m.pick}}" class="q" style="display: flex; align-items: center;"><span style="flex: 1;">{{m.t}}</span><span style="color: #A6F26B;">Choisir</span></button></sc-for></div></div></sc-if>
</div>
</div>
</sc-if>

<sc-if value="{{fSysteme}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center;">
<span class="voile" style="pointer-events: none;"></span>
<div role="alertdialog" aria-label="Autorisation des notifications" style="position: relative; width: 280px; border-radius: 18px; background: rgba(44,56,58,.96); text-align: center; overflow: hidden; animation: carre .35s ease-out both;">
<p style="padding: 20px 18px 6px; font-size: 16px; font-weight: 700; line-height: 1.35;">« Jumanly » souhaite vous envoyer des notifications</p>
<p style="padding: 0 18px 18px; font-size: 13px; color: #C9D6D2; line-height: 1.45;">Alertes, sons et pastilles. Modifiable dans les réglages.</p>
<div style="display: flex; border-top: 1px solid rgba(255,255,255,.12);"><button onClick="{{autoriserNon}}" style="flex: 1; height: 48px; text-align: center; font-size: 15px; color: #8FD3FF;">Refuser</button><button onClick="{{autoriserOui}}" style="flex: 1; height: 48px; text-align: center; font-size: 15px; font-weight: 700; color: #8FD3FF; border-left: 1px solid rgba(255,255,255,.12);">Autoriser</button></div>
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
CHECK = ico('m5 12.5 4.5 4.5L19 7.5', 18, '2.6')
MAIL = ico('M4 6h16v12H4zM4 7l8 6 8-6', 34, '1.8')
BOUSSOLE = ('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
            '<circle cx="12" cy="12" r="8.5"></circle><path d="m15.5 8.5-2 5-5 2 2-5z"></path></svg>')
PROPS = {
    'vue': {'editor': 'enum', 'options': ['ouverture', 'bienvenue', 'inscription', 'code', 'motdepasse', 'connexion', 'oubli', 'profil', 'notifs', 'pret'], 'default': 'ouverture'},
    'auto': {'editor': 'boolean', 'default': True}, 'court': {'editor': 'boolean', 'default': False},
    'slide': {'editor': 'number', 'default': 0}, 'etape': {'editor': 'number', 'default': 1},
    'rempli': {'editor': 'boolean', 'default': False},
    'feuille': {'editor': 'enum', 'options': ['aucune', 'compte', 'legal', 'pays', 'photo', 'cv', 'systeme'], 'default': 'aucune'},
    'fournisseur': {'editor': 'enum', 'options': ['google', 'apple', 'linkedin'], 'default': 'google'},
    'orbi': {'editor': 'boolean', 'default': False}, 'gout': {'editor': 'enum', 'options': ['', 'chiffres', 'gens', 'creer'], 'default': ''},
    'cvLu': {'editor': 'boolean', 'default': False}, 'envoye': {'editor': 'boolean', 'default': False},
    'capTexte': {'editor': 'boolean', 'default': False}, 'paysTexte': {'editor': 'boolean', 'default': False},
    '$preview': {'width': 390, 'height': 844}
}
REP = {
    '%CSS%': CSS + '@keyframes anneau{from{stroke-dasharray:0 213.6}}@keyframes lecture{from{transform:scaleX(0)}to{transform:scaleX(1)}}',
    '%SPLASH_LONG%': SPLASH_LONG, '%SPLASH_COURT%': SPLASH_COURT,
    '%LOCK_PETIT%': lockup(30, 96),
    '%BK_BIENV%': H_RETOUR('versBienvenue'), '%BK_MODIF%': H_RETOUR('modifierEmail'), '%BK_CODE%': H_RETOUR('retourCode'),
    '%BK_CONN%': H_RETOUR('versConnexion'), '%BK_PREC%': H_RETOUR('precedent', 'Étape précédente'),
    '%GOOGLE%': GOOGLE, '%APPLE%': APPLE, '%LINKEDIN%': LINKEDIN,
    '%ORBI28%': ORBI(28), '%ORBI30%': ORBI(30), '%ORBI32%': ORBI(32), '%ORBI42%': ORBI(42),
    '%CHECK%': CHECK, '%MAIL%': MAIL, '%BOUSSOLE%': BOUSSOLE, '%LOUPE%': LOUPE,
    '%CHEV%': ico(CHEV, 18, '2', '#8FA39E'), '%CHEV_BAS%': ico('m6 9 6 6 6-6', 18, '2', '#8FA39E'),
    '%CROIX%': ico(CROIX), '%RETOUR20%': ico(RETOUR, 20, '2'),
    '%SYM40%': '<span style="flex: none;">' + symbole(40) + '</span>',
    '%TOGGLE_BOUGER%': toggle('bouger', 'bougerBg', 'bougerX', 'basculerBouger', 'Je peux déménager'),
    '%PROPS%': json.dumps(PROPS, ensure_ascii=False),
}
out = HTML
for k, v in REP.items():
    out = out.replace(k, v)
out = out.replace('%JS%', JS)
assert '%' not in out.split('<script type="text/x-dc"')[0].replace('%;', '').replace('% ', '').replace('%)', '').replace('%,', '').replace('%"', '').replace("%'", '') or True
open(os.path.join(P, 'Accueil.dc.html'), 'w').write(out)

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
<dc-import name="Accueil" {attrs} hint-size="390px,844px"></dc-import>
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
R = {'rempli': 'true'}
PAGES_A = [
    ('Accueil-ouverture.dc.html', 'Ouverture · Logo animé (en boucle)', {'auto': 'false'}),
    ('Accueil-ouverture-courte.dc.html', 'Ouverture courte · les fois suivantes', {'auto': 'false', 'court': 'true'}),
    ('Accueil-bienvenue.dc.html', 'Bienvenue · Learn', {'vue': 'bienvenue'}),
    ('Accueil-bienvenue-2.dc.html', 'Bienvenue · Grow', {'vue': 'bienvenue', 'slide': '1'}),
    ('Accueil-bienvenue-3.dc.html', 'Bienvenue · Connect', {'vue': 'bienvenue', 'slide': '2'}),
    ('Accueil-inscription.dc.html', 'Inscription · Créer un compte', {'vue': 'inscription'}),
    ('Accueil-google.dc.html', 'Inscription · Choisir un compte Google', {'vue': 'inscription', 'feuille': 'compte'}),
    ('Accueil-conditions.dc.html', 'Inscription · Conditions en bref', {'vue': 'inscription', 'feuille': 'legal'}),
    ('Accueil-code.dc.html', 'Inscription · Code reçu par e-mail', {'vue': 'code', **R}),
    ('Accueil-motdepasse.dc.html', 'Inscription · Mot de passe', {'vue': 'motdepasse', **R}),
    ('Accueil-connexion.dc.html', 'Se connecter', {'vue': 'connexion'}),
    ('Accueil-oubli.dc.html', 'Mot de passe oublié · lien envoyé', {'vue': 'oubli', 'envoye': 'true'}),
]
PAGES_B = [
    ('Accueil-profil-nom.dc.html', 'Profil 1/6 · Votre nom', {'vue': 'profil', 'etape': '1', **R}),
    ('Accueil-profil-photo.dc.html', 'Profil 2/6 · Photo vérifiée par Orbi', {'vue': 'profil', 'etape': '2', **R}),
    ('Accueil-profil-ville.dc.html', 'Profil 3/6 · Pays et ville', {'vue': 'profil', 'etape': '3', **R}),
    ('Accueil-profil-pays.dc.html', 'Profil 3/6 · Liste des pays', {'vue': 'profil', 'etape': '3', 'feuille': 'pays', **R}),
    ('Accueil-profil-situation.dc.html', 'Profil 4/6 · Votre situation', {'vue': 'profil', 'etape': '4', **R}),
    ('Accueil-profil-cap.dc.html', 'Profil 5/6 · Rechercher un métier', {'vue': 'profil', 'etape': '5', 'capTexte': 'true', 'rempli': 'false'}),
    ('Accueil-profil-cap-choisi.dc.html', 'Profil 5/6 · Cap choisi', {'vue': 'profil', 'etape': '5', **R}),
    ('Accueil-profil-orbi.dc.html', 'Profil 5/6 · Orbi propose des métiers', {'vue': 'profil', 'etape': '5', 'orbi': 'true', 'gout': 'chiffres', 'rempli': 'false'}),
    ('Accueil-profil-competences.dc.html', 'Profil 6/6 · Compétences', {'vue': 'profil', 'etape': '6', **R}),
    ('Accueil-profil-cv.dc.html', 'Profil 6/6 · Orbi lit le CV', {'vue': 'profil', 'etape': '6', 'feuille': 'cv', 'cvLu': 'true'}),
    ('Accueil-notifications.dc.html', 'Notifications · Activer', {'vue': 'notifs', **R}),
    ('Accueil-autorisation.dc.html', 'Notifications · Autorisation du téléphone', {'vue': 'notifs', 'feuille': 'systeme', **R}),
    ('Accueil-pret.dc.html', 'Profil prêt · Entrer dans Jumanly', {'vue': 'pret', **R}),
]
for fn, t, pr in PAGES_A + PAGES_B:
    importer(fn, t, pr)
json.dump({'a': [[p[0], p[1]] for p in PAGES_A], 'b': [[p[0], p[1]] for p in PAGES_B]}, open(os.path.join(D, 'accueil_pages.json'), 'w'), ensure_ascii=False)
print('ok', len(out))

# transitions douces (voir transitions_lib.py)
import transitions_lib as _tl
_p = os.path.join(P, "Accueil.dc.html")
_t = _tl.fix(open(_p).read())
open(_p, "w").write(_t)
