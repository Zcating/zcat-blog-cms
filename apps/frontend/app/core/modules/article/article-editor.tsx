import { createZForm, ZButton, ZDatePicker, ZInput, ZTextarea } from '@zcat/ui';
import dayjs from 'dayjs';
import { z } from 'zod';

import { ArticlesApi } from '@cms/api';

import { MarkdownEditor } from '../../ui';

const ArticleSchema = z.object({
  title: z
    .string()
    .min(1, '文章标题不能为空')
    .max(50, '文章标题不能超过50个字符'),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  publishAt: z
    .custom<dayjs.Dayjs>(dayjs.isDayjs, {
      message: '发布时间格式不正确',
    })
    .default(dayjs()),
});

const ArticleForm = createZForm(ArticleSchema);

interface ArticleEditorProps {
  article: ArticlesApi.Article;
  onSave: (article: ArticlesApi.Article) => Promise<void>;
  onCancel: () => void;
}

export function ArticleEditor({
  article: initialArticle,
  onSave,
  onCancel,
}: ArticleEditorProps) {
  const form = ArticleForm.useForm({
    defaultValues: {
      title: initialArticle.title,
      excerpt: initialArticle.excerpt,
      content: initialArticle.content,
      publishAt: initialArticle.publishAt
        ? dayjs(initialArticle.publishAt)
        : dayjs(),
    },
    onSubmit: async (values) => {
      await onSave({
        ...initialArticle,
        ...values,
        publishAt: values.publishAt?.toISOString(),
      });
    },
  });

  return (
    <ArticleForm form={form} className="w-full h-screen">
      {/* 文章标题和操作按钮 */}
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
                loading={form.instance.formState.isSubmitting}
              >
                保存
              </ZButton>
              <ZButton onClick={onCancel} variant="outline" type="button">
                取消
              </ZButton>
            </div>
          </div>
        </div>

        {/* 文章摘要 */}
        <ArticleForm.Item name="excerpt">
          <ZTextarea placeholder="请输入文章摘要" />
        </ArticleForm.Item>

        {/* Markdown 编辑器 */}
        <ArticleForm.Item name="content" className="flex-1 h-full">
          <MarkdownEditor />
        </ArticleForm.Item>
      </div>
    </ArticleForm>
  );
}
