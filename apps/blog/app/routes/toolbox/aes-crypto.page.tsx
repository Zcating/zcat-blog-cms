import {
  ZButton,
  ZView,
  ZSelect,
  ZTextarea,
  createZForm,
  ZInput,
  ZToggleGroup,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Label,
  copyToClipboard,
  useWatch,
} from '@zcat/ui';
import CryptoJS from 'crypto-js';
import { Lock, Unlock, ArrowDown, Copy, Settings } from 'lucide-react';
import React from 'react';
import { z } from 'zod';

import {
  AES_ENCODINGS,
  AES_MODES,
  AES_PADDINGS,
  OPERATION_MODES,
  runAesCryptoLogic,
} from '@blog/features';

export function meta() {
  return [
    { title: 'AES 加解密' },
    { name: 'description', content: '在线 AES 加密、解密工具' },
  ];
}

const AesFormSchema = z
  .object({
    mode: z.enum(OPERATION_MODES.map((item) => item.value)),
    text: z.string().min(1, '请输入内容'),
    key: z.string().min(1, '请输入密钥'),
    keyEncoding: z.enum(AES_ENCODINGS.map((item) => item.value)),
    iv: z.string().optional(),
    ivEncoding: z.enum(AES_ENCODINGS.map((item) => item.value)),
    plaintextEncoding: z.enum(AES_ENCODINGS.map((item) => item.value)),
    ciphertextEncoding: z.enum(AES_ENCODINGS.map((item) => item.value)),
    aesMode: z.enum(AES_MODES.map((item) => item.value)),
    padding: z.enum(AES_PADDINGS.map((item) => item.value)),
  })
  .refine(
    (data) => {
      if (data.aesMode !== 'ECB' && !data.iv) {
        return false;
      }

      return true;
    },

    {
      message: '非 ECB 模式下，请填写 IV',
      path: ['iv'], // 错误信息位置
    },
  );

interface CipherOption {
  mode: (typeof CryptoJS.mode)['CBC'];
  padding: (typeof CryptoJS.pad)['Pkcs7'];
  iv?: CryptoJS.lib.WordArray;
}

const AesForm = createZForm(AesFormSchema);

export default function AesCryptoPage() {
  const [result, setResult] = React.useState('');

  const form = AesForm.useForm({
    defaultValues: {
      mode: 'encrypt',
      aesMode: 'CBC',
      padding: 'Pkcs7',
      text: '',
      key: '',
      keyEncoding: 'Utf8',
      iv: '',
      ivEncoding: 'Utf8',
      plaintextEncoding: 'Utf8',
      ciphertextEncoding: 'Base64',
    },
    onSubmit: (data) => {
      try {
        const result = runAesCryptoLogic(data);

        setResult(result);
      } catch (error: any) {
        //
        console.log(error);
      }
    },
  });

  const operationMode = form.instance.watch('mode');
  const currentAesMode = form.instance.watch('aesMode');

  useWatch([operationMode], (mode) => {
    form.instance.setValue('text', '');
    setResult('');
  });

  const copy = () => {
    if (!result) {
      return;
    }
    copyToClipboard(result);
  };

  return (
    <ZView className="p-4 space-y-6 h-full overflow-y-auto">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">AES 加解密</h1>
        <p className="text-sm text-muted-foreground">
          高级加密标准 (AES) 在线工具。支持多种模式 (ECB, CBC等) 和填充方式。
          密钥和 IV 目前仅支持 UTF-8 字符串输入。
        </p>
      </div>

      <AesForm form={form} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 左侧：配置参数 */}
        <Card className="flex flex-col xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              参数设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="flex gap-2 items-start">
              <AesForm.Item name="key" label="密钥 (Key)" className="flex-1">
                <ZTextarea placeholder="请输入密钥" className="font-mono" />
              </AesForm.Item>
              <AesForm.Item
                name="keyEncoding"
                label="编码"
                className="w-28 shrink-0"
              >
                <ZSelect options={AES_ENCODINGS} />
              </AesForm.Item>
            </div>

            {currentAesMode !== 'ECB' && (
              <div className="flex gap-2 items-start">
                <AesForm.Item name="iv" label="偏移量 (IV)" className="flex-1">
                  <ZInput placeholder="请输入 IV (ECB模式无需)" />
                </AesForm.Item>
                <AesForm.Item
                  name="ivEncoding"
                  label="编码"
                  className="w-28 shrink-0"
                >
                  <ZSelect options={AES_ENCODINGS} />
                </AesForm.Item>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <AesForm.Item name="aesMode" label="加密模式 (Mode)">
                <ZSelect options={AES_MODES} />
              </AesForm.Item>

              <AesForm.Item name="padding" label="填充方式 (Padding)">
                <ZSelect options={AES_PADDINGS} />
              </AesForm.Item>
            </div>

            <AesForm.Item name="plaintextEncoding" label="明文编码 (Input)">
              <ZSelect options={AES_ENCODINGS} />
            </AesForm.Item>

            <AesForm.Item name="ciphertextEncoding" label="密文编码 (Output)">
              <ZSelect options={AES_ENCODINGS} />
            </AesForm.Item>
          </CardContent>
        </Card>

        {/* 右侧：加解密操作 */}
        <Card className="flex flex-col xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {operationMode === 'encrypt' ? (
                <Lock className="w-5 h-5" />
              ) : (
                <Unlock className="w-5 h-5" />
              )}
              操作区
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex-1">
            <AesForm.Item name="mode" label="操作模式">
              <ZToggleGroup type="single" options={OPERATION_MODES} />
            </AesForm.Item>

            <AesForm.Item
              name="text"
              label={
                operationMode === 'encrypt' ? '明文 (Input)' : '密文 (Input)'
              }
            >
              <ZTextarea
                className="font-mono min-h-32"
                placeholder={
                  operationMode === 'encrypt'
                    ? '请输入要加密的内容...'
                    : '请输入要解密的内容...'
                }
              />
            </AesForm.Item>

            <div className="flex justify-center">
              <ZButton
                type="submit"
                className="w-full md:w-auto md:min-w-[200px]"
              >
                <ArrowDown className="w-4 h-4 mr-2" />
                {operationMode === 'encrypt' ? '执行加密' : '执行解密'}
              </ZButton>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>
                  {operationMode === 'encrypt'
                    ? '密文 (Output)'
                    : '明文 (Output)'}
                </Label>
                <ZButton
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={copy}
                  disabled={!result}
                >
                  <Copy className="w-4 h-4 mr-1" /> 复制
                </ZButton>
              </div>
              <ZTextarea
                className="font-mono min-h-32 break-all"
                value={result}
                readOnly
                placeholder="结果将显示在这里..."
              />
            </div>
          </CardContent>
        </Card>
      </AesForm>
    </ZView>
  );
}
