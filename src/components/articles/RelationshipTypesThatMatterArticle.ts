import articleRelationsImage from '../../../ressources/fond_article_7links.png';
import type { ArticleSection } from './ArticleTypes';
import { BlogArticle } from './ArticleTypes';

export class RelationshipTypesThatMatterArticle extends BlogArticle {
  readonly id = 'relationship-types-that-matter';
  readonly slug = '7-types-liens-qui-comptent-vraiment';
  readonly category = 'Relations' as const;
  readonly title = 'Les 7 types de liens\nqui comptent vraiment';
  readonly excerpt = 'Dans Relatium, un bon réseau ne se limite pas au pro. Voici 7 types de liens à créer pour garder un réseau utile, humain et même fun.';
  readonly date = '11 mai 2024';
  readonly readTime = '6 min de lecture';
  readonly author = 'Totox';
  readonly authorInitials = 'TO';
  readonly image = articleRelationsImage;
  readonly imageAlt = 'Illustration de relations humaines';
  readonly featured = false;
  readonly summaryLeadTitle = 'Un réseau équilibré mélange utile, affectif et ludique';
  readonly summaryLeadText = 'Relatium devient vraiment puissant quand vous cartographiez plusieurs facettes de votre vie. L\'objectif n\'est pas de collectionner des contacts, mais de créer des liens qui vous font avancer et qui vous font du bien.';
  readonly sections: ArticleSection[] = [
    {
      id: 'lien-ressource',
      title: 'Le lien ressource',
      intro: 'Ce sont les personnes vers qui vous allez pour un conseil concret ou un retour rapide.',
      tips: [
        'Créez un type dédié, par exemple conseil rapide ou cerveau de secours.',
        'Identifiez 3 personnes fiables dans des domaines différents.',
        'Mettez une note sur ce que chacune aime aider à résoudre.',
      ],
    },
    {
      id: 'lien-bouffee-dair',
      title: 'Le lien bouffée d\'air',
      intro: 'Des contacts qui rechargent votre énergie: humour, légèreté, spontanéité.',
      tips: [
        'Créez un type de relation fun ou anti-stress.',
        'Ajoutez les personnes avec qui vous passez toujours un bon moment.',
        'Planifiez un rappel simple: un message léger toutes les 2 ou 3 semaines.',
      ],
    },
    {
      id: 'lien-progression',
      title: 'Le lien progression',
      intro: 'Ces liens vous tirent vers le haut: mentors, sparring partners, personnes inspirantes.',
      tips: [
        'Ajoutez un type mentor, pair exigeant ou inspiration.',
        'Notez l\'objectif associé à chaque lien: prise de parole, carrière, projet perso.',
        'Faites un point mensuel pour transformer les échanges en actions concrètes.',
      ],
    },
    {
      id: 'lien-pont',
      title: 'Le lien pont entre univers',
      intro: 'Ces personnes connectent des mondes qui ne se parlent pas souvent: perso, asso, pro, créatif.',
      tips: [
        'Repérez les profils qui connaissent des communautés différentes.',
        'Créez un type connecteur ou passerelle.',
        'Utilisez ce lien pour décloisonner vos idées et opportunités.',
      ],
    },
    {
      id: 'lien-memoire',
      title: 'Le lien mémoire',
      intro: 'Anciens camarades, collègues, voisins: ce réseau dormant peut redevenir précieux.',
      tips: [
        'Créez un groupe anciennes relations à réactiver.',
        'Relancez avec un message contextualisé plutôt qu\'un salut générique.',
        'Même un lien ancien peut redevenir actif avec un bon déclencheur.',
      ],
    },
    {
      id: 'lien-local',
      title: 'Le lien local du quotidien',
      intro: 'Commerçants, voisins, parents d\'école, assos locales: des liens simples mais très utiles.',
      tips: [
        'Ajoutez-les dans un groupe quartier ou vie locale.',
        'Créez un type voisin de confiance ou contact de proximité.',
        'Ce sont souvent les liens les plus efficaces pour des besoins rapides.',
      ],
    },
    {
      id: 'lien-projet-plaisir',
      title: 'Le lien projet plaisir',
      intro: 'Des personnes avec qui vous voulez créer pour le plaisir: sport, musique, jeu, side-project.',
      tips: [
        'Créez des types comme co-création, jeux vidéos ou partenaire de sport.',
        'Utilisez Relatium pour trouver des synergies entre vos contacts sur des projets fun.',
        'Gardez ces liens actifs: ils rendent votre réseau plus vivant et plus fun.',
      ],
    },
  ];
  readonly conclusion = 'Les liens qui comptent vraiment ne sont pas seulement professionnels. En diversifiant vos types de relation dans Relatium, vous obtenez un réseau plus robuste, plus joyeux et plus utile dans toutes les dimensions de votre vie.';
}
