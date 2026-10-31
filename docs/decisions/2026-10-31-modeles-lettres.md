# Modèles de lettres de motivation (31/10/2026)

- Six modèles à bandeau de couleur (src/features/letter), même mise en page à l'écran (LetterSheet, tailles en cqw) et dans le PDF (@react-pdf, src/server/pdf/letter-document.tsx) : pas de Chromium, l'export marche sans navigateur en production.
- Accès : on réutilise le droit `career.cv.templates.access` (niveau « free » pour le premier modèle, « starter » et plus pour les cinq autres) plutôt que de créer un nouveau droit en base.
- Le design est gardé dans `Document.style` de la lettre ({ template, color, photo, chosen }) : aucune migration.
- Coordonnées du bandeau : e-mail, ville et pays (jamais de numéro ni d'adresse précise).
