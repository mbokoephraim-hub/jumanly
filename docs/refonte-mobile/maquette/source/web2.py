# Version ordinateur et tablette · talent, lot 2 : postuler et suivre (19/10/2026). python3 web2.py && node shotw.js talent-2
import os
H = os.path.dirname(os.path.abspath(__file__))
_t2 = open(H + '/talent2.py').read(); exec(_t2[:_t2.index('\nECR = [')])     # écrans et CSS du lot 2 mobile
_CSS2 = CSS2
_s = open(H + '/web1.py').read(); exec(_s[:_s.index('\nECR = [')])   # cadres web + pièces du lot 1
CSS2 = _CSS2

CSSW2 = '''
.w-c .col>.bt,.w-c .pane>.bt{flex:none}
.w-act{display:flex;gap:10px;justify-content:flex-end;align-items:center}.w-act .bt{flex:none;min-width:180px}.w-act .g{margin-right:auto;font-size:12.5px;color:var(--texte2);display:flex;align-items:center;gap:6px}.w-act .g .ic{width:15px;height:15px}
/* Postuler : étapes à gauche */
.w-post{display:grid;grid-template-columns:300px minmax(0,1fr);gap:24px;align-items:start}
.w-stp{padding:20px;display:flex;flex-direction:column;gap:6px}
.w-stp .of-r{display:flex;gap:12px;align-items:center;padding-bottom:14px;margin-bottom:6px;border-bottom:1px solid var(--trait)}
.w-stp .of-r b{display:block;font-size:14px}.w-stp .of-r span{font-size:12px;color:var(--texte2)}
.w-stp .s{display:flex;gap:12px;align-items:center;padding:10px;border-radius:16px;font-size:14px;font-weight:600;color:var(--texte2)}
.w-stp .s i{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:13px;font-weight:700;background:var(--zone);flex:none}
.w-stp .s small{display:block;font-size:11.5px;font-weight:500}
.w-stp .s.ok{color:var(--texte)}.w-stp .s.ok i{background:var(--sapin);color:var(--lime)}.w-stp .s.ok i .ic{width:14px;height:14px}
.w-stp .s.on{background:var(--plein);color:var(--texte);box-shadow:var(--verre)}.w-stp .s.on i{background:var(--g-accent);color:#0F3F37}
.w-stp .gr{margin-top:10px;font-size:12px;color:var(--texte2);padding:10px 12px;border-radius:14px;background:var(--lime-c);color:var(--texte);font-weight:600}
.pane{display:flex;flex-direction:column;gap:16px;min-width:0}
.pane .pas-t{margin-top:-10px}
.cvg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.cvw{padding:14px;display:flex;flex-direction:column;gap:12px;border-radius:26px}
.cvw .ap{height:200px;border-radius:16px;background:var(--zone);display:grid;place-items:center;position:relative}
.pg{width:120px;height:166px;border-radius:6px;background:#fff;box-shadow:0 14px 28px -14px rgba(15,63,55,.45);padding:14px 12px;display:flex;flex-direction:column;gap:6px}
.pg i{height:5px;border-radius:3px;background:#DCE5E1}.pg i.h{height:9px;width:62%;background:#0F3F37}.pg i.c{width:40%;background:#A6F26B;margin-top:6px}.pg i.s{width:80%}
.cvw .ap .radio{position:absolute;right:12px;top:12px}
.cvw .t b{display:block;font-size:14.5px}.cvw .t span{font-size:12px;color:var(--texte2)}
.cvw .adp{display:inline-block;margin-top:6px;font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px;background:var(--lime-c)}
.cvw.on{box-shadow:0 0 0 2px var(--sapin),var(--verre)}.sombre .cvw.on{box-shadow:0 0 0 2px var(--lime),var(--verre)}
.radio{width:22px;height:22px;border-radius:50%;box-shadow:inset 0 0 0 2px var(--trait);background:var(--plein);display:inline-block}
.radio.on{box-shadow:inset 0 0 0 7px var(--sapin)}.sombre .radio.on{box-shadow:inset 0 0 0 7px var(--lime)}
.rc2{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start}
.cv-big{padding:18px;display:flex;gap:18px;align-items:center}
.cv-big .ap{width:180px;height:200px;border-radius:16px;background:var(--zone);display:grid;place-items:center;flex:none}
.conf-d{align-items:center;text-align:center}.conf-d .rond-ok{width:92px;height:92px;border-radius:50%;background:var(--g-accent);display:grid;place-items:center;box-shadow:var(--halo)}
.conf-d .rond-ok .ic{width:42px;height:42px;color:#0F3F37}.conf-d p{font-size:13.5px;color:var(--texte2);max-width:380px}
.conf-d .suite{width:100%}
/* Suivi : liste + détail */
.md{display:grid;grid-template-columns:340px minmax(0,1fr);gap:22px;align-items:start}
.md .lst{display:flex;flex-direction:column;gap:12px}
.md .cd.sel{box-shadow:0 0 0 2px var(--sapin),var(--verre)}.sombre .md .cd.sel{box-shadow:0 0 0 2px var(--lime),var(--verre)}
.dt-h{padding:20px;display:flex;flex-direction:column;gap:16px}
.dt-h .hh{display:flex;gap:14px;align-items:center}.dt-h .hh .lg-e{width:56px;height:56px;font-size:17px}
.dt-h .hh .t{flex:1}.dt-h .hh b{display:block;font-size:19px;font-weight:600;letter-spacing:-.01em}.dt-h .hh span{font-size:12.5px;color:var(--texte2)}
.etp{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.etp div{display:flex;flex-direction:column;gap:7px;font-size:11.5px;font-weight:600;color:var(--texte2)}
.etp div i{height:6px;border-radius:3px;background:var(--piste)}
.etp div.ok{color:var(--texte)}.etp div.ok i{background:var(--sapin)}.sombre .etp div.ok i{background:var(--lime)}
.etp div.now{color:var(--texte)}.etp div.now i{background:var(--g-accent)}
.d2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:start}
.cartb{padding:16px;display:flex;flex-direction:column;gap:12px}.cartb h4{font-size:15px;font-weight:600;display:flex;justify-content:space-between}.cartb h4 a{font-size:12.5px;color:var(--texte2)}
.cartb .liste{box-shadow:none;background:none;padding:0}
.inv .creneaux span{padding:12px 4px}.md .inv{flex-direction:row;flex-wrap:wrap;align-items:center;column-gap:16px}.md .inv .k,.md .inv h3{width:100%}.md .inv .creneaux{flex:1}.md .inv .bts{flex:none}.md .inv .bts .bt.pl{flex:none}
.sim-p{max-width:760px;width:100%;margin:0 auto;display:flex;flex-direction:column;gap:16px}
.sim-p .q b{font-size:21px}
.sim-p .rep{min-height:200px;font-size:15px}
.sim-l{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:22px;align-items:start}
.sim-side{display:flex;flex-direction:column;gap:14px}
.sim-side .qs{padding:16px;display:flex;flex-direction:column;gap:8px}
.sim-side .qs .r{display:flex;align-items:center;gap:10px;font-size:13px}.sim-side .qs .r i{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:11px;font-weight:700;background:var(--zone);flex:none}
.sim-side .qs .r.ok i{background:var(--sapin);color:var(--lime)}.sim-side .qs .r.on{font-weight:700}.sim-side .qs .r.on i{background:var(--g-accent);color:#0F3F37}
.sim-side .qs .r i .ic{width:12px;height:12px}
.chrono-p{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600}.chrono-p .ic{width:16px;height:16px}
.fbh{display:flex;gap:18px;align-items:center;padding:22px}
.fbh .t{flex:1}.fbh b{display:block;font-size:22px;font-weight:600;letter-spacing:-.02em}.fbh span{font-size:13px;color:var(--texte2)}
.crit5{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
.crit5 div{padding:12px;border-radius:18px;background:var(--zone);display:flex;flex-direction:column;gap:8px;font-size:12px;font-weight:600}
.crit5 div .j{height:6px;border-radius:3px;background:var(--piste);overflow:hidden}.crit5 div .j i{display:block;height:100%;background:var(--g-accent);border-radius:3px}
.crit5 div small{font-size:11px;font-weight:500;color:var(--texte2)}
/* Messages */
.msg3{display:grid;grid-template-columns:300px minmax(0,1fr) 260px;height:660px;border-radius:28px;overflow:hidden;background:var(--plein);box-shadow:var(--verre)}
.msg3.d2c{grid-template-columns:300px minmax(0,1fr)}
.msg3>div{min-width:0;display:flex;flex-direction:column}
.msg3 .ls{border-right:1px solid var(--trait);padding:16px 12px;gap:12px;min-height:0}.msg3 .ls>.liste{flex:1}
.msg3 .ls .rech{box-shadow:none;background:var(--zone)}
.msg3 .ls .li{padding:10px;border-radius:18px;border:0}.msg3 .ls .li.on{background:var(--zone)}
.msg3 .ls .li .t span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
.msg3 .cv{padding:0}
.msg3 .cv .hd{display:flex;gap:12px;align-items:center;padding:14px 18px;border-bottom:1px solid var(--trait)}
.msg3 .cv .hd .t{flex:1}.msg3 .cv .hd b{display:block;font-size:15px}.msg3 .cv .hd .t span{font-size:12px;color:var(--texte2)}
.msg3 .cv .fil{flex:1;min-height:0;overflow:hidden;padding:18px 22px;display:flex;flex-direction:column;gap:12px;background:var(--fond)}
.msg3 .cv .b-r{background:var(--plein)}
.msg3 .cv .cp{padding:12px 16px;border-top:1px solid var(--trait)}
.msg3 .cx{border-left:1px solid var(--trait);padding:18px;gap:14px}
.msg3 .cx h4{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2)}
.msg3 .cx .cd{box-shadow:none;background:var(--zone)}
.msg3 .gar{margin-top:auto}
.compo{display:flex;align-items:center;gap:8px;height:54px;padding:0 6px 0 10px;border-radius:999px;background:var(--zone);font-size:13.5px;color:var(--texte2)}
.compo span{flex:1}.compo .env{background:#0F3F37;color:#A6F26B}
/* Notifications en fenêtre ancrée */
.pop{position:absolute;z-index:8;top:100px;right:84px;width:420px;padding:16px;border-radius:28px;background:var(--plein);box-shadow:0 40px 80px -30px rgba(0,0,0,.45),0 0 0 1px var(--trait);display:flex;flex-direction:column;gap:12px}
.pop::before{content:"";position:absolute;top:-7px;right:96px;width:14px;height:14px;background:var(--plein);transform:rotate(45deg);border-radius:3px}
.pop .hd{display:flex;align-items:center;justify-content:space-between}.pop .hd b{font-size:17px}.pop .hd a{white-space:nowrap;font-size:12.5px;font-weight:600;color:var(--texte2)}
.pop .liste{box-shadow:none;background:none;padding:0}
.pop .tout{text-align:center;font-size:13px;font-weight:600;padding:10px;border-radius:16px;background:var(--zone)}
.w-voile.cl{background:rgba(11,26,31,.10)}
'''

