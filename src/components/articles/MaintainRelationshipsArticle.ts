import articleRelationsImage from '../../../ressources/fond_article_relations.png';
import type { ArticleSection } from './ArticleTypes';
import { BlogArticle } from './ArticleTypes';

export class MaintainRelationshipsArticle extends BlogArticle {
  readonly id = 'maintain-relationships';
  readonly slug = 'entretenir-ses-relations';
  readonly category = 'Relations' as const;
  readonly title = 'Entretenir ses relations :\nles bonnes pratiques';
  readonly excerpt = 'Nos conseils pour nourrir vos liens et construire des relations durables.';
  readonly date = '28 avril 2024';
  readonly readTime = '6 min de lecture';
  readonly author = 'Totox';
  readonly authorInitials = 'TO';
  readonly image = articleRelationsImage;
  readonly imageAlt = 'Illustration relations';
  readonly featured = false;
  readonly summaryLeadTitle = 'Un réseau solide se construit... et se cultive';
  readonly summaryLeadText = 'Entretenir ses relations ne signifie pas contacter tout le monde tous les jours. Il s\'agit d\'être présent, pertinent et authentique dans la durée.';
  readonly sections: ArticleSection[] = [
    {
      id: 'contact-regulier',
      title: 'Rester en contact régulièrement',
      intro: 'La régularité renforce la confiance. Trouvez un rythme simple pour prendre des nouvelles sans attendre un besoin urgent.',
      tips: [
        'Planifiez un message court chaque semaine à 2 ou 3 amis importants.',
        'Utilisez un rappel mensuel pour reprendre contact avec les personnes moins vues.',
        'Alternez les canaux: appel, vocal, message, café rapide.',
      ],
    },
    {
      id: 'apporter-valeur',
      title: 'Apporter de la valeur',
      intro: 'Une relation durable n\'est pas transactionnelle. Partagez des ressources, donnez un coup de main et soyez présent dans les moments utiles.',
      tips: [
        'Partagez un article, une opportunité ou un contact qui peut aider.',
        'Proposez une aide concrète: relire un CV, donner un avis, dépanner.',
        'Faites un suivi après avoir aidé, même très bref.',
      ],
    },
    {
      id: 'moments-cles',
      title: 'Être présent aux moments clés',
      intro: 'Les petits gestes aux bons moments comptent souvent plus que de longues discussions occasionnelles.',
      tips: [
        'Notez les dates importantes: anniversaires, examens, entretiens.',
        'Envoyez un message de soutien avant un événement stressant.',
        'Célébrez aussi les petites victoires, pas seulement les grandes.',
      ],
    },
    {
      id: 'personnaliser-echanges',
      title: 'Personnaliser vos échanges',
      intro: 'Un message personnalisé montre que vous écoutez vraiment. C\'est essentiel dans un réseau d\'amitiés.',
      tips: [
        'Reprenez un détail de la dernière conversation.',
        'Adaptez le ton à la personne (humour, direct, bienveillance).',
        'Évitez les messages trop génériques envoyés à tous.',
      ],
    },
    {
      id: 'utiliser-bons-outils',
      title: 'Utiliser les bons outils',
      intro: 'Un répertoire relationnel simple peut vous aider à ne pas perdre le fil.',
      tips: [
        'Centralisez vos notes relationnelles dans Relatium.',
        'Ajoutez des tags utiles: famille, amis proches, travail, club.',
        'Mettez à jour les infos importantes après chaque échange marquant.',
      ],
    },
    {
      id: 'mesurer-ajuster',
      title: 'Mesurer et ajuster vos actions',
      intro: 'Vérifier vos habitudes permet d\'équilibrer votre énergie relationnelle.',
      tips: [
        'Repérez les relations que vous négligez involontairement.',
        'Ajustez votre rythme selon les périodes de vie.',
        'Cherchez la qualité des échanges, pas seulement la fréquence.',
      ],
    },
  ];
  readonly conclusion = 'Entretenir ses amitiés, c\'est miser sur la constance et les petites attentions. Avec quelques habitudes simples, votre réseau devient plus vivant, plus solide et plus utile au quotidien.';
}
