export interface ArticleContent {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  summary: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime: number;
  tags: string[];
  body: string;
  related: string[];
}
