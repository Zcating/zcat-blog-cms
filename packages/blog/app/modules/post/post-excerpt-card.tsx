import type { ArticleApi } from "@blog/apis";
import { Card, View } from "@blog/components";

export interface PostExcerptCardProps {
  value: ArticleApi.Article;
}

export function PostExcerptCard(props: PostExcerptCardProps) {
  return (
    <Card>
      <View className="p-6">
        <h2 className="text-xl font-semibold">{props.value.title}</h2>
        <p className="text-muted-foreground mt-2">{props.value.excerpt}</p>
        <p className="text-sm text-muted-foreground mt-4">
          {props.value.createdAt.format("YYYY-MM-DD")}
        </p>
      </View>
    </Card>
  );
}
