# Recruteur · Talents : découvrir (grille), recherche en deux temps, vivier, propositions, profil vu par le recruteur.
from rkit import *
JS = open(os.path.join(D, 'r_talents_logic.js')).read()

TUILE = ('<button onClick="{{x.ouvrir}}" style="display: block; border-radius: 20px; background: #13282C; border: 1px solid rgba(255,255,255,.08); overflow: hidden; text-align: left;">'
    '<span style="display: block; height: 54px; background: linear-gradient(135deg, {{x.bg}} 0%, #13282C 100%); opacity: .5;"></span>'
    '<span style="display: block; padding: 0 12px 14px; margin-top: -30px;"><span class="av" style="width: 56px; height: 56px; font-size: 17px; background: {{x.bg}}; color: {{x.fg}}; border: 3px solid #13282C;">{{x.ini}}</span>'
    '<b style="display: block; font-size: 14.5px; margin-top: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{x.nom}}</b>'
    '<span class="meta" style="display: block; font-size: 12px; line-height: 1.35; height: 32px; overflow: hidden;">{{x.titre}}</span>'
    '<span class="meta" style="display: block; font-size: 12px; margin-top: 4px;">{{x.ville}}</span>'
    '<span style="display: flex; align-items: center; gap: 6px; margin-top: 10px;"><span class="score" style="height: 26px; min-width: 44px; font-size: 12.5px; background: {{x.sbg}}; color: {{x.scol}};">{{x.sc}}</span><span class="meta" style="font-size: 11.5px; line-height: 1.2;">{{x.pour}}</span></span>'
    '<sc-if value="{{x.aProp}}" hint-placeholder-val="{{ false }}"><span style="display: block; font-size: 11.5px; font-weight: 700; color: #F4D59A; margin-top: 8px;">{{x.propT}}</span></sc-if>'
    '<sc-if value="{{x.enVivier}}" hint-placeholder-val="{{ false }}"><span style="display: block; font-size: 11.5px; font-weight: 700; color: #5FE0B8; margin-top: 8px;">Dans votre vivier</span></sc-if>'
    '</span></button>')
LIGNE_T = ('<button onClick="{{x.ouvrir}}" class="ligne"><span class="av" style="background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px;">{{x.nom}}</b>'
    '<span class="meta" style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{x.titre}}</span><span class="meta" style="display: block; font-size: 12px;">{{x.ville}} · {{x.pour}}</span></span>'
    '<span class="score" style="background: {{x.sbg}}; color: {{x.scol}};">{{x.sc}}</span></button>')

