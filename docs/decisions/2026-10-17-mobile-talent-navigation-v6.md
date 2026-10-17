# 2026-10-17 · Navigation mobile Talent V6 (prompt 2 bis)

Contexte : V6 § B2-B8, V7 § B1-B2 et B10, écrans 03, 13, 18, 34, 57 à 62.

- **Cinq onglets**, Pour moi au centre, Compte au bout. Career reste dans la colonne d'ordinateur et
  dans Mon espace (aucune route supprimée).
- **Menu du haut** : il remplace le menu de l'avatar. La déconnexion est en bas de Compte.
- **Thème Vert** : appliqué sur téléphone seulement, comme les maquettes ; l'ordinateur garde le
  thème clair. Choix gardé en base (`User.theme`, `light` par défaut) ; Sapin sur Lime, jamais blanc.
- **Orbi** : la ligne « Demander à Orbi » de la recherche et la carte du menu sont inactives et
  marquées « Bientôt disponible » jusqu'au prompt 7. La recherche cherche réellement offres et
  formations (`/api/recherche/apercu`, connecté seulement, rien de mis en cache).
- **Créer** : candidature, CV, lettre, entretien, expérience, Premium. Les tuiles « réalisation »
  attendent le prompt 10 (pas d'interface sans fonction derrière).
- **Protégez votre compte** : affiché quand la personne n'a pas de mot de passe (connexion Google,
  LinkedIn ou Apple). Le bouton mène au parcours de réinitialisation existant, qui crée le mot de
  passe : le système de connexion n'est pas modifié.
- **Ouverture** : `/ouverture` montre le logo (≈ 0,8 s, fixe en mouvement réduit), puis Pour moi si
  la personne est connectée, la connexion si ce téléphone a déjà vu l'accueil (`localStorage`), sinon
  l'accueil (écran 58). La puce « 3 offres pour vous » de la maquette devient « Des offres pour vous »
  (pas de chiffre inventé) ; les trois points de pagination ne sont pas repris (un seul écran).
- **Onglets Offres et Apprendre** : sur téléphone, leur ancien titre et leurs sous-rubriques sont
  masqués (le titre et la recherche de l'en-tête les remplacent) ; ils restent sur ordinateur et sur
  les autres pages de la rubrique.
- **Icônes** : `jm-menu` dessine le menu des maquettes (trois traits et un point Lime) ; l'ancienne
  icône devient `jm-liste` (vue liste de l'admin, menu du site public) ; ajout de `jm-retour`.
