# Recruteur lot 3, v2 du 19/10 : écrans remplis et plus riches. Chargé par recruteur3.py.
exec(open(H + '/r2plus.py').read().split('# ---------- Entretien : 1.')[0])
CSSR += '''
.cv-r{display:flex;align-items:center;gap:12px;padding:12px 14px}
.cv-r .av{width:46px;height:46px;font-size:13px;box-shadow:none;color:#0F3F37;position:relative}
.cv-r .t{flex:1;min-width:0}.cv-r .t b{display:flex;gap:6px;align-items:center;font-size:14px}
.cv-r .t .o{font-size:11px;color:var(--texte2);display:block}
.cv-r .t .m{font-size:12.5px;color:var(--texte2);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cv-r .t .m.mnl{color:var(--texte);font-weight:600}
.cv-r .hm{display:flex;flex-direction:column;align-items:flex-end;gap:5px;font-size:11px;color:var(--texte2)}
.cv-r .hm i{min-width:18px;height:18px;border-radius:9px;background:#A6F26B;color:#0F3F37;font-style:normal;font-size:10.5px;font-weight:700;display:grid;place-items:center}
.cvs{display:flex;flex-direction:column;gap:0;padding:0}
.cvs .cv-r+.cv-r{border-top:1px solid var(--trait)}
.b-l{align-self:flex-start;max-width:80%;padding:10px 14px;border-radius:20px 20px 20px 6px;background:var(--plein);box-shadow:var(--verre);font-size:13px;line-height:1.45}
.b-m{align-self:flex-end;max-width:80%;padding:10px 14px;border-radius:20px 20px 6px 20px;background:#0F3F37;color:#fff;font-size:13px;line-height:1.45}
.sombre .b-m{background:#C8F59E;color:#0F3F37}
.b-h{font-size:10.5px;color:var(--texte2);margin-top:-6px}.b-h.d{align-self:flex-end}
.inv-mini{align-self:flex-end;width:78%;display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:18px;background:var(--plein);box-shadow:var(--verre);font-size:12px}
.inv-mini .t{flex:1}.inv-mini b{display:block;font-size:12.5px}
.ver-p{display:flex;gap:14px;align-items:center;padding:14px}
.ver-p .t{flex:1;font-size:12.5px;color:var(--texte2)}.ver-p .t b{display:block;font-size:15px;color:var(--texte)}
.up{display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:20px;background:var(--plein);box-shadow:var(--verre)}
.up .th{width:46px;height:58px;border-radius:8px;background:linear-gradient(180deg,#F7F5F1,#E6E0D6);display:flex;flex-direction:column;gap:4px;padding:8px 6px}
.up .th i{height:4px;border-radius:2px;background:var(--piste)}.up .th i.h{background:#0F3F37;width:60%;opacity:.7}
.up .t{flex:1;font-size:11.5px;color:var(--texte2)}.up .t b{display:block;font-size:13px;color:var(--texte)}
.droits{display:grid;grid-template-columns:1.6fr repeat(3,1fr);gap:0;font-size:11.5px;padding:10px 12px}
.droits span{padding:7px 2px;border-bottom:1px solid var(--trait);text-align:center}.droits span.l{text-align:left;color:var(--texte)}
.droits span.h{font-weight:700;font-size:10.5px;color:var(--texte2);text-transform:uppercase}
.droits .y{color:#2E8540;font-weight:700}.droits .n{color:var(--texte2)}
.act-l{display:flex;flex-direction:column;gap:8px;padding:12px 14px;font-size:12.5px}
.act-l div{display:flex;gap:10px;align-items:center}.act-l .av{width:28px;height:28px;font-size:9.5px;box-shadow:none;color:#0F3F37}
.act-l span.x{flex:1}.act-l .av{flex:none}.act-l small{font-size:11px;color:var(--texte2)}
.apc{display:flex;gap:10px;align-items:center;padding:12px;border-radius:18px;background:var(--zone)}
.apc .t{font-size:11.5px;color:var(--texte2)}.apc .t b{display:block;font-size:13px;color:var(--texte)}
.th3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.th3 a{display:flex;flex-direction:column;gap:6px;align-items:center;padding:10px;border-radius:18px;background:var(--plein);box-shadow:var(--verre);font-size:12px;font-weight:600}
.th3 a .ph{width:100%;height:56px;border-radius:12px}
.th3 a.on{box-shadow:0 0 0 2px #0F3F37,var(--verre)}
.ill-o{display:flex;align-items:center;gap:14px;padding:16px;border-radius:24px;background:linear-gradient(140deg,#0F3F37,#14574A);color:#fff}
.ill-o .t{flex:1;font-size:12.5px;color:#CFE9DF;line-height:1.45}.ill-o b{display:block;font-size:15px;color:#fff;margin-bottom:2px}
.logo-up{display:flex;gap:12px;align-items:center}
.logo-up .lg-e{width:56px;height:56px;font-size:16px;border-radius:18px}
.logo-up .t{flex:1;font-size:11.5px;color:var(--texte2)}.logo-up .t b{display:block;font-size:13px;color:var(--texte)}
'''

def cvr(i, cls, nom, off, msg, h, n=0, et=None):
    nb = f'<i>{n}</i>' if n else ''
    e = f'<span class="etq-s {et[1]}">{et[0]}</span>' if et else ''
    return f'<div class="cv-r"><span class="av {cls}">{i}</span><div class="t"><b>{nom}{e}</b><span class="o">{off}</span><span class="m{" mnl" if n else ""}">{msg}</span></div><div class="hm">{h}{nb}</div></div>'

