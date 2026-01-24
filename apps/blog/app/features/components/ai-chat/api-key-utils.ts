/**
 * AI模型API密钥工具函数
 */

export type ApiModelName = 'deepseek';

/**
 * 获取API密钥存储键名
 */
export function getApiKeyStorageKey(apiModel: ApiModelName): string {
  return `model-${apiModel}-api-key`;
}

/**
 * 检查指定UI模型的API密钥是否存在
 */
export function checkApiKey(model: ApiModelName): boolean {
  const storageKey = getApiKeyStorageKey(model);
  const apiKey = localStorage.getItem(storageKey);
  return !!apiKey && apiKey.trim().length > 0;
}

/**
 * 获取指定UI模型的API密钥
 */
export function getApiKey(model: ApiModelName): string | null {
  const storageKey = getApiKeyStorageKey(model);
  return localStorage.getItem(storageKey);
}

/**
 * 保存API密钥
 */
export function saveApiKey(model: ApiModelName, apiKey: string): void {
  const storageKey = getApiKeyStorageKey(model);

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API密钥不能为空');
  }

  localStorage.setItem(storageKey, apiKey.trim());
}

/**
 * 删除API密钥
 */
export function deleteApiKey(model: ApiModelName): void {
  const storageKey = getApiKeyStorageKey(model);
  localStorage.removeItem(storageKey);
}

/**
 * 获取所有已保存的API密钥信息
 */
export function getAllApiKeys(): Array<{
  model: ApiModelName;
  storageKey: string;
  hasKey: boolean;
}> {
  const models: ApiModelName[] = ['deepseek'];

  return models.map((model) => {
    const storageKey = getApiKeyStorageKey(model);
    const hasKey = checkApiKey(model);

    return {
      model,
      storageKey,
      hasKey,
    };
  });
}
