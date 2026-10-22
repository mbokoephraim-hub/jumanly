# Génère Recruteur-accueil.dc.html : ouverture, bienvenue, inscription et profil RECRUTEUR en 7 étapes.
# Part du générateur talent (gen_accueil.py) et remplace ce qui est propre au talent.
import os, re
D = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(D, 'gen_accueil.py')).read()

def entre(s, a, b, neuf):
    i = s.index(a); j = s.index(b, i)
    return s[:i] + neuf + s[j:]

src = src.replace("'accueil_logic.js'", "'r_accueil_logic.js'")
src = src.replace('<title>Jumanly Modèle B · Ouverture et inscription</title>', '<title>Jumanly Modèle B · Recruteur · Ouverture et inscription</title>')

# Portrait illustré de Nadia (pas de vraie photo)
PORTRAIT = lambda s: (f'<svg width="{s}" height="{s}" viewBox="0 0 100 100" aria-hidden="true" style="display: block; border-radius: 50%;">'
    '<rect width="100" height="100" fill="#F4C9A0"></rect><circle cx="50" cy="40" r="25" fill="#2A1A12"></circle>'
    '<ellipse cx="50" cy="46" rx="16" ry="19" fill="#8A5A3B"></ellipse><path d="M34 40c2-13 30-15 32 0-4-6-12-9-16-9s-12 3-16 9z" fill="#2A1A12"></path>'
    '<path d="M18 100c4-20 18-28 32-28s28 8 32 28z" fill="#0F3F37"></path><path d="M42 72l8 10 8-10" fill="none" stroke="#A6F26B" stroke-width="3"></path></svg>')

# ---------- Bienvenue : trois illustrations recruteur ----------
B0 = src.index('<sc-if value="{{s0}}"'); B1 = src.index('</button>\n\n<div style="position: absolute; left: 24px; right: 24px; top: 506px;">')
BIENV = '''<sc-if value="{{s0}}" hint-placeholder-val="{{ true }}">
<span style="position: absolute; inset: 0; animation: entre .45s ease-out both;">
<span class="flotte" style="--r: -3deg; position: absolute; left: 50px; top: 34px; width: 290px; padding: 16px; border-radius: 20px; background: #13282C; border: 1px solid rgba(255,255,255,.14); box-shadow: 0 30px 60px -20px rgba(0,0,0,.8);">
<span style="display: flex; gap: 6px;"><span class="tag" style="background: rgba(166,242,107,.12); color: #A6F26B; font-weight: 700;">En cours</span><span class="tag" style="background: #A6F26B; color: #0B1A1F; font-weight: 700;">3 nouvelles</span></span>
<b style="display: block; font-size: 17px; margin-top: 12px;">Analyste de données junior</b><span class="meta" style="display: block; margin-top: 3px;">Kinshasa · CDI</span>
<span style="display: flex; gap: 8px; margin-top: 14px;"><span style="flex: 1; border-radius: 12px; background: #0B1A1F; padding: 9px 10px; font-size: 11.5px; color: #8FA39E;"><b style="display: block; font-size: 17px; color: #F2EDE5;">412</b>vues</span><span style="flex: 1; border-radius: 12px; background: #0B1A1F; padding: 9px 10px; font-size: 11.5px; color: #8FA39E;"><b style="display: block; font-size: 17px; color: #F2EDE5;">6</b>jours</span><span style="flex: 1; border-radius: 12px; background: #0B1A1F; padding: 9px 10px; font-size: 11.5px; color: #8FA39E;"><b style="display: block; font-size: 17px; color: #F2EDE5;">38</b>candidatures</span></span></span>
<span class="flotte2" style="--r: 4deg; position: absolute; left: 30px; top: 300px; width: 270px; display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 18px; background: #0F2A2A; border: 1px solid rgba(47,211,166,.4); box-shadow: 0 20px 40px -16px rgba(0,0,0,.8);">%ORBI30%<span style="font-size: 13.5px; line-height: 1.45;">J’ai rédigé le texte et deux questions de présélection.</span></span>
</span>
</sc-if>

<sc-if value="{{s1}}" hint-placeholder-val="{{ false }}">
<span style="position: absolute; inset: 0; animation: entre .45s ease-out both;">
<span class="flotte" style="--r: -2deg; position: absolute; left: 34px; top: 30px; width: 322px; padding: 16px; border-radius: 22px; background: #13282C; border: 1px solid rgba(255,255,255,.12); box-shadow: 0 30px 60px -20px rgba(0,0,0,.8);">
<span style="display: flex; gap: 6px;"><span style="flex: 1; text-align: center; border-radius: 10px; background: #0B1A1F; padding: 8px 0; font-size: 10.5px; color: #8FA39E;"><b style="display: block; font-size: 16px; color: #F2EDE5;">18</b>Reçues</span><span style="flex: 1; text-align: center; border-radius: 10px; background: #0B1A1F; padding: 8px 0; font-size: 10.5px; color: #8FA39E;"><b style="display: block; font-size: 16px; color: #F2EDE5;">9</b>Présélection</span><span style="flex: 1; text-align: center; border-radius: 10px; background: rgba(166,242,107,.14); padding: 8px 0; font-size: 10.5px; color: #A6F26B;"><b style="display: block; font-size: 16px;">5</b>Entretien</span><span style="flex: 1; text-align: center; border-radius: 10px; background: #0B1A1F; padding: 8px 0; font-size: 10.5px; color: #8FA39E;"><b style="display: block; font-size: 16px; color: #F2EDE5;">1</b>Offre</span></span>
<span style="display: flex; align-items: center; gap: 10px; margin-top: 14px;"><span class="av" style="background: #1B3338; color: #F2EDE5;">GM</span><span style="flex: 1;"><b style="display: block; font-size: 14px;">Grâce Mbuyi</b><span class="meta">SQL, Excel · Présélection</span></span><b style="color: #A6F26B; font-size: 15px;">86 %</b></span>
<span style="display: flex; align-items: center; gap: 10px; margin-top: 10px;"><span class="av" style="background: #1B3338; color: #F2EDE5;">EK</span><span style="flex: 1;"><b style="display: block; font-size: 14px;">Esther Kabila</b><span class="meta">Power BI · Reçue</span></span><b style="color: #A6F26B; font-size: 15px;">81 %</b></span></span>
<span class="flotte2" style="--r: 3deg; position: absolute; right: 26px; top: 300px; width: 250px; display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 18px; background: #0F2A2A; border: 1px solid rgba(47,211,166,.4); box-shadow: 0 20px 40px -16px rgba(0,0,0,.8);">%ORBI30%<span style="font-size: 13.5px; line-height: 1.45;">38 CV lus : 12 couvrent tous vos critères.</span></span>
</span>
</sc-if>

<sc-if value="{{s2}}" hint-placeholder-val="{{ false }}">
<span style="position: absolute; inset: 0; animation: entre .45s ease-out both;">
<span class="flotte" style="--r: 3deg; position: absolute; left: 56px; top: 34px; width: 278px; padding: 18px; border-radius: 22px; background: #F2EDE5; color: #0B1A1F; box-shadow: 0 30px 60px -20px rgba(0,0,0,.8);">
<span style="font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #14745F;">Entretien · jeudi 10 h</span>
<b style="display: block; font-size: 18px; margin-top: 8px;">Grâce Mbuyi</b><span style="display: block; font-size: 13px; color: #4A5A56; margin-top: 2px;">Analyste de données junior · en visio</span>
<span style="display: flex; gap: 4px; margin-top: 12px; font-size: 18px; color: #14745F;">★★★★<span style="color: #C9D0CC;">★</span></span></span>
<span class="flotte2" style="--r: -3deg; position: absolute; left: 34px; top: 290px; display: flex; align-items: center; gap: 10px; padding: 12px 16px 12px 12px; border-radius: 18px; background: #13282C; border: 1px solid rgba(255,255,255,.1); box-shadow: 0 20px 40px -16px rgba(0,0,0,.8);"><span style="width: 34px; height: 34px; border-radius: 50%; background: #A6F26B; color: #0B1A1F; display: flex; align-items: center; justify-content: center;">%CHECK%</span><span><b style="display: block; font-size: 14px;">Décision : retenue</b><span class="meta">Réponse envoyée à 37 autres candidats</span></span></span>
</span>
</sc-if>
'''
src = src[:B0] + BIENV + src[B1:]

