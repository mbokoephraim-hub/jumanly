# Recruteur · Profil d'une personne membre d'une entreprise (sans page talent détaillée).
from rkit import *
PERS = [
  # clé, nom, ini, fond, texte, rôle, entreprise (clé), nom entreprise, ville, confirmé, depuis, relation au départ
  ('joelle', 'Joëlle Kasongo', 'JK', '#F9E3C8', '#8A4B12', 'Stagiaire marketing digital', 'baobab', 'Baobab Fintech', 'Kinshasa', True, 'octobre 2026', 'relation'),
  ('grace', 'Grâce Mbuyi', 'GM', '#E3E8FB', '#2D3F8A', 'Analyste de données', 'baobab', 'Baobab Fintech', 'Kinshasa', False, 'septembre 2026', ''),
  ('christelle', 'Christelle Mwamba', 'CM', '#1E4E79', '#FFFFFF', 'Recruteuse', 'fleuve', 'Fleuve Banque', 'Kinshasa', True, '2022', 'relation'),
  ('didier', 'Didier Mbala', 'DM', '#2A3B3E', '#F2EDE5', 'Directeur des risques', 'fleuve', 'Fleuve Banque', 'Kinshasa', True, '2019', ''),
  ('sarah', 'Sarah Lukusa', 'SL', '#2A3B3E', '#F2EDE5', 'Chargée de conformité', 'fleuve', 'Fleuve Banque', 'Kinshasa', False, '2025', ''),
  ('tresor', 'Trésor Banza', 'TB', '#4B2D7A', '#FFFFFF', 'Responsable RH', 'kivu', 'Kivu Data Lab', 'Goma', True, '2021', ''),
  ('esther', 'Esther Kahindo', 'EK', '#2A3B3E', '#F2EDE5', 'Data analyst', 'kivu', 'Kivu Data Lab', 'Goma', True, '2023', ''),
  ('moise', 'Moïse Bahati', 'MB', '#2A3B3E', '#F2EDE5', 'Statisticien', 'kivu', 'Kivu Data Lab', 'Goma', False, '2026', ''),
  ('ornella', 'Ornella Kazadi', 'OK', '#B07A12', '#FFFFFF', 'Chargée RH', 'mwinda', 'Mwinda Énergie', 'Kinshasa', True, '2024', ''),
  ('benoit', 'Benoît Mukendi', 'BM', '#2A3B3E', '#F2EDE5', 'Technicien solaire', 'mwinda', 'Mwinda Énergie', 'Kinshasa', True, '2022', ''),
  ('rose', 'Rose Kanku', 'RK', '#2A3B3E', '#F2EDE5', 'Infirmière', 'lisanga', 'Lisanga Santé', 'Kinshasa', True, '2020', ''),
  ('paul', 'Paul Tshibangu', 'PT', '#2A3B3E', '#F2EDE5', 'Médecin', 'lisanga', 'Lisanga Santé', 'Kinshasa', False, '2025', ''),
]
import json as _j
DATA = _j.dumps({k: dict(nom=n, ini=i, bg=b, fg=f, r=r, ent=e, entNom=en, ville=v, conf=c, depuis=d, rel=rl) for k, n, i, b, f, r, e, en, v, c, d, rl in PERS}, ensure_ascii=False)
JS = '''class Component extends DCLogic {
  renderVals() {
/*PRELUDE*/
    const P = ''' + DATA + ''';
    const k = P[prop('qui', 'didier')] ? prop('qui', 'didier') : 'didier';
    const x = P[k];
    const EI = { baobab: ['BF', '#14745F'], fleuve: ['FB', '#1E4E79'], kivu: ['KD', '#4B2D7A'], mwinda: ['ME', '#B07A12'], lisanga: ['LS', '#0F6B5A'] };
    const et = has('rel') ? st.rel : x.rel;
    const entHref = x.ent === 'baobab' ? 'Recruteur-entreprise-membres.dc.html' : 'Recruteur-entreprise-' + x.ent + '-membres.dc.html';
    return {
      x, entHref, entIni: EI[x.ent][0], entBg: EI[x.ent][1], confT: x.conf ? 'Confirmé par ' + x.entNom : 'Indiqué par la personne · ' + x.entNom + ' n’a pas encore confirmé', confCol: x.conf ? '#A6F26B' : '#8FA39E',
      bt: et === 'relation' ? 'Relation' : et === 'attente' ? 'En attente' : 'Se connecter', bbg: et ? 'transparent' : '#A6F26B', bcol: et ? '#B9CBC6' : '#0B1A1F', bbd: et ? 'rgba(255,255,255,.22)' : '#A6F26B',
      connecter: () => { if (et === 'relation') return; S({ rel: et === 'attente' ? '' : 'attente' }); if (!et) flash('Invitation envoyée à ' + x.nom.split(' ')[0]); },
      estRel: et === 'relation', pasRel: et !== 'relation', msgHref: k === 'christelle' ? 'Recruteur-conversation-christelle.dc.html' : 'Recruteur-messages-nouveau.dc.html',
      aToast: !!st.toast, toast: st.toast || ''
    };
  }
}'''
C = '''
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<header class="barreh"><a href="{{entHref}}" class="retour" style="color: #F2EDE5;">@RETOUR@{{x.entNom}}</a><span style="flex: 1;"></span></header>
<div class="scroll" style="flex: 1; overflow-y: auto; padding-bottom: 60px;">
<div style="padding: 18px 20px 0; display: flex; gap: 16px; align-items: center;"><span class="av" style="width: 76px; height: 76px; font-size: 22px; background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span>
<span style="flex: 1; min-width: 0;"><h1 style="font-size: 22px;">{{x.nom}}</h1><span style="display: block; font-size: 14.5px; color: #C9D6D2; margin-top: 2px;">{{x.r}}</span><span class="meta">{{x.ville}}</span></span></div>
<div style="display: flex; gap: 8px; padding: 18px 20px 0;"><button onClick="{{connecter}}" style="flex: 1; height: 44px; border-radius: 22px; border: 1px solid {{bbd}}; background: {{bbg}}; color: {{bcol}}; font-size: 14px; font-weight: 700; text-align: center;">{{bt}}</button>
<sc-if value="{{estRel}}" hint-placeholder-val="{{ false }}"><a href="{{msgHref}}" class="bs" style="height: 44px; flex: 1;">Écrire</a></sc-if></div>
<sc-if value="{{pasRel}}" hint-placeholder-val="{{ true }}"><p class="meta" style="padding: 10px 20px 0; font-size: 12.5px;">Un message est possible une fois l’invitation acceptée.</p></sc-if>
<div class="bloc" style="margin-top: 18px;"><h3>Expérience</h3>
<a href="{{entHref}}" style="display: flex; gap: 12px; align-items: center; color: #F2EDE5; padding: 4px 0;"><span class="mini" style="width: 42px; height: 42px; background: {{entBg}}; color: #FFFFFF; font-size: 12px;">{{entIni}}</span><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">{{x.r}}</b><span class="meta">{{x.entNom}} · depuis {{x.depuis}}</span><span style="display: block; font-size: 12px; font-weight: 700; color: {{confCol}}; margin-top: 2px;">{{confT}}</span></span></a></div>
<p class="meta" style="padding: 16px 20px; font-size: 12.5px; line-height: 1.5;">Vous voyez ce que la personne rend public. Son profil complet n’est visible que si elle candidate à une de vos offres.</p>
</div></div>
@TOAST@
'''
C = C.replace('@RETOUR@', ico(I['retour'], 20, '2')).replace('@TOAST@', TOAST)
ecrire_page('Recruteur-personne', 'Jumanly Modèle B · Recruteur · Profil d’un membre', C, JS, {'qui': {'editor': 'enum', 'options': [p[0] for p in PERS], 'default': 'didier'}})
L = [(f'Recruteur-personne-{p[0]}.dc.html', f'Membre · {p[1]} ({p[7]})', {'qui': p[0]}) for p in PERS]
pages('Recruteur-personne', L, 'r_personne_pages.json')
for e in ['kivu', 'mwinda', 'lisanga']:
    importer('Recruteur-entreprise', f'Recruteur-entreprise-{e}-membres.dc.html', f'{e} · Membres', {'ent': e, 'onglet': 'membres'})
pj = _j.load(open(os.path.join(D, 'r_personne_pages.json')))
pj += [[f'Recruteur-entreprise-{e}-membres.dc.html', 'x'] for e in ['kivu', 'mwinda', 'lisanga']]
_j.dump(pj, open(os.path.join(D, 'r_personne_pages.json'), 'w'), ensure_ascii=False)
print('ok')