def stp(n):
    lab = [('Le CV', 'Choisir le CV'), ('Documents', 'Facultatif'), ('Vérifier', 'Et envoyer')]
    h = ''
    for k, (t, s_) in enumerate(lab, 1):
        cls = 'ok' if k < n else ('on' if k == n else '')
        i = ic('valider', 'xs') if k < n else str(k)
        h += f'<div class="s {cls}"><i>{i}</i><div>{t}<small>{s_}</small></div></div>'
    return (f'<div class="verre w-stp"><div class="of-r"><span class="lg-e sap">BF</span><div><b>Analyste de données junior</b><span>Baobab Fintech · Kinshasa</span></div></div>{h}'
            f'<div class="gr">Postuler est toujours gratuit.</div></div>')

def pg(): return '<span class="pg"><i class="h"></i><i class="s"></i><i></i><i></i><i class="c"></i><i></i><i class="s"></i><i></i><i class="c"></i><i></i></span>'
def cvw(t, s_, on=False, adp=False):
    a = '<span class="adp">Adapté à l’offre</span>' if adp else ''
    return f'<div class="verre cvw {"on" if on else ""}"><div class="ap">{pg()}<span class="radio {"on" if on else ""}"></span></div><div class="t"><b>{t}</b><span>{s_}</span>{a}</div></div>'

