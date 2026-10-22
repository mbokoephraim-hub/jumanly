# Génère canvas/project/Fil.dc.html (Fil sombre, aucun clic vide).
import os
D = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(D, 'canvas/project/Fil.dc.html')
JS = open(os.path.join(D, 'fil_logic.js')).read()

def ico(d, s=19, sw='1.7', fill='none'):
    return (f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="{fill}" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{d}"></path></svg>')

HEART = 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z'
BULLE = 'M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.5A7.5 7.5 0 1 1 20 11.5z'
REPUB = 'M4 11V9a2 2 0 0 1 2-2h12l-3-3M20 13v2a2 2 0 0 1-2 2H6l3 3'
RETOUR = 'M15 5 8 12l7 7'
CROIX = 'M6 6l12 12M18 6 6 18'
ORBI = lambda s: (f'<svg width="{s}" height="{s}" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="23" fill="#2FD3A6"></circle>'
                  '<path d="M23 10.5c1.3 7.4 5.6 11.8 13 13.1-7.4 1.3-11.7 5.7-13 13.1-1.3-7.4-5.6-11.8-13-13.1 7.4-1.3 11.7-5.7 13-13.1z" fill="#0B1A1F"></path>'
                  '<circle cx="35" cy="13" r="3.4" fill="#F2EDE5"></circle></svg>')

def acts(k, repub=True):
    h = (f'<div class="acts">'
         f'<button onClick="{{{{{k}.jt}}}}" aria-label="J’aime" style="color: {{{{{k}.jc}}}};">{ico(HEART, fill="{{"+k+".jf}}")}{{{{{k}.jn}}}}</button>'
         f'<button onClick="{{{{{k}.rep}}}}" aria-label="Répondre">{ico(BULLE)}{{{{{k}.nr}}}}</button>')
    if repub:
        h += f'<button onClick="{{{{{k}.rp}}}}" aria-label="Republier" style="color: {{{{{k}.rc}}}};">{ico(REPUB)}{{{{{k}.nrp}}}}</button>'
    return h + '</div>'

def tete(k, av, nom, tag, h, lien=None):
    a = f'<a href="{lien}" class="lnom">' if lien else '<span class="lnom">'
    fin = '</a>' if lien else '</span>'
    return (f'<div class="nom">{a}<b>{nom}</b>{fin}{tag}<span class="h">{h}</span><span style="flex: 1;"></span>'
            f'<button class="plus" onClick="{{{{{k}.menu}}}}" aria-label="Plus d’options">···</button></div>')

def avatar(k, lg, c, lc, rad='50%', lien=None, s=40):
    sp = f'<span class="av" style="width: {s}px; height: {s}px; border-radius: {rad}; background: {c}; color: {lc};">{lg}</span>'
    return f'<a href="{lien}" aria-label="Voir le profil">{sp}</a>' if lien else sp

TAG_ENT = '<span class="tg" style="background: rgba(166,242,107,.14); color: #A6F26B;">Entreprise</span>'

def post(k, av, corps, extra_style=''):
    return (f'<sc-if value="{{{{{k}.vis}}}}" hint-placeholder-val="{{{{ true }}}}">\n<article class="post"{extra_style}>\n'
            f'<div class="col">{av}</div>\n<div class="corps">\n{corps}\n</div>\n</article>\n</sc-if>\n'
            f'<sc-if value="{{{{{k}.mask}}}}" hint-placeholder-val="{{{{ false }}}}">\n<div class="masque"><span>Publication masquée. Vous en verrez moins comme celle-ci.</span>'
            f'<button onClick="{{{{{k}.afficher}}}}">Annuler</button></div>\n</sc-if>\n')

IMG = {
    'A': ('be4ce048ced74d9250b992c526b97346', 'Amani sourit, téléphone en main, la notification du badge s’affiche', '1199 / 845'),
    'P': ('d159cc907efe9558da98ea05e4859c51', 'Patrick éclate de rire, assis à une table', '4 / 5'),
    'S': ('c98cbb9a256f1018c3f5694dd11b02d5', 'Bannière de réseau social avec un personnage illustré qui porte un sac de courses', '773 / 515'),
    'J': ('f6752c76c7b089d8d92e5aae07109df8', 'Visuel de campagne : une jeune femme court dans la rue, bulle « Request To Follow »', '1200 / 630'),
}
def img(c, maxh=None):
    b, alt, r = IMG[c]
    mh = f' max-height: {maxh}px;' if maxh else ''
    return f'<img class="media" src="/_blob/{b}" alt="{alt}" style="aspect-ratio: {r};{mh}">'

OFFRE = ('<a href="Offres-detail.dc.html" class="offre"><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 14px;">Analyste de données junior</b>'
         '<span style="font-size: 12.5px; color: #8FA39E;">Kinshasa · CDI · hybride</span></span><span class="pct">86 % pour vous</span></a>')
EVENT = ('<div style="display: flex; gap: 8px; margin-top: 10px;"><button onClick="{{participer}}" class="pill" style="background: {{partBg}}; color: {{partCol}};">{{partT}}</button>'
         '<span class="pill" style="border: 1px solid rgba(255,255,255,.14); color: #B9CBC6; font-weight: 500;">{{partN}} participants</span></div>')
PJCARD = lambda o: (f'<div class="pj"><span class="pjic" style="background: {{{{{o}.pjC}}}}; color: {{{{{o}.pjLc}}}};">{{{{{o}.pjI}}}}</span>'
                    f'<span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 14px;">{{{{{o}.pjT}}}}</b><span style="font-size: 12.5px; color: #8FA39E;">{{{{{o}.pjD}}}}</span></span></div>')
BANNIERE = '<img class="media" src="/_blob/7a8185bb3611a612aa729be91409f78e" alt="Photo jointe par Grâce" style="aspect-ratio: 16 / 9;">'

POSTS = ''
# Ma publication (apparaît après « Publier »)
POSTS += post('pmoi', avatar('pmoi', 'GM', '#A6F26B', '#0B1A1F', lien='Carriere.dc.html'),
    tete('pmoi', None, 'Grâce Mbuyi', '<span class="tg" style="background: rgba(47,211,166,.16); color: #5FE0B8;">Vous</span>', 'à l’instant', 'Carriere.dc.html')
    + '\n<button onClick="{{pmoi.rep}}" style="display: block; width: 100%;"><p class="txt">{{moiT}}</p></button>'
    + '\n<sc-if value="{{moiPhoto}}" hint-placeholder-val="{{ false }}">' + BANNIERE + '</sc-if>'
    + '\n<sc-if value="{{moiPj}}" hint-placeholder-val="{{ false }}">' + PJCARD('moiC') + '</sc-if>'
    + '\n<sc-if value="{{moiCite}}" hint-placeholder-val="{{ false }}"><div class="cite"><b>{{citeN}}</b><span>{{citeT}}</span></div></sc-if>\n'
    + acts('pmoi'))

POSTS += post('pbf', avatar('pbf', 'BF', '#0F3F37', '#A6F26B', '12px', 'Entreprise.dc.html'),
    tete('pbf', None, 'Baobab Fintech', TAG_ENT, '2 h', 'Entreprise.dc.html')
    + '\n<button onClick="{{pbf.rep}}" style="display: block; width: 100%;"><p class="txt">On recrute trois analystes data à Kinshasa. Candidature en 5 minutes.</p></button>\n'
    + OFFRE + '\n' + acts('pbf'))

POSTS += post('pak', avatar('pak', 'AK', '#FDF1D8', '#8A5A00', lien='Personne-amani.dc.html'),
    tete('pak', None, 'Amani Kasongo', '', '3 h', 'Personne-amani.dc.html')
    + '\n<button onClick="{{pak.rep}}" style="display: block; width: 100%;"><p class="txt">Badge « Bâtisseuse de communauté » obtenu ! Merci à toutes les personnes qui ont répondu à mes questions sur Jumanly.</p>'
    + img('A') + '</button>\n' + acts('pak'))

POSTS += ('<sc-if value="{{sTout}}" hint-placeholder-val="{{ true }}">\n'
    '<button onClick="{{orbiOffres}}" class="sugg">' + ORBI(40) +
    '<span style="flex: 1;"><b style="display: block; font-size: 14px; color: #5FE0B8;">Orbi</b><span style="font-size: 14px;">3 offres publiées ce matin vous correspondent.</span></span></button>\n</sc-if>\n')

POSTS += post('ppi', avatar('ppi', 'PI', '#E3EEF9', '#1E4E79', lien='Personne.dc.html') + '<span class="fil"></span>',
    tete('ppi', None, 'Patrick Ilunga', '<span class="tg" style="background: rgba(47,211,166,.16); color: #5FE0B8;">Nouveau poste</span>', '5 h', 'Personne.dc.html')
    + '\n<button onClick="{{ppi.rep}}" style="display: block; width: 100%;"><p class="txt">Premier jour chez Fleuve Banque comme analyste crédit. Offre trouvée sur Jumanly il y a trois semaines.</p>'
    + img('P', 360) + '</button>\n' + acts('ppi')
    + '\n<div class="sous"><span class="av" style="width: 28px; height: 28px; font-size: 10px; border-radius: 9px; background: #CFE4F7; color: #1E4E79;">FB</span>'
      '<span style="flex: 1; min-width: 0; font-size: 13.5px;"><b>Fleuve Banque</b> Bienvenue dans l’équipe, Patrick !</span></div>'
    + '\n<button onClick="{{ppi.rep}}" class="voir">Voir les {{ppi.nr}} réponses</button>')

POSTS += post('psm', avatar('psm', 'SM', '#FBE4E0', '#9A3524', lien='Personne-sarah.dc.html'),
    tete('psm', None, 'Sarah Mbala', '<span class="tg" style="background: rgba(242,179,61,.16); color: #F4C463;">Réalisation</span>', '8 h', 'Personne-sarah.dc.html')
    + '\n<button onClick="{{psm.rep}}" style="display: block; width: 100%;"><p class="txt">Ma bannière pour une marque de courses en ligne, projet d’école. Vos avis m’intéressent !</p>'
    + img('S') + '</button>\n' + acts('psm'))

POSTS += post('pme', avatar('pme', 'ME', '#FFE1A1', '#8A5A00', '12px'),
    tete('pme', None, 'Mwinda Énergie', TAG_ENT, 'hier')
    + '\n<button onClick="{{pme.rep}}" style="display: block; width: 100%;"><p class="txt">Portes ouvertes mardi 28 octobre, 10 h, à Gombe. Venez rencontrer l’équipe solaire et déposer votre CV sur place.</p></button>\n'
    + EVENT + '\n' + acts('pme'))

POSTS += post('pjk', avatar('pjk', 'JK', '#DDF6EE', '#14745F', lien='Personne-joel.dc.html'),
    tete('pjk', None, 'Joël Kabeya', '', '1 j', 'Personne-joel.dc.html')
    + '\n<button onClick="{{pjk.rep}}" style="display: block; width: 100%;"><p class="txt">Ma campagne pour Baobab Fintech : 275 nouveaux abonnés en une semaine. Je cherche un poste de community manager à Kinshasa.</p>'
    + img('J') + '</button>\n' + acts('pjk'))

BACK = lambda act, t: (f'<button onClick="{{{{{act}}}}}" class="retour" aria-label="Retour">{ico(RETOUR, 20, "2")}{t}</button>')

def nav():
    return ('<nav aria-label="Navigation principale" class="nav">\n<sc-for list="{{nav}}" as="n" hint-placeholder-count="5">\n'
            '<a href="{{n.href}}" aria-label="{{n.t}}" style="color: {{n.c}};"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{{n.sw}}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{{n.d}}"></path></svg>'
            '<span class="pt" style="opacity: {{n.dot}};"></span></a>\n</sc-for>\n</nav>')

CSS = '''
body{margin:0;background:#050D10}
a{color:#A6F26B;text-decoration:none}
.fd,.fd *{box-sizing:border-box}
.fd{font-family:"Sora",system-ui,sans-serif;color:#F2EDE5;-webkit-font-smoothing:antialiased}
.fd h1,.fd h2,.fd p{margin:0}
.fd button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:left}
.fd .scroll{scrollbar-width:none}.fd .scroll::-webkit-scrollbar{display:none}
.fd .post{display:flex;gap:12px;padding:16px 20px 12px;border-bottom:1px solid rgba(255,255,255,.07)}
.fd .col{display:flex;flex-direction:column;align-items:center;flex:none;width:40px}
.fd .av{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex:none}
.fd .fil{flex:1;width:2px;background:rgba(255,255,255,.12);margin-top:6px;border-radius:1px}
.fd .corps{flex:1;min-width:0}
.fd .nom{display:flex;align-items:center;gap:6px;font-size:14px}
.fd .lnom{color:#F2EDE5;min-width:0;overflow:hidden}
.fd .nom b{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
.fd .h{color:#8FA39E;font-size:13px;white-space:nowrap}
.fd .tg{font-size:10.5px;font-weight:700;padding:3px 7px;border-radius:999px;white-space:nowrap}
.fd .txt{font-size:15px;line-height:1.48;margin-top:3px;color:#ECE7DF}
.fd .media{display:block;width:100%;border-radius:16px;margin-top:10px;border:1px solid rgba(255,255,255,.08);object-fit:cover}
.fd .acts{display:flex;gap:22px;margin-top:10px;color:#8FA39E;font-size:13px}
.fd .acts button{display:inline-flex;align-items:center;gap:6px;min-height:36px}
.fd .plus{color:#8FA39E;font-size:18px;line-height:1;letter-spacing:1px;min-width:36px;min-height:32px;text-align:center}
.fd .offre{width:100%;margin-top:10px;border-radius:16px;border:1px solid rgba(255,255,255,.12);padding:12px;display:flex;align-items:center;gap:12px;background:#11262A;color:#F2EDE5}
.fd .pct{font-size:12.5px;font-weight:700;padding:6px 10px;border-radius:999px;background:#A6F26B;color:#0B1A1F;white-space:nowrap}
.fd .pill{height:38px;padding:0 16px;border-radius:999px;font-size:13px;font-weight:700;display:inline-flex;align-items:center}
.fd .sugg{width:100%;display:flex;align-items:center;gap:12px;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.07);background:linear-gradient(90deg,rgba(47,211,166,.12),rgba(47,211,166,0))}
.fd .sous{display:flex;align-items:center;gap:10px;margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06);color:#ECE7DF}
.fd .voir{margin-top:6px;font-size:13px;font-weight:600;color:#8FA39E;min-height:32px}
.fd .masque{display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.07);font-size:13px;color:#8FA39E}
.fd .masque span{flex:1}.fd .masque button{font-weight:700;color:#A6F26B;min-height:36px}
.fd .pj{margin-top:10px;border-radius:16px;border:1px solid rgba(255,255,255,.12);padding:12px;display:flex;align-items:center;gap:12px;background:#11262A}
.fd .pjic{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex:none}
.fd .cite{margin-top:10px;border-radius:16px;border:1px solid rgba(255,255,255,.12);padding:12px;display:flex;flex-direction:column;gap:4px;font-size:13.5px;color:#B9CBC6}
.fd .cite b{color:#F2EDE5;font-size:13px}
.fd .barre{padding:50px 12px 8px;display:flex;align-items:center;border-bottom:1px solid rgba(255,255,255,.08);min-height:102px}
.fd .retour{height:44px;padding:0 8px;font-size:15px;font-weight:600;display:flex;align-items:center;gap:4px}
.fd .nav{position:absolute;left:0;right:0;bottom:0;height:84px;padding:8px 6px 22px;background:rgba(11,26,31,.86);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border-top:1px solid rgba(255,255,255,.07);display:grid;grid-template-columns:repeat(5,minmax(0,1fr));z-index:4}
.fd .nav a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px}
.fd .nav .pt{width:5px;height:5px;border-radius:50%;background:#A6F26B}
.fd .chip{height:36px;padding:0 14px;border-radius:999px;font-size:13px;font-weight:600;white-space:nowrap;display:inline-flex;align-items:center;flex:none}
.fd .nt{width:100%;display:flex;align-items:flex-start;gap:12px;padding:14px 20px;color:#F2EDE5}
.fd .sec{font-size:13px;color:#8FA39E;padding:18px 20px 4px}
.fd .voile{position:absolute;inset:0;width:100%;background:rgba(0,0,0,.55)}
.fd .feuille{position:absolute;left:0;right:0;bottom:0;background:#13282C;border-radius:30px 30px 0 0;padding:10px 20px 28px;border-top:1px solid rgba(255,255,255,.08)}
.fd .poignee{display:block;width:40px;height:5px;border-radius:3px;background:rgba(255,255,255,.2);margin:0 auto 14px}
.fd .opt{width:100%;display:flex;align-items:center;gap:14px;min-height:54px;padding:8px 4px;border-bottom:1px solid rgba(255,255,255,.06);font-size:15px;font-weight:600;color:#F2EDE5}
.fd .opt small{display:block;font-size:12.5px;font-weight:400;color:#8FA39E;margin-top:2px}
.fd .annuler{width:100%;height:50px;margin-top:12px;border-radius:999px;background:#1B3338;text-align:center;font-size:15px;font-weight:700}
.fd .champ{display:flex;align-items:center;gap:10px;min-height:52px;border-radius:26px;background:#0B1A1F;padding:0 6px 0 18px;border:1px solid rgba(47,211,166,.45);min-width:0}
.fd .champ input{flex:1 1 0;width:0;min-width:0;border:0;outline:0;background:none;font:inherit;font-size:14px;color:#F2EDE5}
.fd .env{height:40px;padding:0 16px;border-radius:20px;background:#A6F26B;color:#0B1A1F;font-size:13px;font-weight:700;display:flex;align-items:center;flex:none}
.fd .q{width:100%;padding:14px 16px;border-radius:16px;background:#1B3338;font-size:14px;font-weight:600}
'''

TOAST = ('<sc-if value="{{aToast}}" hint-placeholder-val="{{ false }}">\n<div role="status" style="position: absolute; left: 20px; right: 20px; top: 54px; z-index: 30; padding: 14px 16px; border-radius: 16px; background: #F2EDE5; color: #0B1A1F; font-size: 14px; font-weight: 600; box-shadow: 0 16px 30px -10px rgba(0,0,0,.7); display: flex; align-items: center; gap: 10px;">'
         '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14745F" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex: none;"><path d="m5 12.5 4.5 4.5L19 7.5"></path></svg>{{toast}}</div>\n</sc-if>')

HTML = f'''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Jumanly Modèle B · Fil sombre</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<style>{CSS}</style>
</helmet>
<div class="fd" style="width: 390px; height: 844px; position: relative; overflow: hidden; background: #0B1A1F; border-radius: 44px;">

<!-- ============ FIL ============ -->
<sc-if value="{{{{vFil}}}}" hint-placeholder-val="{{{{ true }}}}">
<div class="scroll" style="position: absolute; inset: 0; overflow-y: auto; padding-bottom: 170px;">
<header style="padding: 54px 20px 0; display: flex; align-items: center; gap: 8px;">
<h1 style="flex: 1; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">Fil</h1>
<button onClick="{{{{ouvrirNotifs}}}}" aria-label="{{{{bellLabel}}}}" style="width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; color: #F2EDE5;">{ico('M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15zM10 20.5a2.2 2.2 0 0 0 4 0', 22)}<span style="position: absolute; top: 6px; right: 4px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: #A6F26B; color: #0B1A1F; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; opacity: {{{{bellOp}}}};">{{{{nNonLu}}}}</span></button>
<a href="Carriere.dc.html" aria-label="Ma carrière"><span class="av" style="width: 36px; height: 36px; background: #A6F26B; color: #0B1A1F;">GM</span></a>
</header>

<div role="tablist" aria-label="Choisir le fil" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 12px; border-bottom: 1px solid rgba(255,255,255,.08);">
<sc-for list="{{{{onglets}}}}" as="o" hint-placeholder-count="3">
<button role="tab" aria-selected="{{{{o.sel}}}}" onClick="{{{{o.pick}}}}" style="height: 46px; text-align: center; font-size: 14px; font-weight: {{{{o.fw}}}}; color: {{{{o.col}}}}; position: relative;">{{{{o.t}}}}<span style="position: absolute; left: 30%; right: 30%; bottom: -1px; height: 3px; border-radius: 2px; background: #A6F26B; opacity: {{{{o.on}}}};"></span></button>
</sc-for>
</div>

<button onClick="{{{{ouvrirPublier}}}}" style="width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,.07);">
<span class="av" style="background: #A6F26B; color: #0B1A1F;">GM</span>
<span style="flex: 1;"><b style="display: block; font-size: 14px;">Grâce Mbuyi</b><span style="font-size: 14px; color: #8FA39E;">Quoi de neuf ?</span></span>
<span style="height: 36px; padding: 0 16px; border-radius: 999px; background: #1B3338; color: #F2EDE5; font-size: 13px; font-weight: 600; display: flex; align-items: center;">Publier</span>
</button>

{POSTS}
<sc-if value="{{{{finFil}}}}" hint-placeholder-val="{{{{ true }}}}"><p style="text-align: center; font-size: 13px; color: #8FA39E; padding: 26px 20px;">Vous êtes à jour. Revenez plus tard ou <a href="Offres.dc.html">explorez les offres</a>.</p></sc-if>
</div>
</sc-if>

<!-- ============ DÉTAIL D’UNE PUBLICATION ============ -->
<sc-if value="{{{{vDetail}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<header class="barre">{BACK('retour', '{{retourT}}')}<b style="flex: 1; text-align: center; font-size: 15px;">Publication</b><button class="plus" onClick="{{{{d.menu}}}}" aria-label="Plus d’options" style="width: 64px;">···</button></header>
<div class="scroll" style="flex: 1; overflow-y: auto; padding-bottom: 20px;">
<article style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,.07);">
<div style="display: flex; align-items: center; gap: 12px;"><span class="av" style="background: {{{{d.c}}}}; color: {{{{d.lc}}}}; border-radius: {{{{d.rad}}}};">{{{{d.lg}}}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px;">{{{{d.n}}}}</b><span class="h">{{{{d.sous}}}}</span></span>
<sc-if value="{{{{d.aProfil}}}}" hint-placeholder-val="{{{{ true }}}}"><a href="{{{{d.profil}}}}" class="chip" style="height: 34px; border: 1px solid rgba(255,255,255,.16); color: #F2EDE5;">Profil</a></sc-if></div>
<p class="txt" style="font-size: 16px; margin-top: 12px;">{{{{d.t}}}}</p>
<sc-if value="{{{{d.iA}}}}" hint-placeholder-val="{{{{ false }}}}">{img('A', 300)}</sc-if>
<sc-if value="{{{{d.iP}}}}" hint-placeholder-val="{{{{ true }}}}">{img('P', 300)}</sc-if>
<sc-if value="{{{{d.iS}}}}" hint-placeholder-val="{{{{ false }}}}">{img('S', 300)}</sc-if>
<sc-if value="{{{{d.iJ}}}}" hint-placeholder-val="{{{{ false }}}}">{img('J', 300)}</sc-if>
<sc-if value="{{{{d.iMoi}}}}" hint-placeholder-val="{{{{ false }}}}">{BANNIERE}</sc-if>
<sc-if value="{{{{d.offre}}}}" hint-placeholder-val="{{{{ false }}}}">{OFFRE}</sc-if>
<sc-if value="{{{{d.event}}}}" hint-placeholder-val="{{{{ false }}}}">{EVENT}</sc-if>
<sc-if value="{{{{d.aPj}}}}" hint-placeholder-val="{{{{ false }}}}">{PJCARD('moiC')}</sc-if>
<p class="h" style="margin-top: 10px;">{{{{d.h}}}}</p>
<div class="acts" style="border-top: 1px solid rgba(255,255,255,.07); margin-top: 10px; padding-top: 4px;">
<button onClick="{{{{d.jt}}}}" aria-label="J’aime" style="color: {{{{d.jc}}}};">{ico(HEART, fill="{{d.jf}}")}{{{{d.jn}}}}</button>
<span style="display: inline-flex; align-items: center; gap: 6px; min-height: 36px;">{ico(BULLE)}{{{{d.nr}}}}</span>
<button onClick="{{{{d.rp}}}}" aria-label="Republier" style="color: {{{{d.rc}}}};">{ico(REPUB)}{{{{d.nrp}}}}</button>
</div>
</article>
<sc-for list="{{{{reps}}}}" as="r" hint-placeholder-count="4">
<article class="post">
<div class="col"><span class="av" style="width: 34px; height: 34px; font-size: 11px; border-radius: {{{{r.rad}}}}; background: {{{{r.c}}}}; color: {{{{r.lc}}}};">{{{{r.lg}}}}</span></div>
<div class="corps">
<div class="nom"><b>{{{{r.n}}}}</b><span class="h">{{{{r.h}}}}</span></div>
<p class="txt" style="font-size: 14.5px;">{{{{r.t}}}}</p>
<div class="acts" style="margin-top: 4px;"><button onClick="{{{{r.jt}}}}" aria-label="J’aime la réponse" style="color: {{{{r.jc}}}}; min-height: 30px;">{ico(HEART, 17, fill="{{r.jf}}")}{{{{r.jn}}}}</button><button onClick="{{{{r.rep}}}}" style="min-height: 30px;">Répondre</button></div>
</div>
</article>
</sc-for>
</div>
<div style="padding: 8px 20px 26px; border-top: 1px solid rgba(255,255,255,.06);">
<sc-if value="{{{{aRepA}}}}" hint-placeholder-val="{{{{ false }}}}"><div style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #8FA39E; padding: 0 4px 8px;"><span style="flex: 1;">Réponse à {{{{repA}}}}</span><button onClick="{{{{annulerRepA}}}}" aria-label="Annuler la réponse ciblée" style="min-height: 28px; min-width: 28px;">{ico(CROIX, 16)}</button></div></sc-if>
<label class="champ" style="border-color: rgba(255,255,255,.1); background: #13282C; padding-left: 8px;">
<span class="av" style="width: 34px; height: 34px; font-size: 11px; background: #A6F26B; color: #0B1A1F;">GM</span>
<input value="{{{{saisie}}}}" onChange="{{{{ecrire}}}}" aria-label="Votre réponse" placeholder="{{{{placeRep}}}}">
<button onClick="{{{{envoyer}}}}" class="env">Envoyer</button>
</label>
</div>
</div>
</sc-if>

<!-- ============ NOUVELLE PUBLICATION ============ -->
<sc-if value="{{{{vPublier}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column; background: #0B1A1F;">
<header class="barre" style="justify-content: space-between;">
<button onClick="{{{{annulerPub}}}}" style="height: 44px; padding: 0 8px; font-size: 15px; color: #B9CBC6;">Annuler</button>
<b style="font-size: 15px;">Nouvelle publication</b>
<span style="width: 74px;"></span>
</header>
<div class="scroll" style="flex: 1; overflow-y: auto;">
<div style="display: flex; gap: 12px; padding: 16px 20px;">
<div class="col"><span class="av" style="background: #A6F26B; color: #0B1A1F;">GM</span><span class="fil" style="min-height: 120px;"></span></div>
<div class="corps">
<b style="font-size: 14px;">Grâce Mbuyi</b>
<textarea value="{{{{brouillon}}}}" onChange="{{{{ecrirePub}}}}" aria-label="Votre publication" placeholder="Quoi de neuf ?" style="display: block; width: 100%; min-height: 110px; margin-top: 4px; border: 0; outline: 0; resize: none; background: none; font: inherit; font-size: 16px; line-height: 1.45; color: #F2EDE5;"></textarea>
<sc-if value="{{{{pubPhoto}}}}" hint-placeholder-val="{{{{ false }}}}"><div style="position: relative;">{BANNIERE}<button onClick="{{{{retirerPj}}}}" aria-label="Retirer la pièce jointe" style="position: absolute; top: 18px; right: 8px; width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center;">{ico(CROIX, 16)}</button></div></sc-if>
<sc-if value="{{{{pubPj}}}}" hint-placeholder-val="{{{{ false }}}}"><div style="position: relative;">{PJCARD('moiC')}<button onClick="{{{{retirerPj}}}}" aria-label="Retirer la pièce jointe" style="position: absolute; top: 18px; right: 8px; width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center;">{ico(CROIX, 16)}</button></div></sc-if>
<sc-if value="{{{{pubCite}}}}" hint-placeholder-val="{{{{ false }}}}"><div class="cite"><b>{{{{citeN}}}}</b><span>{{{{citeT}}}}</span></div></sc-if>
<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;">
<sc-for list="{{{{pjChoix}}}}" as="c" hint-placeholder-count="3"><button onClick="{{{{c.pick}}}}" class="chip" style="border: 1px solid {{{{c.bd}}}}; background: {{{{c.bg}}}}; color: {{{{c.col}}}};">{{{{c.t}}}}</button></sc-for>
</div>
</div>
</div>
<sc-if value="{{{{aEssai}}}}" hint-placeholder-val="{{{{ true }}}}">
<div style="margin: 4px 20px 0; padding: 14px; border-radius: 18px; background: rgba(47,211,166,.08); border: 1px solid rgba(47,211,166,.25); display: flex; gap: 12px; align-items: center;">
{ORBI(34)}
<span style="flex: 1; font-size: 13.5px;">Orbi peut écrire un brouillon à partir de votre attestation SQL.</span>
<button onClick="{{{{essayer}}}}" style="font-size: 13px; font-weight: 700; color: #5FE0B8; min-height: 36px;">Essayer</button>
</div>
</sc-if>
</div>
<div style="padding: 12px 20px 30px; display: flex; align-items: center; gap: 12px; border-top: 1px solid rgba(255,255,255,.08);">
<button onClick="{{{{changerAudience}}}}" style="flex: 1; font-size: 13px; color: #B9CBC6; min-height: 44px;">{{{{audience}}}} ›</button>
<button onClick="{{{{publier}}}}" style="height: 44px; padding: 0 22px; border-radius: 999px; background: #A6F26B; color: #0B1A1F; font-size: 14px; font-weight: 700; opacity: {{{{pubOp}}}};">Publier</button>
</div>
</div>
</sc-if>

<!-- ============ NOTIFICATIONS ============ -->
<sc-if value="{{{{vNotifs}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<header class="barre">{BACK('retourFil', 'Fil')}<b style="flex: 1; text-align: center; font-size: 15px;">Notifications</b><a href="Carriere-notif.dc.html" aria-label="Réglages des notifications" style="width: 64px; height: 44px; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; color: #F2EDE5;">{ico('M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7 7 0 0 1-1.7 1l-.3 2h-4l-.3-2a7 7 0 0 1-1.7-1l-1.9.7-2-3.4 1.6-1.2a7 7 0 0 1 0-2L3.2 10.3l2-3.4 1.9.7a7 7 0 0 1 1.7-1l.3-2h4l.3 2a7 7 0 0 1 1.7 1l1.9-.7 2 3.4-1.6 1.2a7 7 0 0 1 0 2z', 22)}</a></header>
<div class="scroll" style="flex: 1; overflow-y: auto; padding-bottom: 30px;">
<div class="scroll" style="display: flex; gap: 8px; padding: 14px 20px 4px; overflow-x: auto;">
<sc-for list="{{{{nChips}}}}" as="c" hint-placeholder-count="4"><button onClick="{{{{c.pick}}}}" class="chip" style="background: {{{{c.bg}}}}; color: {{{{c.col}}}}; border: 1px solid {{{{c.bd}}}};">{{{{c.t}}}}</button></sc-for>
</div>
<div style="display: flex; align-items: center; padding: 8px 20px 0;"><span style="flex: 1; font-size: 13px; color: #8FA39E;">{{{{resteT}}}}</span><button onClick="{{{{toutLu}}}}" style="font-size: 13px; font-weight: 700; color: #A6F26B; min-height: 36px; opacity: {{{{toutLuOp}}}};">Tout marquer comme lu</button></div>
<sc-for list="{{{{groupes}}}}" as="g" hint-placeholder-count="2">
<p class="sec">{{{{g.t}}}}</p>
<sc-for list="{{{{g.items}}}}" as="n" hint-placeholder-count="4">
<sc-if value="{{{{n.lien}}}}" hint-placeholder-val="{{{{ true }}}}"><a href="{{{{n.href}}}}" class="nt" style="background: {{{{n.bg}}}};"><span class="av" style="border-radius: {{{{n.rad}}}}; background: {{{{n.c}}}}; color: {{{{n.lc}}}};">{{{{n.lg}}}}</span><span style="flex: 1; min-width: 0; font-size: 14px; line-height: 1.4;"><b>{{{{n.qui}}}}</b> {{{{n.quoi}}}}<span style="display: block; font-size: 12.5px; color: #8FA39E; margin-top: 3px;">{{{{n.h}}}}</span></span><span style="width: 8px; height: 8px; border-radius: 50%; background: #A6F26B; margin-top: 6px; flex: none; opacity: {{{{n.dot}}}};"></span></a></sc-if>
<sc-if value="{{{{n.btn}}}}" hint-placeholder-val="{{{{ false }}}}"><button onClick="{{{{n.go}}}}" class="nt" style="background: {{{{n.bg}}}};"><span class="av" style="border-radius: {{{{n.rad}}}}; background: {{{{n.c}}}}; color: {{{{n.lc}}}};">{{{{n.lg}}}}</span><span style="flex: 1; min-width: 0; font-size: 14px; line-height: 1.4;"><b>{{{{n.qui}}}}</b> {{{{n.quoi}}}}<span style="display: block; font-size: 12.5px; color: #8FA39E; margin-top: 3px;">{{{{n.h}}}}</span></span><span style="width: 8px; height: 8px; border-radius: 50%; background: #A6F26B; margin-top: 6px; flex: none; opacity: {{{{n.dot}}}};"></span></button></sc-if>
</sc-for>
</sc-for>
<sc-if value="{{{{nVide}}}}" hint-placeholder-val="{{{{ false }}}}"><p style="text-align: center; font-size: 14px; color: #8FA39E; padding: 40px 20px;">Rien dans cette catégorie pour l’instant.</p></sc-if>
</div>
</div>
</sc-if>

<!-- ============ ORBI FLOTTANT ============ -->
<sc-if value="{{{{fab}}}}" hint-placeholder-val="{{{{ true }}}}">
<div style="position: absolute; right: 20px; bottom: 100px; display: flex; align-items: center; gap: 8px; z-index: 5;">
<button onClick="{{{{orbiResume}}}}" style="max-width: 200px; background: #1B3338; border-radius: 18px 18px 6px 18px; padding: 9px 12px; font-size: 12.5px; font-weight: 600; line-height: 1.35; box-shadow: 0 14px 30px -12px rgba(0,0,0,.8); border: 1px solid rgba(255,255,255,.08);">Résumer les nouveautés du jour ?</button>
<button onClick="{{{{ouvrirOrbi}}}}" aria-label="Ouvrir Orbi, l’assistant" style="width: 58px; height: 58px; border-radius: 50%; flex: none; box-shadow: 0 0 0 6px rgba(47,211,166,.2),0 14px 30px -8px rgba(47,211,166,.55);">{ORBI(58)}</button>
</div>
</sc-if>

<!-- ============ BARRE DU BAS ============ -->
<sc-if value="{{{{vFil}}}}" hint-placeholder-val="{{{{ true }}}}">
{nav()}
</sc-if>

<!-- ============ FEUILLE ··· ============ -->
<sc-if value="{{{{fMenu}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{{{fermer}}}}" aria-label="Fermer" class="voile"></button>
<div class="feuille"><span class="poignee"></span>
<p style="font-size: 13px; color: #8FA39E; padding: 0 4px 6px;">Publication de {{{{d.n}}}}</p>
<sc-if value="{{{{d.aProfil}}}}" hint-placeholder-val="{{{{ true }}}}"><a href="{{{{d.profil}}}}" class="opt">{ico('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0', 22)}<span>Voir le profil<small>{{{{d.n}}}}</small></span></a></sc-if>
<sc-for list="{{{{menu}}}}" as="m" hint-placeholder-count="4"><button onClick="{{{{m.go}}}}" class="opt" style="color: {{{{m.col}}}};"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{{{{m.d}}}}"></path></svg><span>{{{{m.t}}}}<small>{{{{m.s}}}}</small></span></button></sc-for>
<button onClick="{{{{fermer}}}}" class="annuler">Annuler</button>
</div>
</div>
</sc-if>

<!-- ============ FEUILLE SIGNALER ============ -->
<sc-if value="{{{{fSignaler}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{{{fermer}}}}" aria-label="Fermer" class="voile"></button>
<div class="feuille"><span class="poignee"></span>
<div style="display: flex; align-items: center; gap: 4px; margin-bottom: 6px;">{BACK('retourMenu', '')}<b style="font-size: 17px;">Signaler la publication</b></div>
<p style="font-size: 13px; color: #8FA39E; padding: 0 4px 8px;">{{{{d.n}}}} ne saura pas que c’est vous.</p>
<sc-for list="{{{{raisons}}}}" as="m" hint-placeholder-count="5"><button onClick="{{{{m.go}}}}" class="opt">{{{{m.t}}}}</button></sc-for>
<button onClick="{{{{fermer}}}}" class="annuler">Annuler</button>
</div>
</div>
</sc-if>

<!-- ============ FEUILLE REPUBLIER ============ -->
<sc-if value="{{{{fRepub}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{{{fermer}}}}" aria-label="Fermer" class="voile"></button>
<div class="feuille"><span class="poignee"></span>
<button onClick="{{{{republier}}}}" class="opt">{ico(REPUB, 22)}<span>{{{{repubT}}}}<small>{{{{repubS}}}}</small></span></button>
<button onClick="{{{{citer}}}}" class="opt">{ico('M5 5h14v10H9l-4 4z', 22)}<span>Citer<small>Ajouter votre avis au-dessus</small></span></button>
<button onClick="{{{{envoyerMsg}}}}" class="opt">{ico(BULLE, 22)}<span>Envoyer à une connexion<small>Dans Messages</small></span></button>
<button onClick="{{{{fermer}}}}" class="annuler">Annuler</button>
</div>
</div>
</sc-if>

<!-- ============ FEUILLE ENVOYER À UNE CONNEXION ============ -->
<sc-if value="{{{{fEnvoi}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{{{fermer}}}}" aria-label="Fermer" class="voile"></button>
<div class="feuille"><span class="poignee"></span>
<div style="display: flex; align-items: center; gap: 4px; margin-bottom: 6px;">{BACK('retourRepub', '')}<b style="font-size: 17px;">Envoyer à</b></div>
<sc-for list="{{{{contacts}}}}" as="m" hint-placeholder-count="4"><button onClick="{{{{m.go}}}}" class="opt"><span class="av" style="width: 38px; height: 38px; background: {{{{m.c}}}}; color: {{{{m.lc}}}};">{{{{m.lg}}}}</span><span style="flex: 1;">{{{{m.n}}}}<small>{{{{m.r}}}}</small></span><span style="font-size: 13px; color: #A6F26B;">Envoyer</span></button></sc-for>
<a href="Messages.dc.html" class="opt" style="justify-content: center; color: #A6F26B; border: 0;">Ouvrir Messages</a>
</div>
</div>
</sc-if>

<!-- ============ FEUILLE ORBI ============ -->
<sc-if value="{{{{orbi}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{{{fermerOrbi}}}}" aria-label="Fermer Orbi" class="voile"></button>
<div class="feuille" style="padding-bottom: 28px;"><span class="poignee"></span>
<div style="display: flex; align-items: center; gap: 12px;">
<sc-if value="{{{{aRep}}}}" hint-placeholder-val="{{{{ false }}}}">{BACK('autresQ', '')}</sc-if>
{ORBI(42)}
<span style="flex: 1;"><b style="display: block; font-size: 17px;">{{{{orbiTitre}}}}</b><span style="font-size: 12.5px; color: #8FA39E;">Orbi · depuis le Fil</span></span>
<button onClick="{{{{fermerOrbi}}}}" aria-label="Fermer" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #8FA39E;">{ico(CROIX, 20)}</button>
</div>
<sc-if value="{{{{sansRep}}}}" hint-placeholder-val="{{{{ true }}}}">
<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px;">
<sc-for list="{{{{questions}}}}" as="q" hint-placeholder-count="4"><button onClick="{{{{q.go}}}}" class="q">{{{{q.t}}}}</button></sc-for>
</div>
</sc-if>
<sc-if value="{{{{aRep}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="margin-top: 16px;">
<p style="font-size: 13px; color: #8FA39E;">{{{{ra.q}}}}</p>
<p style="font-size: 15px; line-height: 1.5; margin-top: 8px;">{{{{ra.t}}}}</p>
<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 14px;">
<sc-for list="{{{{ra.items}}}}" as="i" hint-placeholder-count="3"><a href="{{{{i.href}}}}" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 16px; background: #1B3338; color: #F2EDE5;"><span class="av" style="width: 34px; height: 34px; font-size: 11px; border-radius: 10px; background: {{{{i.c}}}}; color: {{{{i.lc}}}};">{{{{i.lg}}}}</span><span style="flex: 1; min-width: 0; font-size: 14px; font-weight: 600;">{{{{i.t}}}}<span style="display: block; font-size: 12.5px; font-weight: 400; color: #8FA39E;">{{{{i.s}}}}</span></span><span style="color: #8FA39E;">›</span></a></sc-for>
<sc-if value="{{{{ra.aAct}}}}" hint-placeholder-val="{{{{ false }}}}"><button onClick="{{{{ra.act}}}}" class="q" style="background: #A6F26B; color: #0B1A1F; text-align: center;">{{{{ra.actT}}}}</button></sc-if>
</div>
</div>
</sc-if>
<label class="champ" style="margin-top: 14px;">
<input value="{{{{oq}}}}" onChange="{{{{ecrireOrbi}}}}" aria-label="Écrire à Orbi" placeholder="Écrire à Orbi…">
<button onClick="{{{{envoyerOrbi}}}}" class="env">Envoyer</button>
</label>
</div>
</div>
</sc-if>

{TOAST}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"vue":{{"editor":"enum","options":["fil","detail","publier","notifs"],"default":"fil"}},"post":{{"editor":"enum","options":["pbf","pak","ppi","psm","pme","pjk"],"default":"ppi"}},"feuille":{{"editor":"enum","options":["aucune","menu","signaler","repub","envoi"],"default":"aucune"}},"orbi":{{"editor":"boolean","default":false}},"orbiRep":{{"editor":"enum","options":["aucune","resume","offres","ent","suivre","ecrire"],"default":"aucune"}},"$preview":{{"width":390,"height":844}}}}'>
{JS}
</script>
</body>
</html>
'''
open(OUT, 'w').write(HTML)
print('ok', len(HTML))

# transitions douces (voir transitions_lib.py)
import transitions_lib as _tl
_p = OUT
_t = _tl.fix(open(_p).read())
open(_p, "w").write(_t)
