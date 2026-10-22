# Recruteur · Fil : Pour vous, Abonnements, Entreprises ; publication ouverte ; publier en son nom ou au nom de Baobab.
from rkit import *
JS = open(os.path.join(D, 'r_fil_logic.js')).read().replace("href: 'Recruteur-fil-jumanly.dc.html'", "href: 'Recruteur-entreprise-jumanly.dc.html'")

VIS = ('<sc-if value="{{x.aVis}}" hint-placeholder-val="{{ true }}"><button onClick="{{x.ouvrir}}" style="display: block; width: 100%; margin-top: 12px; border-radius: 18px; overflow: hidden;">'
    '<sc-if value="{{x.vGraph}}" hint-placeholder-val="{{ true }}"><span style="display: block; height: 170px; background: #F2EDE5; padding: 16px; position: relative;"><span style="font-size: 12px; font-weight: 700; color: #14745F;">{{x.visT}}</span>'
    '<svg viewBox="0 0 300 100" width="100%" height="110" preserveAspectRatio="none" aria-hidden="true" style="display: block; margin-top: 10px;"><path d="M0 85 L30 78 L60 80 L90 62 L120 66 L150 48 L180 52 L210 34 L240 38 L270 20 L300 14" fill="none" stroke="#14745F" stroke-width="3"></path><path d="M0 85 L30 78 L60 80 L90 62 L120 66 L150 48 L180 52 L210 34 L240 38 L270 20 L300 14 V100 H0z" fill="rgba(20,116,95,.12)"></path></svg></span></sc-if>'
    '<sc-if value="{{x.vOffre}}" hint-placeholder-val="{{ false }}"><span style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #0F3F37; border: 1px solid rgba(166,242,107,.25); border-radius: 18px;"><span class="mini" style="background: #A6F26B; color: #0F3F37;">' + ico(I['offres'], 22, '1.9') + '</span><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">{{x.visT}}</b><span style="font-size: 12.5px; color: #A6F26B; font-weight: 700;">Voir l’offre</span></span></span></sc-if>'
    '<sc-if value="{{x.vBienv}}" hint-placeholder-val="{{ false }}"><span style="display: flex; align-items: flex-end; height: 170px; padding: 16px; background: radial-gradient(circle at 75% 30%, #A6F26B 0 22%, transparent 23%), linear-gradient(150deg, #14745F, #0F3F37); color: #F2EDE5;"><b style="font-size: 22px; line-height: 1.1;">{{x.visT}}</b></span></sc-if>'
    '<sc-if value="{{x.vAppli}}" hint-placeholder-val="{{ false }}"><span style="display: flex; align-items: center; justify-content: center; gap: 14px; height: 170px; background: linear-gradient(150deg, #1E3B8A, #0B1A1F);"><span style="width: 70px; height: 128px; border-radius: 16px; border: 3px solid #F2EDE5; background: #13282C; display: block;"></span><b style="font-size: 15px; max-width: 150px; line-height: 1.3;">{{x.visT}}</b></span></sc-if>'
    '<sc-if value="{{x.vEven}}" hint-placeholder-val="{{ false }}"><span style="display: flex; gap: 14px; align-items: center; padding: 16px; background: #F2EDE5; color: #0B1A1F;"><span style="width: 56px; height: 62px; border-radius: 14px; background: #0F3F37; color: #A6F26B; text-align: center; padding-top: 8px; flex: none;"><b style="display: block; font-size: 22px;">14</b><span style="font-size: 11px; font-weight: 700;">NOV.</span></span><span><b style="display: block; font-size: 15px;">Journée carrière</b><span style="font-size: 13px; color: #4A5A56;">{{x.visT}}</span></span></span></sc-if>'
    '</button></sc-if>')