# ---------- Inscription, connexion : textes recruteur ----------
src = src.replace('<h1 class="h1">Créer votre compte</h1>\n<p class="sous">Gratuit. Trois minutes suffisent.</p>',
                  '<h1 class="h1">Créer votre compte recruteur</h1>\n<p class="sous">Gratuit pour publier et trier. Cinq minutes suffisent.</p>')
src = src.replace('par exemple grace.mbuyi@gmail.com', 'par exemple n.kalala@baobabfintech.cd')
src = src.replace('placeholder="prenom.nom@gmail.com"', 'placeholder="prenom.nom@entreprise.cd"')
src = src.replace('<p class="sous">Connectez-vous pour retrouver votre Fil.</p>', '<p class="sous">Connectez-vous pour retrouver vos offres et vos candidatures.</p>')
src = src.replace('<span class="av" style="width: 34px; height: 34px; font-size: 12px;">GM</span><span style="flex: 1;"><b style="display: block; font-size: 14px;">grace.mbuyi@gmail.com</b>',
                  '<span class="av" style="width: 34px; height: 34px; font-size: 12px;">NK</span><span style="flex: 1;"><b style="display: block; font-size: 14px;">n.kalala@baobabfintech.cd</b>')
src = src.replace('<a href="Fil.dc.html" class="bp">Se connecter</a>', '<a href="Recruteur-fil.dc.html" class="bp">Se connecter</a>')

