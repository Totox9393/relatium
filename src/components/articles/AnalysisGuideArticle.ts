import articleAnalyseImage from '../../../ressources/fond_article_analyse.png';
import type { ArticleSection } from './ArticleTypes';
import { BlogArticle } from './ArticleTypes';

export class AnalysisGuideArticle extends BlogArticle {
  readonly id = 'guide-analyse-relatium';
  readonly slug = 'guide-analyse-liens-manquants-relatium';
  readonly category = 'Guides' as const;
  readonly title = "Utiliser l'Analyse pour\nreveler les liens manquants";
  readonly excerpt = 'Compare deux personnes, lis leur reseau commun, et identifie clairement les relations a creer ou a preciser.';
  readonly date = '13 mai 2026';
  readonly readTime = '5 min de lecture';
  readonly author = 'Totox';
  readonly authorInitials = 'TO';
  readonly image = articleAnalyseImage;
  readonly imageAlt = "Illustration de la fonctionnalite d'analyse de reseau";
  readonly featured = false;
  readonly summaryLeadTitle = "L'Analyse donne une lecture claire de deux reseaux";
  readonly summaryLeadText = "Dans Relatium, la page Analyse sert a comparer deux personnes pour comprendre rapidement leur structure relationnelle. L'objectif est simple : voir ce qui est deja partage, reperer ce qui manque, et garder une cartographie fidele.";
  readonly sections: ArticleSection[] = [
    {
      id: 'pourquoi-utiliser-analyse',
      title: "Pourquoi utiliser l'Analyse dans Relatium",
      intro: "L'Analyse te permet de lire la relation entre deux personnes sans te perdre dans une liste de contacts.",
      tips: [
        'Visualiser le lien direct entre deux personnes.',
        'Comprendre le noyau relationnel commun.',
        'Voir les types de relation dominants (ami, connaissance, etc.).',
        "Identifier les personnes que l'un connait et pas l'autre.",
        "Mettre a jour les liens directement depuis l'ecran d'analyse.",
      ],
    },
    {
      id: 'methode-5-etapes',
      title: 'Methode simple en 5 etapes',
      intro: 'Cette methode aide a exploiter la page Analyse de facon simple et utile.',
      tips: [
        'Choisir les 2 personnes a comparer selon le contexte que tu veux lire.',
        'Lire le bloc "En resume" pour verifier le lien direct et les types de relation deja definis.',
        'Examiner "Relations en commun" pour comprendre la proximite relationnelle entre les deux personnes.',
        'Analyser les ecarts via les blocs "ne connait pas" pour reperer les liens manquants.',
        'Ajuster les liens en ajoutant ou corrigeant les relations necessaires.',
      ],
    },
    {
      id: 'lire-les-blocs',
      title: "Comment lire les blocs de la page Analyse",
      intro: 'Chaque bloc repond a une question differente et complementaire.',
      tips: [
        'Reseaux individuels : montre ce qui est unique a chacun et ce qui est partage.',
        'Types de relation en commun : donne la repartition des liens dans la zone commune.',
        'Contacts communs : affiche les personnes deja presentes dans les deux reseaux.',
        '"Ne connait pas" : met en evidence les contacts presents chez un seul des deux.',
      ],
    },
    {
      id: 'exemples-et-erreurs',
      title: 'Exemples concrets et erreurs a eviter',
      intro: "La logique d'analyse reste identique en pro, en etudes, ou pour un evenement.",
      tips: [
        "Pro : comparer deux collegues pour voir les connexions d'equipe deja partagees et les points de jonction manquants.",
        "Etudes : comparer deux etudiants d'un meme master pour visualiser les contacts communs et les ecarts de reseau.",
        'Evenement : comparer deux amis qui organisent une soiree pour lire les cercles communs et separes.',
        'Erreur a eviter : se focaliser seulement sur le nombre total de contacts sans lire les types de relation.',
      ],
    },
  ];
  readonly conclusion = "Sur Relatium, l'Analyse te montre ce que deux personnes partagent, ce qui les separe, et quels liens doivent etre definis pour garder un reseau coherent.";
}
