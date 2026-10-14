# Données de démonstration des modèles de CV (fictives). Même structure que le contenu JSON d'un CV dans l'application.
# Voir SPECIFICATION-MODELES-CV.md, partie 4 (schéma du contenu).

JUNIOR = {
    "langue": "fr",
    "info": {
        "prenom": "Grâce", "nom": "Mbuyi", "titre": "Analyste de données junior",
        "ville": "Kinshasa, RD Congo", "email": "grace.mbuyi@exemple.cd",
        "liens": [{"libelle": "LinkedIn", "url": "linkedin.com/in/grace-mbuyi"}, {"libelle": "Portfolio", "url": "grace-mbuyi.exemple.cd"}],
        "photo": True,
    },
    "profil": "Diplômée en sciences économiques, deux ans d'expérience en reporting commercial et financier. "
              "Je transforme des données brutes en tableaux de bord clairs qui aident les équipes à décider vite.",
    "points_forts": [],
    "sections": [
        {"type": "experience", "items": [
            {"titre": "Assistante reporting", "organisation": "Rawji Distribution", "lieu": "Kinshasa", "debut": "2024", "fin": "aujourd'hui",
             "puces": ["Produit chaque semaine le rapport de ventes de 12 points de vente pour la direction commerciale.",
                       "Réduit de 6 h à 1 h le suivi hebdomadaire des stocks en automatisant les classeurs Excel.",
                       "Conçu un tableau de bord Power BI consulté par 25 responsables de magasin."]},
            {"titre": "Stagiaire analyste", "organisation": "Banque Lumière d'Afrique", "lieu": "Kinshasa", "debut": "mars 2023", "fin": "août 2023",
             "puces": ["Nettoyé et consolidé les données clients de 3 agences (18 000 lignes).",
                       "Préparé les tableaux mensuels présentés au comité de crédit."]},
        ]},
        {"type": "formation", "items": [
            {"titre": "Licence en sciences économiques", "organisation": "Université de Kinshasa", "lieu": "Kinshasa", "debut": "2019", "fin": "2023",
             "texte": "Mention bien. Mémoire : « Prévoir la demande de crédit des PME à partir de leurs historiques de paiement »."},
        ]},
        {"type": "competences", "items": [
            {"nom": "Excel avancé", "niveau": 4, "groupe": "Outils"}, {"nom": "SQL", "niveau": 3, "groupe": "Données"},
            {"nom": "Power BI", "niveau": 3, "groupe": "Outils"}, {"nom": "Python (pandas)", "niveau": 2, "groupe": "Données"},
            {"nom": "Statistiques descriptives", "niveau": 3, "groupe": "Données"}, {"nom": "Présentation des résultats", "niveau": 3, "groupe": "Communication"},
        ]},
        {"type": "langues", "items": [
            {"nom": "Français", "niveau": "Langue maternelle", "note": 5}, {"nom": "Lingala", "niveau": "Langue maternelle", "note": 5},
            {"nom": "Anglais", "niveau": "B2, intermédiaire avancé", "note": 3},
        ]},
        {"type": "projets", "items": [
            {"titre": "Tableau de bord des prix du marché", "organisation": "Projet personnel", "debut": "2024", "fin": "",
             "texte": "Suivi hebdomadaire des prix de 20 produits de base sur 4 marchés de Kinshasa, publié en accès libre.", "outils": "Python · Power BI"},
        ]},
        {"type": "certificats", "items": [
            {"titre": "Power BI : du tableau au tableau de bord", "organisation": "Formation en ligne", "fin": "2026"},
        ]},
        {"type": "engagement", "items": [
            {"titre": "Animatrice bénévole", "organisation": "Club Data Kinshasa", "lieu": "", "debut": "2022", "fin": "aujourd'hui",
             "puces": ["Anime des ateliers Excel pour 60 étudiants par trimestre."]},
        ]},
        {"type": "interets", "items": [{"nom": "Basket-ball"}, {"nom": "Photographie urbaine"}, {"nom": "Mentorat"}]},
    ],
}

