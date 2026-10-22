# Recruteur · Messages : Candidats, Talents, Équipe ; conversation liée à la candidature ; modèles ; joindre.
from rkit import *
JS = open(os.path.join(D, 'r_msg_logic.js')).read()
JS = JS.replace("h: der[2].includes('h') && !der[2].includes(' ') ? der[2] : c.h,", "h: (envoyes[k] || []).length ? 'à l’instant' : c.h,").replace('Recruteur-candidatures-toutes.dc.html', 'Recruteur-cand-toutes.dc.html')

LIGNE = ('<button onClick="{{x.ouvrir}}" class="ligne"><span class="av" style="width: 50px; height: 50px; background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span>'
    '<span style="flex: 1; min-width: 0;"><span style="display: flex; justify-content: space-between; gap: 8px;"><b style="font-size: 15px;">{{x.nom}}</b><span class="meta" style="font-size: 12px; flex: none;">{{x.h}}</span></span>'
    '<span style="display: block; font-size: 12px; color: #5FE0B8; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{x.ctx}}</span>'
    '<span style="display: flex; gap: 8px; align-items: center;"><span style="flex: 1; min-width: 0; font-size: 13.5px; font-weight: {{x.fw}}; color: {{x.acol}}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{x.apercu}}</span>'
    '<sc-if value="{{x.aNl}}" hint-placeholder-val="{{ false }}"><span style="min-width: 20px; height: 20px; padding: 0 6px; border-radius: 10px; background: #A6F26B; color: #0B1A1F; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center;">{{x.nl}}</span></sc-if></span></span></button>')