MSG_R = phone(f'''{tete_r("Messages")}
<div class="verre rech">{ic("recherche","s")}<span>Candidat, offre</span></div>
<div class="filtres-h"><span class="puce on">Toutes</span><span class="puce">Non lues<small>3</small></span><span class="puce">Analyste</span><span class="puce">Clientèle</span></div>
<div class="orbi-l">{orbi(26)}<div class="t"><b>2 réponses</b> sont prêtes à relire : Patrick et Ruth.</div><a class="bt p s">Relire</a></div>
<div class="verre cvs">
{cvr("PK","b","Patrick K.","Analyste de données junior","Serait-il possible jeudi ?","09:30",1,("Autre date","rp"))}
{cvr("GM","b","Grâce M.","Analyste de données junior","Merci, je confirme mardi à 10 h.","10:12",1,("Confirmé","ok"))}
{cvr("RB","","Ruth B.","Proposition · Analyste","Oui, l’offre m’intéresse.","Hier",1)}
{cvr("JT","","Joël T.","Chargé de clientèle","Merci pour votre retour.","Lun.")}
{cvr("FN","a","Fatou N.","Analyste de données junior","Vous : Pouvez-vous envoyer votre diplôme ?","Dim.")}</div>
<div class="gar">{ic("confidentialite","s")}Une conversation existe seulement avec un candidat ou un talent qui a accepté le contact.</div>''', 'message', 'long')

CONV_R = phone(f'''<div class="tete-f">{bi("retour")}<span class="av b" style="width:40px;height:40px;font-size:12px;box-shadow:none;color:#0F3F37">PK</span><div style="flex:1"><b style="display:block;font-size:15px">Patrick K.</b><span style="font-size:12px;color:var(--texte2)">Analyste de données junior · Entretien</span></div>{bi("plus-options")}</div>
<div class="ctx-c">{ic("candidats","xs")}<span class="sp">Voir le dossier</span><b>52 %</b></div>
<div class="jour">Hier</div>
<div class="inv-mini"><span class="cases c2" style="width:36px;height:36px;border-radius:12px;background:var(--g-accomp)">{ic("agenda","s")}</span><div class="t"><b>Invitation envoyée</b>Mar. 22 oct. · 10:00 ou 14:30</div></div>
<span class="b-h d">Vous · 16:05</span>
<div class="jour">Aujourd’hui</div>
<div class="b-l">Bonjour, merci pour l’invitation. Mardi je suis en examen toute la journée. Serait-il possible jeudi ?</div>
<span class="b-h">Patrick · 09:30</span>
<div class="brouillon-o"><span class="k">{orbi(18)}Brouillon d’Orbi, à relire</span><p style="margin:0">Bonjour Patrick, pas de souci. Je vous propose jeudi 24 à 11:00 ou vendredi 25 à 9:30. Bonne chance pour votre examen.</p><div class="acts"><a class="bt sec s">Modifier</a><a class="bt p s">Utiliser</a></div></div>''', avec_nav=False,
 bas=f'''<div style="position:absolute;left:12px;right:12px;bottom:26px;z-index:4;display:flex;flex-direction:column;gap:8px">
<div class="chips-a"><span class="puce">{ic("agenda","xs")}Proposer des créneaux</span><span class="puce">{ic("document","xs")}Demander un document</span><span class="puce">Modèles</span></div>
<div class="verre fort compo"><a class="bi" style="background:none">{orbi(24)}</a><span>Écrire un message</span><a class="bi env">{ic("envoyer","s")}</a></div></div>''')

NOTIF_R = phone(f'''{tete_f("Notifications", droite="reglages")}
<div class="pq-o"><div class="h">{orbi(30)}<div class="t"><b>Votre journée en bref</b><span>Résumé par Orbi · 08:00</span></div></div>
<div class="pt"><i class="v">4</i><span>nouvelles candidatures pour Analyste de données junior</span></div>
<div class="pt"><i class="a">1</i><span>demande d’autre date à traiter</span></div></div>
<div class="grp-t">Aujourd’hui</div>
<div class="verre liste lignes">
{nt('c3','candidature','4 nouvelles candidatures','Analyste de données junior','10:40',True)}
{nt('c2','entretien','Grâce M. a confirmé','Mardi 22 oct. à 10:00 · visio','10:12',True)}
{nt('','horloge','Patrick K. propose jeudi','Au lieu de mardi 22','09:30',True)}</div>
<div class="grp-t">Cette semaine</div>
<div class="verre liste lignes">
{nt('c1','offre','Offre en validation','Responsable conformité','Lun.')}
{nt('c3','message','Ruth B. a accepté','Vous pouvez lui écrire','Lun.')}
{nt('','horloge','Fin d’offre dans 5 jours','Chargé de clientèle','Dim.')}</div>''', avec_nav=False, cls='long')

