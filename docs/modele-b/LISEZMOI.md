# Jumanly · Modèle B (espace talent mobile), 21/10/2026

Journal de conception. Déposé dans le dépôt le 21/10/2026 ; la référence pour coder est `BRIEF-MODELE-B-CLAUDE-CODE.md` (il l'emporte sur ce journal). Les chemins `source/` de ce journal correspondent à `maquette/` ici. Maquette interactive : https://claude.ai/artifact/LVFeBq5dTarRKCSukqKPjy

## Navigation proposée
Barre du bas à 5 onglets, Orbi flottant au-dessus, visible partout.

1. **Fil** : actualités des entreprises (recrutements, événements) et des talents (attestations, réalisations). Remplace les statistiques. Filtres Tout / Entreprises / Talents / Mes connexions.
2. **Explorer** : les offres en rangées horizontales, une rangée par domaine ou par secteur (bascule en haut). Première rangée « Pour vous ».
3. **Carrière** (ex-Progression) : en-tête profil (anneau 70 %, Cap), puis options horizontales Mon profil · Mes CV · Mon portfolio · Ma progression · Candidatures, le contenu change sur le même écran.
4. **Formation** : cours à reprendre, rangées horizontales (Pour votre Cap, Préparer l'emploi), attestations.
5. **Messages** : demandes de connexion en rangée, puis conversations.

**Orbi** : bouton rond en bas à droite + bulle qui propose une question adaptée à l'onglet. Au toucher, une feuille s'ouvre avec 4 questions suggérées et le champ « Écrire à Orbi ».
Avatar en haut à gauche → Mon profil. Notifications sur le Fil.

## Fichiers
source/ : canvas.json + 135 pages .dc.html (une page par onglet, les autres importent la page avec un écran fixé). source/generateurs/ : scripts qui produisent Fil, Personne, Formation et Messages (gen_*.py + *_logic.js), gouttiere_lib.py (marges 20 px), tg.js et bal.py (tests des clics et des balises).

## V2 du Fil (21/10/2026, retour d'Ephraïm)
Thème sombre (fond #0B1A1F), beaucoup moins d'icônes, Fil façon Threads : onglets texte Pour vous / Abonnements / Entreprises, publications en liste avec avatar, texte, photo, J'aime · Répondre · Republier. Détail d'une publication avec réponses, écran Nouvelle publication. Orbi passe en lime (disque lime, cœur sombre). Photos d'exemple : images-fil/ (envoyées par Ephraïm, à remplacer par de vrais visuels). Source : source/Fil.dc.html.

## Identité sombre de l'app (Fil validé le 21/10, « j'aime énormément »)
Ephraïm veut cette direction sur TOUTES les pages, étape par étape. Planche source/Identite.dc.html : Nuit #0B1A1F fond, Surface #13282C, Surface haute #1B3338, Crème #F2EDE5 texte, Brume #8FA39E secondaire, Lime #A6F26B seule couleur d'action ; étiquettes Entreprise (lime), Nouveau poste (menthe #5FE0B8), Réalisation (ambre #F4C463), Alerte (corail #F08A7C). Sora 28/17/15/13. Icônes rares, un seul bouton plein lime par écran, listes à filet façon Threads, cartes seulement pour offres et cours, Orbi lime partout.
Étape 2 : Offres (source/Offres.dc.html) : Explorer (par domaine / par secteur, filtres texte, Pour vous), détail avec « 86 % pour vous » expliqué par Orbi, postuler (choix du CV, mot au recruteur, confirmation).
Suite prévue : Messages, Progression, Formation, Orbi en conversation.

## Explorer V3 (21/10, modèle envoyé par Ephraïm : references/modele-explorer.jpg)
En-tête avatar · titre centré · une icône ; recherche en pilule ; sections « titre + Tout voir » ; ligne de filtres en pilules contour (actif crème) ; grandes cartes : couverture couleur de l'entreprise avec logo blanc au centre, titre, entreprise + coche vérifiée, VILLE en capitales, étiquettes grises rectangulaires + score lime ; « Entreprises qui recrutent » en grandes photos avec nom en surimpression. Fond plus noir (#070F12).

## Explorer = offres + entreprises + personnes (21/10, modèles references/modele-profil-1..5.jpg)
Explorer : filtres Tout / Offres / Entreprises / Personnes ; « Personnes à connaître » en liste (avatar, nom, rôle, info, bouton Se connecter lime).
Profil entreprise (source/Entreprise.dc.html, Baobab Fintech) : bannière photo, logo, coche vérifiée, @nom, Message + Suivre, bio, employés / abonnés / offres ; onglets Publications · À propos (description, en bref : taille, secteur, siège, fondée ; domaines ; liens ; membres) · Offres · Membres (recherche, Se connecter / Message).
Profil personne (source/Personne.dc.html, Patrick Ilunga) : bannière, photo, vérifié, poste, connexions ; onglets Publications · À propos (bio, compétences, expérience, formation, langues) · Réalisations. Le bouton Message n'apparaît qu'une fois la connexion acceptée (règle existante).
Chemin : Explorer › carte offre › détail › « Voir la page » › entreprise › Membres › personne.

## Orbi, nouvelle couleur et icône (21/10)
Appliqué : disque Menthe IA #2FD3A6, étincelle à 4 branches couleur nuit, petit point crème (plus de lime : le lime reste réservé aux boutons). Variantes B (bulle crème) et C (visage violet) sur source/Orbi-options.dc.html.

## Carrière (ex-Progression), 21/10
Décisions d'Ephraïm : l'onglet Progression s'appelle désormais CARRIÈRE, icône sac de travail ; la barre du bas n'a PLUS DE NOMS, icônes seules (point lime sous l'icône active).
Page source/Carriere.dc.html : en-tête façon profil (bannière, avatar, Partager / Modifier, Cap, profil complété), onglets texte horizontaux Profil · CV · Portfolio · Progression · Candidatures ; listes à filet, Orbi en encadré menthe.

## Carrière : chaque clic mène à un écran (21/10/2026)
Carriere.dc.html est une seule machine à états (pile d'écrans + feuilles + message de confirmation), avec un retour partout.
Photo de profil et bannière de Grâce : source/images-profil/.
Quatre rangées d'étapes sur le canvas (Carriere-*.dc.html) :
1. Profil : partager, modifier (nom, photo, bannière, bio), À propos réécrit par Orbi, expérience modifiée/ajoutée avec correction Orbi, formation, compétences, langues.
2. Paramètres : abonnement Free/Starter/Pro/Premium, paiement Mobile Money, confidentialité, notifications, aide (e-mail seulement), déconnexion.
3. CV : nouveau (modèle, import, Orbi), modèle, éditeur avec aperçu et vérification Orbi, actions, export PDF/Word, import en 3 étapes, adaptation à une offre.
4. Portfolio et candidatures : détail, ajout, suppression, candidature avec préparation Orbi, message à la recruteuse, retrait.

## Ancien modèle clair retiré (21/10/2026)
À la demande d'Ephraïm, les écrans blancs de la première version ont été supprimés du canvas et des sources. Seul le modèle sombre reste.

## Messages (21/10/2026)
Messages.dc.html : messagerie avec les connexions seulement, en trois onglets (Connexions, Recruteurs, Entreprises), recherche en haut, pastilles de non-lus (2, 9, 1, 2) et demandes de connexion.
Discussion : en-tête (nom, vérifié, en ligne) qui ouvre les infos ; menu ··· (profil, rechercher, médias liens et documents, silencieux, éphémères, Plus : bloquer, effacer, exporter, raccourci).
Écrire : Orbi dans le champ (réponse, plus pro, plus court, fautes, anglais), note vocale, appareil photo, épingle (documents, CV, lettre, contact, agenda, organisation + photos récentes, sélection multiple, HD, annuler).
Généré par generateurs/gen_messages.py + messages_logic.js. Artboards Messages-*.dc.html = chaque étape.

## Plan de correction appliqué (21/10/2026, validé par Ephraïm)
1. Aucun clic vide dans le Fil, Explorer et les profils : menus ···, signaler, republier/citer/envoyer, « Tout voir » (4 listes), offres enregistrées, réponses d'Orbi, Publier avec pièces jointes.
2. Page Notifications reliée à la cloche du Fil (Tout / Candidatures / Offres / Réseau, tout marquer comme lu).
3. Un profil par personne (Personne-*.dc.html, 15 personnes), même poste, entreprise et photo partout ; Baobab = 8 offres partout ; membres de Baobab alignés.
4. Style harmonisé : marges 20 px, fond #0B1A1F, même barre du bas, icônes 24 px.
5. « Progression » devient « Carrière » partout ; planche Identite mise à jour (aucun clic vide, recherche en deux temps, marge 20 px, barre en icônes seules).
6. Formation : accueil (Continuer, conseil Orbi, Pour vous / Mes cours / Attestations), recherche en deux temps, cours, cours payant (abonnement), leçon avec question rapide, attestation (profil, Fil, télécharger), Orbi. Pages Formation-*.dc.html.
Limite connue : après la fin de Power BI, la carte « Continuer » affiche toujours Power BI.

## Ouverture, inscription et profil (21/10/2026)
Page source/Accueil.dc.html (générée par generateurs/gen_accueil.py + accueil_logic.js), artboards Accueil-*.dc.html, deux rangées en bas du canvas.
- Ouverture : le carré lime apparaît en rebond, le J se dessine, la tête tombe, le symbole glisse et « jumanly » se révèle, le point lime éclate, puis « Learn. Grow. Connect. » mot par mot et « Une plateforme développée par The Growth Lab » (3,9 s). Ouverture courte (1,7 s) les fois suivantes. Animations coupées si l'utilisateur réduit les animations.
- Bienvenue : 3 écrans Learn / Grow / Connect avec cartes animées, Créer un compte, Se connecter.
- Inscription : Google, Apple, LinkedIn (choix du compte) ou e-mail, code à 6 chiffres, mot de passe avec règles en direct. Connexion avec mot de passe enregistré, mot de passe oublié. Conditions et confidentialité en 3 points.
- Détails du profil en 6 étapes : nom, photo (vérifiée par Orbi), pays (drapeaux, recherche) et ville, situation, Cap (recherche de métier ou Orbi qui propose), compétences (au moins 3, import du CV par Orbi). Puis notifications et « Profil prêt » à 40 % avec liens vers Carrière, Formation, Explorer et le Fil.
- Carrière › Se déconnecter › Se reconnecter mène maintenant à la page de connexion.
Captures de contrôle : captures-accueil/ (rendu local, les photos n'y apparaissent pas mais sont bien sur le canvas). generateurs/rendu.js fait ces captures.

## Simulation d'entretien avec Orbi, écrite et vocale (21/10/2026)
Page source/Entretien.dc.html (generateurs/gen_entretien.py + entretien_logic.js), artboards Entretien-*.dc.html.
Entrées : Carrière › Candidature › « S'entraîner avec Orbi » ; panneau Orbi de la candidature (« Par écrit » ou « À l'oral ») ; Formation › « Répéter avec Orbi ».
Réglages : par écrit (dès Starter) ou à l'oral (dès Pro) ; 5, 10 ou 15 min (3, 6 ou 9 questions) ; focus : entretien complet, mes expériences, questions techniques, motivation et entreprise, mises en situation (Pro), questions pièges (Pro), entretien en anglais (Pro) ; ton bienveillant ou exigeant. En Free : un essai offert de 5 min (proposition, à confirmer), le reste ouvre la feuille « inclus dans Pro » › Carrière › Ma formule.
Parcours : Orbi télécharge les questions (offre + CV, fonctionne sans connexion) › test du micro et texte des questions › entretien : Orbi pose la question à voix haute (synthèse vocale du navigateur), « À vous », relance (« un chiffre précis ? »), Répéter, Indice (méthode STAR), Son, Pause, Terminer › Orbi analyse › bilan sur 100 (clarté, exemples concrets, lien avec l'offre, aisance à l'oral : débit et « euh ») › détail de chaque réponse (écouter, ce qui marche, à améliorer, conseil) › refaire une question, les 2 faibles, ou une nouvelle simulation. Historique « Mes simulations ». Rien n'est jamais montré au recruteur.
Retours : pendant les réglages, retour d'une page (questions › réglages › page d'origine : candidature, panneau Orbi ou Formation). Pendant l'entretien, pas de flèche : Pause ou Terminer, qui propose « voir le bilan », « arrêter sans bilan » ou « continuer ». Depuis le bilan, la croix ramène directement à la candidature (ou à Formation si on venait de là), car la simulation est finie. Détail d'une réponse › Bilan ; Mes simulations › Réglages.

## Transitions (21/10/2026)
Règle : l'écran d'avant reste affiché jusqu'à ce que le nouveau le recouvre. Jamais de fond vide ni de noir. 250 à 400 ms, courbe douce.
- Approche (340 ms, partout) : le nouvel écran arrive en léger zoom (97,5 % → 100 %) depuis 40 % d'opacité, sur le même fond Nuit.
- Feuille (340 ms, partout) : le voile s'assombrit en fondu, la feuille monte du bas.
- Passage d'onglet (320 ms) : artboard « Application », les 5 onglets restent chargés ; le nouveau se pose par-dessus l'ancien en glissant de 22 px.
- Pour l'appli réelle : ouverture de carte (380 ms), retour (300 ms, la page part à droite), Orbi s'ouvre (400 ms, le disque grandit).
- Limite du canvas : passer d'une planche à une autre reste un changement géré par le canvas (bref noir possible), à ne pas reproduire dans l'appli.
Sources : source/transitions_lib.py (appliqué par chaque générateur), gen_coque.py, gen_transitions.py.

## Préchargement (21/10/2026)
Demande d'Ephraïm : aucun petit chargement d'une ou deux secondes en changeant d'onglet.
- À l'ouverture (1,2 s) : LOGO SEUL, sans barre, sans icônes, sans texte (décision d'Ephraïm). Derrière, les 5 onglets et toutes les images se chargent ; le logo s'efface en fondu sur le Fil déjà affiché.
- Pendant l'usage : les onglets restent en mémoire (on revient à l'endroit laissé), rien ne se recharge.
- Pour l'appli réelle : précharger la page d'une offre, d'un cours ou d'un profil dès que sa carte apparaît à l'écran ; montrer le dernier contenu connu puis le remplacer en silence ; jamais de roue qui tourne ; pages déjà vues consultables sans réseau.
Artboard Application (prop ouverture=false pour la sauter), planche Transitions (bloc Préchargement).

## Canvas rangé et transitions partout (21/10/2026)
Le canvas suit maintenant le parcours, en 21 rangées numérotées : 01 Identité, Orbi et mouvement · 02 Ouverture et inscription · 03 Profil en 6 étapes · 04 Application · 05-06 Fil · 07-08 Explorer · 09-10 Profils · 11-15 Carrière · 16 Entretien · 17 Formation · 18-21 Messages. Chaque recherche est rangée avec sa page.
Les 6 transitions sont actives dans toutes les pages (transitions_lib.py v2) : une seule animation d'entrée, dont le point de départ dépend du geste.
- Bouton ordinaire : Approche, zoom 97,5 % depuis le doigt.
- Grande carte (≥ 160 × 64 px) : ouverture de carte, zoom 92 % depuis la carte, 380 ms.
- Chevron retour : la page précédente revient de la gauche (−22 px), 300 ms.
- Bouton Orbi (disque menthe) : l'écran s'ouvre en cercle depuis le disque, 400 ms.
- Feuilles : le voile s'assombrit, la feuille monte. Onglets : superposition dans Application.
Les profils (Personne, Entreprise) ont aussi leur entrée. Seul le passage d'une planche à une autre reste géré par le canvas.
