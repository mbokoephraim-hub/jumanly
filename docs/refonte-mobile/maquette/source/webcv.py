# Version ordinateur et tablette · studio CV (19/10/2026). python3 webcv.py && node shotw.js studio-cv
# Reprend le lot 4 mobile (CV et documents) et la spécification des modèles de CV (15 modèles, réglages, pages, export).
import os, io, base64
H = os.path.dirname(os.path.abspath(__file__))
_t2 = open(H + '/talent2.py').read(); exec(_t2[:_t2.index('\nECR = [')])
_CSS2 = CSS2
_s = open(H + '/web1.py').read(); exec(_s[:_s.index('\nECR = [')])
CSS2 = _CSS2
from PIL import Image
M = '/mnt/project-files/developpement/modeles-cv/modeles/apercus/'
_cache = {}
def img(rel, w=300, q=80):
    k = (rel, w)
    if k not in _cache:
        im = Image.open(M + rel).convert('RGB'); im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        b = io.BytesIO(); im.save(b, 'JPEG', quality=q, optimize=True)
        _cache[k] = 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
    return _cache[k]

MODS15 = [('01-classique','Classique','free','Une colonne',False),('02-epure','Épuré','free','Une colonne',True),('03-premier-emploi','Premier emploi','free','Une colonne',True),
 ('04-moderne','Moderne','free','Deux colonnes',True),('05-colonne','Colonne','free','Barre latérale',True),('06-executif','Exécutif','Starter','Une colonne',False),
 ('07-bandeau','Bandeau','Starter','Deux colonnes',True),('08-contraste','Contraste','Starter','Barre latérale',True),('09-parcours','Parcours','Starter','Frise',True),
 ('10-compact','Compact','Starter','Une colonne',False),('11-academique','Académique','Pro','Une colonne',False),('12-creatif','Créatif','Pro','Deux colonnes',True),
 ('13-tech','Tech','Pro','Une colonne',False),('14-elegant','Élégant','Pro','Une colonne',True),('15-visuel','Visuel','Pro','Deux colonnes',True)]
COUL = [('#1F2933','Encre'),('#1B365D','Marine'),('#0B4F5C','Pétrole'),('#24503A','Forêt'),('#6B1E2E','Bordeaux'),('#4A2545','Prune'),('#5A3A22','Brun'),('#3D434A','Graphite')]
COUL2 = [('#1D5FBF','Bleu'),('#0E7C86','Turquoise'),('#2E7D32','Vert'),('#B23A2B','Brique'),('#B4530A','Orange brûlé'),('#6D3FB3','Violet'),('#B0285F','Framboise'),('#4F6D8A','Acier')]

