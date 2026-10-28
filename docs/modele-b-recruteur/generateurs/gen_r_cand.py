# Recruteur · Candidatures (ATS) : fort potentiel, toutes par étape, entretiens, décisions, fiche, planifier, évaluer, proposer, diagnostic des CV.
from rkit import *
JS = open(os.path.join(D, 'r_cand_logic.js')).read()

SCORE = '<span class="score" style="background: {{x.sbg}}; color: {{x.scol}};">{{x.score}}</span>'
CARTE_FORT = ('<div class="carte" style="padding: 0; overflow: hidden;">'
    '<button onClick="{{x.ouvrir}}" style="display: block; width: 100%; padding: 16px 16px 12px;">'
    '<span style="display: flex; align-items: center; gap: 12px;"><span class="av" style="background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span>'
    '<span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15.5px;">{{x.nom}}</b><span class="meta" style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{x.offre}} · {{x.et}}</span></span>' + SCORE + '</span>'
    '<span style="display: block; margin-top: 12px;"><sc-for list="{{x.raisons}}" as="r" hint-placeholder-count="3"><span class="li" style="font-size: 13.5px; padding: 2px 0;"><i></i>{{r.t}}</span></sc-for></span>'
    '<span style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px;"><span class="meta" style="font-size: 12px; width: 100%;">Ce qui l’intéresse</span><sc-for list="{{x.interets}}" as="t" hint-placeholder-count="3"><span class="tag">{{t.t}}</span></sc-for></span></button>'
    '<span style="display: flex; align-items: center; gap: 8px; padding: 10px 16px 14px; border-top: 1px solid rgba(255,255,255,.06);"><span class="meta" style="flex: 1; font-size: 12.5px;">{{x.dispo}} · {{x.assigneT}}</span>'
    '<sc-if value="{{x.aPresel}}" hint-placeholder-val="{{ true }}"><button onClick="{{x.preselectionner}}" style="height: 34px; padding: 0 12px; border-radius: 17px; background: #A6F26B; color: #0B1A1F; font-size: 12.5px; font-weight: 700;">Présélectionner</button></sc-if>'
    '<button onClick="{{x.ouvrir}}" style="height: 34px; padding: 0 12px; border-radius: 17px; border: 1px solid rgba(255,255,255,.2); font-size: 12.5px; font-weight: 700;">Ouvrir</button></span></div>')
LIGNE_C = ('<div class="ligne" style="padding: 12px 20px;">'
    '<sc-if value="{{selMode}}" hint-placeholder-val="{{ false }}"><button onClick="{{x.basculer}}" aria-label="Sélectionner {{x.nom}}" class="case" style="background: {{x.caseBg}}; border-color: {{x.caseBd}};">{{x.case}}</button></sc-if>'
    '<button onClick="{{x.ouvrir}}" style="flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px;"><span class="av" style="background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span>'
    '<span style="flex: 1; min-width: 0;"><span style="display: flex; align-items: center; gap: 6px;"><b style="font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{x.nom}}</b><sc-if value="{{x.nouv}}" hint-placeholder-val="{{ false }}"><span style="width: 7px; height: 7px; border-radius: 50%; background: #A6F26B; flex: none;"></span></sc-if></span>'
    '<span class="meta" style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{x.titre}}</span><span class="meta" style="display: block; font-size: 12px;">{{x.offre}} · {{x.recu}}</span></span>' + SCORE + '</button></div>')

