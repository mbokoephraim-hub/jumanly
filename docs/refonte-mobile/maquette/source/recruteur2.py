# Refonte mobile · étape 3, recruteur lot 2 : candidats, dossier, étapes, entretiens, talents (19/10/2026).
# python3 recruteur2.py && node shot.js recruteur-2
import os
H = os.path.dirname(os.path.abspath(__file__))
exec(open(H + '/recruteur1.py').read().split("\n# ---------- 1. À traiter ----------")[0])

CSSR += '''
.cl{display:flex;gap:12px;align-items:center;padding:12px 14px}
.cl .av{width:42px;height:42px;font-size:13px;box-shadow:none}
.cl .t{flex:1;min-width:0}.cl .t b{display:flex;gap:6px;align-items:center;font-size:14px}.cl .t span{display:block;font-size:12px;color:var(--texte2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cl .t span.nv-b{display:inline;color:#0F3F37!important;font-size:10.5px}
.sc-p{display:flex;flex-direction:column;align-items:center;font-size:10px;color:var(--texte2);gap:2px}
.sc-p b{font-size:13px;color:#0F3F37;background:var(--lime-c);border-radius:999px;padding:3px 8px}
.sc-p b.m{background:var(--ciel-c)}.sc-p b.f{background:var(--zone);color:var(--texte)}
.sombre .sc-p b{color:#0F3F37}.sombre .sc-p b.f{color:#0F3F37;background:#D8E3DE}
.off-sel{display:flex;align-items:center;gap:8px;padding:10px 14px;font-size:13px}.off-sel .t{flex:1}.off-sel small{display:block;font-size:11px;color:var(--texte2)}
.off-sel .ic{transform:rotate(90deg);width:14px;height:14px}
.dos-h{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:16px}
.dos-h .av{width:64px;height:64px;font-size:20px}
.dos-h h2{font-size:19px;font-weight:600}.dos-h p{font-size:12.5px;color:var(--texte2)}
.dos-h .k{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center}
.dos-sc{display:flex;align-items:center;gap:10px;padding:12px 14px}
.dos-sc .anneau{width:52px;height:52px;flex:none}.dos-sc .anneau b{width:42px;height:42px;font-size:12px}
.dos-sc .t{flex:1;font-size:12.5px}.dos-sc .t b{display:block;font-size:14px}
.bar-a{position:absolute;left:12px;right:12px;bottom:26px;z-index:4;display:flex;gap:8px;padding:8px;border-radius:999px}
.bar-a .bt{height:46px;font-size:13px}
.bar-a .bi{width:46px;height:46px;flex:none}
.res-o{display:flex;flex-direction:column;gap:8px;padding:14px 16px;border-radius:20px;background:linear-gradient(150deg,#F2FCE6,#DDF6EE);font-size:13px;line-height:1.45}
.sombre .res-o{background:linear-gradient(150deg,rgba(166,242,107,.16),rgba(47,211,166,.08))}
.res-o .h{display:flex;align-items:center;gap:8px;font-weight:600;font-size:13.5px}
.res-o ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px}
.res-o small{font-size:11px;color:var(--texte2)}
.cmp{display:flex;flex-direction:column;gap:6px;font-size:12.5px}
.cmp .r{display:flex;align-items:center;gap:8px}.cmp .r em{flex:1;font-style:normal}
.sec-t a{display:inline-flex;align-items:center;gap:4px}
.cmp .ok{color:#2E8540;font-weight:600}.cmp .no{color:#B7791F;font-weight:600}
.note-p{padding:10px 12px;border-radius:14px;background:var(--ambre-c);font-size:12.5px;line-height:1.4}
.note-p small{display:block;font-size:11px;color:var(--texte2);margin-top:4px}
.repq{font-size:12.5px;display:flex;flex-direction:column;gap:3px}.repq b{font-size:12.5px}.repq span{color:var(--texte2)}
.etp-ch{display:flex;flex-direction:column;gap:0}
.etp-ch .li{min-height:48px}
.res3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.res3 a{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 6px;border-radius:18px;background:var(--plein);box-shadow:var(--verre);font-size:12px;font-weight:600;text-align:center}
.res3 a.on{box-shadow:inset 0 0 0 2px var(--sapin),var(--verre)}
.sombre .res3 a.on{box-shadow:inset 0 0 0 2px var(--lime)}
.modele{padding:12px 14px;border-radius:18px;background:var(--plein);box-shadow:var(--verre);font-size:12.5px;line-height:1.5}
.modele small{display:block;font-size:11px;color:var(--texte2);margin-bottom:4px;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
.cr-add{display:flex;flex-direction:column;gap:8px}
.cr-l{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:16px;background:var(--plein);box-shadow:var(--verre);font-size:13px}
.cr-l .t{flex:1}.cr-l b{font-size:13.5px}
.inv-ap{display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:24px;background:var(--plein);box-shadow:var(--verre)}
.inv-ap .k{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--texte2)}
.inv-ap h3{font-size:16px}.inv-ap p{font-size:12.5px;color:var(--texte2);line-height:1.45}
.ent-st{display:flex;gap:8px;align-items:center;font-size:12px}
.q-o{display:flex;flex-direction:column;gap:4px;padding:12px 14px;border-radius:18px;background:var(--plein);box-shadow:var(--verre);font-size:13px}
.q-o small{font-size:11.5px;color:var(--texte2)}
.eval{display:flex;flex-direction:column;gap:10px}
.eval .c{display:flex;flex-direction:column;gap:6px;padding:12px 14px;border-radius:18px;background:var(--plein);box-shadow:var(--verre)}
.eval .c b{font-size:13.5px}.eval .c small{font-size:11.5px;color:var(--texte2)}
.notes4{display:flex;gap:6px}.notes4 span{flex:1;height:34px;border-radius:12px;background:var(--zone);display:grid;place-items:center;font-size:12px;font-weight:600}
.notes4 span.on{background:#0F3F37;color:#fff}.sombre .notes4 span.on{background:var(--lime);color:#0F3F37}
.tl{display:flex;flex-direction:column;gap:8px;padding:14px 16px}
.tl .h{display:flex;gap:12px;align-items:center}.tl .h .av{width:46px;height:46px;font-size:14px;box-shadow:none}
.tl .h .t{flex:1;min-width:0}.tl .h b{display:block;font-size:14.5px}.tl .h span{font-size:12px;color:var(--texte2)}
.tl .m{display:flex;flex-wrap:wrap;gap:6px}
.tl .b{display:flex;gap:8px}
.consult{display:flex;gap:8px;align-items:center;padding:8px 12px;border-radius:14px;background:var(--ciel-c);font-size:12px}
.consult .ic{width:15px;height:15px;flex:none}
.vv{display:flex;gap:12px;align-items:center;padding:14px}
.vv .pile{display:flex}.vv .pile .av{width:30px;height:30px;font-size:10px;margin-left:-8px;box-shadow:0 0 0 2px var(--plein)}
.vv .pile .av:first-child{margin-left:0}
.vv .t{flex:1}.vv .t b{display:block;font-size:14px}.vv .t span{font-size:12px;color:var(--texte2)}
.sombre .sc-p b{background:#C8F59E}.sombre .sc-p b.m{background:#BFE6F5}
.tl .av,.cl .av,.vv .av{color:#0F3F37!important}
.lock-r{display:flex;flex-direction:column;gap:6px;padding:14px 16px;border-radius:20px;background:var(--zone);font-size:12.5px}
.lock-r b{display:flex;gap:8px;align-items:center;font-size:13.5px}
'''

