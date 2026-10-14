# Déploiement sur Hostinger avec npm

Hostinger (offre Unlimited Web Hosting) installe et construit les applications Node.js avec npm ;
pnpm reste l'outil du projet en local et en CI. Le projet doit donc rester installable par npm
(pas de conflit de dépendances paires, aucun script de build qui appelle `pnpm`).
Le script `build:hostinger` applique les migrations et le seed (sans démo) avant `next build`,
car le build lit la base. Aucun `package-lock.json` n'est versionné : npm résout les versions
depuis `package.json` à chaque déploiement.
