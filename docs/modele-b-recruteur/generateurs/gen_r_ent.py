# Recruteur · Page entreprise (la sienne ou une autre) + offre d’une autre entreprise (lecture).
from rkit import *
JS = open(os.path.join(D, 'r_ent_logic.js')).read()
CHEV = ico(I['chev'], 18, '2', '#8FA39E')
CORPS = '''
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<div class="scroll" style="flex: 1; overflow-y: auto; padding-bottom: 120px;">
<div style="height: 160px; background: linear-gradient(150deg, {{e.bg}} 0%, #0B1A1F 100%); position: relative;">
<a href="Recruteur-fil.dc.html" class="rond" aria-label="Retour au Fil" style="position: absolute; left: 12px; top: 50px; background: rgba(11,26,31,.55); color: #F2EDE5;">@RETOUR@</a></div>
<div style="padding: 0 20px; margin-top: -40px; position: relative;">
<span style="width: 80px; height: 80px; border-radius: 22px; background: {{e.bg}}; color: {{e.fg}}; border: 4px solid #0B1A1F; font-size: 24px; font-weight: 800; display: flex; align-items: center; justify-content: center;">{{e.ini}}</span>
<div style="display: flex; align-items: center; gap: 8px; margin-top: 12px;"><h1 style="font-size: 24px;">{{e.nom}}</h1><span style="width: 20px; height: 20px; border-radius: 50%; background: #A6F26B; color: #0B1A1F; display: flex; align-items: center; justify-content: center;">@CHECK@</span></div>
<p style="font-size: 14.5px; color: #C9D6D2; margin-top: 2px;">{{e.sect}}</p>
<p class="meta" style="margin-top: 4px;">{{e.ville}}<sc-if value="{{e.aTaille}}" hint-placeholder-val="{{ true }}"> · {{e.taille}}</sc-if><sc-if value="{{e.aAbonnes}}" hint-placeholder-val="{{ true }}"> · {{e.abonnes}} abonnés</sc-if></p>
<sc-if value="{{aReseau}}" hint-placeholder-val="{{ true }}"><button onClick="{{voirMembres}}" style="display: flex; align-items: center; gap: 10px; margin-top: 12px; min-height: 40px; text-align: left;"><span style="display: flex; flex: none;"><sc-for list="{{avsR}}" as="a" hint-placeholder-count="2"><span class="av" style="width: 30px; height: 30px; font-size: 10.5px; margin-left: {{a.ml}}; border: 2px solid #0B1A1F; background: {{a.bg}}; color: {{a.fg}};">{{a.ini}}</span></sc-for></span><span style="font-size: 13.5px; color: #C9D6D2; line-height: 1.35;">{{reseauT}}</span></button></sc-if>
<sc-if value="{{nous}}" hint-placeholder-val="{{ true }}"><p style="margin-top: 12px; padding: 10px 14px; border-radius: 14px; background: rgba(166,242,107,.1); color: #A6F26B; font-size: 13px; font-weight: 600;">Votre entreprise · page administrée par Joseph Ilunga, modifiable sur ordinateur</p></sc-if>
</div>
<div style="margin-top: 16px;">@SEG@</div>
<sc-if value="{{oApropos}}" hint-placeholder-val="{{ true }}"><div>
<div class="bloc"><p style="font-size: 15px; line-height: 1.55;">{{e.desc}}</p></div>
<sc-if value="{{aEquipe}}" hint-placeholder-val="{{ true }}"><div class="bloc"><h3>Équipe de recrutement</h3><sc-for list="{{e.equipe}}" as="m" hint-placeholder-count="4"><a href="Recruteur-equipe.dc.html" style="display: flex; align-items: center; gap: 12px; padding: 7px 0; color: #F2EDE5;"><span class="av" style="width: 38px; height: 38px; font-size: 12px;">{{m.ini}}</span><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">{{m.nom}}</b><span class="meta" style="font-size: 12.5px;">{{m.r}}</span></span></a></sc-for></div></sc-if>
</div></sc-if>
<sc-if value="{{oMembres}}" hint-placeholder-val="{{ false }}"><div>
<sc-if value="{{aInviter}}" hint-placeholder-val="{{ true }}"><div style="padding: 16px 20px 2px;"><button onClick="{{inviterTous}}" class="bs" style="width: 100%;">{{inviterT}}</button></div></sc-if>
<sc-if value="{{toutInvite}}" hint-placeholder-val="{{ false }}"><p class="meta" style="padding: 16px 20px 2px;">Vous êtes en relation ou en attente avec chaque membre.</p></sc-if>
<sc-if value="{{aDuReseau}}" hint-placeholder-val="{{ true }}"><div><p style="padding: 18px 20px 10px; font-size: 13px; font-weight: 700; color: #8FA39E;">De votre réseau</p><div class="g2" style="padding: 0 20px;"><sc-for list="{{duReseau}}" as="m" hint-placeholder-count="2"><div style="padding: 14px 12px; border-radius: 20px; background: #13282C; text-align: center; display: flex; flex-direction: column;"><sc-if value="{{m.aLien}}" hint-placeholder-val="{{ true }}"><a href="{{m.href}}" style="display: block; color: #F2EDE5;"><span class="av" style="width: 56px; height: 56px; font-size: 16px; background: {{m.bg}}; color: {{m.fg}}; margin: 0 auto;">{{m.ini}}</span><b style="display: block; font-size: 14px; margin-top: 8px;">{{m.nom}}</b><span class="meta" style="display: block; font-size: 12px; line-height: 1.35; margin: 2px 0 10px;">{{m.r}}</span></a></sc-if><sc-if value="{{m.sansLien}}" hint-placeholder-val="{{ false }}"><span style="display: block;"><span class="av" style="width: 56px; height: 56px; font-size: 16px; background: {{m.bg}}; color: {{m.fg}}; margin: 0 auto;">{{m.ini}}</span><b style="display: block; font-size: 14px; margin-top: 8px;">{{m.nom}}</b><span class="meta" style="display: block; font-size: 12px; line-height: 1.35; margin: 2px 0 10px;">{{m.r}}</span></span></sc-if><button onClick="{{m.connecter}}" style="width: 100%; height: 34px; margin-top: auto; border-radius: 17px; border: 1px solid {{m.bbd}}; background: {{m.bbg}}; color: {{m.bcol}}; font-size: 12.5px; font-weight: 700; text-align: center;">{{m.bt}}</button></div></sc-for></div></div></sc-if>
<sc-if value="{{aAutres}}" hint-placeholder-val="{{ true }}"><div><p style="padding: 20px 20px 4px; font-size: 13px; font-weight: 700; color: #8FA39E;">{{autresT}}</p><sc-for list="{{autres}}" as="m" hint-placeholder-count="3"><div class="ligne"><sc-if value="{{m.aLien}}" hint-placeholder-val="{{ false }}"><a href="{{m.href}}" style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; color: #F2EDE5;"><span class="av" style="width: 42px; height: 42px; font-size: 13px; background: {{m.bg}}; color: {{m.fg}};">{{m.ini}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 14.5px;">{{m.nom}}</b><span class="meta" style="font-size: 12.5px;">{{m.r}}</span><span style="display: block; font-size: 11.5px; font-weight: 700; color: {{m.confCol}}; margin-top: 2px;">{{m.confT}}</span></span></a></sc-if><sc-if value="{{m.sansLien}}" hint-placeholder-val="{{ true }}"><span style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;"><span class="av" style="width: 42px; height: 42px; font-size: 13px; background: {{m.bg}}; color: {{m.fg}};">{{m.ini}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 14.5px;">{{m.nom}}</b><span class="meta" style="font-size: 12.5px;">{{m.r}}</span><span style="display: block; font-size: 11.5px; font-weight: 700; color: {{m.confCol}}; margin-top: 2px;">{{m.confT}}</span></span></span></sc-if><button onClick="{{m.connecter}}" style="flex: none; height: 34px; padding: 0 14px; border-radius: 17px; border: 1px solid {{m.bbd}}; background: {{m.bbg}}; color: {{m.bcol}}; font-size: 12.5px; font-weight: 700;">{{m.bt}}</button></div></sc-for></div></sc-if>
<sc-if value="{{sansMembres}}" hint-placeholder-val="{{ false }}"><p class="meta" style="padding: 30px 20px; text-align: center;">Personne n’a encore indiqué travailler ici.</p></sc-if>
<p class="meta" style="padding: 18px 20px 0; font-size: 12.5px; line-height: 1.5;">Une personne apparaît ici dès qu’elle indique travailler chez {{e.nom}} dans son expérience. L’entreprise est prévenue et peut confirmer ; sinon, la mention « Indiqué par la personne » reste.</p>
</div></sc-if>
<sc-if value="{{oOffres}}" hint-placeholder-val="{{ false }}"><div>
<sc-for list="{{e.offres}}" as="o" hint-placeholder-count="3"><a href="{{o.href}}" class="ligne"><span class="mini" style="width: 42px; height: 42px; background: #13282C; color: #A6F26B;">@OFFRES@</span><span style="flex: 1;"><b style="display: block; font-size: 15px;">{{o.t}}</b><span class="meta">{{o.s}}</span></span>@CHEV@</a></sc-for>
<sc-if value="{{sansOffres}}" hint-placeholder-val="{{ false }}"><p class="meta" style="padding: 30px 20px; text-align: center;">Pas d’offre en ce moment.</p></sc-if>
</div></sc-if>
<sc-if value="{{oPubs}}" hint-placeholder-val="{{ false }}"><div>
<sc-for list="{{e.pubs}}" as="x" hint-placeholder-count="2"><a href="{{x.href}}" class="ligne" style="flex-direction: column; align-items: flex-start; gap: 4px;"><span style="font-size: 14.5px; line-height: 1.45;">{{x.t}}</span><span class="meta">{{x.d}}</span></a></sc-for>
<sc-if value="{{sansPubs}}" hint-placeholder-val="{{ false }}"><p class="meta" style="padding: 30px 20px; text-align: center;">Aucune publication pour l’instant.</p></sc-if>
</div></sc-if>
</div>
<div class="bas">
<sc-if value="{{nous}}" hint-placeholder-val="{{ true }}"><a href="Recruteur-fil-publier-baobab.dc.html" class="bp">Publier au nom de Baobab Fintech</a></sc-if>
<sc-if value="{{autre}}" hint-placeholder-val="{{ false }}"><button onClick="{{suivre}}" class="bp" style="background: {{sBg}}; color: {{sCol}}; border: 1px solid {{sBd}};">{{suivreT}}</button></sc-if>
</div>
</div>
@F_TOUS@
@TOAST@
'''
for a, b in {'@F_TOUS@': feuille('fTous', '<b style="display: block; font-size: 17px;">{{inviterT}}</b><p class="meta" style="margin-top: 6px; line-height: 1.5;">Une invitation part vers chaque membre de {{e.nom}} que vous ne connaissez pas encore ({{nInv}}). Chacun l’accepte ou non. Aucun message n’est possible avant l’acceptation.</p><p style="margin-top: 10px; font-size: 13px; font-weight: 700; color: #F4D59A;">{{resteT}}</p><button onClick="{{confirmerTous}}" class="bp" style="margin-top: 16px;">Envoyer les invitations</button><button onClick="{{fermer}}" class="annuler">Annuler</button>'), '@RETOUR@': ico(I['retour'], 20, '2'), '@CHECK@': ico(I['check'], 12, '3'), '@SEG@': SEG('ongletsE', 4), '@OFFRES@': ico(I['offres'], 20, '1.8'), '@CHEV@': CHEV, '@TOAST@': TOAST}.items():
    CORPS = CORPS.replace(a, b)
