import type { ArticleApi } from "@blog/apis";
import { View, Markdown } from "@blog/components";

export interface PostContentViewProps {
  value: ArticleApi.ArticleDetail;
}
export function PostContentView(props: PostContentViewProps) {
  // TODO: Parse content which format is markdown
  return (
    <View className="container mx-auto">
      <div className="mt-4">
        <Markdown content={props.value.content} />
      </div>
    </View>
  );
}
