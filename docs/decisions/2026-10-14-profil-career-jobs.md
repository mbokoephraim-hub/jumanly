# 2026-10-14 · Profil, Career et candidatures (E3)

Statut : accepté.

1. **Le CV se remplit depuis le profil.** Le contenu des sections (expériences, formations,
   compétences, langues) est copié du profil ; l'éditeur règle le titre, le résumé, l'ordre et
   l'affichage des sections, et le modèle. Un seul endroit à tenir à jour, et le profil reste la
   source du matching. L'édition libre section par section pourra venir avec le coach IA (E6).
2. **Trois modèles de CV** (classique, moderne, compact), en Helvetica, lisibles par les logiciels
   de recrutement. Le droit `career.cv.templates.max` ouvre les premiers de la liste ; une valeur
   supérieure au nombre de modèles ouvre tout. Au plus 10 CV par personne, quel que soit le forfait.
3. **Reportés** : photo de profil et sur le CV, import d'un CV existant (PDF ou Word), lien de
   partage, export Word, alertes d'offres, carte IA et score de compatibilité (E6). Les écrans
   n'affichent rien de ce qui n'existe pas encore ; le score a un emplacement réservé qui le dit.
4. **Fiches conseils** : aucun contenu n'existe ; la carte Career est marquée « Bientôt disponible »
   et les étapes du diagnostic renvoient vers Career ou le profil. Le contenu est à fournir par
   The Growth Lab (règle d'or n° 11 : rien d'inventé).
5. **Diagnostic simplifié sur une seule page** : les 12 questions dans un formulaire HTML natif,
   sans JavaScript, utilisable sur réseau lent. Le résultat vient de règles fixes
   (`simpleDiagnostic`), aucune IA. Le diagnostic personnalisé arrive en E6.
6. **Candidater ne consulte jamais le moteur de droits.** Ni le service ni l'action n'importent
   `@/server/entitlements` ; un test le vérifie, et un autre postule avec chaque forfait talent de
   la base, puis avec `jobs.apply` à faux et tous les quotas à zéro.
7. **Copie du CV à l'envoi** : la candidature garde le contenu du CV au moment de l'envoi
   (`cvSnapshot`). Modifier ou supprimer le CV ensuite ne change pas ce que le recruteur a reçu.
8. **Étapes de recrutement par défaut** (nouvelle, présélection, entretien, offre, recruté, non
   retenu) créées à la première candidature ; le recruteur pourra les modifier en E4.
