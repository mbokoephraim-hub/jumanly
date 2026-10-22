# Modèles de rapports PDF recruteur (Modèle B) : identité Jumanly + logo de l'entreprise cliente.
# Données de démonstration (Baobab Fintech est fictive). Usage : python3 rapports.py && node pdf.js
import os
D = os.path.dirname(os.path.abspath(__file__))
R = 'res/'

BAOBAB = ('<svg viewBox="0 0 64 64" width="{s}" height="{s}" aria-label="Logo Baobab Fintech"><rect width="64" height="64" rx="16" fill="#14745F"/>'
          '<path d="M32 50V33M32 37c-6-1-10-5-11-10M32 35c6-1 10-5 11-10M32 33c0-5 1-9 3-12" stroke="#FFFFFF" stroke-width="3.6" stroke-linecap="round" fill="none"/>'
          '<path d="M14 27c0-8 8-13 18-13s18 5 18 13c-5 2-11 2-18 2s-13 0-18-2z" fill="#A6F26B"/><path d="M24 50h16" stroke="#FFFFFF" stroke-width="3.6" stroke-linecap="round"/></svg>')
bb = lambda s=44: BAOBAB.format(s=s)

CSS = '''
@font-face{font-family:Sora;font-weight:300;src:url(res/Sora-300.ttf)}
@font-face{font-family:Sora;font-weight:400;src:url(res/Sora-400.ttf)}
@font-face{font-family:Sora;font-weight:500;src:url(res/Sora-500.ttf)}
@font-face{font-family:Sora;font-weight:600;src:url(res/Sora-600.ttf)}
@font-face{font-family:Sora;font-weight:700;src:url(res/Sora-700.ttf)}
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Sora,sans-serif;color:#0B1A1F;font-size:9.5pt;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pg{width:210mm;height:297mm;position:relative;overflow:hidden;padding:16mm 16mm 26mm;page-break-after:always;background:#FFFFFF}
.pg:last-child{page-break-after:auto}
.tete{display:flex;align-items:center;gap:5mm;padding-bottom:4mm;border-bottom:1.2mm solid #A6F26B}
.tete .j{height:8.5mm}
.tete .sep{width:.3mm;height:9mm;background:#DCE5E1}
.tete .ent{display:flex;align-items:center;gap:3mm;font-weight:600;font-size:10pt;color:#0F3F37}
.tete .ref{margin-left:auto;text-align:right;font-size:7.5pt;color:#5B6B68;line-height:1.4}
.pied{position:absolute;left:0;right:0;bottom:0;height:16mm;background:#0F3F37;color:#F2EDE5;display:flex;align-items:center;gap:4mm;padding:0 16mm;font-size:7.2pt}
.pied img{height:5mm}
.pied .n{margin-left:auto;font-weight:600;color:#A6F26B}
h1{font-size:24pt;line-height:1.12;font-weight:700;color:#0F3F37;letter-spacing:-.3pt}
h2{font-size:13pt;font-weight:700;color:#0F3F37;margin:7mm 0 3mm}
.lab{display:inline-block;font-size:7pt;font-weight:700;letter-spacing:.8pt;text-transform:uppercase;color:#3DA14F}
.sous{color:#5B6B68;font-size:10pt;margin-top:2mm}
.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:3.5mm;margin-top:6mm}
.kpis.k4{grid-template-columns:repeat(4,1fr)}
.kpi{background:#F2EDE5;border-radius:4mm;padding:4.5mm 5mm}
.kpi b{display:block;font-size:20pt;font-weight:700;color:#0F3F37;line-height:1.1}
.kpi span{font-size:8pt;color:#5B6B68}
.kpi.f{background:#0F3F37}.kpi.f b{color:#A6F26B}.kpi.f span{color:#DCE5E1}
.carte{border:.3mm solid #DCE5E1;border-radius:4mm;padding:5mm}
table{width:100%;border-collapse:collapse;font-size:8.6pt}
th{text-align:left;font-size:7.2pt;font-weight:600;color:#5B6B68;text-transform:uppercase;letter-spacing:.4pt;padding:2mm 2.5mm;border-bottom:.4mm solid #0F3F37}
td{padding:2.4mm 2.5mm;border-bottom:.25mm solid #DCE5E1;vertical-align:top}
td.n,th.n{text-align:right}
.ok{color:#1E9A64;font-weight:700}
.puce{display:flex;gap:3mm;margin:1.6mm 0}.puce i{width:2mm;height:2mm;border-radius:50%;background:#A6F26B;margin-top:1.4mm;flex:none;border:.3mm solid #3DA14F}
.ent{display:grid;grid-template-columns:30mm 1fr 14mm 42mm;gap:3mm;align-items:center;margin:2mm 0;font-size:8.6pt}
.ent .b{height:6mm;border-radius:1.5mm;background:#F2EDE5;overflow:hidden}.ent .b i{display:block;height:100%;background:linear-gradient(90deg,#0F3F37,#14745F 60%,#2FD3A6);border-radius:1.5mm}
.ent b{text-align:right;font-size:10pt;color:#0F3F37}
.barres{display:flex;align-items:flex-end;gap:4mm;height:42mm;padding-top:4mm}
.barres span{flex:1;display:flex;flex-direction:column;align-items:center;gap:1.5mm;font-size:7.5pt;color:#5B6B68}
.barres i{display:block;width:100%;border-radius:2mm 2mm .8mm .8mm;background:#A6F26B;border:.3mm solid #7DE36B}
.barres b{color:#0F3F37;font-size:8.5pt}
.pq{display:grid;grid-template-columns:44mm 1fr 16mm;gap:3mm;align-items:center;margin:1.7mm 0;font-size:8.6pt}
.pq .b{height:3mm;border-radius:1.5mm;background:#F2EDE5;overflow:hidden}.pq .b i{display:block;height:100%;background:#2FD3A6;border-radius:1.5mm}
.pq b{text-align:right;color:#0F3F37}
.note{background:#F2EDE5;border-left:1.2mm solid #2FD3A6;border-radius:0 3mm 3mm 0;padding:4mm 5mm;font-size:8.4pt;color:#29403B;margin-top:5mm}
.orbi{display:inline-flex;width:5mm;height:5mm;border-radius:50%;background:#2FD3A6;vertical-align:-1.2mm;margin-right:1.5mm}
.couv{margin:-16mm -16mm 0;padding:14mm 16mm 12mm;background:linear-gradient(160deg,#0F3F37 0%,#0B1A1F 100%);color:#F2EDE5;position:relative;overflow:hidden}
.couv h1{color:#FFFFFF;font-size:28pt;margin-top:14mm}
.couv .sous{color:#DCE5E1}
.couv .lab{color:#E3F67C}
.couv .logos{display:flex;align-items:center;gap:5mm}
.couv .logos img{height:9mm}
.couv .sep{width:.3mm;height:10mm;background:rgba(255,255,255,.25)}
.couv .orbe{position:absolute;right:-30mm;top:-30mm;width:110mm;height:110mm;border-radius:50%;background:radial-gradient(circle,rgba(166,242,107,.35),rgba(166,242,107,0) 65%)}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:6mm}
.etoiles{color:#3DA14F;letter-spacing:.6mm;font-size:10pt}
.sig{display:flex;gap:10mm;margin-top:8mm}.sig div{flex:1;border-top:.3mm solid #0F3F37;padding-top:2mm;font-size:8pt;color:#5B6B68}
.badge{display:inline-block;font-size:7.5pt;font-weight:700;padding:.8mm 2.4mm;border-radius:2mm;background:#E6F8D3;color:#0F3F37}
'''

