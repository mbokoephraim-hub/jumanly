# Recruteur · Compte : menu, profil recruteur (logo de l’entreprise), statistiques, équipe, formule en lecture, réglages, aide.
from rkit import *
JS = open(os.path.join(D, 'r_compte_logic.js')).read()

def ICO(k): return ico(I[k], 20, '1.8', '#B9CBC6')
LIGNE_MENU = ''.join(
    f'<sc-if value="{{{{it.ic}}}}" hint-placeholder-val="{{{{ false }}}}"></sc-if>' for _ in [0])  # (aucun rendu, garde la structure simple)
ITEM_IN = ('<span class="mini" style="width: 40px; height: 40px; border-radius: 12px; background: #13282C;">{{it.svg}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px;">{{it.t}}</b><span class="meta" style="font-size: 12.5px;">{{it.s}}</span></span>' + ico(I['chev'], 18, '2', '#8FA39E'))
TOGGLE = lambda go, fond, x, etat, lab: (f'<button onClick="{{{{{go}}}}}" role="switch" aria-checked="{{{{{etat}}}}}" aria-label="{lab}" style="width: 50px; height: 30px; border-radius: 15px; background: {{{{{fond}}}}}; padding: 3px; flex: none;">'
                                         f'<span style="display: block; width: 24px; height: 24px; border-radius: 50%; background: #0B1A1F; transform: translateX({{{{{x}}}}}); transition: transform .2s;"></span></button>')
HEAD = lambda titre: f'<header class="barreh">{BACK("retour", "Compte")}<span style="flex: 1;"></span></header><div style="padding: 18px 20px 4px;"><h1 style="font-size: 24px;">{titre}</h1></div>'
VUE = lambda cond, titre, corps, bas='': (f'<sc-if value="{{{{{cond}}}}}" hint-placeholder-val="{{{{ false }}}}">\n<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">{HEAD(titre)}'
                                     f'<div class="scroll" style="flex: 1; overflow-y: auto; padding-bottom: 130px;">{corps}</div>{bas}</div>\n</sc-if>')

MENU = '''<sc-if value="{{vMenu}}" hint-placeholder-val="{{ true }}">
<div class="scroll" style="position: absolute; inset: 0; overflow-y: auto; padding-bottom: 40px;">
<header class="barreh" style="border: 0;">@BACK_FIL@<span style="flex: 1;"></span>@CLOCHE@</header>
<button onClick="{{voirProfil}}" style="margin: 4px 20px 0; width: calc(100% - 40px); padding: 18px; border-radius: 24px; background: linear-gradient(150deg, #14745F 0%, #0F3F37 60%, #13282C 100%); display: flex; align-items: center; gap: 14px;">
<span style="position: relative; flex: none;"><sc-if value="{{pasAdmin}}" hint-placeholder-val="{{ true }}"><span style="display: block; width: 64px; height: 64px; border-radius: 50%; overflow: hidden;">@PORTRAIT64@</span></sc-if><sc-if value="{{admin}}" hint-placeholder-val="{{ false }}"><span class="av" style="width: 64px; height: 64px; font-size: 20px; background: #14745F; color: #FFFFFF;">JI</span></sc-if>
<span style="position: absolute; right: -4px; bottom: -4px; width: 26px; height: 26px; border-radius: 8px; background: #14745F; border: 2px solid #0F3F37; color: #FFFFFF; font-size: 9px; font-weight: 800; display: flex; align-items: center; justify-content: center;">BF</span></span>
<span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 18px;">{{moiNom}}</b><span style="display: block; font-size: 13px; color: #C9D6D2;">{{moiRole}}</span>
<span style="display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; font-size: 12px; font-weight: 700; color: #A6F26B;">@CHECK14@Rattachée à Baobab Fintech</span></span>@CHEV@</button>
<button onClick="{{basculer}}" style="margin: 10px 20px 0; width: calc(100% - 40px); display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 18px; background: #13282C; border: 1px solid rgba(255,255,255,.08);"><span style="display: flex; flex: none;"><span class="av" style="width: 30px; height: 30px; font-size: 10px; background: #F4C9A0; color: #2A1A12; border: 2px solid #13282C;">NK</span><span class="av" style="width: 30px; height: 30px; font-size: 10px; margin-left: -10px; background: #0F3F37; color: #A6F26B; border: 2px solid #13282C;">T</span><span class="mini" style="width: 30px; height: 30px; font-size: 10px; margin-left: -10px; border-radius: 9px; background: #14745F; border: 2px solid #13282C;">BF</span></span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 14.5px;">Changer de profil</b><span class="meta" style="font-size: 12px;">Recruteur, talent ou entreprise</span></span>@CHEV@</button>
<sc-for list="{{groupes}}" as="g" hint-placeholder-count="4"><div><p class="meta" style="padding: 22px 20px 6px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; font-size: 11.5px;">{{g.titre}}</p>
<sc-for list="{{g.items}}" as="it" hint-placeholder-count="3">
<sc-if value="{{it.bouton}}" hint-placeholder-val="{{ true }}"><button onClick="{{it.go}}" class="ligne" style="padding: 10px 20px;">@ITEM@</button></sc-if>
<sc-if value="{{it.lien}}" hint-placeholder-val="{{ false }}"><a href="{{it.href}}" class="ligne" style="padding: 10px 20px;">@ITEM@</a></sc-if>
</sc-for></div></sc-for>
<button onClick="{{deconnecter}}" style="display: flex; align-items: center; gap: 12px; margin: 20px 20px 0; height: 52px; width: calc(100% - 40px); justify-content: center; border-radius: 26px; background: #13282C; font-size: 15px; font-weight: 700; color: #F4D59A;">@SORTIE@Se déconnecter</button>
<p class="meta" style="text-align: center; padding: 18px 20px 0; font-size: 12px;">Jumanly · Learn. Grow. Connect.</p>
</div>
</sc-if>'''