POST = ('<article style="padding: 18px 20px; border-bottom: 1px solid rgba(255,255,255,.07);">'
    '<div style="display: flex; align-items: center; gap: 12px;"><a href="{{x.href}}" style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; color: #F2EDE5;"><span class="av" style="border-radius: {{x.rond}}; background: {{x.bg}}; color: {{x.fg}};">{{x.ini}}</span>'
    '<span style="min-width: 0;"><b style="display: block; font-size: 15px;">{{x.auteur}}</b><span class="meta" style="display: block; font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{x.s}} · {{x.d}}</span></span></a>'
    '<sc-if value="{{x.aSuivre}}" hint-placeholder-val="{{ false }}"><button onClick="{{x.suivre}}" style="height: 32px; padding: 0 12px; border-radius: 16px; border: 1px solid rgba(166,242,107,.5); color: #A6F26B; font-size: 12.5px; font-weight: 700;">Suivre</button></sc-if>'
    '<button onClick="{{x.menu}}" class="plus" aria-label="Plus d’options">···</button></div>'
    '<sc-if value="{{x.aTag}}" hint-placeholder-val="{{ true }}"><span class="tag" style="margin-top: 12px; font-size: 11.5px; font-weight: 700; color: #9FD9C6; background: rgba(47,211,166,.1);">{{x.tag}}</span></sc-if>'
    '<button onClick="{{x.ouvrir}}" style="display: block; font-size: 15px; line-height: 1.5; margin-top: 10px; color: #ECE7DF;">{{x.t}}</button>' + VIS +
    '<sc-if value="{{x.aStats}}" hint-placeholder-val="{{ false }}"><a href="Recruteur-offre-detail.dc.html" style="display: block; margin-top: 10px; font-size: 13px; font-weight: 700; color: #5FE0B8;">{{x.stats}} · voir les statistiques</a></sc-if>'
    '<div style="display: flex; gap: 6px; margin-top: 12px;">'
    '<button onClick="{{x.aimer}}" style="display: flex; align-items: center; gap: 6px; height: 38px; padding: 0 12px; border-radius: 19px; background: #13282C; font-size: 13px; font-weight: 600; color: {{x.jcol}};">' + ico(I['coeur'], 18, '1.8') + '{{x.jt}}</button>'
    '<button onClick="{{x.commenter}}" style="display: flex; align-items: center; gap: 6px; height: 38px; padding: 0 12px; border-radius: 19px; background: #13282C; font-size: 13px; font-weight: 600; color: #B9CBC6;">' + ico(I['bulle'], 18, '1.8') + '{{x.ct}}</button>'
    '<span style="flex: 1;"></span><button onClick="{{x.partager}}" aria-label="Partager" style="width: 38px; height: 38px; border-radius: 50%; background: #13282C; display: flex; align-items: center; justify-content: center; color: #B9CBC6;">' + ico(I['partage'], 18, '1.8') + '</button></div>'
    '</article>')