def post1(t=False):
    cvs = cvw('Data · Baobab', 'Adapté le 18 oct. · 1 page', True, True) + cvw('Data · octobre', 'Mis à jour le 12 oct. · CV principal') + cvw('Général', 'Mis à jour le 2 sept.')
    return (wh('Postuler', 'Analyste de données junior · Baobab Fintech') +
            f'''<div class="w-post">{stp(1)}<div class="pane">{pas(1)}<span class="pas-t">Étape 1 sur 3 · Brouillon enregistré</span><h2 class="h2s">Quel CV envoyer ?</h2>
<div class="cvg">{cvs}</div><div class="g2e"><a class="ajout">{ic("plus","s")}Créer un CV depuis mon profil</a><a class="verre prep" style="padding:10px 14px">{orbi(32)}<span class="t"><b>Adapter un CV à cette offre</b><span>Orbi crée une copie, à relire</span></span>{ic("suivant","s")}</a></div>
<div class="w-act"><span class="g">{ic("cadenas","xs")}Rien n’est envoyé avant l’étape 3.</span><a class="bt p">Continuer{ic("suivant","xs")}</a></div></div></div>''')

def post2_t():
    return (wh('Postuler', 'Analyste de données junior · Baobab Fintech') + f'''{pas(2)}<span class="pas-t">Étape 2 sur 3 · Facultatif</span>
<h2 class="h2s">Ajouter une lettre ou des documents</h2>
<div class="g2e"><div class="col"><div class="verre pj"><span class="cases">{ic("document","s")}</span><div class="t"><b>Lettre de motivation</b><span>Rédigée le 18 oct.</span></div><a class="bi">{ic("modifier","s")}</a></div>
<div class="verre pj"><span class="cases" style="background:var(--g-former)">{ic("certificat","s")}</span><div class="t"><b>Attestation SQL · Jumanly</b><span>Obtenue le 4 oct.</span></div><a class="bi">{ic("supprimer","s")}</a></div>
<a class="ajout">{ic("plus","s")}Ajouter un document</a></div>
<div class="verre carte sugg">{orbi(36)}<div class="t"><small>Orbi peut aider</small><b>Rédiger une lettre pour cette offre, à relire avant l’envoi.</b><div><a class="bt sec s" style="width:auto;padding:0 15px">Rédiger avec Orbi</a></div></div></div></div>
<div class="w-act"><a class="bt sec">Passer</a><a class="bt p">Continuer{ic("suivant","xs")}</a></div>''')

