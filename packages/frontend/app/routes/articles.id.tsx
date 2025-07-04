import React, { useState } from 'react';
import { ArticlesApi } from '@cms/api';
import { ArticleEditor, ArticleViewer } from '@cms/core/modules';
import type { Route } from './+types/articles.id';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  if (params.id === 'create') {
    return {
      article: {
        title: '',
        excerpt: '',
        content: '',
      } satisfies ArticlesApi.Article,
    };
  }
  const id = Number(params.id);
  if (isNaN(id)) {
    throw new Error('文章ID无效');
  }

  const article = await ArticlesApi.getArticle(id);
  return {
    article,
  };
}

export default function Article({ loaderData }: Route.ComponentProps) {
  const [article, setArticle] = useState(loaderData.article);
  const [isEditing, setIsEditing] = useState(!article.id);
  const [saving, setSaving] = useState(false);
  console.log(isEditing);

  // 保存文章
  const handleSave = async (updatedArticle: ArticlesApi.Article) => {
    if (!updatedArticle.id) return;

    setSaving(true);
    try {
      await ArticlesApi.updateArticle(updatedArticle.id, {
        title: updatedArticle.title,
        excerpt: updatedArticle.excerpt,
        content: updatedArticle.content,
      });
      setArticle(updatedArticle);
      setIsEditing(false);
      alert('保存成功！');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 取消编辑
  const handleCancel = () => {
    setIsEditing(false);
  };

  // 开始编辑
  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <React.Fragment>
      {isEditing ? (
        <ArticleEditor
          article={article}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />
      ) : (
        <ArticleViewer article={article} onEdit={handleEdit} />
      )}
    </React.Fragment>
  );
}