PROFIL = '''<sc-if value="{{vProfil}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<div class="scroll" style="flex: 1; overflow-y: auto; padding-bottom: 120px;">
<div style="height: 150px; background: linear-gradient(160deg, #14745F 0%, #0F3F37 60%, #0B1A1F 100%); position: relative;">
<button onClick="{{retour}}" class="rond" aria-label="Retour" style="position: absolute; left: 12px; top: 50px; background: rgba(11,26,31,.55);">@RETOUR@</button>
<span style="position: absolute; right: 20px; top: 58px; font-size: 12px; font-weight: 700; color: #C9D6D2;">Aperçu : ce que voient les talents</span></div>
<div style="padding: 0 20px; margin-top: -46px; position: relative;">
<span style="position: relative; display: inline-block;"><span style="display: block; width: 92px; height: 92px; border-radius: 50%; overflow: hidden; border: 4px solid #0B1A1F;">@PORTRAIT92@</span>
<a href="Recruteur-entreprise.dc.html" aria-label="Page de Baobab Fintech" style="position: absolute; right: -6px; bottom: 0; width: 34px; height: 34px; border-radius: 10px; background: #14745F; border: 3px solid #0B1A1F; color: #FFFFFF; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center;">BF</a></span>
<h1 style="font-size: 24px; margin-top: 10px;">Nadia Kalala</h1>
<p style="font-size: 15px; color: #C9D6D2; margin-top: 2px;">Chargée de recrutement · <a href="Recruteur-entreprise.dc.html" style="font-weight: 700;">Baobab Fintech</a></p>
<p class="meta" style="margin-top: 4px;">Kinshasa · recrute aussi à Lubumbashi</p>
<sc-if value="{{recrute}}" hint-placeholder-val="{{ true }}"><span style="display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; padding: 6px 10px; border-radius: 8px; background: rgba(166,242,107,.12); color: #A6F26B; font-size: 12.5px; font-weight: 700;">● {{recruteT}}</span></sc-if>
<p style="font-size: 15px; line-height: 1.5; margin-top: 12px; color: #ECE7DF;">{{accroche}}</p>
</div>
<div class="bloc" style="margin-top: 8px;"><h3>Recrute pour</h3><div style="display: flex; flex-wrap: wrap; gap: 6px;"><sc-for list="{{profil.domaines}}" as="t" hint-placeholder-count="4"><span class="tag">{{t.t}}</span></sc-for></div></div>
<div class="bloc"><h3>Offres en cours</h3><sc-for list="{{profil.offres}}" as="o" hint-placeholder-count="3"><a href="{{o.href}}" style="display: flex; align-items: center; gap: 12px; padding: 8px 0; color: #F2EDE5;"><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">{{o.t}}</b><span class="meta">{{o.s}}</span></span>@CHEV@</a></sc-for></div>
<div class="bloc"><h3>Contacts</h3><sc-for list="{{profil.contacts}}" as="c" hint-placeholder-count="4"><div style="padding: 7px 0;"><span class="meta" style="font-size: 12px;">{{c.t}} · {{c.s}}</span><b style="display: block; font-size: 14.5px;">{{c.v}}</b></div></sc-for></div>
</div>
<div class="bas"><button onClick="{{modifier}}" class="bp">Modifier mon profil</button></div>
</div>
</sc-if>'''