CORPS = '''
<!-- ============ LISTE ============ -->
<sc-if value="{{vListe}}" hint-placeholder-val="{{ true }}">
<div class="scroll" style="position: absolute; inset: 0; overflow-y: auto; padding-bottom: 180px;">
<header style="padding: 54px 20px 0; display: flex; align-items: center; gap: 10px;">
<h1 style="flex: 1; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">Candidatures</h1>
<sc-if value="{{sansRech}}" hint-placeholder-val="{{ true }}"><button onClick="{{ouvrirRech}}" class="rond" aria-label="Rechercher un candidat" style="background: #1A2629;">@LOUPE@</button></sc-if>
@MOI@
</header>

<sc-if value="{{aRech}}" hint-placeholder-val="{{ false }}">
<div>
<div style="padding: 14px 20px 0; display: flex; align-items: center; gap: 10px;">
<label class="rech" style="border: 1px solid rgba(166,242,107,.35);">@LOUPE@<input value="{{q}}" onChange="{{chercher}}" aria-label="Rechercher un candidat" placeholder="Nom, compétence, ville">
<sc-if value="{{aQ}}" hint-placeholder-val="{{ false }}"><button onClick="{{viderQ}}" aria-label="Effacer" style="width: 30px; height: 30px; color: #9FB3AE; font-size: 18px; text-align: center;">×</button></sc-if></label>
<button onClick="{{annulerRech}}" style="height: 44px; font-size: 14px; font-weight: 600; color: #A6F26B; flex: none;">Annuler</button></div>
<p class="meta" style="padding: 18px 20px 10px;">Chercher par</p>
<div style="padding: 0 20px;">@PILLS_RT@</div>
<sc-if value="{{qVide}}" hint-placeholder-val="{{ true }}"><div><p class="meta" style="padding: 22px 20px 4px;">Recherches récentes</p>
<sc-for list="{{recents}}" as="r" hint-placeholder-count="3"><button onClick="{{r.pick}}" style="width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 20px; font-size: 15px;">@HORL@<span style="flex: 1;">{{r.t}}</span><span class="meta">{{r.d}}</span></button></sc-for>
<p class="meta" style="line-height: 1.5; padding: 22px 20px;">Seulement les personnes qui ont candidaté à vos offres.</p></div></sc-if>
<sc-if value="{{qPlein}}" hint-placeholder-val="{{ false }}"><div><p class="meta" style="padding: 18px 20px 4px;">{{nRes}}</p><sc-for list="{{resRech}}" as="x" hint-placeholder-count="3">@LIGNE_C@</sc-for>
<sc-if value="{{rRien}}" hint-placeholder-val="{{ false }}"><p class="meta" style="text-align: center; padding: 30px 20px;">Personne pour « {{q}} ».</p></sc-if></div></sc-if>
</div>
</sc-if>

<sc-if value="{{sansRech}}" hint-placeholder-val="{{ true }}">
<div>
<p class="meta" style="padding: 6px 20px 0;">{{resume}}</p>
<div class="hrow" style="gap: 8px; padding-top: 14px;"><sc-for list="{{offresF}}" as="f" hint-placeholder-count="5"><button onClick="{{f.pick}}" class="pill" style="height: 36px; border: 1px solid {{f.bd}}; background: {{f.bg}}; color: {{f.col}};">{{f.t}}</button></sc-for></div>
<div style="margin-top: 8px;">@SEG@</div>

<!-- Fort potentiel -->
<sc-if value="{{sFort}}" hint-placeholder-val="{{ true }}">
<div style="padding: 16px 20px 0; display: flex; flex-direction: column; gap: 12px;">
<button onClick="{{ouvrirDiag}}" style="width: 100%; padding: 14px; border-radius: 18px; background: rgba(47,211,166,.08); border: 1px solid rgba(47,211,166,.28); display: flex; gap: 12px; align-items: center;">@ORBI34@<span style="flex: 1;"><b style="display: block; font-size: 14.5px;">{{diagT}}</b><span class="meta" style="color: #9FD9C6;">Diagnostic de tous les CV, critère par critère</span></span>@CHEV@</button>
<p class="meta">{{nFortT}} · classés par score, jamais écartés</p>
<sc-for list="{{fort}}" as="x" hint-placeholder-count="3">@CARTE_FORT@</sc-for>
<sc-if value="{{sansFort}}" hint-placeholder-val="{{ false }}"><p class="meta" style="text-align: center; padding: 20px 0;">Aucun profil à 80 % pour ce filtre. Regardez « Toutes ».</p></sc-if>
</div>
</sc-if>

<!-- Toutes, par étape -->
<sc-if value="{{sToutes}}" hint-placeholder-val="{{ false }}">
<div>
<div class="hrow" style="gap: 8px; padding-top: 14px;"><sc-for list="{{etapesF}}" as="e" hint-placeholder-count="6"><button onClick="{{e.pick}}" style="height: 56px; min-width: 92px; padding: 0 12px; border-radius: 16px; background: {{e.bg}}; color: {{e.col}}; text-align: left;"><b style="display: block; font-size: 17px; color: {{e.ncol}};">{{e.n}}</b><span style="font-size: 12px; font-weight: 600;">{{e.t}}</span></button></sc-for></div>
<div style="display: flex; align-items: center; gap: 10px; padding: 12px 20px 4px;">
<button onClick="{{basculerTri}}" style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #B9CBC6; min-height: 36px;">@TRI@{{triT}}</button><span style="flex: 1;"></span>
<sc-if value="{{sansSel}}" hint-placeholder-val="{{ true }}"><button onClick="{{entrerSel}}" style="font-size: 13.5px; font-weight: 700; color: #A6F26B; min-height: 36px;">Sélectionner</button></sc-if>
<sc-if value="{{selMode}}" hint-placeholder-val="{{ false }}"><span style="display: flex; gap: 14px;"><button onClick="{{toutSel}}" style="font-size: 13.5px; font-weight: 700; color: #F2EDE5; min-height: 36px;">Tout</button><button onClick="{{sortirSel}}" style="font-size: 13.5px; font-weight: 700; color: #A6F26B; min-height: 36px;">Terminer</button></span></sc-if>
</div>
<sc-for list="{{dansEtape}}" as="x" hint-placeholder-count="5">@LIGNE_C@</sc-for>
<sc-if value="{{etapeVide}}" hint-placeholder-val="{{ false }}"><p class="meta" style="text-align: center; padding: 30px 20px;">Personne à cette étape.</p></sc-if>
<sc-if value="{{aPlus}}" hint-placeholder-val="{{ false }}"><button onClick="{{plus}}" style="display: block; margin: 14px auto 0; height: 44px; padding: 0 20px; border-radius: 22px; background: #1B3338; font-size: 14px; font-weight: 700;">{{plusT}}</button></sc-if>
</div>
</sc-if>

<!-- Entretiens -->
<sc-if value="{{sEnt}}" hint-placeholder-val="{{ false }}">
<div>
<div class="hrow" style="gap: 8px; padding-top: 14px;"><sc-for list="{{entOnglets}}" as="f" hint-placeholder-count="4"><button onClick="{{f.pick}}" class="pill" style="height: 36px; border: 1px solid {{f.bd}}; background: {{f.bg}}; color: {{f.col}};">{{f.t}} · {{f.n}}</button></sc-for></div>
<div style="padding: 14px 20px 0; display: flex; flex-direction: column; gap: 12px;">
<sc-for list="{{entListe}}" as="x" hint-placeholder-count="2"><div class="carte">
<button onClick="{{x.ouvrir}}" style="width: 100%; display: flex; align-items: center; gap: 12px;"><span style="width: 58px; flex: none; text-align: center; border-radius: 14px; background: #0B1A1F; padding: 8px 0;"><b style="display: block; font-size: 15px;">{{x.h}}</b><span class="meta" style="font-size: 11px;">{{x.mode}}</span></span>
<span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px;">{{x.nom}}</b><span class="meta" style="display: block;">{{x.j}} · {{x.offre}}</span><span class="meta" style="display: block; font-size: 12px;">Avec {{x.avec}}</span></span>@SCOREX@</button>
<div style="display: flex; gap: 8px; margin-top: 12px;">
<sc-if value="{{x.aVenir}}" hint-placeholder-val="{{ true }}"><button onClick="{{x.rejoindre}}" class="bp" style="height: 42px; font-size: 13.5px; flex: 1;">Rejoindre</button></sc-if>
<sc-if value="{{x.aDoc}}" hint-placeholder-val="{{ false }}"><button onClick="{{x.documenter}}" class="bp" style="height: 42px; font-size: 13.5px; flex: 1;">Documenter l’entretien</button></sc-if>
<sc-if value="{{x.aFait}}" hint-placeholder-val="{{ false }}"><button onClick="{{x.documenter}}" class="bs" style="height: 42px; font-size: 13.5px; flex: 1;">Voir l’évaluation</button></sc-if>
<button onClick="{{x.ouvrir}}" class="bs" style="height: 42px; font-size: 13.5px;">Fiche</button></div></div></sc-for>
<sc-if value="{{entVide}}" hint-placeholder-val="{{ false }}"><p class="meta" style="text-align: center; padding: 30px 0;">Aucun entretien ici. Planifiez-en un depuis la fiche d’un candidat.</p></sc-if>
</div>
</div>
</sc-if>

<!-- Décisions -->
<sc-if value="{{sDec}}" hint-placeholder-val="{{ false }}">
<div>
<div class="hrow" style="gap: 8px; padding-top: 14px;"><sc-for list="{{decOnglets}}" as="f" hint-placeholder-count="3"><button onClick="{{f.pick}}" class="pill" style="height: 36px; border: 1px solid {{f.bd}}; background: {{f.bg}}; color: {{f.col}};">{{f.t}} · {{f.n}}</button></sc-for></div>
<sc-if value="{{aSansRep}}" hint-placeholder-val="{{ false }}"><button onClick="{{repondreNonRep}}" style="margin: 14px 20px 4px; width: calc(100% - 40px); padding: 14px; border-radius: 18px; background: rgba(244,196,99,.08); border: 1px solid rgba(244,196,99,.3); display: flex; gap: 12px; align-items: center;">@ORBI34@<span style="flex: 1;"><b style="display: block; font-size: 14.5px;">{{sansRepT}}</b><span class="meta">Chaque candidat reçoit une réponse, même courte</span></span>@CHEV@</button></sc-if>
<sc-for list="{{decListe}}" as="x" hint-placeholder-count="3"><button onClick="{{x.ouvrir}}" class="ligne"><span class="av" style="background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px;">{{x.nom}}</b><span class="meta" style="display: block;">{{x.offre}}</span><span style="display: block; font-size: 12.5px; color: {{x.stCol}};">{{x.statut}}</span></span>@CHEV@</button></sc-for>
<sc-if value="{{decVide}}" hint-placeholder-val="{{ false }}"><p class="meta" style="text-align: center; padding: 30px 20px;">Rien ici pour l’instant.</p></sc-if>
</div>
</sc-if>
</div>
</sc-if>
</div>

<!-- barre d’actions de la sélection -->
<sc-if value="{{selMode}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; left: 12px; right: 12px; bottom: 96px; z-index: 6; border-radius: 22px; background: #1B3338; border: 1px solid rgba(255,255,255,.1); box-shadow: 0 20px 40px -14px rgba(0,0,0,.8); padding: 10px 8px 8px;">
<p style="font-size: 13px; font-weight: 700; text-align: center; padding-bottom: 6px;">{{nSelT}}</p>
<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));">
<button onClick="{{selDeplacer}}" style="display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 600; min-height: 52px; justify-content: center;">@FLECHE@Étape</button>
<button onClick="{{selRepondre}}" style="display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 600; min-height: 52px; justify-content: center;">@BULLE@Répondre</button>
<button onClick="{{selRepartir}}" style="display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 600; min-height: 52px; justify-content: center;">@EQUIPE@Répartir</button>
<button onClick="{{selPdf}}" style="display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 600; min-height: 52px; justify-content: center;">@PDF@PDF</button>
</div></div>
</sc-if>
@NAV@
</sc-if>

<!-- ============ FICHE CANDIDAT ============ -->
<sc-if value="{{vFiche}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<header class="barreh">@BACK_FICHE@<span style="flex: 1;"></span><button onClick="{{ouvrirMenu}}" class="plus" aria-label="Plus d’options">···</button></header>
<div class="scroll" style="flex: 1; overflow-y: auto; padding-bottom: 120px;">
<div style="padding: 18px 20px 4px; display: flex; gap: 14px; align-items: center;">
<span class="av" style="width: 64px; height: 64px; font-size: 20px; background: {{fiche.bg}}; color: {{fiche.fg}};">{{fiche.ini}}</span>
<span style="flex: 1; min-width: 0;"><h1 style="font-size: 21px; line-height: 1.25;">{{fiche.nom}}</h1><span class="meta" style="display: block; margin-top: 2px;">{{fiche.titre}}</span><span class="meta" style="display: block;">{{fiche.ville}} · reçue {{fiche.recu}} via {{fiche.src}}</span></span>
</div>
<div style="padding: 12px 20px 0; display: flex; gap: 8px;">
<button onClick="{{ouvrirPourquoi}}" style="flex: 1; padding: 12px 14px; border-radius: 16px; background: #13282C; display: flex; align-items: center; gap: 10px;"><span class="score" style="background: {{fiche.sbg}}; color: {{fiche.scol}};">{{fiche.score}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 13px;">{{fiche.bandeT}}</b><span style="font-size: 12.5px; font-weight: 700; color: #5FE0B8;">Pourquoi ?</span></span></button>
<button onClick="{{ouvrirDeplacer}}" style="flex: 1; padding: 12px 14px; border-radius: 16px; background: #13282C; text-align: left;"><span class="meta" style="font-size: 12px;">Étape</span><b style="display: flex; align-items: center; gap: 6px; font-size: 14px; margin-top: 2px;">{{fiche.et}}@CHEV_BAS@</b></button>
</div>
<p class="meta" style="padding: 10px 20px 0; font-size: 12px;">{{fiche.offre}}</p>
<div style="margin-top: 10px;">@SEG_FICHE@</div>

<sc-if value="{{oResume}}" hint-placeholder-val="{{ true }}"><div>
<div class="bloc"><h3 style="display: flex; align-items: center; gap: 8px;">@ORBI22@Ce qu’Orbi a relevé</h3><sc-for list="{{fiche.raisons}}" as="r" hint-placeholder-count="3"><div class="li"><i></i>{{r.t}}</div></sc-for>
<sc-if value="{{fiche.aVerif}}" hint-placeholder-val="{{ true }}"><div style="margin-top: 10px;"><p class="meta" style="font-weight: 700; color: #F4D59A;">À vérifier en entretien</p><sc-for list="{{fiche.verifier}}" as="r" hint-placeholder-count="2"><div class="li"><i style="background: #F4D59A;"></i>{{r.t}}</div></sc-for></div></sc-if></div>
<div class="bloc"><h3>Ce qui l’intéresse</h3><div style="display: flex; flex-wrap: wrap; gap: 6px;"><sc-for list="{{fiche.interets}}" as="t" hint-placeholder-count="3"><span class="tag">{{t.t}}</span></sc-for></div><p class="meta" style="margin-top: 10px;">Disponibilité : {{fiche.dispo}}</p></div>
<sc-if value="{{fiche.aEnt}}" hint-placeholder-val="{{ true }}"><div class="bloc"><h3>Entretien</h3>
<div style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 16px; background: #13282C;">@CAL@<span style="flex: 1;"><b style="display: block; font-size: 14.5px;">{{fiche.ent.j}} · {{fiche.ent.h}}</b><span class="meta">{{fiche.ent.mode}} · avec {{fiche.ent.avec}}</span></span></div>
<sc-if value="{{fiche.entFait}}" hint-placeholder-val="{{ false }}"><sc-if value="{{fiche.aEval}}" hint-placeholder-val="{{ false }}"><button onClick="{{voirEval}}" class="ligne" style="padding: 12px 0; border: 0;"><span style="flex: 1;"><b style="display: block; font-size: 14px;">{{fiche.evalT}}</b><span class="meta">Moyenne {{fiche.evalMoy}}</span></span>@CHEV@</button></sc-if></sc-if></div></sc-if>
<sc-if value="{{fiche.aProp}}" hint-placeholder-val="{{ false }}"><div class="bloc"><h3>Proposition</h3><p style="font-size: 14.5px;">{{fiche.prop.salaire}} · début le {{fiche.prop.debut}}</p><p class="meta" style="margin-top: 4px;">{{fiche.prop.etat}}</p></div></sc-if>
<button onClick="{{ouvrirRepartir}}" class="ligne" style="padding: 16px 20px;"><span class="av" style="width: 36px; height: 36px; font-size: 12px;">{{fiche.assIni}}</span><span style="flex: 1;"><span class="meta">Suivi par</span><b style="display: block; font-size: 14.5px;">{{fiche.assigneT}}</b></span><span class="meta" style="color: #A6F26B; font-weight: 700;">Répartir</span></button>
<p class="meta" style="padding: 14px 20px; font-size: 12px; line-height: 1.5;">Cette consultation est enregistrée. Le score n’utilise ni le nom, ni l’âge, ni le genre, ni la photo.</p>
</div></sc-if>

<sc-if value="{{oCv}}" hint-placeholder-val="{{ false }}"><div>
<div class="bloc"><h3>Expérience</h3><sc-for list="{{fiche.exp}}" as="r" hint-placeholder-count="2"><div style="padding: 6px 0;"><b style="display: block; font-size: 14.5px;">{{r.t}}</b><span class="meta">{{r.d}}</span></div></sc-for></div>
<div class="bloc"><h3>Formation</h3><p style="font-size: 14.5px; line-height: 1.45;">{{fiche.form}}</p><sc-if value="{{fiche.aAttest}}" hint-placeholder-val="{{ true }}"><span class="tag" style="margin-top: 10px; background: rgba(166,242,107,.12); color: #A6F26B; font-weight: 700;">✓ {{fiche.attest}}</span></sc-if></div>
<div class="bloc"><h3>Compétences</h3><sc-for list="{{fiche.comp}}" as="r" hint-placeholder-count="3"><div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14.5px;"><span>{{r.t}}</span><span style="font-size: 12.5px; font-weight: 700; color: {{r.vc}};">{{r.v}}</span></div></sc-for></div>
<div class="bloc"><h3>Langues</h3><p style="font-size: 14.5px;">{{fiche.langues}}</p></div>
<div style="padding: 16px 20px;"><button onClick="{{telechargerCv}}" class="bs" style="width: 100%;">@PDF@Télécharger le CV d’origine</button></div>
</div></sc-if>

<sc-if value="{{oRep}}" hint-placeholder-val="{{ false }}"><div>
<sc-if value="{{fiche.aReponses}}" hint-placeholder-val="{{ true }}"><div><sc-for list="{{fiche.reponses}}" as="r" hint-placeholder-count="2"><div class="bloc"><p class="meta" style="font-weight: 700;">{{r.q}}</p><p style="font-size: 14.5px; line-height: 1.5; margin-top: 6px;">{{r.r}}</p></div></sc-for></div></sc-if>
<sc-if value="{{fiche.sansReponses}}" hint-placeholder-val="{{ false }}"><p class="meta" style="padding: 20px;">Pas de question de présélection sur cette offre.</p></sc-if>
<div class="bloc"><h3>Documents</h3>
<button onClick="{{ouvrirDoc}}" class="opt" style="border: 0;"><span style="width: 36px; height: 44px; border-radius: 8px; background: #F2EDE5; color: #9A3524; font-size: 10px; font-weight: 800; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 5px; flex: none;">PDF</span><span style="flex: 1;">CV.pdf<small>2 pages · lu par Orbi</small></span></button>
<sc-if value="{{fiche.aAttest}}" hint-placeholder-val="{{ true }}"><button onClick="{{ouvrirDoc}}" class="opt" style="border: 0;"><span style="width: 36px; height: 44px; border-radius: 8px; background: #0F3F37; color: #A6F26B; font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex: none;">✓</span><span style="flex: 1;">Attestation Jumanly<small>Vérifiable en ligne</small></span></button></sc-if>
</div>
</div></sc-if>

<sc-if value="{{oNotes}}" hint-placeholder-val="{{ false }}"><div>
<sc-if value="{{fiche.aEval}}" hint-placeholder-val="{{ false }}"><button onClick="{{voirEval}}" class="ligne" style="padding: 16px 20px;"><span class="mini" style="width: 40px; height: 40px; background: #0F3F37; color: #A6F26B;">★</span><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">Évaluation d’entretien</b><span class="meta">{{fiche.evalT}} · {{fiche.evalMoy}}</span></span>@CHEV@</button></sc-if>
<div style="padding: 16px 20px 6px;"><label class="champ" style="border-color: rgba(255,255,255,.18);"><input value="{{note}}" onChange="{{ecrireNote}}" aria-label="Ajouter une note" placeholder="Ajouter une note pour l’équipe"><button onClick="{{ajouterNote}}" class="env">Ajouter</button></label></div>
<sc-for list="{{fiche.notes}}" as="n" hint-placeholder-count="2"><div class="ligne" style="align-items: flex-start;"><span class="av" style="width: 34px; height: 34px; font-size: 11px;">{{n.ini}}</span><span style="flex: 1;"><span style="display: flex; justify-content: space-between;"><b style="font-size: 13.5px;">{{n.au}}</b><span class="meta" style="font-size: 12px;">{{n.d}}</span></span><span style="display: block; font-size: 14px; line-height: 1.45; margin-top: 3px;">{{n.t}}</span></span></div></sc-for>
<p class="meta" style="padding: 14px 20px; font-size: 12px;">Les notes sont visibles par l’équipe de recrutement, jamais par le candidat.</p>
</div></sc-if>

<sc-if value="{{oHist}}" hint-placeholder-val="{{ false }}"><div style="padding: 10px 20px;">
<sc-for list="{{fiche.hist}}" as="h" hint-placeholder-count="3"><div style="display: flex; gap: 12px; padding: 10px 0;"><span style="width: 10px; height: 10px; border-radius: 50%; background: #5FE0B8; margin-top: 5px; flex: none;"></span><span><span style="display: block; font-size: 14px;">{{h.t}}</span><span class="meta" style="font-size: 12px;">{{h.d}}</span></span></div></sc-for>
</div></sc-if>
</div>
<div class="bas">
<button onClick="{{ecrireMsg}}" class="bs" aria-label="Écrire à la personne" style="width: 52px; padding: 0; flex: none;">@BULLE@</button>
<sc-if value="{{fiche.decide}}" hint-placeholder-val="{{ false }}"><button onClick="{{actionSuiv}}" class="bs" style="flex: 1;">{{fiche.suivT}}</button></sc-if>
<sc-if value="{{fiche.nonRetenu}}" hint-placeholder-val="{{ false }}"><span></span></sc-if>
<button onClick="{{actionSuiv}}" class="bp" style="flex: 1; width: auto;">{{fiche.suivT}}</button>
</div>
</div>
</sc-if>

<!-- ============ PLANIFIER ============ -->
<sc-if value="{{vPlan}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<header class="barreh">@BACK_VUE@<b style="flex: 1; text-align: center; font-size: 14px; color: #B9CBC6; margin-right: 44px;">{{planTitre}}</b></header>
<div class="scroll" style="flex: 1; overflow-y: auto; padding: 0 20px 130px;">
<span class="lab">Jour</span>
<div style="display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin: 0 -20px; padding: 0 20px;"><sc-for list="{{jours}}" as="j" hint-placeholder-count="6"><button onClick="{{j.pick}}" style="width: 58px; height: 66px; border-radius: 18px; background: {{j.bg}}; color: {{j.col}}; text-align: center; flex: none;"><span style="display: block; font-size: 12px; font-weight: 600;">{{j.t}}</span><b style="display: block; font-size: 20px;">{{j.n}}</b></button></sc-for></div>
<span class="lab">Créneau · libres pour Aline et vous</span>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px;"><sc-for list="{{creneaux}}" as="c" hint-placeholder-count="6"><button onClick="{{c.pick}}" style="height: 46px; border-radius: 14px; border: 1px solid {{c.bd}}; background: {{c.bg}}; color: {{c.col}}; font-size: 14px; font-weight: 700; text-align: center; text-decoration: {{c.deco}};">{{c.t}}</button></sc-for></div>
<span class="lab">Comment</span>
<div style="display: flex; gap: 8px;"><sc-for list="{{modes}}" as="m" hint-placeholder-count="3"><button onClick="{{m.pick}}" style="flex: 1; padding: 12px 10px; border-radius: 16px; border: 1.5px solid {{m.bd}}; background: {{m.bg}};"><b style="display: block; font-size: 14px;">{{m.t}}</b><span class="meta" style="font-size: 11.5px;">{{m.d}}</span></button></sc-for></div>
<span class="lab">Durée</span>@PILLS_DUREE@
<span class="lab">Avec</span>
<sc-for list="{{invitesL}}" as="m" hint-placeholder-count="3"><button onClick="{{m.pick}}" class="opt"><span class="case" style="background: {{m.bg}}; border-color: {{m.bd}};">{{m.sym}}</span><span class="av" style="width: 36px; height: 36px; font-size: 12px;">{{m.ini}}</span><span style="flex: 1;">{{m.nom}}<small>{{m.role}}</small></span></button></sc-for>
<span class="lab">Message envoyé au candidat</span>
<p style="padding: 14px; border-radius: 16px; background: #13282C; font-size: 14px; line-height: 1.5;">{{planMsg}}</p>
</div>
<div class="bas"><button onClick="{{envoyerInvit}}" class="bp" style="opacity: {{planOp}};">Envoyer l’invitation</button></div>
</div>
</sc-if>

<sc-if value="{{vPlanifie}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; padding: 120px 20px 0; text-align: center;">
<span style="width: 84px; height: 84px; border-radius: 50%; background: #A6F26B; color: #0B1A1F; display: flex; align-items: center; justify-content: center; margin: 0 auto;">@CHECK40@</span>
<h1 style="font-size: 24px; margin-top: 22px;">Invitation envoyée</h1>
<p class="meta" style="font-size: 14px; margin-top: 8px; line-height: 1.5;">{{fiche.nom}} reçoit l’invitation dans Messages et par e-mail.</p>
<div style="margin-top: 22px; text-align: left; padding: 16px; border-radius: 20px; background: #F2EDE5; color: #0B1A1F;"><span style="font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #14745F;">{{planifie.mode}}</span><b style="display: block; font-size: 18px; margin-top: 6px;">{{planifie.j}} · {{planifie.h}}</b><span style="display: block; font-size: 13px; color: #4A5A56; margin-top: 4px;">Avec {{planifie.avec}} · {{planifie.lien}}</span></div>
<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 24px;">
<button onClick="{{ajouterAgenda}}" class="bp">Ajouter à mon agenda</button>
<button onClick="{{voirFicheApres}}" class="bs" style="width: 100%;">Revenir à la fiche</button>
<button onClick="{{retourListeApres}}" style="font-size: 14px; font-weight: 700; color: #A6F26B; min-height: 44px; text-align: center;">Voir tous les entretiens</button>
</div></div>
</sc-if>

<!-- ============ ÉVALUATION ============ -->
<sc-if value="{{vEval}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<header class="barreh">@BACK_VUE@<span style="flex: 1;"></span></header>
<div class="scroll" style="flex: 1; overflow-y: auto; padding: 18px 20px 130px;">
<h1 style="font-size: 23px;">{{evalTitre}}</h1><p class="meta" style="margin-top: 4px;">{{evalSous}}</p>
<div style="margin-top: 18px; display: flex; flex-direction: column; gap: 10px;"><sc-for list="{{grille}}" as="g" hint-placeholder-count="4"><div style="padding: 14px; border-radius: 18px; background: #13282C;"><span style="display: flex; justify-content: space-between;"><b style="font-size: 14.5px;">{{g.t}}</b><span class="meta">{{g.val}}</span></span>
<span style="display: flex; gap: 6px; margin-top: 8px;"><sc-for list="{{g.etoiles}}" as="e" hint-placeholder-count="5"><button onClick="{{e.pick}}" aria-label="{{e.lab}}" style="width: 40px; height: 40px; font-size: 26px; color: {{e.col}}; text-align: center;">★</button></sc-for></span></div></sc-for></div>
<span class="lab">Points forts</span><textarea class="ta" onChange="{{ecrireFort}}" aria-label="Points forts" placeholder="Ce qui vous a convaincu">{{ptFort}}</textarea>
<span class="lab">Points de vigilance</span><textarea class="ta" onChange="{{ecrireVig}}" aria-label="Points de vigilance" placeholder="Ce qu’il faut vérifier">{{ptVig}}</textarea>
<span class="lab">Votre recommandation</span>
<div style="display: flex; gap: 8px;"><sc-for list="{{recos}}" as="r" hint-placeholder-count="3"><button onClick="{{r.pick}}" style="flex: 1; height: 48px; border-radius: 16px; background: {{r.bg}}; color: {{r.col}}; font-size: 13.5px; font-weight: 700; text-align: center;">{{r.t}}</button></sc-for></div>
<p class="meta" style="margin-top: 12px; line-height: 1.5; font-size: 12.5px;">Visible par l’équipe de recrutement. La décision finale se prend ensemble, dans la fiche.</p>
</div>
<div class="bas"><button onClick="{{enregistrerEval}}" class="bp" style="opacity: {{evalOp}};">Enregistrer l’évaluation</button></div>
</div>
</sc-if>

<!-- ============ PROPOSITION ============ -->
<sc-if value="{{vProp}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<header class="barreh">@BACK_VUE@<span style="flex: 1;"></span></header>
<div class="scroll" style="flex: 1; overflow-y: auto; padding: 18px 20px 130px;">
<h1 style="font-size: 23px;">{{propTitre}}</h1><p class="meta" style="margin-top: 4px;">{{propPoste}}</p>
<span class="lab">Salaire mensuel (USD)</span><input class="in" value="{{salaire}}" onChange="{{ecrireSalaire}}" inputmode="numeric" aria-label="Salaire mensuel en dollars">
<span class="lab">Date de début</span><input class="in" value="{{debut}}" onChange="{{ecrireDebut}}" aria-label="Date de début">
<span class="lab">Message</span><textarea class="ta" onChange="{{ecrireMsgProp}}" aria-label="Message de la proposition" style="min-height: 120px;">{{msgProp}}</textarea>
<p class="meta" style="margin-top: 12px; line-height: 1.5; font-size: 12.5px;">La personne accepte, refuse ou pose une question depuis Messages. Vous êtes prévenue.</p>
</div>
<div class="bas"><button onClick="{{envoyerProp}}" class="bp">Envoyer la proposition</button></div>
</div>
</sc-if>

<!-- ============ DIAGNOSTIC DES CV ============ -->
<sc-if value="{{vDiag}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<header class="barreh">@BACK_DIAG@<span style="flex: 1;"></span><button onClick="{{pdfDiag}}" class="plus" aria-label="Télécharger le diagnostic en PDF">@PDF@</button></header>
<div class="scroll" style="flex: 1; overflow-y: auto; padding-bottom: 130px;">
<div style="padding: 18px 20px 0; display: flex; align-items: center; gap: 12px;">@ORBI42@<span><h1 style="font-size: 21px;">Diagnostic des CV</h1><span class="meta">{{diag.n}} CV lus · {{diag.offre}}</span></span></div>
<div class="hrow" style="gap: 8px; padding-top: 14px;"><sc-for list="{{diagOffres}}" as="f" hint-placeholder-count="4"><button onClick="{{f.pick}}" class="pill" style="height: 34px; font-size: 13px; border: 1px solid {{f.bd}}; background: {{f.bg}}; color: {{f.col}};">{{f.t}}</button></sc-for></div>
<div class="bloc">
<span style="display: flex; height: 14px; border-radius: 7px; overflow: hidden; gap: 2px;"><i style="width: {{diag.wT}}; background: #A6F26B;"></i><i style="width: {{diag.wP}}; background: #9FE8D2;"></i><i style="width: {{diag.wQ}}; background: #4A5F5B;"></i></span>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 14px;">
<span class="tuile" style="padding: 12px;"><b style="color: #A6F26B; font-size: 22px;">{{diag.tous}}</b>couvrent tous les critères</span>
<span class="tuile" style="padding: 12px;"><b style="color: #9FE8D2; font-size: 22px;">{{diag.part}}</b>en partie</span>
<span class="tuile" style="padding: 12px;"><b style="font-size: 22px;">{{diag.peu}}</b>peu</span></div></div>
<div class="bloc"><h3>Compétences présentes dans les CV</h3><sc-for list="{{couv}}" as="r" hint-placeholder-count="3"><div style="display: flex; align-items: center; gap: 12px; padding: 6px 0; font-size: 14px;"><span style="width: 110px; flex: none;">{{r.t}}</span><span style="flex: 1; height: 8px; border-radius: 4px; background: rgba(255,255,255,.08); overflow: hidden;"><span style="display: block; height: 100%; width: {{r.larg}}; background: #5FE0B8;"></span></span><span class="meta" style="width: 62px; text-align: right; font-size: 12px;">{{r.n}}</span></div></sc-for>
<p class="meta" style="margin-top: 10px; line-height: 1.5;">{{diag.manque}}</p></div>
<div class="sec" style="margin-top: 20px;"><h2>Les plus proches de l’offre</h2></div>
<sc-for list="{{diag.top}}" as="x" hint-placeholder-count="3">@LIGNE_C@</sc-for>
<p class="meta" style="padding: 16px 20px; line-height: 1.5; font-size: 12.5px;">Orbi lit et classe, il n’écarte personne. Chaque score s’explique dans la fiche.</p>
</div>
<div class="bas"><sc-if value="{{aPreselTous}}" hint-placeholder-val="{{ true }}"><button onClick="{{confirmerPresel}}" class="bp">{{preselTousT}}</button></sc-if><sc-if value="{{sansPreselTous}}" hint-placeholder-val="{{ false }}"><span></span></sc-if></div>
</div>
</sc-if>

@FAB@

<!-- ============ FEUILLES ============ -->
@F_MENU@
@F_POURQUOI@
@F_DEPLACER@
@F_DEPLACER_SEL@
@F_REPARTIR@
@F_NON@
@F_GROUPE@
@F_PDF@
@F_DOC@
@F_MESSAGE@
@F_BIENVENUE@
@F_PRESEL@
@ORBI_SHEET@
@TOAST@
'''

