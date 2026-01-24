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
import { useEffect, useRef, useState } from 'react';
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

type AesEncodingEnum = 'Utf8' | 'Hex' | 'Base64' | 'Latin1';
const AES_ENCODINGS = [
  { label: 'UTF-8', value: 'Utf8' },
  { label: 'Hex', value: 'Hex' },
  { label: 'Base64', value: 'Base64' },
  { label: 'Latin1', value: 'Latin1' },
] as CommonOption<AesEncodingEnum>[];

const OPERATION_MODES = [
  { label: '加密', value: 'encrypt' },
  { label: '解密', value: 'decrypt' },
];

const AesFormSchema = z.object({
  mode: z.enum(['encrypt', 'decrypt']),
  text: z.string().min(1, '请输入内容'),
  key: z.string().min(1, '请输入密钥'),
  keyEncoding: z.enum(AES_ENCODINGS.map((item) => item.value)),
  iv: z.string().optional(),
  ivEncoding: z.enum(AES_ENCODINGS.map((item) => item.value)),
  inputEncoding: z.enum(AES_ENCODINGS.map((item) => item.value)),
  outputEncoding: z.enum(AES_ENCODINGS.map((item) => item.value)),
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
  const [outputByMode, setOutputByMode] = useState<{
    encrypt: string;
    decrypt: string;
  }>({
    encrypt: '',
    decrypt: '',
  });
  const textCacheRef = useRef<{ encrypt: string; decrypt: string }>({
    encrypt: '',
    decrypt: '',
  });

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
      inputEncoding: 'Utf8',
      outputEncoding: 'Base64',
    },
    onSubmit: (data) => {
      try {
        const {
          mode,
          text,
          key,
          keyEncoding,
          iv,
          ivEncoding,
          inputEncoding,
          outputEncoding,
          aesMode,
          padding,
        } = data;

        const setOutputForMode = (value: string) => {
          setOutputByMode((prev) => ({ ...prev, [mode]: value }));
        };

        // Config
        const config: CipherOption = {
          mode: CryptoJS.mode[aesMode],
          padding: CryptoJS.pad[padding],
        };

        const parseInput = (input: string, encoding: AesEncodingEnum) => {
          try {
            // 清理空白字符，避免 Base64/Hex 解析因换行符报错
            const cleanInput =
              encoding === 'Base64' || encoding === 'Hex'
                ? input.replace(/\s/g, '')
                : input;

            return CryptoJS.enc[encoding].parse(cleanInput);
          } catch (e) {
            throw new Error(
              `无法使用 ${encoding} 解析输入: ${(e as Error).message}`,
            );
          }
        };

        const formatOutput = (
          wordArray: CryptoJS.lib.WordArray,
          encoding: AesEncodingEnum,
        ) => {
          try {
            return wordArray.toString(CryptoJS.enc[encoding]);
          } catch (e) {
            throw new Error(
              `无法使用 ${encoding} 格式化输出: ${(e as Error).message}`,
            );
          }
        };

        // IV 处理：ECB 不需要 IV，其他模式如果用户输入了 IV 则使用
        if (aesMode !== 'ECB' && iv) {
          config.iv = parseInput(iv, ivEncoding);
        }

        const keyParsed = parseInput(key, keyEncoding);
        const textParsed =
          mode === 'encrypt'
            ? parseInput(text, inputEncoding) // 加密时，输入可能是 Utf8, Hex 等
            : parseInput(text, inputEncoding); // 解密时，输入通常是 Base64/Hex

        let result;
        if (mode === 'encrypt') {
          // encrypt 接受 WordArray
          const encrypted = CryptoJS.AES.encrypt(textParsed, keyParsed, config);
          // 加密结果通常转换为 Base64 或 Hex
          result = formatOutput(encrypted.ciphertext, outputEncoding);
        } else {
          // 解密
          // decrypt 接受 CipherParams (或 Base64 字符串)
          // 这里我们传入 WordArray (作为 ciphertext)，需要构建 CipherParams
          const cipherParams = CryptoJS.lib.CipherParams.create({
            ciphertext: textParsed,
          });
          const decrypted = CryptoJS.AES.decrypt(
            cipherParams,
            keyParsed,
            config,
          );

          if (outputEncoding === 'Utf8') {
            try {
              result = decrypted.toString(CryptoJS.enc.Utf8);
            } catch {
              // UTF8 转换失败，尝试 Hex 并提示
              result = decrypted.toString(CryptoJS.enc.Hex);
              setOutputForMode(
                `解密成功，但结果不是有效的 UTF-8 文本。已自动转为 Hex 显示。\n结果: ${result}`,
              );
              return;
            }
          } else {
            result = formatOutput(decrypted, outputEncoding);
          }
        }

        setOutputForMode(
          result ||
            (mode === 'decrypt'
              ? '解密结果为空（可能密钥错误、填充不匹配或密文损坏）'
              : ''),
        );
      } catch (error: any) {
        // 捕获解密过程中的具体错误（如 Padding Error）
        let msg = (error as Error).message;
        if (msg.includes('Malformed UTF-8')) {
          msg = '解密后数据不是有效的 UTF-8 文本（密钥错误？）';
        } else if (msg.includes('Invalid padding')) {
          msg = '填充无效（密钥错误或填充方式选择错误？）';
        }
        setOutputByMode((prev) => ({
          ...prev,
          [data.mode]: '执行出错: ' + msg,
        }));
      }
    },
  });

  const operationMode = form.instance.watch('mode');
  const currentAesMode = form.instance.watch('aesMode');
  const lastModeRef = useRef(operationMode);
  const output = outputByMode[operationMode] ?? '';

  useEffect(() => {
    if (lastModeRef.current === operationMode) return;

    const prevMode = lastModeRef.current;
    textCacheRef.current[prevMode] = form.instance.getValues('text') ?? '';

    lastModeRef.current = operationMode;

    const cachedText = textCacheRef.current[operationMode] ?? '';

    let nextText = cachedText;
    if (!nextText) {
      if (operationMode === 'decrypt') {
        nextText = outputByMode.encrypt ?? '';
      } else {
        nextText = outputByMode.decrypt ?? '';
      }
    }

    form.instance.setValue('text', nextText);
    form.instance.clearErrors('text');
  }, [form.instance, operationMode, outputByMode]);

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

            <AesForm.Item name="inputEncoding" label="明文编码 (Input)">
              <ZSelect options={AES_ENCODINGS} />
            </AesForm.Item>

            <AesForm.Item name="outputEncoding" label="密文编码 (Output)">
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