def tete(ref):
    return (f'<div class="tete"><img class="j" src="{R}jumanly-logo-principal.svg" alt="Jumanly"><span class="sep"></span>'
            f'<span class="ent">{bb(30)}Baobab Fintech</span><span class="ref">{ref}</span></div>')
def pied(n, tot):
    return (f'<div class="pied"><img src="{R}jumanly-logo-negatif.svg" alt="Jumanly"><span>Une plateforme développée par The Growth Lab · assistant@jumanly.io · jumanly.io</span>'
            f'<span class="n">{n} / {tot}</span></div>')
def doc(titre, pages):
    tot = len(pages)
    corps = ''.join(f'<section class="pg">{p}{pied(i + 1, tot)}</section>' for i, p in enumerate(pages))
    return f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>{titre}</title><style>{CSS}</style></head><body>{corps}</body></html>'

CRIT = [('Compétences requises', 35), ('Compétences souhaitées', 10), ('Expérience', 15), ('Formation', 10), ('Langues', 10), ('Lieu', 10), ('Contrat', 5), ('Proximité du profil', 5)]
def pourquoi(v):
    tot = round(sum(x * w for x, (_, w) in zip(v, CRIT)) + 1e-9)
    lignes = ''.join(f'<div class="pq"><span>{t}</span><span class="b"><i style="width:{x*100:.0f}%"></i></span><b>{round(x*w)}/{w}</b></div>' for x, (t, w) in zip(v, CRIT))
    return tot, lignes