F = {}
F['@F_MENU@'] = feuille('fMenu', '<p style="font-size: 13px; color: #8FA39E; padding: 0 4px 6px;">{{fiche.nom}}</p>'
    '<sc-for list="{{menuF}}" as="m" hint-placeholder-count="6"><button onClick="{{m.go}}" class="opt" style="color: {{m.col}};"><span>{{m.t}}<small>{{m.s}}</small></span></button></sc-for>'
    '<button onClick="{{fermer}}" class="annuler">Annuler</button>')
F['@F_POURQUOI@'] = feuille('fPourquoi', '<div style="display: flex; align-items: center; gap: 12px;"><span class="score" style="height: 40px; min-width: 64px; font-size: 17px; background: {{fiche.sbg}}; color: {{fiche.scol}};">{{fiche.score}}</span><span><b style="display: block; font-size: 17px;">Pourquoi {{fiche.score}} ?</b><span class="meta">{{fiche.bandeT}} · calcul fixe, pas une décision</span></span></div>'
    '<div style="margin-top: 14px;"><sc-for list="{{fiche.criteres}}" as="r" hint-placeholder-count="8"><div style="padding: 7px 0;"><span style="display: flex; justify-content: space-between; font-size: 13.5px;"><span>{{r.t}}</span><span class="meta" style="font-size: 12.5px;">{{r.pts}}</span></span><span style="display: block; height: 6px; border-radius: 3px; background: rgba(255,255,255,.08); margin-top: 5px; overflow: hidden;"><span style="display: block; height: 100%; width: {{r.larg}}; background: {{r.col}};"></span></span></div></sc-for></div>'
    '<p class="meta" style="margin-top: 12px; line-height: 1.5; font-size: 12.5px;">Jamais utilisés : nom, genre, âge, photo, nationalité, origine, religion, situation familiale, santé, handicap, adresse précise.</p>'
    '<button onClick="{{fermer}}" class="annuler">Fermer</button>')