CSSCV = '''
.w-c .col>.bt,.w-c .pane>.bt,.cv-r>.bt,.cv-l .bt.pl{flex:none}
/* Mes CV */
.cvs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.cvn{flex-direction:row;justify-content:flex-start;text-align:left;padding:14px 18px}.cvn div span{font-size:12px;font-weight:500;color:var(--texte2)}
.cvk{padding:12px;display:flex;flex-direction:column;gap:10px;border-radius:24px}
.cvk .vg{position:relative;border-radius:14px;overflow:hidden;background:#fff;aspect-ratio:210/250;box-shadow:0 0 0 1px var(--trait)}
.cvk .vg img{width:100%;display:block}
.cvk .vg .e{position:absolute;left:8px;top:8px;font-size:10.5px;font-weight:700;padding:4px 9px;border-radius:999px;background:var(--lime);color:#0F3F37}
.cvk .vg .e.a{background:#0F3F37;color:#A6F26B}
.cvk .t{display:flex;align-items:center;gap:8px}.cvk .t div{flex:1;min-width:0}.cvk .t b{display:block;font-size:14px}.cvk .t span{font-size:11.5px;color:var(--texte2)}
.cvk .t .bi{width:34px;height:34px}
.cvn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;border-radius:24px;border:1.5px dashed rgba(15,63,55,.28);font-size:13.5px;font-weight:600;text-align:center;padding:16px}
.sombre .cvn{border-color:rgba(255,255,255,.25)}
.cvn .cases{width:52px;height:52px;border-radius:18px;display:grid;place-items:center;background:var(--g-accent);color:#0F3F37}.cvn span{font-size:12px;font-weight:500;color:var(--texte2)}
.cvn.i .cases{background:var(--g-accomp)}
.oa{padding:18px;display:flex;flex-direction:column;gap:10px;background:var(--g-accomp)}
.oa .h{display:flex;gap:12px;align-items:center}.oa .h b{display:block;font-size:15px}.oa .h span{font-size:12px;color:var(--texte2)}
.oa a.o{display:flex;align-items:center;gap:12px;padding:12px;border-radius:18px;background:var(--plein);box-shadow:var(--verre);font-size:13.5px;font-weight:600}
.oa a.o .cases{width:38px;height:38px;border-radius:13px;display:grid;place-items:center;flex:none}
.oa a.o span{flex:1}.oa a.o small{display:block;font-size:11.5px;font-weight:500;color:var(--texte2)}
/* Galerie */
.gal{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:22px;align-items:start}
.tpg{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.tp{display:flex;flex-direction:column;gap:7px;font-size:12.5px;font-weight:600}
.tp .vg{position:relative;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 0 0 1px var(--trait),0 12px 24px -16px rgba(15,63,55,.4)}
.tp .vg img{width:100%;display:block}
.tp .vg .bd{position:absolute;left:8px;top:8px;display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;padding:4px 8px;border-radius:999px;background:var(--lime);color:#0F3F37}
.tp .vg .bd.n{background:#0F3F37;color:#A6F26B}.tp .vg .bd .ic{width:11px;height:11px}
.tp .vg .ck{position:absolute;right:8px;top:8px;width:26px;height:26px;border-radius:50%;background:#0F3F37;color:#A6F26B;display:grid;place-items:center}.tp .vg .ck .ic{width:14px;height:14px}
.tp.on .vg{box-shadow:0 0 0 3px #A6F26B,0 12px 24px -16px rgba(15,63,55,.4)}
.tp small{font-size:11px;font-weight:500;color:var(--texte2);margin-top:-5px}
.tp.lk .vg img{filter:saturate(.85)}
.gd{padding:18px;display:flex;flex-direction:column;gap:12px;position:sticky;top:0}
.gd .big{border-radius:14px;overflow:hidden;box-shadow:0 0 0 1px var(--trait);background:#fff}.gd .big img{width:100%;display:block}
.gd h3{font-size:18px;font-weight:600}.gd p{font-size:12.5px;color:var(--texte2)}
.gd .tg{display:flex;flex-wrap:wrap;gap:6px}.gd .tg span{font-size:11px;font-weight:700;padding:4px 9px;border-radius:999px;background:var(--zone)}.gd .tg span.v{background:var(--lime-c)}
.gd .bt{width:100%}
.neutre{display:flex;gap:8px;align-items:center;font-size:11.5px;color:var(--texte2)}.neutre .ic{width:14px;height:14px}
/* Studio */
.st-h{display:flex;align-items:center;gap:12px;padding:14px 24px 0}
.st-h .t{flex:1;min-width:0}.st-h b{white-space:nowrap}.tab .st-h{padding:10px 24px 0;flex-wrap:wrap}.tab .st-h .orbt{display:none}.st-h b{display:block;font-size:18px;font-weight:600}.st-h .t span{font-size:12px;color:var(--texte2);display:inline-flex;align-items:center;gap:6px}
.st-h .t span i{width:7px;height:7px;border-radius:50%;background:#3DA14F}
.st-h .bt{height:44px;font-size:13.5px;padding:0 18px}
.st-h .grp{display:flex;gap:6px}
.stu{display:grid;grid-template-columns:300px minmax(0,1fr) 260px;gap:18px;align-items:start}
.stu.o{grid-template-columns:270px minmax(0,1fr) 380px}
.cv-l,.cv-r{display:flex;flex-direction:column;gap:14px;min-width:0}
.pnl{padding:16px;display:flex;flex-direction:column;gap:14px}
.pnl h4{font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2);display:flex;justify-content:space-between;align-items:center}
.pnl h4 a{letter-spacing:0;text-transform:none;font-size:12px;color:var(--texte)}
.mdl{display:flex;gap:12px;align-items:center}.mdl img{width:54px;border-radius:8px;box-shadow:0 0 0 1px var(--trait)}.mdl div{flex:1}.mdl b{display:block;font-size:14px}.mdl span{font-size:11.5px;color:var(--texte2)}
.sw8{display:grid;grid-template-columns:repeat(8,1fr);gap:6px}
.sw8 i{aspect-ratio:1;border-radius:50%;display:block;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)}
.sw8 i.on{box-shadow:0 0 0 2px var(--fond),0 0 0 4px var(--texte)}
.sub{font-size:11.5px;color:var(--texte2);margin-bottom:-6px}
.pol{display:flex;flex-direction:column;gap:4px}
.pol span{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:12px;font-size:14px}
.pol span.on{background:var(--zone);font-weight:600}.pol span em{font-style:normal;font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:999px;background:var(--lime-c);font-family:Sora}
.seg.s3 span{font-size:12.5px}
.row-sw{display:flex;align-items:center;justify-content:space-between;font-size:13.5px;font-weight:600}
.page{position:relative;background:#fff;border-radius:6px;box-shadow:0 30px 60px -30px rgba(15,63,55,.5),0 0 0 1px rgba(15,63,55,.08);overflow:hidden}
.page img{width:100%;display:block}
.pages{display:flex;flex-direction:column;gap:14px;align-items:center;padding:6px 0}
.pages .page{width:100%;max-width:520px}
.saut{width:100%;max-width:520px;display:flex;align-items:center;gap:10px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2)}
.saut::before,.saut::after{content:"";flex:1;border-top:1.5px dashed var(--trait)}
.zoom{display:flex;align-items:center;gap:8px;justify-content:center;font-size:12px;color:var(--texte2)}
.zoom span{padding:6px 10px;border-radius:999px;background:var(--plein);box-shadow:var(--verre);font-weight:600;color:var(--texte)}
.hl{position:absolute;border-radius:6px;background:rgba(166,242,107,.32);box-shadow:0 0 0 2px #7CD63F}
.hl b{position:absolute;right:-8px;top:-12px;font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px;background:#0F3F37;color:#A6F26B;white-space:nowrap}
.hl.o{background:rgba(248,195,90,.25);box-shadow:0 0 0 2px #F0B53C}.hl.o b{background:#F0B53C;color:#0F3F37}
.pgs{display:flex;gap:10px}.pgs div{flex:1;display:flex;flex-direction:column;gap:6px;align-items:center;font-size:11.5px;font-weight:600}
.pgs img{width:100%;border-radius:6px;box-shadow:0 0 0 1px var(--trait)}.pgs div.on img{box-shadow:0 0 0 2px var(--texte)}
.pgs .add{aspect-ratio:210/297;width:100%;border-radius:6px;border:1.5px dashed var(--trait);display:grid;place-items:center;color:var(--texte2)}
.lk{display:flex;flex-direction:column;gap:6px}.lk a{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;padding:8px 10px;border-radius:12px;background:var(--zone)}.lk a .ic{width:15px;height:15px}
.fmt{display:grid;grid-template-columns:1fr 1fr;gap:8px}.fmt span{padding:10px;border-radius:14px;background:var(--zone);font-size:12px;text-align:center;line-height:1.3}.fmt span b{display:block;font-size:13.5px}.fmt span.on{background:var(--g-accent);color:#0F3F37}
.fn{font-size:12px;padding:10px 12px;border-radius:12px;background:var(--zone);color:var(--texte2)}
.cv-r .bt{width:100%}
.secs{display:flex;flex-direction:column;gap:2px}
.secs .li{display:flex;align-items:center;gap:10px;padding:9px 6px;border-radius:12px;font-size:13.5px;border:0}
.secs .li.on{background:var(--zone)}
.secs .li .t{flex:1}.secs .li .t b{display:block;font-weight:600}.secs .li .t span{font-size:11.5px;color:var(--texte2)}
.secs .poig{display:flex;flex-direction:column;gap:3px;width:12px}.secs .poig i{height:2px;border-radius:1px;background:var(--texte2);opacity:.5}
.secs .sw{transform:scale(.8)}
.orb-b{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;padding:5px 10px 5px 6px;border-radius:999px;background:var(--g-accomp)}
.op.cv,.tab .op.cv{width:auto;position:relative;top:auto;right:auto;bottom:auto;border-radius:28px;border:0;box-shadow:var(--verre);background:var(--plein)}
.op.cv::before{border-radius:28px}
.avap{padding:12px 14px;border-radius:18px;display:flex;flex-direction:column;gap:6px;font-size:13px;line-height:1.5}
.avap small{font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2)}
.avap.avt{background:var(--zone);color:var(--texte2)}.avap.ap{background:var(--plein);box-shadow:0 0 0 1.5px #A6F26B}
.avap mark{display:inline;background:var(--lime-c);color:inherit;border-radius:4px;padding:0 3px}
.op .acts3{display:flex;gap:8px}.op .acts3 .bt{flex:1;height:46px;font-size:13.5px;padding:0 10px}
.ofs{display:flex;flex-direction:column;gap:8px}
.ofs .r{display:flex;align-items:center;gap:10px;padding:10px;border-radius:16px;background:var(--zone);font-size:13px}
.ofs .r.on{background:var(--plein);box-shadow:0 0 0 2px var(--texte)}
.ofs .r .lg-e{width:36px;height:36px;font-size:11px}.ofs .r div{flex:1}.ofs .r b{display:block}.ofs .r span{font-size:11.5px;color:var(--texte2)}
.ecart{display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:18px;background:var(--plein);box-shadow:var(--verre)}
.ecart .l{display:flex;align-items:center;gap:10px;font-size:13px}.ecart .l .ic{width:18px;height:18px;padding:3px;border-radius:50%;flex:none}
.ecart .l.ok .ic{background:var(--lime-c)}.ecart .l.ko .ic{background:var(--ambre-c)}
.ta{min-height:150px;padding:14px;border-radius:18px;background:var(--plein);box-shadow:inset 0 0 0 1.5px var(--trait);font-size:12.5px;line-height:1.55;color:var(--texte);position:relative}
.ta .cn{position:absolute;right:12px;bottom:10px;font-size:11px;color:var(--texte2)}
.ta p{margin:0 0 6px}.ta .fade{color:var(--texte2)}
.kw{display:flex;flex-wrap:wrap;gap:6px}.kw span{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:600;padding:5px 10px;border-radius:999px;background:var(--lime-c)}.kw span.m{background:var(--ambre-c)}.kw .ic{width:12px;height:12px}
.src{display:flex;flex-wrap:wrap;gap:6px}
.depot2{display:flex;flex-direction:column;align-items:center;gap:8px;padding:28px;border-radius:24px;border:1.5px dashed rgba(15,63,55,.3);text-align:center}
.depot2 .cases{width:56px;height:56px;border-radius:18px;display:grid;place-items:center;background:var(--g-accent);color:#0F3F37}.depot2 b{font-size:15px}.depot2 span{font-size:12px;color:var(--texte2)}
.ch0{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.ch0 .c{padding:16px;display:flex;flex-direction:column;gap:10px}
.ch0 .c b{font-size:14.5px}
.ch0 .c .p{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:12px}
.ch0 .c .p span{padding:5px 10px;border-radius:999px;background:var(--zone);font-weight:600}.ch0 .c .p span.f{background:var(--g-accent);color:#0F3F37}
.ch0 .c .p .ic{width:12px;height:12px;color:var(--texte2)}
.li-ln{display:flex;flex-direction:column;gap:10px}
.li-ln .f{padding:14px;border-radius:18px;background:var(--plein);box-shadow:var(--verre);display:flex;flex-direction:column;gap:6px}
.li-ln .f small{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2);display:flex;justify-content:space-between}
.li-ln .f small a{letter-spacing:0;text-transform:none;font-size:12px;color:var(--texte);display:inline-flex;gap:4px;align-items:center}.li-ln .f small a .ic{width:13px;height:13px}
.li-ln .f p{font-size:13px;line-height:1.5}
'''

