import { Label, ZButton, ZDialog, ZInput } from '@zcat/ui';
import React from 'react';

import { AiApi } from './ai-api';

import type { ApiModelName } from './ai-model-utils';

export interface ApiKeyDialogProps {
  /** 模型名称 */
  modelName: ApiModelName;
  /** 模型显示名称 */
  modelDisplayName: string;
}

export interface ApiKeyDialogResult {
  /** 用户是否确认 */
  confirmed: boolean;
  /** 输入的API密钥（仅在confirmed为true时有效） */
  apiKey?: string;
}

interface ApiKeyContentProps {
  onSubmit: (apiKey: string) => Promise<boolean>;
  onClose: () => void;
}

function ApiKeyContent({ onSubmit, onClose }: ApiKeyContentProps) {
  const [apiKeyValue, setApiKeyValue] = React.useState('');
  const [hasError, setHasError] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const result = await onSubmit(apiKeyValue).catch(() => false);
    if (result) {
      onClose();
    } else {
      setHasError(true);
    }
    setLoading(false);
  };

  const handleApiKeyChange = (value: string) => {
    setApiKeyValue(value);
    if (hasError) {
      setHasError(false);
    }
  };

  return (
    <div className="space-y-4 py-2">
      {/* <div className="text-sm">
        该模型需要API密钥才能使用。请前往{' '}
        <a
          href="https://platform.deepseek.com/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          DeepSeek平台
        </a>{' '}
        获取API密钥。
      </div> */}

      <div className="space-y-2">
        <Label htmlFor="api-key-input" className="text-sm font-medium">
          API密钥
        </Label>
        <ZInput
          id="api-key-input"
          type="password"
          placeholder="请输入您的API密钥"
          value={apiKeyValue}
          onValueChange={handleApiKeyChange}
          className={hasError ? 'border-destructive' : ''}
          autoFocus
        />
        {hasError && (
          <p className="text-sm text-destructive">请输入有效的API密钥</p>
        )}
      </div>

      <div className="rounded-lg bg-muted p-3 text-sm">
        <p className="font-medium">安全提示：</p>
        <ul className="mt-1 list-disc pl-4 space-y-1">
          <li>API密钥将保存在浏览器的localStorage中</li>
          <li>请勿与他人分享您的API密钥</li>
          <li>定期轮换API密钥以确保安全</li>
        </ul>
      </div>

      <div className="flex justify-end gap-2">
        <ZButton variant="outline" onClick={onClose}>
          取消
        </ZButton>
        <ZButton onClick={handleSubmit} loading={loading}>
          确认
        </ZButton>
      </div>
    </div>
  );
}

/**
 * 显示API密钥输入弹窗
 * @param modelName 模型名称
 * @returns Promise<ApiKeyDialogResult> 用户操作结果
 */
export async function showApiKeyDialog(
  modelName: ApiModelName,
): Promise<string> {
  const resolvers = Promise.withResolvers<string>();

  const handleSubmit = async (apiKey: string) => {
    if (!apiKey) {
      return false;
    }
    const isSuccess = await AiApi.test(modelName, apiKey);
    if (isSuccess) {
      resolvers.resolve(apiKey);
    }
    return isSuccess;
  };

  ZDialog.show({
    title: (
      <div className="flex flex-col gap-1">
        <div className="text-lg font-semibold">请输入API密钥</div>
        <div className="text-sm text-muted-foreground">模型: {modelName}</div>
      </div>
    ),
    content: (props) => {
      return <ApiKeyContent {...props} onSubmit={handleSubmit} />;
    },
    onClose: () => {
      resolvers.resolve('');
    },
    backdropClose: false,
  });

  return resolvers.promise;
}

/**
 * 显示API密钥缺失提示弹窗
 * @param modelName 模型名称
 * @param modelDisplayName 模型显示名称
 * @returns Promise<boolean> 用户是否要立即设置API密钥
 */
export async function showApiKeyMissingDialog(
  modelName: ApiModelName,
): Promise<boolean> {
  return ZDialog.confirm({
    title: 'API密钥缺失',
    content: (
      <div className="space-y-4 py-2">
        <div className="text-sm">
          使用 <span className="font-medium">{modelName}</span>{' '}
          模型需要API密钥。
        </div>

        <div className="rounded-lg bg-muted p-3 text-sm">
          <p>您需要设置API密钥才能使用AI聊天功能。</p>
        </div>
      </div>
    ),
    confirmText: '立即设置',
    cancelText: '稍后设置',
    backdropClose: false,
  });
}