CORPS = '''
<sc-if value="{{vListe}}" hint-placeholder-val="{{ true }}">
<div class="scroll" style="position: absolute; inset: 0; overflow-y: auto; padding-bottom: 170px;">
<header style="padding: 54px 20px 0; display: flex; align-items: center; gap: 10px;">
<h1 style="flex: 1; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">Messages</h1>
<button onClick="{{nouveau}}" class="rond" aria-label="Nouveau message" style="background: #1A2629; color: #F2EDE5;">@PLUS@</button>@MOI@
</header>
<sc-if value="{{sansRech}}" hint-placeholder-val="{{ true }}"><div>
<div style="padding: 14px 20px 0;"><button onClick="{{ouvrirRech}}" class="rech" style="width: 100%;">@LOUPE@<span style="color: #6F8580; font-size: 15px;">Nom, offre, mot du message</span></button></div>
<div style="margin-top: 10px;">@SEG@</div>
<p class="meta" style="padding: 12px 20px 2px; font-size: 12.5px;">{{infoCat}}</p>
<sc-for list="{{liste}}" as="x" hint-placeholder-count="3">@LIGNE@</sc-for>
</div></sc-if>
<sc-if value="{{aRech}}" hint-placeholder-val="{{ false }}"><div>
<div style="padding: 14px 20px 0; display: flex; align-items: center; gap: 10px;">
<label class="rech" style="border: 1px solid rgba(166,242,107,.35);">@LOUPE@<input value="{{q}}" onChange="{{chercher}}" aria-label="Rechercher dans les messages" placeholder="Nom, offre, mot du message">
<sc-if value="{{aQ}}" hint-placeholder-val="{{ false }}"><button onClick="{{viderQ}}" aria-label="Effacer" style="width: 30px; height: 30px; color: #9FB3AE; font-size: 18px; text-align: center;">×</button></sc-if></label>
<button onClick="{{annulerRech}}" style="height: 44px; font-size: 14px; font-weight: 600; color: #A6F26B; flex: none;">Annuler</button></div>
<p class="meta" style="padding: 18px 20px 10px;">Chercher dans</p><div style="padding: 0 20px;">@PILLS_RT@</div>
<sc-if value="{{qVide}}" hint-placeholder-val="{{ true }}"><p class="meta" style="padding: 22px 20px; line-height: 1.5;">Tapez une lettre : les conversations apparaissent tout de suite.</p></sc-if>
<sc-if value="{{qPlein}}" hint-placeholder-val="{{ false }}"><div style="margin-top: 12px;"><sc-for list="{{resRech}}" as="x" hint-placeholder-count="2">@LIGNE@</sc-for>
<sc-if value="{{rRien}}" hint-placeholder-val="{{ false }}"><p class="meta" style="text-align: center; padding: 30px 20px;">Rien pour « {{q}} ».</p></sc-if></div></sc-if>
</div></sc-if>
</div>
@NAV@
</sc-if>

<sc-if value="{{vConv}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<header class="barreh" style="gap: 8px;">@BACK_CONV@<span class="av" style="width: 38px; height: 38px; font-size: 12px; background: {{c.bg}}; color: {{c.fg}};">{{c.ini}}</span>
<span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px;">{{c.nom}}</b><span style="display: block; font-size: 11.5px; color: #5FE0B8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{c.ctx}}</span></span>
<button onClick="{{ouvrirMenuC}}" class="plus" aria-label="Plus d’options">···</button></header>
<div class="scroll" style="flex: 1; overflow-y: auto; padding: 14px 16px 150px; display: flex; flex-direction: column; gap: 8px;">
<a href="{{c.fiche}}" style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 14px; background: #13282C; color: #F2EDE5; font-size: 13px;">@NOTE@<span style="flex: 1;">{{c.ctx}}</span><span style="color: #A6F26B; font-weight: 700;">Ouvrir</span></a>
<sc-for list="{{msgs}}" as="m" hint-placeholder-count="3">
<sc-if value="{{m.elle}}" hint-placeholder-val="{{ true }}"><div style="align-self: flex-start; max-width: 78%;"><p style="padding: 10px 14px; border-radius: 18px 18px 18px 6px; background: #1B3338; font-size: 14.5px; line-height: 1.45;">{{m.t}}</p><span class="meta" style="font-size: 11px; padding-left: 6px;">{{m.d}}</span></div></sc-if>
<sc-if value="{{m.moi}}" hint-placeholder-val="{{ false }}"><div style="align-self: flex-end; max-width: 78%; text-align: right;"><p style="padding: 10px 14px; border-radius: 18px 18px 6px 18px; background: #F2EDE5; color: #0B1A1F; font-size: 14.5px; line-height: 1.45; text-align: left;">{{m.t}}</p><span class="meta" style="font-size: 11px; padding-right: 6px;">{{m.d}}</span></div></sc-if>
</sc-for>
<sc-if value="{{aInv}}" hint-placeholder-val="{{ false }}"><div style="align-self: stretch; padding: 14px; border-radius: 18px; border: 1px solid rgba(166,242,107,.3); display: flex; align-items: center; gap: 12px;">@CAL@<span style="flex: 1;"><b style="display: block; font-size: 14px;">Entretien · {{inv.j}} · {{inv.h}}</b><span class="meta">{{inv.mode}} · invitation {{inv.etat}}</span></span></div></sc-if>
<sc-if value="{{aVue}}" hint-placeholder-val="{{ false }}"><p class="meta" style="text-align: right; font-size: 12px;">Vue mardi</p></sc-if>
</div>
<div class="bas" style="flex-direction: column; gap: 8px;">
<div style="display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none;">
<button onClick="{{orbiRedige}}" style="display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px; border-radius: 17px; background: rgba(47,211,166,.12); color: #9FD9C6; font-size: 12.5px; font-weight: 700; flex: none;">@ORBI18@Orbi propose</button>
<button onClick="{{ouvrirModeles}}" style="height: 34px; padding: 0 12px; border-radius: 17px; background: #13282C; font-size: 12.5px; font-weight: 700; flex: none;">Modèles</button>
<button onClick="{{ouvrirJoindre}}" style="display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px; border-radius: 17px; background: #13282C; font-size: 12.5px; font-weight: 700; flex: none;">@TROMBONE@Joindre</button></div>
<label class="champ" style="border-color: rgba(255,255,255,.18);"><input value="{{brouillon}}" onChange="{{ecrire}}" aria-label="Votre message" placeholder="Votre message"><button onClick="{{envoyer}}" class="env" aria-label="Envoyer">@ENVOI@</button></label>
</div>
</div>
</sc-if>

@FAB@
@F_MODELES@
@F_JOINDRE@
@F_MENUC@
@F_NOUVEAU@
@ORBI_SHEET@
@TOAST@
'''
LIENS = lambda lst: (f'<sc-for list="{{{{{lst}}}}}" as="m" hint-placeholder-count="3"><sc-if value="{{{{m.bouton}}}}" hint-placeholder-val="{{{{ true }}}}"><button onClick="{{{{m.go}}}}" class="opt"><span>{{{{m.t}}}}<small>{{{{m.s}}}}</small></span></button></sc-if>'
                     '<sc-if value="{{m.lien}}" hint-placeholder-val="{{ false }}"><a href="{{m.href}}" class="opt"><span>{{m.t}}<small>{{m.s}}</small></span></a></sc-if></sc-for>')