def cl(i, cls, nom, s_, etape, sc, scc='', nv=False):
    n = '<span class="nv-b">Nouveau</span>' if nv else ''
    return f'<div class="verre cl"><span class="av {cls}">{i}</span><div class="t"><b>{nom}{n}</b><span>{s_}</span><span class="etq" style="display:inline-block;margin-top:4px;font-size:11px;font-weight:600;padding:3px 8px;border-radius:999px;background:var(--zone)">{etape}</span></div><span class="sc-p"><b class="{scc}">{sc} %</b>corresp.</span></div>'
OFFSEL = f'<div class="verre off-sel">{ic("offre","s")}<div class="t"><small>Offre</small><b>Analyste de données junior</b></div>{ic("suivant","s")}</div>'
SEG_C = '<div class="seg"><span class="on">Candidatures</span><span>Rechercher des talents</span></div>'
SEG_T = '<div class="seg"><span>Candidatures</span><span class="on">Rechercher des talents</span></div>'

# ---------- 1. Candidats ----------
CANDS = phone(f'''{tete_r("Candidats")}
{SEG_C}{OFFSEL}
<div class="filtres-h"><span class="puce on">Toutes<small>24</small></span><span class="puce">Reçue<small>9</small></span><span class="puce">En examen<small>7</small></span><span class="puce">Présélectionnée<small>4</small></span></div>
<div class="sec-t" style="margin-top:-4px"><h2 style="font-size:13px;color:var(--texte2);font-weight:500">Triées par correspondance</h2><a>{ic("filtres","xs")} Trier</a></div>
{cl("AM","","Amani M.","Il y a 2 h · CV, lettre","Reçue",88,"",True)}
{cl("GM","b","Grâce M.","18 oct. · CV, attestation","Entretien",86)}
{cl("FN","a","Fatou N.","Hier · CV","Reçue",74,"m",True)}
{cl("JT","","Joël T.","15 oct. · CV, lettre","En examen",71,"m")}
{cl("PK","b","Patrick K.","12 oct. · CV","En examen",52,"f")}''', 'candidats', 'long')

