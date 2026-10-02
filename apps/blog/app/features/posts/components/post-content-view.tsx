import { ZMarkdown, ZView } from '@zcat/ui';

import { stringDateFormat } from '@blog/common';

import type { ArticleDetail } from '@blog/server/article/schemas';

export interface PostContentViewProps {
  value: ArticleDetail;
}
export function PostContentView(props: PostContentViewProps) {
  // TODO: Parse content which format is markdown
  return (
    <ZView className="container mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">{props.value.title}</h1>
        <div className="text-muted-foreground">
          {stringDateFormat(props.value.publishAt)}
        </div>
      </div>
      <ZView className="mt-4">
        <ZMarkdown content={props.value.content} />
      </ZView>
    </ZView>
  );
}
