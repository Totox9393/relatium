import articleGroupImage from '../../../ressources/fond_article_groups2.png';
import type { ArticleSection } from './ArticleTypes';
import { BlogArticle } from './ArticleTypes';

export class GroupContactsGuideArticle extends BlogArticle {
  readonly id = 'guide-groupes-relatium';
  readonly slug = 'guide-organiser-contacts-groupes-relatium';
  readonly category = 'Guides' as const;
  readonly title = 'Organiser ses\ncontacts avec les groupes';
  readonly excerpt = 'Méthode simple pour regrouper plusieurs personnes dans un même espace et définir clairement leurs relations entre elles.';
  readonly date = '13 mai 2026';
  readonly readTime = '5 min de lecture';
  readonly author = 'Totox';
  readonly authorInitials = 'TO';
  readonly image = articleGroupImage;
  readonly imageAlt = 'Illustration de groupe de personnes reliées';
  readonly featured = false;
  readonly summaryLeadTitle = 'Un groupe Relatium = une cartographie relationnelle';
  readonly summaryLeadText = "Dans Relatium, un groupe n'a pas un objectif business direct : il sert à rassembler des personnes dans un même contexte et à définir les liens entre elles. Un groupe répond à deux questions : qui fait partie du cercle, et comment ces personnes sont reliées entre elles.";
  readonly sections: ArticleSection[] = [
    {
      id: 'pourquoi-utiliser-groupes',
      title: 'Pourquoi utiliser les groupes dans Relatium',
      intro: 'Les groupes permettent de structurer et maintenir une lecture claire des relations entre plusieurs personnes.',
      tips: [
        'Clarifier un contexte social (pro, études, soirée, association, etc.).',
        'Regrouper les bonnes personnes au même endroit.',
        'Visualiser qui connaît qui dans le groupe.',
        "Définir la nature et l'intensité des relations entre les membres.",
        'Garder une structure relationnelle propre et lisible dans le temps.',
      ],
    },
    {
      id: 'methode-simple-5-etapes',
      title: 'Méthode simple en 5 étapes',
      intro: 'Une base simple suffit pour construire un groupe propre et utile à long terme.',
      tips: [
        'Définir le contexte du groupe. Exemples : "Anniversaire - 25 ans", "Promo Master 2026", "Soirée de fin d\'année".',
        'Nommer le groupe de façon explicite. Un bon nom permet de comprendre immédiatement le périmètre du groupe.',
        "Ajouter d'abord le noyau principal. Commence avec les personnes centrales, puis élargis progressivement.",
        "Définir les relations entre les membres. C'est le coeur de Relatium : indiquer les liens entre les personnes, leur type, leur force, et leurs évolutions.",
        'Mettre à jour régulièrement. Quand une relation évolue ou qu\'une personne rejoint/quitte le cercle, mets le groupe à jour pour conserver une cartographie fiable.',
      ],
    },
    {
      id: 'exemples-concrets',
      title: 'Exemples concrets',
      intro: 'La logique reste la même quel que soit le contexte : créer le groupe, ajouter les membres, définir les liens.',
      tips: [
        'Pro - Groupe : "Equipe technique - Vulcania". Intérêt : visualiser rapidement les liens entre les membres techniques de l\'entreprise, et repérer les connexions fortes/faibles.',
        'Etudes - Groupe : "Master - Promo 2026". Intérêt : structurer les liens entre étudiants, binômes, responsables de projets, et personnes ressources.',
        'Soirée / événement - Groupe : "Anniversaire Juin". Intérêt : voir qui se connaît déjà, qui est relié à qui, et mieux comprendre la dynamique du groupe.',
      ],
    },
    {
      id: 'erreurs-frequentes',
      title: 'Erreurs fréquentes à éviter',
      intro: 'Quelques erreurs simples peuvent rendre un groupe confus. Mieux vaut les éviter dès le départ.',
      tips: [
        'Créer des groupes trop larges et flous.',
        'Ajouter des personnes sans définir leurs relations.',
        'Mélanger plusieurs contextes dans un seul groupe.',
        'Ne jamais mettre à jour les liens après des changements.',
      ],
    },
  ];
  readonly conclusion = 'Sur Relatium, un groupe est avant tout une cartographie de personnes reliées entre elles. Plus tes relations sont bien définies dans chaque groupe, plus ton réseau devient clair, cohérent et utile à lire.';
}
