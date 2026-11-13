# Cadre Jumanly Hire v3 (lot V3-1)

- **Préfixe `:where(.hv3)`** plutôt que `.hv3` : le brief demande un préfixe unique sans changer
  les valeurs ; `:where()` garde aussi la spécificité du prototype, donc l'ordre des règles reste
  celui du prototype. `:root`, `html` et `body` deviennent `.hv3` ; `html[data-theme=dark]` devient
  `html[data-theme=dark] .hv3`. Les `@keyframes` sont globales : elles sont renommées `hv3-…` pour
  ne pas écraser celles de l'application (`fade`, `pop`, `toast`…).
- **Cadre posé en position fixe** : l'application garde sa couche de pages qui défile (`#content`,
  coque du Modèle B, qui porte Orbi, les notifications et le préchargement). La barre du haut et le
  rail sont placés aux mesures exactes de la version compacte du prototype (12 px, 16 px, 44 px,
  46 px, écarts 14/18 px) ; la page commence au même endroit. Écart assumé : la barre du haut reste
  visible quand on fait défiler la page (dans le prototype, elle part avec la page).
- **Écrans pas encore redessinés** : ils restent dans le cadre v3, avec les couleurs du prototype en
  clair et en sombre, jusqu'à leur lot (V3-2 à V3-6). La feuille v3 ne s'applique qu'aux éléments
  sous `.hv3` (cadre et pages v3), pour ne pas casser ces écrans (collisions de classes comme
  `.grid` ou `.p-1` avec Tailwind).
- **Rail** : « Tests » et « Suivi automatique » rejoindront le rail avec leurs écrans (V3-3 et
  V3-4) ; l'action rapide « Créer un test » de la recherche aussi. Pas de lien vers une page qui
  n'existe pas encore.
- **Mode sombre** : `User.appearance` (déjà en base, aucune migration) ; « Auto » s'affiche en
  clair, comme le prototype par défaut.
- **Cadre réservé au mode `hire`**, comme au lot M0 : en mode `full`, rien ne change.
