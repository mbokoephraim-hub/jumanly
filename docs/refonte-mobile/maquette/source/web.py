# Version ordinateur et tablette · cadres communs (19/10/2026).
# Même identité que le mobile (verre, crème, sapin, lime, Orbi) ; seule la disposition change.
# Ordinateur : barre latérale + barre du haut + contenu en colonnes ; Orbi s'ouvre en panneau à droite.
# Tablette : rail d'icônes à gauche, contenu sur deux colonnes ; Orbi en panneau.

WCSS = '''
.web,.tab{position:relative;background:var(--fond);color:var(--texte);overflow:hidden;font-size:14px}
.web::before,.tab::before{content:"";position:absolute;inset:0 0 auto;height:420px;background:radial-gradient(70% 90% at 90% 0%,rgba(166,242,107,.22),transparent 60%),radial-gradient(50% 80% at 20% 0%,rgba(47,211,166,.12),transparent 65%);pointer-events:none}
.web.sombre::before,.tab.sombre::before{background:radial-gradient(70% 90% at 90% 0%,rgba(166,242,107,.10),transparent 60%),radial-gradient(50% 80% at 20% 0%,rgba(47,211,166,.08),transparent 65%)}
.web{width:1240px;min-height:800px;border-radius:18px;box-shadow:0 0 0 1px rgba(15,63,55,.10),0 40px 80px -30px rgba(15,63,55,.45)}
.web .chr{position:relative;z-index:3;height:38px;display:flex;align-items:center;gap:14px;padding:0 16px;background:rgba(255,255,255,.55);border-bottom:1px solid var(--trait)}
.web.sombre .chr{background:rgba(255,255,255,.04)}
.web .chr i{width:11px;height:11px;border-radius:50%;background:#E3DCD0;display:inline-block;margin-right:6px}.web.sombre .chr i{background:rgba(255,255,255,.14)}
.web .chr .url{flex:0 1 420px;margin:0 auto;height:24px;border-radius:8px;background:var(--zone);display:flex;align-items:center;justify-content:center;gap:6px;font-size:11.5px;color:var(--texte2)}
.web .chr .url .ic{width:12px;height:12px}
.w-body{position:relative;display:grid;grid-template-columns:232px 1fr;min-height:762px}
.tab .w-body{grid-template-columns:84px 1fr;min-height:1000px}
.tab{width:820px;border-radius:40px;box-shadow:0 0 0 12px #1B1F1E,0 40px 80px -30px rgba(0,0,0,.45);margin:12px}
.tab .chr{height:38px;display:flex;justify-content:space-between;align-items:center;padding:0 30px;font-size:13px;font-weight:600;position:relative;z-index:3}
.tab .chr i{display:inline-block;width:5px;height:10px;border-radius:2px;background:currentColor;margin-left:3px}
.tabz{}
/* Barre latérale (ordinateur) */
.sb{position:relative;z-index:2;display:flex;flex-direction:column;gap:6px;padding:20px 14px;border-right:1px solid var(--trait);background:rgba(255,255,255,.35)}
.sombre .sb{background:rgba(255,255,255,.025)}
.sb .lg{display:flex;align-items:center;gap:8px;padding:2px 8px 16px;font-size:20px;font-weight:700;letter-spacing:-.03em}
.sb .lg .j{width:30px;height:30px;border-radius:9px;background:#A6F26B;color:#0F3F37;display:grid;place-items:center;font-size:16px;font-weight:800}
.sb .lg em{font-style:normal;color:#A6F26B;margin-left:-6px}
.sb .org{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:14px;background:var(--plein);box-shadow:var(--verre);font-size:12.5px;font-weight:600;margin-bottom:10px}
.sb .org .lg-e{width:26px;height:26px;font-size:10px;box-shadow:none}.sb .org .ic{margin-left:auto;width:14px;height:14px;color:var(--texte2)}
.sb a.it{display:flex;align-items:center;gap:12px;height:44px;padding:0 12px;border-radius:14px;font-size:14px;font-weight:500;color:var(--texte2)}
.sb a.it .ic{width:20px;height:20px}
.sb a.it.on{background:var(--plein);color:var(--texte);font-weight:700;box-shadow:var(--verre)}
.sb a.it.on .ic{color:var(--texte)}
.sb a.it b{margin-left:auto;font-size:11px;min-width:20px;height:20px;padding:0 6px;border-radius:99px;background:var(--corail);color:#fff;display:grid;place-items:center}
.sb a.orb{display:flex;align-items:center;gap:12px;height:54px;padding:0 10px;margin:6px 0;border-radius:18px;background:linear-gradient(120deg,#F2FCE6,#DDF6EE);font-weight:700;color:var(--texte);box-shadow:0 0 0 1px rgba(166,242,107,.6)}
.sombre .sb a.orb{background:linear-gradient(120deg,rgba(166,242,107,.16),rgba(47,211,166,.08))}
.sb a.orb.on{box-shadow:0 0 0 2px #A6F26B,var(--halo)}
.sb a.orb small{margin-left:auto;font-size:10.5px;font-weight:600;color:var(--texte2);padding:3px 7px;border-radius:7px;background:var(--plein)}
.sb .sep{height:1px;background:var(--trait);margin:10px 6px}
.sb .bas{margin-top:auto;display:flex;flex-direction:column;gap:8px}
.sb .moi{display:flex;align-items:center;gap:10px;padding:10px;border-radius:18px;background:var(--plein);box-shadow:var(--verre)}
.sb .moi .av{width:38px;height:38px;font-size:12px;box-shadow:none;color:#0F3F37}
.sb .moi .t{flex:1;min-width:0}.sb .moi .t b{display:block;font-size:13px}.sb .moi .t span{font-size:11px;color:var(--texte2)}
.sb .moi .ic{width:16px;height:16px;color:var(--texte2)}
/* Rail (tablette) */
.rl{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px;border-right:1px solid var(--trait);background:rgba(255,255,255,.35)}
.sombre .rl{background:rgba(255,255,255,.025)}
.rl .j{width:40px;height:40px;border-radius:12px;background:#A6F26B;color:#0F3F37;display:grid;place-items:center;font-size:19px;font-weight:800;margin-bottom:12px}
.rl a{width:68px;display:flex;flex-direction:column;align-items:center;gap:4px;padding:9px 0;border-radius:16px;font-size:10.5px;font-weight:500;color:var(--texte2);text-align:center}
.rl a .ic{width:22px;height:22px}
.rl a.on{background:var(--plein);color:var(--texte);font-weight:700;box-shadow:var(--verre)}
.rl a.orb .rond{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:var(--plein);box-shadow:0 0 0 4px var(--surface),var(--halo)}
.rl a.orb.on .rond{box-shadow:0 0 0 3px #A6F26B,var(--halo)}
.rl a.orb{margin:6px 0}
.rl .av{margin-top:auto;width:42px;height:42px;font-size:12px;color:#0F3F37}
/* Barre du haut */
.w-main{position:relative;z-index:1;display:flex;flex-direction:column;min-width:0}
.tb{display:flex;align-items:center;gap:10px;padding:16px 32px 6px}
.tab .tb{padding:12px 24px 4px}
.tb .rch{flex:0 1 460px;display:flex;align-items:center;gap:10px;height:46px;padding:0 8px 0 16px;border-radius:999px;font-size:13.5px;color:var(--texte2)}
.tb .rch span{flex:1}.tb .rch kbd{font-family:inherit;font-size:11px;font-weight:600;padding:4px 8px;border-radius:8px;background:var(--zone);color:var(--texte2)}
.tb .rch .orbi-m{width:26px;height:26px}
.tb .sp{flex:1}
.tb .bi{width:44px;height:44px}
.tb .av{width:44px;height:44px;font-size:13px;color:#0F3F37}
.w-c{padding:14px 32px 36px;display:flex;flex-direction:column;gap:18px}
.tab .w-c{padding:12px 24px 40px;gap:16px}
.w-h{display:flex;align-items:flex-end;gap:16px}
.w-h .t{flex:1}.w-h h1{font-size:32px;letter-spacing:-.03em;font-weight:600;line-height:1.1}.w-h p{font-size:14px;color:var(--texte2);margin-top:6px}
.tab .w-h h1{font-size:28px}
.g2{display:grid;grid-template-columns:minmax(0,1.75fr) minmax(0,1fr);gap:20px;align-items:start}
.g2r{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:22px;align-items:start}
.g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:start}
.g2e{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start}
.col{display:flex;flex-direction:column;gap:16px;min-width:0}
.colk{position:sticky;top:0}
/* Panneau Orbi (à droite) et fenêtre centrée */
.op{position:absolute;top:38px;right:0;bottom:0;width:420px;z-index:8;display:flex;flex-direction:column;gap:14px;padding:20px 22px;background:var(--fond);box-shadow:-30px 0 60px -30px rgba(15,63,55,.45);border-left:1px solid var(--trait)}
.tab .op{width:440px;top:38px}
.op::before{content:"";position:absolute;inset:0 0 auto;height:240px;background:radial-gradient(90% 80% at 80% 0%,rgba(166,242,107,.22),transparent 65%);pointer-events:none}
.op>*{position:relative}
.op .opt{display:flex;align-items:center;gap:12px}.op .opt .t{flex:1}.op .opt b{display:block;font-size:16px}.op .opt span{font-size:12px;color:var(--texte2)}
.op .opt .bi{width:38px;height:38px}
.op .opb{margin-top:auto}.op .bt,.dlg .bt{height:52px}.op .bt.pl,.w-ap .bt.pl,.w-c .col>.bt.pl{flex:none}
.op-c{display:flex;align-items:center;gap:8px;height:52px;padding:0 6px 0 16px;border-radius:999px;background:var(--plein);box-shadow:var(--verre);font-size:13px;color:var(--texte2)}.op-c span{flex:1}.op-c .bi{width:40px;height:40px}.op-c .bi.e{background:#0F3F37;color:#A6F26B}
.w-voile{position:absolute;inset:38px 0 0;background:rgba(11,26,31,.30);z-index:7}
.dlg{position:absolute;z-index:8;left:50%;top:50%;transform:translate(-50%,-50%);width:520px;display:flex;flex-direction:column;gap:14px;padding:24px;border-radius:30px;background:var(--plein);box-shadow:0 40px 80px -30px rgba(0,0,0,.5)}
.dlg h3{font-size:20px;font-weight:600}.dlg .ss{font-size:13px;color:var(--texte2);margin-top:-6px}
.dlg .x{position:absolute;right:18px;top:18px;width:36px;height:36px}
.web .lg-e.sap,.tab .lg-e.sap{color:var(--lime)}.web .lg-e.mer,.tab .lg-e.mer{color:#fff}.web .lg-e.amb,.tab .lg-e.amb{color:#0F3F37}.web .lg-e.kiv,.tab .lg-e.kiv{color:#fff}
/* Cartes d'offres en grille (grand écran) */
.w-c .g3 .of .corps,.w-c .g2e .of .corps{flex-direction:column;gap:6px}
.w-c .g3 .of .t,.w-c .g2e .of .t{padding-top:0;width:100%}
.w-c .g3 .of .t b,.w-c .g2e .of .t b{white-space:normal;font-size:15px;min-height:38px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.w-c .of .bas{flex-wrap:wrap;row-gap:6px}.w-c .of .bas .score{margin-left:auto;white-space:nowrap}
.w-c .of .lg-e{width:48px;height:48px}
/* Planche */
.wfig{margin:0;display:flex;flex-direction:column;gap:12px}
.wfig figcaption{font-size:13px;margin:0 6px}.wfig figcaption span{color:#5B6B68}
.wrow{display:flex;flex-wrap:wrap;gap:22px;align-items:flex-start}
.wtag{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:4px 10px;border-radius:99px;background:#0F3F37;color:#A6F26B;margin-right:8px;vertical-align:1px}
.wtag.t{background:#DDF6EE;color:#0F3F37}
'''