MODIF = '''<sc-if value="{{vModif}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<header class="barreh">@BACK_PROFIL@<span style="flex: 1;"></span></header>
<div class="scroll" style="flex: 1; overflow-y: auto; padding: 18px 20px 130px;">
<h1 style="font-size: 24px;">Modifier mon profil</h1>
<span class="lab">Accroche</span><textarea class="ta" onChange="{{ecrireAccroche}}" aria-label="Accroche">{{accroche}}</textarea>
<button onClick="{{orbiAccroche}}" style="display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 13.5px; font-weight: 700; color: #5FE0B8; min-height: 40px;">@ORBI20@Orbi propose une accroche</button>
<div style="display: flex; align-items: center; gap: 12px; margin-top: 18px; padding: 14px; border-radius: 18px; background: #13282C;"><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">Badge « Recrute en ce moment »</b><span class="meta" style="font-size: 12.5px;">Les talents vous trouvent plus vite</span></span>@TOG_R@</div>
<span class="lab">Qui voit votre téléphone</span>@PILLS_VIS@
<span class="lab">Entreprise</span>
<a href="Recruteur-entreprise.dc.html" style="display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 18px; background: #13282C; color: #F2EDE5;"><span class="mini" style="background: #14745F;">BF</span><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">Baobab Fintech</b><span style="font-size: 12.5px; color: #A6F26B; font-weight: 700;">Rattachement accepté par Joseph Ilunga</span></span>@CHEV@</a>
<p class="meta" style="margin-top: 10px; font-size: 12.5px; line-height: 1.5;">Pour changer d’entreprise, quittez Baobab Fintech depuis Confidentialité et données : votre profil et vos messages restent à vous.</p>
</div>
<div class="bas"><button onClick="{{enregistrer}}" class="bp">Enregistrer</button></div>
</div>
</sc-if>'''

STATS = VUE('vStats', 'Mes statistiques', '<p class="meta" style="padding: 0 20px;">30 derniers jours · toutes vos offres</p>'
    '<div class="g2" style="padding: 14px 20px 0;"><sc-for list="{{stats.tuiles}}" as="t" hint-placeholder-count="4"><span class="tuile"><b>{{t.b}}</b>{{t.t}}</span></sc-for></div>'
    '<div class="bloc"><h3>Du dépôt à l’embauche</h3><sc-for list="{{stats.etapes}}" as="e" hint-placeholder-count="5"><div style="display: flex; align-items: center; gap: 12px; padding: 6px 0;"><span style="width: 96px; font-size: 13.5px;">{{e.t}}</span><span style="flex: 1; height: 10px; border-radius: 5px; background: rgba(255,255,255,.08); overflow: hidden;"><span style="display: block; height: 100%; width: {{e.w}}; background: #5FE0B8;"></span></span><b style="width: 34px; text-align: right; font-size: 13.5px;">{{e.n}}</b></div></sc-for></div>'
    '<a href="Recruteur-cand-decisions.dc.html" class="ligne"><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">Les 6 % sans réponse</b><span class="meta">Répondre depuis Décisions</span></span>' + ico(I['chev'], 18, '2', '#8FA39E') + '</a>')
