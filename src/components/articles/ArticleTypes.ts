export type BlogCategory = 'Conseils' | 'Statistiques' | 'Relations' | 'Productivite' | 'Actualites' | 'Guides';

export type ArticleSection = {
  id: string;
  title: string;
  intro: string;
  tips: string[];
};

export abstract class BlogArticle {
  abstract readonly id: string;
  abstract readonly slug: string;
  abstract readonly category: BlogCategory;
  abstract readonly title: string;
  abstract readonly excerpt: string;
  abstract readonly date: string;
  abstract readonly readTime: string;
  abstract readonly author: string;
  abstract readonly authorInitials: string;
  abstract readonly image: string;
  abstract readonly imageAlt: string;
  abstract readonly featured: boolean;
  abstract readonly summaryLeadTitle: string;
  abstract readonly summaryLeadText: string;
  abstract readonly sections: ArticleSection[];
  abstract readonly conclusion: string;
}