F['@F_DEPLACER@'] = feuille('fDeplacer', '<b style="display: block; font-size: 17px; padding: 0 4px 6px;">Changer d’étape</b>'
    '<sc-for list="{{deplacer}}" as="m" hint-placeholder-count="6"><button onClick="{{m.pick}}" class="opt"><span style="flex: 1;">{{m.t}}</span><span style="color: #A6F26B; font-weight: 800;">{{m.sym}}</span></button></sc-for>'
    '<button onClick="{{fermer}}" class="annuler">Annuler</button>')
F['@F_DEPLACER_SEL@'] = feuille('fDeplacerSel', '<b style="display: block; font-size: 17px; padding: 0 4px 6px;">Déplacer {{nSelT}}</b>'
    '<sc-for list="{{deplacerSel}}" as="m" hint-placeholder-count="6"><button onClick="{{m.pick}}" class="opt"><span style="flex: 1;">{{m.t}}</span></button></sc-for>'
    '<button onClick="{{fermer}}" class="annuler">Annuler</button>')
F['@F_REPARTIR@'] = feuille('fRepartir', '<b style="display: block; font-size: 17px; padding: 0 4px 6px;">{{repTitre}}</b><p class="meta" style="padding: 0 4px 6px;">La personne choisie suit le dossier et reçoit une notification.</p>'
    '<sc-for list="{{repartir}}" as="m" hint-placeholder-count="4"><button onClick="{{m.pick}}" class="opt"><span class="av" style="width: 38px; height: 38px; font-size: 12px;">{{m.ini}}</span><span style="flex: 1;">{{m.nom}}<small>{{m.role}}</small></span><span style="color: #A6F26B; font-weight: 800;">{{m.sym}}</span></button></sc-for>'
    '<button onClick="{{fermer}}" class="annuler">Annuler</button>')