# ---------- Profil recruteur en 7 étapes : une mise en page différente à chaque étape ----------
P0 = src.index('<sc-if value="{{e1}}"'); P1 = src.index('</div>\n<div class="bas">', P0)
PROFIL = '''<sc-if value="{{e1}}" hint-placeholder-val="{{ true }}"><div style="animation: entre .35s ease-out both;">
<div style="display: flex; align-items: center; gap: 18px; margin-top: 14px;">
<sc-if value="{{sansPhoto}}" hint-placeholder-val="{{ true }}"><button onClick="{{prendrePhoto}}" aria-label="Ajouter une photo" style="width: 104px; height: 104px; border-radius: 50%; border: 2px dashed rgba(255,255,255,.25); background: #13282C; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; flex: none;"><span style="font-size: 28px; font-weight: 700; color: #8FA39E;">{{ini}}</span><span style="font-size: 12px; font-weight: 700; color: #A6F26B;">Photo</span></button></sc-if>
<sc-if value="{{aPhoto}}" hint-placeholder-val="{{ false }}"><button onClick="{{prendrePhoto}}" aria-label="Changer la photo" style="width: 104px; height: 104px; border-radius: 50%; flex: none; box-shadow: 0 0 0 4px #0B1A1F, 0 0 0 6px #A6F26B; overflow: hidden;">%PORTRAIT104%</button></sc-if>
<div><h1 class="h1" style="font-size: 25px;">Bonjour, présentez-vous</h1><p class="meta" style="margin-top: 6px; line-height: 1.45;">Les talents voient qui recrute. Un visage inspire confiance.</p></div>
</div>
<sc-if value="{{viaFour}}" hint-placeholder-val="{{ false }}"><p style="margin-top: 16px; font-size: 13.5px; color: #5FE0B8;">Repris de votre compte {{fourT}}. Vous pouvez le corriger.</p></sc-if>
<div style="display: flex; gap: 10px; margin-top: 24px;">
<label style="flex: 1; min-width: 0;"><span class="lab">Prénom</span><input class="in" value="{{prenom}}" onChange="{{ecrirePrenom}}" aria-label="Prénom" placeholder="Nadia"></label>
<label style="flex: 1; min-width: 0;"><span class="lab">Nom</span><input class="in" value="{{nom}}" onChange="{{ecrireNom}}" aria-label="Nom" placeholder="Kalala"></label>
</div>
<sc-if value="{{aPhoto}}" hint-placeholder-val="{{ false }}"><div style="margin-top: 18px; display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 16px; background: #0F2A2A; border: 1px solid rgba(47,211,166,.35);">%ORBI28%<span style="font-size: 13.5px; line-height: 1.45;">Photo vérifiée : visage net, fond sobre.</span><button onClick="{{retirerPhoto}}" style="margin-left: auto; font-size: 13px; font-weight: 700; color: #FFB4A8; flex: none;">Retirer</button></div></sc-if>
</div></sc-if>

<sc-if value="{{e2}}" hint-placeholder-val="{{ false }}"><div style="animation: entre .35s ease-out both;">
<button onClick="{{ouvrirPays}}" style="display: block; width: 100%; margin-top: 12px; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,.14); background: #13282C; text-align: left;">
<span style="display: block; height: 110px; background: {{paysFlag}}; position: relative;"><span style="position: absolute; right: 14px; top: 14px; height: 32px; padding: 0 12px; border-radius: 16px; background: rgba(11,26,31,.75); color: #F2EDE5; font-size: 13px; font-weight: 700; display: flex; align-items: center;">Changer</span></span>
<span style="display: block; padding: 14px 16px;"><span class="meta">Vous êtes basée en</span><b style="display: block; font-size: 22px; margin-top: 2px;">{{paysT}}</b></span></button>
<h1 class="h1" style="font-size: 23px; margin-top: 26px;">Dans quelle ville ?</h1>
<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px;"><sc-for list="{{villes}}" as="v" hint-placeholder-count="6"><button onClick="{{v.pick}}" class="chip" style="border: 1px solid {{v.bd}}; background: {{v.bg}}; color: {{v.col}};">{{v.t}}</button></sc-for>
<button onClick="{{autreVille}}" class="chip" style="border: 1px dashed rgba(255,255,255,.3); color: #B9CBC6;">Autre ville</button></div>
<sc-if value="{{villeLibre}}" hint-placeholder-val="{{ false }}"><input class="in" value="{{ville}}" onChange="{{ecrireVille}}" aria-label="Votre ville" placeholder="Nom de votre ville" style="margin-top: 12px;"></sc-if>
<sc-if value="{{aVille}}" hint-placeholder-val="{{ true }}"><div><span class="lab" style="margin-top: 24px;">Vous recrutez aussi à</span>
<div style="display: flex; flex-wrap: wrap; gap: 8px;"><sc-for list="{{autresVilles}}" as="v" hint-placeholder-count="5"><button onClick="{{v.pick}}" class="chip" style="height: 36px; font-size: 13.5px; border: 1px solid {{v.bd}}; background: {{v.bg}}; color: {{v.col}}; font-weight: 600;">{{v.sym}}{{v.t}}</button></sc-for></div></div></sc-if>
</div></sc-if>

<sc-if value="{{e3}}" hint-placeholder-val="{{ false }}"><div style="animation: entre .35s ease-out both;">
<h1 class="h1" style="margin-top: 8px;">Comment vous joindre ?</h1>
<p class="sous">L’e-mail professionnel confirme votre entreprise. Le reste est facultatif.</p>
<div style="margin-top: 22px; border-radius: 22px; background: #13282C; border: 1px solid rgba(255,255,255,.08); overflow: hidden;">
<label style="display: block; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,.07);"><span class="meta" style="display: flex; align-items: center; gap: 8px;">%MAILP%E-mail professionnel · obligatoire</span>
<input value="{{emailPro}}" onChange="{{ecrireEmailPro}}" type="email" aria-label="E-mail professionnel" placeholder="prenom.nom@entreprise.cd" style="width: 100%; margin-top: 8px; border: 0; outline: 0; background: none; font: inherit; font-size: 16px; color: #F2EDE5;"></label>
<sc-if value="{{estPro}}" hint-placeholder-val="{{ true }}"><p style="padding: 10px 16px; font-size: 12.5px; color: #A6F26B; border-bottom: 1px solid rgba(255,255,255,.07);">Domaine {{domainePro}} : il servira à valider votre entreprise.</p></sc-if>
<sc-if value="{{estPerso}}" hint-placeholder-val="{{ false }}"><p style="padding: 10px 16px; font-size: 12.5px; color: #F4C463; border-bottom: 1px solid rgba(255,255,255,.07);">Adresse personnelle : votre entreprise devra vous valider à la main.</p></sc-if>
<div style="padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,.07);"><span class="meta" style="display: flex; align-items: center; gap: 8px;">%TELP%Téléphone · facultatif</span>
<div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
<button onClick="{{ouvrirInd}}" aria-label="Choisir l’indicatif : {{indPays}}" style="height: 40px; padding: 0 10px; border-radius: 12px; background: #0B1A1F; display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; flex: none;"><span class="flag" style="width: 24px; height: 17px; background: {{indFlag}};"></span>{{indT}}%CHEV_BAS%</button>
<input value="{{tel}}" onChange="{{ecrireTel}}" inputmode="tel" aria-label="Numéro de téléphone" placeholder="812 345 678" style="flex: 1 1 0; width: 0; min-width: 0; border: 0; outline: 0; background: none; font: inherit; font-size: 16px; color: #F2EDE5;"></div>
<sc-if value="{{telErr}}" hint-placeholder-val="{{ false }}"><p class="erreur" style="margin: 8px 0 0;">Au moins 8 chiffres.</p></sc-if></div>
<div style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,.07); display: flex; align-items: center; gap: 12px;"><span style="flex: 1; font-size: 14.5px;">Ce numéro est aussi sur WhatsApp</span>%TOGGLE_WA%</div>
<label style="display: block; padding: 14px 16px;"><span class="meta" style="display: flex; align-items: center; gap: 8px;"><span class="fo" style="width: 18px; height: 18px; background: #0A66C2; color: #FFFFFF; font-size: 10px; font-weight: 800; border-radius: 4px;">in</span>LinkedIn · facultatif</span>
<sc-if value="{{sansLinkedin}}" hint-placeholder-val="{{ true }}"><button onClick="{{importerLinkedin}}" style="margin-top: 10px; height: 40px; padding: 0 14px; border-radius: 20px; background: #0A66C2; color: #FFFFFF; font-size: 13.5px; font-weight: 700;">Relier mon profil LinkedIn</button></sc-if>
<sc-if value="{{aLinkedin}}" hint-placeholder-val="{{ false }}"><input value="{{linkedin}}" onChange="{{ecrireLinkedin}}" aria-label="Lien LinkedIn" style="width: 100%; margin-top: 8px; border: 0; outline: 0; background: none; font: inherit; font-size: 15px; color: #F2EDE5;"></sc-if></label>
</div>
<span class="lab" style="margin-top: 22px;">Qui voit votre téléphone et votre LinkedIn ?</span>
<div style="display: flex; flex-direction: column; gap: 8px;"><sc-for list="{{visOpts}}" as="v" hint-placeholder-count="3"><button onClick="{{v.pick}}" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 16px; border: 1.5px solid {{v.bd}}; background: {{v.bg}};"><span style="width: 20px; height: 20px; border-radius: 50%; border: 2px solid {{v.rb}}; background: {{v.rbg}}; flex: none;"></span><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">{{v.t}}</b><span class="meta">{{v.d}}</span></span></button></sc-for></div>
</div></sc-if>

<sc-if value="{{e4}}" hint-placeholder-val="{{ false }}"><div style="animation: entre .35s ease-out both;">
<h1 class="h1" style="margin-top: 8px;">Votre rôle dans le recrutement</h1>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 22px;">
<sc-for list="{{roles}}" as="r" hint-placeholder-count="6"><button onClick="{{r.pick}}" style="min-height: 128px; padding: 14px; border-radius: 20px; border: 1.5px solid {{r.bd}}; background: {{r.bg}}; display: flex; flex-direction: column; gap: 10px; transition: all .2s;"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="{{r.ic2}}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{{r.ic}}"></path></svg><span><b style="display: block; font-size: 14.5px; line-height: 1.3;">{{r.t}}</b><span class="meta" style="display: block; margin-top: 3px; font-size: 12px; line-height: 1.35;">{{r.d}}</span></span></button></sc-for>
</div>
<sc-if value="{{aRole}}" hint-placeholder-val="{{ true }}"><div style="margin-top: 22px;">
<label><span class="lab">Votre poste, tel qu’il s’affichera</span><input class="in" value="{{poste}}" onChange="{{ecrirePoste}}" aria-label="Votre poste" placeholder="Chargée de recrutement"></label>
<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;"><sc-for list="{{postesSugg}}" as="v" hint-placeholder-count="3"><button onClick="{{v.pick}}" class="chip" style="height: 34px; font-size: 13px; border: 1px solid {{v.bd}}; background: {{v.bg}}; color: {{v.col}};">{{v.t}}</button></sc-for></div>
</div></sc-if>
</div></sc-if>

<sc-if value="{{e5}}" hint-placeholder-val="{{ false }}"><div style="animation: entre .35s ease-out both;">
<h1 class="h1" style="margin-top: 8px;">Pour quelle entreprise recrutez-vous ?</h1>
<sc-if value="{{sansEnt}}" hint-placeholder-val="{{ true }}"><div>
<label style="margin-top: 20px; height: 52px; border-radius: 26px; background: #1A2629; display: flex; align-items: center; gap: 12px; padding: 0 16px;">%LOUPE%<input value="{{eq}}" onChange="{{ecrireEnt}}" aria-label="Rechercher votre entreprise" placeholder="Nom de l’entreprise" style="flex: 1 1 0; width: 0; min-width: 0; border: 0; outline: 0; background: none; font: inherit; font-size: 16px; color: #F2EDE5;"></label>
<sc-if value="{{eVide}}" hint-placeholder-val="{{ true }}"><div><p class="meta" style="margin: 20px 0 6px;">Déjà sur Jumanly, près de vous</p>
<sc-for list="{{entSugg}}" as="x" hint-placeholder-count="3"><button onClick="{{x.pick}}" class="ligne"><span style="width: 44px; height: 44px; border-radius: 12px; background: {{x.c}}; color: #FFFFFF; font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex: none;">{{x.ab}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px;">{{x.t}}</b><span class="meta">{{x.s}}</span></span></button></sc-for></div></sc-if>
<sc-if value="{{ePlein}}" hint-placeholder-val="{{ false }}"><div style="margin-top: 8px;">
<sc-for list="{{resEnt}}" as="x" hint-placeholder-count="1"><button onClick="{{x.pick}}" class="ligne"><span style="width: 44px; height: 44px; border-radius: 12px; background: {{x.c}}; color: #FFFFFF; font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex: none;">{{x.ab}}</span><span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15px;">{{x.t}}</b><span class="meta">{{x.s}}</span></span><span class="meta" style="color: #5FE0B8; font-weight: 700;">Sur Jumanly</span></button></sc-for>
<sc-if value="{{eRien}}" hint-placeholder-val="{{ false }}"><p class="meta" style="padding: 16px 0 4px;">« {{eq}} » n’est pas encore sur Jumanly.</p></sc-if>
</div></sc-if>
<button onClick="{{creerPage}}" style="margin-top: 18px; width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 18px; border: 1px dashed rgba(255,255,255,.28);"><span style="width: 40px; height: 40px; border-radius: 12px; background: #1B3338; color: #A6F26B; display: flex; align-items: center; justify-content: center; font-size: 22px; flex: none;">+</span><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">Mon entreprise n’est pas sur Jumanly</b><span class="meta">Créer sa page, vous en serez l’administratrice</span></span></button>
<button onClick="{{jeSuisIndep}}" class="lien" style="margin-top: 8px; color: #B9CBC6;">Je recrute en indépendante</button>
</div></sc-if>
<sc-if value="{{aEnt}}" hint-placeholder-val="{{ false }}"><div style="margin-top: 20px; border-radius: 24px; overflow: hidden; background: #13282C; border: 1px solid rgba(255,255,255,.12); animation: entre .3s ease-out both;">
<span style="display: block; height: 84px; background: {{e0.c}}; position: relative; overflow: hidden;"><svg viewBox="0 0 350 84" preserveAspectRatio="xMidYMid slice" style="position: absolute; inset: 0; width: 100%; height: 100%;" aria-hidden="true"><g fill="none" stroke="#FFFFFF" stroke-opacity=".16" stroke-width="18"><circle cx="300" cy="10" r="60"></circle><circle cx="40" cy="90" r="50"></circle></g></svg></span>
<div style="padding: 0 16px 16px; margin-top: -30px; position: relative;">
<span style="width: 60px; height: 60px; border-radius: 16px; background: {{e0.c}}; border: 3px solid #13282C; color: #FFFFFF; font-size: 19px; font-weight: 800; display: flex; align-items: center; justify-content: center;">{{e0.ab}}</span>
<div style="display: flex; align-items: center; gap: 8px; margin-top: 10px;"><b style="font-size: 18px;">{{e0.t}}</b><span class="tag" style="background: {{eeB}}; color: {{eeC}}; font-weight: 700;">{{eeT}}</span></div>
<p class="meta" style="margin-top: 4px;">{{e0.s}}</p><p class="meta" style="margin-top: 2px;">{{e0.rec}}</p>
<sc-if value="{{entChoisie}}" hint-placeholder-val="{{ true }}"><div>
<sc-if value="{{emailCorrespond}}" hint-placeholder-val="{{ true }}"><p style="margin-top: 12px; font-size: 13px; line-height: 1.45; color: #A6F26B;">Votre e-mail {{domainePro}} correspond : validation en général dans la journée.</p></sc-if>
<sc-if value="{{emailDiff}}" hint-placeholder-val="{{ false }}"><p style="margin-top: 12px; font-size: 13px; line-height: 1.45; color: #F4C463;">Votre e-mail n’est pas en @{{e0.dom}} : l’administrateur vérifiera à la main.</p></sc-if>
<button onClick="{{demander}}" class="bp" style="margin-top: 14px; height: 48px;">Demander à rejoindre la page</button>
<p class="meta" style="margin-top: 10px; line-height: 1.5; font-size: 12.5px;">Une fois accepté, le logo de l’entreprise s’affiche sur votre profil et vos offres.</p></div></sc-if>
<sc-if value="{{entAttente}}" hint-placeholder-val="{{ false }}"><div style="margin-top: 14px; padding: 12px 14px; border-radius: 16px; background: rgba(244,196,99,.08); border: 1px solid rgba(244,196,99,.3);"><b style="display: block; font-size: 14px;">En attente de validation</b><span style="display: block; font-size: 13px; line-height: 1.45; color: #D5DEDB; margin-top: 4px;">Vous pouvez déjà préparer vos offres. Elles seront publiées au nom de l’entreprise après l’accord.</span><button onClick="{{annulerDemande}}" class="lien" style="color: #F2EDE5; min-height: 34px;">Annuler la demande</button></div></sc-if>
<sc-if value="{{entCreee}}" hint-placeholder-val="{{ false }}"><p style="margin-top: 12px; font-size: 13px; line-height: 1.45; color: #A6F26B;">Vous administrez cette page : vous pourrez inviter votre équipe depuis Compte.</p></sc-if>
<button onClick="{{changerEnt}}" class="lien" style="color: #B9CBC6; min-height: 34px;">Choisir une autre entreprise</button>
</div></div></sc-if>
<sc-if value="{{indep}}" hint-placeholder-val="{{ false }}"><div style="margin-top: 20px; padding: 16px; border-radius: 20px; background: #13282C;"><b style="display: block; font-size: 15px;">Vous recrutez en indépendante</b><p class="meta" style="margin-top: 4px; line-height: 1.5;">Vos offres s’affichent à votre nom. Vous pourrez rejoindre une entreprise plus tard.</p><button onClick="{{changerEnt}}" class="lien" style="color: #F2EDE5;">Choisir plutôt une entreprise</button></div></sc-if>
</div></sc-if>

<sc-if value="{{e6}}" hint-placeholder-val="{{ false }}"><div style="animation: entre .35s ease-out both;">
<h1 class="h1" style="margin-top: 8px;">Quels profils recrutez-vous ?</h1>
<p class="sous">Orbi vous propose ces talents en premier, et votre Fil suit ces domaines.</p>
<p style="margin: 20px 0 10px; font-size: 13px; font-weight: 700; color: #A6F26B;">{{nDomT}}</p>
<div style="display: flex; flex-wrap: wrap; gap: 8px;"><sc-for list="{{doms}}" as="c" hint-placeholder-count="10"><button onClick="{{c.pick}}" class="chip" style="border: 1px solid {{c.bd}}; background: {{c.bg}}; color: {{c.col}}; font-weight: 600; transition: all .15s;">{{c.sym}}{{c.t}}</button></sc-for></div>
<span class="lab" style="margin-top: 26px;">Niveaux</span>
<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; padding: 4px; border-radius: 18px; background: #0F2226;"><sc-for list="{{nivs}}" as="c" hint-placeholder-count="4"><button onClick="{{c.pick}}" style="height: 42px; border-radius: 14px; background: {{c.bg}}; color: {{c.col}}; font-size: 13.5px; font-weight: 600; text-align: center;">{{c.t}}</button></sc-for></div>
<span class="lab" style="margin-top: 26px;">Recrutements par an</span>
<div style="display: flex; gap: 8px;"><sc-for list="{{vols}}" as="c" hint-placeholder-count="3"><button onClick="{{c.pick}}" style="flex: 1; height: 64px; border-radius: 18px; border: 1px solid {{c.bd}}; background: {{c.bg}}; color: {{c.col}}; font-size: 15px; font-weight: 700; text-align: center;">{{c.t}}</button></sc-for></div>
</div></sc-if>

<sc-if value="{{e7}}" hint-placeholder-val="{{ false }}"><div style="animation: entre .35s ease-out both;">
<h1 class="h1" style="margin-top: 8px;">Votre profil recruteur</h1>
<p class="sous">Voici ce que verront les talents.</p>
<div style="margin-top: 20px; border-radius: 24px; background: #13282C; border: 1px solid rgba(255,255,255,.12); padding: 18px;">
<div style="display: flex; align-items: center; gap: 14px;">
<span style="position: relative; width: 64px; height: 64px; flex: none;"><span style="display: block; width: 64px; height: 64px; border-radius: 50%; overflow: hidden;">%PORTRAIT64%</span>
<sc-if value="{{logoVisible}}" hint-placeholder-val="{{ false }}"><span style="position: absolute; right: -4px; bottom: -4px; width: 28px; height: 28px; border-radius: 8px; background: {{logoC}}; border: 2px solid #13282C; color: #FFFFFF; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center;">{{logoAb}}</span></sc-if>
<sc-if value="{{logoAttente}}" hint-placeholder-val="{{ true }}"><span style="position: absolute; right: -4px; bottom: -4px; width: 28px; height: 28px; border-radius: 8px; background: #33464A; border: 2px dashed #F4C463; color: #F4C463; font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center;">…</span></sc-if></span>
<span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 17px;">{{nomComplet}}</b><span class="meta" style="display: block;">{{posteAff}} · {{entT}}</span><span class="meta" style="display: block;">{{lieuAff}}</span></span></div>
<sc-if value="{{aBadge}}" hint-placeholder-val="{{ true }}"><span style="display: inline-flex; align-items: center; gap: 6px; margin-top: 14px; height: 28px; padding: 0 10px; border-radius: 14px; background: rgba(166,242,107,.14); color: #A6F26B; font-size: 12.5px; font-weight: 700;"><i style="width: 7px; height: 7px; border-radius: 50%; background: #A6F26B;"></i>Recrute en ce moment</span></sc-if>
<p style="font-size: 14.5px; line-height: 1.5; margin-top: 12px;">{{titreAff}}</p>
<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px;"><sc-for list="{{domListe}}" as="c" hint-placeholder-count="3"><span class="tag">{{c.t}}</span></sc-for></div>
</div>
<label style="display: block; margin-top: 20px;"><span class="lab">Votre phrase d’accroche</span><input class="in" value="{{titreP}}" onChange="{{ecrireTitreP}}" aria-label="Phrase d’accroche" placeholder="Je recrute les talents data de Baobab Fintech"></label>
<button onClick="{{ouvrirOrbi}}" style="margin-top: 12px; width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 16px; background: #0F2A2A; border: 1px solid rgba(47,211,166,.35);">%ORBI28%<span style="flex: 1; font-size: 14px; font-weight: 600;">Orbi propose une accroche</span>%CHEV%</button>
<div style="display: flex; align-items: center; gap: 14px; margin-top: 14px; padding: 14px 16px; border-radius: 18px; background: #13282C;"><span style="flex: 1;"><b style="display: block; font-size: 14.5px;">Afficher « Recrute en ce moment »</b><span class="meta">Les talents peuvent vous suivre</span></span>%TOGGLE_BADGE%</div>
</div></sc-if>
'''
src = src[:P0] + PROFIL + src[P1:]
src = src.replace('<sc-for list="{{barres}}" as="b" hint-placeholder-count="6">', '<sc-for list="{{barres}}" as="b" hint-placeholder-count="7">')
src = src.replace('<sc-if value="{{aPasser}}" hint-placeholder-val="{{ false }}"><button onClick="{{passer}}" style="height: 44px; padding: 0 2px 0 8px; font-size: 14px; font-weight: 600; color: #B9CBC6;">Passer</button></sc-if>\n', '')