ENREG = VUE('vEnreg', 'Publications enregistrées', '<sc-for list="{{enreg}}" as="x" hint-placeholder-count="2"><div class="ligne"><a href="{{x.href}}" style="flex: 1; color: #F2EDE5;"><b style="display: block; font-size: 14.5px; line-height: 1.4;">{{x.t}}</b><span class="meta">{{x.a}}</span></a><button onClick="{{x.retirer}}" class="plus" aria-label="Retirer">' + ico(I['signet'], 20, '1.8', '#A6F26B') + '</button></div></sc-for>'
    '<sc-if value="{{sansEnreg}}" hint-placeholder-val="{{ false }}"><p class="meta" style="padding: 30px 20px; text-align: center;">Rien d’enregistré. Dans le Fil, touchez ··· puis Enregistrer.</p></sc-if>')
NOTIFS = VUE('vNotifs', 'Notifications', '<sc-for list="{{notifsL}}" as="n" hint-placeholder-count="6"><div class="ligne"><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">{{n.t}}</b><span class="meta" style="font-size: 12.5px;">{{n.s}}</span></span>' + TOGGLE('n.pick', 'n.fond', 'n.x', 'n.etat', 'Activer') + '</div></sc-for>'
    '<p class="meta" style="padding: 16px 20px; font-size: 12.5px; line-height: 1.5;">Les notifications d’entretien arrivent aussi par e-mail.</p>')
CONFID = VUE('vConfid', 'Confidentialité et données', '<div class="bloc"><h3>Journal des consultations</h3><p style="font-size: 14px; line-height: 1.5; color: #C9D6D2;">Chaque profil que vous ouvrez est enregistré. Les talents savent que Baobab Fintech a consulté leur profil.</p><p class="meta" style="margin-top: 8px;">38 profils consultés ce mois</p></div>'
    '<div class="bloc"><h3>Ce que vous partagez</h3><p style="font-size: 14px; line-height: 1.5; color: #C9D6D2;">Votre e-mail professionnel est public. Votre téléphone se règle dans votre profil.</p><a href="Recruteur-compte-modifier.dc.html" style="display: block; margin-top: 8px; font-size: 14px; font-weight: 700;">Régler la visibilité</a></div>'
    '<div class="bloc"><h3>Vos données</h3><button onClick="{{telechargerDonnees}}" class="bs" style="width: 100%;">Recevoir une copie par e-mail</button></div>'
    '<div class="bloc"><h3>Quitter Baobab Fintech</h3><p style="font-size: 14px; line-height: 1.5; color: #C9D6D2;">Le logo disparaît de votre profil. Les candidatures restent à l’entreprise, vos messages personnels restent à vous.</p><a href="Recruteur-aide.dc.html" style="display: block; margin-top: 8px; font-size: 14px; font-weight: 700; color: #F4D59A;">Demander à quitter l’entreprise</a></div>')
MODELES = VUE('vModeles', 'Modèles de messages', '<p class="meta" style="padding: 0 20px 8px;">Utilisés dans Messages et dans les réponses groupées.</p><sc-for list="{{MODELES}}" as="m" hint-placeholder-count="5"><button onClick="{{m.ouvrir}}" class="ligne"><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">{{m.t}}</b><span class="meta" style="font-size: 12.5px;">{{m.s}}</span></span>' + ico(I['chev'], 18, '2', '#8FA39E') + '</button></sc-for>')
LANGUE = VUE('vLangue', 'Langue', '<sc-for list="{{langues}}" as="l" hint-placeholder-count="2"><button onClick="{{l.pick}}" class="ligne"><span style="flex: 1;"><b style="display: block; font-size: 15px;">{{l.t}}</b><span class="meta">{{l.s}}</span></span><b style="color: #A6F26B;">{{l.sym}}</b></button></sc-for>')
EQUIPE = VUE('vEquipe', 'Équipe de recrutement', '<p class="meta" style="padding: 0 20px 8px;">Baobab Fintech · 4 personnes sur 5 places</p>'
    '<sc-for list="{{equipe}}" as="m" hint-placeholder-count="4"><a href="{{m.href}}" class="ligne"><span class="av" style="background: {{m.bg}}; color: {{m.fg}};">{{m.ini}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px;">{{m.nom}}</b><span class="meta" style="display: block; font-size: 12.5px;">{{m.role}} · {{m.s}}</span></span><span style="font-size: 12px; font-weight: 700; color: {{m.dcol}};">{{m.droit}}</span></a></sc-for>'
    '<div class="bloc"><h3>Qui peut faire quoi</h3><sc-for list="{{DROITS}}" as="d" hint-placeholder-count="3"><div style="padding: 6px 0;"><b style="font-size: 14px;">{{d.t}}</b><p class="meta" style="font-size: 12.5px;">{{d.s}}</p></div></sc-for></div>'
    '<p class="meta" style="padding: 14px 20px; font-size: 12.5px; line-height: 1.5;">Joseph Ilunga ajoute ou retire des personnes depuis l’administration, sur ordinateur.</p>',
    '<div class="bas"><button onClick="{{ouvrirInvite}}" class="bp">Proposer un collègue</button></div>')