# ---------------- 1. Rapport de recrutement de l'entreprise (administrateur) ----------------
def r_entreprise():
    kp = [('170', 'candidatures reçues', 'f'), ('14', 'entretiens menés', ''), ('3', 'embauches', ''), ('6 j', 'délai moyen de première réponse', ''), ('100 %', 'des candidats ont eu une réponse', 'f'), ('4 sur 20', 'offres en ligne (formule Company)', '')]
    p1 = ('<div class="couv"><span class="orbe"></span><div class="logos"><img src="res/jumanly-logo-negatif.svg" alt="Jumanly"><span class="sep"></span>' + bb(40) + '<b style="font-size:12pt">Baobab Fintech</b></div>'
          '<h1>Rapport de recrutement</h1><p class="sous" style="font-size:12pt">Octobre 2026 · du 1er au 22 octobre</p>'
          '<p style="margin-top:8mm;font-size:8.5pt;color:#DCE5E1">Préparé pour Joseph Ilunga, administrateur · généré par Jumanly le 22 octobre 2026</p></div>'
          '<div class="kpis">' + ''.join(f'<div class="kpi {c}"><b>{b}</b><span>{t}</span></div>' for b, t, c in kp) + '</div>'
          '<h2>L’essentiel du mois</h2>'
          '<div class="puce"><i></i><span><b>Chaque candidat a reçu une réponse</b> : 151 messages envoyés, dont 27 « non retenu, avec conseil ».</span></div>'
          '<div class="puce"><i></i><span><b>3 embauches</b> : 2 chargés de clientèle à Lubumbashi et 1 stagiaire marketing, recrutée via Jumanly.</span></div>'
          '<div class="puce"><i></i><span><b>L’offre Flutter</b> attire peu de candidatures (9) mais les meilleurs scores : 4 profils au-dessus de 70 %.</span></div>'
          '<div class="puce"><i></i><span><b>À surveiller</b> : l’offre Clientèle a un délai de réponse de 7 jours ; l’objectif de l’équipe est 5 jours.</span></div>'
          '<div class="note"><span class="orbi"></span><b>Orbi recommande, l’équipe décide.</b> Aucun candidat n’a été écarté automatiquement. Le score suit 8 critères fixes ; le nom, l’âge, le genre, la photo, la nationalité ou la religion ne comptent jamais.</div>')
    ent = [('Candidatures', 170, 'point de départ'), ('Présélection', 42, '25 % de l’étape précédente'), ('Entretien', 14, '33 % de l’étape précédente'), ('Proposition', 4, '29 % de l’étape précédente'), ('Embauche', 3, '75 % des propositions')]
    sem = [('22 sept.', 31), ('29 sept.', 38), ('6 oct.', 44), ('13 oct.', 52), ('20 oct.', 36)]
    off = [('Analyste de données junior', 'Nadia Kalala', 38, 8, 3, 0, '5 j'), ('Chargé·e de clientèle Mobile Money', 'Nadia Kalala, Patrice Nzuzi', 52, 14, 5, 2, '7 j'), ('Développeur·se mobile Flutter', 'Nadia Kalala', 9, 4, 2, 0, '3 j'), ('Stagiaire marketing digital (en pause)', 'Nadia Kalala', 71, 16, 4, 1, '8 j')]
    p2 = (tete('Rapport de recrutement<br>Octobre 2026') + '<h2>Entonnoir de recrutement</h2>'
          + ''.join(f'<div class="ent"><span>{t}</span><span class="b"><i style="width:{max(3, n/170*100):.0f}%"></i></span><b>{n}</b><span style="color:#5B6B68;font-size:7.8pt">{s}</span></div>' for t, n, s in ent)
          + '<div class="cols" style="margin-top:4mm"><div class="carte"><b style="color:#0F3F37">Candidatures par semaine</b><div class="barres">'
          + ''.join(f'<span><b>{n}</b><i style="height:{n/52*30:.1f}mm"></i>{t}</span>' for t, n in sem) + '</div></div>'
          '<div class="carte"><b style="color:#0F3F37">Délais</b><table style="margin-top:2mm"><tr><td>Première réponse</td><td class="n"><b>6 j</b></td></tr><tr><td>Candidature → entretien</td><td class="n"><b>9 j</b></td></tr><tr><td>Entretien → décision</td><td class="n"><b>4 j</b></td></tr><tr><td>Candidature → embauche</td><td class="n"><b>21 j</b></td></tr></table></div></div>'
          '<h2>Par offre</h2><table><tr><th>Offre</th><th>Responsable</th><th class="n">Reçues</th><th class="n">Présél.</th><th class="n">Entretiens</th><th class="n">Embauches</th><th class="n">Délai</th></tr>'
          + ''.join(f'<tr><td><b>{t}</b></td><td>{r}</td><td class="n">{a}</td><td class="n">{b}</td><td class="n">{c}</td><td class="n ok">{d}</td><td class="n">{e}</td></tr>' for t, r, a, b, c, d, e in off) + '</table>')
    eq = [('Nadia Kalala', 'Recruteuse', 96, 8, 5, '6 sur 8'), ('Aline Mukeba', 'Manager · data', 22, 4, 6, '3 sur 4'), ('Patrice Nzuzi', 'Manager · service client', 52, 2, 3, '2 sur 3'), ('Joseph Ilunga', 'Administrateur', 0, 0, 1, '1 sur 1')]
    ta = [('Faire un entretien', 'Grâce Mbuyi', 'Aline Mukeba', 'Jeu. 23 oct.', 'Acceptée'), ('Évaluer le diagnostic', 'Didier Lukusa', 'Aline Mukeba', 'Lun. 20 oct.', 'Terminée'), ('Suivre un candidat', 'Benjamin Tshibangu', 'Nadia Kalala', 'Ven. 31 oct.', 'En cours'), ('Suivre un candidat', 'Nathan Ilunga', 'Patrice Nzuzi', 'Ven. 24 oct.', 'En cours'), ('Faire un entretien', 'Moussa Diallo', 'Nadia Kalala', 'Jeu. 23 oct.', 'Acceptée'), ('Évaluer le diagnostic', 'Moussa Diallo', 'Nadia Kalala', 'Ven. 24 oct.', 'Attribuée')]
    p3 = (tete('Rapport de recrutement<br>Octobre 2026') + '<h2>Activité de l’équipe</h2><table><tr><th>Membre</th><th>Rôle</th><th class="n">Candidatures traitées</th><th class="n">Entretiens</th><th class="n">Évaluations</th><th class="n">Tâches terminées</th></tr>'
          + ''.join(f'<tr><td><b>{a}</b></td><td>{b}</td><td class="n">{c}</td><td class="n">{d}</td><td class="n">{e}</td><td class="n">{f}</td></tr>' for a, b, c, d, e, f in eq) + '</table>'
          '<h2>Tâches attribuées</h2><table><tr><th>Tâche</th><th>Candidat</th><th>Attribuée à</th><th>Échéance</th><th>État</th></tr>'
          + ''.join(f'<tr><td>{a}</td><td><b>{b}</b></td><td>{c}</td><td>{d}</td><td><span class="badge">{e}</span></td></tr>' for a, b, c, d, e in ta) + '</table>'
          '<h2>Équité et confidentialité</h2>'
          '<div class="puce"><i></i><span>162 consultations de profils, toutes enregistrées dans le journal de Baobab Fintech.</span></div>'
          '<div class="puce"><i></i><span>Les profils ne sont visibles que si la personne a candidaté ou les a rendus visibles.</span></div>'
          '<div class="puce"><i></i><span>Ce rapport ne contient aucune donnée sensible et ne montre aucun profil non retenu nommément.</span></div>'
          '<div class="sig"><div>Joseph Ilunga · administrateur</div><div>Date et visa</div></div>'
          '<p style="margin-top:6mm;font-size:7pt;color:#8A9895">Données de démonstration : Baobab Fintech et les personnes citées sont fictives.</p>')
    return doc('Rapport de recrutement · Baobab Fintech · octobre 2026', [p1, p2, p3])

