# ZCAT BLOG CMS

一个完整的 CMS，用于管理博客的文章、照片、相册等内容。

## 功能

- 文章管理：创建、编辑、发布、删除博客文章。
- 照片管理：上传、编辑、删除照片。
- 相册管理：创建、编辑、删除相册，将照片组织在一起。
- 用户管理：管理博客的用户，包括注册、登录、权限管理等。
- 统计分析：提供博客的访问统计、文章点击量、照片浏览量等分析数据。

## 技术栈

- Blog 前端：React + React Router
- CMS 前端：React + TanStack Start / TanStack Router
- 后端：Hono + Prisma
- 数据库：PostgreSQL

## 安装与运行

1. 克隆项目仓库：`git clone https://github.com/zcating/zcat-blog-cms.git`
2. 进入项目目录：`cd zcat-blog-cms`
3. 安装依赖：`pnpm install`
4. 配置环境变量：各应用的 `.env` 文件不会提交，需自行创建；CMS 管理后台可参考 `apps/frontend/.env.example`
5. 运行项目：`pnpm run dev`
6. 访问 CMS 前端：`http://localhost:3000`
7. 访问博客：`http://localhost:1024`
8. 访问后端 API：`http://localhost:9090/api`