F = {
 '@F_MODELES@': feuille('fModeles', '<b style="display: block; font-size: 17px; padding: 0 4px 6px;">Modèles de messages</b><sc-for list="{{modeles}}" as="v" hint-placeholder-count="3"><button onClick="{{v.pick}}" class="opt" style="align-items: flex-start;"><span>{{v.t}}<small style="line-height: 1.4;">{{v.m}}</small></span></button></sc-for>'
    '<a href="Recruteur-parametres.dc.html" class="opt" style="color: #A6F26B;"><span>Gérer mes modèles<small>Dans Compte · Paramètres</small></span></a><button onClick="{{fermer}}" class="annuler">Annuler</button>'),
 '@F_JOINDRE@': feuille('fJoindre', '<b style="display: block; font-size: 17px; padding: 0 4px 6px;">Joindre</b>' + LIENS('joindreL') + '<button onClick="{{fermer}}" class="annuler">Annuler</button>'),
 '@F_MENUC@': feuille('fMenuC', '<p style="font-size: 13px; color: #8FA39E; padding: 0 4px 6px;">{{c.nom}}</p>' + LIENS('menuC') + '<button onClick="{{fermer}}" class="annuler">Annuler</button>'),
 '@F_NOUVEAU@': feuille('fNouveau', '<b style="display: block; font-size: 17px; padding: 0 4px 6px;">Nouveau message</b><p class="meta" style="padding: 0 4px 6px;">À un candidat ou à votre équipe. Pour un talent, passez par « Proposer une offre ».</p>'
    '<sc-for list="{{nouveaux}}" as="v" hint-placeholder-count="4"><button onClick="{{v.pick}}" class="opt"><span>{{v.t}}<small>{{v.s}}</small></span></button></sc-for><button onClick="{{fermer}}" class="annuler">Annuler</button>'),
}
REMP = {'@PLUS@': ico(I['plus'], 22, '2'), '@MOI@': MOI(), '@LOUPE@': LOUPE, '@SEG@': SEG('sousOnglets', 3), '@PILLS_RT@': PILLS('rTypes'), '@LIGNE@': LIGNE,
        '@BACK_CONV@': BACK('retourConv', ''), '@NOTE@': ico(I['note'], 18, '1.8', '#9FD9C6'), '@CAL@': ico(I['cal'], 22, '1.8', '#A6F26B'), '@ORBI18@': ORBI(18),
        '@TROMBONE@': ico(I['trombone'], 16, '1.8'), '@ENVOI@': ico(I['envoi'], 18, '2'), '@NAV@': nav('messages'), '@FAB@': FAB(), '@ORBI_SHEET@': ORBI_SHEET, '@TOAST@': TOAST, **F}
C2 = CORPS
for k, v in REMP.items():
    C2 = C2.replace(k, v)
assert '@' not in C2
PROPS = {
    'vue': {'editor': 'enum', 'options': ['liste', 'conv'], 'default': 'liste'},
    'sous': {'editor': 'enum', 'options': ['candidats', 'talents', 'equipe'], 'default': 'candidats'},
    'conv': {'editor': 'enum', 'options': ['grace', 'benjamin', 'moussa', 'amani', 'joel', 'gloria', 'nathalie', 'christelle', 'aline', 'patrice', 'joseph'], 'default': 'grace'},
    'feuille': {'editor': 'enum', 'options': ['aucune', 'modeles', 'joindre', 'menuC', 'nouveau'], 'default': 'aucune'},
    'recherche': {'editor': 'enum', 'options': ['', 'options', 'texte'], 'default': ''},
    'orbi': {'editor': 'boolean', 'default': False}, 'orbiRep': {'editor': 'enum', 'options': ['aucune', 'repondre', 'attente'], 'default': 'aucune'},
}
ecrire_page('Recruteur-messages', 'Jumanly Modèle B · Recruteur · Messages', C2, JS, PROPS)
pages('Recruteur-messages', [
    ('Recruteur-messages-talents.dc.html', 'Messages · Réseau', {'sous': 'talents'}),
    ('Recruteur-messages-equipe.dc.html', 'Messages · Équipe', {'sous': 'equipe'}),
    ('Recruteur-messages-recherche.dc.html', 'Messages · Recherche « g »', {'recherche': 'texte'}),
    ('Recruteur-messages-nouveau.dc.html', 'Messages · Nouveau message', {'feuille': 'nouveau'}),
    ('Recruteur-conversation.dc.html', 'Conversation avec une candidate', {'vue': 'conv', 'conv': 'grace'}),
    ('Recruteur-conversation-benjamin.dc.html', 'Conversation · report de la date de début', {'vue': 'conv', 'conv': 'benjamin'}),
    ('Recruteur-conversation-modeles.dc.html', 'Conversation · Modèles de messages', {'vue': 'conv', 'conv': 'grace', 'feuille': 'modeles'}),
    ('Recruteur-conversation-joindre.dc.html', 'Conversation · Joindre', {'vue': 'conv', 'conv': 'grace', 'feuille': 'joindre'}),
    ('Recruteur-conversation-talent.dc.html', 'Conversation avec un talent', {'vue': 'conv', 'conv': 'joel'}),
    ('Recruteur-conversation-nathalie.dc.html', 'Conversation avec une relation talent', {'vue': 'conv', 'conv': 'nathalie'}),
    ('Recruteur-conversation-christelle.dc.html', 'Conversation avec une recruteuse d’une autre entreprise', {'vue': 'conv', 'conv': 'christelle'}),
    ('Recruteur-conversation-equipe.dc.html', 'Conversation avec l’équipe', {'vue': 'conv', 'conv': 'aline'}),
    ('Recruteur-conversation-joseph.dc.html', 'Conversation · rattachement accepté', {'vue': 'conv', 'conv': 'joseph'}),
    ('Recruteur-messages-orbi.dc.html', 'Orbi · qui attend une réponse', {'orbi': 'true', 'orbiRep': 'attente'}),
], 'r_msg_pages.json')
print('ok')