def post3():
    rec = f'''<div class="verre liste recap">
<div class="li"><span class="cases c2">{ic("profil","s")}</span><div class="t"><b>Grâce Mbuyi</b><span>grace.mbuyi@exemple.cd</span></div><span class="v">Modifier</span></div>
<div class="li"><span class="cases c1">{ic("document","s")}</span><div class="t"><b>2 documents</b><span>Lettre, attestation SQL</span></div><span class="v">Voir</span></div>
<div class="li"><span class="cases c3">{ic("favori","s")}</span><div class="t"><b>Profil Jumanly</b><span>Compétences, expériences, réalisations</span></div><span class="v">Voir</span></div></div>'''
    big = f'<div class="verre cv-big"><div class="ap">{pg()}</div><div class="t"><b style="font-size:16px;display:block">CV « Data · Baobab »</b><span style="font-size:12.5px;color:var(--texte2)">1 page · PDF · adapté le 18 oct.</span><div style="margin-top:12px"><a class="bt sec s" style="width:auto;padding:0 15px">Aperçu</a></div></div></div>'
    return (wh('Postuler', 'Analyste de données junior · Baobab Fintech') +
            f'''<div class="w-post">{stp(3)}<div class="pane">{pas(3)}<span class="pas-t">Étape 3 sur 3</span><h2 class="h2s">Vérifier et envoyer</h2>
<div class="rc2">{big}{rec}</div>
<div class="gar">{ic("confidentialite","s")}Baobab Fintech verra ce dossier et votre profil. Chaque consultation vous est signalée.</div>
<div class="w-act"><a class="bt sec">Retour</a><a class="bt a">{ic("envoyer","s")}Envoyer ma candidature</a></div></div></div>''')

CONF = f'''<div class="conf-d" style="display:flex;flex-direction:column;gap:14px;align-items:center"><span class="rond-ok">{ic("valider")}</span>
<h3>Candidature envoyée</h3><p>Baobab Fintech a reçu votre dossier. Vous suivrez chaque étape dans Suivi.</p>
<div class="suite"><a class="verre"><span class="cases" style="background:var(--g-accomp)">{ic("candidature","s")}</span>Suivre ma candidature</a>
<a class="verre"><span class="cases" style="background:var(--g-oppo)">{ic("opportunites","s")}</span>Offres similaires</a></div><a class="bt txt">Retour aux offres</a></div>'''

# Suivi
def etp(n):
    lab = ['Envoyée', 'En examen', 'Présélectionnée', 'Entretien', 'Décision']
    return '<div class="etp">' + ''.join(f'<div class="{"ok" if k < n else ("now" if k == n else "")}"><i></i>{l}</div>' for k, l in enumerate(lab)) + '</div>'
def cdl(sel=False, *a, **k):
    h = cd(*a, **k)
    return h.replace('class="verre cd"', 'class="verre cd sel"', 1) if sel else h
