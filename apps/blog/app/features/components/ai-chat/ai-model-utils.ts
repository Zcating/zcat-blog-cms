/**
 * AI模型API密钥工具函数
 */

import { AiApi } from '@blog/apis';

import { showApiKeyDialog, showApiKeyMissingDialog } from './api-key-dialog';

export type ApiModelName = 'deepseek';

export const API_MODELS: CommonOption<ApiModelName>[] = [
  { value: 'deepseek', label: '深度求索' },
];

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
export function getApiKey(model: ApiModelName): string {
  const storageKey = getApiKeyStorageKey(model);
  return localStorage.getItem(storageKey) ?? '';
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

export async function apiKeyPromption(model: ApiModelName): Promise<boolean> {
  // 检查API密钥是否存在
  const hasApiKey = checkApiKey(model);
  if (hasApiKey) {
    return true;
  }

  const shouldSetup = await showApiKeyMissingDialog(model);

  if (!shouldSetup) {
    // 用户选择稍后设置，不发送消息
    return false;
  }

  // 显示API密钥输入弹窗
  const result = await showApiKeyDialog(model);

  if (!result.confirmed || !result.apiKey) {
    // 用户取消输入，不发送消息
    return false;
  }

  // 保存API密钥
  try {
    const isSuccess = await AiApi.test(model, result.apiKey);
    if (isSuccess) {
      saveApiKey(model, result.apiKey);
    }
    return isSuccess;
  } catch (error) {
    // 保存失败，不发送消息
    console.error('保存API密钥失败:', error);
    return false;
  }
}
