# Refonte mobile · étape 2, lot 2 : candidature, Suivi, détail d'une candidature, entraînement (18/10/2026).
# python3 talent2.py && node shot.js talent-2
import os
H = os.path.dirname(os.path.abspath(__file__))
exec(open(H + '/talent1.py').read().split("ECR = [")[0])   # aides + CSS du lot 1

CSS2 = '''
.tete-f{display:flex;align-items:center;gap:10px;padding:6px 0 0}.tete-f h1{flex:1;font-size:17px;font-weight:600}
.pas{display:flex;gap:6px}.pas i{flex:1;height:5px;border-radius:3px;background:var(--piste)}.pas i.ok{background:var(--sapin)}.sombre .pas i.ok{background:var(--lime)}
.pas-t{font-size:12px;color:var(--texte2);margin-top:-6px}
.h2s{font-size:20px;font-weight:600;letter-spacing:-.02em;line-height:1.25}
.cvc{display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:22px}
.cvc .mini{width:46px;height:60px;border-radius:8px;background:#fff;box-shadow:0 0 0 1px var(--trait);display:flex;flex-direction:column;gap:4px;padding:7px 6px;flex:none}
.cvc .mini i{height:4px;border-radius:2px;background:#DCE5E1}.cvc .mini i:first-child{background:#0F3F37;width:70%}
.cvc .t{flex:1}.cvc .t b{display:block;font-size:14px}.cvc .t span{font-size:12px;color:var(--texte2)}
.cvc.on{box-shadow:0 0 0 2px var(--sapin),var(--verre)}.sombre .cvc.on{box-shadow:0 0 0 2px var(--lime),var(--verre)}
.adp{font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px;background:var(--lime-c)}
.pj{display:flex;gap:12px;align-items:center;padding:12px 14px}
.pj .cases{width:40px;height:40px;border-radius:14px;display:grid;place-items:center;background:var(--g-accomp);flex:none}
.pj .t{flex:1}.pj .t b{display:block;font-size:13.5px}.pj .t span{font-size:12px;color:var(--texte2)}
.ajout{display:flex;align-items:center;justify-content:center;gap:8px;padding:14px;border-radius:22px;border:1.5px dashed var(--piste);font-size:13.5px;font-weight:600;color:var(--texte2)}
.recap .li{min-height:52px}
.bas-f{position:absolute;left:0;right:0;bottom:0;z-index:5;padding:14px 16px 30px;display:flex;gap:10px;border-radius:28px 28px 0 0}
.bas-f .bt{flex:1}
.conf .contenu{align-items:center;text-align:center;justify-content:center;gap:16px}
.conf .contenu{padding-bottom:40px}.conf .rond-ok{width:96px;height:96px;border-radius:50%;background:var(--g-accent);display:grid;place-items:center;box-shadow:var(--halo);margin-top:60px}
.conf .rond-ok .ic{width:44px;height:44px;color:var(--sapin)}
.conf p{color:var(--texte2);font-size:13.5px;max-width:300px}
.suite{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%}
.suite a{display:flex;flex-direction:column;gap:8px;padding:14px;border-radius:22px;text-align:left;font-size:13px;font-weight:600}
.suite .cases{width:38px;height:38px;border-radius:13px;display:grid;place-items:center}
.grp-t{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2)}
.grp-t b{font-size:11px;padding:2px 7px;border-radius:999px;background:var(--zone);color:var(--texte)}
.cd{display:flex;flex-direction:column;gap:10px;padding:14px 16px}
.cd .haut{display:flex;gap:12px;align-items:center}.cd .haut .t{flex:1;min-width:0}.cd .haut b{display:block;font-size:14px}.cd .haut span{font-size:12px;color:var(--texte2)}
.st{font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:999px;white-space:nowrap}
.st.en{background:var(--ciel-c)}.st.pre{background:var(--menthe-c)}.st.ent{background:var(--g-accent);color:#0F3F37}.st.env{background:var(--zone)}.st.nr{background:var(--corail-c)}.st.ret{background:var(--zone);color:var(--texte2)}
.act{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:16px;background:var(--ambre-c);font-size:12.5px;font-weight:600}
.act .ic{width:16px;height:16px}.act span{flex:1}
.cd.min{padding:12px 16px}.cd.min .haut b{font-size:13.5px}
.chrono{display:flex;flex-direction:column}
.chrono .e{display:flex;gap:12px;position:relative;padding-bottom:14px}
.chrono .e::before{content:"";position:absolute;left:11px;top:24px;bottom:0;width:2px;background:var(--piste)}
.chrono .e:last-child::before{display:none}
.chrono .e i{width:24px;height:24px;border-radius:50%;flex:none;display:grid;place-items:center;background:var(--plein);box-shadow:inset 0 0 0 2px var(--piste);z-index:1}
.chrono .e.ok i{background:var(--sapin);color:var(--lime);box-shadow:none}.chrono .e.now i{background:var(--g-accent);box-shadow:none;color:#0F3F37}
.chrono .e i .ic{width:12px;height:12px}
.chrono .e .t b{display:block;font-size:13.5px}.chrono .e .t span{font-size:12px;color:var(--texte2)}
.inv{display:flex;flex-direction:column;gap:12px;padding:16px;background:var(--g-accomp)}
.inv .k{font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.inv h3{font-size:16px;font-weight:600}
.creneaux{display:flex;gap:8px}.creneaux span{flex:1;text-align:center;padding:10px 4px;border-radius:16px;background:rgba(255,255,255,.75);font-size:12px;line-height:1.3}
.creneaux span b{display:block;font-size:13.5px}.creneaux span.on{background:#0F3F37;color:#fff}
.sombre .creneaux span{background:rgba(255,255,255,.08)}.sombre .creneaux span.on{background:var(--lime);color:#0F3F37}
.inv .bts{flex-wrap:nowrap}
.lignes .li{min-height:56px}
.brief{display:flex;flex-direction:column;gap:12px;padding:16px}
.brief h4{font-size:15px;font-weight:600}
.opts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.opts span{padding:12px 6px;border-radius:18px;text-align:center;font-size:12px;background:var(--zone);line-height:1.3}
.opts span b{display:block;font-size:13.5px}.opts span.on{background:var(--g-accent);color:#0F3F37}
.q{padding:16px;display:flex;flex-direction:column;gap:8px}
.q small{font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2)}
.q b{font-size:16px;line-height:1.35;font-weight:600}
.rep{min-height:130px;padding:14px 16px;border-radius:22px;font-size:13.5px;line-height:1.5}
.rep .cur{display:inline-block;width:2px;height:16px;background:var(--texte);vertical-align:-3px}
.fb-c{display:flex;flex-direction:column;gap:10px;padding:16px}
.fb-c h4{font-size:15px;font-weight:600}
.fb-c .pt{display:flex;gap:10px;font-size:13px}.fb-c .pt i{width:22px;height:22px;border-radius:50%;flex:none;display:grid;place-items:center}
.fb-c .pt.ok i{background:var(--lime-c)}.fb-c .pt.ko i{background:var(--ambre-c)}.fb-c .pt i .ic{width:12px;height:12px}
'''