CORPS = '''
<sc-if value="{{vListe}}" hint-placeholder-val="{{ true }}">
<div class="scroll" style="position: absolute; inset: 0; overflow-y: auto; padding-bottom: 170px;">
<header style="padding: 54px 20px 0; display: flex; align-items: center; gap: 10px;">
<h1 style="flex: 1; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">Fil</h1>
<sc-if value="{{sansRech}}" hint-placeholder-val="{{ true }}"><button onClick="{{ouvrirRech}}" class="rond" aria-label="Rechercher" style="background: #1A2629;">@LOUPE@</button></sc-if>@CLOCHE@@MOI@
</header>
<sc-if value="{{sansRech}}" hint-placeholder-val="{{ true }}">
<div>
<div style="padding: 14px 20px 0;"><button onClick="{{ouvrirPublier}}" style="width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 10px 10px 12px; border-radius: 22px; background: #13282C;">
<span style="width: 38px; height: 38px; border-radius: 50%; overflow: hidden; flex: none;">@PORTRAIT@</span><span style="flex: 1; color: #6F8580; font-size: 14.5px;">Partager une nouvelle, une offre…</span>
<span style="height: 34px; padding: 0 12px; border-radius: 17px; background: #A6F26B; color: #0B1A1F; font-size: 12.5px; font-weight: 700; display: flex; align-items: center;">Publier</span></button>
<button onClick="{{ouvrirPublierBaobab}}" style="display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 13px; font-weight: 600; color: #9FD9C6; min-height: 36px;"><span style="width: 20px; height: 20px; border-radius: 6px; background: #14745F; color: #FFFFFF; font-size: 8px; font-weight: 800; display: flex; align-items: center; justify-content: center;">BF</span>Publier au nom de Baobab Fintech</button></div>
<div style="margin-top: 6px;">@SEG@</div>
<sc-if value="{{sEnt}}" hint-placeholder-val="{{ false }}"><div class="hrow" style="gap: 10px; padding-top: 14px;"><sc-for list="{{ENTS}}" as="e" hint-placeholder-count="4"><div style="width: 150px; padding: 14px; border-radius: 20px; background: #13282C; border: 1px solid rgba(255,255,255,.08);">
<a href="{{e.href}}" style="display: block; color: #F2EDE5;"><span class="mini" style="background: {{e.bg}}; color: {{e.fg}};">{{e.ini}}</span><b style="display: block; font-size: 14px; margin-top: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{e.nom}}</b><span class="meta" style="font-size: 12px;">{{e.s}}</span></a>
<button onClick="{{e.suivre}}" style="width: 100%; height: 34px; margin-top: 10px; border-radius: 17px; border: 1px solid {{e.bbd}}; background: {{e.bbg}}; color: {{e.bcol}}; font-size: 12.5px; font-weight: 700; text-align: center;">{{e.bt}}</button></div></sc-for></div></sc-if>
<sc-for list="{{liste}}" as="x" hint-placeholder-count="3">@POST@</sc-for>
<sc-if value="{{rien}}" hint-placeholder-val="{{ false }}"><p class="meta" style="text-align: center; padding: 40px 20px;">Rien de neuf ici. Suivez des entreprises ou des talents pour remplir cet onglet.</p></sc-if>
</div>
</sc-if>
<sc-if value="{{aRech}}" hint-placeholder-val="{{ false }}">
<div>
<div style="padding: 14px 20px 0; display: flex; align-items: center; gap: 10px;">
<label class="rech" style="border: 1px solid rgba(166,242,107,.35);">@LOUPE@<input value="{{q}}" onChange="{{chercher}}" aria-label="Rechercher dans le Fil" placeholder="Publications, personnes, entreprises">
<sc-if value="{{aQ}}" hint-placeholder-val="{{ false }}"><button onClick="{{viderQ}}" aria-label="Effacer" style="width: 30px; height: 30px; color: #9FB3AE; font-size: 18px; text-align: center;">×</button></sc-if></label>
<button onClick="{{annulerRech}}" style="height: 44px; font-size: 14px; font-weight: 600; color: #A6F26B; flex: none;">Annuler</button></div>
<p class="meta" style="padding: 18px 20px 10px;">Chercher dans</p><div style="padding: 0 20px;">@PILLS_RT@</div>
<sc-if value="{{qVide}}" hint-placeholder-val="{{ true }}"><div><p class="meta" style="padding: 22px 20px 4px;">Recherches récentes</p>
<sc-for list="{{recents}}" as="r" hint-placeholder-count="3"><button onClick="{{r.pick}}" style="width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 20px; font-size: 15px;">@HORL@<span style="flex: 1;">{{r.t}}</span><span class="meta">{{r.d}}</span></button></sc-for></div></sc-if>
<sc-if value="{{qPlein}}" hint-placeholder-val="{{ false }}"><div>
<sc-if value="{{aRAut}}" hint-placeholder-val="{{ true }}"><div><p class="meta" style="padding: 20px 20px 6px;">Personnes et entreprises</p><sc-for list="{{rAut}}" as="a" hint-placeholder-count="2"><a href="{{a.href}}" class="ligne"><span class="av" style="border-radius: {{a.rond}}; background: {{a.bg}}; color: {{a.fg}};">{{a.ini}}</span><span style="flex: 1;"><b style="display: block; font-size: 15px;">{{a.nom}}</b><span class="meta">{{a.s}}</span></span>@CHEV@</a></sc-for></div></sc-if>
<sc-if value="{{aRPubs}}" hint-placeholder-val="{{ true }}"><div><p class="meta" style="padding: 20px 20px 6px;">Publications</p><sc-for list="{{rPubs}}" as="r" hint-placeholder-count="2"><button onClick="{{r.ouvrir}}" class="ligne" style="flex-direction: column; align-items: flex-start; gap: 4px;"><span style="font-size: 14.5px; line-height: 1.45;">{{r.t}}</span><span class="meta">{{r.a}}</span></button></sc-for></div></sc-if>
<sc-if value="{{rRien}}" hint-placeholder-val="{{ false }}"><p class="meta" style="text-align: center; padding: 30px 20px;">Rien pour « {{q}} ».</p></sc-if>
</div></sc-if>
</div>
</sc-if>
</div>
@NAV@
</sc-if>

<!-- Publication ouverte -->
<sc-if value="{{vPub}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<header class="barreh">@BACK_PUB@<span style="flex: 1;"></span></header>
<div class="scroll" style="flex: 1; overflow-y: auto; padding-bottom: 120px;">
@POST_PO@
<p class="meta" style="padding: 16px 20px 4px;">Commentaires</p>
<sc-for list="{{coms}}" as="n" hint-placeholder-count="2"><div class="ligne" style="align-items: flex-start;"><span class="av" style="width: 34px; height: 34px; font-size: 11px;">{{n.ini}}</span><span style="flex: 1;"><span style="display: flex; justify-content: space-between;"><b style="font-size: 13.5px;">{{n.n}}</b><span class="meta" style="font-size: 12px;">{{n.d}}</span></span><span style="display: block; font-size: 14px; line-height: 1.45; margin-top: 3px;">{{n.t}}</span></span></div></sc-for>
<sc-if value="{{sansComs}}" hint-placeholder-val="{{ false }}"><p class="meta" style="padding: 10px 20px;">Soyez la première personne à commenter.</p></sc-if>
</div>
<div class="bas"><label class="champ" style="flex: 1; border-color: rgba(255,255,255,.18);"><input value="{{com}}" onChange="{{ecrireCom}}" aria-label="Écrire un commentaire" placeholder="Écrire un commentaire"><button onClick="{{envoyerCom}}" class="env">Envoyer</button></label></div>
</div>
</sc-if>

<!-- Publier -->
<sc-if value="{{vPublier}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column;">
<header class="barreh"><button onClick="{{annulerPublier}}" class="retour" aria-label="Fermer">@CROIX@</button><b style="flex: 1; text-align: center; font-size: 15px;">Nouvelle publication</b><span style="width: 44px;"></span></header>
<div class="scroll" style="flex: 1; overflow-y: auto; padding: 0 20px 130px;">
<span class="lab">Publier en tant que</span>
<div style="display: flex; flex-direction: column; gap: 8px;"><sc-for list="{{auNoms}}" as="v" hint-placeholder-count="2"><button onClick="{{v.pick}}" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 16px; border: 1.5px solid {{v.bd}}; background: {{v.fond}};"><span class="av" style="width: 38px; height: 38px; font-size: 12px; border-radius: {{v.r}}; background: {{v.bg}}; color: {{v.fg}};">{{v.ini}}</span><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">{{v.t}}</b><span class="meta" style="font-size: 12px;">{{v.s}}</span></span><span style="width: 18px; height: 18px; border-radius: 50%; border: 2px solid {{v.rb}}; background: {{v.rbg}}; flex: none;"></span></button></sc-for></div>
<p class="meta" style="margin-top: 8px; font-size: 12px;">{{auNomT}}</p>
<span class="lab">Type</span>@PILLS_T@
<span class="lab" style="display: flex; justify-content: space-between;"><span>Texte</span><span style="color: {{carCol}}; font-weight: 700;" aria-label="{{resteCar}}">{{nCar}}</span></span><textarea class="ta" maxlength="220" onChange="{{ecrireTexte}}" aria-label="Texte de la publication, 220 caractères au plus" placeholder="Une nouvelle, un recrutement, un conseil aux candidats…" style="min-height: 130px;">{{texte}}</textarea>
<button onClick="{{ameliorer}}" style="display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 13.5px; font-weight: 700; color: #5FE0B8; min-height: 40px;">@ORBI20@Orbi complète le texte</button>
<sc-if value="{{aOffreT}}" hint-placeholder-val="{{ false }}"><div><span class="lab">Offre jointe</span><div style="display: flex; flex-direction: column; gap: 8px;"><sc-for list="{{offresP}}" as="v" hint-placeholder-count="3"><button onClick="{{v.pick}}" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 16px; border: 1.5px solid {{v.bd}}; background: {{v.bg}};"><span style="width: 18px; height: 18px; border-radius: 50%; border: 2px solid {{v.rb}}; background: {{v.rbg}}; flex: none;"></span><b style="font-size: 14px;">{{v.t}}</b></button></sc-for></div></div></sc-if>
<sc-if value="{{aPhotoT}}" hint-placeholder-val="{{ false }}"><div><span class="lab">Photo</span>
<sc-if value="{{sansPhoto}}" hint-placeholder-val="{{ true }}"><button onClick="{{ajouterPhoto}}" style="width: 100%; height: 140px; border-radius: 18px; border: 1.5px dashed rgba(255,255,255,.22); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #B9CBC6; font-size: 14px; font-weight: 600;">@PHOTO@Choisir une photo</button></sc-if>
<sc-if value="{{photo}}" hint-placeholder-val="{{ false }}"><div style="position: relative; height: 170px; border-radius: 18px; background: radial-gradient(circle at 75% 30%, #A6F26B 0 22%, transparent 23%), linear-gradient(150deg, #14745F, #0F3F37);"><button onClick="{{retirerPhoto}}" aria-label="Retirer la photo" class="rond" style="position: absolute; right: 10px; top: 10px; background: rgba(11,26,31,.6); width: 36px; height: 36px;">@CROIX@</button></div></sc-if>
</div></sc-if>
<sc-if value="{{aEvenT}}" hint-placeholder-val="{{ false }}"><div><span class="lab">Date</span><input class="in" value="{{evenJ}}" aria-label="Date de l’événement" readonly><span class="lab">Lieu</span><input class="in" value="{{evenL}}" aria-label="Lieu de l’événement" readonly></div></sc-if>
</div>
<div class="bas"><button onClick="{{publier}}" class="bp" style="opacity: {{pubOp}};">Publier</button></div>
</div>
</sc-if>

@FAB@
@F_MENU@
@F_PARTAGE@
@ORBI_SHEET@
@TOAST@
'''
F = {
 '@F_MENU@': feuille('fMenu', '<p style="font-size: 13px; color: #8FA39E; padding: 0 4px 6px;">{{menuTitre}}</p><sc-for list="{{menuL}}" as="m" hint-placeholder-count="4">'
    '<sc-if value="{{m.bouton}}" hint-placeholder-val="{{ true }}"><button onClick="{{m.go}}" class="opt" style="color: {{m.col}};"><span>{{m.t}}<small>{{m.s}}</small></span></button></sc-if>'
    '<sc-if value="{{m.lien}}" hint-placeholder-val="{{ false }}"><a href="{{m.href}}" class="opt"><span>{{m.t}}<small>{{m.s}}</small></span></a></sc-if></sc-for><button onClick="{{fermer}}" class="annuler">Annuler</button>'),
 '@F_PARTAGE@': feuille('fPartage', '<b style="display: block; font-size: 17px; padding: 0 4px 6px;">Partager</b><sc-for list="{{partage}}" as="m" hint-placeholder-count="3"><button onClick="{{m.go}}" class="opt"><span>{{m.t}}<small>{{m.s}}</small></span></button></sc-for><button onClick="{{fermer}}" class="annuler">Annuler</button>'),
}
POST_PO = POST.replace('{{x.', '{{po.').replace('<sc-for', '<sc-for')
REMP = {'@LOUPE@': LOUPE, '@CLOCHE@': CLOCHE(), '@MOI@': MOI(), '@PORTRAIT@': PORTRAIT(38), '@SEG@': SEG('sousOnglets', 3), '@PILLS_RT@': PILLS('rTypes'), '@PILLS_T@': PILLS('ptypes'),
        '@POST@': POST, '@POST_PO@': POST_PO, '@HORL@': ico(I['horl'], 20, '1.8', '#8FA39E'), '@CHEV@': ico(I['chev'], 18, '2', '#8FA39E'), '@CROIX@': ico(I['croix'], 22, '2'),
        '@ORBI20@': ORBI(20), '@PHOTO@': ico(I['photo'], 28, '1.6'), '@BACK_PUB@': BACK('retourPub', 'Fil'), '@NAV@': nav('fil'), '@FAB@': FAB(), '@ORBI_SHEET@': ORBI_SHEET, '@TOAST@': TOAST, **F}