def cvk(rel, t, s_, e=None, ea=False):
    b = f'<span class="e{" a" if ea else ""}">{e}</span>' if e else ''
    return f'<div class="verre cvk"><div class="vg"><img src="{img(rel, 300)}">{b}</div><div class="t"><div><b>{t}</b><span>{s_}</span></div>{bi("plus-options")}</div></div>'
OA = f'''<div class="verre oa"><div class="h">{orbi(40)}<div><b>Orbi pour vos CV</b><span>112 crédits · rien n’est modifié sans votre accord</span></div></div>
<a class="o"><span class="cases" style="background:var(--g-former)">{ic("modifier","s")}</span><span>Améliorer mon CV<small>Phrase par phrase, avant et après</small></span>{ic("suivant","xs")}</a>
<a class="o"><span class="cases" style="background:var(--g-oppo)">{ic("opportunites","s")}</span><span>Adapter à une offre<small>Une offre de Jumanly</small></span>{ic("suivant","xs")}</a>
<a class="o"><span class="cases" style="background:var(--g-accomp)">{ic("document","s")}</span><span>Adapter à un texte<small>Une annonce ou un appel collé</small></span>{ic("suivant","xs")}</a></div>'''
def mes_cv(t=False):
    seg = '<div class="seg" style="width:360px"><span class="on">CV<small>3</small></span><span>Lettres<small>2</small></span><span>LinkedIn</span></div>'
    cards = (cvk('pages/05-colonne-1.png','Data · octobre','1 page · modifié le 12 oct.','Principal') + cvk('variantes/moderne-petrole-lato-1.png','Data · Baobab','Adapté à une offre · 18 oct.','Adapté',True)
             + cvk('pages/01-classique-1.png','Général','2 pages · 2 sept.'))
    nv = f'<a class="cvn"><span class="cases">{ic("plus")}</span><div>Nouveau CV<span style="display:block">Depuis mon profil</span></div></a><a class="cvn i"><span class="cases">{ic("telecharger")}</span><div>Importer<span style="display:block">PDF, Word ou LinkedIn</span></div></a>'
    if t:
        return wh('CV et documents') + f'{seg}<div class="g3" style="grid-template-columns:repeat(3,1fr)">{cards}</div><div class="g2e">{nv}</div>{OA}'
    return wh('CV et documents', 'Vos CV, vos lettres et votre profil LinkedIn.') + f'{seg}<div class="g2r"><div class="col"><div class="cvs">{cards}</div><div class="g2e">{nv}</div></div>{OA}</div>'

