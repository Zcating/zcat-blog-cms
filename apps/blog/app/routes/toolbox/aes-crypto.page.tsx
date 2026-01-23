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
} from '@zcat/ui';
import CryptoJS from 'crypto-js';
import { Lock, Unlock, ArrowDown, Copy, Settings } from 'lucide-react';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';

export function meta() {
  return [
    { title: 'AES 加解密' },
    { name: 'description', content: '在线 AES 加密、解密工具' },
  ];
}

type AesModeEnum = 'CBC' | 'ECB' | 'CFB' | 'OFB' | 'CTR';
const AES_MODES = [
  { label: 'CBC', value: 'CBC' },
  { label: 'ECB', value: 'ECB' },
  { label: 'CFB', value: 'CFB' },
  { label: 'OFB', value: 'OFB' },
  { label: 'CTR', value: 'CTR' },
] as CommonOption<AesModeEnum>[];

type AesPaddingEnum =
  | 'Pkcs7'
  | 'Iso97971'
  | 'AnsiX923'
  | 'Iso10126'
  | 'ZeroPadding'
  | 'NoPadding';
const AES_PADDINGS = [
  { label: 'Pkcs7', value: 'Pkcs7' },
  { label: 'Iso97971', value: 'Iso97971' },
  { label: 'AnsiX923', value: 'AnsiX923' },
  { label: 'Iso10126', value: 'Iso10126' },
  { label: 'ZeroPadding', value: 'ZeroPadding' },
  { label: 'NoPadding', value: 'NoPadding' },
] as CommonOption<AesPaddingEnum>[];

const OPERATION_MODES = [
  { label: '加密', value: 'encrypt' },
  { label: '解密', value: 'decrypt' },
];

const AesFormSchema = z.object({
  mode: z.enum(['encrypt', 'decrypt']),
  text: z.string().min(1, '请输入内容'),
  key: z.string().min(1, '请输入密钥'),
  iv: z.string().optional(),
  aesMode: z.enum(AES_MODES.map((item) => item.value)),
  padding: z.enum(AES_PADDINGS.map((item) => item.value)),
});

interface CipherOption {
  mode: (typeof CryptoJS.mode)['CBC'];
  padding: (typeof CryptoJS.pad)['Pkcs7'];
  iv?: CryptoJS.lib.WordArray;
}

const AesForm = createZForm(AesFormSchema);

export default function AesCryptoPage() {
  const [output, setOutput] = useState('');

  const form = AesForm.useForm({
    defaultValues: {
      mode: 'encrypt',
      aesMode: 'CBC',
      padding: 'Pkcs7',
      text: '',
      key: '',
      iv: '',
    },
    onSubmit: (data) => {
      try {
        const { mode, text, key, iv, aesMode, padding } = data;

        // Config
        const config: CipherOption = {
          mode: CryptoJS.mode[aesMode],
          padding: CryptoJS.pad[padding],
        };

        // IV 处理：ECB 不需要 IV，其他模式如果用户输入了 IV 则使用
        if (aesMode !== 'ECB' && iv) {
          config.iv = CryptoJS.enc.Utf8.parse(iv);
        }

        const keyParsed = CryptoJS.enc.Utf8.parse(key);

        let result;
        if (mode === 'encrypt') {
          result = CryptoJS.AES.encrypt(text, keyParsed, config).toString();
        } else {
          // 解密
          const decrypted = CryptoJS.AES.decrypt(text, keyParsed, config);
          result = decrypted.toString(CryptoJS.enc.Utf8);
          if (!result && decrypted.sigBytes > 0) {
            // 可能是解密成功但编码不是 UTF8，或者其他情况，这里简单处理
            // 实际上如果是空字符串可能是解密失败或者原内容为空
          }
        }

        setOutput(
          result ||
            (mode === 'decrypt'
              ? '解密结果为空（可能密钥错误或填充不匹配）'
              : ''),
        );
      } catch (error: any) {
        setOutput('执行出错: ' + (error as Error).message);
      }
    },
  });

  const operationMode = form.instance.watch('mode');
  const currentAesMode = form.instance.watch('aesMode');

  const copyToClipboard = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
    }
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
            <AesForm.Item name="key" label="密钥 (Key)">
              <ZInput placeholder="请输入密钥" />
            </AesForm.Item>

            {currentAesMode !== 'ECB' && (
              <AesForm.Item name="iv" label="偏移量 (IV)">
                <ZInput placeholder="请输入 IV (ECB模式无需)" />
              </AesForm.Item>
            )}

            <AesForm.Item name="aesMode" label="加密模式 (Mode)">
              <ZSelect options={AES_MODES} />
            </AesForm.Item>

            <AesForm.Item name="padding" label="填充方式 (Padding)">
              <ZSelect options={AES_PADDINGS} />
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
                  onClick={() => copyToClipboard(output)}
                  disabled={!output}
                >
                  <Copy className="w-4 h-4 mr-1" /> 复制
                </ZButton>
              </div>
              <ZTextarea
                className="font-mono min-h-32 break-all"
                value={output}
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