LST = f'''<div class="lst"><div class="seg"><span class="on">En cours<small>4</small></span><span>Terminées</span></div>
<div class="grp-t">À faire <b>1</b></div>
{cdl(True,'BF','sap','Analyste de données junior','Baobab Fintech','Entretien','ent','Choisir un créneau avant le 22 oct.')}
<div class="grp-t">En attente <b>3</b></div>
{cd('ME','amb','Analyste énergie solaire','Mwinda Énergie · il y a 3 j','Présélectionnée','pre')}
{cd('FB','mer','Chargée d’études marketing','Fleuve Banque · il y a 5 j','En examen','en')}
{cd('KT','sap','Assistante data','Kivu Télécom · il y a 6 j','Envoyée','env')}</div>'''
INV = f'''<div class="verre inv"><span class="k">Invitation à un entretien</span><h3>Entretien en visio, 45 min</h3>
<div class="creneaux"><span class="on"><b>Mar. 22</b>10:00</span><span><b>Mar. 22</b>14:30</span><span><b>Mer. 23</b>09:00</span></div>
<div class="bts"><a class="bt p m pl">Confirmer mardi 10:00</a><a class="bt sec m">Autre date</a></div></div>'''
PREP_E = f'''<div class="verre prep">{orbi(40)}<div class="t"><b>Préparer cet entretien</b><span>Briefing et entraînement avec Orbi</span></div>{ic("suivant","s")}</div>'''
CHR = f'''<div class="verre cartb"><h4>Historique</h4><div class="chrono">
<div class="e now"><i>{ic("entretien","xs")}</i><div class="t"><b>Entretien proposé</b><span>Aujourd’hui</span></div></div>
<div class="e ok"><i>{ic("valider","xs")}</i><div class="t"><b>Présélectionnée</b><span>20 oct.</span></div></div>
<div class="e ok"><i>{ic("valider","xs")}</i><div class="t"><b>En examen</b><span>19 oct. · votre profil a été consulté</span></div></div>
<div class="e ok"><i>{ic("valider","xs")}</i><div class="t"><b>Envoyée</b><span>18 oct.</span></div></div></div></div>'''
DOS = f'''<div class="verre cartb"><h4>Dossier envoyé</h4><div class="liste lignes">
<div class="li"><span class="cases c2">{ic("cv","s")}</span><div class="t"><b>CV « Data · Baobab »</b><span>Version figée du 18 oct.</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("document","s")}</span><div class="t"><b>Lettre de motivation</b></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("certificat","s")}</span><div class="t"><b>Attestation SQL</b></div>{ic("suivant")}</div></div></div>'''
MSGC = f'''<div class="verre cartb"><h4>Messages<a>Ouvrir</a></h4><div class="liste lignes"><div class="li"><span class="lg-e sap" style="width:40px;height:40px;font-size:13px">BF</span><div class="t"><b>Nadia K.</b><span>Merci Grâce, voici les créneaux…</span></div><span class="v">10:12</span></div></div></div>'''
DEM = f'''<div class="verre pj"><span class="cases" style="background:var(--g-oppo)">{ic("document","s")}</span><div class="t"><b>Copie du diplôme demandée</b><span>À envoyer avant le 25 oct.</span></div><a class="bt p s" style="width:auto;padding:0 15px">Ajouter</a></div>'''
DTH = f'''<div class="verre dt-h"><div class="hh"><span class="lg-e sap">BF</span><div class="t"><b>Analyste de données junior</b><span>Baobab Fintech · envoyée le 18 oct.</span></div><em class="st ent" style="font-style:normal">Entretien</em>{bi("plus-options")}</div>{etp(3)}</div>'''

def suivi():
    det = f'''<div class="col">{DTH}{INV}<div class="d2"><div class="col">{PREP_E}{MSGC}</div><div class="col">{CHR}</div></div>{DEM}{DOS}
<a class="sig">{ic("fermer","xs")}Retirer ma candidature</a></div>'''
    return wh('Suivi', '4 candidatures en cours, 1 demande une action.') + f'<div class="md">{LST}{det}</div>'

LST_T = f'''<div class="lst"><div class="seg"><span>En cours<small>4</small></span><span class="on">Terminées</span></div>
<div class="verre cd sel"><div class="haut"><span class="lg-e kiv">KT</span><div class="t"><b>Analyste junior</b><span>Kivu Télécom · 12 oct.</span><em class="st nr">Non retenue</em></div></div></div>
{cd('ME','amb','Stage data','Mwinda Énergie · 2 oct.','Offre clôturée','ret')}
{cd('FB','mer','Assistante marketing','Fleuve Banque · 28 sept.','Retirée','ret')}</div>'''
def termin():
    det = f'''<div class="col"><div class="verre dt-h"><div class="hh"><span class="lg-e kiv">KT</span><div class="t"><b>Analyste junior</b><span>Kivu Télécom · décision du 12 oct.</span></div><em class="st nr" style="font-style:normal">Non retenue</em></div></div>
<div class="rebond" style="padding:18px 20px"><b style="font-size:16px">Ce n’est pas la fin du parcours.</b><span>Votre profil a été étudié jusqu’au bout. 3 offres proches de celle-ci vous attendent.</span></div>
<div class="g3">{"".join(OFS6[:3])}</div>{MG}</div>'''
    return wh('Suivi') + f'<div class="md">{LST_T}{det}</div>'

def suivi_t():
    return wh('Suivi') + f'''<div class="seg"><span class="on">En cours<small>4</small></span><span>Terminées</span></div>
<div class="grp-t">À faire <b>1</b></div>{cd('BF','sap','Analyste de données junior','Baobab Fintech','Entretien','ent','Choisir un créneau avant le 22 oct.')}
<div class="grp-t">En attente <b>3</b></div><div class="g2e">{cd('ME','amb','Analyste énergie solaire','Mwinda Énergie · il y a 3 j','Présélectionnée','pre')}
{cd('FB','mer','Chargée d’études marketing','Fleuve Banque · il y a 5 j','En examen','en')}
{cd('KT','sap','Assistante data','Kivu Télécom · il y a 6 j','Envoyée','env')}</div>'''

