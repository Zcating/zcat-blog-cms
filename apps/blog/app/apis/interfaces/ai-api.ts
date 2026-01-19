export namespace AiApi {
  function chat(message: string) {
    window.setTimeout(() => {
      const content =
        message === '/markdown'
          ? `# Markdown 示例

支持 **加粗**、*斜体*、\`行内代码\`、列表等。

- 列表项 1
- 列表项 2

\`\`\`ts
export function hello(name: string) {
  return \`Hello, \${name}\`;
}
\`\`\`
`
          : `收到：${message}`;

      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: 'assistant',
          content,
          time: dayjs().format('HH:mm'),
        },
      ]);
      setLoading(false);
    }, 600);
  }
}
