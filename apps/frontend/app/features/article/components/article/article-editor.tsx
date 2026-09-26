/*
 * The editor reads the existing article (if any) from the TanStack
 * Query cache, never from `useLoaderData`. The thin route file at
 * `app/routes/_cms/articles.edit.tsx` ensures the cache slot is hot
 * before the page renders.
 *
 * Save flow:
 *   1. Run the markdown body through
 *      `extractBlobImageUrls` + `uploadArticleMarkdownImages` to
 *      resolve any `blob:` images to the CDN URLs the backend
 *      returns. Those URLs are positionally aligned with the
 *      `blob:` URLs in the markdown so `rewriteArticleMarkdownImages`
 *      can splice them back in.
 *   2. POST the rewritten body + metadata to either `createArticle`
 *      (id is undefined) or `updateArticle` (id is defined). The
 *      cache is invalidated on success so the list page re-reads
 *      with the new row.
 *   3. Navigate to `/articles/:articleId` on success.
 */

import {
  createZForm,
  ZButton,
  ZDatePicker,
  ZInput,
  ZNotification,
  ZTextarea,
} from '@zcat/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import dayjs from 'dayjs';
import React from 'react';
import { z } from 'zod';

import {
  articleDetailQueryOptions,
  articlesListQueryOptions,
  createArticle,
  updateArticle,
} from '@cms/server/articles';
import type { Article } from '@cms/server/articles/schemas';
import { articleTagsListQueryOptions } from '@cms/server/article-tags';
import { MarkdownEditor } from '@cms/core/ui/markdown-editor';

import {
  extractBlobImageUrls,
  rewriteArticleMarkdownImages,
  uploadArticleMarkdownImages,
} from '../../hooks/use-article-image-upload';

const ArticleFormSchema = z.object({
  title: z
    .string()
    .min(1, '文章标题不能为空')
    .max(50, '文章标题不能超过50个字符'),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  publishAt: z
    .custom<dayjs.Dayjs>((v) => dayjs.isDayjs(v), {
      message: '发布时间格式不正确',
    })
    .default(dayjs()),
});

const ArticleForm = createZForm(ArticleFormSchema);

interface ArticleEditorPageProps {
  id?: number;
}

export function ArticleEditorPage({ id }: ArticleEditorPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    ...articleDetailQueryOptions({ id: id ?? 0 }),
    enabled: typeof id === 'number',
  });
  const tagsQuery = useQuery(articleTagsListQueryOptions());

  const existing: Article | undefined = id ? detailQuery.data : undefined;

  const createMutation = useMutation({
    mutationFn: (input: {
      title: string;
      excerpt: string;
      content: string;
      publishAt?: string;
      tagIds?: number[];
    }) => createArticle({ data: input }),
  });
  const updateMutation = useMutation({
    mutationFn: (input: {
      id: number;
      title?: string;
      excerpt?: string;
      content?: string;
      publishAt?: string;
      tagIds?: number[];
    }) => updateArticle({ data: input }),
  });

  const form = ArticleForm.useForm({
    defaultValues: {
      title: existing?.title ?? '',
      excerpt: existing?.excerpt ?? '',
      content: '',
      publishAt: existing?.publishAt ? dayjs(existing.publishAt) : dayjs(),
    },
    onSubmit: async (values) => {
      let content = values.content ?? '';

      // Step 1: extract and upload any blob: images. The resolved
      // URLs are returned in the same positional order as the blob
      // URLs in the markdown, so the rewrite step is positional.
      const blobUrls = extractBlobImageUrls(content);
      if (blobUrls.length > 0) {
        const resolvedUrls = await uploadArticleMarkdownImages(blobUrls);
        content = rewriteArticleMarkdownImages(content, resolvedUrls);
      }

      const payload = {
        title: values.title,
        excerpt: values.excerpt ?? '',
        content,
        publishAt: values.publishAt?.toISOString(),
        tagIds: [],
      };

      let saved: Article | undefined;
      try {
        saved = id
          ? await updateMutation.mutateAsync({ id, ...payload })
          : await createMutation.mutateAsync(payload);
      } catch (error) {
        await ZNotification.error(
          error instanceof Error ? error.message : '保存失败',
        );
        return;
      }

      // Invalidate the list cache so the next navigation lands on
      // a fresh row. The saved body already carries the resolved
      // CDN URLs, so the detail endpoint returns images the
      // browser can load.
      queryClient.invalidateQueries({ queryKey: ['articles', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['articles', 'detail'] });

      await navigate({
        to: '/articles/$articleId',
        params: { articleId: String(saved.id) },
      });
    },
  });

  const handleCancel = React.useCallback(() => {
    void navigate({ to: '/articles' });
  }, [navigate]);

  return (
    <ArticleForm form={form} className="w-full h-screen">
      <div className="p-3 h-full flex flex-col gap-2">
        <div className="flex justify-between items-start gap-5">
          <ArticleForm.Item name="title" className="flex-1">
            <ZInput
              className="h-12 text-xl font-bold"
              placeholder="请输入文章标题"
            />
          </ArticleForm.Item>
          <div>
            <div className="flex justify-end gap-3 pt-1">
              <ArticleForm.Item name="publishAt">
                <ZDatePicker placeholder="发布时间" />
              </ArticleForm.Item>
              <ZButton
                type="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                保存
              </ZButton>
              <ZButton onClick={handleCancel} variant="outline" type="button">
                取消
              </ZButton>
            </div>
          </div>
        </div>

        <ArticleForm.Item name="excerpt">
          <ZTextarea placeholder="请输入文章摘要" />
        </ArticleForm.Item>

        <ArticleForm.Item name="content" className="flex-1 h-full">
          <MarkdownEditor />
        </ArticleForm.Item>
      </div>
    </ArticleForm>
  );
}
