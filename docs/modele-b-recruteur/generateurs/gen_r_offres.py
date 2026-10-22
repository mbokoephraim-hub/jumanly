# Recruteur · Offres : reprend gen_rec_offres.py et relie chaque touche à une vraie page du parcours recruteur.
import os, re
D = os.path.dirname(os.path.abspath(__file__))
import rkit as K
src = open(os.path.join(D, 'gen_rec_offres.py')).read()
js = open(os.path.join(D, 'rec_offres_logic.js')).read()

def R(s, a, b, n=1):
    assert s.count(a) >= 1, a[:80]
    return s.replace(a, b)

# --- logique ---
js = R(js, "href: `Personne-${k}.dc.html`", "href: k === 'joel' ? 'Recruteur-talent-joel.dc.html' : `Recruteur-candidat-${k}.dc.html`")
js = R(js, "({ t, ab, c, s, voir: () => flash(`Page de ${t} : visible par tous sur Jumanly`) })", "({ t, ab, c, s, href: 'Recruteur-entreprise-' + { 'Fleuve Banque': 'fleuve', 'Mwinda Énergie': 'mwinda', 'Lisanga Santé': 'lisanga', 'Kivu Data Lab': 'kivu' }[t] + '.dc.html' })")
i0 = js.index('    const CANDS = ['); i1 = js.index('\n', js.index('const candidats = CANDS.map'))
js = js[:i0] + """    const CANDS_O = {
      analyste: [['benjamin', 'Benjamin Tshibangu', 'BT', 95, 'Proposition', 'Analyste junior · Kinshasa'], ['grace', 'Grâce Mbuyi', 'GM', 89, 'Entretien', 'SQL, Excel · Kinshasa'], ['esther', 'Esther Kabila', 'EK', 85, 'Reçue', 'Power BI, SQL · Kinshasa'], ['patrick', 'Patrick Ilunga', 'PI', 81, 'Présélection', 'Analyste crédit · Kinshasa'], ['didier', 'Didier Lukusa', 'DL', 78, 'Entretien', 'Python · Kinshasa'], ['sarah', 'Sarah Mbala', 'SM', 67, 'Reçue', 'Excel · Matadi']],
      clientele: [['amani', 'Amani Kasongo', 'AK', 95, 'Entretien', 'Airtel Money · Lubumbashi'], ['chantal', 'Chantal Kapinga', 'CK', 85, 'Reçue', 'Rawbank · Lubumbashi'], ['fiston', 'Fiston Mwamba', 'FM', 80, 'Présélection', 'Vodacom · Lubumbashi']],
      flutter: [['moussa', 'Moussa Diallo', 'MD', 92, 'Reçue', '3 applis publiées · Lubumbashi'], ['kevin', 'Kevin Lumbala', 'KL', 70, 'Reçue', 'JavaScript · Kinshasa']],
      marketing: [['joelle', 'Joëlle Mbayo', 'JM', 90, 'Recrutée', 'Réseaux sociaux · Kinshasa']]
    };
    const CANDS = CANDS_O[offreK] || CANDS_O.analyste;
    const candidats = CANDS.map(([k, nom, ini, sc, et, info]) => ({ nom, ini, sc: sc + ' %', et, info, href: k === 'grace' ? 'Recruteur-candidat.dc.html' : `Recruteur-candidat-${k}.dc.html` }));
    const candHref = CANDS_O[offreK] ? `Recruteur-cand-${offreK}.dc.html` : 'Recruteur-cand-toutes.dc.html';""" + js[i1:]
js = R(js, "ouvrirCandidatures: () => flash('Candidatures : onglet dessiné à l’étape suivante'),", "candHref,")
js = R(js, "flash(`${t} : onglet dessiné à l’étape suivante`)", "S({ feuille: null })")
open(os.path.join(D, 'r_offres_logic.js'), 'w').write(js)

# --- gabarit ---
src = R(src, "open(os.path.join(D, 'rec_offres_logic.js'))", "open(os.path.join(D, 'r_offres_logic.js'))")
src = R(src, "CARTE_O = (", "NAVR = K.nav('offres')\nCARTE_O = (")
src = re.sub(r'<a href="Personne-nadia\.dc\.html" aria-label="Mon compte">.*?</a>(?=\n)', lambda m: K.MOI(), src, count=1)
src = R(src, '<button onClick="{{e.voir}}" class="ligne"><span class="mini" style="background: {{e.c}};">{{e.ab}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px; font-weight: 600;">{{e.t}}</b><span class="meta">{{e.s}}</span></span></button>',
          '<a href="{{e.href}}" class="ligne"><span class="mini" style="background: {{e.c}};">{{e.ab}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px; font-weight: 600;">{{e.t}}</b><span class="meta">{{e.s}}</span></span></a>')
src = R(src, '<button onClick="{{x.voir}}" class="ligne"><span class="mini" style="border-radius: 50%; background: #1B3338; color: #F2EDE5;">{{x.ini}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px; font-weight: 600;">{{x.nom}}</b><span class="meta">{{x.info}} · {{x.et}}</span></span><span style="font-size: 15px; font-weight: 700; color: #A6F26B;">{{x.sc}}</span></button>',
          '<a href="{{x.href}}" class="ligne"><span class="mini" style="border-radius: 50%; background: #1B3338; color: #F2EDE5;">{{x.ini}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px; font-weight: 600;">{{x.nom}}</b><span class="meta">{{x.info}} · {{x.et}}</span></span><span style="font-size: 15px; font-weight: 700; color: #A6F26B;">{{x.sc}}</span></a>')
src = R(src, '<button onClick="{{ouvrirCandidatures}}" class="bp">Trier dans Candidatures</button>', '<a href="{{candHref}}" class="bp">Trier dans Candidatures</a>')
src = R(src, '<button onClick="{{partagerFil}}" class="bs" style="width: 100%;">Partager dans le Fil</button>', '<a href="Recruteur-fil-publier-baobab.dc.html" class="bs" style="width: 100%;">Partager dans le Fil</a>')
src = src.replace("rec_offres_pages.json", "r_offres_pages.json")
exec(compile(src, 'gen_rec_offres(r)', 'exec'), {'__file__': os.path.join(D, 'gen_rec_offres.py'), '__name__': '__main__', 'K': K})
print('ok offres')