def bloc_pers(nom, role, titre, sous, ref='JM-RA-2026-10-NK'):
    return (tete(f'{titre}<br>Réf. {ref}') +
            f'<div style="display:flex;align-items:flex-end;gap:6mm;margin-top:8mm"><div style="flex:1"><span class="lab">Jumanly · {sous}</span><h1 style="margin-top:2mm">{titre}</h1>'
            f'<p class="sous">{nom} · {role} · Baobab Fintech</p></div>'
            f'<div style="width:22mm;height:22mm;border-radius:50%;background:#0F3F37;color:#A6F26B;font-size:16pt;font-weight:700;display:flex;align-items:center;justify-content:center">{"".join(x[0] for x in nom.split())}</div></div>')

# ---------------- 2. Rapport d'activité mensuel du recruteur ----------------
def r_activite():
    kp = [('96', 'candidatures traitées', 'f'), ('8', 'entretiens menés', ''), ('5', 'évaluations', ''), ('2', 'offres publiées', '')]
    ats = [('Analyste de données junior', 3, 5, 2, 1, 27), ('Chargé·e de clientèle Mobile Money', 4, 9, 3, 1, 35), ('Développeur·se mobile Flutter', 3, 2, 2, 0, 2)]
    ents = [('Mar. 21 oct.', 'Nathan Ilunga', 'Clientèle', 'Patrice Nzuzi', '★★★★☆', 'Proposition'), ('Ven. 17 oct.', 'Benjamin Tshibangu', 'Analyste', 'Aline Mukeba', '★★★★★', 'Proposition'), ('Jeu. 16 oct.', 'Ruth Kalenga', 'Clientèle', '—', '★★★☆☆', 'Présélection'), ('Mar. 14 oct.', 'Didier Lukusa', 'Analyste', 'Aline Mukeba', '★★★★☆', 'Présélection')]
    p1 = (bloc_pers('Nadia Kalala', 'Chargée de recrutement', 'Rapport d’activité', 'octobre 2026')
          + '<p style="font-size:8.5pt;color:#5B6B68;margin-top:3mm">Période du 1er au 22 octobre 2026 · rôle attribué par Joseph Ilunga : offres, ATS, entretiens, évaluations, statistiques, page de l’entreprise</p>'
          '<div class="kpis k4">' + ''.join(f'<div class="kpi {c}"><b>{b}</b><span>{t}</span></div>' for b, t, c in kp) + '</div>'
          '<h2>Mes offres dans l’ATS</h2><table><tr><th>Offre</th><th class="n">Nouvelles</th><th class="n">Présélection</th><th class="n">Entretien</th><th class="n">Proposition</th><th class="n">Non retenus, réponse envoyée</th></tr>'
          + ''.join(f'<tr><td><b>{t}</b></td><td class="n">{a}</td><td class="n">{b}</td><td class="n">{c}</td><td class="n">{d}</td><td class="n ok">{e}</td></tr>' for t, a, b, c, d, e in ats) + '</table>'
          '<h2>Entretiens menés</h2><table><tr><th>Date</th><th>Candidat</th><th>Offre</th><th>Avec</th><th>Évaluation</th><th>Suite</th></tr>'
          + ''.join(f'<tr><td>{a}</td><td><b>{b}</b></td><td>{c}</td><td>{d}</td><td class="etoiles">{e}</td><td><span class="badge">{f}</span></td></tr>' for a, b, c, d, e, f in ents) + '</table>'
          '<div class="note"><b>Délai moyen de première réponse : 5 jours</b> (équipe : 6 jours). 64 candidats ont reçu une réponse personnalisée à partir des modèles.</div>')
    ta = [('Suivre un candidat', 'Benjamin Tshibangu', 'Ven. 31 oct.', 'En cours', 'Proposition envoyée, début possible le 9 novembre'), ('Faire un entretien', 'Moussa Diallo', 'Jeu. 23 oct.', 'Acceptée', 'Visio planifiée à 14 h'), ('Évaluer le diagnostic', 'Moussa Diallo', 'Ven. 24 oct.', 'Attribuée', 'À faire après l’entretien')]
    su = [('Benjamin Tshibangu', 'Analyste de données junior', 'Proposition', '92 %'), ('Grâce Mbuyi', 'Analyste de données junior', 'Entretien', '95 %'), ('Moussa Diallo', 'Développeur·se mobile Flutter', 'Présélection', '92 %'), ('Esther Kabila', 'Analyste de données junior', 'Nouvelle', '85 %')]
    p2 = (tete('Rapport d’activité · octobre 2026<br>Nadia Kalala') + '<h2>Tâches attribuées par Joseph Ilunga</h2><table><tr><th>Tâche</th><th>Candidat</th><th>Échéance</th><th>État</th><th>Où en est-on</th></tr>'
          + ''.join(f'<tr><td>{a}</td><td><b>{b}</b></td><td>{c}</td><td><span class="badge">{d}</span></td><td>{e}</td></tr>' for a, b, c, d, e in ta) + '</table>'
          '<h2>Candidats que je suis</h2><table><tr><th>Candidat</th><th>Offre</th><th>Étape</th><th class="n">Compatibilité</th></tr>'
          + ''.join(f'<tr><td><b>{a}</b></td><td>{b}</td><td>{c}</td><td class="n"><b>{d}</b></td></tr>' for a, b, c, d in su) + '</table>'
          '<h2>Publications et réseau</h2><div class="puce"><i></i><span>3 publications, dont 1 au nom de Baobab Fintech (« Bienvenue à Joëlle… », 86 réactions).</span></div>'
          '<div class="puce"><i></i><span>12 nouvelles relations, dont 4 talents data ; 1 offre proposée à un talent qui n’avait pas candidaté.</span></div>'
          '<div class="note"><span class="orbi"></span>Les compatibilités suivent 8 critères fixes. Orbi a classé les candidatures ; chaque décision de ce rapport a été prise par l’équipe.</div>'
          '<div class="sig"><div>Nadia Kalala · chargée de recrutement</div><div>Vu par Joseph Ilunga · administrateur</div></div>'
          '<p style="margin-top:6mm;font-size:7pt;color:#8A9895">Données de démonstration : Baobab Fintech et les personnes citées sont fictives.</p>')
    return doc('Rapport d’activité · Nadia Kalala · octobre 2026', [p1, p2])