CORPS = '''
<sc-if value="{{vAccueil}}" hint-placeholder-val="{{ true }}">
<div class="scroll" style="position: absolute; inset: 0; overflow-y: auto; padding-bottom: 170px;">
<header style="padding: 54px 20px 0; display: flex; align-items: center; gap: 10px;">
<h1 style="flex: 1; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">Talents</h1>@CLOCHE@@MOI@
</header>
<sc-if value="{{sansRech}}" hint-placeholder-val="{{ true }}">
<div>
<div style="padding: 14px 20px 0;"><button onClick="{{ouvrirRech}}" class="rech" style="width: 100%;">@LOUPE@<span style="color: #6F8580; font-size: 15px;">Compétence, métier, ville</span></button></div>
<div style="margin-top: 10px;">@SEG@</div>

<sc-if value="{{sDec}}" hint-placeholder-val="{{ true }}"><div>
<div class="hrow" style="gap: 8px; padding-top: 14px;"><sc-for list="{{filtres}}" as="f" hint-placeholder-count="5"><button onClick="{{f.pick}}" class="pill" style="height: 36px; border: 1px solid {{f.bd}}; background: {{f.bg}}; color: {{f.col}};">{{f.t}}</button></sc-for></div>
<p class="meta" style="padding: 12px 20px 0;">{{nVisT}}</p>
<div class="g2" style="padding: 12px 20px 0;"><sc-for list="{{pourOffres}}" as="x" hint-placeholder-count="4">@TUILE@</sc-for></div>
<sc-if value="{{sansPourOffres}}" hint-placeholder-val="{{ false }}"><p class="meta" style="text-align: center; padding: 30px 20px;">Aucun talent visible pour cette offre pour l’instant.</p></sc-if>
<p class="meta" style="padding: 18px 20px; font-size: 12px; line-height: 1.5;">Seulement les talents qui ont rendu leur profil visible. Ceux qui ont candidaté sont dans Candidatures.</p>
</div></sc-if>

<sc-if value="{{sRes}}" hint-placeholder-val="{{ false }}"><div>
<sc-if value="{{aInvit}}" hint-placeholder-val="{{ true }}"><div><p class="meta" style="padding: 16px 20px 2px; font-weight: 700;">Invitations reçues</p>
<sc-for list="{{invitations}}" as="x" hint-placeholder-count="2"><div class="ligne"><a href="{{x.href}}" style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; color: #F2EDE5;"><span class="av" style="background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px;">{{x.nom}}</b><span class="meta" style="display: block; font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{x.s}}</span><span class="meta" style="display: block; font-size: 11.5px;">{{x.type}} · {{x.commun}}</span></span></a><span style="display: flex; gap: 6px; flex: none;"><button onClick="{{x.ignorer}}" aria-label="Ignorer {{x.nom}}" class="rond" style="width: 36px; height: 36px; border: 1px solid rgba(255,255,255,.22); color: #B9CBC6;">@CROIX@</button><button onClick="{{x.accepter}}" style="height: 36px; padding: 0 14px; border-radius: 18px; background: #A6F26B; color: #0B1A1F; font-size: 13px; font-weight: 700;">Accepter</button></span></div></sc-for></div></sc-if>
<p class="meta" style="padding: 18px 20px 2px; font-weight: 700;">À connaître</p>
<div class="hrow" style="gap: 10px; padding-top: 8px;"><sc-for list="{{suggestionsR}}" as="x" hint-placeholder-count="3"><div style="width: 160px; padding: 14px; border-radius: 20px; background: #13282C; border: 1px solid rgba(255,255,255,.08); text-align: center;">
<a href="{{x.href}}" style="display: block; color: #F2EDE5;"><span class="av" style="width: 56px; height: 56px; margin: 0 auto; font-size: 17px; background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span><b style="display: block; font-size: 14px; margin-top: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{x.nom}}</b><span class="meta" style="display: block; font-size: 11.5px; height: 30px; overflow: hidden; line-height: 1.3;">{{x.s}}</span><span style="display: block; font-size: 11px; font-weight: 700; color: #5FE0B8; margin-top: 4px;">{{x.type}}</span></a>
<button onClick="{{x.connecter}}" style="width: 100%; height: 34px; margin-top: 10px; border-radius: 17px; border: 1px solid {{x.bbd}}; background: {{x.bbg}}; color: {{x.bcol}}; font-size: 12.5px; font-weight: 700; text-align: center;">{{x.bt}}</button></div></sc-for></div>
<div style="display: flex; align-items: baseline; justify-content: space-between; padding: 22px 20px 10px;"><b style="font-size: 16px;">Mes relations</b><span class="meta">{{nRelT}}</span></div>
<div style="padding: 0 20px 4px;">@PILLS_RF@</div>
<sc-for list="{{relationsF}}" as="x" hint-placeholder-count="3"><div class="ligne"><a href="{{x.href}}" style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; color: #F2EDE5;"><span class="av" style="background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px;">{{x.nom}}</b><span class="meta" style="display: block; font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{x.s}}</span><span class="meta" style="display: block; font-size: 11.5px;">{{x.type}} · {{x.commun}}</span></span></a><a href="{{x.msgHref}}" aria-label="Écrire à {{x.nom}}" class="rond" style="width: 40px; height: 40px; background: #13282C; color: #F2EDE5;">@BULLE@</a></div></sc-for>
<p class="meta" style="padding: 16px 20px; font-size: 12.5px; line-height: 1.5;">Une relation peut vous écrire et voir vos publications. Elle ne voit pas vos candidats ni votre vivier.</p>
</div></sc-if>
<sc-if value="{{sViv}}" hint-placeholder-val="{{ false }}"><div style="padding: 16px 20px 0; display: flex; flex-direction: column; gap: 10px;">
<sc-for list="{{vivierL}}" as="l" hint-placeholder-count="3"><button onClick="{{l.ouvrir}}" class="carte" style="display: flex; align-items: center; gap: 14px;">
<span style="display: flex; flex: none; width: 74px;"><sc-for list="{{l.avs}}" as="a" hint-placeholder-count="3"><span class="av" style="width: 36px; height: 36px; font-size: 12px; margin-right: -14px; border: 2px solid #13282C; background: {{a.bg}}; color: {{a.fg}};">{{a.ini}}</span></sc-for></span>
<span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px;">{{l.t}}</b><span class="meta">{{l.n}}</span></span>@CHEV@</button></sc-for>
<button onClick="{{nouvelleListe}}" style="height: 52px; border-radius: 20px; border: 1.5px dashed rgba(255,255,255,.22); font-size: 14px; font-weight: 700; color: #A6F26B; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">@PLUS@Nouvelle liste</button>
<p class="meta" style="line-height: 1.5; font-size: 12.5px; margin-top: 6px;">Votre vivier personnel : les talents ne savent pas dans quelle liste ils sont. Le vivier partagé avec l’équipe vient avec Company Plus.</p>
</div></sc-if>

<sc-if value="{{sProp}}" hint-placeholder-val="{{ false }}"><div>
<p class="meta" style="padding: 16px 20px 4px;">Les offres que vous avez proposées à des talents</p>
<sc-for list="{{propsL}}" as="x" hint-placeholder-count="2"><button onClick="{{x.ouvrir}}" class="ligne"><span class="av" style="background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px;">{{x.nom}}</b><span class="meta" style="display: block;">{{x.offre}} · {{x.d}}</span><span style="display: block; font-size: 12.5px; font-weight: 700; color: {{x.ecol}};">{{x.etat}}</span></span>@CHEV@</button></sc-for>
<p class="meta" style="padding: 16px 20px; line-height: 1.5; font-size: 12.5px;">Quand un talent accepte, sa candidature arrive dans Candidatures, comme les autres. Candidater reste gratuit pour lui.</p>
</div></sc-if>
</div>
</sc-if>

<sc-if value="{{aRech}}" hint-placeholder-val="{{ false }}">
<div>
<div style="padding: 14px 20px 0; display: flex; align-items: center; gap: 10px;">
<label class="rech" style="border: 1px solid rgba(166,242,107,.35);">@LOUPE@<input value="{{q}}" onChange="{{chercher}}" aria-label="Rechercher un talent" placeholder="Compétence, métier, ville">
<sc-if value="{{aQ}}" hint-placeholder-val="{{ false }}"><button onClick="{{viderQ}}" aria-label="Effacer" style="width: 30px; height: 30px; color: #9FB3AE; font-size: 18px; text-align: center;">×</button></sc-if></label>
<button onClick="{{annulerRech}}" style="height: 44px; font-size: 14px; font-weight: 600; color: #A6F26B; flex: none;">Annuler</button></div>
<p class="meta" style="padding: 18px 20px 10px;">Chercher par</p><div style="padding: 0 20px;">@PILLS_RT@</div>
<sc-if value="{{qVide}}" hint-placeholder-val="{{ true }}"><div>
<p class="meta" style="padding: 22px 20px 4px;">Recherches récentes</p>
<sc-for list="{{recents}}" as="r" hint-placeholder-count="3"><button onClick="{{r.pick}}" style="width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 20px; font-size: 15px;">@HORL@<span style="flex: 1;">{{r.t}}</span><span class="meta">{{r.d}}</span></button></sc-for>
<p class="meta" style="padding: 18px 20px 4px; display: flex; align-items: center; gap: 8px;">@ORBI18@Suggéré par Orbi</p>
<sc-for list="{{suggestions}}" as="r" hint-placeholder-count="2"><button onClick="{{r.pick}}" style="width: 100%; display: flex; flex-direction: column; padding: 10px 20px;"><b style="font-size: 15px;">{{r.t}}</b><span class="meta">{{r.d}}</span></button></sc-for>
</div></sc-if>
<sc-if value="{{qPlein}}" hint-placeholder-val="{{ false }}"><div><p class="meta" style="padding: 18px 20px 4px;">{{nRes}}</p><sc-for list="{{resRech}}" as="x" hint-placeholder-count="3">@LIGNE_T@</sc-for>
<sc-if value="{{rRien}}" hint-placeholder-val="{{ false }}"><p class="meta" style="text-align: center; padding: 30px 20px;">Aucun talent visible pour « {{q}} ».</p></sc-if></div></sc-if>
</div>
</sc-if>
</div>
@NAV@
</sc-if>

<!-- Liste du vivier -->
<sc-if value="{{vListe}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<header class="barreh">@BACK_LISTE@<span style="flex: 1;"></span></header>
<div class="scroll" style="flex: 1; overflow-y: auto; padding-bottom: 40px;">
<div style="padding: 18px 20px 6px;"><h1 style="font-size: 23px;">{{listeT}}</h1><p class="meta" style="margin-top: 4px;">{{listeN}} · visible par vous seule</p></div>
<sc-for list="{{membres}}" as="x" hint-placeholder-count="3">@LIGNE_T@</sc-for>
</div></div>
</sc-if>

<!-- Profil vu par le recruteur -->
<sc-if value="{{vProfil}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<div class="scroll" style="flex: 1; overflow-y: auto; padding-bottom: 120px;">
<div style="height: 150px; background: linear-gradient(160deg, {{profil.bg}} 0%, #0F3F37 70%); position: relative;">
<div style="position: absolute; left: 12px; right: 12px; top: 50px; display: flex; justify-content: space-between;">
<button onClick="{{retourProfil}}" class="rond" aria-label="Retour" style="background: rgba(11,26,31,.55);">@RETOUR@</button>
<button onClick="{{ouvrirMenuP}}" class="rond" aria-label="Plus d’options" style="background: rgba(11,26,31,.55); color: #F2EDE5; font-size: 18px;">···</button></div></div>
<div style="padding: 0 20px; margin-top: -44px; position: relative;">
<span class="av" style="width: 88px; height: 88px; font-size: 26px; background: {{profil.bg}}; color: {{profil.fg}}; border: 4px solid #0B1A1F;">{{profil.ini}}</span>
<div style="display: flex; align-items: center; gap: 8px; margin-top: 10px;"><h1 style="font-size: 23px;">{{profil.nom}}</h1><sc-if value="{{profil.aCap}}" hint-placeholder-val="{{ true }}"><span style="font-size: 11px; font-weight: 800; padding: 3px 7px; border-radius: 6px; background: #A6F26B; color: #0B1A1F;">CAP</span></sc-if></div>
<p style="font-size: 15px; color: #C9D6D2; margin-top: 2px;">{{profil.titre}}</p>
<p class="meta" style="margin-top: 4px;">{{profil.ville}} · actif {{profil.actif}}</p>
<sc-if value="{{profil.aMobile}}" hint-placeholder-val="{{ true }}"><p style="font-size: 13px; color: #5FE0B8; margin-top: 4px; font-weight: 600;">{{profil.mobile}}</p></sc-if>
</div>
<div style="display: flex; gap: 8px; padding: 14px 20px 0;"><button onClick="{{profilRel.connecter}}" style="flex: 1; height: 42px; border-radius: 21px; border: 1px solid {{profilRel.bbd}}; background: {{profilRel.bbg}}; color: {{profilRel.bcol}}; font-size: 14px; font-weight: 700; text-align: center;">{{profilRel.bt}}</button><sc-if value="{{estRelation}}" hint-placeholder-val="{{ false }}"><a href="{{msgHrefP}}" class="bs" style="height: 42px; flex: 1;">Écrire</a></sc-if></div>
<button onClick="{{ouvrirPourquoi}}" style="margin: 12px 20px 0; width: calc(100% - 40px); padding: 14px; border-radius: 18px; background: #13282C; display: flex; align-items: center; gap: 12px;">
<span class="score" style="height: 40px; min-width: 62px; font-size: 16px; background: {{profil.sbg}}; color: {{profil.scol}};">{{profil.sc}}</span>
<span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 14px;">{{profil.bandeT}}</b><span class="meta" style="display: block; font-size: 12px;">avec {{profil.pour}}</span></span><span style="font-size: 13px; font-weight: 700; color: #5FE0B8;">Pourquoi ?</span></button>
<sc-if value="{{profil.aProp}}" hint-placeholder-val="{{ false }}"><p style="margin: 10px 20px 0; padding: 10px 14px; border-radius: 14px; background: rgba(244,213,154,.1); color: #F4D59A; font-size: 13px; font-weight: 600;">{{profil.propT}}</p></sc-if>
<div style="margin-top: 14px;">@SEG_P@</div>
<sc-if value="{{oProfil}}" hint-placeholder-val="{{ true }}"><div>
<div class="bloc"><h3>Compétences</h3><sc-for list="{{profil.comp}}" as="r" hint-placeholder-count="3"><div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14.5px;"><span>{{r.t}}</span><span style="font-size: 12.5px; font-weight: 700; color: {{r.vc}};">{{r.v}}</span></div></sc-for></div>
<div class="bloc"><h3>Ce qui l’intéresse</h3><div style="display: flex; flex-wrap: wrap; gap: 6px;"><sc-for list="{{profil.interets}}" as="t" hint-placeholder-count="3"><span class="tag">{{t.t}}</span></sc-for></div></div>
<div class="bloc"><h3>Langues</h3><p style="font-size: 14.5px;">{{profil.langues}}</p></div>
</div></sc-if>
<sc-if value="{{oParcours}}" hint-placeholder-val="{{ false }}"><div>
<div class="bloc"><h3>Expérience</h3><sc-for list="{{profil.exp}}" as="r" hint-placeholder-count="2"><div style="padding: 6px 0;"><b style="display: block; font-size: 14.5px;">{{r.t}}</b><span class="meta">{{r.d}}</span></div></sc-for></div>
<div class="bloc"><h3>Formation</h3><p style="font-size: 14.5px; line-height: 1.45;">{{profil.form}}</p></div>
</div></sc-if>
<sc-if value="{{oReals}}" hint-placeholder-val="{{ false }}"><div style="padding: 16px 20px 0; display: flex; flex-direction: column; gap: 10px;">
<sc-for list="{{profil.reals}}" as="r" hint-placeholder-count="2"><div style="padding: 16px; border-radius: 18px; background: #F2EDE5; color: #0B1A1F;"><b style="display: block; font-size: 15px;">{{r.t}}</b><span style="font-size: 13px; color: #4A5A56;">{{r.d}}</span></div></sc-for>
</div></sc-if>
<p class="meta" style="padding: 16px 20px; font-size: 12px; line-height: 1.5;">Consultation enregistrée : la personne voit que Baobab Fintech a consulté son profil. Le score n’utilise ni le nom, ni l’âge, ni la photo.</p>
</div>
<div class="bas">
<button onClick="{{ouvrirVivier}}" class="bs" aria-label="{{profil.vivierT}}" style="width: 52px; padding: 0; flex: none; color: {{vivCol}};">@SIGNET@</button>
<button onClick="{{ouvrirProposer}}" class="bp" style="flex: 1; width: auto;">Proposer une offre</button>
</div>
</div>
</sc-if>

@FAB@

<!-- Feuilles -->
@F_POURQUOI@
@F_PROPOSER@
@F_PROPENV@
@F_VIVIER@
@F_MENUP@
@F_CREER@
@ORBI_SHEET@
@TOAST@
'''
F = {}
F['@F_POURQUOI@'] = feuille('fPourquoi', '<div style="display: flex; align-items: center; gap: 12px;"><span class="score" style="height: 40px; min-width: 64px; font-size: 17px; background: {{profil.sbg}}; color: {{profil.scol}};">{{profil.sc}}</span><span><b style="display: block; font-size: 17px;">Pourquoi {{profil.sc}} ?</b><span class="meta">Avec {{profil.pour}} · calcul fixe</span></span></div>'
    '<div style="margin-top: 14px;"><sc-for list="{{profil.criteres}}" as="r" hint-placeholder-count="8"><div style="padding: 7px 0;"><span style="display: flex; justify-content: space-between; font-size: 13.5px;"><span>{{r.t}}</span><span class="meta" style="font-size: 12.5px;">{{r.pts}}</span></span><span style="display: block; height: 6px; border-radius: 3px; background: rgba(255,255,255,.08); margin-top: 5px; overflow: hidden;"><span style="display: block; height: 100%; width: {{r.larg}}; background: {{r.col}};"></span></span></div></sc-for></div>'
    '<p class="meta" style="margin-top: 12px; line-height: 1.5; font-size: 12.5px;">Jamais utilisés : nom, genre, âge, photo, nationalité, origine, religion, situation familiale, santé, handicap, adresse précise.</p><button onClick="{{fermer}}" class="annuler">Fermer</button>')