C2 = CORPS
for k, v in REMP.items():
    C2 = C2.replace(k, v)
assert '@' not in C2, [x for x in C2.split() if '@' in x][:5]
JS = JS.replace("aComs: coms.length > 0,", "aComs: coms.length > 0, sansComs: coms.length === 0,")
PROPS = {
    'vue': {'editor': 'enum', 'options': ['liste', 'publication', 'publier'], 'default': 'liste'},
    'sous': {'editor': 'enum', 'options': ['pourvous', 'abonnements', 'entreprises'], 'default': 'pourvous'},
    'post': {'editor': 'enum', 'options': ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'], 'default': 'p1'},
    'auNom': {'editor': 'enum', 'options': ['moi', 'baobab'], 'default': 'moi'}, 'ptype': {'editor': 'enum', 'options': ['texte', 'photo', 'offre', 'evenement'], 'default': 'texte'},
    'rempli': {'editor': 'boolean', 'default': False},
    'feuille': {'editor': 'enum', 'options': ['aucune', 'menu', 'partage'], 'default': 'aucune'},
    'recherche': {'editor': 'enum', 'options': ['', 'options', 'texte'], 'default': ''},
    'orbi': {'editor': 'boolean', 'default': False}, 'orbiRep': {'editor': 'enum', 'options': ['aucune', 'idee', 'resultats', 'evenement'], 'default': 'aucune'},
}
ecrire_page('Recruteur-fil', 'Jumanly Modèle B · Recruteur · Fil', C2, JS, PROPS)
pages('Recruteur-fil', [
    ('Recruteur-fil-abonnements.dc.html', 'Fil · Abonnements', {'sous': 'abonnements'}),
    ('Recruteur-fil-entreprises.dc.html', 'Fil · Entreprises', {'sous': 'entreprises'}),
    ('Recruteur-fil-recherche.dc.html', 'Fil · Rechercher : les options', {'recherche': 'options'}),
    ('Recruteur-fil-recherche-texte.dc.html', 'Fil · Recherche « data »', {'recherche': 'texte'}),
    ('Recruteur-fil-publication.dc.html', 'Fil · Publication et commentaires', {'vue': 'publication', 'post': 'p1'}),
    ('Recruteur-fil-menu.dc.html', 'Fil · Menu ··· d’une publication', {'feuille': 'menu', 'post': 'p2'}),
    ('Recruteur-fil-publier.dc.html', 'Fil · Publier en son nom', {'vue': 'publier', 'rempli': 'true'}),
    ('Recruteur-fil-publier-baobab.dc.html', 'Fil · Publier une offre au nom de Baobab', {'vue': 'publier', 'auNom': 'baobab', 'ptype': 'offre', 'rempli': 'true'}),
    ('Recruteur-fil-orbi.dc.html', 'Orbi · idée de publication', {'orbi': 'true', 'orbiRep': 'idee'}),
], 'r_fil_pages.json')
print('ok')
