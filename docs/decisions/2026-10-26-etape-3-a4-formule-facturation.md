# Étape 3 · A4 : Formule et facturation (26 octobre 2026)

Capture 083 de `docs/modele-b-recruteur/web/`.

1. **Adresse.** Nouvel écran `/app/organisation/facturation`, réservé au propriétaire et aux
   administrateurs, comme Équipe et Page entreprise. Le lien « Formule et facturation » de la section
   ENTREPRISE y mène (il menait à `/app/abonnement`). `/app/abonnement` reste en place pour les autres
   espaces ; son volet organisation sera retiré en A6.
2. **Qui paie.** Le propriétaire **et les administrateurs** paient pour l'organisation (l'ancien écran
   réservait le paiement au seul propriétaire). Le paiement est prépayé, par M-Pesa, Orange Money,
   Airtel Money ou carte, avec la même fenêtre sombre que l'inscription (A1). La réponse du prestataire
   reste la seule source de vérité.
3. **Changer de formule.** Les cartes sont les formules Company en base, comparées par prix et par
   droits, jamais par nom. Monter en gamme se paie tout de suite, moins les jours non utilisés de la
   formule en cours (partie 09 § 9.2) ; réduire est programmé pour la fin de la période payée, avec une
   fenêtre de confirmation, et peut être annulé (« Garder … »). Une formule sans prix (Company Premium)
   mène à « Demander un devis » (`/contact?sujet=devis`). Chaque changement programmé ou annulé est noté
   au journal d'audit (`org.plan.downgrade_scheduled`, `org.plan.downgrade_canceled`).
4. **Usage ce mois.** Cinq jauges : utilisateurs (membres et invitations en attente contre `org.seats`),
   offres en ligne (`jobs.active.max`), recherches de talents, demandes de mise en relation et crédits
   Orbi (quotas mensuels). Un droit « contrat » sans accord affiché compte pour 0.
5. **Export des rapports.** Décision d'Ephraïm du 22/10/2026 : `reports.export` est ouvert à toutes
   les formules Company. Le tableau de la partie 05 est corrigé, le seed aussi, et une migration de
   données (`company_reports_export`) met la valeur à jour dans les bases existantes. Les textes des
   cartes suivent : Company cite « export des rapports », Company Plus « rapports consolidés »
   (`reports.level`), Company Premium ajoute « accompagnement » comme sur la maquette.
6. **Factures.** Le tableau donne numéro, date, montant et moyen de paiement ; le chevron télécharge le
   PDF par `/app/organisation/facturation/factures/[id]/pdf`, qui ne sert que les factures de
   l'organisation de l'espace actif, à ses administrateurs. Les numéros gardent le format de la
   partie 09 (`JMN-2026-000016`), pas celui de la maquette. Aucun numéro de téléphone sur la facture.
7. **Démo.** Baobab Fintech (fictive) prépaie Company depuis trois mois (deux fois M-Pesa, une fois par
   carte), avec ses factures et l'usage du mois de la capture ; local et previews seulement.