def tete_f(titre, gauche='retour', droite='fermer'):
    return f'<div class="tete-f">{bi(gauche)}<h1>{titre}</h1>{bi(droite) if droite else ""}</div>'
def pas(n, tot=3): return '<div class="pas">' + ''.join(f'<i class="{"ok" if k < n else ""}"></i>' for k in range(tot)) + '</div>'
def cvc(t, s, on=False, adp=False):
    a = '<span class="adp">Adapté à l’offre</span>' if adp else ''
    return f'<div class="verre cvc {"on" if on else ""}"><span class="mini"><i></i><i></i><i></i><i></i><i></i></span><div class="t"><b>{t}</b><span>{s}</span></div>{a}<span class="radio" style="{"box-shadow:inset 0 0 0 7px var(--sapin)" if on else ""}"></span></div>'
OFF_L = '<div class="verre cd min"><div class="haut"><span class="lg-e sap">BF</span><div class="t"><b>Analyste de données junior</b><span>Baobab Fintech · Kinshasa</span></div></div></div>'

# 1. Étape 1 : le CV
C1 = phone(f'''{tete_f("Postuler")}{pas(1)}<span class="pas-t">Étape 1 sur 3 · Brouillon enregistré</span>
{OFF_L}
<h2 class="h2s">Quel CV envoyer ?</h2>
{cvc("Data · Baobab", "Adapté le 18 oct. · 1 page", True, True)}
{cvc("Data · octobre", "Mis à jour le 12 oct. · CV principal")}
{cvc("Général", "Mis à jour le 2 sept.")}
<a class="ajout">{ic("plus","s")}Créer un CV depuis mon profil</a>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Continuer</a></div>')

# 2. Étape 2 : pièces jointes
C2 = phone(f'''{tete_f("Postuler")}{pas(2)}<span class="pas-t">Étape 2 sur 3 · Facultatif</span>
<h2 class="h2s">Ajouter une lettre ou des documents</h2>
<div class="verre pj"><span class="cases">{ic("document","s")}</span><div class="t"><b>Lettre de motivation</b><span>Rédigée le 18 oct.</span></div><a class="bi">{ic("modifier","s")}</a></div>
<div class="verre pj"><span class="cases" style="background:var(--g-former)">{ic("certificat","s")}</span><div class="t"><b>Attestation SQL · Jumanly</b><span>Obtenue le 4 oct.</span></div><a class="bi">{ic("supprimer","s")}</a></div>
<a class="ajout">{ic("plus","s")}Ajouter un document</a>
<div class="verre carte sugg">{orbi(36)}<div class="t"><small>Orbi peut aider</small><b>Rédiger une lettre pour cette offre, à relire avant l’envoi.</b></div></div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Passer</a><a class="bt p pl">Continuer</a></div>')

# 3. Étape 3 : vérifier et envoyer
C3 = phone(f'''{tete_f("Postuler")}{pas(3)}<span class="pas-t">Étape 3 sur 3</span>
<h2 class="h2s">Vérifier et envoyer</h2>
<div class="verre liste recap">
<div class="li"><span class="cases c2">{ic("profil","s")}</span><div class="t"><b>Grâce Mbuyi</b><span>grace.mbuyi@exemple.cd</span></div><span class="v">Modifier</span></div>
<div class="li"><span class="cases c2">{ic("cv","s")}</span><div class="t"><b>CV « Data · Baobab »</b><span>1 page · PDF</span></div><span class="v">Voir</span></div>
<div class="li"><span class="cases c1">{ic("document","s")}</span><div class="t"><b>2 documents</b><span>Lettre, attestation SQL</span></div><span class="v">Voir</span></div></div>
<div class="gar">{ic("confidentialite","s")}Baobab Fintech verra ce dossier et votre profil. Chaque consultation vous est signalée.</div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt a pl">{ic("envoyer","s")}Envoyer ma candidature</a></div>')

# 4. Confirmation
C4 = phone(f'''<span class="rond-ok">{ic("valider")}</span>
<h2 class="h2s">Candidature envoyée</h2><p>Baobab Fintech a reçu votre dossier. Vous suivrez chaque étape dans Suivi.</p>
<div class="suite"><a class="verre"><span class="cases" style="background:var(--g-accomp)">{ic("candidature","s")}</span>Suivre ma candidature</a>
<a class="verre"><span class="cases" style="background:var(--g-oppo)">{ic("opportunites","s")}</span>Offres similaires</a></div>
<a class="bt txt">Retour aux offres</a>''', cls='conf', avec_nav=False)

# 5. Suivi, groupé par situation
def cd(lg, cls, t, e, st, stc, act=None):
    a = f'<div class="act">{ic("horloge","xs")}<span>{act}</span>{ic("suivant","xs")}</div>' if act else ''
    return f'<div class="verre cd"><div class="haut"><span class="lg-e {cls}">{lg}</span><div class="t"><b>{t}</b><span>{e}</span></div><span class="st {stc}">{st}</span></div>{a}</div>'
SUIVI = phone(f'''{tete("Suivi")}
<div class="seg"><span class="on">En cours<small>4</small></span><span>Terminées</span></div>
<div class="grp-t">À faire <b>1</b></div>
{cd('BF','sap','Analyste de données junior','Baobab Fintech','Entretien','ent','Choisir un créneau avant le 22 oct.')}
<div class="grp-t">En attente <b>3</b></div>
{cd('ME','amb','Analyste énergie solaire','Mwinda Énergie · il y a 3 j','Présélectionnée','pre')}
{cd('FB','mer','Chargée d’études marketing','Fleuve Banque · il y a 5 j','En examen','en')}
{cd('KT','sap','Assistante data','Kivu Télécom · il y a 6 j','Envoyée','env')}''', 'candidature')

# 6. Détail d'une candidature : invitation à l'entretien
DET = phone(f'''{tete_f("Candidature", droite="plus-options")}
<div class="verre cd"><div class="haut"><span class="lg-e sap">BF</span><div class="t"><b>Analyste de données junior</b><span>Baobab Fintech · envoyée le 18 oct.</span></div></div></div>
<div class="verre inv"><span class="k">Invitation à un entretien</span><h3>Entretien en visio, 45 min</h3>
<div class="creneaux"><span class="on"><b>Mar. 22</b>10:00</span><span><b>Mar. 22</b>14:30</span><span><b>Mer. 23</b>09:00</span></div>
<div class="bts"><a class="bt p m pl">Confirmer</a><a class="bt sec m">Autre date</a></div></div>
<div class="verre prep">{orbi(40)}<div class="t"><b>Préparer cet entretien</b><span>Briefing et entraînement avec Orbi</span></div>{ic("suivant","s")}</div>
<div class="verre carte"><div class="chrono">
<div class="e now"><i>{ic("entretien","xs")}</i><div class="t"><b>Entretien proposé</b><span>Aujourd’hui</span></div></div>
<div class="e ok"><i>{ic("valider","xs")}</i><div class="t"><b>Présélectionnée</b><span>20 oct.</span></div></div>
<div class="e ok"><i>{ic("valider","xs")}</i><div class="t"><b>En examen</b><span>19 oct. · votre profil a été consulté</span></div></div>
<div class="e ok"><i>{ic("valider","xs")}</i><div class="t"><b>Envoyée</b><span>18 oct.</span></div></div></div></div>''', avec_nav=False)

# 7. Détail, bas : documents envoyés et messages
DET2 = phone(f'''{tete_f("Candidature", droite="plus-options")}
<div class="sec-t"><h2>Dossier envoyé</h2></div>
<div class="verre liste lignes">
<div class="li"><span class="cases c2">{ic("cv","s")}</span><div class="t"><b>CV « Data · Baobab »</b><span>Version figée du 18 oct.</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("document","s")}</span><div class="t"><b>Lettre de motivation</b></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("certificat","s")}</span><div class="t"><b>Attestation SQL</b></div>{ic("suivant")}</div></div>
<div class="sec-t"><h2>Messages</h2><a>Ouvrir</a></div>
<div class="verre liste lignes"><div class="li"><span class="lg-e sap" style="width:40px;height:40px;font-size:13px">BF</span><div class="t"><b>Nadia K. · Baobab Fintech</b><span>Merci Grâce, voici les créneaux proposés…</span></div><span class="v">10:12</span></div></div>
<div class="sec-t"><h2>Demandé par le recruteur</h2></div>
<div class="verre pj"><span class="cases" style="background:var(--g-oppo)">{ic("document","s")}</span><div class="t"><b>Copie du diplôme</b><span>À envoyer avant le 25 oct.</span></div><a class="bt p s">Ajouter</a></div>
<a class="sig">{ic("fermer","xs")}Retirer ma candidature</a>''', avec_nav=False)

# 8. S'entraîner : briefing
BRIEF = phone(f'''{tete_f("S’entraîner")}
<div class="verre cd min"><div class="haut"><span class="lg-e sap">BF</span><div class="t"><b>Entretien Baobab Fintech</b><span>Mardi 22 oct. · 10:00 · visio</span></div></div></div>
<div class="verre brief"><h4>Ce qu’il faut savoir</h4>
<div class="ck"><div class="l ok"><i>{ic("valider","xs")}</i><div class="t"><b>L’entreprise</b><span>Fintech, paiement mobile, 12 agences</span></div></div>
<div class="l ok"><i>{ic("valider","xs")}</i><div class="t"><b>Ce qu’ils vérifieront</b><span>Power BI, SQL, présentation des résultats</span></div></div>
<div class="l ko"><i>{ic("plus","xs")}</i><div class="t"><b>Votre point faible</b><span>SQL avancé : préparez un exemple</span></div></div></div></div>
<div class="verre brief"><h4>Type d’entraînement</h4><div class="opts"><span><b>Rapide</b>10 min</span><span class="on"><b>Standard</b>20 min</span><span><b>Complet</b>30 min</span></div>
<div class="puces"><span class="puce on">Écrit</span><span class="puce">Oral</span></div></div>
<div class="gar">{ic("cadenas","s")}Privé : le recruteur ne voit jamais vos entraînements.</div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt a pl">{ic("entretien","s")}Commencer</a></div>')

