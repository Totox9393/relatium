import articlePodiumImage from '../../../ressources/fond_article_podium.png';
import type { ArticleSection } from './ArticleTypes';
import { BlogArticle } from './ArticleTypes';

export class ProfessionalNetworkArticle extends BlogArticle {
  readonly id = 'professional-network-asset';
  readonly slug = 'arbre-relationnel-professionnel-relatium';
  readonly category = 'Guides' as const;
  readonly title = 'Construire son arbre relationnel\npro avec Relatium';
  readonly excerpt = 'Ancien collègue, manager, RH, dirigeant : structurez votre réseau pro pour mieux activer les bons contacts.';
  readonly date = '15 avril 2024';
  readonly readTime = '4 min de lecture';
  readonly author = 'Totox';
  readonly authorInitials = 'TO';
  readonly image = articlePodiumImage;
  readonly imageAlt = 'Illustration podium';
  readonly featured = false;
  readonly summaryLeadTitle = 'Votre réseau pro mérite une vraie structure';
  readonly summaryLeadText = 'Relatium ne sert pas uniquement au cercle personnel. Vous pouvez aussi y modéliser tout votre arbre relationnel professionnel pour garder une vision claire des liens, des rôles et des entreprises.';
  readonly sections: ArticleSection[] = [
    {
      id: 'developper-visibilite',
      title: 'Cartographier les rôles clés',
      intro: 'Commencez par représenter vos contacts selon leur rôle réel dans votre parcours professionnel.',
      tips: [
        'Créez des types de relation dédiés : ancien collègue, manager, RH, client, partenaire.',
        'Ajoutez les décideurs importants (ex. patron de ...) même si le contact est indirect.',
        'Différenciez les liens actifs, en veille et stratégiques.',
      ],
    },
    {
      id: 'activer-liens-faibles',
      title: 'Créer des groupes par entreprise',
      intro: 'Les groupes Relatium permettent de voir rapidement vos points d\'ancrage dans chaque société.',
      tips: [
        'Créez un groupe par entreprise : ex-cabinet, entreprise actuelle, clients majeurs.',
        'Regroupez les RH, managers et collègues d\'une même structure pour repérer vos passerelles.',
        'Utilisez les groupes pour préparer une candidature ou une prise de contact ciblée.',
      ],
    },
    {
      id: 'entretenir-confiance',
      title: 'Activer intelligemment votre arbre relationnel',
      intro: 'Une bonne carte relationnelle professionnelle sert à passer à l\'action au bon moment.',
      tips: [
        'Avant une mobilité, identifiez qui peut vous recommander dans chaque groupe entreprise.',
        'Suivez les interactions importantes (message, entretien, recommandation) pour ne pas perdre le fil.',
        'Entretenez la relation dans le temps : remerciement, partage utile, prise de nouvelles ciblée.',
      ],
    },
  ];
  readonly conclusion = 'Avec Relatium, votre réseau professionnel devient un système lisible et actionnable. En structurant vos liens par rôles et par entreprises, vous gagnez en clarté pour évoluer, collaborer et saisir les bonnes opportunités.';
}
