# Recruteur · Notifications (chaque ligne ouvre sa page) et Orbi (conversation complète).
from rkit import *
CHEV = ico(I['chev'], 18, '2', '#8FA39E')

JSN = '''class Component extends DCLogic {
  renderVals() {
/*PRELUDE*/
    const N = [
      ['cand', 'Esther Kabila a candidaté', 'Analyste de données · 85 % · Très compatible', 'il y a 2 h', 'Recruteur-candidat-esther.dc.html', 'EK', '#F9E3C8', '#8A4B12', true, 'Aujourd’hui'],
      ['ent', 'Entretien avec Grâce Mbuyi à 10 h', 'Visio avec Aline Mukeba · rejoindre depuis la fiche', 'dans 30 min', 'Recruteur-cand-entretiens.dc.html', '10h', '#0F3F37', '#A6F26B', true, 'Aujourd’hui'],
      ['cand', 'Benjamin Tshibangu a répondu à votre proposition', 'Il demande un début le 9 novembre', '8 h 40', 'Recruteur-conversation-benjamin.dc.html', 'BT', '#E3E8FB', '#2D3F8A', true, 'Aujourd’hui'],
      ['cand', '3 profils à fort potentiel pour Flutter', 'Orbi les a classés, personne n’est écarté', '7 h', 'Recruteur-cand-flutter.dc.html', '3', '#A6F26B', '#0B1A1F', true, 'Aujourd’hui'],
      ['ent', 'Aline Mukeba a évalué Didier Lukusa', '4 étoiles · recommande de le retenir', 'hier', 'Recruteur-evaluation.dc.html', 'AM', '#1B3338', '#F2EDE5', false, 'Hier'],
      ['reseau', 'Joël Kabeya a accepté votre proposition', 'Sa candidature au stage marketing est arrivée', 'lundi', 'Recruteur-conversation-talent.dc.html', 'JK', '#E8F0D8', '#4F6B12', false, 'Cette semaine'],
      ['reseau', 'Joseph Ilunga a accepté votre rattachement', 'Le logo Baobab Fintech est sur votre profil', 'lundi', 'Recruteur-compte-profil.dc.html', 'BF', '#14745F', '#FFFFFF', false, 'Cette semaine'],
      ['reseau', 'Rachel Kanku a publié une réalisation', 'Tableau de bord des ventes · 94 % avec Analyste', 'lundi', 'Recruteur-fil-publication.dc.html', 'RK', '#DDF6EE', '#14745F', false, 'Cette semaine'],
      ['cand', 'L’offre Stagiaire marketing est en pause', '71 candidatures gardées · reprenez quand vous voulez', 'lundi', 'Recruteur-offres-encours.dc.html', '⏸', '#2A3B3E', '#F4C463', false, 'Cette semaine']
    ];
    if (oui(p.admin)) N.unshift(['reseau', '2 personnes indiquent travailler chez Baobab Fintech', 'Grâce Mbuyi et Fabrice Lumbu · confirmer n’est pas obligatoire', 'il y a 3 h', 'Recruteur-mode-entreprise.dc.html', 'BF', '#14745F', '#FFFFFF', true, 'Aujourd’hui']);
    const f = prop('f', 'tout');
    const lu = st.lu || false;
    const items = N.filter((n) => f === 'tout' || n[0] === f).map(([c, t, s, d, href, ini, bg, fg, nv, grp]) => ({ t, s, d, href, ini, bg, fg, nouv: nv && !lu, fw: nv && !lu ? '700' : '500', grp }));
    const groupes = ['Aujourd’hui', 'Hier', 'Cette semaine'].map((g) => ({ g, items: items.filter((x) => x.grp === g) })).filter((g) => g.items.length);
    const n = (c) => N.filter((x) => (c === 'tout' || x[0] === c) && x[8] && !lu).length;
    return { retourHref: oui(p.admin) ? 'Recruteur-mode-entreprise.dc.html' : 'Recruteur-fil.dc.html', onglets: onglets([['tout', 'Tout', n('tout') ? String(n('tout')) : ''], ['cand', 'Candidatures', n('cand') ? String(n('cand')) : ''], ['ent', 'Entretiens'], ['reseau', 'Réseau']], f, 'f'), groupes,
      toutLire: () => { S({ lu: true }); flash('Tout est marqué comme lu'); }, aNonLu: n('tout') > 0, aToast: !!st.toast, toast: st.toast || '' };
  }
}'''
CN = '''
<div class="scroll" style="position: absolute; inset: 0; overflow-y: auto; padding-bottom: 40px;">
<header class="barreh">@BACK@<span style="flex: 1;"></span><sc-if value="{{aNonLu}}" hint-placeholder-val="{{ true }}"><button onClick="{{toutLire}}" style="font-size: 13.5px; font-weight: 700; color: #A6F26B; min-height: 44px; padding: 0 8px;">Tout marquer comme lu</button></sc-if>
<a href="Recruteur-compte-notifications.dc.html" class="rond" aria-label="Régler les notifications" style="color: #B9CBC6;">@REGLAGE@</a></header>
<div style="padding: 18px 20px 4px;"><h1 style="font-size: 26px;">Notifications</h1></div>
@SEG@
<sc-for list="{{groupes}}" as="g" hint-placeholder-count="2"><div><p class="meta" style="padding: 18px 20px 4px; font-weight: 700;">{{g.g}}</p>
<sc-for list="{{g.items}}" as="x" hint-placeholder-count="3"><a href="{{x.href}}" class="ligne"><span class="av" style="background: {{x.bg}}; color: {{x.fg}}; font-size: 13px;">{{x.ini}}</span>
<span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 14.5px; font-weight: {{x.fw}}; line-height: 1.35;">{{x.t}}</b><span class="meta" style="display: block; font-size: 12.5px;">{{x.s}}</span><span class="meta" style="font-size: 11.5px;">{{x.d}}</span></span>
<sc-if value="{{x.nouv}}" hint-placeholder-val="{{ false }}"><span style="width: 9px; height: 9px; border-radius: 50%; background: #A6F26B; flex: none;"></span></sc-if></a></sc-for></div></sc-for>
</div>
@TOAST@
'''
for a, b in {'@BACK@': BACKA('{{retourHref}}', 'Retour'), '@REGLAGE@': ico(I['reglage'], 20, '1.8'), '@SEG@': SEG('onglets', 4), '@TOAST@': TOAST}.items():
    CN = CN.replace(a, b)
