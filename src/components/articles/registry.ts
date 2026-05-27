import { AnalysisGuideArticle } from './AnalysisGuideArticle';
import { GroupContactsGuideArticle } from './GroupContactsGuideArticle';
import { MaintainRelationshipsArticle } from './MaintainRelationshipsArticle';
import { NetworkMappingMistakesArticle } from './NetworkMappingMistakesArticle';
import { NetworkMapArticle } from './NetworkMapArticle';
import { ProfessionalNetworkArticle } from './ProfessionalNetworkArticle';
import { RelationshipTypesThatMatterArticle } from './RelationshipTypesThatMatterArticle';
import { StatsInsightsArticle } from './StatsInsightsArticle';
import type { BlogArticle } from './ArticleTypes';

const articleInstances: BlogArticle[] = [
  new NetworkMapArticle(),
  new NetworkMappingMistakesArticle(),
  new RelationshipTypesThatMatterArticle(),
  new StatsInsightsArticle(),
  new MaintainRelationshipsArticle(),
  new ProfessionalNetworkArticle(),
  new GroupContactsGuideArticle(),
  new AnalysisGuideArticle(),
];

export const blogArticles = articleInstances;

export const getBlogArticleBySlug = (slug: string) => articleInstances.find(article => article.slug === slug) ?? null;

export const getBlogArticleById = (id: string) => articleInstances.find(article => article.id === id) ?? null;
