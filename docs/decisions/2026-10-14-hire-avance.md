# 2026-10-14 · Hire avancé et Companies (E8)

Statut : accepté.

1. **Entités et filiales** : une table `OrgEntity` (arborescence par `parentId`) à l'intérieur de
   l'organisation, pas des organisations enfants. L'isolation par `organizationId` (règle d'or
   n° 6) reste entière ; une filiale n'a pas d'abonnement propre. Réservé à `org.entities`.
2. **Portée des offres** : propriétaire, administrateur et lecteur voient toutes les offres ; un
   responsable du recrutement ne voit que les offres dont il est responsable ou membre de l'équipe
   de recrutement ; un recruteur rattaché à une équipe ne voit que les offres de son équipe, les
   siennes et celles qui lui sont attribuées, mais seulement au niveau `org.permissions.level`
   « advanced ». Sans équipe, ou en dessous, il voit tout (comportement d'E4).
3. **Notes** : sans `hire.collaboration`, chacun ne voit que ses propres notes (« notes partagées »
   est une fonction de forfait). Seul l'auteur modifie ou supprime une note.
4. **Grilles d'évaluation** : modèle par offre (un critère par ligne, 10 au plus) ; sans modèle,
   les compétences indispensables de l'offre. Les avis des autres restent masqués tant que l'on
   n'a pas rendu le sien.
5. **Viviers** : réservés à `hire.shortlist` ; partage avec l'équipe ou l'organisation réservé à
   `org.talent_pools.shared`. Un talent redevenu privé disparaît des viviers, sauf s'il a postulé.
6. **Recherche de talents** : une recherche du quota par requête distincte (filtres hors page) et
   par période ; les pages suivantes et un rechargement ne coûtent rien. Pages limitées à 5 × 20,
   aucun export de profils. Plus de 60 profils ouverts en une heure : pause, journal d'audit
   `security.abnormalUsage` et alerte aux administrateurs de la plateforme.
7. **Mises en relation** : message de 20 caractères au moins, expiration à 14 jours (constatée à la
   lecture, sans tâche de fond), 30 jours d'attente après un refus, blocage définitif par le talent.
   Rien n'est échangé avant l'accord ; l'accord ouvre une conversation `contact_request`.
8. **Entretiens** : 1 à 3 créneaux, saisis dans le fuseau `DEFAULT_TIME_ZONE` (l'utilisateur n'a
   pas encore de fuseau propre) et affichés dans le fuseau de l'organisateur. Le lien de visio est
   montré au talent 24 h avant. Pas d'export agenda (.ics) pour l'instant.
9. **Rapports** : chaque niveau de `reports.level` ajoute des sections ; « personnalisé » est une
   ventilation par entité et une note invitant à nous écrire (pas d'éditeur de tableau de bord).
   Export CSV et PDF réservé à `reports.export`, journalisé. L'historique d'une candidature reste
   visible ; son export CSV est réservé à `hire.decision_history`.
10. **Vérification d'entreprise** : les pièces sont des champs texte (immatriculation, numéro
    fiscal, e-mail sur le domaine, fonction). Pas de téléversement ni de code envoyé au domaine
    pour l'instant ; l'administrateur contrôle à la main. Le statut « à renouveler » n'est pas
    encore calculé. Délai annoncé : 3 jours ouvrés (`VERIFICATION_DAYS`).
11. **Company Premium** : ses limites sont « selon contrat » ; sans dérogation, elles valent 0. Le
    groupe de démonstration reçoit des dérogations fictives (« Démo : contrat fictif »).
12. **Demande de devis** : la page `/contact?sujet=devis` existante, liée depuis l'onglet Entités.