F['@F_PROPOSER@'] = feuille('fProposer', '<b style="display: block; font-size: 17px;">Proposer une offre à {{profil.nom}}</b><p class="meta" style="margin-top: 4px;">La personne choisit de candidater ou non.</p>'
    '<span class="lab">Offre</span><div style="display: flex; flex-direction: column; gap: 8px;"><sc-for list="{{offresProp}}" as="v" hint-placeholder-count="3"><button onClick="{{v.pick}}" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 16px; border: 1.5px solid {{v.bd}}; background: {{v.bg}};"><span style="width: 18px; height: 18px; border-radius: 50%; border: 2px solid {{v.rb}}; background: {{v.rbg}}; flex: none;"></span><span style="flex: 1;"><b style="display: block; font-size: 14px;">{{v.t}}</b><span class="meta" style="font-size: 12px;">{{v.s}}</span></span></button></sc-for></div>'
    '<span class="lab">Message</span><textarea class="ta" onChange="{{ecrireMsgProp}}" aria-label="Message de la proposition" style="min-height: 110px;">{{msgProp}}</textarea>'
    '<button onClick="{{envoyerProp}}" class="bp" style="margin-top: 14px;">Envoyer la proposition</button><button onClick="{{fermer}}" class="annuler">Annuler</button>')