# ---------- Notifications ----------
src = src.replace('Nouvelle offre à 86 % pour vous : Analyste de données junior chez Baobab Fintech', '3 nouvelles candidatures pour Analyste de données junior')
src = src.replace('Nadia Kalala a vu votre candidature', 'Grâce Mbuyi a confirmé l’entretien de jeudi 10 h')
src = src.replace('<h1 class="h1">Ne ratez aucune offre pour vous</h1>\n<p class="sous">Une notification quand une offre vous correspond ou qu’un recruteur vous répond. Rien d’autre.</p>',
                  '<h1 class="h1">Ne laissez aucun candidat sans réponse</h1>\n<p class="sous">Une notification pour les nouvelles candidatures, les entretiens et votre équipe. Rien d’autre.</p>')

# ---------- Profil prêt ----------
A0 = src.index('<!-- ============ PROFIL PRÊT ============ -->'); A1 = src.index('<!-- ============ FEUILLES ============ -->')
PRET = '''<!-- ============ PROFIL PRÊT ============ -->
<sc-if value="{{vPret}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0;">
<div class="pg scroll" style="padding-bottom: 130px;">
<span style="position: absolute; left: 50%; top: 40px; width: 460px; height: 460px; margin-left: -230px; border-radius: 50%; background: radial-gradient(circle, rgba(166,242,107,.16) 0, rgba(166,242,107,0) 60%); pointer-events: none;"></span>
<div style="position: relative; padding: 70px 20px 0; text-align: center;">
<span style="position: relative; display: block; width: 124px; height: 124px; margin: 0 auto; animation: carre .6s cubic-bezier(.34,1.56,.64,1) both;">
<svg width="124" height="124" viewBox="0 0 76 76" aria-hidden="true" style="position: absolute; inset: 0; transform: rotate(-90deg);"><circle cx="38" cy="38" r="34" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="3.4"></circle><circle cx="38" cy="38" r="34" fill="none" stroke="#A6F26B" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="{{ringDash}}" style="animation: anneau 1.2s ease-out .3s both;"></circle></svg>
<span style="position: absolute; left: 11px; top: 11px; width: 102px; height: 102px; border-radius: 50%; overflow: hidden;">%PORTRAIT102%</span>
<sc-if value="{{logoVisible}}" hint-placeholder-val="{{ false }}"><span style="position: absolute; right: 4px; bottom: 4px; width: 36px; height: 36px; border-radius: 10px; background: {{logoC}}; border: 3px solid #0B1A1F; color: #FFFFFF; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center;">{{logoAb}}</span></sc-if>
<sc-if value="{{logoAttente}}" hint-placeholder-val="{{ true }}"><span style="position: absolute; right: 4px; bottom: 4px; width: 36px; height: 36px; border-radius: 10px; background: #33464A; border: 2px dashed #F4C463; color: #F4C463; font-size: 15px; font-weight: 800; display: flex; align-items: center; justify-content: center;">…</span></sc-if>
</span>
<p style="margin-top: 16px; font-size: 13px; font-weight: 700; color: #A6F26B; animation: mot .5s ease-out .5s both;">Profil recruteur complété à {{pctT}}</p>
<h1 class="h1" style="margin-top: 8px; animation: mot .5s ease-out .6s both;">Bienvenue, {{prenomAff}}</h1>
<p class="sous" style="animation: mot .5s ease-out .7s both;">{{posteAff}} · {{entT}}</p>
<p class="meta" style="margin-top: 6px; animation: mot .5s ease-out .75s both;">{{pretEnt}}</p>
</div>
<div style="position: relative; margin: 24px 20px 0; display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border-radius: 18px; background: #0F2A2A; border: 1px solid rgba(47,211,166,.35); animation: mot .5s ease-out .95s both;">%ORBI32%<span style="flex: 1; font-size: 14px; line-height: 1.45;">Je peux rédiger votre première offre à partir d’un simple intitulé. <a href="Recruteur-publier-1.dc.html" style="font-weight: 700; color: #5FE0B8;">Essayer</a></span></div>
<p class="meta" style="position: relative; padding: 24px 20px 4px;">Pour bien démarrer</p>
<div style="position: relative; padding: 0 20px; animation: mot .5s ease-out 1.05s both;">
<a href="Recruteur-publier-1.dc.html" class="ligne"><span style="flex: 1;"><b style="display: block; font-size: 15px;">Publier une première offre</b><span class="meta">5 étapes, Orbi rédige avec vous</span></span>%CHEV%</a>
<a href="Recruteur-equipe.dc.html" class="ligne"><span style="flex: 1;"><b style="display: block; font-size: 15px;">Inviter mon équipe</b><span class="meta">Managers et RH, chacun avec son rôle</span></span>%CHEV%</a>
<a href="Recruteur-talents.dc.html" class="ligne"><span style="flex: 1;"><b style="display: block; font-size: 15px;">Chercher des talents</b><span class="meta">Profils visibles en data, finance et service client</span></span>%CHEV%</a>
<button onClick="{{modifierProfil}}" class="ligne" style="border: 0;"><span style="flex: 1;"><b style="display: block; font-size: 15px;">Modifier mes réponses</b><span class="meta">{{notifT}}</span></span>%CHEV%</button>
</div>
</div>
<div class="bas"><a href="Recruteur-fil.dc.html" class="bp">Entrer dans Jumanly</a></div>
</div>
</sc-if>

'''
src = src[:A0] + PRET + src[A1:]

