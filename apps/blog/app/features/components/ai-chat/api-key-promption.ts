/**
 * AI模型API密钥工具函数
 */

import { ZNotification } from '@zcat/ui';

import { AiApi } from './ai-api';
import { showApiKeyDialog, showApiKeyMissingDialog } from './api-key-dialog';

interface ApiKeyPromptionResult {
  model: AiApi.ChatModelName;
  apiKey: string;
}

export async function apiKeyPromption(
  model?: AiApi.ChatModelName,
): Promise<ApiKeyPromptionResult | null> {
  if (!model) {
    ZNotification.error('请选择AI模型');
    return null;
  }

  // 检查API密钥是否存在
  const apiKey = await AiApi.checkApiKey(model);
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
    AiApi.saveApiKey(model, inputedApiKey);
    return { model, apiKey: inputedApiKey };
  } catch (error) {
    // 保存失败，不发送消息
    console.error('保存API密钥失败:', error);
    return null;
  }
}
