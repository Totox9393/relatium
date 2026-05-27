import articleMapImage from '../../../ressources/feat_carte.png';
import type { ArticleSection } from './ArticleTypes';
import { BlogArticle } from './ArticleTypes';

export class NetworkMapArticle extends BlogArticle {
  readonly id = 'featured-network-map';
  readonly slug = 'cartographier-son-reseau';
  readonly category = 'Conseils' as const;
  readonly title = 'Cartographier son réseau :\npar où commencer ?';
  readonly excerpt = 'Un guide complet pour bien démarrer avec la cartographie relationnelle et visualiser vos liens essentiels.';
  readonly date = '12 mai 2024';
  readonly readTime = '5 min de lecture';
  readonly author = 'Totox';
  readonly authorInitials = 'TO';
  readonly image = articleMapImage;
  readonly imageAlt = 'Illustration de cartographie réseau';
  readonly featured = true;
  readonly summaryLeadTitle = 'Commencer simple pour voir plus clair';
  readonly summaryLeadText = 'Une carte relationnelle efficace commence par les liens les plus importants, puis s\'enrichit progressivement.';
  readonly sections: ArticleSection[] = [
    {
      id: 'choisir-point-de-depart',
      title: 'Choisir un point de départ',
      intro: 'Démarrez avec votre cercle proche avant d\'élargir.',
      tips: ['Listez 10 personnes clefs.', 'Classez-les par contexte de vie.', 'Ajoutez un lien principal par personne.'],
    },
    {
      id: 'definir-types-lien',
      title: 'Définir vos types de liens',
      intro: 'Des catégories simples rendent la lecture plus rapide.',
      tips: ['Gardez 4 à 6 types maximum.', 'Différenciez perso et pro.', 'Ajustez vos types tous les 2 mois.'],
    },
    {
      id: 'mettre-a-jour',
      title: 'Mettre à jour régulièrement',
      intro: 'Une carte utile est une carte vivante.',
      tips: ['Mettez à jour après des événements importants.', 'Supprimez les doublons.', 'Ajoutez un rappel hebdomadaire de 10 minutes.'],
    },
  ];
  readonly conclusion = 'La cartographie ne doit pas être complexe. La clarté vient de la régularité, pas du volume d\'informations.';
}
