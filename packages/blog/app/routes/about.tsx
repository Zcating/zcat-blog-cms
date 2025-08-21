export function meta() {
  return [{ title: "关于" }, { name: "description", content: "个人技术博客" }];
}

export default function AboutPage() {
  return (
    <div>
      <h1>About</h1>
      <p>这里是About的内容...</p>
      <a href="/">返回首页</a>
    </div>
  );
}