# ---------------- 3. Compte rendu d'entretien ----------------
def r_entretien():
    tot, lignes = pourquoi([0.9, 0.7, 0.8, 1, 1, 1, 1, 0.8])
    grille = [('Connaissance des produits Mobile Money', '★★★★★'), ('Relation client et écoute', '★★★★☆'), ('Gestion d’une réclamation (mise en situation)', '★★★★☆'), ('Swahili et français à l’oral', '★★★★★'), ('Disponibilité le samedi', '★★★☆☆')]
    p = (bloc_pers('Nadia Kalala', 'Chargée de recrutement', 'Compte rendu d’entretien', 'entretien', 'JM-CE-2026-10-NI')
         + '<div class="cols" style="margin-top:6mm"><div class="carte"><span class="lab">Candidat</span><p style="font-size:13pt;font-weight:700;color:#0F3F37;margin-top:1mm">Nathan Ilunga</p><p style="color:#5B6B68">Chargé·e de clientèle Mobile Money · Lubumbashi · CDI</p></div>'
         '<div class="carte"><span class="lab">Entretien</span><p style="font-weight:700;color:#0F3F37;margin-top:1mm">Mardi 21 octobre 2026 · 14 h · 45 min</p><p style="color:#5B6B68">En agence, Lubumbashi · avec Patrice Nzuzi et Nadia Kalala</p></div></div>'
         f'<div class="cols" style="margin-top:6mm"><div><h2 style="margin-top:0">Pourquoi {tot} % ?</h2><p style="font-size:7.8pt;color:#5B6B68;margin-bottom:2mm">Très compatible · 8 critères fixes, aucune donnée sensible</p>{lignes}</div>'
         '<div><h2 style="margin-top:0">Évaluation de l’entretien</h2><table>' + ''.join(f'<tr><td>{a}</td><td class="n etoiles">{b}</td></tr>' for a, b in grille) + '</table>'
         '<p style="margin-top:3mm;font-size:8.5pt"><b>Moyenne : 4,2 sur 5</b> · notée par Patrice Nzuzi</p></div></div>'
         '<h2>Points vérifiés</h2><div class="puce"><i></i><span>3 ans en agence Mobile Money, confirmés par une mise en situation de réclamation.</span></div>'
         '<div class="puce"><i></i><span>Swahili et français courants à l’oral.</span></div>'
         '<div class="puce"><i></i><span>À préciser : 2 samedis par mois sont demandés ; Nathan en propose 1.</span></div>'
         '<h2>Décision</h2><div class="carte" style="display:flex;align-items:center;gap:5mm;background:#F2EDE5;border:0"><span class="badge" style="font-size:9pt;background:#A6F26B">Proposition</span><span>Décision prise par <b>Nadia Kalala</b> et <b>Patrice Nzuzi</b> le 22 octobre 2026. Orbi a résumé l’entretien, l’équipe a décidé.</span></div>'
         '<div class="sig"><div>Nadia Kalala</div><div>Patrice Nzuzi</div></div>'
         '<p style="margin-top:6mm;font-size:7pt;color:#8A9895">Document interne à Baobab Fintech. Données de démonstration : les personnes citées sont fictives.</p>')
    return doc('Compte rendu d’entretien · Nathan Ilunga', [p])

