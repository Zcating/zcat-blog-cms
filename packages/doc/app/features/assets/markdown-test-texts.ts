export const markdownFirstText = `使用API实现联网搜索功能，你需要按照以下步骤操作：

## **1. 获取API密钥**
- 前往DeepSeek平台注册并获取API密钥
- 确保你的账户有相应的API调用权限

## **2. API调用方式**

### **基本调用示例（Python）：**
\`\`\`python
import requests

api_key = "你的API密钥"
url = "https://api.deepseek.com/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

data = {
    "model": "deepseek-chat",
    "messages": [
        {"role": "user", "content": "请搜索今天的最新科技新闻"}
    ],
    "web_search": True  # 关键参数：启用联网搜索
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result["choices"][0]["message"]["content"])
\`\`\`

## **3. 关键参数说明**

### **必须设置的参数：**
\`\`\`json
{
    "model": "deepseek-chat",  // 或 "deepseek-reasoner"
    "messages": [...],
    "web_search": true,        // 启用联网搜索
    "stream": false            // 是否使用流式响应
}
\`\`\`

### **完整参数示例：**
\`\`\`python
data = {
    "model": "deepseek-chat",
    "messages": [
        {"role": "system", "content": "你是一个有帮助的助手"},
        {"role": "user", "content": "搜索OpenAI最新发布的模型信息"}
    ],
    "web_search": True,
    "max_tokens": 2000,
    "temperature": 0.7,
    "top_p": 0.9
}
\`\`\`

## **4. 流式响应处理**
\`\`\`python
import json

data["stream"] = True

response = requests.post(url, headers=headers, json=data, stream=True)

for line in response.iter_lines():
    if line:
        line = line.decode('utf-8')
        if line.startswith('data: '):
            data = line[6:]  # 去掉"data: "前缀
            if data != '[DONE]':
                chunk = json.loads(data)
                # 处理返回的数据
                if "choices" in chunk:
                    content = chunk["choices"][0].get("delta", {}).get("content", "")
                    if content:
                        print(content, end="", flush=True)
\`\`\`

## **5. 注意事项**

### **API限制：**
- 确保API密钥有足够的额度
- 注意调用频率限制
- 联网搜索可能会消耗更多token

### **错误处理：**
\`\`\`python
try:
    response = requests.post(url, headers=headers, json=data, timeout=30)
    response.raise_for_status()
    result = response.json()
    
    if "error" in result:
        print(f"API错误: {result['error']['message']}")
    else:
        print(result["choices"][0]["message"]["content"])
        
except requests.exceptions.RequestException as e:
    print(f"网络请求错误: {e}")
except json.JSONDecodeError as e:
    print(f"JSON解析错误: {e}")
\`\`\`

## **6. 官方文档参考**
建议查看DeepSeek官方API文档获取最新信息：
- 端点地址和参数可能有更新
- 支持的功能和模型版本
- 具体的计费标准和限制

## **7. 简单测试脚本**
\`\`\`python
def test_web_search(api_key, query):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "deepseek-chat",
        "messages": [{"role": "user", "content": query}],
        "web_search": True
    }
    
    response = requests.post(
        "https://api.deepseek.com/v1/chat/completions",
        headers=headers,
        json=payload
    )
    
    return response.json()

# 使用示例
result = test_web_search("your-api-key", "搜索今天的股市行情")
print(result)
\`\`\`

记得替换 \`"你的API密钥"\` 为实际的API密钥，并根据需要调整参数！如果有具体的技术问题，可以查看官方文档或告诉我更多细节，我可以帮你调试。🚀`;
