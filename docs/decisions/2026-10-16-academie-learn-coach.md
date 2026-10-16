# Académie Learn et Coach IA (16 octobre 2026)

Contexte : test utilisateur du 16 octobre (`/mnt/project-files/ux-test/`). Learn ressemblait à une bibliothèque ; le propriétaire demande une académie en six espaces et un assistant pédagogique.

Décisions :
- Six espaces dans les onglets de Learn : Mon espace (`/app/learn`), Explorer (`/app/learn/explorer`, l'ancien catalogue), Mes parcours (`/app/learn/parcours`), Exercices et évaluations (`/app/learn/evaluations`), Coach IA (`/app/learn/coach`), Certifications (`/app/learn/attestations`). Les anciennes adresses (`/app/learn?q=`, `?liste=`) redirigent. Les mots `explorer`, `parcours`, `evaluations` et `coach` ne peuvent plus servir de slug de formation.
- Le Coach IA est une nouvelle fonction d'IA `learn_coach` (1 crédit, modèle rapide) sans nouvelle clé de droit : il suffit d'être inscrit à une formation que le forfait ouvre (`learn.catalog.level`). Sans crédit, sans consentement ou si le modèle est indisponible, il répond avec les passages du cours eux-mêmes (aucun crédit, rien d'inventé) et le dit dans « Pourquoi ? ». Option la plus simple qui respecte les règles d'or ; une clé dédiée pourra être ajoutée dans la partie 05 si le propriétaire veut réserver la version IA.
- Garde-fous : le modèle ne reçoit que le texte des leçons, jamais les corrigés ni les explications des quiz ; une demande de réponses d'évaluation est refusée avant tout appel ; le Coach n'est pas proposé pendant un quiz.