def det_t():
    return f'''{DTH}<div class="g2e"><div class="col">{INV}{PREP_E}</div><div class="col">{CHR}</div></div><div class="g2e">{DOS}<div class="col">{MSGC}{DEM}</div></div>'''

# S'entraîner
BRF = f'''<div class="verre brief"><h4>Ce qu’il faut savoir</h4>
<div class="ck"><div class="l ok"><i>{ic("valider","xs")}</i><div class="t"><b>L’entreprise</b><span>Fintech, paiement mobile, 12 agences</span></div></div>
<div class="l ok"><i>{ic("valider","xs")}</i><div class="t"><b>Ce qu’ils vérifieront</b><span>Power BI, SQL, présentation des résultats</span></div></div>
<div class="l ko"><i>{ic("plus","xs")}</i><div class="t"><b>Votre point faible</b><span>SQL avancé : préparez un exemple</span></div></div></div></div>'''
TYP = f'''<div class="verre brief"><h4>Type d’entraînement</h4><div class="opts"><span><b>Rapide</b>10 min</span><span class="on"><b>Standard</b>20 min</span><span><b>Complet</b>30 min</span></div>
<div class="puces"><span class="puce on">Écrit</span><span class="puce">Oral</span></div></div>'''
def brief():
    side = f'''<div class="col"><div class="verre cd"><div class="haut"><span class="lg-e sap">BF</span><div class="t"><b>Entretien Baobab Fintech</b><span>Mardi 22 oct. · 10:00 · visio</span></div></div></div>
<div class="verre w-os"><div class="h">{orbi(40)}<div><b>Avec Orbi</b><span>8 questions, une à la fois</span></div></div><p>Questions tirées de l’offre et de votre CV. Un conseil après chaque réponse, un retour à la fin.</p></div>
<a class="bt a" style="width:100%">{ic("entretien","s")}Commencer</a>
<div class="gar">{ic("cadenas","s")}Privé : le recruteur ne voit jamais vos entraînements.</div></div>'''
    return wh('S’entraîner', 'Entretien du mardi 22 octobre') + f'<div class="g2"><div class="col">{BRF}{TYP}</div>{side}</div>'

def qs():
    r = ''
    for k in range(1, 9):
        cls = 'ok' if k < 3 else ('on' if k == 3 else '')
        lab = ['Présentez-vous', 'Pourquoi Baobab ?', 'Présenter des chiffres', 'Un tableau de bord', 'Une requête SQL', 'Un désaccord', 'Vos priorités', 'Vos questions'][k-1]
        r += f'<div class="r {cls}"><i>{ic("valider","xs") if k < 3 else k}</i>{lab}</div>'
    return f'<div class="verre qs"><h4 style="font-size:14px;font-weight:600;margin-bottom:4px">Questions</h4>{r}</div>'
def sim(t=False):
    main = f'''<div class="pane">{pas(3,8)}<div class="verre q"><small>Question technique · 3 sur 8</small><b>Comment avez-vous déjà présenté des chiffres à une équipe qui n’est pas spécialiste ?</b></div>
<div class="verre rep">J’ai préparé un tableau de bord pour les chefs d’agence, avec trois indicateurs seulement. Chaque lundi, je<span class="cur"></span></div>
<div class="bulle-o">{orbi(32)}<div class="verre corps"><span>Pensez à donner un résultat chiffré : qu’est-ce qui a changé grâce à ce tableau ?</span></div></div>
<div class="w-act"><span class="g">{ic("cadenas","xs")}Privé, jamais partagé.</span><a class="bt sec">Passer</a><a class="bt p">Répondre</a></div></div>'''
    hd = wh('Question 3 sur 8', 'Entraînement standard · écrit', f'<span class="chrono-p verre" style="padding:10px 14px;border-radius:999px">{ic("horloge","s")}12 min restantes</span>')
    if t: return hd + main
    return hd + f'<div class="sim-l">{main}<div class="sim-side">{qs()}</div></div>'

