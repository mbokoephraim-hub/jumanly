import json, os, re
D = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(D, 'canvas/project')
def charge(f):
    L = json.load(open(os.path.join(D, f)))
    if isinstance(L, dict): L = [x for v in L.values() for x in v]
    return [x if isinstance(x, str) else x[0] for x in L]
cand = charge('r_cand_pages.json')
fiches = [x for x in cand if x.startswith('Recruteur-candidat-') and x.count('-') == 2 and x not in ('Recruteur-candidat-cv.dc.html',)]
fiches = [x for x in cand if re.match(r'Recruteur-candidat-(benjamin|esther|patrick|didier|sarah|junior|ruth|amani|chantal|fiston|moussa|kevin|joelle)\.dc\.html', x)]
parOffre = [x for x in cand if re.match(r'Recruteur-cand-(analyste|clientele|flutter|marketing)\.dc\.html', x)]
ats = [x for x in cand if x not in fiches and x not in parOffre]
SECTIONS = [
  ('01 · Ouverture et inscription du recruteur : rôle, entreprise et demande de logo, pays, contacts, profil', ['Recruteur-accueil.dc.html'] + charge('r_accueil_pages.json')),
  ('02 · Fil : publier en son nom ou au nom de Baobab Fintech', charge('r_fil_pages.json')),
  ('03 · Offres : indicateurs, publier en 5 étapes, partager, clôturer', charge('r_offres_pages.json')),
  ('04 · Candidatures (ATS) : fort potentiel, étapes, entretiens, décisions, fiche, planifier, évaluer, proposer, diagnostic', ats),
  ('05 · Candidatures par offre et fiche de chaque candidat', parOffre + fiches),
  ('06 · Talents : recherche, vivier, propositions, profil vu par le recruteur', charge('r_talents_pages.json')),
  ('07 · Messages : candidats, talents, équipe', charge('r_msg_pages.json')),
  ('08 · Compte : profil avec logo, statistiques, équipe, formule en lecture, réglages, aide', [x for x in charge('r_compte_pages.json') if 'basculer' not in x]),
  ('09 · Pages entreprise, membres et réseau', charge('r_ent_pages.json') + charge('r_personne_pages.json')),
  ('10 · Notifications et Orbi', charge('r_notif_pages.json')),
  ('11 · Changer de profil : recruteur, talent discret, entreprise (administrateur)', charge('r_modes_pages.json')),
]
boards, order, notes = {}, [], {}
y, PAR_LIGNE = 0, 10
for i, (t, L) in enumerate(SECTIONS):
    vus = []
    for f in L:
        if f not in vus and f not in boards and os.path.exists(os.path.join(P, f)): vus.append(f)
    notes[f's{i+1:02d}'] = {'x': 0, 'y': y, 'text': t, 'kind': 'title1', 'maxW': max(1, min(len(vus), PAR_LIGNE)) * 470 - 80}
    for j, f in enumerate(vus):
        r, c = divmod(j, PAR_LIGNE)
        titre = re.search(r'<title>(.*?)</title>', open(os.path.join(P, f)).read()).group(1).replace('Jumanly Modèle B · Recruteur · ', '').replace('Jumanly Modèle B · ', '')
        if j == 0: titre += ' (prototype cliquable)'
        boards[f] = {'x': c * 470, 'y': y + 300 + r * 1004, 'w': 390, 'h': 844, 'title': titre, 'is_interactive': True, 'radius': 44}
        order.append(f)
    y += 300 + ((len(vus) - 1) // PAR_LIGNE + 1) * 1004 + 260
# 12 · Ordinateur et tablette : planches larges, 3 par rangée
WEB = json.load(open(os.path.join(D, 'r_web_pages.json'))) if os.path.exists(os.path.join(D, 'r_web_pages.json')) else []
if WEB:
    n = len(notes) + 1
    notes[f's{n:02d}'] = {'x': 0, 'y': y, 'text': '12 · Ordinateur et tablette : la même appli en grand (barre latérale, ATS en colonnes, Orbi à droite ; sur tablette, rail d’icônes et Orbi flottant)', 'kind': 'title1', 'maxW': 3 * 1520 - 80}
    yy, x, hmax = y + 300, 0, 0
    for j, (f, w, h) in enumerate(WEB):
        if j and (j % 3 == 0 or (f.startswith('RecruteurTablette') and not WEB[j - 1][0].startswith('RecruteurTablette'))):
            yy += hmax + 160; x = 0; hmax = 0
        titre = re.search(r'<title>(.*?)</title>', open(os.path.join(P, f)).read()).group(1).replace('Jumanly Modèle B · Recruteur · ', '')
        boards[f] = {'x': x, 'y': yy, 'w': w, 'h': h, 'title': titre, 'is_interactive': True, 'radius': 24 if 'Tablette' in f else 14}
        order.append(f); x += w + 80; hmax = max(hmax, h)
    y = yy + hmax + 260
manquants = [f for f in os.listdir(P) if f.endswith('.dc.html') and f not in boards]
print('planches', len(boards), 'hors canvas', manquants)
json.dump({'v': 3, 'createdOnFiles': {'v': 1, 'at': '2026-10-22T08:00:00Z'}, 'title': 'Jumanly Modèle B · Recruteur', 'launch': {'view': 'canvas'}, 'pages': [], 'boards': boards, 'order': order, 'notes': notes, 'designSystems': []},
          open(os.path.join(P, 'canvas.json'), 'w'), ensure_ascii=False, indent=1)