FORMULE = VUE('vFormule', 'Formule et usage', '<div style="margin: 0 20px; padding: 18px; border-radius: 22px; background: #F2EDE5; color: #0B1A1F;"><span style="font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #14745F;">Formule de Baobab Fintech</span>'
    '<b style="display: block; font-size: 24px; margin-top: 6px;">Company</b><span style="display: block; font-size: 13.5px; color: #4A5A56; margin-top: 2px;">79,9 USD par mois · payée jusqu’au 1er novembre 2026</span><span style="display: block; font-size: 12.5px; color: #4A5A56; margin-top: 8px;">Gérée par Joseph Ilunga, administrateur, sur ordinateur.</span></div>'
    '<div class="bloc"><h3>Utilisation ce mois</h3><sc-for list="{{usage}}" as="u" hint-placeholder-count="4"><div style="padding: 7px 0;"><span style="display: flex; justify-content: space-between; font-size: 13.5px;"><span>{{u.t}}</span><b>{{u.v}}</b></span><span class="barre"><i style="width: {{u.w}};"></i></span></div></sc-for></div>'
    '<div class="sec"><h2>Comparer</h2></div><div style="padding: 0 20px; display: flex; flex-direction: column; gap: 10px;"><sc-for list="{{formules}}" as="f" hint-placeholder-count="3"><div style="padding: 14px; border-radius: 18px; border: 1.5px solid {{f.bd}};"><span style="display: flex; justify-content: space-between;"><b style="font-size: 15px;">{{f.t}}</b><span style="font-size: 13.5px; font-weight: 700;">{{f.prix}}</span></span><span class="meta" style="display: block; margin-top: 4px; font-size: 12.5px;">{{f.s}}</span>'
    '<sc-if value="{{f.aOn}}" hint-placeholder-val="{{ true }}"><span style="display: block; margin-top: 6px; font-size: 12px; font-weight: 700; color: #A6F26B;">Formule actuelle</span></sc-if></div></sc-for></div>'
    '<p class="meta" style="padding: 14px 20px; font-size: 12.5px; line-height: 1.5;">Candidater reste gratuit pour les talents, quelle que soit votre formule.</p>',
    '<div class="bas"><sc-if value="{{sansDemande}}" hint-placeholder-val="{{ true }}"><button onClick="{{demanderPlus}}" class="bp">Demander Company Plus à Joseph</button></sc-if><sc-if value="{{demande}}" hint-placeholder-val="{{ false }}"><a href="Recruteur-conversation-joseph.dc.html" class="bs" style="width: 100%;">Demande envoyée · voir la conversation</a></sc-if></div>')
AIDE = VUE('vAide', 'Aide et contact', '<sc-for list="{{faq}}" as="f" hint-placeholder-count="4"><div class="bloc" style="padding: 0;"><button onClick="{{f.pick}}" style="width: 100%; display: flex; gap: 12px; padding: 16px 20px; align-items: center;"><b style="flex: 1; font-size: 14.5px; line-height: 1.4;">{{f.q}}</b><span style="font-size: 20px; color: #A6F26B;">{{f.sym}}</span></button>'
    '<sc-if value="{{f.ouvert}}" hint-placeholder-val="{{ false }}"><p style="padding: 0 20px 16px; font-size: 14px; line-height: 1.5; color: #C9D6D2;">{{f.r}}</p></sc-if></div></sc-for>'
    '<div class="bloc"><h3>Écrire à l’équipe Jumanly</h3><p class="meta" style="margin-bottom: 10px;">Réponse par e-mail à n.kalala@baobabfintech.cd, sous 24 h ouvrées.</p>'
    '<sc-if value="{{aideEnv}}" hint-placeholder-val="{{ false }}"><p style="padding: 12px 14px; border-radius: 14px; background: rgba(166,242,107,.1); color: #A6F26B; font-size: 14px; font-weight: 600;">Message envoyé à assistant@jumanly.io</p></sc-if>'
    '<textarea class="ta" onChange="{{ecrireAide}}" aria-label="Votre question" placeholder="Votre question">{{msgAide}}</textarea><button onClick="{{envoyerAide}}" class="bp" style="margin-top: 10px;">Envoyer</button>'
    '<p class="meta" style="margin-top: 12px; font-size: 12.5px;">Ou directement : assistant@jumanly.io</p></div>')