def tp(rel, n, acc, typ, on=False):
    if acc == 'free': bd = f'<span class="bd">{ic("valider","xs")}Inclus</span>'
    else: bd = f'<span class="bd n">{ic("cadenas","xs")}{acc}</span>'
    ck = f'<span class="ck">{ic("valider","xs")}</span>' if on else ''
    return f'<div class="tp{" on" if on else ""}{"" if acc == "free" else " lk"}"><div class="vg"><img src="{img(rel + ".png", 260)}">{bd}{ck}</div>{n}<small>{typ}</small></div>'
def galerie(t=False, sel='05-colonne'):
    puces = '<div class="puces"><span class="puce on">Tous (15)</span><span class="puce">Inclus dans ma formule (5)</span><span class="puce">Avec photo</span><span class="puce">Une colonne</span><span class="puce">ATS excellente</span></div>'
    grid = '<div class="tpg">' + ''.join(tp(r, n, a, ty, r == sel) for r, n, a, ty, _ in (MODS15[:12] if t else MODS15)) + '</div>'
    det = f'''<div class="verre gd"><div class="big"><img src="{img("pages/05-colonne-1.png", 640, 82)}"></div><h3>Colonne</h3><p>Barre latérale teintée à gauche : photo, coordonnées, compétences. Aperçu avec votre contenu.</p>
<div class="tg"><span class="v">ATS très bonne</span><span>Deux colonnes</span><span>Photo facultative</span><span>1 à 2 pages</span></div>
<a class="bt p">Utiliser ce modèle</a><div class="neutre">{ic("cadenas","xs")}Vos CV téléchargés ne portent ni logo ni mention Jumanly.</div></div>'''
    h = wh('Choisir un modèle', '5 modèles inclus dans votre formule · 10 autres avec Starter ou Pro', f'<a class="bt sec m">{ic("retour","xs")}Retour au CV</a>')
    if t: return h + puces + grid
    return h + puces + f'<div class="gal">{grid}{det}</div>'