# ---------------- 4. Suivi ATS d'une offre ----------------
def r_ats():
    col = [('Nouvelles', 3), ('Présélection', 5), ('Entretien', 2), ('Proposition', 1), ('Non retenus · réponse envoyée', 27)]
    top = [('Grâce Mbuyi', 'Entretien', '95 %', 'Entretien jeu. 23 oct. 10 h avec Aline Mukeba'), ('Benjamin Tshibangu', 'Proposition', '92 %', 'Début proposé le 9 novembre'), ('Esther Kabila', 'Nouvelle', '85 %', 'SQL à vérifier'), ('Didier Lukusa', 'Présélection', '82 %', 'Évalué 4 étoiles par Aline'), ('Amani Kahindo', 'Nouvelle', '71 %', 'Anglais à vérifier')]
    msg = [('Accusé de réception', 38), ('Invitation à un entretien', 3), ('Non retenu, avec conseil', 27), ('Proposition d’embauche', 1)]
    p = (bloc_pers('Nadia Kalala', 'Chargée de recrutement', 'Suivi ATS d’une offre', 'ATS', 'JM-ATS-2026-10-AD')
         + '<div class="carte" style="margin-top:5mm;padding:4mm 5mm;display:flex;gap:6mm;align-items:center"><div style="flex:1"><span class="lab">Offre</span><p style="font-size:13pt;font-weight:700;color:#0F3F37;margin-top:1mm">Analyste de données junior</p><p style="color:#5B6B68">Kinshasa · CDI · publiée le 16 octobre 2026 · 412 vues</p></div>'
         '<div class="kpi f" style="width:40mm"><b>38</b><span>candidatures</span></div></div>'
         '<h2 style="margin-top:5mm">Où en sont les candidatures</h2><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:3mm">'
         + ''.join(f'<div class="kpi" style="padding:3mm 4mm;{"background:#0F3F37" if i == 4 else ""}"><b style="{"color:#A6F26B" if i == 4 else ""}">{n}</b><span style="{"color:#DCE5E1" if i == 4 else ""}">{t}</span></div>' for i, (t, n) in enumerate(col)) + '</div>'
         '<h2 style="margin-top:5mm">Candidats en cours, du plus compatible au moins compatible</h2><table><tr><th>Candidat</th><th>Étape</th><th class="n">Compatibilité</th><th>Prochaine étape</th></tr>'
         + ''.join(f'<tr><td><b>{a}</b></td><td>{b}</td><td class="n"><b>{c}</b></td><td>{d}</td></tr>' for a, b, c, d in top) + '</table>'
         '<div class="cols" style="margin-top:0"><div><h2 style="margin-top:5mm">Délais par étape</h2><table><tr><td>Candidature → première réponse</td><td class="n"><b>5 j</b></td></tr><tr><td>Présélection → entretien</td><td class="n"><b>4 j</b></td></tr><tr><td>Entretien → décision</td><td class="n"><b>3 j</b></td></tr></table></div>'
         '<div><h2 style="margin-top:5mm">Messages envoyés</h2><table>' + ''.join(f'<tr><td>{a}</td><td class="n"><b>{b}</b></td></tr>' for a, b in msg) + '</table></div></div>'
         '<div class="note" style="margin-top:3mm;padding:2.5mm 4mm"><span class="orbi"></span>Personne n’est écarté automatiquement : chaque non-retenu a reçu un message. Données de démonstration, personnes fictives.</div>')
    return doc('Suivi ATS · Analyste de données junior', [p])

for nom, f in [('Jumanly-Baobab-rapport-recrutement-octobre-2026', r_entreprise), ('Jumanly-Nadia-Kalala-rapport-activite-octobre-2026', r_activite), ('Jumanly-compte-rendu-entretien-Nathan-Ilunga', r_entretien), ('Jumanly-suivi-ATS-analyste-donnees', r_ats)]:
    open(os.path.join(D, nom + '.html'), 'w').write(f())
print('ok')