NAV_W = {
 'talent': [('accueil', 'Pour moi'), ('opportunites', 'Offres'), None, ('former', 'Apprendre'), ('candidature', 'Suivi')],
 'rh': [('aujourdhui', 'À traiter'), ('offre', 'Offres'), None, ('candidats', 'Candidats'), ('message', 'Messages')],
}

def _sb(actif, role):
    h = ''
    if role == 'rh':
        h += f'<div class="org"><span class="lg-e sap">BF</span>Baobab Fintech{ic("suivant","xs")}</div>'
    for it in NAV_W[role]:
        if it is None:
            h += f'<a class="orb{" on" if actif == "orbi" else ""}">{orbi(34, "reflechit" if actif == "orbi" else "repos")}Orbi<small>Ctrl K</small></a>'
        else:
            k, l = it
            b = '<b>3</b>' if (role == 'rh' and k == 'message') else ('<b>2</b>' if (role == 'talent' and k == 'candidature') else '')
            h += f'<a class="it{" on" if k == actif else ""}">{ic(k, "s", k == actif)}{l}{b}</a>'
    sec = (f'<a class="it">{ic("message","s")}Messages<b>2</b></a><a class="it">{ic("connexion","s")}Connexions</a>' if role == 'talent'
           else f'<a class="it">{ic("agenda","s")}Agenda</a><a class="it">{ic("progression","s")}Rapports</a>')
    moi = (('GM', 'Grâce Mbuyi', 'Compte talent') if role == 'talent' else ('NK', 'Nadia Kabeya', 'Responsable recrutement'))
    return (f'<aside class="sb"><div class="lg"><span class="j">J</span>jumanly<em>.</em></div>{h}<div class="sep"></div>{sec}'
            f'<div class="bas"><a class="it">{ic("reglages","s")}Paramètres</a><div class="moi"><span class="av">{moi[0]}</span><div class="t"><b>{moi[1]}</b><span>{moi[2]}</span></div>{ic("suivant","xs")}</div></div></aside>')