TRI = phone(f'''{tete_r("Candidats")}{SEG_C}''', 'candidats',
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>Trier et filtrer</h3>
<div class="champ"><label>Trier par</label><div class="puces"><span class="puce on">Correspondance</span><span class="puce">Date</span><span class="puce">Étape</span></div></div>
<div class="champ"><label>Correspondance</label><div class="puces"><span class="puce">85 % et plus</span><span class="puce on">70 % et plus</span><span class="puce">Toutes</span></div></div>
<div class="champ"><label>Dossier</label><div class="puces"><span class="puce">Dossier complet</span><span class="puce">Avec lettre</span><span class="puce">Non lues</span></div></div>
<div class="gar">{ic("pourquoi","s")}Un filtre masque, il ne rejette personne. Chaque candidature reste consultable.</div>
<div class="f-act"><a class="bt sec m">Effacer</a><a class="bt p m pl">Voir 18 candidatures</a></div></div>''')

CANDS_VIDE = phone(f'''{tete_r("Candidats")}
{SEG_C}
<div class="verre off-sel">{ic("offre","s")}<div class="t"><small>Offre</small><b>Responsable conformité</b></div>{ic("suivant","s")}</div>
<div class="verre vide-r"><span class="rond-ok" style="background:var(--g-accomp)">{ic("candidats")}</span><b>Pas encore de candidature</b><span>L’offre est en validation. Les candidatures arriveront dès sa publication.</span></div>
<a class="verre carte sugg" style="padding:12px 14px">{ic("recherche","s")}<div class="t"><b style="font-size:13.5px">Rechercher des talents</b><span style="font-size:12px;color:var(--texte2);display:block">Inviter des profils visibles à postuler</span></div>{ic("suivant","s")}</a>''', 'candidats')

# ---------- 2. Dossier ----------
BARRE_A = f'<div class="verre fort bar-a"><a class="bt p pl">{ic("progression","s")}Changer d’étape</a><a class="bi">{ic("entretien","s")}</a><a class="bi">{ic("message","s")}</a></div>'
DOS = phone(f'''{tete_f("Candidature", droite="plus-options")}
<div class="verre dos-h"><span class="av">AM</span><h2>Amani M.</h2><p>Analyste de données · 1 an d’expérience · Kinshasa</p>
<div class="k"><span class="stp br">Reçue</span><span style="font-size:12px;color:var(--texte2)">a postulé il y a 2 h</span></div></div>
<div class="verre dos-sc"><span class="anneau"><b>88 %</b></span><div class="t"><b>Correspondance forte</b>6 compétences sur 7, lieu et contrat</div><a class="pq">{ic("pourquoi","xs")}Pourquoi ?</a></div>
<div class="res-o"><div class="h">{orbi(24)}Résumé par Orbi</div><ul><li>Tableaux de bord Power BI pour 3 agences en stage</li><li>SQL attesté sur Jumanly</li><li>À vérifier : niveau en Python, non prouvé</li></ul><small>Tiré du dossier seulement. Orbi ne décide pas.</small></div>
{sect("cv","oppo","Documents","2", ferme=True)}
{sect("document","former","Réponses aux questions","1", ferme=True)}
{sect("modifier","accomp","Notes privées","1", ferme=True)}
{sect("horloge","former","Historique","3", ferme=True)}''', avec_nav=False, cls='long', bas=BARRE_A)

DOS2 = phone(f'''{tete_f("Candidature", droite="plus-options")}
{sect("cap","accomp","Compétences et offre","6 sur 7",
 '<div class="cmp"><div class="r"><em>SQL</em><b class="ok">Attestation</b></div><div class="r"><em>Power BI</em><b class="ok">Projet</b></div><div class="r"><em>Excel</em><b class="ok">Déclarée</b></div><div class="r"><em>Python (souhaitée)</em><b class="no">Non prouvée</b></div></div>')}
{sect("cv","oppo","Documents","2",
 '<div class="verre liste lignes" style="box-shadow:none;background:none"><div class="li"><span class="cases c2">' + ic("cv","s") + '</span><div class="t"><b>CV_Amani_M.pdf</b><span>Version envoyée le 19 oct.</span></div>' + ic("telecharger","s") + '</div><div class="li"><span class="cases c1">' + ic("document","s") + '</span><div class="t"><b>Lettre de motivation</b></div>' + ic("telecharger","s") + '</div></div>')}
{sect("document","former","Réponses aux questions","1",
 '<div class="rep"><b>Êtes-vous disponible avant le 1er décembre ?</b><em style="font-style:normal;color:var(--texte2)">Oui, dès le 15 novembre.</em></div>')}
{sect("modifier","accomp","Notes privées","1",
 '<div class="note-p">Très bon portfolio. À interroger sur Python.<small>Nadia K. · aujourd’hui · visible par l’équipe seulement</small></div><a class="ajout s">' + ic("plus","s") + 'Ajouter une note</a>')}''', avec_nav=False, cls='long', bas=BARRE_A)

POURQ_R = phone(f'''{tete_f("Candidature", droite="plus-options")}''', avec_nav=False,
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>Pourquoi 88 % ?</h3><p class="ss">Calcul fixe, le même pour tous les candidats de l’offre.</p>
<div class="crit">
<div class="c"><div class="h"><b>Compétences requises</b><span>3 sur 3</span></div><span class="j"><i style="width:100%"></i></span></div>
<div class="c"><div class="h"><b>Compétences souhaitées</b><span>0 sur 1</span></div><span class="j"><i style="width:10%"></i></span><p>Python non prouvé.</p></div>
<div class="c"><div class="h"><b>Expérience</b><span>1 an pour 0 à 2</span></div><span class="j"><i style="width:100%"></i></span></div>
<div class="c"><div class="h"><b>Lieu et contrat</b><span>Correspondent</span></div><span class="j"><i style="width:100%"></i></span></div></div>
<div class="gar">{ic("confidentialite","s")}Jamais pris en compte : nom, genre, âge, photo, nationalité, origine, religion, situation familiale, santé, handicap, adresse précise.</div>
<div class="gar">{ic("pourquoi","s")}Un repère, pas une décision. Aucun candidat n’est écarté par le score.</div></div>''')