# ---------- Feuilles : demande de rattachement, création de page, Orbi accroche ----------
C0 = src.index('<sc-if value="{{fCv}}"'); C1 = src.index('<sc-if value="{{fSysteme}}"')
FEUILLES = '''<sc-if value="{{fDemande}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{fermer}}" aria-label="Fermer" class="voile"></button>
<div class="feuille"><span class="poignee"></span>
<div style="display: flex; align-items: center; gap: 12px;"><span style="width: 44px; height: 44px; border-radius: 12px; background: {{e0.c}}; color: #FFFFFF; font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex: none;">{{e0.ab}}</span><span style="flex: 1;"><b style="display: block; font-size: 17px;">Rejoindre {{e0.t}}</b><span class="meta">{{e0.rec}}</span></span></div>
<p style="font-size: 14px; line-height: 1.5; color: #D5DEDB; margin-top: 14px;">L’administrateur reçoit votre nom, votre poste ({{posteAff}}) et votre e-mail professionnel.</p>
<label style="display: block; margin-top: 14px;"><span class="lab">Votre message</span><textarea onChange="{{ecrireMsgDem}}" aria-label="Message à l’administrateur" style="width: 100%; min-height: 92px; border-radius: 16px; background: #0B1A1F; border: 1px solid rgba(255,255,255,.12); padding: 12px 14px; font: inherit; font-size: 14.5px; line-height: 1.45; color: #F2EDE5; outline: 0; resize: none;">{{msgDem}}</textarea></label>
<button onClick="{{envoyerDemande}}" class="bp" style="margin-top: 14px;">Envoyer la demande</button>
<button onClick="{{fermer}}" class="annuler">Annuler</button>
</div>
</div>
</sc-if>

<sc-if value="{{fCreer}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{fermer}}" aria-label="Fermer" class="voile"></button>
<div class="feuille" style="top: 90px; overflow-y: auto;"><span class="poignee"></span>
<b style="display: block; font-size: 18px; padding: 0 4px;">Créer la page de l’entreprise</b>
<div style="display: flex; align-items: center; gap: 14px; margin-top: 16px;">
<sc-if value="{{nSansLogo}}" hint-placeholder-val="{{ true }}"><button onClick="{{ajouterLogo}}" style="width: 64px; height: 64px; border-radius: 18px; border: 2px dashed rgba(255,255,255,.25); color: #A6F26B; font-size: 12px; font-weight: 700; text-align: center; flex: none;">Logo</button></sc-if>
<sc-if value="{{nLogo}}" hint-placeholder-val="{{ false }}"><button onClick="{{ajouterLogo}}" style="width: 64px; height: 64px; border-radius: 18px; background: #0F3F37; color: #A6F26B; font-size: 20px; font-weight: 800; text-align: center; flex: none;">✓</button></sc-if>
<label style="flex: 1; min-width: 0;"><span class="lab">Nom de l’entreprise</span><input class="in" value="{{nouvelle.t}}" onChange="{{ecrireNouv}}" aria-label="Nom de l’entreprise" placeholder="Ex. Kinshasa Logistique"></label></div>
<span class="lab" style="margin-top: 18px;">Secteur</span>
<div style="display: flex; flex-wrap: wrap; gap: 8px;"><sc-for list="{{sects}}" as="v" hint-placeholder-count="8"><button onClick="{{v.pick}}" class="chip" style="height: 36px; font-size: 13.5px; border: 1px solid {{v.bd}}; background: {{v.bg}}; color: {{v.col}};">{{v.t}}</button></sc-for></div>
<span class="lab" style="margin-top: 18px;">Taille</span>
<div style="display: flex; flex-wrap: wrap; gap: 8px;"><sc-for list="{{tailles}}" as="v" hint-placeholder-count="5"><button onClick="{{v.pick}}" class="chip" style="height: 36px; font-size: 13.5px; border: 1px solid {{v.bd}}; background: {{v.bg}}; color: {{v.col}};">{{v.t}}</button></sc-for></div>
<p class="meta" style="margin-top: 14px; line-height: 1.5;">Jumanly vérifie la page sous 48 h. Vous pourrez publier dès maintenant.</p>
<button onClick="{{creerEnt}}" class="bp" style="margin-top: 14px;">Créer la page</button>
<button onClick="{{fermer}}" class="annuler">Annuler</button>
</div>
</div>
</sc-if>

<sc-if value="{{orbi}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; z-index: 10;">
<button onClick="{{fermerOrbi}}" aria-label="Fermer Orbi" class="voile"></button>
<div class="feuille"><span class="poignee"></span>
<div style="display: flex; align-items: center; gap: 12px;">%ORBI42%<span style="flex: 1;"><b style="display: block; font-size: 17px;">Votre accroche</b><span class="meta">Orbi · trois propositions, vous choisissez</span></span>
<button onClick="{{fermerOrbi}}" aria-label="Fermer" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #8FA39E;">%CROIX%</button></div>
<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px;"><sc-for list="{{titresOrbi}}" as="q" hint-placeholder-count="3"><button onClick="{{q.pick}}" class="q" style="line-height: 1.45;">{{q.t}}</button></sc-for></div>
</div>
</div>
</sc-if>

'''
src = src[:C0] + FEUILLES + src[C1:]
src = src.replace('<b style="flex: 1; font-size: 17px; padding-left: 4px;">Votre pays</b>', '<b style="flex: 1; font-size: 17px; padding-left: 4px;">{{paysTitre}}</b>')
src = src.replace('<span class="flag" style="background: {{x.flag}};"></span><span style="flex: 1;">{{x.t}}</span>', '<span class="flag" style="background: {{x.flag}};"></span><span style="flex: 1;">{{x.t}}</span><span class="meta" style="margin-right: 8px;">{{x.ind}}</span>')