def retour():
    c5 = ''.join(f'<div>{n}<span class="j"><i style="width:{w}%"></i></span><small>{s_}</small></div>' for n, w, s_ in [
        ('Clarté', 85, 'Bien'), ('Structure', 80, 'Bien'), ('Exemples', 55, 'À renforcer'), ('Résultats chiffrés', 40, 'À travailler'), ('Technique', 70, 'Correct')])
    return wh('Votre retour', 'Entraînement standard · 8 questions') + f'''<div class="verre fbh">{orbi(56)}<div class="t"><b>Bonne préparation</b><span>Retour sur 5 critères, sans note. Rien n’est transmis au recruteur.</span></div><a class="bt sec">Recommencer</a><a class="bt p">Terminer</a></div>
<div class="crit5">{c5}</div>
<div class="g2e"><div class="verre fb-c"><h4>Vos points forts</h4><div class="pt ok"><i>{ic("valider","xs")}</i>Réponses claires et structurées</div><div class="pt ok"><i>{ic("valider","xs")}</i>Bonne connaissance de Power BI</div></div>
<div class="verre fb-c"><h4>À travailler</h4><div class="pt ko"><i>{ic("plus","xs")}</i>Chiffrer vos résultats</div><div class="pt ko"><i>{ic("plus","xs")}</i>Exemple de requête SQL avancée</div></div></div>
{MG}'''

# Messages
def lsc(on=True):
    def c(lg, cls, nom, msg, h, nl=False, o=False):
        n = '<span class="nl">1</span>' if nl else ''
        return f'<div class="li {"on" if o else ""}"><span class="lg-e {cls}" style="width:44px;height:44px">{lg}</span><div class="t"><b>{nom}</b><span>{msg}</span></div><div class="hm"><span class="v">{h}</span>{n}</div></div>'
    return (f'<div class="ls"><div class="rech verre">{ic("recherche","s")}<span>Rechercher</span></div><div class="liste lignes" style="box-shadow:none;background:none;padding:0">'
            + c('BF','sap','Nadia K. · Baobab Fintech','Merci Grâce, voici les créneaux proposés…','10:12',False,on)
            + c('ME','amb','Mwinda Énergie','Pouvez-vous envoyer votre attestation SQL ?','Hier',True)
            + c('J','sap','Équipe Jumanly','Bienvenue sur Jumanly. Une question ? Écrivez-nous.','Lun.')
            + f'</div><div class="gar">{ic("confidentialite","s")}Orbi n’a pas accès à vos conversations.</div></div>')
CVS = f'''<div class="cv"><div class="hd"><span class="lg-e sap" style="width:44px;height:44px;font-size:13px">BF</span><div class="t"><b>Nadia K.</b><span>Baobab Fintech · recruteuse · en ligne</span></div>{bi("plus-options")}</div>
<div class="fil"><div class="jour">Aujourd’hui</div>
<div class="b-r">Bonjour Grâce, votre profil nous intéresse. Voici trois créneaux pour un entretien en visio.</div>
<div class="verre b-cr" style="max-width:420px"><span class="k">{ic("agenda","xs")}Créneaux proposés</span><div class="creneaux"><span class="on"><b>Mar. 22</b>10:00</span><span><b>Mar. 22</b>14:30</span><span><b>Mer. 23</b>09:00</span></div><a class="bt p m">Confirmer mardi 10:00</a></div>
<div class="bulle-u">Merci beaucoup, je confirme mardi à 10 h.</div>
<div class="b-f">{ic("document","s")}<div><b>Attestation_SQL.pdf</b><span>Envoyée · 240 Ko</span></div></div></div>
<div class="cp"><div class="compo"><a class="bi" style="background:none">{ic("plus","s")}</a><span>Écrire un message</span><a class="bi env">{ic("envoyer","s")}</a></div></div></div>'''
CX = f'''<div class="cx"><h4>Candidature liée</h4>{cd('BF','sap','Analyste de données junior','Baobab Fintech','Entretien','ent')}
<h4>Fichiers échangés</h4><div class="verre pj" style="box-shadow:none;background:var(--zone)"><span class="cases">{ic("document","s")}</span><div class="t"><b>Attestation_SQL.pdf</b><span>240 Ko</span></div></div>
<a class="bt sec m" style="width:100%">Voir la candidature</a></div>'''
def msgs(t=False):
    if t: return wh('Messages') + f'<div class="msg3 d2c">{lsc()}{CVS}</div>'
    return wh('Messages') + f'<div class="msg3">{lsc()}{CVS}{CX}</div>'

def nt(cls, icn, t, s_, h, nv=False):
    return f'<div class="li {"nv" if nv else ""}"><span class="cases {cls}">{ic(icn,"s")}</span><div class="t"><b>{t}</b><span>{s_}</span></div><span class="v">{h}</span></div>'
POP = f'''<div class="w-voile cl"></div><div class="pop"><div class="hd"><b>Notifications</b><a>Tout marquer comme lu</a></div>
<div class="grp-t">Aujourd’hui</div><div class="liste lignes">
{nt('c2','entretien','Invitation à un entretien','Baobab Fintech · choisissez un créneau','10:12',True)}
{nt('c3','profil','Votre profil a été consulté','Fleuve Banque · Chargée d’études','08:40',True)}</div>
<div class="grp-t">Cette semaine</div><div class="liste lignes">
{nt('c3','candidature','Présélectionnée','Mwinda Énergie · Analyste énergie solaire','Mar.')}
{nt('c1','certificat','Attestation obtenue','SQL : les bases','Lun.')}
{nt('','document','Document demandé','Baobab Fintech · copie du diplôme','Lun.')}</div><a class="tout">Toutes les notifications</a></div>'''

