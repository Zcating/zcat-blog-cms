export function meta() {
  return [{ title: "说说" }, { name: "description", content: "个人技术博客" }];
}

export default function MomentsPage() {
  return (
    <div>
      <h1>Moments</h1>
      <p>这里是Moments的内容...</p>
      <a href="/">返回首页</a>
    </div>
  );
}
