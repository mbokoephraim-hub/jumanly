import json, os, re
D = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(D, 'w/canvas/project')
A = json.load(open(os.path.join(D, 'w_acces_pages.json'))); T = {f: t for f, t in A}
APP = json.load(open(os.path.join(D, 'w_app_pages.json')))
acc = [f for f, _ in A]
SECTIONS = [
  ('01 · Site public : page Recruter et tarifs', [f for f in acc if f.startswith('Web-Site')]),
  ('02 · Ouverture, connexion, mot de passe oublié, choix du profil', ['Web-Acces.dc.html', 'Web-acces-ouverture.dc.html', 'Web-acces-connexion.dc.html', 'Web-acces-oubli.dc.html', 'Web-acces-profil.dc.html']),
  ('03 · Inscription du recruteur (Nadia) : compte, rôle, demande de rattachement à Baobab Fintech', [f for f in acc if f.startswith('Web-acces-r-')]),
  ('04 · Inscription de l’administrateur (Joseph) : formule, entreprise, logo, vérification, paiement, équipe', [f for f in acc if f.startswith('Web-acces-a-')]),
  ('05 · Recruteuse Nadia · appli sur ordinateur : accueil, offres, ATS, fiche candidat, agenda, talents, messages, pilotage, compte', ['Web-App.dc.html'] + APP['nadia']),
  ('06 · Administrateur Joseph · espace entreprise : équipe et rôles, tâches, page entreprise, formule et facturation, journal, réglages', APP['joseph']),
]
boards, order, notes = {}, [], {}
y, N, W, H = 0, 3, 1440, 900
for i, (t, L) in enumerate(SECTIONS):
    L = [f for f in L if os.path.exists(os.path.join(P, f)) and f not in boards]
    notes[f's{i+1:02d}'] = {'x': 0, 'y': y, 'text': t, 'kind': 'title1', 'maxW': N * (W + 80) - 80}
    for j, f in enumerate(L):
        r, c = divmod(j, N)
        titre = {'Web-App.dc.html': 'Appli recruteur sur ordinateur (prototype cliquable complet)', 'Web-Acces.dc.html': 'Ouverture, connexion et inscriptions (prototype cliquable complet)'}.get(f) or T.get(f) or re.search(r'<title>(.*?)</title>', open(os.path.join(P, f)).read()).group(1)
        boards[f] = {'x': c * (W + 80), 'y': y + 300 + r * (H + 160), 'w': W, 'h': H, 'title': titre, 'is_interactive': True, 'radius': 14}
        order.append(f)
    y += 300 + ((len(L) - 1) // N + 1) * (H + 160) + 260
hors = [f for f in os.listdir(P) if f.endswith('.dc.html') and f not in boards]
print('planches', len(boards), 'hors canvas', hors)
json.dump({'v': 3, 'createdOnFiles': {'v': 1, 'at': '2026-10-22T08:00:00Z'}, 'title': 'Jumanly · Recruteur et administrateur sur le web', 'launch': {'view': 'canvas'}, 'pages': [], 'boards': boards, 'order': order, 'notes': notes, 'designSystems': []},
          open(os.path.join(P, 'canvas.json'), 'w'), ensure_ascii=False, indent=1)