F['@F_PROPENV@'] = feuille('fPropEnvoyee', '<span style="width: 64px; height: 64px; border-radius: 50%; background: #A6F26B; color: #0B1A1F; display: flex; align-items: center; justify-content: center; margin: 6px auto 0;">' + ico(I['check'], 30, '2.6') + '</span>'
    '<b style="display: block; font-size: 18px; margin-top: 14px;">Proposition envoyée</b><p class="meta" style="font-size: 14px; margin-top: 6px; line-height: 1.5;">{{profil.nom}} la reçoit dans ses messages. Vous serez prévenue dès sa réponse.</p>'
    '<a href="Recruteur-talents-propositions.dc.html" class="bp" style="margin-top: 16px;">Suivre mes propositions</a><button onClick="{{fermer}}" class="annuler">Rester sur le profil</button>', style='text-align: center;')
F['@F_VIVIER@'] = feuille('fVivier', '<b style="display: block; font-size: 17px; padding: 0 4px 6px;">Ajouter {{profil.nom}} au vivier</b>'
    '<sc-for list="{{listesChoix}}" as="o" hint-placeholder-count="3"><button onClick="{{o.pick}}" class="opt"><span class="case" style="background: {{o.bg}}; border-color: {{o.bd}};">{{o.sym}}</span><span style="flex: 1;">{{o.t}}<small>{{o.n}}</small></span></button></sc-for>'
    '<span class="lab">Ou une nouvelle liste</span><input class="in" value="{{nouvelleL}}" onChange="{{ecrireNouvelleL}}" aria-label="Nom de la nouvelle liste" placeholder="Ex. : Finance 2027">'
    '<button onClick="{{enregistrerVivier}}" class="bp" style="margin-top: 14px;">Enregistrer</button><button onClick="{{fermer}}" class="annuler">Annuler</button>')