F['@F_NON@'] = feuille('fNon', '<b style="display: block; font-size: 17px; padding: 0 4px;">{{nonTitre}}</b>'
    '<span class="lab" style="margin-top: 14px;">Motif · pour vous seulement</span><div style="display: flex; flex-wrap: wrap; gap: 8px;"><sc-for list="{{motifs}}" as="f" hint-placeholder-count="4"><button onClick="{{f.pick}}" class="pill" style="height: 34px; font-size: 12.5px; border: 1px solid {{f.bd}}; background: {{f.bg}}; color: {{f.col}};">{{f.t}}</button></sc-for></div>'
    '<span class="lab">Message envoyé</span><textarea class="ta" onChange="{{ecrireMsgNon}}" aria-label="Message au candidat" style="min-height: 130px;">{{msgNon}}</textarea>'
    '<button onClick="{{envoyerNon}}" class="bp" style="margin-top: 14px;">Envoyer et ne pas retenir</button><button onClick="{{fermer}}" class="annuler">Annuler</button>')
F['@F_GROUPE@'] = feuille('fGroupe', '<b style="display: block; font-size: 17px; padding: 0 4px;">{{groupeTitre}}</b><p class="meta" style="padding: 4px 4px 0;">{{groupeNoms}}</p>'
    '<span class="lab" style="margin-top: 14px;">Modèle</span><div style="display: flex; flex-direction: column; gap: 8px;"><sc-for list="{{modeles}}" as="v" hint-placeholder-count="4"><button onClick="{{v.pick}}" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 16px; border: 1.5px solid {{v.bd}}; background: {{v.bg}};"><span style="width: 18px; height: 18px; border-radius: 50%; border: 2px solid {{v.rb}}; background: {{v.rbg}}; flex: none;"></span><b style="font-size: 14px;">{{v.t}}</b></button></sc-for></div>'
    '<span class="lab">Aperçu pour la première personne</span><p style="padding: 14px; border-radius: 16px; background: #0B1A1F; font-size: 14px; line-height: 1.5;">{{apercuG}}</p>'
    '<button onClick="{{envoyerGroupe}}" class="bp" style="margin-top: 14px;">Envoyer à chacun</button><button onClick="{{fermer}}" class="annuler">Annuler</button>')