def st_h(nom='Data · octobre', ad=False):
    a = '<span style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px;background:#0F3F37;color:#A6F26B;margin-left:6px">Copie adaptée</span>' if ad else ''
    return (f'<div class="st-h">{bi("retour")}<div class="t"><b>{nom}{a}</b><span><i></i>Enregistré · il y a 2 s</span></div>'
            f'<div class="grp">{bi("retour","","")}</div><div class="seg" style="width:240px"><span class="on">Contenu</span><span>Mise en forme</span></div>'
            f'<a class="bt sec orbt">{orbi(22)}Orbi</a><a class="bt p">{ic("telecharger","s")}Télécharger</a></div>')
def st_h2(onglet, nom='Data · octobre', ad=False):
    h = st_h(nom, ad)
    if onglet == 'mef': h = h.replace('<span class="on">Contenu</span><span>Mise en forme</span>', '<span>Contenu</span><span class="on">Mise en forme</span>')
    return h.replace('<div class="grp">' + bi("retour","","") + '</div>', '')

def page_cv(rel='pages/05-colonne-1.png', hl='', saut=True, w=880):
    s_ = '<div class="saut">Page 2</div>' if saut else ''
    return f'<div class="pages"><div class="zoom"><span>100 %</span>1 page sur 2 au maximum</div><div class="page"><img src="{img(rel, w, 84)}">{hl}</div>{s_}</div>'

MEF = f'''<div class="verre pnl"><h4>Modèle<a>Changer</a></h4><div class="mdl"><img src="{img("pages/05-colonne-1.png", 120)}"><div><b>Colonne</b><span>Inclus · ATS très bonne</span></div></div>
<h4>Couleur d’accent</h4><span class="sub">Recommandées pour les logiciels de recrutement</span>
<div class="sw8">{"".join(f'<i style="background:{c}" class="{"on" if n == "Forêt" else ""}" title="{n}"></i>' for c, n in COUL)}</div>
<span class="sub">Autres couleurs</span><div class="sw8">{"".join(f'<i style="background:{c}" title="{n}"></i>' for c, n in COUL2)}</div>
<h4>Police</h4><div class="pol"><span class="on" style="font-family:Sora">Sora<em>Recommandée</em></span><span style="font-family:Inter,sans-serif">Inter</span><span style="font-family:'Source Sans 3',sans-serif">Source Sans 3</span><span style="font-family:Lato,sans-serif">Lato</span><span style="font-family:Merriweather,serif">Merriweather</span><span style="font-family:Lora,serif">Lora</span></div>
<h4>Densité</h4><div class="seg s3"><span>Aérée</span><span class="on">Standard</span><span>Compacte</span></div>
<div class="row-sw">Photo<span class="sw on"></span></div>
<div class="row-sw">Titres<div class="seg s3" style="width:150px"><span class="on">FR</span><span>EN</span></div></div></div>'''
PAGES = f'''<div class="verre pnl"><h4>Pages<a>Ajouter</a></h4><div class="pgs"><div class="on"><img src="{img("pages/05-colonne-1.png", 140)}">1</div><div><span class="add">{ic("plus","s")}</span>2</div></div>
<div class="lk"><a>{ic("plus","xs")}Commencer une nouvelle page ici</a><a>{ic("valider","xs")}Faire tenir sur une page</a></div><span class="sub" style="margin:0">1 à 3 pages au maximum</span></div>'''
EXP = f'''<div class="verre pnl"><h4>Exporter mon CV</h4><div class="fmt"><span class="on"><b>PDF</b>Recommandé</span><span><b>Word</b>Modifiable</span></div>
<div class="fn">Grace-Mbuyi-CV-Data.pdf · 1 page</div><a class="bt p">{ic("telecharger","s")}Télécharger</a><div class="neutre">{ic("cadenas","xs")}Sans logo ni mention Jumanly.</div></div>'''
def studio_mef():
    return st_h2('mef') + f'<div class="stu">{MEF}{page_cv(saut=False)}<div class="cv-r">{PAGES}{EXP}</div></div>'

def sec_l(n, s_, on=False, orb=False):
    o = f'<span class="orb-b">{orbi(16)}Améliorer</span>' if orb else '<span class="sw on"></span>'
    return f'<div class="li{" on" if on else ""}"><span class="poig"><i></i><i></i><i></i></span><div class="t"><b>{n}</b><span>{s_}</span></div>{o}</div>'
SECS = f'''<div class="verre pnl"><h4>Sections<a>{ic("plus","xs")} Ajouter</a></h4><span class="sub" style="margin:-8px 0 0">Glisser pour réordonner · masquer sans supprimer</span><div class="secs">
{sec_l("Profil","3 lignes",True,True)}{sec_l("Expérience","2 postes")}{sec_l("Formation","1 diplôme")}{sec_l("Projets","1, depuis le profil")}{sec_l("Compétences","6, avec niveau")}{sec_l("Langues","3")}{sec_l("Certifications","1 attestation Jumanly")}{sec_l("Centres d’intérêt","3")}</div></div>'''
AVAP = f'''<span class="ck-t">Profil</span><div class="avap avt"><small>Avant</small><p style="margin:0">Je suis une personne motivée qui aime les chiffres et travailler en équipe.</p></div>
<div class="avap ap"><small>Proposition d’Orbi</small><p style="margin:0">Diplômée en sciences économiques, deux ans d’expérience en reporting. Je transforme des données brutes en <mark>tableaux de bord Power BI</mark> suivis par <mark>25 responsables</mark>.</p></div>
<a class="pq">{ic("pourquoi")}Pourquoi ces changements ?</a>
<div class="acts3"><a class="bt sec">Refuser</a><a class="bt sec">Modifier</a><a class="bt p">{ic("valider","s")}Accepter</a></div>
<span class="ck-t">2 autres propositions</span>
<div class="ecart"><div class="l ko">{ic("plus","s")}Expérience : chiffrer « suivi des stocks »</div><div class="l ko">{ic("plus","s")}Compétences : regrouper Python et SQL</div></div>'''
def studio_ameliorer():
    hl = '<span class="hl" style="left:35%;top:13.6%;width:61%;height:5.6%"><b>Proposition</b></span>'
    pan = panneau_orbi('Améliorer mon CV', '3 propositions · 1 crédit chacune', AVAP).replace('class="op"', 'class="op cv"', 1)
    return st_h2('contenu') + f'<div class="stu o">{SECS}{page_cv(hl=hl, saut=False)}{pan}</div>'