F['@F_MENUP@'] = feuille('fMenuP', '<sc-for list="{{menuP}}" as="m" hint-placeholder-count="4"><button onClick="{{m.go}}" class="opt"><span>{{m.t}}<small>{{m.s}}</small></span></button></sc-for><button onClick="{{fermer}}" class="annuler">Annuler</button>')
F['@F_CREER@'] = feuille('fCreerListe', '<b style="display: block; font-size: 17px;">Nouvelle liste</b><span class="lab">Nom</span><input class="in" value="{{nomListe}}" onChange="{{ecrireNomListe}}" aria-label="Nom de la liste" placeholder="Ex. : Profils finance">'
    '<button onClick="{{creerListe}}" class="bp" style="margin-top: 14px;">Créer la liste</button><button onClick="{{fermer}}" class="annuler">Annuler</button>')

REMP = {'@CLOCHE@': CLOCHE(), '@MOI@': MOI(), '@LOUPE@': LOUPE, '@SEG@': SEG('sousOnglets', 4), '@SEG_P@': SEG('ongletsP', 3), '@PILLS_RT@': PILLS('rTypes'), '@PILLS_RF@': PILLS('relFiltres', 3), '@CROIX@': ico(I['croix'], 16, '2'), '@BULLE@': ico(I['bulle'], 18, '1.8'),
        '@TUILE@': TUILE, '@LIGNE_T@': LIGNE_T, '@CHEV@': ico(I['chev'], 18, '2', '#8FA39E'), '@PLUS@': ico(I['plus'], 18, '2'), '@HORL@': ico(I['horl'], 20, '1.8', '#8FA39E'),
        '@ORBI18@': ORBI(18), '@RETOUR@': ico(I['retour'], 20, '2'), '@SIGNET@': ico(I['signet'], 22, '1.8'), '@BACK_LISTE@': BACK('retourListe', 'Vivier'),
        '@NAV@': nav('talents'), '@FAB@': FAB(), '@ORBI_SHEET@': ORBI_SHEET, '@TOAST@': TOAST, **F}
