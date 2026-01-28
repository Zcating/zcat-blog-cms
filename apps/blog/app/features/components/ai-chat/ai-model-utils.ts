/**
 * AI模型API密钥工具函数
 */

import { ZNotification } from '@zcat/ui';

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
export async function checkApiKey(model: ApiModelName): Promise<string> {
  const storageKey = getApiKeyStorageKey(model);
  const apiKey = localStorage.getItem(storageKey);
  if (!apiKey) {
    return '';
  }

  const isSuccess = await AiApi.test(model, apiKey);
  if (!isSuccess) {
    return '';
  }

  return apiKey;
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

interface ApiKeyPromptionResult {
  model: ApiModelName;
  apiKey: string;
}

export async function apiKeyPromption(
  model?: ApiModelName,
): Promise<ApiKeyPromptionResult | null> {
  if (!model) {
    ZNotification.error('请选择AI模型');
    return null;
  }

  // 检查API密钥是否存在
  const apiKey = await checkApiKey(model);
  if (apiKey) {
    return { model, apiKey };
  }

  const shouldSetup = await showApiKeyMissingDialog(model);

  if (!shouldSetup) {
    // 用户选择稍后设置，不发送消息
    return null;
  }

  // 显示API密钥输入弹窗
  const inputedApiKey = await showApiKeyDialog(model);

  if (!inputedApiKey) {
    // 用户取消输入，不发送消息
    return null;
  }

  // 保存API密钥
  try {
    const isSuccess = await AiApi.test(model, inputedApiKey);
    if (!isSuccess) {
      return null;
    }
    saveApiKey(model, inputedApiKey);
    return { model, apiKey: inputedApiKey };
  } catch (error) {
    // 保存失败，不发送消息
    console.error('保存API密钥失败:', error);
    return null;
  }
}