ADO = f'''<span class="ck-t">Choisir l’offre</span><div class="ofs">
<div class="r on"><span class="lg-e sap">BF</span><div><b>Analyste de données junior</b><span>Baobab Fintech · candidature en cours</span></div>{ic("valider","s")}</div>
<div class="r"><span class="lg-e amb">ME</span><div><b>Analyste énergie solaire</b><span>Mwinda Énergie · enregistrée</span></div></div>
<div class="r"><span class="lg-e mer">FB</span><div><b>Chargée d’études marketing</b><span>Fleuve Banque · consultée</span></div></div></div>
<span class="ck-t">Ce qu’Orbi changera</span><div class="ecart">
<div class="l ok">{ic("valider","s")}Power BI, Excel : déjà dans votre CV</div>
<div class="l ko">{ic("plus","s")}SQL avancé : mis en avant dans le profil</div>
<div class="l ko">{ic("plus","s")}Mot-clé « reporting » ajouté à l’expérience</div>
<div class="l ok">{ic("valider","s")}Projets placés avant la formation</div></div>
<div class="gar">{ic("document","s")}Orbi crée une copie « Data · Baobab ». Votre CV principal ne change pas.</div>'''
def studio_offre():
    hl = ('<span class="hl" style="left:35%;top:13.6%;width:61%;height:5.6%"><b>Profil réécrit</b></span>'
          '<span class="hl o" style="left:35%;top:24%;width:61%;height:13%"><b>« reporting » ajouté</b></span>'
          '<span class="hl" style="left:2%;top:33%;width:28%;height:13%"><b>SQL en avant</b></span>')
    pan = panneau_orbi('Adapter à une offre', 'Une copie, l’original ne bouge pas', ADO, f'<a class="bt p pl">{orbi(20)}Créer la copie adaptée</a>').replace('class="op"', 'class="op cv"', 1)
    return st_h2('contenu') + f'<div class="stu o">{SECS}{page_cv(hl=hl, saut=False)}{pan}</div>'

TXT = f'''<span class="ck-t">D’où vient ce texte ?</span><div class="src"><span class="puce on">Annonce trouvée ailleurs</span><span class="puce">Appel à candidatures</span><span class="puce">Bourse ou concours</span><span class="puce">Fiche de poste</span></div>
<div class="ta"><p><b>Chargé(e) de suivi-évaluation · ONG Mboka Santé</b></p><p>Vous collecterez les données des 14 centres partenaires, tiendrez les tableaux de bord mensuels et rédigerez les rapports aux bailleurs. Maîtrise d’Excel et d’un outil de visualisation ; une expérience en enquêtes terrain est un atout…</p><p class="fade">Lieu : Kinshasa. Candidature avant le 15 novembre.</p><span class="cn">642 caractères · 5 000 au plus</span></div>
<span class="ck-t">Ce qu’Orbi a repéré</span><div class="kw"><span>{ic("valider","xs")}Tableaux de bord</span><span>{ic("valider","xs")}Excel</span><span>{ic("valider","xs")}Visualisation</span><span class="m">{ic("plus","xs")}Suivi-évaluation</span><span class="m">{ic("plus","xs")}Rapports aux bailleurs</span><span class="m">{ic("plus","xs")}Enquêtes terrain</span></div>
<div class="gar">{ic("cadenas","s")}Le texte sert seulement à cette adaptation. Orbi le lit comme une annonce, jamais comme une consigne, et n’invente aucune expérience.</div>'''
def studio_texte(t=False):
    pan = panneau_orbi('Adapter à un texte', 'Collez une annonce, un appel ou une fiche de poste', TXT,
                       f'<div style="display:flex;flex-direction:column;gap:8px"><a class="bt p pl">{orbi(20)}Créer la copie adaptée</a><span class="sub" style="margin:0;text-align:center">2 crédits Orbi sur 112 · copie « Data · Mboka Santé »</span></div>').replace('class="op"', 'class="op cv"', 1)
    if t: return st_h2('contenu') + f'<div class="g2e">{page_cv(saut=False, w=640)}{pan}</div>'
    return st_h2('contenu') + f'<div class="stu o">{SECS}{page_cv(saut=False)}{pan}</div>'