C2 = CORPS
for k, v in REMP.items():
    C2 = C2.replace(k, v)
assert '@' not in C2, [x for x in C2.split() if '@' in x][:5]
JS = JS.replace("fab: vue === 'accueil' && !rech", "vivCol: profil.enVivier ? '#A6F26B' : '#F2EDE5', fab: vue === 'accueil' && !rech")

PROPS = {
    'vue': {'editor': 'enum', 'options': ['accueil', 'profil', 'liste'], 'default': 'accueil'},
    'sous': {'editor': 'enum', 'options': ['decouvrir', 'vivier', 'propositions', 'reseau'], 'default': 'decouvrir'},
    'talent': {'editor': 'enum', 'options': ['rachel', 'cedric', 'nathalie', 'joel', 'prince', 'gloria'], 'default': 'rachel'},
    'ongletP': {'editor': 'enum', 'options': ['profil', 'parcours', 'realisations'], 'default': 'profil'},
    'liste': {'editor': 'enum', 'options': ['data', 'managers', 'mobile'], 'default': 'data'},
    'feuille': {'editor': 'enum', 'options': ['aucune', 'pourquoi', 'proposer', 'propEnvoyee', 'vivier', 'menuP', 'creerListe'], 'default': 'aucune'},
    'recherche': {'editor': 'enum', 'options': ['', 'options', 'texte'], 'default': ''},
    'orbi': {'editor': 'boolean', 'default': False}, 'orbiRep': {'editor': 'enum', 'options': ['aucune', 'qui', 'relance', 'visibilite'], 'default': 'aucune'},
}
ecrire_page('Recruteur-talents', 'Jumanly Modèle B · Recruteur · Talents', C2, JS, PROPS)
N = 'Recruteur-talents'
pages(N, [
    ('Recruteur-talents-recherche.dc.html', 'Talents · Rechercher : les options', {'recherche': 'options'}),
    ('Recruteur-talents-recherche-texte.dc.html', 'Talents · Recherche « sql »', {'recherche': 'texte'}),
    ('Recruteur-talents-vivier.dc.html', 'Talents · Vivier', {'sous': 'vivier'}),
    ('Recruteur-talents-liste.dc.html', 'Talents · Une liste du vivier', {'vue': 'liste', 'liste': 'data'}),
    ('Recruteur-talents-reseau.dc.html', 'Talents · Réseau : invitations, à connaître, relations', {'sous': 'reseau'}),
    ('Recruteur-talents-propositions.dc.html', 'Talents · Propositions envoyées', {'sous': 'propositions'}),
    ('Recruteur-talent.dc.html', 'Profil talent vu par le recruteur', {'vue': 'profil', 'talent': 'rachel'}),
    ('Recruteur-talent-pourquoi.dc.html', 'Profil talent · Pourquoi ce score', {'vue': 'profil', 'talent': 'rachel', 'feuille': 'pourquoi'}),
    ('Recruteur-talent-parcours.dc.html', 'Profil talent · Parcours', {'vue': 'profil', 'talent': 'rachel', 'ongletP': 'parcours'}),
    ('Recruteur-talent-realisations.dc.html', 'Profil talent · Réalisations', {'vue': 'profil', 'talent': 'rachel', 'ongletP': 'realisations'}),
    ('Recruteur-talent-proposer.dc.html', 'Proposer une offre à un talent', {'vue': 'profil', 'talent': 'rachel', 'feuille': 'proposer'}),
    ('Recruteur-talent-vivier.dc.html', 'Ajouter au vivier', {'vue': 'profil', 'talent': 'cedric', 'feuille': 'vivier'}),
    ('Recruteur-talent-menu.dc.html', 'Profil talent · Menu ···', {'vue': 'profil', 'talent': 'rachel', 'feuille': 'menuP'}),
    ('Recruteur-talent-cedric.dc.html', 'Profil talent · Cédric', {'vue': 'profil', 'talent': 'cedric'}),
    ('Recruteur-talent-nathalie.dc.html', 'Profil talent · Nathalie', {'vue': 'profil', 'talent': 'nathalie'}),
    ('Recruteur-talent-gloria.dc.html', 'Profil talent · Gloria (proposition vue)', {'vue': 'profil', 'talent': 'gloria'}),
    ('Recruteur-talent-joel.dc.html', 'Profil talent · Joël (proposition acceptée)', {'vue': 'profil', 'talent': 'joel'}),
    ('Recruteur-talents-orbi.dc.html', 'Orbi · qui proposer', {'orbi': 'true', 'orbiRep': 'qui'}),
], 'r_talents_pages.json')
print('ok')
