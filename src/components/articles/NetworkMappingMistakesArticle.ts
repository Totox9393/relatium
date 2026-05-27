import articleMapImage from '../../../ressources/fond_article_mistkaes.png';
import type { ArticleSection } from './ArticleTypes';
import { BlogArticle } from './ArticleTypes';

export class NetworkMappingMistakesArticle extends BlogArticle {
  readonly id = 'network-mapping-mistakes';
  readonly slug = '5-erreurs-cartographie-reseau';
  readonly category = 'Conseils' as const;
  readonly title = '5 erreurs à éviter dans la\ncartographie de réseau';
  readonly excerpt = 'Dans Relatium, certaines erreurs rendent votre carte floue. Voici comment les éviter pour garder un réseau clair et actionnable.';
  readonly date = '9 mai 2024';
  readonly readTime = '5 min de lecture';
  readonly author = 'Totox';
  readonly authorInitials = 'TO';
  readonly image = articleMapImage;
  readonly imageAlt = 'Illustration de cartographie relationnelle';
  readonly featured = false;
  readonly summaryLeadTitle = 'Une carte utile est une carte lisible';
  readonly summaryLeadText = 'L\'objectif de Relatium n\'est pas de stocker des noms, mais de rendre vos liens exploitables. Éviter ces erreurs vous aide à garder une vision claire de qui contacter, pourquoi et quand.';
  readonly sections: ArticleSection[] = [
    {
      id: 'tout-cartographier-dun-coup',
      title: 'Vouloir tout cartographier d\'un coup',
      intro: 'Commencer trop large crée vite une carte confuse. Mieux vaut avancer par étapes pour garder une structure propre.',
      tips: [
        'Commencez par un cercle précis: équipe actuelle, clients clés ou proches.',
        'Ajoutez ensuite de nouveaux contacts chaque semaine, pas en une seule session.',
        'Validez la qualité des liens avant d\'élargir la carte.',
      ],
    },
    {
      id: 'types-trop-complexes',
      title: 'Multiplier les types de relation inutiles',
      intro: 'Trop de types rendent le filtre illisible et compliquent la lecture de votre réseau dans Relatium.',
      tips: [
        'Gardez une base simple: ami, collègue, client, partenaire, famille.',
        'Fusionnez les types qui se recoupent au lieu d\'en créer de nouveaux.',
        'Revisitez vos types tous les mois pour conserver une taxonomie claire.',
      ],
    },
    {
      id: 'ignorer-les-groupes',
      title: 'Négliger les groupes de contacts',
      intro: 'Sans groupes, vous perdez la vue contextuelle de votre réseau et vos recherches deviennent moins pertinentes.',
      tips: [
        'Créez des groupes par contexte: entreprise, projet, association, promo.',
        'Affectez les personnes clés aux bons groupes dès leur ajout.',
        'Utilisez ensuite les filtres de groupes pour préparer vos actions ciblées.',
      ],
    },
    {
      id: 'pas-de-mise-a-jour',
      title: 'Ne pas mettre la carte à jour',
      intro: 'Un réseau change vite. Une carte non maintenue finit par devenir trompeuse.',
      tips: [
        'Bloquez un créneau hebdomadaire de 10 minutes pour actualiser vos liens.',
        'Ajoutez les nouvelles relations juste après un événement marquant.',
        'Supprimez les doublons et réaffectez les contacts mal classés.',
      ],
    },
    {
      id: 'sans-objectif',
      title: 'Cartographier sans objectif concret',
      intro: 'Une carte relationnelle n\'est pas un inventaire. Elle doit soutenir une action réelle.',
      tips: [
        'Définissez votre priorité: opportunités pro, suivi clients, maintien des liens.',
        'Servez-vous des statistiques Relatium pour repérer où agir en premier.',
        'Transformez la carte en plan simple: qui contacter cette semaine, et pour quoi.',
      ],
    },
  ];
  readonly conclusion = 'Avec Relatium, une bonne cartographie repose sur trois principes: simplicité, régularité et intention. En évitant ces 5 erreurs, votre réseau devient plus lisible, plus vivant et surtout plus utile dans vos décisions.';
}
