import { ZMarkdown, ZView } from '@zcat/ui';

import type { ArticleApi } from '@blog/apis';

export interface PostContentViewProps {
  value: ArticleApi.ArticleDetail;
}
export function PostContentView(props: PostContentViewProps) {
  // TODO: Parse content which format is markdown
  return (
    <ZView className="container mx-auto">
      <ZView className="mt-4">
        <ZMarkdown content={props.value.content} />
      </ZView>
    </ZView>
  );
}