assert '@' not in CORPS.replace('@jumanly', '')
PROPS = {'feuille': {'editor': 'enum', 'options': ['aucune', 'tous'], 'default': 'aucune'}, 'ent': {'editor': 'enum', 'options': ['baobab', 'fleuve', 'kivu', 'mwinda', 'lisanga', 'jumanly'], 'default': 'baobab'},
         'onglet': {'editor': 'enum', 'options': ['apropos', 'membres', 'offres', 'publications'], 'default': 'apropos'}}
ecrire_page('Recruteur-entreprise', 'Jumanly Modèle B · Recruteur · Page entreprise', CORPS, JS, PROPS)

# Offre d’une autre entreprise, en lecture (veille du marché) : une page simple et commune
OFF = '''
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<header class="barreh"><a href="{{retourHref}}" class="retour" style="color: #F2EDE5;">@RETOUR@{{nom}}</a><span style="flex: 1;"></span></header>
<div class="scroll" style="flex: 1; overflow-y: auto; padding: 20px 20px 120px;">
<span class="mini" style="background: {{bg}};">{{ini}}</span>
<h1 style="font-size: 23px; margin-top: 14px;">{{titre}}</h1><p class="meta" style="margin-top: 4px;">{{nom}} · {{lieu}}</p>
<div class="kpi" style="margin-top: 16px;"><span><b>{{cand}}</b>candidatures</span><span><b>{{jours}}</b>en ligne</span></div>
<p style="font-size: 14.5px; line-height: 1.55; margin-top: 18px; color: #C9D6D2;">Vous voyez cette offre comme un talent la voit. Les recruteurs ne peuvent pas candidater ni voir ses candidats.</p>
</div>
<div class="bas"><a href="Recruteur-publier-1.dc.html" class="bs" style="width: 100%;">Créer une offre semblable chez Baobab</a></div>
</div>'''
OFF = OFF.replace('@RETOUR@', ico(I['retour'], 20, '2'))
JSO = '''class Component extends DCLogic {
  renderVals() {
    const p = this.props || {};
    const O = { fleuve: ['Fleuve Banque', 'FB', '#1E4E79', 'Analyste crédit', 'Kinshasa · CDI · 5 postes', '120', '4 jours'], kivu: ['Kivu Data Lab', 'KD', '#4B2D7A', 'Data analyst', 'Goma · CDI', '46', '9 jours'],
      mwinda: ['Mwinda Énergie', 'ME', '#B07A12', 'Technicien·ne solaire', 'Kinshasa · CDI', '31', '6 jours'], lisanga: ['Lisanga Santé', 'LS', '#0F6B5A', 'Infirmier·ère', 'Kinshasa · CDI', '58', '12 jours'] };
    const k = O[p.ent] ? p.ent : 'fleuve'; const o = O[k];
    return { nom: o[0], ini: o[1], bg: o[2], titre: o[3], lieu: o[4], cand: o[5], jours: o[6], retourHref: 'Recruteur-entreprise-' + k + '.dc.html' };
  }
}'''
ecrire_page('Recruteur-offre-autre', 'Jumanly Modèle B · Recruteur · Offre d’une autre entreprise', OFF, JSO, {'ent': {'editor': 'enum', 'options': ['fleuve', 'kivu', 'mwinda', 'lisanga'], 'default': 'fleuve'}})
L = [(f'Recruteur-entreprise-{k}.dc.html', f'Page entreprise · {n}', {'ent': k}) for k, n in [('fleuve', 'Fleuve Banque'), ('kivu', 'Kivu Data Lab'), ('mwinda', 'Mwinda Énergie'), ('lisanga', 'Lisanga Santé'), ('jumanly', 'Jumanly')]]
L += [('Recruteur-entreprise-offres.dc.html', 'Page Baobab · Offres', {'onglet': 'offres'}), ('Recruteur-entreprise-membres.dc.html', 'Page Baobab · Membres', {'onglet': 'membres'}), ('Recruteur-entreprise-fleuve-membres.dc.html', 'Fleuve Banque · Membres', {'ent': 'fleuve', 'onglet': 'membres'}), ('Recruteur-entreprise-fleuve-tous.dc.html', 'Fleuve Banque · Se connecter à tous', {'ent': 'fleuve', 'onglet': 'membres', 'feuille': 'tous'})]
pages('Recruteur-entreprise', L, 'r_ent_pages.json')
for k in ['fleuve', 'kivu', 'mwinda', 'lisanga']:
    importer('Recruteur-offre-autre', f'Recruteur-entreprise-{k}-offre.dc.html', f'Offre de {k}', {'ent': k})
import json as _j
pj = _j.load(open(os.path.join(D, 'r_ent_pages.json')))
pj += [['Recruteur-offre-autre.dc.html', 'Offre d’une autre entreprise'], *[[f'Recruteur-entreprise-{k}-offre.dc.html', f'Offre · {k}'] for k in ['fleuve', 'kivu', 'mwinda', 'lisanga']]]
_j.dump(pj, open(os.path.join(D, 'r_ent_pages.json'), 'w'), ensure_ascii=False)
print('ok')