ORB_RES = phone(f'''{tete_f("Candidature", droite="plus-options")}''', avec_nav=False,
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>{orbi(24)} Analyse du dossier</h3>
<div class="res-o"><b style="font-size:13px">Points forts</b><ul><li>Expérience concrète de tableaux de bord en agence</li><li>SQL attesté, Power BI prouvé par un projet</li></ul>
<b style="font-size:13px">À vérifier en entretien</b><ul><li>Python : déclaré dans la lettre, sans preuve</li><li>Disponibilité : 15 novembre</li></ul></div>
<div class="gar">{ic("cadenas","s")}Orbi lit le dossier comme une donnée : les consignes écrites dans un CV sont ignorées. 1 crédit Orbi utilisé, 99 restants.</div>
<div class="bts"><a class="bt sec m">Signaler une erreur</a><a class="bt p m pl">Ajouter aux notes</a></div></div>''')

ORB_LOCK = phone(f'''{tete_f("Candidature", droite="plus-options")}
<div class="verre dos-h"><span class="av a">FN</span><h2>Fatou N.</h2><p>Chargée d’études · Kinshasa</p></div>
<div class="lock-r"><b>{orbi(22)}Résumé et analyse par Orbi</b>Disponibles dès RH Pro, avec 100 crédits Orbi par mois.<a class="bt sec s" style="align-self:flex-start;margin-top:4px">Voir RH Pro</a></div>
<div class="gar">{ic("valider","s")}Sans Orbi, tout le dossier reste lisible : CV, réponses, score et son pourquoi.</div>
{sect("cv","oppo","Documents","1", ferme=True)}''', avec_nav=False, bas=BARRE_A)

# ---------- 3. Étapes et décision ----------
ETAPE = phone(f'''{tete_f("Candidature", droite="plus-options")}''', avec_nav=False,
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>Déplacer Amani M.</h3>
<div class="verre liste lignes etp-ch">
<div class="li"><div class="t"><b>Reçue</b></div><span class="v">actuelle</span></div>
<div class="li"><div class="t"><b>En examen</b></div><span class="radio" style="box-shadow:inset 0 0 0 7px var(--sapin)"></span></div>
<div class="li"><div class="t"><b>Présélectionnée</b></div><span class="radio" style="background:none;box-shadow:inset 0 0 0 2px var(--trait)"></span></div>
<div class="li"><div class="t"><b>Entretien</b><span>Proposer des créneaux ensuite</span></div><span class="radio" style="background:none;box-shadow:inset 0 0 0 2px var(--trait)"></span></div>
<div class="li"><div class="t"><b>Décision finale</b><span>Retenue, non retenue ou retrait</span></div><span class="radio" style="background:none;box-shadow:inset 0 0 0 2px var(--trait)"></span></div></div>
<div class="gar">{ic("notification","s")}Amani verra « En examen » dans son suivi. Aucun message n’est envoyé.</div>
<div class="bts"><a class="bt sec m">Annuler</a><a class="bt p m pl">Déplacer</a></div></div>''')