# ---------- props, remplacements, pages ----------
src = src.replace("'feuille': {'editor': 'enum', 'options': ['aucune', 'compte', 'legal', 'pays', 'photo', 'cv', 'systeme'], 'default': 'aucune'},",
                  "'feuille': {'editor': 'enum', 'options': ['aucune', 'compte', 'legal', 'pays', 'indicatif', 'photo', 'demande', 'creer', 'systeme'], 'default': 'aucune'}, 'entEtat': {'editor': 'enum', 'options': ['', 'choisie', 'attente', 'acceptee', 'creee', 'indep'], 'default': ''}, 'entTexte': {'editor': 'boolean', 'default': False},")
src = src.replace("'orbi': {'editor': 'boolean', 'default': False}, 'gout': {'editor': 'enum', 'options': ['', 'chiffres', 'gens', 'creer'], 'default': ''},", "'orbi': {'editor': 'boolean', 'default': False},")
src = src.replace("    '%TOGGLE_BOUGER%': toggle('bouger', 'bougerBg', 'bougerX', 'basculerBouger', 'Je peux déménager'),",
                  "    '%TOGGLE_WA%': toggle('wa', 'waBg', 'waX', 'basculerWa', 'Numéro sur WhatsApp'), '%TOGGLE_BADGE%': toggle('badge', 'badgeBg', 'badgeX', 'basculerBadge', 'Afficher Recrute en ce moment'),\n"
                  "    '%PORTRAIT104%': PORTRAIT(104), '%PORTRAIT64%': PORTRAIT(64), '%PORTRAIT102%': PORTRAIT(102),\n"
                  "    '%MAILP%': ico('M4 6h16v12H4zM4 7l8 6 8-6', 16, '1.8'), '%TELP%': ico('M6.5 3.5h3l1.5 4-2 1.2a11 11 0 0 0 5.3 5.3l1.2-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4.5 5.5a2 2 0 0 1 2-2z', 16, '1.8'),")