F['@F_PDF@'] = feuille('fPdf', '<span style="display: flex; align-items: center; gap: 12px;"><span style="width: 48px; height: 48px; border-radius: 14px; background: #1B3338; color: #A6F26B; display: flex; align-items: center; justify-content: center;">' + ico(I['pdf'], 24, '1.8') + '</span><span><b style="display: block; font-size: 17px;">Télécharger en PDF</b><span class="meta">{{pdfTitre}}</span></span></span>'
    '<span class="lab" style="margin-top: 16px;">Contenu</span><sc-for list="{{pdfOpts}}" as="o" hint-placeholder-count="5"><button onClick="{{o.pick}}" class="opt"><span class="case" style="background: {{o.bg}}; border-color: {{o.bd}};">{{o.sym}}</span><span style="flex: 1;">{{o.t}}</span></button></sc-for>'
    '<p class="meta" style="margin-top: 10px; font-size: 12px;">Le téléchargement est enregistré dans le journal de l’entreprise.</p>'
    '<button onClick="{{telechargerPdf}}" class="bp" style="margin-top: 14px;">Télécharger</button><button onClick="{{fermer}}" class="annuler">Annuler</button>')
F['@F_DOC@'] = feuille('fDoc', '<b style="display: block; font-size: 17px; padding: 0 4px 6px;">Demander un document</b>'
    '<sc-for list="{{DOCS}}" as="m" hint-placeholder-count="4"><button onClick="{{m.go}}" class="opt"><span style="flex: 1;">{{m.t}}</span></button></sc-for><button onClick="{{fermer}}" class="annuler">Annuler</button>')