U = '/app/offres/analyste-donnees-junior/postuler'
W_C1 = web(post1(), 'opportunites', url=U)
W_C3 = web(post3(), 'opportunites', url=U)
T_C2 = tab(post2_t(), 'opportunites')
W_C4 = web(detail(), 'opportunites', url='/app/offres/analyste-donnees-junior', over=fenetre(CONF))
W_SU = web(suivi(), 'candidature', url='/app/suivi/baobab-analyste')
W_TE = web(termin(), 'candidature', url='/app/suivi?vue=terminees')
T_SU = tab(suivi_t(), 'candidature')
T_DE = tab(det_t(), 'candidature')
W_BR = web(brief(), 'candidature', url='/app/suivi/baobab-analyste/entrainement')
W_SI = web(sim(), 'candidature', url='/app/suivi/baobab-analyste/entrainement')
W_FB = web(retour(), 'candidature', url='/app/suivi/baobab-analyste/entrainement/retour')
T_SI = tab(sim(True), 'candidature')
W_MS = web(msgs(), 'message', url='/app/messages')
T_MS = tab(msgs(True), 'message')
W_NO = web(pm_job(), 'accueil', url='/app', over=POP)

def W(e, t, n=''): return wrow(wfig(e, '<span class="wtag">Ordinateur</span>' + t, n))
def T(e, t, n=''): return wrow(wfig(e, '<span class="wtag t">Tablette</span>' + t, n))
ECR = [
 ('d1', '1 · Postuler en 3 étapes', 'Les étapes restent visibles à gauche, avec l’offre. CV, documents, vérification ; brouillon enregistré à chaque étape. Gratuit, toujours.',
  [W(W_C1, 'Étape 1 : le CV', 'Les CV en aperçu, celui adapté à l’offre en premier.'),
   W(W_C3, 'Étape 3 : vérifier et envoyer', 'Ce que verra le recruteur, en clair.'),
   T(T_C2, 'Étape 2 : les documents', 'Facultatif. Orbi peut rédiger une lettre, à relire.'),
   W(W_C4, 'Confirmation', 'Fenêtre posée sur l’offre, deux suites seulement.')]),
 ('d2', '2 · Suivi et détail d’une candidature', 'Sur grand écran, la liste et le détail sont côte à côte : on passe d’une candidature à l’autre sans changer de page.',
  [W(W_SU, 'En cours', 'À gauche ce qui demande une action ; à droite l’invitation, la préparation, l’historique, le dossier et les messages.'),
   W(W_TE, 'Terminées', 'Non retenue avec une suite concrète : offres proches et formation.'),
   T(T_SU, 'Liste', 'Une colonne, les cartes en attente sur deux colonnes.'),
   T(T_DE, 'Détail', 'Ouvert en page, mêmes blocs sur deux colonnes.')]),
 ('d3', '3 · S’entraîner avec Orbi', 'Briefing, simulation et retour, lancés depuis la candidature. Privé : le recruteur ne voit jamais les entraînements.',
  [W(W_BR, 'Briefing', 'Ce qu’il faut savoir, durée, écrit ou oral.'),
   W(W_SI, 'Simulation', 'La question au centre, le plan des 8 questions à droite.'),
   W(W_FB, 'Retour', '5 critères sans note, points forts, à travailler, formation liée.'),
   T(T_SI, 'Simulation', '')]),
 ('d4', '4 · Messages et notifications', 'La messagerie s’ouvre sur trois colonnes : conversations, échange, candidature liée. Les notifications s’ouvrent sous la cloche, sans quitter la page.',
  [W(W_MS, 'Messages', 'Orbi n’a pas accès aux conversations avec les recruteurs.'),
   W(W_NO, 'Notifications', 'Groupées par jour, les nouvelles en surbrillance.'),
   T(T_MS, 'Messages', 'Deux colonnes.')]),
 ('d5', '5 · Mode sombre', 'Les mêmes écrans sur fond Nuit.',
  [W(wsombre(W_SU), 'Suivi', ''), W(wsombre(W_MS), 'Messages', ''), T(wsombre(T_SI), 'Simulation', '')]),
]
page_w('talent-2', 'Jumanly · version ordinateur et tablette', 'Talent, lot 2 : postuler et suivre',
       '19 octobre 2026. Les écrans du lot 2 mobile adaptés aux grands écrans : candidature, Suivi, entraînement, messages. Contenus fictifs.', ECR, CSS + CSS1 + CSS2 + CSSW2)