DECIS = phone(f'''{tete_f("Décision finale", droite=None)}
<div class="verre cl" style="padding:12px 14px"><span class="av">JT</span><div class="t"><b>Joël T.</b><span>Chargé de clientèle · Entretien le 23 oct.</span></div></div>
<span class="lab-c">Résultat</span>
<div class="res3"><a><span class="cases c3">{ic("valider","s")}</span>Retenue</a><a class="on"><span class="cases">{ic("fermer","s")}</span>Non retenue</a><a><span class="cases">{ic("deconnexion","s")}</span>Retrait du candidat</a></div>
<span class="lab-c">Message au candidat</span>
<div class="modele"><small>Modèle « Après entretien », à relire</small>Bonjour Joël, merci pour le temps accordé lors de notre entretien. Nous avons retenu un autre profil pour ce poste. Votre dossier a montré de vraies qualités en relation client…</div>
<div class="li" style="padding:0;border:0;min-height:40px"><div class="t"><b>Ajouter au vivier « Relation client »</b><span>Pour une prochaine offre</span></div><span class="sw on"></span></div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Modifier</a><a class="bt p pl">Confirmer et envoyer</a></div>')

DECIS_OK = phone(f'''<span class="rond-ok">{ic("valider")}</span>
<h2 class="h2s">Décision enregistrée</h2><p>Joël T. a reçu votre message. Sa candidature passe en « Non retenue » et rejoint le vivier « Relation client ».</p>
<div class="suite"><a class="verre"><span class="cases" style="background:var(--g-accomp)">{ic("candidats","s")}</span>Candidature suivante</a><a class="verre"><span class="cases" style="background:var(--g-oppo)">{ic("horloge","s")}</span>Annuler sous 10 min</a></div>
<a class="bt txt">Retour aux candidats</a>''', cls='conf publie', avec_nav=False)

# ---------- 4. Entretiens ----------
PROG = phone(f'''{tete_f("Proposer un entretien", droite=None)}
<div class="verre cl" style="padding:12px 14px"><span class="av b">GM</span><div class="t"><b>Grâce M.</b><span>Analyste de données junior</span></div></div>
<div class="seg"><span class="on">Visio</span><span>Sur site</span><span>Audio</span></div>
<div class="dates"><div class="champ"><label>Durée</label><div class="verre saisie">45 min</div></div><div class="champ"><label>Fuseau</label><div class="verre saisie">Kinshasa (UTC+1)</div></div></div>
<span class="lab-c">Créneaux proposés · jusqu’à 3</span>
<div class="cr-add"><div class="cr-l">{ic("agenda","s")}<div class="t"><b>Mar. 22 oct.</b> · 10:00</div>{ic("fermer","xs")}</div><div class="cr-l">{ic("agenda","s")}<div class="t"><b>Mar. 22 oct.</b> · 14:30</div>{ic("fermer","xs")}</div><a class="ajout s">{ic("plus","s")}Ajouter un créneau</a></div>
<span class="lab-c">Participants</span>
<div class="puces"><span class="puce on">Nadia K.</span><span class="puce on">Olivier B.</span><span class="puce">{ic("plus","xs")}Inviter</span></div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Annuler</a><a class="bt p pl">Aperçu</a></div>')

INV_AP = phone(f'''{tete_f("Aperçu de l’invitation", droite=None)}
<span class="ck-t">Ce que verra Grâce</span>
<div class="inv-ap"><span class="k">Invitation à un entretien</span><h3>Entretien en visio, 45 min</h3><p>Baobab Fintech · Analyste de données junior. Avec Nadia K. et Olivier B.</p>
<div class="creneaux"><span><b>Mar. 22</b>10:00</span><span><b>Mar. 22</b>14:30</span></div>
<p>Le lien de visio sera envoyé après confirmation.</p></div>
<div class="champ"><label>Message (facultatif)</label><div class="verre saisie" style="height:64px;align-items:flex-start;padding-top:12px">Bonjour Grâce, votre profil nous intéresse…</div></div>
<div class="gar">{ic("notification","s")}Grâce reçoit une notification et un e-mail. Elle peut confirmer ou demander une autre date.</div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Modifier</a><a class="bt p pl">{ic("envoyer","s")}Envoyer</a></div>')

AGENDA = phone(f'''{tete_f("Entretiens", droite="agenda")}
<div class="filtres-h"><span class="puce on">À venir<small>3</small></span><span class="puce">À évaluer<small>2</small></span><span class="puce">Passés</span></div>
<div class="grp-t">Cette semaine</div>
{ent("22","OCT","Grâce M.","Analyste de données junior","10:00","visio","Confirmé","ok-c")}
{ent("23","OCT","Joël T.","Chargé de clientèle","14:30","sur site","En attente de réponse","att-c")}
<div class="verre cl"><span class="cases" style="background:var(--ambre-c)">{ic("horloge","s")}</span><div class="t"><b>Patrick K. demande une autre date</b><span>Propose jeudi 24 à 11:00</span></div></div>
<div class="bts"><a class="bt sec m">Proposer d’autres créneaux</a><a class="bt p m pl">Accepter jeudi</a></div>''', 'aujourdhui')

PREP_R = phone(f'''{tete_f("Préparer l’entretien", droite=None)}
<div class="verre cl" style="padding:12px 14px"><span class="av b">GM</span><div class="t"><b>Grâce M. · mar. 22, 10:00</b><span>Visio · 45 min · avec Olivier B.</span></div></div>
<div class="res-o"><div class="h">{orbi(24)}Questions proposées par Orbi</div><small>Liées aux compétences de l’offre, jamais à la vie privée.</small></div>
<div class="q-o"><b>Racontez un tableau de bord qui a changé une décision.</b><small>Power BI · indispensable</small></div>
<div class="q-o"><b>Comment vérifiez-vous la qualité d’une donnée ?</b><small>SQL · indispensable</small></div>
<div class="q-o"><b>Quel script Python avez-vous écrit récemment ?</b><small>Python · à vérifier</small></div>
<div class="bts"><a class="bt sec m">{ic("plus","xs")}Ma question</a><a class="bt p m pl">Ouvrir l’évaluation</a></div>''', avec_nav=False, cls='long')

EVAL = phone(f'''{tete_f("Évaluation", droite=None)}
<div class="verre cl" style="padding:12px 14px"><span class="av b">GM</span><div class="t"><b>Grâce M.</b><span>Entretien du 22 oct. · grille de l’offre</span></div></div>
<div class="eval">
<div class="c"><b>Analyse de données</b><small>SQL, Power BI, qualité des données</small><div class="notes4"><span>1</span><span>2</span><span class="on">3</span><span>4</span></div></div>
<div class="c"><b>Communication des résultats</b><small>Clarté, pédagogie</small><div class="notes4"><span>1</span><span>2</span><span>3</span><span class="on">4</span></div></div>
<div class="c"><b>Avis</b><small>Facultatif, visible par l’équipe</small><div class="verre saisie" style="box-shadow:none;background:var(--zone)">Très claire, à former sur Python.</div></div></div>
<div class="seg"><span>Ne pas poursuivre</span><span class="on">Poursuivre</span><span>Hésitation</span></div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Brouillon</a><a class="bt p pl">Enregistrer</a></div>')

# ---------- 5. Talents ----------
def tl(i, cls, nom, s_, tags, sc, scc=''):
    tg = ''.join(f'<span class="tag">{x}</span>' for x in tags)
    return f'<div class="verre tl"><div class="h"><span class="av {cls}">{i}</span><div class="t"><b>{nom}</b><span>{s_}</span></div><span class="sc-p"><b class="{scc}">{sc} %</b>avec l’offre</span></div><div class="m">{tg}</div></div>'
TAL = phone(f'''{tete_r("Candidats")}
{SEG_T}
<div class="verre rech">{ic("recherche","s")}<span>Compétence, métier, ville</span><a class="f">{ic("filtres","s")}<b>3</b></a></div>
<div class="filtres-h"><span class="puce on">SQL</span><span class="puce on">Kinshasa</span><span class="puce on">Junior</span></div>
<span style="font-size:12px;color:var(--texte2)">38 profils visibles · comparés à « Analyste de données junior »</span>
{tl("RB","","Ruth B.","Analyste BI · Kinshasa · disponible",["SQL","Power BI","Attestation"],84)}
{tl("DK","a","David K.","Data analyst · Kinshasa · en poste",["SQL","Python","Projet"],79,"m")}
{tl("SL","b","Sarah L.","Diplômée statistiques · Kinshasa",["Excel","SQL"],66,"m")}''', 'candidats', 'long')

TAL_F = phone(f'''{tete_r("Candidats")}{SEG_T}''', 'candidats',
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>Filtrer les talents</h3>
<div class="champ"><label>Compétences</label><div class="puces"><span class="puce on">SQL</span><span class="puce">Power BI</span><span class="puce">Python</span><span class="puce">{ic("plus","xs")}</span></div></div>
<div class="champ"><label>Lieu</label><div class="puces"><span class="puce on">{FLAG["cd"]} Kinshasa</span><span class="puce">À distance</span></div></div>
<div class="champ"><label>Expérience</label><div class="puces"><span class="puce">Sans</span><span class="puce on">Junior</span><span class="puce">Confirmé</span></div></div>
<div class="champ"><label>Disponibilité</label><div class="puces"><span class="puce">Immédiate</span><span class="puce">Sous 3 mois</span></div></div>
<div class="gar">{ic("confidentialite","s")}Pas de filtre sur l’âge, le genre, la nationalité ou la photo. Seuls les profils rendus visibles apparaissent.</div>
<div class="f-act"><a class="bt sec m">Effacer</a><a class="bt p m pl">Voir 38 profils</a></div></div>''')

TPROF = phone(f'''{tete_f("Profil", droite="plus-options")}
<div class="consult">{ic("confidentialite","s")}Profil rendu visible par Ruth. Votre consultation est enregistrée.</div>
<div class="verre dos-h"><span class="av">RB</span><h2>Ruth B.</h2><p>Analyste BI · 2 ans · Kinshasa</p><div class="k"><span class="stp pub">Disponible</span><span class="stp val">CDI, CDD</span></div></div>
<div class="verre dos-sc"><span class="anneau"><b>84 %</b></span><div class="t"><b>Avec « Analyste de données junior »</b>3 compétences requises sur 3</div><a class="pq">{ic("pourquoi","xs")}Pourquoi ?</a></div>
{sect("cap","former","Compétences","5",
 '<div class="prv"><b>SQL</b><span class="pr">' + ic("certificat","xs") + 'Attestation</span></div><div class="prv"><b>Power BI</b><span class="pr">' + ic("realisation","xs") + 'Projet</span></div>')}
{sect("realisation","oppo","Projets","2", ferme=True)}
{sect("entreprise","accomp","Expériences","2", ferme=True)}''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">{ic("favori","s")}Vivier</a><a class="bt p pl">{ic("message","s")}Proposer l’offre</a></div>')

CONTACT = phone(f'''{tete_f("Profil", droite="plus-options")}''', avec_nav=False,
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>Proposer une offre à Ruth</h3>
<div class="verre off-sel">{ic("offre","s")}<div class="t"><small>Offre</small><b>Analyste de données junior</b></div>{ic("suivant","s")}</div>
<div class="champ"><label>Message</label><div class="verre saisie" style="height:76px;align-items:flex-start;padding-top:12px">Bonjour Ruth, votre profil correspond à notre offre. Cette offre vous intéresse-t-elle ?</div></div>
<a class="verre carte sugg" style="padding:10px 14px">{orbi(26)}<div class="t"><b style="font-size:13px">Améliorer avec Orbi</b></div>{ic("suivant","s")}</a>
<div class="gar">{ic("confidentialite","s")}Ruth décide. Vous voyez son contact seulement si elle accepte. 4 demandes restantes ce mois-ci.</div>
<div class="bts"><a class="bt sec m">Annuler</a><a class="bt p m pl">{ic("envoyer","s")}Envoyer</a></div></div>''')

VIVIERS = phone(f'''{tete_f("Viviers", droite="plus")}
<div class="verre vv"><span class="pile"><span class="av">RB</span><span class="av a">DK</span><span class="av b">SL</span></span><div class="t"><b>Data junior</b><span>12 talents · mis à jour hier</span></div>{ic("suivant","s")}</div>
<div class="verre vv"><span class="pile"><span class="av b">JT</span><span class="av">MK</span></span><div class="t"><b>Relation client</b><span>7 talents · 15 oct.</span></div>{ic("suivant","s")}</div>
<div class="verre vv"><span class="pile"><span class="av a">AN</span></span><div class="t"><b>Conformité</b><span>3 talents · 2 oct.</span></div>{ic("suivant","s")}</div>
<div class="gar">{ic("confidentialite","s")}Un talent sort du vivier s’il masque son profil ou le demande.</div>''', 'candidats')

exec(open(H + '/r2plus.py').read())

CHEMINS = [
 ('Voir les candidatures d’une offre', ['Candidats', 'Candidatures', 'Choisir l’offre', 'Filtrer par étape']),
 ('Examiner un dossier', ['Candidats ou À traiter', 'Une candidature', 'Dossier']),
 ('Comprendre le score', ['Dossier', 'Pourquoi ?']),
 ('Analyser avec Orbi', ['Dossier', 'Résumé par Orbi', 'Ajouter aux notes']),
 ('Changer d’étape', ['Dossier', 'Changer d’étape', 'Déplacer']),
 ('Clôturer une candidature', ['Dossier', 'Changer d’étape', 'Décision finale', 'Relire le message', 'Confirmer']),
 ('Proposer un entretien', ['Dossier', 'Entretien', 'Créneaux', 'Aperçu', 'Envoyer']),
 ('Suivre les entretiens', ['À traiter', 'Agenda', 'Entretiens']),
 ('Préparer et évaluer', ['Entretiens', 'Préparer', 'Évaluation']),
 ('Trouver des talents', ['Candidats', 'Rechercher des talents', 'Filtres', 'Profil', 'Proposer l’offre ou Vivier']),
]
def chemins():
    h = ''.join(f'<div class="chemin"><h4>{t}</h4><div class="ch-et">' + '<em>→</em>'.join(f'<span>{x}</span>' for x in et) + '</div></div>' for t, et in CHEMINS)
    return f'<div class="chemins">{h}</div>'

ECR = [
 ('q0','0 · Comment on y arrive','Pour chaque écran, le chemin depuis la barre.', []),
 ('q0b','0 bis · L’onglet Candidats, appui par appui','Trois vues : ceux qui ont postulé, ceux qu’on découvre, ceux à qui on a proposé une offre. Et ce que chaque appui ouvre.',
  [ecrans((CANDS,'Appui sur « Candidatures »','Les candidatures de l’offre choisie, par étape.'),(DOS,'Puis sur une personne','Son dossier complet.'),(TAL,'Appui sur « Rechercher des talents »','Sous-onglet Découvrir : profils visibles.'),(TPROF,'Puis sur « Consulter »','Le profil, avec Proposer l’offre.'),(PROPS,'Appui sur « Mes propositions »','Acceptées, en attente, refusées.'))]),
 ('q1','1 · Candidats','L’ATS mobile : une offre, un filtre par étape, des candidatures triées par correspondance. Un filtre ne rejette personne.',
  [ecrans((CANDS,'Candidatures','Offre choisie, étapes, score, nouveau.'),(TRI,'Trier et filtrer','Masquer n’est pas rejeter.'),(CANDS_VIDE,'Pas encore de candidature','État vide utile.'))]),
 ('q2','2 · Dossier d’une candidature','L’essentiel en haut, le reste replié. Trois actions toujours en bas : changer d’étape, entretien, message.',
  [ecrans((DOS,'Dossier','Score, résumé Orbi, sections.'),(DOS2,'Sections ouvertes','Compétences et preuves, documents, réponses, notes privées.'),(POURQ_R,'Pourquoi 88 % ?','Critères, données exclues.'),(ORB_RES,'Analyse par Orbi','Points forts, à vérifier, crédits.'),(ORB_LOCK,'En RH Free','Le dossier reste complet sans Orbi.'))]),
 ('q3','3 · Étapes et décision','Toujours un geste humain, avec confirmation. Le message au candidat se relit avant l’envoi.',
  [ecrans((ETAPE,'Changer d’étape','Ce que verra le candidat.'),(DECIS,'Décision finale','Retenue, non retenue, retrait ; modèle à relire.'),(DECIS_OK,'Décision enregistrée','Annulable 10 minutes.'))]),
 ('q4','4 · Entretiens','Proposer jusqu’à 3 créneaux, voir l’invitation comme le candidat, suivre les réponses, préparer, évaluer.',
  [ecrans((PROG,'Proposer un entretien','Mode, durée, calendrier, disponibilités lues par Orbi.'),(PROG2,'Choisir les heures','Journée de l’équipe, créneaux, suggestion d’Orbi.'),(INV_AP,'Aperçu de l’invitation','Ce que reçoit le candidat.'),(AGENDA,'Entretiens','Semaine, statuts en couleur, préparation.'),(PREP_R,'Préparer','Questions liées à l’offre.'),(EVAL,'Évaluation','Grille de l’offre, avis, suite.'))]),
 ('q5','5 · Rechercher des talents','Seuls les profils rendus visibles. Chaque consultation est enregistrée. Le talent décide de répondre.',
  [ecrans((TAL,'Rechercher','Liste verticale continue, Consulter.'),(TAL_F,'Filtres','Aucun critère personnel.'),(TPROF,'Profil d’un talent','Analyse Orbi, preuves, projets, expérience et formation.'),(CONTACT,'Proposer l’offre','Message personnalisé par Orbi, annonce jointe, quota.'),(VIVIERS,'Viviers','Talents gardés pour plus tard.'))]),
 ('q6','6 · Mode sombre','',
  [ecrans((sombre(CANDS),'Candidatures',''),(sombre(DOS),'Dossier',''),(sombre(TAL),'Talents',''))]),
]
EXTRA = {'q0': chemins(), 'q0b': CMAP}
som = ''.join(f'<li><a href="#{i}">{t.split(" · ")[1]}</a></li>' for i, t, _, _ in ECR)
corps = ''.join(bloc(i, t, d, *p).replace('</div></section>', EXTRA.get(i, '') + '</div></section>') if i in EXTRA else bloc(i, t, d, *p) for i, t, d, p in ECR)
html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Refonte mobile · recruteur, lot 2</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>{open(H + '/fondations.css').read()}{CSS}{CSS2}{CSS3L}{CSS4}{CSSR}</style></head><body>
<header class="couv"><span class="k">{orbi(22)}Jumanly Hire · refonte mobile · étape 3</span><h1>Recruteur, lot 2 : trier, décider, rencontrer</h1>
<p>19 octobre 2026. Candidatures par étape, dossier, score expliqué, analyse Orbi, décision, entretiens, recherche de talents, viviers. Contenus fictifs.</p>
<ul class="som">{som}</ul></header>{corps}<p class="fin">Jumanly · Learn. Grow. Connect.</p></body></html>'''
exec(open(H + '/sans_tap.py').read()); html = sans_tap(html); html = epure(html)
out = os.path.join(H, '..', 'refonte-mobile-recruteur-2.html')
open(out, 'w').write(html); print(out, len(html))