F['@F_MESSAGE@'] = feuille('fMessage', '<div style="display: flex; align-items: center; gap: 12px;"><span class="av" style="background: {{fiche.bg}}; color: {{fiche.fg}};">{{fiche.ini}}</span><span style="flex: 1;"><b style="display: block; font-size: 16px;">Écrire à {{fiche.nom}}</b><span class="meta">La conversation reste liée à sa candidature</span></span></div>'
    '<textarea class="ta" onChange="{{ecrireMsgRapide}}" aria-label="Votre message" placeholder="Votre message" style="margin-top: 14px;">{{msgRapide}}</textarea>'
    '<button onClick="{{envoyerMsgRapide}}" class="bp" style="margin-top: 12px;">Envoyer</button><a href="Recruteur-conversation.dc.html" class="annuler">Ouvrir la conversation</a>')
F['@F_BIENVENUE@'] = feuille('fBienvenue', '<b style="display: block; font-size: 17px; margin-top: 6px;">Message de bienvenue envoyé</b><p style="font-size: 14px; color: #B9CBC6; line-height: 1.5; margin-top: 8px;">Bienvenue chez Baobab Fintech ! Rendez-vous le lundi 2 novembre à 8 h 30, au 12 avenue de la Justice, Gombe. Nadia</p>'
    '<p class="meta" style="margin-top: 10px;">L’offre reste en ligne tant que vous ne la clôturez pas.</p><a href="Recruteur-offre-cloturer.dc.html" class="bp" style="margin-top: 14px;">Clôturer l’offre</a><button onClick="{{fermer}}" class="annuler">Plus tard</button>', style='text-align: center;')
F['@F_PRESEL@'] = feuille('fPresel', '<b style="display: block; font-size: 17px; margin-top: 6px;">{{preselTousT}} ?</b><p style="font-size: 14px; color: #B9CBC6; line-height: 1.5; margin-top: 8px;">Ils passent en présélection. Personne n’est écarté : les autres restent dans « Reçue », et vous pouvez revenir en arrière.</p>'
    '<button onClick="{{preselTous}}" class="bp" style="margin-top: 16px;">Confirmer</button><button onClick="{{fermer}}" class="annuler">Annuler</button>', style='text-align: center;')

REMP = {
    '@LOUPE@': LOUPE, '@MOI@': MOI(), '@HORL@': ico(I['horl'], 20, '1.8', '#8FA39E'), '@CHEV@': ico(I['chev'], 18, '2', '#8FA39E'), '@CHEV_BAS@': ico(I['bas'], 16, '2', '#8FA39E'),
    '@PILLS_RT@': PILLS('rTypes'), '@PILLS_DUREE@': PILLS('durees', 3), '@SEG@': SEG('sousOnglets', 4), '@SEG_FICHE@': SEG('ongletsFiche', 5),
    '@LIGNE_C@': LIGNE_C, '@CARTE_FORT@': CARTE_FORT, '@SCOREX@': SCORE, '@ORBI22@': ORBI(22), '@ORBI34@': ORBI(34), '@ORBI42@': ORBI(42),
    '@TRI@': ico(I['tri'], 16, '1.8'), '@FLECHE@': ico(I['fleche'], 20, '1.8'), '@BULLE@': ico(I['bulle'], 20, '1.8'), '@EQUIPE@': ico(I['equipe'], 20, '1.8'), '@PDF@': ico(I['pdf'], 20, '1.8'),
    '@CAL@': ico(I['cal'], 24, '1.8', '#A6F26B'), '@CHECK40@': ico(I['check'], 40, '2.6'),
    '@BACK_FICHE@': BACK('retourFiche', '{{retourT}}'), '@BACK_VUE@': BACK('retourVue', 'Retour'), '@BACK_DIAG@': BACK('retourDiag', 'Candidatures'),
    '@NAV@': nav('candidatures'), '@FAB@': FAB(), '@ORBI_SHEET@': ORBI_SHEET, '@TOAST@': TOAST, **F,
}
C2 = CORPS
for k, v in REMP.items():
    C2 = C2.replace(k, v)
# la barre du bas de la fiche : un seul bouton principal
C2 = C2.replace('<sc-if value="{{fiche.decide}}" hint-placeholder-val="{{ false }}"><button onClick="{{actionSuiv}}" class="bs" style="flex: 1;">{{fiche.suivT}}</button></sc-if>\n<sc-if value="{{fiche.nonRetenu}}" hint-placeholder-val="{{ false }}"><span></span></sc-if>\n', '')
C2 = C2.replace('<sc-if value="{{sansPreselTous}}" hint-placeholder-val="{{ false }}"><span></span></sc-if>', '<sc-if value="{{sansPreselTous}}" hint-placeholder-val="{{ false }}"><button onClick="{{pdfDiag}}" class="bp">Télécharger le diagnostic</button></sc-if>')
JS = JS.replace("aPreselTous: aPreselTous.length > 0,", "aPreselTous: aPreselTous.length > 0, sansPreselTous: aPreselTous.length === 0,")
assert '@' not in C2.replace('@media', '').replace('@keyframes', ''), [x for x in C2.split() if '@' in x][:5]