def _rl(actif, role):
    h = '<span class="j">J</span>'
    for it in NAV_W[role]:
        if it is None:
            h += f'<a class="orb{" on" if actif == "orbi" else ""}"><span class="rond">{orbi(40, "reflechit" if actif == "orbi" else "repos")}</span>Orbi</a>'
        else:
            k, l = it
            h += f'<a class="{"on" if k == actif else ""}">{ic(k, "", k == actif)}{l}</a>'
    av = 'GM' if role == 'talent' else 'NK'
    return f'<aside class="rl">{h}<span class="av">{av}</span></aside>'

def _tb(role, tab=False):
    av = 'GM' if role == 'talent' else 'NK'
    ph = 'Rechercher ou demander à Orbi' if role == 'talent' else 'Candidat, offre, ou demander à Orbi'
    k = '' if tab else '<kbd>Ctrl K</kbd>'
    return (f'<div class="tb"><div class="verre rch">{ic("recherche","s")}<span>{ph}</span>{k}</div><span class="sp"></span>'
            f'{bi("notification", "<span class=pastille></span>")}{bi("message", "<span class=cpt>2</span>")}<span class="av">{av}</span></div>')

def web(contenu, actif='accueil', role='talent', url='/app', cls='', over='', tb=True):
    return (f'<div class="web {cls}"><div class="chr"><span><i></i><i></i><i></i></span><span class="url">{ic("cadenas","xs")}jumanly.io{url}</span><span style="width:52px"></span></div>'
            f'<div class="w-body">{_sb(actif, role)}<main class="w-main">{_tb(role) if tb else ""}<div class="w-c">{contenu}</div></main></div>{over}</div>')

