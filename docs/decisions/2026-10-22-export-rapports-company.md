# Export des rapports pour toutes les formules Company (22/10/2026)

Décision d'Ephraïm du 22/10/2026 : « toutes les compagnies peuvent télécharger ». Le droit `reports.export` (rapports en PDF et CSV) passe donc à ✓ pour Company, en plus de Company Plus et Company Premium. Les formules RH restent sans export.

- Partie 05 : la ligne `reports.export` de la matrice est mise à jour.
- `prisma/seed/plans.ts` : la valeur Company passe à `true`.
- Le seed ne réécrit jamais un droit qui existe déjà en base, car les droits se modifient dans l'admin. Sur une base déjà remplie (production, previews), il faut activer `reports.export` sur la formule Company depuis Admin > Forfaits.
- Pourquoi : les maquettes recruteur (mobile et web) montrent Baobab Fintech, en formule Company, en train de télécharger ses rapports en PDF.