# 9. Simulation
SIM = phone(f'''{tete_f("Question 3 sur 8")}{pas(3,8)}
<div class="verre q"><small>Question technique</small><b>Comment avez-vous déjà présenté des chiffres à une équipe qui n’est pas spécialiste ?</b></div>
<div class="verre rep">J’ai préparé un tableau de bord pour les chefs d’agence, avec trois indicateurs seulement. Chaque lundi, je<span class="cur"></span></div>
<div class="bulle-o">{orbi(32)}<div class="verre corps"><span>Pensez à donner un résultat chiffré : qu’est-ce qui a changé grâce à ce tableau ?</span></div></div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Passer</a><a class="bt p pl">Répondre</a></div>')

# 10. Retour
FB = phone(f'''{tete_f("Votre retour", droite=None)}
<div class="verre sc-c">{orbi(48)}<div class="t"><b>Bonne préparation</b><span>Standard · 8 questions · retour sur 5 critères, sans note</span></div></div>
<div class="verre fb-c"><h4>Vos points forts</h4><div class="pt ok"><i>{ic("valider","xs")}</i>Réponses claires et structurées</div><div class="pt ok"><i>{ic("valider","xs")}</i>Bonne connaissance de Power BI</div></div>
<div class="verre fb-c"><h4>À travailler</h4><div class="pt ko"><i>{ic("plus","xs")}</i>Chiffrer vos résultats</div><div class="pt ko"><i>{ic("plus","xs")}</i>Exemple de requête SQL avancée</div></div>
<div class="verre mg"><span class="vign">{FORM["numerique"]}</span><div class="t"><small>Pour progresser</small><b>SQL : jointures et sous-requêtes</b><span>45 min</span></div>{ic("suivant","s")}</div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Recommencer</a><a class="bt p pl">Terminer</a></div>')

ECR = [
 ('c1','1 · Postuler en 3 étapes','CV, documents, vérification. Brouillon enregistré à chaque étape. Gratuit, toujours.',
  [ecrans((C1,'Le CV','Le CV adapté à l’offre est proposé en premier.'),(C2,'Les documents','Facultatif. Orbi peut rédiger une lettre, à relire.'),(C3,'Vérifier et envoyer','Ce que verra le recruteur, en clair.'),(C4,'Confirmation','Deux suites seulement.'))]),
 ('c2','2 · Suivi','Les candidatures groupées par situation : ce qui demande une action d’abord.',
  [ecrans((SUIVI,'En cours','Statuts réels : Envoyée, En examen, Présélectionnée, Entretien.'),)]),
 ('c3','3 · Détail d’une candidature','Un seul écran pour l’invitation, la préparation, l’historique, le dossier et les messages.',
  [ecrans((DET,'Haut de page','Choisir un créneau, préparer l’entretien, historique.'),(DET2,'Bas de page','Dossier envoyé, messages, document demandé, retrait.'))]),
 ('c4','4 · S’entraîner avec Orbi','Briefing, simulation, retour, au même endroit, lancé depuis la candidature.',
  [ecrans((BRIEF,'Briefing','Ce qu’il faut savoir, durée, écrit ou oral.'),(SIM,'Simulation','Une question à la fois, un conseil d’Orbi.'),(FB,'Retour','Points forts, à travailler, formation liée.'))]),
 ('c5','5 · Mode sombre','',
  [ecrans((sombre(C3),'Vérifier et envoyer',''),(sombre(SUIVI),'Suivi',''),(sombre(DET),'Détail d’une candidature',''))]),
]
som = ''.join(f'<li><a href="#{i}">{t.split(" · ")[1]}</a></li>' for i, t, _, _ in ECR)
corps = ''.join(bloc(i, t, d, *p) for i, t, d, p in ECR)
html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Refonte mobile · talent, lot 2</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>{open(H + '/fondations.css').read()}{CSS}{CSS2}</style></head><body>
<header class="couv"><span class="k">{orbi(22)}Jumanly · refonte mobile · étape 2</span><h1>Talent, lot 2 : postuler et suivre</h1>
<p>18 octobre 2026. Candidature en 3 étapes, Suivi, détail d’une candidature et entraînement à l’entretien. Contenus fictifs.</p>
<ul class="som">{som}</ul></header>{corps}<p class="fin">Jumanly · Learn. Grow. Connect.</p></body></html>'''
out = os.path.join(H, '..', 'refonte-mobile-talent-2.html')
open(out, 'w').write(html); print(out, len(html))