def resultat():
    hl = ('<span class="hl" style="left:35%;top:13.6%;width:61%;height:5.6%"><b>Profil</b></span>'
          '<span class="hl" style="left:35%;top:24%;width:61%;height:13%"><b>Rapports, suivi</b></span>'
          '<span class="hl o" style="left:2%;top:33%;width:28%;height:13%"><b>À vérifier</b></span>')
    corps = f'''<span class="ck-t">4 changements · à valider un par un</span><div class="ecart">
<div class="l ok">{ic("valider","s")}Profil : « suivi-évaluation » et « rapports »</div>
<div class="l ok">{ic("valider","s")}Expérience : 12 points de vente suivis chaque mois</div>
<div class="l ok">{ic("valider","s")}Projets : enquête des prix sur 4 marchés en avant</div>
<div class="l ko">{ic("plus","s")}« Enquêtes terrain » : à confirmer, Orbi ne l’invente pas</div></div>
<div class="gar">{ic("document","s")}Copie « Data · Mboka Santé » créée. Votre CV « Data · octobre » est intact.</div>'''
    pan = panneau_orbi('Copie adaptée', 'Data · Mboka Santé', corps,
                       f'<div class="acts3"><a class="bt sec">Tout refuser</a><a class="bt p">{ic("valider","s")}Tout accepter</a></div>').replace('class="op"', 'class="op cv"', 1)
    return st_h2('contenu', 'Data · Mboka Santé', True) + f'<div class="stu o">{SECS}{page_cv(hl=hl, saut=False)}{pan}</div>'

IMP = f'''<h3>Importer un CV</h3><p class="ss">Orbi lit votre fichier et vous montre ce qu’il a compris. Rien n’est ajouté sans votre accord.</p>
<div class="depot2"><span class="cases">{ic("telecharger")}</span><b>Déposer un fichier ou parcourir</b><span>PDF ou Word, 5 Mo au plus · ou le PDF de votre profil LinkedIn</span></div>
<span class="ck-t">Lu dans « CV_Grace_2025.pdf » · à vérifier</span>
<div class="verre liste lignes" style="box-shadow:none;background:var(--zone)">
<div class="li"><span class="cases c2">{ic("entreprise","s")}</span><div class="t"><b>2 expériences</b><span>Assistante reporting, stagiaire analyste</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases c1">{ic("cap","s")}</span><div class="t"><b>7 compétences</b><span>Excel, Power BI, SQL…</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases c3">{ic("former","s")}</span><div class="t"><b>1 diplôme</b><span>Licence, Université de Kinshasa</span></div><span class="sw on"></span></div></div>
<div class="acts"><a class="bt sec pl">Annuler</a><a class="bt p pl">Ajouter à mon profil</a></div>'''

LKD = f'''<div class="li-ln">
<div class="f"><small>Titre<a>{ic("document","xs")}Copier</a></small><p>Analyste de données junior · Power BI, SQL, Excel · Kinshasa</p></div>
<div class="f"><small>Infos<a>{ic("document","xs")}Copier</a></small><p>Diplômée en sciences économiques, je transforme des données brutes en tableaux de bord clairs. Deux ans de reporting commercial et financier…</p></div>
<div class="f"><small>Compétences<a>{ic("document","xs")}Copier</a></small><p>Power BI · SQL · Excel avancé · Python (pandas) · Présentation des résultats</p></div></div>'''
def linkedin():
    seg = '<div class="seg" style="width:360px"><span>CV<small>3</small></span><span>Lettres<small>2</small></span><span class="on">LinkedIn</span></div>'
    lettres = f'''<div class="col"><div class="sec-w"><h2>Lettres</h2><a>Nouvelle lettre</a></div>
<div class="verre pj"><span class="cases">{ic("document","s")}</span><div class="t"><b>Lettre · Baobab Fintech</b><span>Rédigée avec Orbi, relue le 18 oct.</span></div>{bi("plus-options")}</div>
<div class="verre pj"><span class="cases" style="background:var(--g-former)">{ic("document","s")}</span><div class="t"><b>Lettre · candidature spontanée</b><span>2 sept.</span></div>{bi("plus-options")}</div>
<div class="verre carte sugg">{orbi(36)}<div class="t"><small>Orbi peut aider</small><b>Rédiger une lettre pour une offre ou un texte collé, à relire avant l’envoi.</b></div></div></div>'''
    return wh('CV et documents') + seg + f'<div class="g2"><div class="col"><div class="sec-w"><h2>Préparer LinkedIn</h2><a>Depuis « Data · octobre »</a></div>{LKD}</div>{lettres}</div>'

def chemins():
    def c(t, etapes):
        p = f' {ic("suivant","xs")} '.join(f'<span class="{"f" if i == len(etapes) - 1 else ""}">{e}</span>' for i, e in enumerate(etapes))
        return f'<div class="verre c"><b>{t}</b><div class="p">{p}</div></div>'
    return '<div class="ch0">' + ''.join([
        c('Ouvrir mes CV', ['Barre latérale', 'Mes CV']), c('Ouvrir mes CV (tablette, mobile)', ['Avatar', 'Compte', 'CV et documents']),
        c('Créer ou importer', ['Mes CV', 'Nouveau CV ou Importer', 'Studio']), c('Changer de modèle', ['Studio', 'Mise en forme', 'Modèle · Changer', 'Galerie']),
        c('Améliorer', ['Studio', 'Orbi ou « Améliorer » sur une section', 'Avant, après']), c('Adapter à une offre', ['Offre', 'Préparer avec Orbi', 'Adapter mon CV']),
        c('Adapter en postulant', ['Postuler', 'Étape 1', 'Adapter à l’offre']), c('Adapter à un texte collé', ['Mes CV ou Studio', 'Orbi', 'Adapter à un texte']),
        c('Télécharger', ['Studio', 'Télécharger', 'PDF ou Word'])]) + '</div>'