src = src.replace("open(os.path.join(P, 'Accueil.dc.html'), 'w').write(out)", "open(os.path.join(P, 'Recruteur-accueil.dc.html'), 'w').write(out)")
src = src.replace('<dc-import name="Accueil" {attrs}', '<dc-import name="Recruteur-accueil" {attrs}')
i = src.index('R = {\'rempli\': \'true\'}'); j = src.index('for fn, t, pr in PAGES_A + PAGES_B:')
src = src[:i] + '''R = {'rempli': 'true'}
PAGES_A = [
    ('Recruteur-ouverture.dc.html', 'Ouverture · Logo animé', {'auto': 'false'}),
    ('Recruteur-bienvenue.dc.html', 'Bienvenue 1/3 · Publier', {'vue': 'bienvenue'}),
    ('Recruteur-bienvenue-2.dc.html', 'Bienvenue 2/3 · Trier', {'vue': 'bienvenue', 'slide': '1'}),
    ('Recruteur-bienvenue-3.dc.html', 'Bienvenue 3/3 · Recruter', {'vue': 'bienvenue', 'slide': '2'}),
    ('Recruteur-inscription.dc.html', 'Inscription · Compte recruteur', {'vue': 'inscription'}),
    ('Recruteur-google.dc.html', 'Inscription · Compte Google', {'vue': 'inscription', 'feuille': 'compte'}),
    ('Recruteur-linkedin.dc.html', 'Inscription · LinkedIn avec le poste', {'vue': 'inscription', 'feuille': 'compte', 'fournisseur': 'linkedin'}),
    ('Recruteur-conditions.dc.html', 'Inscription · Conditions recruteur', {'vue': 'inscription', 'feuille': 'legal'}),
    ('Recruteur-code.dc.html', 'Inscription · Code reçu', {'vue': 'code', **R}),
    ('Recruteur-motdepasse.dc.html', 'Inscription · Mot de passe', {'vue': 'motdepasse', **R}),
    ('Recruteur-connexion.dc.html', 'Se connecter', {'vue': 'connexion'}),
    ('Recruteur-oubli.dc.html', 'Mot de passe oublié · lien envoyé', {'vue': 'oubli', 'envoye': 'true'}),
]
PAGES_B = [
    ('Recruteur-profil-vous.dc.html', 'Profil 1/7 · Nom et photo', {'vue': 'profil', 'etape': '1', **R}),
    ('Recruteur-profil-ville.dc.html', 'Profil 2/7 · Pays et villes', {'vue': 'profil', 'etape': '2', **R}),
    ('Recruteur-profil-pays.dc.html', 'Profil 2/7 · Liste des pays', {'vue': 'profil', 'etape': '2', 'feuille': 'pays', **R}),
    ('Recruteur-profil-contacts.dc.html', 'Profil 3/7 · Contacts', {'vue': 'profil', 'etape': '3', **R}),
    ('Recruteur-profil-indicatif.dc.html', 'Profil 3/7 · Indicatif du téléphone', {'vue': 'profil', 'etape': '3', 'feuille': 'indicatif', **R}),
    ('Recruteur-profil-role.dc.html', 'Profil 4/7 · Rôle et poste', {'vue': 'profil', 'etape': '4', **R}),
    ('Recruteur-profil-entreprise.dc.html', 'Profil 5/7 · Rechercher l’entreprise', {'vue': 'profil', 'etape': '5', 'entTexte': 'true', 'rempli': 'false'}),
    ('Recruteur-profil-entreprise-trouvee.dc.html', 'Profil 5/7 · Entreprise sur Jumanly', {'vue': 'profil', 'etape': '5', **R, 'entEtat': 'choisie'}),
    ('Recruteur-profil-demande.dc.html', 'Profil 5/7 · Demande de rattachement', {'vue': 'profil', 'etape': '5', **R, 'entEtat': 'choisie', 'feuille': 'demande'}),
    ('Recruteur-profil-attente.dc.html', 'Profil 5/7 · Demande envoyée', {'vue': 'profil', 'etape': '5', **R, 'entEtat': 'attente'}),
    ('Recruteur-profil-creer.dc.html', 'Profil 5/7 · Créer la page entreprise', {'vue': 'profil', 'etape': '5', 'feuille': 'creer'}),
    ('Recruteur-profil-recrute.dc.html', 'Profil 6/7 · Ce que vous recrutez', {'vue': 'profil', 'etape': '6', **R}),
    ('Recruteur-profil-apercu.dc.html', 'Profil 7/7 · Profil recruteur', {'vue': 'profil', 'etape': '7', **R}),
    ('Recruteur-profil-orbi.dc.html', 'Profil 7/7 · Orbi propose une accroche', {'vue': 'profil', 'etape': '7', 'orbi': 'true', **R}),
    ('Recruteur-notifications-activer.dc.html', 'Notifications · Activer', {'vue': 'notifs', **R}),
    ('Recruteur-pret.dc.html', 'Profil prêt · logo en attente', {'vue': 'pret', **R}),
    ('Recruteur-pret-accepte.dc.html', 'Profil prêt · rattachement accepté', {'vue': 'pret', **R, 'entEtat': 'acceptee'}),
]
''' + src[j:]
src = src.replace("open(os.path.join(D, 'accueil_pages.json'), 'w')", "open(os.path.join(D, 'r_accueil_pages.json'), 'w')")
src = src.replace('_p = os.path.join(P, "Accueil.dc.html")', '_p = os.path.join(P, "Recruteur-accueil.dc.html")')
exec(compile(src, 'gen_r_accueil(gen_accueil)', 'exec'))