CORPS = '\n'.join([MENU, PROFIL, MODIF, STATS, ENREG, NOTIFS, CONFID, MODELES, LANGUE, EQUIPE, FORMULE, AIDE,
    feuille('fSortie', '<b style="display: block; font-size: 18px; margin-top: 6px;">Se déconnecter ?</b><p class="meta" style="font-size: 14px; margin-top: 6px;">Vos candidatures et messages vous attendent à la prochaine connexion.</p><a href="Recruteur-connexion.dc.html" class="bp" style="margin-top: 16px;">Se déconnecter</a><button onClick="{{fermer}}" class="annuler">Annuler</button>', style='text-align: center;'),
    feuille('fModele', '<b style="display: block; font-size: 17px;">{{modeleT}}</b><p class="meta" style="margin-top: 4px; font-size: 12.5px;">{prénom} et {offre} se remplacent à l’envoi.</p><textarea class="ta" aria-label="Texte du modèle" style="margin-top: 12px; min-height: 130px;">{{modeleTexte}}</textarea><button onClick="{{enregistrerModele}}" class="bp" style="margin-top: 14px;">Enregistrer</button><button onClick="{{fermer}}" class="annuler">Annuler</button>'),
    feuille('fInvite', '<b style="display: block; font-size: 17px;">Proposer un collègue</b><p class="meta" style="margin-top: 4px; line-height: 1.5;">Joseph Ilunga reçoit la demande et l’ajoute depuis l’administration. Il reste 1 place dans la formule Company.</p><span class="lab">E-mail professionnel</span><input class="in" value="{{invite}}" onChange="{{ecrireInvite}}" aria-label="E-mail du collègue" placeholder="prenom.nom@baobabfintech.cd"><button onClick="{{envoyerInvite}}" class="bp" style="margin-top: 14px;">Envoyer la demande</button><button onClick="{{fermer}}" class="annuler">Annuler</button>'),
    feuille('fBascule', '<b style="display: block; font-size: 17px; padding: 0 4px;">Changer de profil</b><p class="meta" style="padding: 4px 4px 8px; line-height: 1.45;">Un seul compte, trois façons de se présenter. Chaque profil garde ses messages.</p>'
      '<sc-for list="{{bascule}}" as="b" hint-placeholder-count="3"><sc-if value="{{b.bouton}}" hint-placeholder-val="{{ true }}"><button onClick="{{b.go}}" class="opt"><span class="av" style="width: 42px; height: 42px; font-size: 13px; border-radius: {{b.r}}; background: {{b.bg}}; color: {{b.fg}};">{{b.ini}}</span><span style="flex: 1;">{{b.t}}<small>{{b.s}}</small></span><b style="color: #A6F26B;">{{b.sym}}</b></button></sc-if>'
      '<sc-if value="{{b.lien}}" hint-placeholder-val="{{ false }}"><a href="{{b.href}}" class="opt"><span class="av" style="width: 42px; height: 42px; font-size: 13px; border-radius: {{b.r}}; background: {{b.bg}}; color: {{b.fg}};">{{b.ini}}</span><span style="flex: 1;">{{b.t}}<small>{{b.s}}</small></span>' + ico(I['chev'], 18, '2', '#8FA39E') + '</a></sc-if></sc-for>'
      '<button onClick="{{fermer}}" class="annuler">Annuler</button>'),
    TOAST])
