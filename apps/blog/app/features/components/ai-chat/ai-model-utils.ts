/**
 * AI模型API密钥工具函数
 */

import { AiApi } from './ai-api';
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
export async function checkApiKey(model: ApiModelName): Promise<boolean> {
  const storageKey = getApiKeyStorageKey(model);
  const apiKey = localStorage.getItem(storageKey) ?? '';
  return AiApi.test(model, apiKey);
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

export async function apiKeyPromption(model: ApiModelName): Promise<boolean> {
  // 检查API密钥是否存在
  const hasApiKey = await checkApiKey(model);
  console.log('hasApiKey', hasApiKey);
  if (hasApiKey) {
    return true;
  }

  const shouldSetup = await showApiKeyMissingDialog(model);

  if (!shouldSetup) {
    // 用户选择稍后设置，不发送消息
    return false;
  }

  // 显示API密钥输入弹窗
  const apiKey = await showApiKeyDialog(model);

  if (!apiKey) {
    // 用户取消输入，不发送消息
    return false;
  }

  // 保存API密钥
  try {
    const isSuccess = await AiApi.test(model, apiKey);
    if (isSuccess) {
      saveApiKey(model, apiKey);
    }
    return isSuccess;
  } catch (error) {
    // 保存失败，不发送消息
    console.error('保存API密钥失败:', error);
    return false;
  }
}