PROF_R = phone(f'''{tete_f("Mon profil RH")}
<div style="display:flex;gap:14px;align-items:center"><span class="av" style="width:76px;height:76px;font-size:22px;color:#0F3F37">NK</span><div style="flex:1"><b style="font-size:16px;display:block">Nadia Kabeya</b><span style="font-size:12px;color:var(--texte2)">Responsable recrutement</span><div style="margin-top:6px"><a class="bt sec s">{ic("photo","xs")}Photo, facultative</a></div></div></div>
{champ('Nom affiché','Nadia Kabeya')}
{champ('Fonction','Responsable recrutement')}
{champ('E-mail professionnel','nadia.k@baobab-fintech.example','', 'cadenas', 'Utilisé pour vérifier l’organisation')}
<div class="champ"><label>Langues d’échange</label><div class="puces"><span class="puce on">Français</span><span class="puce on">Anglais</span><span class="puce">Lingala</span><span class="puce">Swahili</span></div></div>
<span class="lab-c">Ce que voient les candidats</span>
<div class="apc"><span class="av" style="width:40px;height:40px;font-size:12px;box-shadow:none;color:#0F3F37">NK</span><div class="t"><b>Nadia K. · Baobab Fintech</b>Responsable recrutement · répond en 3 jours en moyenne</div></div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Enregistrer</a></div>')

ORG_P = phone(f'''{tete_f("Organisation", droite="modifier")}
<div class="verre org-c"><span class="ban">{BAN["baobab"]}</span><div class="c"><span class="lg-e sap">BF</span><b class="n">Baobab Fintech</b><span class="m">Services financiers · 50 à 200 personnes · {FLAG["cd"]} Kinshasa</span><span class="verif-b" style="align-self:flex-start">{ic("horloge","xs")}Vérification en cours</span></div></div>
<div class="st4"><div class="s1"><b>3</b>offres actives</div><div class="s2"><b>3 j</b>délai de réponse</div><div class="s3"><b>2</b>sites</div><div class="s4"><b>4</b>recrutés</div></div>
{sect("document","former","Présentation","", '<span style="font-size:12.5px;line-height:1.5">Solutions de paiement mobile pour les commerçants d’Afrique centrale.</span><div class="tons"><span>Télétravail partiel</span><span>Formation continue</span><span>Assurance santé</span></div>')}
{sect("localisation","accomp","Sites","2", '<div class="hist-l"><span><b>Kinshasa</b> · Gombe, siège</span><span><b>Lubumbashi</b> · agence</span></div>')}
<div class="orbi-l">{orbi(26)}<div class="t">Ajoutez une photo de vos bureaux : les talents ouvrent plus souvent les pages illustrées.</div></div>
<a class="bt sec pl">{ic("profil","s")}Voir la page comme un talent</a>''', avec_nav=False, cls='long')

VERIF_O = phone(f'''{tete_f("Vérifier l’organisation")}
<div class="verre ver-p">{ring(66).replace("66 %","2/3")}<div class="t"><b>Encore une étape</b>Une organisation vérifiée publie sans attente et affiche un badge.</div></div>
<div class="verre liste lignes ver-et">
<div class="li"><span class="cases c3">{ic("valider","s")}</span><div class="t"><b>E-mail sur le domaine</b><span>@baobab-fintech.example confirmé</span></div></div>
<div class="li"><span class="cases c2">{ic("document","s")}</span><div class="t"><b>Document officiel</b><span>Envoyé le 18 oct.</span></div><span class="etq-s ok">Reçu</span></div>
<div class="li"><span class="cases" style="background:var(--ambre-c)">{ic("horloge","s")}</span><div class="t"><b>Examen par Jumanly</b><span>Sous 2 jours ouvrés</span></div><span class="etq-s at">En cours</span></div></div>
<span class="lab-c">Document envoyé</span>
<div class="up"><span class="th"><i class="h"></i><i></i><i></i><i></i><i style="width:70%"></i></span><div class="t"><b>RCCM_Baobab.pdf</b>1,2 Mo · lisible · données personnelles masquées</div><a class="bt sec s">Remplacer</a></div>
<div class="gar">{ic("offre","s")}En attendant, vos offres passent en validation avant publication.</div>
<div class="gar">{ic("message","s")}Une question : assistant@jumanly.io</div>''', avec_nav=False, cls='long')

EQUIPE = phone(f'''{tete_f("Équipe", droite="plus")}
<div class="verre quota-b" style="flex-direction:column;align-items:stretch;gap:8px"><div style="display:flex;justify-content:space-between"><b>Sièges utilisés : 2 sur 2</b><span style="font-size:12px;color:var(--texte2)">RH Pro</span></div><span class="sieges"><i class="on"></i><i class="on"></i></span></div>
<div class="verre liste lignes">
{mbr("NK","","Nadia Kabeya","vous · toutes les offres","Admin","ad")}
{mbr("OB","b","Olivier B.","Analyste de données junior","Recruteur")}
<div class="li mbr"><span class="av a">ML</span><div class="t"><b>M. Lukusa</b><span>Invitation envoyée par e-mail · 2 j</span></div><span class="role">En attente</span></div></div>
<span class="lab-c">Qui peut faire quoi</span>
<div class="verre droits"><span class="h l"></span><span class="h">Admin</span><span class="h">Recr.</span><span class="h">Lect.</span>
<span class="l">Publier une offre</span><span class="y">✓</span><span class="y">✓</span><span class="n">—</span>
<span class="l">Décider</span><span class="y">✓</span><span class="y">✓</span><span class="n">—</span>
<span class="l">Noter, évaluer</span><span class="y">✓</span><span class="y">✓</span><span class="y">✓</span>
<span class="l">Équipe, abonnement</span><span class="y">✓</span><span class="n">—</span><span class="n">—</span></div>
<span class="lab-c">Activité récente</span>
<div class="verre act-l"><div><span class="av b">OB</span><span class="x">Olivier a évalué Grâce M.</span><small>10:20</small></div><div><span class="av">NK</span><span class="x">Vous avez publié Chargé de clientèle</span><small>Lun.</small></div></div>''', avec_nav=False, cls='long')

PARAM_R = phone(f'''{tete_f("Paramètres", droite=None)}
<span class="ck-t">Notifications</span>
<div class="verre liste lignes">
<div class="li"><div class="t"><b>Nouvelle candidature</b><span>Un résumé par jour</span></div><span class="sw on"></span></div>
<div class="li"><div class="t"><b>Réponse à une invitation</b></div><span class="sw on"></span></div>
<div class="li"><div class="t"><b>Nouveau message</b></div><span class="sw on"></span></div></div>
<span class="ck-t">Apparence</span>
<div class="th3"><a class="on"><span class="ph" style="background:linear-gradient(160deg,#F2EDE5,#DDF6EE)"></span>Clair</a><a><span class="ph" style="background:linear-gradient(160deg,#0B1A1F,#14574A)"></span>Sombre</a><a><span class="ph" style="background:linear-gradient(90deg,#F2EDE5 50%,#0B1A1F 50%)"></span>Auto</a></div>
<span class="ck-t">Sécurité et confidentialité</span>
<div class="verre liste lignes">
<div class="li"><span class="cases">{ic("cadenas","s")}</span><div class="t"><b>Validation en deux étapes</b><span>Recommandée pour les recruteurs</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases">{ic("confidentialite","s")}</span><div class="t"><b>Journal des consultations</b><span>Profils ouverts par l’équipe</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("horloge","s")}</span><div class="t"><b>Fuseau horaire</b><span>Kinshasa (UTC+1)</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("message","s")}</span><div class="t"><b>Signature des messages</b><span>Nadia K. · Baobab Fintech</span></div>{ic("suivant")}</div></div>''', avec_nav=False, cls='long')

OBR1 = phone(f'''{tete_f("", droite=None)}{pas(1,3)}<span class="pas-t">1 sur 3</span>
<div class="ill-o">{orbi(56)}<div class="t"><b>Bienvenue dans Jumanly Hire</b>Publiez, triez et rencontrez les bons talents. Orbi vous aide, vous décidez.</div></div>
<div class="ob-q"><h2>Vous recrutez pour…</h2><p>Jumanly prépare votre espace en conséquence.</p></div>
<div class="obj-g">
<div class="o1 on"><span class="cases">{ic("entreprise","s")}</span><b>Mon entreprise</b>PME, grand groupe, ONG</div>
<div class="o2"><span class="cases">{ic("candidats","s")}</span><b>Un cabinet RH</b>Pour plusieurs clients</div>
<div class="o3"><span class="cases">{ic("profil","s")}</span><b>En indépendant</b>Consultant ou chasseur</div>
<div class="o4"><span class="cases">{ic("former","s")}</span><b>Une école</b>Stages et premiers emplois</div></div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Continuer</a></div>')

OBR2 = phone(f'''{tete_f("", droite=None)}{pas(2,3)}<span class="pas-t">2 sur 3</span>
<div class="ob-q"><h2>Votre organisation</h2><p>Elle apparaîtra sur vos offres.</p></div>
<div class="logo-up"><span class="lg-e sap">BF</span><div class="t"><b>Logo</b>PNG ou SVG, carré · facultatif</div><a class="bt sec s">{ic("photo","xs")}Ajouter</a></div>
{champ('Nom','Baobab Fintech','focus')}
<div class="champ"><label>Pays</label><div class="verre saisie">{FLAG["cd"]}&nbsp;&nbsp;RD Congo</div></div>
<div class="dates"><div class="champ"><label>Secteur</label><div class="verre saisie">Finance</div></div><div class="champ"><label>Taille</label><div class="verre saisie">50 à 200</div></div></div>
{champ('Site web','baobab-fintech.example','', None, 'Facultatif')}
<div class="gar">{ic("cadenas","s")}Votre e-mail @baobab-fintech.example servira à la vérification.</div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Retour</a><a class="bt p pl">Continuer</a></div>')


# ---------- Abonnement, formules, paiement : plus riches ----------
CSS_AB = '''<style>
.ab-hero{position:relative;overflow:hidden;padding:16px 18px;border-radius:24px;background:linear-gradient(140deg,#0F3F37,#1C6B5A);color:#F2EDE5;display:flex;flex-direction:column;gap:4px}
.ab-hero small{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#A6F26B;font-weight:700}
.ab-hero b{font-size:20px}.ab-hero span{font-size:12px;opacity:.8}
.ab-hero .jr{position:absolute;right:16px;top:16px;width:64px;height:64px;border-radius:50%;background:conic-gradient(#A6F26B 0 68%,rgba(255,255,255,.14) 0);display:grid;place-items:center}
.ab-hero .jr i{width:50px;height:50px;border-radius:50%;background:#164F44;display:grid;place-items:center;font-style:normal;font-size:11px;text-align:center;line-height:1.1}
.ab-hero .jr i b{font-size:16px;display:block}
.sombre .ab-hero{background:linear-gradient(140deg,#13493F,#1E6A59)}
.tl-p{display:flex;flex-direction:column;gap:0;padding:12px 16px}
.tl-p .e{display:flex;gap:12px;align-items:flex-start;font-size:12.5px;position:relative;padding-bottom:12px}
.tl-p .e:last-child{padding-bottom:0}
.tl-p .e:before{content:"";position:absolute;left:6px;top:14px;bottom:0;width:2px;background:var(--trait)}
.tl-p .e:last-child:before{display:none}
.tl-p .e i{width:14px;height:14px;border-radius:50%;flex:none;margin-top:2px;background:var(--trait)}
.tl-p .e.ok i{background:#2FD3A6}.tl-p .e.at i{background:#F5B83D}
.tl-p .e div{flex:1}.tl-p .e b{display:block;font-size:13px}.tl-p .e span{color:var(--texte2)}
.cmp{padding:12px 14px;font-size:12px}
.cmp table{width:100%;border-collapse:collapse}.cmp th{font-size:10.5px;color:var(--texte2);text-transform:uppercase;letter-spacing:.05em;padding:4px 2px;text-align:center}
.cmp th:first-child,.cmp td:first-child{text-align:left}
.cmp td{padding:7px 2px;border-top:1px solid var(--trait);text-align:center}.cmp td.on{font-weight:700;color:var(--sapin)}
.cmp th.on{color:var(--sapin)}
.sombre .cmp td.on,.sombre .cmp th.on{color:#A6F26B}
.tot{padding:12px 16px;display:flex;flex-direction:column;gap:6px;font-size:12.5px}
.tot div{display:flex;justify-content:space-between}.tot div span{color:var(--texte2)}
.tot .g{border-top:1px dashed var(--trait);padding-top:8px;font-size:15px;font-weight:700}
.secu3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.secu3 div{padding:10px 8px;border-radius:16px;text-align:center;font-size:11px;color:var(--texte2);display:flex;flex-direction:column;align-items:center;gap:4px}
.secu3 div b{font-size:11.5px;color:var(--texte)}
.secu3 .cases{width:30px;height:30px}
</style>'''

ABO_R = phone(f'''{CSS_AB}{tete_f("Abonnement", droite=None)}
<div class="ab-hero"><small>Votre formule</small><b>RH Pro</b><span>19,9 $ par mois · Baobab Fintech</span><span>Payée jusqu’au 9 novembre</span><span class="jr"><i><b>21</b>jours</i></span></div>
<div class="verre quotas">
<div class="quota"><div class="l"><b>Sièges</b><span>2 sur 2</span></div><span class="barre"><i style="width:100%"></i></span></div>
<div class="quota"><div class="l"><b>Offres actives</b><span>3 sur 5</span></div><span class="barre"><i style="width:60%"></i></span></div>
<div class="quota"><div class="l"><b>Crédits Orbi</b><span>99 sur 100</span></div><span class="barre"><i style="width:99%"></i></span></div>
<div class="quota"><div class="l"><b>Analyse des CV par Orbi</b><span>Incluse</span></div></div>
<div class="quota"><div class="l"><b>Grilles d’évaluation</b><span>RH Premium</span></div></div></div>
<div class="orbi-l">{orbi(26)}<div class="t">Vos 2 sièges sont pris. Pour inviter M. Lukusa, <b>RH Premium</b> ajoute un 3e siège.</div><a class="bt sec s">Voir</a></div>
<span class="ck-t">Échéances</span>
<div class="verre tl-p">
<div class="e ok"><i></i><div><b>Payé · 19,9 $</b><span>10 oct. · Orange Money</span></div></div>
<div class="e at"><i></i><div><b>Rappel par e-mail</b><span>2 nov., 7 jours avant la fin</span></div></div>
<div class="e"><i></i><div><b>Fin de la période</b><span>9 nov. · retour à RH Free si rien n’est payé</span></div></div></div>
<div class="verre liste lignes">
<div class="li"><span class="cases c2">{ic("progression","s")}</span><div class="t"><b>Changer de formule</b><span>RH Free, RH Premium</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("portefeuille","s")}</span><div class="t"><b>Moyen de paiement</b><span>Orange Money · 89 ••• 07</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("document","s")}</span><div class="t"><b>Factures</b><span>Au nom de Baobab Fintech · PDF</span></div>{ic("suivant")}</div></div>
<div class="gar">{ic("horloge","s")}Prépayé. À la fin, retour à RH Free sans rien perdre : les offres en trop passent en pause.</div>''', avec_nav=False, cls='long')

FORMS_R = phone(f'''{CSS_AB}{tete_f("Formules RH")}
<div class="orbi-l">{orbi(26)}<div class="t">Avec 3 recruteurs et 4 offres en cours, <b>RH Premium</b> vous suffit.</div></div>
<div class="verre form"><div class="h"><b>RH Free</b><span class="prix">0 $</span></div><ul><li>{OK()}1 siège, 1 offre active</li><li>{OK()}Candidatures, étapes, messages</li></ul></div>
<div class="verre form"><span class="rec">Votre formule</span><div class="h"><b>RH Pro</b><span class="prix">19,9 $<small> /mois</small></span></div><ul><li>{OK()}2 sièges, 5 offres actives</li><li>{OK()}100 crédits Orbi, analyse des CV</li></ul></div>
<div class="verre form on"><div class="h"><b>RH Premium</b><span class="prix">49,9 $<small> /mois</small></span></div><ul><li>{OK()}3 sièges, 15 offres actives</li><li>{OK()}300 crédits Orbi, grilles d’évaluation</li></ul></div>
<div class="verre cmp"><table><tr><th></th><th>Free</th><th>Pro</th><th class="on">Premium</th></tr>
<tr><td>Sièges</td><td>1</td><td>2</td><td class="on">3</td></tr>
<tr><td>Offres actives</td><td>1</td><td>5</td><td class="on">15</td></tr>
<tr><td>Crédits Orbi</td><td>—</td><td>100</td><td class="on">300</td></tr>
<tr><td>Analyse des CV</td><td>—</td><td>{CK}</td><td class="on">{CK}</td></tr>
<tr><td>Grilles d’évaluation</td><td>—</td><td>—</td><td class="on">{CK}</td></tr></table></div>
<div class="gar">{ic("entreprise","s")}Plus de sièges ou une page entreprise complète : Jumanly Companies, dès 79,9 $/mois.</div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Passer à RH Premium</a></div>')

PAY_R = PAY.replace('<b>Premium · 1 mois</b><br><span>du 19 oct. au 18 nov.</span>', '<b>RH Premium · 1 mois</b><br><span>Baobab Fintech · du 19 oct. au 18 nov.</span>', 1)
PAY_R = PAY_R.replace('<div class="phone ', '<div class="phone long ', 1).replace('<div class="contenu">', '<div class="contenu">' + CSS_AB, 1).replace('Mobile Money.</div>', f'''Mobile Money.</div>
<div class="verre tot"><div><span>RH Premium, 1 mois</span><b>49,9 $</b></div><div><span>Période</span><b>19 oct. → 18 nov.</b></div><div class="g"><span>À payer</span><b>49,9 $</b></div></div>
<div class="secu3"><div class="verre"><span class="cases c2">{ic("cadenas","s")}</span><b>Sécurisé</b>Code saisi sur votre téléphone</div><div class="verre"><span class="cases c1">{ic("document","s")}</span><b>Facture</b>Au nom de l’organisation</div><div class="verre"><span class="cases c3">{ic("horloge","s")}</span><b>Prépayé</b>Aucun prélèvement automatique</div></div>''', 1)

# ---------- Rapports, paramètres, espace prêt : plus riches ----------
CSS_RP = '''<style>
.sem{padding:14px 16px;display:flex;flex-direction:column;gap:10px}
.sem .h{display:flex;justify-content:space-between;font-size:14px}.sem .h span{font-size:11.5px;color:var(--texte2)}
.sem .bars{display:flex;align-items:flex-end;gap:10px;height:92px}
.sem .bars div{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:10.5px;color:var(--texte2);height:100%;justify-content:flex-end}
.sem .bars i{width:100%;border-radius:8px 8px 4px 4px;background:linear-gradient(180deg,#A6F26B,#2FD3A6)}
.sem .bars div.on i{background:linear-gradient(180deg,#1C6B5A,#0F3F37)}
.sombre .sem .bars div.on i{background:linear-gradient(180deg,#A6F26B,#5BE0B8)}
.src{display:flex;flex-direction:column;gap:8px;padding:14px 16px;font-size:12.5px}
.src .s{display:flex;align-items:center;gap:10px}.src .s span{flex:1}.src .s b{font-size:13px}
.src .s i{width:10px;height:10px;border-radius:3px}
.src .stk{display:flex;height:12px;border-radius:999px;overflow:hidden}
.q3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.q3 div{padding:12px 8px;border-radius:18px;text-align:center;font-size:11px;color:var(--texte2)}
.q3 div b{display:block;font-size:20px;color:var(--texte)}
</style>'''

RAPPORT = RAPPORT.replace('<div class="contenu">', '<div class="contenu">' + CSS_RP, 1).replace('<div class="gar">', f'''<div class="verre sem"><div class="h"><b>Candidatures par semaine</b><span>4 dernières semaines</span></div>
<div class="bars"><div><i style="height:40%"></i>S1</div><div><i style="height:62%"></i>S2</div><div><i style="height:48%"></i>S3</div><div class="on"><i style="height:90%"></i>S4</div></div></div>
<div class="verre src"><b style="font-size:14px">D’où viennent-elles</b>
<div class="stk"><i style="width:60%;background:#2FD3A6"></i><i style="width:26%;background:#A6F26B"></i><i style="width:14%;background:#F5B83D"></i></div>
<div class="s"><i style="background:#2FD3A6"></i><span>Offres Jumanly</span><b>21</b></div>
<div class="s"><i style="background:#A6F26B"></i><span>Lien partagé</span><b>9</b></div>
<div class="s"><i style="background:#F5B83D"></i><span>Offre proposée à un talent</span><b>5</b></div></div>
<div class="orbi-l">{orbi(26)}<div class="t">La semaine 4 a doublé après le partage de l’offre <b>Analyste de données</b>.</div></div>
<div class="gar">''', 1)

PARAM_R = PARAM_R.replace('<span class="ck-t">Sécurité et confidentialité</span>', f'''<span class="ck-t">Orbi</span>
<div class="verre liste lignes">
<div class="li"><span class="cases c3">{ic("orbi","s")}</span><div class="t"><b>Résumé du matin</b><span>Chaque jour à 8:00</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases c2">{ic("document","s")}</span><div class="t"><b>Analyse des dossiers</b><span>Seulement à votre demande</span></div><span class="sw on"></span></div></div>
<span class="ck-t">Sécurité et confidentialité</span>''', 1)

OBR3 = OBR3.replace('<div class="contenu">', '<div class="contenu">' + CSS_RP, 1).replace('<div class="verre liste lignes">', f'''<div class="q3"><div class="verre"><b>1</b>siège</div><div class="verre"><b>1</b>offre active</div><div class="verre"><b>5</b>étapes de suivi</div></div>
<div class="orbi-l">{orbi(26)}<div class="t"><b>Orbi</b> peut rédiger votre première offre à partir d’un intitulé. Vous relisez avant de publier.</div></div>
<div class="verre liste lignes">''', 1)

# ---------- v2.3 (19/10, retours d'Ephraïm) : messagerie vivante, badges d'étape, résumé du jour séparé, export PDF ----------
CSSR += """
.etq-s.ret{background:#0F3F37;color:#A6F26B}.sombre .etq-s.ret{background:#A6F26B;color:#0F3F37}
.etq-s.nr{background:#EDE6DD;color:#7A5A4F}.sombre .etq-s.nr{background:rgba(255,255,255,.1);color:#D9C7BF}
.etq-s.ct{background:#DCE8FB;color:#24467A}.sombre .etq-s.ct{background:rgba(157,184,232,.2);color:#C9DAF7}
.av.enl{position:relative}.av.enl:after{content:"";position:absolute;right:0;bottom:0;width:12px;height:12px;border-radius:50%;background:#2FD3A6;box-shadow:0 0 0 2.5px var(--plein)}
.cv-r .t b{flex-wrap:wrap}
.lu{align-self:flex-end;display:flex;align-items:center;gap:4px;font-size:10.5px;color:var(--texte2);margin-top:-6px}
.lu .tk{color:#2FA3D6;font-weight:800;letter-spacing:-3px;margin-right:3px}.lu .tk.g{color:var(--texte2)}
.ecrit{align-self:flex-start;display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--texte2)}
.ecrit i{display:inline-flex;gap:3px;padding:9px 12px;border-radius:16px;background:var(--plein);box-shadow:var(--verre)}
.ecrit i b{width:6px;height:6px;border-radius:50%;background:#9AA6A1}
.cv-top{display:flex;align-items:center;gap:10px}
.cv-top .t{flex:1;min-width:0}.cv-top .t b{display:flex;align-items:center;gap:6px;font-size:15px}
.cv-top .t span{font-size:11.5px}.cv-top .t span.on{color:#1E9C78;font-weight:600}
.ctx2{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:18px;background:var(--plein);box-shadow:var(--verre);font-size:12px}
.ctx2 .t{flex:1}.ctx2 .t b{display:block;font-size:12.5px}.ctx2 .t span{color:var(--texte2)}
.ctx2 .stp4{display:flex;gap:3px;margin-top:5px}.ctx2 .stp4 i{width:22px;height:4px;border-radius:3px;background:var(--piste)}.ctx2 .stp4 i.on{background:#2FD3A6}
.orb-ch{display:flex;gap:6px;overflow:hidden}
.orb-ch span{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap;background:linear-gradient(150deg,#F2FCE6,#DDF6EE)}
.sombre .orb-ch span{background:rgba(166,242,107,.14)}
.compo .plus{background:var(--zone)}
.brief{display:flex;flex-direction:column;gap:0;padding:14px;border-radius:22px;background:linear-gradient(150deg,#F2FCE6,#DDF6EE)}
.sombre .brief{background:linear-gradient(150deg,rgba(166,242,107,.16),rgba(47,211,166,.08))}
.brief .h{display:flex;gap:10px;align-items:center;padding-bottom:10px}
.brief .h .t{flex:1}.brief .h b{display:block;font-size:14px}.brief .h span{font-size:11.5px;color:var(--texte2)}
.brief .msg{font-size:13px;line-height:1.45;padding:10px 12px;border-radius:16px 16px 16px 4px;background:var(--plein);margin-bottom:6px}
.brief .pt{display:flex;gap:10px;align-items:center;padding:10px 2px;border-top:1px dashed rgba(15,63,55,.22);font-size:12.5px}
.sombre .brief .pt{border-top-color:rgba(255,255,255,.14)}
.brief .pt .n{width:28px;height:28px;border-radius:10px;flex:none;display:grid;place-items:center;font-weight:700;font-size:12.5px;color:#0F3F37}
.brief .pt .t{flex:1}.brief .pt .t small{display:block;color:var(--texte2);font-size:11px}
.brief .pt a{font-size:12px;font-weight:700;color:#0F3F37;white-space:nowrap}.sombre .brief .pt a{color:#A6F26B}
.pdf-x{display:flex;gap:12px;align-items:center;padding:12px 14px}
.pdf-x .th{width:44px;height:58px;border-radius:6px;flex:none;background:#fff;box-shadow:inset 0 0 0 1px #E5E0D7;overflow:hidden;display:flex;flex-direction:column}
.pdf-x .th i{height:18px;background:#0F3F37}.pdf-x .th em{height:3px;margin:4px 5px 0;background:#A6F26B;border-radius:2px}.pdf-x .th u{height:3px;margin:3px 5px 0;background:#E2DCD2;border-radius:2px;text-decoration:none}
.pdf-x .t{flex:1;font-size:11.5px;color:var(--texte2)}.pdf-x .t b{display:block;font-size:13px;color:var(--texte)}
"""

def cvr(i, cls, nom, off, msg, h, n=0, et=None, enl=False):
    nb = f'<i>{n}</i>' if n else ''
    e = f'<span class="etq-s {et[1]}">{et[0]}</span>' if et else ''
    return f'<div class="cv-r"><span class="av {cls}{" enl" if enl else ""}">{i}</span><div class="t"><b>{nom}{e}</b><span class="o">{off}</span><span class="m{" mnl" if n else ""}">{msg}</span></div><div class="hm">{h}{nb}</div></div>'

MSG_R = phone(f'''{tete_r("Messages")}
<div class="verre rech">{ic("recherche","s")}<span>Candidat, offre</span></div>
<div class="filtres-h"><span class="puce on">Toutes</span><span class="puce">Non lues<small>3</small></span><span class="puce">Retenus</span><span class="puce">Contacts</span><span class="puce">Non retenus</span></div>
<div class="orbi-l">{orbi(26)}<div class="t"><b>2 réponses</b> sont prêtes à relire, pour Patrick et Ruth.</div><a class="bt p s">Relire</a></div>
<div class="verre cvs">
{cvr("PK","b","Patrick K.","Analyste de données junior","Serait-il possible jeudi ?","09:30",1,("Retenu · entretien","ret"),True)}
{cvr("GM","b","Grâce M.","Analyste de données junior","Merci, je confirme mardi à 10 h.","10:12",1,("Retenue · entretien","ret"))}
{cvr("RB","","Ruth B.","Proposition · Analyste","Oui, l’offre m’intéresse.","Hier",1,("Contact accepté","ct"),True)}
{cvr("FN","a","Fatou N.","Analyste de données junior","Vous : Pouvez-vous envoyer votre diplôme ?","Dim.",0,("En examen","at"))}
{cvr("JT","","Joël T.","Chargé de clientèle","Vous : Merci pour votre candidature…","Lun.",0,("Non retenu","nr"))}</div>
<div class="orbi-l">{orbi(26)}<div class="t"><b>3 conversations</b> de candidats non retenus sont terminées depuis 30 jours. Les retirer de votre messagerie ?</div><a class="bt sec s">Voir</a></div>''', 'message', 'long')

CONV_TETE = f'''<div class="cv-top">{bi("retour")}<span class="av b enl" style="width:42px;height:42px;font-size:12px;box-shadow:none;color:#0F3F37">PK</span><div class="t"><b>Patrick K.</b><div style="display:flex;gap:6px;align-items:center;margin-top:2px"><span class="on">● En ligne</span><span class="etq-s ret">Retenu · entretien</span></div></div>{bi("plus-options")}</div>
<div class="ctx2"><span class="cases" style="width:36px;height:36px;border-radius:12px;background:var(--g-former)">{ic("offre","s")}</span><div class="t"><b>Analyste de données junior</b><span>Étape Entretien · dossier 52 %</span><div class="stp4"><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i></i></div></div><a class="bt sec s">Dossier</a></div>'''
CONV_CORPS = f'''<div class="jour">Hier</div>
<div class="inv-mini"><span class="cases" style="width:36px;height:36px;border-radius:12px;background:var(--g-accomp)">{ic("agenda","s")}</span><div class="t"><b>Invitation envoyée</b>Mar. 22 oct. · 10:00 ou 14:30</div></div>
<span class="lu"><span class="tk">✓✓</span>Lu · hier 16:20</span>
<div class="jour">Aujourd’hui</div>
<div class="b-l">Bonjour, merci pour l’invitation. Mardi je suis en examen toute la journée. Serait-il possible jeudi ?</div>
<span class="b-h">Patrick · 09:30</span>
<div class="b-m">Bonjour Patrick, pas de souci. Jeudi 24 à 11:00 vous convient-il ?</div>
<span class="lu"><span class="tk">✓✓</span>Lu · 09:42</span>
<div class="ecrit"><i><b></b><b></b><b></b></i>Patrick écrit…</div>'''
CONV_BAS = f'''<div style="position:absolute;left:12px;right:12px;bottom:26px;z-index:4;display:flex;flex-direction:column;gap:8px">
<div class="orb-ch"><span>{orbi(16)}Proposer une réponse</span><span>Résumer</span><span>Plus formel</span></div>
<div class="verre fort compo"><a class="bi plus">{ic("plus","s")}</a><span>Écrire un message</span><a class="bi" style="background:none">{orbi(26)}</a><a class="bi env">{ic("envoyer","s")}</a></div></div>'''
CONV_R = phone(CONV_TETE + CONV_CORPS, avec_nav=False, cls='long', bas=CONV_BAS)

NOTIF_R = phone(f'''{tete_f("Notifications", droite="reglages")}
<div class="brief"><div class="h">{orbi(30)}<div class="t"><b>Votre journée en bref</b><span>Orbi · ce matin à 08:00</span></div></div>
<div class="msg">Bonjour Nadia, trois choses vous attendent aujourd’hui. Je n’ai rien envoyé ni modifié.</div>
<div class="pt"><span class="n" style="background:#D9F6C4">4</span><div class="t">Nouvelles candidatures<small>Analyste de données junior</small></div><a>Voir</a></div>
<div class="pt"><span class="n" style="background:#FBE3B0">1</span><div class="t">Demande d’autre date<small>Patrick K. propose jeudi</small></div><a>Répondre</a></div>
<div class="pt"><span class="n" style="background:#C8F0E2">2</span><div class="t">Entretiens à évaluer<small>Grâce M., Joël T.</small></div><a>Évaluer</a></div></div>
<div class="grp-t">Aujourd’hui</div>
<div class="verre liste lignes">
{nt('c3','candidature','4 nouvelles candidatures','Analyste de données junior','10:40',True)}
{nt('c2','entretien','Grâce M. a confirmé','Mardi 22 oct. à 10:00 · visio','10:12',True)}
{nt('','horloge','Patrick K. propose jeudi','Au lieu de mardi 22','09:30',True)}</div>
<div class="grp-t">Cette semaine</div>
<div class="verre liste lignes">
{nt('c1','offre','Offre en validation','Responsable conformité','Lun.')}
{nt('c3','message','Ruth B. a accepté','Vous pouvez lui écrire','Lun.')}</div>''', avec_nav=False, cls='long')

RAPPORT = RAPPORT.replace(f'<a class="bt sec pl">{ic("telecharger","s")}Exporter en CSV</a>', f'''<div class="verre pdf-x"><span class="th"><i></i><em></em><u></u><u></u><u style="width:60%"></u></span><div class="t"><b>Rapport d’octobre · PDF</b>2 pages A4 · aux couleurs de Jumanly</div></div>
<a class="bt p pl">{ic("telecharger","s")}Exporter en PDF</a>''', 1)