REMP = {'@BACK_FIL@': BACKA('Recruteur-fil.dc.html', 'Fil'), '@CLOCHE@': CLOCHE(), '@PORTRAIT64@': PORTRAIT(64), '@PORTRAIT92@': PORTRAIT(92), '@CHECK14@': ico(I['check'], 14, '2.6'), '@CHEV@': ico(I['chev'], 18, '2', '#8FA39E'),
        '@ITEM@': ITEM_IN, '@SORTIE@': ico(I['sortie'], 20, '1.8'), '@RETOUR@': ico(I['retour'], 20, '2'), '@BACK_PROFIL@': BACK('retourProfil', 'Profil'), '@ORBI20@': ORBI(20),
        '@TOG_R@': TOGGLE('basculerRecrute', 'rFond', 'rX', 'rEtat', 'Badge Recrute en ce moment'), '@PILLS_VIS@': PILLS('visOpts', 2)}
for k, v in REMP.items():
    CORPS = CORPS.replace(k, v)
assert '@' not in CORPS.replace('@baobabfintech', '').replace('@jumanly', ''), [x for x in CORPS.split() if '@' in x][:5]
# icônes du menu : le tracé SVG vient de la logique
ICOS = {k: ico(I[k], 20, '1.8', '#B9CBC6') for k in ['oeil', 'tri', 'signet', 'bat', 'equipe', 'carte', 'cloche', 'cle', 'note', 'reglage', 'aide']}
CORPS = CORPS.replace('{{it.svg}}', ''.join(f'<sc-if value="{{{{it.i_{k}}}}}" hint-placeholder-val="{{{{ false }}}}">{v}</sc-if>' for k, v in ICOS.items()))
JS = JS.replace("go: cible.endsWith('.html') ? () => {} : aller(cible), ic }))", "go: cible.endsWith('.html') ? () => {} : aller(cible), ic, " + ', '.join(f"i_{k}: ic === '{k}'" for k in ICOS) + " }))")
PROPS = {
    'vue': {'editor': 'enum', 'options': ['menu', 'profil', 'modifier', 'stats', 'enregistres', 'notifs', 'confid', 'modeles', 'langue', 'equipe', 'formule', 'aide'], 'default': 'menu'},
    'feuille': {'editor': 'enum', 'options': ['aucune', 'sortie', 'modele', 'invite', 'bascule'], 'default': 'aucune'},
    'admin': {'editor': 'boolean', 'default': False},
}
ecrire_page('Recruteur-compte', 'Jumanly Modèle B · Recruteur · Compte', CORPS, JS, PROPS)
pages('Recruteur-compte', [
    ('Recruteur-compte-profil.dc.html', 'Compte · Mon profil recruteur', {'vue': 'profil'}),
    ('Recruteur-compte-modifier.dc.html', 'Compte · Modifier mon profil', {'vue': 'modifier'}),
    ('Recruteur-compte-stats.dc.html', 'Compte · Mes statistiques', {'vue': 'stats'}),
    ('Recruteur-compte-enregistres.dc.html', 'Compte · Publications enregistrées', {'vue': 'enregistres'}),
    ('Recruteur-equipe.dc.html', 'Compte · Équipe de recrutement', {'vue': 'equipe'}),
    ('Recruteur-equipe-proposer.dc.html', 'Équipe · Proposer un collègue', {'vue': 'equipe', 'feuille': 'invite'}),
    ('Recruteur-formule.dc.html', 'Compte · Formule Company (lecture seule)', {'vue': 'formule'}),
    ('Recruteur-parametres.dc.html', 'Compte · Modèles de messages', {'vue': 'modeles'}),
    ('Recruteur-compte-notifications.dc.html', 'Compte · Réglage des notifications', {'vue': 'notifs'}),
    ('Recruteur-compte-confidentialite.dc.html', 'Compte · Confidentialité et données', {'vue': 'confid'}),
    ('Recruteur-compte-langue.dc.html', 'Compte · Langue', {'vue': 'langue'}),
    ('Recruteur-aide.dc.html', 'Compte · Aide et contact', {'vue': 'aide'}),
    ('Recruteur-basculer.dc.html', 'Changer de profil · recruteuse', {'feuille': 'bascule'}),
    ('Recruteur-basculer-admin.dc.html', 'Changer de profil · recruteur administrateur', {'feuille': 'bascule', 'admin': 'true'}),
    ('Recruteur-deconnexion.dc.html', 'Compte · Se déconnecter', {'feuille': 'sortie'}),
], 'r_compte_pages.json')
print('ok')