def tab(contenu, actif='accueil', role='talent', cls='', over='', tb=True):
    return (f'<div class="tabz"><div class="tab {cls}"><div class="chr"><span>9:41</span><span><i></i><i></i><i></i></span></div>'
            f'<div class="w-body">{_rl(actif, role)}<main class="w-main">{_tb(role, True) if tb else ""}<div class="w-c">{contenu}</div></main></div>{over}</div></div>')

def wsombre(e):
    return e.replace('class="web ', 'class="web sombre ', 1).replace('class="tab ', 'class="tab sombre ', 1)

def wh(titre, sous='', droite=''):
    p = f'<p>{sous}</p>' if sous else ''
    return f'<div class="w-h"><div class="t"><h1>{titre}</h1>{p}</div>{droite}</div>'

def panneau_orbi(titre, sous, corps, bas=''):
    return (f'<div class="op"><div class="opt">{orbi(40)}<div class="t"><b>{titre}</b><span>{sous}</span></div>{bi("fermer")}</div>{corps}'
            + (f'<div class="opb">{bas}</div>' if bas else '') + f'<div class="op-c">{ic("plus","s")}<span>Demander à Orbi</span>{bi("micro")}{bi("envoyer","","e")}</div></div>')

def fenetre(corps):
    return f'<div class="w-voile"></div><div class="dlg">{bi("fermer","","x")}{corps}</div>'

def wfig(e, titre, note=''):
    return f'<figure class="wfig">{e}<figcaption><b>{titre}</b><br><span>{note}</span></figcaption></figure>'

def wrow(*figs):
    return '<div class="wrow">' + ''.join(figs) + '</div>'

def page_w(nom, kicker, titre, intro, ECR, css):
    som = ''.join(f'<li><a href="#{i}">{t.split(" · ", 1)[1]}</a></li>' for i, t, _, _ in ECR)
    corps = ''.join(f'<section class="bloc" id="{i}"><header><h2>{t}</h2><p>{d}</p></header><div class="grille" style="flex-direction:column;gap:36px">{"".join(p)}</div></section>' for i, t, d, p in ECR)
    html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{titre.split(" : ")[0]}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>{open(H + '/fondations.css').read()}{css}{WCSS}</style></head><body>
<header class="couv"><span class="k">{orbi(22)}{kicker}</span><h1>{titre}</h1><p>{intro}</p><ul class="som">{som}</ul></header>{corps}<p class="fin">Jumanly · Learn. Grow. Connect.</p></body></html>'''
    out = os.path.join(H, '..', f'refonte-web-{nom}.html')
    open(out, 'w').write(html); print(out, len(html))