SENIOR = {
    "langue": "fr",
    "info": {
        "prenom": "Marie-Claire", "nom": "Nzeza", "titre": "Directrice des ressources humaines",
        "ville": "Abidjan, Côte d'Ivoire", "email": "mc.nzeza@exemple.ci",
        "liens": [{"libelle": "LinkedIn", "url": "linkedin.com/in/mc-nzeza"}],
        "photo": False,
    },
    "profil": "Dix-huit ans en ressources humaines dans la banque et les télécoms, dont huit à la tête d'équipes de 15 à 40 personnes. "
              "Je construis des fonctions RH qui recrutent vite, fidélisent les talents et accompagnent la croissance dans plusieurs pays.",
    "points_forts": ["Recrutement de 600 personnes en trois ans dans 5 pays, délai moyen ramené de 74 à 41 jours.",
                     "Taux de départ volontaire réduit de 19 % à 9 % grâce à un programme de carrière interne.",
                     "Déploiement d'un SIRH unique pour 3 200 collaborateurs dans 7 filiales."],
    "sections": [
        {"type": "experience", "items": [
            {"titre": "Directrice des ressources humaines Afrique de l'Ouest", "organisation": "Ouest Télécom", "lieu": "Abidjan", "debut": "2019", "fin": "aujourd'hui",
             "puces": ["Dirige une équipe de 38 personnes dans 5 pays et un budget RH de 4,2 millions USD.",
                       "Pilote le plan de recrutement régional : 600 embauches en trois ans, dont 45 % de femmes.",
                       "Négocie les accords sociaux avec les représentants du personnel dans 3 pays.",
                       "Lance l'académie interne de management, suivie par 180 encadrants."]},
            {"titre": "Responsable du développement des talents", "organisation": "Banque Atlantique du Golfe", "lieu": "Dakar", "debut": "2013", "fin": "2019",
             "puces": ["Crée le programme « Jeunes diplômés » : 120 recrues, 82 % encore en poste après trois ans.",
                       "Met en place les revues de talents annuelles pour 900 cadres.",
                       "Conduit la refonte de la grille des emplois et des rémunérations."]},
            {"titre": "Chargée de recrutement puis responsable RH d'agence", "organisation": "Banque Atlantique du Golfe", "lieu": "Dakar", "debut": "2008", "fin": "2013",
             "puces": ["Recrute 250 conseillers clientèle pour l'ouverture de 30 agences.", "Gère l'administration du personnel de 400 collaborateurs."]},
            {"titre": "Assistante ressources humaines", "organisation": "Cabinet Horizon Conseil", "lieu": "Dakar", "debut": "2006", "fin": "2008",
             "puces": ["Organise les campagnes de recrutement de 12 entreprises clientes."]},
        ]},
        {"type": "formation", "items": [
            {"titre": "Master en gestion des ressources humaines", "organisation": "Université Cheikh Anta Diop", "lieu": "Dakar", "debut": "2004", "fin": "2006", "texte": ""},
            {"titre": "Programme de leadership pour dirigeants", "organisation": "École de management, formation continue", "lieu": "", "debut": "", "fin": "2021", "texte": ""},
        ]},
        {"type": "competences", "items": [
            {"nom": "Stratégie RH", "niveau": 4, "groupe": "Direction"}, {"nom": "Recrutement à grande échelle", "niveau": 4, "groupe": "Direction"},
            {"nom": "Relations sociales", "niveau": 4, "groupe": "Direction"}, {"nom": "Gestion des talents", "niveau": 4, "groupe": "Direction"},
            {"nom": "SIRH", "niveau": 3, "groupe": "Outils"}, {"nom": "Rémunération et avantages", "niveau": 3, "groupe": "Direction"},
            {"nom": "Conduite du changement", "niveau": 4, "groupe": "Direction"}, {"nom": "Droit du travail OHADA", "niveau": 3, "groupe": "Direction"},
        ]},
        {"type": "langues", "items": [
            {"nom": "Français", "niveau": "Langue maternelle", "note": 5}, {"nom": "Anglais", "niveau": "C1, courant", "note": 4},
            {"nom": "Wolof", "niveau": "B1, conversation", "note": 2},
        ]},
        {"type": "certificats", "items": [
            {"titre": "Certification en gestion des talents", "organisation": "Association professionnelle RH", "fin": "2018"},
            {"titre": "Coach professionnelle certifiée", "organisation": "Institut de coaching", "fin": "2016"},
        ]},
        {"type": "engagement", "items": [
            {"titre": "Mentore", "organisation": "Réseau Femmes Dirigeantes", "lieu": "Abidjan", "debut": "2017", "fin": "aujourd'hui",
             "puces": ["Accompagne chaque année 6 jeunes femmes cadres dans leur prise de poste."]},
            {"titre": "Membre du jury", "organisation": "Concours national de l'entrepreneuriat", "lieu": "", "debut": "2020", "fin": "2023", "puces": []},
        ]},
        {"type": "interets", "items": [{"nom": "Course à pied"}, {"nom": "Littérature africaine"}]},
    ],
}

