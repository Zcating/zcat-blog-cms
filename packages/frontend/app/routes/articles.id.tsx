import { ArticlesApi } from "@/api";
import type { Route } from "./+types/articles.id";
import { useState, useEffect } from "react";
import MdEditor from "react-markdown-editor-lite";
import MarkdownIt from "markdown-it";
import "react-markdown-editor-lite/lib/index.css";

// 初始化 markdown 解析器
const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  if (params.id === "create") {
    return {
      article: {
        title: "",
        excerpt: "",
        content: "",
      } satisfies ArticlesApi.Article,
    };
  }
  const id = Number(params.id);
  if (isNaN(id)) {
    throw new Error("文章ID无效");
  }

  const article = await ArticlesApi.getArticle(id);
  return {
    article,
  };
}

export default function Article({ loaderData }: Route.ComponentProps) {
  const [article, setArticle] = useState(loaderData.article);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // 处理编辑器内容变化
  const handleEditorChange = ({ text }: { text: string }) => {
    setArticle((prev) => ({ ...prev, content: text }));
  };

  // 保存文章
  const handleSave = async () => {
    if (!article.id) return;

    setSaving(true);
    try {
      await ArticlesApi.updateArticle(article.id, {
        title: article.title,
        excerpt: article.excerpt,
        contentUrl: article.content, // 这里直接传content作为contentUrl
      });
      setIsEditing(false);
      alert("保存成功！");
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  // 取消编辑
  const handleCancel = () => {
    setArticle(loaderData.article); // 恢复原始数据
    setIsEditing(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 文章标题和操作按钮 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">
            {isEditing ? (
              <input
                type="text"
                value={article.title}
                onChange={(e) => setArticle((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入文章标题"
              />
            ) : (
              article.title || "无标题"
            )}
          </h1>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50">
                  {saving ? "保存中..." : "保存"}
                </button>
                <button onClick={handleCancel} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">
                  取消
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
                编辑
              </button>
            )}
          </div>
        </div>

        {/* 文章摘要 */}
        {isEditing ? (
          <textarea
            value={article.excerpt}
            onChange={(e) => setArticle((prev) => ({ ...prev, excerpt: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入文章摘要"
            rows={3}
          />
        ) : (
          <p className="text-gray-600 text-lg mb-4">{article.excerpt || "暂无摘要"}</p>
        )}
      </div>

      {/* Markdown 编辑器或预览 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {isEditing ? (
          <MdEditor
            value={article.content || ""}
            style={{ height: "600px" }}
            renderHTML={(text) => mdParser.render(text)}
            onChange={handleEditorChange}
            config={{
              view: {
                menu: true,
                md: true,
                html: true,
              },
              canView: {
                menu: true,
                md: true,
                html: true,
                fullScreen: true,
                hideMenu: true,
              },
            }}
          />
        ) : (
          <div className="p-6">
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{
                __html: mdParser.render(article.content || "暂无内容"),
              }}
            />
          </div>
        )}
      </div>

      {/* 文章信息 */}
      <div className="mt-6 text-sm text-gray-500">
        <p>创建时间: {article.createdAt ? new Date(article.createdAt).toLocaleString() : "未知"}</p>
        <p>更新时间: {article.updatedAt ? new Date(article.updatedAt).toLocaleString() : "未知"}</p>
      </div>
    </div>
  );
}