ecrire_page('Recruteur-notifications', 'Jumanly Modèle B · Recruteur · Notifications', CN, JSN, {'f': {'editor': 'enum', 'options': ['tout', 'cand', 'ent', 'reseau'], 'default': 'tout'}, 'admin': {'editor': 'boolean', 'default': False}})

JSO = '''class Component extends DCLogic {
  renderVals() {
/*PRELUDE*/
    const R = {
      jour: ['Que dois-je faire aujourd’hui ?', 'Trois choses : l’entretien de Grâce à 10 h (points à vérifier : Power BI et travail en équipe produit), la réponse à Benjamin sur sa date de début, et 52 candidats non retenus qui attendent un message.', [['Ouvrir la fiche de Grâce', 'Recruteur-candidat.dc.html'], ['Répondre aux non retenus', 'Recruteur-cand-nonretenus.dc.html']]],
      flutter: ['Qui recevoir en premier pour Flutter ?', 'Moussa Diallo (92 %) : Flutter et Dart vérifiés, 3 applis publiées ; préavis d’un mois à vérifier. Kevin Lumbala (70 %) débute en Flutter mais est disponible tout de suite. Je classe, vous décidez.', [['Voir les candidatures Flutter', 'Recruteur-cand-flutter.dc.html'], ['Fiche de Moussa', 'Recruteur-candidat-moussa.dc.html']]],
      offre: ['Pourquoi l’offre Clientèle reçoit peu de bons profils ?', 'Elle demande le swahili et 2 ans d’expérience : 31 candidats sur 52 n’ont pas l’expérience. Ajouter le salaire et préciser « débutants formés » élargirait le vivier.', [['Modifier l’offre', 'Recruteur-offre-detail.dc.html']]],
      talents: ['Des talents à proposer pour Analyste ?', 'Rachel Kanku (Goma, prête à venir à Kinshasa) couvre les trois compétences requises, vérifiées. Elle n’a pas candidaté : vous pouvez lui proposer l’offre.', [['Profil de Rachel', 'Recruteur-talent.dc.html']]]
    };
    const ordre = st.ordre || ['jour'];
    const q = st.q ?? '';
    const fil = ordre.map((k) => ({ q: R[k][0], t: R[k][1], liens: R[k][2].map(([t, href]) => ({ t, href })) }));
    const reste = Object.keys(R).filter((k) => !ordre.includes(k)).map((k) => ({ t: R[k][0], go: () => S({ ordre: [...ordre, k] }) }));
    return { fil, reste, aReste: reste.length > 0, q, ecrire: (e) => S({ q: val(e) }),
      envoyer: () => { if (!q.trim()) return flash('Écrivez votre question à Orbi'); const k = Object.keys(R).find((x) => !ordre.includes(x)); S({ ordre: k ? [...ordre, k] : ordre, q: '' }); if (!k) flash('Orbi a répondu à toutes les questions du jour'); },
      effacer: () => { S({ ordre: ['jour'] }); flash('Conversation effacée'); }, aToast: !!st.toast, toast: st.toast || '' };
  }
}'''
CO = '''
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<header class="barreh" style="gap: 10px;">@BACK@@ORBI32@<span style="flex: 1;"><b style="display: block; font-size: 15px;">Orbi</b><span class="meta" style="font-size: 12px;">Assistant de recrutement · 212 crédits</span></span><button onClick="{{effacer}}" style="font-size: 13px; font-weight: 700; color: #B9CBC6; min-height: 44px; padding: 0 8px;">Effacer</button></header>
<div class="scroll" style="flex: 1; overflow-y: auto; padding: 16px 16px 160px; display: flex; flex-direction: column; gap: 14px;">
<sc-for list="{{fil}}" as="m" hint-placeholder-count="2"><div style="display: flex; flex-direction: column; gap: 8px;">
<p style="align-self: flex-end; max-width: 80%; padding: 10px 14px; border-radius: 18px 18px 6px 18px; background: #F2EDE5; color: #0B1A1F; font-size: 14.5px; line-height: 1.45;">{{m.q}}</p>
<div style="align-self: flex-start; max-width: 90%; padding: 14px; border-radius: 18px 18px 18px 6px; background: #13282C; border: 1px solid rgba(47,211,166,.2);"><p style="font-size: 14.5px; line-height: 1.5;">{{m.t}}</p>
<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;"><sc-for list="{{m.liens}}" as="l" hint-placeholder-count="2"><a href="{{l.href}}" style="height: 36px; padding: 0 14px; border-radius: 18px; background: #A6F26B; color: #0B1A1F; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center;">{{l.t}}</a></sc-for></div>
<p class="meta" style="font-size: 11.5px; margin-top: 8px;">Orbi recommande, vous décidez.</p></div></div></sc-for>
<sc-if value="{{aReste}}" hint-placeholder-val="{{ true }}"><div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;"><p class="meta">Vous pouvez aussi demander</p><sc-for list="{{reste}}" as="r" hint-placeholder-count="3"><button onClick="{{r.go}}" class="q">{{r.t}}</button></sc-for></div></sc-if>
</div>
<div class="bas"><label class="champ" style="flex: 1;"><input value="{{q}}" onChange="{{ecrire}}" aria-label="Écrire à Orbi" placeholder="Écrire à Orbi…"><button onClick="{{envoyer}}" class="env">Envoyer</button></label></div>
</div>
@TOAST@
'''
for a, b in {'@BACK@': BACKA('Recruteur-candidatures.dc.html', ''), '@ORBI32@': ORBI(32), '@TOAST@': TOAST}.items():
    CO = CO.replace(a, b)
ecrire_page('Recruteur-orbi', 'Jumanly Modèle B · Recruteur · Orbi', CO, JSO, {})
pages('Recruteur-notifications', [('Recruteur-notifications-candidatures.dc.html', 'Notifications · Candidatures', {'f': 'cand'}), ('Recruteur-notifications-reseau.dc.html', 'Notifications · Réseau', {'f': 'reseau'}), ('Recruteur-notifications-admin.dc.html', 'Notifications de l’administrateur (Joseph)', {'admin': 'true'})], 'r_notif_pages.json')
import json as _j
pj = _j.load(open(os.path.join(D, 'r_notif_pages.json'))) + [['Recruteur-orbi.dc.html', 'Orbi · conversation complète']]
_j.dump(pj, open(os.path.join(D, 'r_notif_pages.json'), 'w'), ensure_ascii=False)
print('ok')
