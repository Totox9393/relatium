import articleStatsImage from '../../../ressources/feat_stats.png';
import type { ArticleSection } from './ArticleTypes';
import { BlogArticle } from './ArticleTypes';

export class StatsInsightsArticle extends BlogArticle {
  readonly id = 'stats-key-insights';
  readonly slug = 'statistiques-cles-reseau';
  readonly category = 'Statistiques' as const;
  readonly title = '5 statistiques clés pour mieux\ncomprendre votre réseau';
  readonly excerpt = 'Dans Relatium, ces 5 indicateurs vous montrent où votre réseau est solide, et où agir en priorité.';
  readonly date = '2 mai 2024';
  readonly readTime = '6 min de lecture';
  readonly author = 'Totox';
  readonly authorInitials = 'TO';
  readonly image = articleStatsImage;
  readonly imageAlt = 'Illustration statistiques';
  readonly featured = false;
  readonly summaryLeadTitle = 'Lisez vos statistiques comme un plan d\'action';
  readonly summaryLeadText = 'La page Statistiques de Relatium ne sert pas à faire joli. Elle vous aide à piloter votre réseau relationnel avec des signaux concrets : croissance, équilibre et zones à renforcer.';
  readonly sections: ArticleSection[] = [
    {
      id: 'contacts-totaux',
      title: 'Suivre vos contacts totaux',
      intro: 'Ce KPI indique la taille de votre base relationnelle dans Relatium. Il mesure votre capacité de portée, pas la qualité de vos liens.',
      tips: [
        'Observez la variation sur la période pour savoir si votre réseau s\'élargit vraiment.',
        'Ajoutez les contacts oubliés : anciens collègues, RH, managers, partenaires.',
        'Nettoyez les doublons pour garder une base fiable.',
      ],
    },
    {
      id: 'relations-totales',
      title: 'Analyser vos relations totales',
      intro: 'Le nombre de relations montre la profondeur de votre réseau : combien de liens vous avez réellement cartographiés entre les personnes.',
      tips: [
        'Un grand nombre de contacts avec peu de relations indique une carte encore incomplète.',
        'Créez des relations entre contacts qui se connaissent déjà pour rendre la carte réaliste.',
        'Priorisez les liens utiles à vos objectifs (pro, perso, projets).',
      ],
    },
    {
      id: 'types-relation',
      title: 'Contrôler la répartition des types de relation',
      intro: 'Cet indicateur vous montre si votre réseau est équilibré ou trop concentré sur une seule catégorie.',
      tips: [
        'Comparez vos types : collègue, ami, client, RH, partenaire, etc.',
        'Si un type domine trop, créez des connexions complémentaires.',
        'Ajustez vos types de relation quand votre réalité évolue.',
      ],
    },
    {
      id: 'groupes',
      title: 'Mesurer la structure de vos groupes',
      intro: 'Le nombre de groupes reflète votre niveau d\'organisation. Dans Relatium, les groupes vous aident à segmenter votre réseau par contexte.',
      tips: [
        'Créez des groupes clairs : entreprise actuelle, ancien employeur, clients, associations.',
        'Évitez les groupes fourre-tout ; préférez des ensembles lisibles.',
        'Utilisez les groupes pour préparer des actions ciblées (reprise de contact, opportunités).',
      ],
    },
    {
      id: 'activites',
      title: 'Lire les activités enregistrées',
      intro: 'Cet indicateur agrège vos actions (ajouts de contacts, relations, groupes, types). Il révèle votre dynamique réelle.',
      tips: [
        'Regardez la tendance de période, pas seulement la valeur instantanée.',
        'Identifiez les semaines creuses pour relancer votre entretien relationnel.',
        'Fixez un rythme simple : quelques actions régulières valent mieux qu\'un gros pic ponctuel.',
      ],
    },
  ];
  readonly conclusion = 'Dans Relatium, les statistiques sont un outil de pilotage. Elles vous permettent de transformer votre carte relationnelle en décisions concrètes : qui ajouter, quels liens renforcer, quels groupes structurer et quand relancer vos actions.';
}