UC = '/app/cv'
W_MES = web(mes_cv(), 'cv', url=UC)
T_MES = tab(mes_cv(True), 'accueil')
W_GAL = web(galerie(), 'cv', url=UC + '/modeles?cv=data-octobre')
T_GAL = tab(galerie(True), 'accueil')
W_MEF = web(studio_mef(), 'cv', url=UC + '/data-octobre', tb=False, rail=True)
W_AME = web(studio_ameliorer(), 'cv', url=UC + '/data-octobre', tb=False, rail=True)
W_OFF = web(studio_offre(), 'cv', url=UC + '/data-octobre?adapter=offre', tb=False, rail=True)
W_TXT = web(studio_texte(), 'cv', url=UC + '/data-octobre?adapter=texte', tb=False, rail=True)
W_RES = web(resultat(), 'cv', url=UC + '/data-mboka-sante', tb=False, rail=True)
T_TXT = tab(studio_texte(True), 'accueil', tb=False)
W_IMP = web(mes_cv(), 'cv', url=UC, over=fenetre(IMP))
W_LKD = web(linkedin(), 'cv', url=UC + '?vue=linkedin')

def W(e, t, n=''): return wrow(wfig(e, '<span class="wtag">Ordinateur</span>' + t, n))
def T(e, t, n=''): return wrow(wfig(e, '<span class="wtag t">Tablette</span>' + t, n))
ECR = [
 ('s0', '0 · Comment on y arrive', 'Mes CV a sa place dans la barre latérale sur ordinateur. Sur tablette et mobile, on passe par l’avatar puis Compte. Orbi propose aussi l’adaptation depuis une offre et pendant la candidature.', [chemins()]),
 ('s1', '1 · Mes CV', 'Les CV en aperçu réel, le principal et les copies adaptées. Orbi propose trois actions : améliorer, adapter à une offre, adapter à un texte.',
  [W(W_MES, 'Mes CV', 'Nouveau CV depuis le profil, ou import.'), W(W_IMP, 'Importer un CV', 'Ce qui est lu, à cocher avant d’ajouter.'), T(T_MES, 'Mes CV', '')]),
 ('s2', '2 · Choisir un modèle', 'Les 15 modèles, avec leur vrai rendu. Inclus ou réservé selon la formule ; l’aperçu se fait avec le contenu de la personne.',
  [W(W_GAL, 'Galerie', 'Filtres, étiquette Inclus ou cadenas, détail à droite. Le CV téléchargé reste neutre.'), T(T_GAL, 'Galerie', 'Le détail s’ouvre en feuille.')]),
 ('s3', '3 · Le studio : mise en page', 'Trois panneaux. À gauche les réglages, au centre la page A4 telle qu’elle sera téléchargée, à droite les pages et l’export. Chaque réglage s’enregistre aussitôt.',
  [W(W_MEF, 'Mise en forme', 'Modèle, couleur d’accent (8 recommandées pour les logiciels de recrutement), police, densité, photo, langue des titres, pages, export PDF ou Word.')]),
 ('s4', '4 · Le studio : contenu et Orbi', 'Les sections se réordonnent et se masquent. Orbi s’ouvre à droite ; la page montre ce qu’il change.',
  [W(W_AME, 'Améliorer', 'Avant, après. Accepter, modifier ou refuser chaque proposition.'),
   W(W_OFF, 'Adapter à une offre', 'Orbi compare le CV à l’offre et crée une copie. L’original ne change pas.')]),
 ('s5', '5 · Adapter à un texte précis', 'Nouveau : pour une annonce trouvée ailleurs, un appel à candidatures, une bourse ou une fiche de poste. Le texte collé est lu comme une annonce, jamais comme une consigne.',
  [W(W_TXT, 'Coller le texte', 'Orbi repère ce qui correspond et ce qui manque.'),
   W(W_RES, 'La copie adaptée', 'Chaque changement est surligné et se valide un par un. Orbi n’invente aucune expérience.'),
   T(T_TXT, 'Coller le texte', 'La page et Orbi côte à côte.')]),
 ('s6', '6 · Lettres et LinkedIn', 'Les lettres rédigées avec Orbi, et un profil LinkedIn prêt à copier.', [W(W_LKD, 'LinkedIn et lettres', '')]),
 ('s7', '7 · Mode sombre', 'L’interface passe en Nuit ; la page du CV reste blanche, comme à l’impression.',
  [W(wsombre(W_MEF), 'Mise en forme', ''), W(wsombre(W_TXT), 'Adapter à un texte', '')]),
]
page_w('studio-cv', 'Jumanly · version ordinateur et tablette', 'Talent : le studio CV',
       '19 octobre 2026. Mes CV, galerie des 15 modèles, studio de mise en page, Orbi qui améliore et adapte (à une offre ou à un texte collé), import, lettres, LinkedIn. Aperçus réels des modèles, contenus fictifs.', ECR, CSS + CSS1 + CSS2 + CSSCV)