ACADEMIQUE = {
    "langue": "fr",
    "info": {
        "prenom": "Joseph", "nom": "Ilunga", "titre": "Enseignant-chercheur en économie du développement",
        "ville": "Lubumbashi, RD Congo", "email": "j.ilunga@exemple.cd",
        "liens": [{"libelle": "ORCID", "url": "orcid.org/0000-0000-0000-0000"}, {"libelle": "Site", "url": "jilunga.exemple.cd"}],
        "photo": False,
    },
    "profil": "Mes recherches portent sur l'inclusion financière, le Mobile Money et l'emploi des jeunes en Afrique centrale. "
              "J'enseigne la microéconomie et l'économétrie appliquée et j'encadre des mémoires de master et des thèses.",
    "points_forts": [],
    "sections": [
        {"type": "formation", "items": [
            {"titre": "Doctorat en sciences économiques", "organisation": "Université de Lubumbashi", "lieu": "Lubumbashi", "debut": "2012", "fin": "2016",
             "texte": "Thèse : « Paiements mobiles et épargne des ménages urbains ». Mention très honorable."},
            {"titre": "Master en économie appliquée", "organisation": "Université de Lubumbashi", "lieu": "Lubumbashi", "debut": "2010", "fin": "2012", "texte": ""},
            {"titre": "Licence en économie", "organisation": "Université de Kinshasa", "lieu": "Kinshasa", "debut": "2006", "fin": "2010", "texte": ""},
        ]},
        {"type": "experience", "items": [
            {"titre": "Professeur associé", "organisation": "Université de Lubumbashi, faculté des sciences économiques", "lieu": "Lubumbashi", "debut": "2021", "fin": "aujourd'hui",
             "puces": ["Enseigne la microéconomie (L2, 240 étudiants) et l'économétrie appliquée (M1).",
                       "Coordonne le master en économie du développement (45 étudiants par promotion).",
                       "Encadre 4 doctorants et 22 mémoires de master depuis 2021."]},
            {"titre": "Chargé de cours", "organisation": "Université de Lubumbashi", "lieu": "Lubumbashi", "debut": "2016", "fin": "2021",
             "puces": ["Enseigne l'introduction à l'économie et les statistiques (L1).", "Crée le séminaire de méthodes quantitatives pour les doctorants."]},
            {"titre": "Chercheur invité", "organisation": "Centre de recherche en économie du développement", "lieu": "Dakar", "debut": "2019", "fin": "2019",
             "puces": ["Séjour de six mois consacré à l'évaluation d'un programme d'épargne par téléphone mobile."]},
            {"titre": "Consultant", "organisation": "Programme public d'appui à l'emploi des jeunes", "lieu": "Kinshasa", "debut": "2017", "fin": "2018",
             "puces": ["Conçoit le dispositif de suivi et d'évaluation d'un programme de 5 000 bénéficiaires."]},
        ]},
        {"type": "publications", "titre_perso": "Publications", "items": [
            {"titre": "Ilunga J. (2025). « Mobile Money et épargne de précaution : données de panel de Lubumbashi ». Revue d'économie du développement africain, 14(2), 45-71."},
            {"titre": "Ilunga J., Kasongo P. (2024). « Les jeunes diplômés face au marché du travail urbain ». Cahiers de l'emploi en Afrique, 9, 112-138."},
            {"titre": "Ilunga J. (2022). « Coût des transferts et inclusion financière des ménages ». Revue congolaise d'économie, 31(1), 7-29."},
            {"titre": "Mutombo A., Ilunga J. (2021). « Mesurer l'informalité à partir des enquêtes ménages ». Document de travail n° 2021-04."},
            {"titre": "Ilunga J. (2019). « Épargner par téléphone : une évaluation randomisée ». Document de travail n° 2019-11."},
            {"titre": "Ilunga J. (2017). « Paiements mobiles et consommation des ménages urbains ». Revue congolaise d'économie, 26(2), 51-77."},
        ]},
        {"type": "communications", "titre_perso": "Communications", "items": [
            {"titre": "« Mobile Money et résilience des ménages », Conférence africaine d'économie, Nairobi, 2025."},
            {"titre": "« Emploi des jeunes diplômés », Journées scientifiques de l'Université de Kinshasa, 2024."},
            {"titre": "« Inclusion financière et genre », Atelier régional de recherche, Dakar, 2022."},
            {"titre": "« Évaluer un programme d'épargne mobile », Séminaire doctoral, Lubumbashi, 2020."},
        ]},
        {"type": "projets", "titre_perso": "Projets de recherche financés", "items": [
            {"titre": "Inclusion financière des jeunes travailleurs", "organisation": "Responsable scientifique, financement d'une fondation", "debut": "2023", "fin": "2026",
             "texte": "Enquête auprès de 2 400 jeunes dans 3 villes, budget de 180 000 USD.", "outils": ""},
            {"titre": "Coût des transferts d'argent régionaux", "organisation": "Co-chercheur, consortium de 4 universités", "debut": "2020", "fin": "2022",
             "texte": "Analyse des frais de transfert entre 6 pays d'Afrique centrale.", "outils": ""},
        ]},
        {"type": "enseignement", "titre_perso": "Enseignements", "items": [
            {"titre": "Microéconomie, licence 2", "organisation": "Cours magistral, 60 h", "debut": "2016", "fin": "aujourd'hui", "puces": []},
            {"titre": "Économétrie appliquée, master 1", "organisation": "Cours et travaux pratiques, 45 h", "debut": "2018", "fin": "aujourd'hui", "puces": []},
            {"titre": "Méthodes d'évaluation d'impact, master 2", "organisation": "Séminaire, 24 h", "debut": "2021", "fin": "aujourd'hui", "puces": []},
        ]},
        {"type": "competences", "items": [
            {"nom": "Économétrie (Stata, R)", "niveau": 4, "groupe": "Méthodes"}, {"nom": "Évaluation d'impact", "niveau": 4, "groupe": "Méthodes"},
            {"nom": "Enquêtes de terrain", "niveau": 4, "groupe": "Méthodes"}, {"nom": "Python", "niveau": 2, "groupe": "Outils"},
        ]},
        {"type": "langues", "items": [
            {"nom": "Français", "niveau": "Langue maternelle", "note": 5}, {"nom": "Swahili", "niveau": "Langue maternelle", "note": 5},
            {"nom": "Anglais", "niveau": "C1, courant", "note": 4},
        ]},
        {"type": "engagement", "titre_perso": "Responsabilités collectives", "items": [
            {"titre": "Membre du comité de lecture", "organisation": "Revue congolaise d'économie", "lieu": "", "debut": "2020", "fin": "aujourd'hui", "puces": []},
            {"titre": "Secrétaire scientifique", "organisation": "Association des économistes de RD Congo", "lieu": "", "debut": "2018", "fin": "2022", "puces": []},
        ]},
    ],
}