PROPS = {
    'vue': {'editor': 'enum', 'options': ['liste', 'fiche', 'planifier', 'planifie', 'evaluation', 'proposition', 'diagnostic'], 'default': 'liste'},
    'sous': {'editor': 'enum', 'options': ['fort', 'toutes', 'entretiens', 'decisions'], 'default': 'fort'},
    'of': {'editor': 'enum', 'options': ['tout', 'analyste', 'clientele', 'flutter', 'marketing'], 'default': 'tout'},
    'cand': {'editor': 'text', 'default': 'grace'}, 'onglet': {'editor': 'enum', 'options': ['resume', 'cv', 'reponses', 'notes', 'historique'], 'default': 'resume'},
    'etapeF': {'editor': 'enum', 'options': ['recue', 'presel', 'entretien', 'proposition', 'recrute', 'nonretenu'], 'default': 'recue'},
    'entF': {'editor': 'enum', 'options': ['aujourdhui', 'avenir', 'documenter', 'faits'], 'default': 'aujourdhui'},
    'decF': {'editor': 'enum', 'options': ['propositions', 'recrutes', 'nonretenus'], 'default': 'propositions'},
    'feuille': {'editor': 'enum', 'options': ['aucune', 'menu', 'pourquoi', 'deplacer', 'repartir', 'nonretenu', 'groupe', 'pdf', 'document', 'message', 'presel'], 'default': 'aucune'},
    'rempli': {'editor': 'boolean', 'default': False}, 'evalFaite': {'editor': 'boolean', 'default': False},
    'orbi': {'editor': 'boolean', 'default': False}, 'orbiRep': {'editor': 'enum', 'options': ['aucune', 'qui', 'diag', 'reponse', 'entretien'], 'default': 'aucune'},
    'recherche': {'editor': 'enum', 'options': ['', 'options', 'texte'], 'default': ''},
}
ecrire_page('Recruteur-candidatures', 'Jumanly Modèle B · Recruteur · Candidatures', C2, JS, PROPS)

N = 'Recruteur-candidatures'
pages(N, [
    ('Recruteur-cand-toutes.dc.html', 'Candidatures · Toutes, étape Reçue', {'sous': 'toutes'}),
    ('Recruteur-cand-selection.dc.html', 'Candidatures · Toutes, présélection', {'sous': 'toutes', 'etapeF': 'presel', 'of': 'analyste'}),
    ('Recruteur-cand-entretiens.dc.html', 'Candidatures · Entretiens du jour', {'sous': 'entretiens'}),
    ('Recruteur-cand-a-documenter.dc.html', 'Candidatures · Entretiens à documenter', {'sous': 'entretiens', 'entF': 'documenter'}),
    ('Recruteur-cand-decisions.dc.html', 'Candidatures · Décisions, propositions', {'sous': 'decisions'}),
    ('Recruteur-cand-nonretenus.dc.html', 'Candidatures · Non retenus et réponses', {'sous': 'decisions', 'decF': 'nonretenus'}),
    ('Recruteur-cand-recherche.dc.html', 'Candidatures · Rechercher : les options', {'recherche': 'options'}),
    ('Recruteur-cand-recherche-texte.dc.html', 'Candidatures · Recherche « sql »', {'recherche': 'texte'}),
    ('Recruteur-cand-diagnostic.dc.html', 'Diagnostic de tous les CV par Orbi', {'vue': 'diagnostic', 'of': 'analyste'}),
    ('Recruteur-candidat.dc.html', 'Fiche candidat · Résumé', {'vue': 'fiche', 'cand': 'grace'}),
    ('Recruteur-candidat-pourquoi.dc.html', 'Fiche · Pourquoi ce score', {'vue': 'fiche', 'cand': 'grace', 'feuille': 'pourquoi'}),
    ('Recruteur-candidat-cv.dc.html', 'Fiche · CV', {'vue': 'fiche', 'cand': 'grace', 'onglet': 'cv'}),
    ('Recruteur-candidat-reponses.dc.html', 'Fiche · Réponses et documents', {'vue': 'fiche', 'cand': 'grace', 'onglet': 'reponses'}),
    ('Recruteur-candidat-notes.dc.html', 'Fiche · Notes de l’équipe', {'vue': 'fiche', 'cand': 'grace', 'onglet': 'notes'}),
    ('Recruteur-candidat-historique.dc.html', 'Fiche · Historique', {'vue': 'fiche', 'cand': 'grace', 'onglet': 'historique'}),
    ('Recruteur-candidat-menu.dc.html', 'Fiche · Menu ···', {'vue': 'fiche', 'cand': 'grace', 'feuille': 'menu'}),
    ('Recruteur-candidat-etape.dc.html', 'Fiche · Changer d’étape', {'vue': 'fiche', 'cand': 'esther', 'feuille': 'deplacer'}),
    ('Recruteur-candidat-repartir.dc.html', 'Fiche · Répartir à un collègue', {'vue': 'fiche', 'cand': 'esther', 'feuille': 'repartir'}),
    ('Recruteur-candidat-pdf.dc.html', 'Fiche · Télécharger le PDF', {'vue': 'fiche', 'cand': 'grace', 'feuille': 'pdf'}),
    ('Recruteur-candidat-nonretenu.dc.html', 'Fiche · Ne pas retenir, message bienveillant', {'vue': 'fiche', 'cand': 'junior', 'feuille': 'nonretenu'}),
    ('Recruteur-planifier.dc.html', 'Planifier un entretien', {'vue': 'planifier', 'cand': 'patrick', 'rempli': 'true'}),
    ('Recruteur-planifie.dc.html', 'Entretien planifié', {'vue': 'planifie', 'cand': 'patrick'}),
    ('Recruteur-evaluation.dc.html', 'Documenter l’entretien · grille', {'vue': 'evaluation', 'cand': 'didier', 'evalFaite': 'true'}),
    ('Recruteur-proposition.dc.html', 'Faire une proposition', {'vue': 'proposition', 'cand': 'didier'}),
    ('Recruteur-cand-groupe.dc.html', 'Réponse groupée aux non retenus', {'sous': 'decisions', 'decF': 'nonretenus', 'feuille': 'groupe'}),
    ('Recruteur-cand-orbi.dc.html', 'Orbi · qui recevoir en premier', {'orbi': 'true', 'orbiRep': 'qui'}),
] + [(f'Recruteur-candidat-{k}.dc.html', f'Fiche · {n}', {'vue': 'fiche', 'cand': k}) for k, n in [('benjamin', 'Benjamin Tshibangu'), ('esther', 'Esther Kabila'), ('patrick', 'Patrick Ilunga'), ('didier', 'Didier Lukusa'), ('sarah', 'Sarah Mbala'), ('junior', 'Junior Mukendi'), ('ruth', 'Ruth Ngoy'), ('amani', 'Amani Kasongo'), ('chantal', 'Chantal Kapinga'), ('fiston', 'Fiston Mwamba'), ('moussa', 'Moussa Diallo'), ('kevin', 'Kevin Lumbala'), ('joelle', 'Joëlle Mbayo')]]
 + [(f'Recruteur-cand-{k}.dc.html', f'Candidatures · offre {n}', {'sous': 'toutes', 'of': k}) for k, n in [('analyste', 'Analyste'), ('clientele', 'Clientèle'), ('flutter', 'Flutter'), ('marketing', 'Marketing')]], 'r_cand_pages.json')
print('ok')
