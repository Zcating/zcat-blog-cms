import CryptoJSW from '@originjs/crypto-js-wasm';
import {
  ZButton,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  ZTextarea,
  ZSelect,
  ZView,
  ZToggleGroup,
  createZForm,
} from '@zcat/ui';
import { ArrowDown, Copy, Key, Lock, Unlock } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { z } from 'zod';

let rsaWasmLoaded = false;

const ensureRsaWasmLoaded = async () => {
  if (rsaWasmLoaded) return;
  await CryptoJSW.RSA.loadWasm();
  rsaWasmLoaded = true;
};

const uint8ArrayToBase64 = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const base64ToUint8Array = (base64: string) => {
  const binary_string = window.atob(base64.replace(/\s/g, ''));
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
};

export function meta() {
  return [
    { title: 'RSA 加解密' },
    {
      name: 'description',
      content: '在线生成 RSA 密钥对，进行公钥加密和私钥解密',
    },
  ];
}

const KEY_SIZE_OPTIONS = [
  { label: '1024 bit', value: '1024' },
  { label: '2048 bit', value: '2048' },
];

const MODE_OPTIONS = [
  { value: 'encrypt', label: '公钥加密' },
  { value: 'decrypt', label: '私钥解密' },
];

const KeyGenSchema = z.object({
  keySize: z.enum(
    KEY_SIZE_OPTIONS.map((item) => item.value) as ['1024', '2048'],
  ),
  publicKey: z.string().default(''),
  privateKey: z.string().default(''),
});

const RsaSchema = z.object({
  mode: z.enum(
    MODE_OPTIONS.map((item) => item.value) as ['encrypt', 'decrypt'],
  ),
  key: z.string().min(1, '请输入密钥'),
  text: z.string().min(1, '请输入内容'),
  outputText: z.string().default(''),
});

const KeyGenForm = createZForm(KeyGenSchema);
const RsaForm = createZForm(RsaSchema);

export default function RsaCryptoPage() {
  const rsaForm = RsaForm.useForm({
    defaultValues: {
      mode: 'encrypt',
      key: '',
      text: '',
      outputText: '',
    },
    onSubmit: async (data) => {
      try {
        await ensureRsaWasmLoaded();

        if (data.mode === 'encrypt') {
          try {
            const encrypted = CryptoJSW.RSA.encrypt(data.text, {
              key: data.key,
              isPublicKey: true,
              encryptPadding: 'PKCS1V15',
            });
            rsaForm.instance.setValue(
              'outputText',
              uint8ArrayToBase64(encrypted),
            );
          } catch {
            rsaForm.instance.setValue(
              'outputText',
              '加密失败：可能公钥无效或文本过长',
            );
          }
        } else {
          try {
            const decrypted = CryptoJSW.RSA.decrypt(
              base64ToUint8Array(data.text),
              {
                key: data.key,
                isPublicKey: false,
                encryptPadding: 'PKCS1V15',
              },
            );
            rsaForm.instance.setValue(
              'outputText',
              new TextDecoder().decode(decrypted),
            );
          } catch {
            rsaForm.instance.setValue(
              'outputText',
              '解密失败：可能私钥无效或密文不匹配',
            );
          }
        }
      } catch (e) {
        rsaForm.instance.setValue(
          'outputText',
          '处理出错：' + (e as Error).message,
        );
      }
    },
  });

  const keyGenForm = KeyGenForm.useForm({
    defaultValues: {
      keySize: '1024',
      publicKey: '',
      privateKey: '',
    },
    onSubmit: async (data) => {
      try {
        await ensureRsaWasmLoaded();
        CryptoJSW.RSA.updateRsaKey(parseInt(data.keySize));
        const pub = CryptoJSW.RSA.getKeyContent('public', 'pem');
        const priv = CryptoJSW.RSA.getKeyContent('private', 'pem');
        keyGenForm.instance.setValue('publicKey', pub);
        keyGenForm.instance.setValue('privateKey', priv);

        const mode = rsaForm.instance.getValues('mode');
        rsaForm.instance.setValue('key', mode === 'encrypt' ? pub : priv);
      } catch (e) {
        console.error('生成密钥失败', e);
      }
    },
  });

  const publicKey = keyGenForm.instance.watch('publicKey');
  const privateKey = keyGenForm.instance.watch('privateKey');
  const outputText = rsaForm.instance.watch('outputText');

  const operationMode = rsaForm.instance.watch('mode');
  const lastModeRef = useRef(operationMode);
  useEffect(() => {
    if (lastModeRef.current === operationMode) return;
    lastModeRef.current = operationMode;

    rsaForm.instance.setValue('text', '');
    rsaForm.instance.clearErrors('text');
    rsaForm.instance.setValue('outputText', '');

    if (operationMode === 'encrypt' && publicKey) {
      rsaForm.instance.setValue('key', publicKey);
      rsaForm.instance.clearErrors('key');
    } else if (operationMode === 'decrypt' && privateKey) {
      rsaForm.instance.setValue('key', privateKey);
      rsaForm.instance.clearErrors('key');
    }
  }, [operationMode, privateKey, publicKey, rsaForm.instance]);

  const copyToClipboard = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      // 这里可以加个 toast 提示
    }
  };

  return (
    <ZView className="p-4 space-y-6 h-full overflow-y-auto">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">RSA 加解密</h1>
        <p className="text-sm text-muted-foreground">
          非对称加密工具。生成公私钥对，验证 RSA
          加密（公钥加密）与解密（私钥解密）流程。
          注意：前端生成大位密钥可能会导致页面短暂卡顿。
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 左侧：密钥生成 */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              密钥生成
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <KeyGenForm form={keyGenForm} className="space-y-4">
              <div className="flex items-end gap-4">
                <KeyGenForm.Item
                  name="keySize"
                  label="密钥长度"
                  className="flex-1"
                >
                  <ZSelect options={KEY_SIZE_OPTIONS} />
                </KeyGenForm.Item>
                <ZButton
                  type="submit"
                  loading={keyGenForm.instance.formState.isSubmitting}
                >
                  {keyGenForm.instance.formState.isSubmitting
                    ? '生成中...'
                    : '生成密钥对'}
                </ZButton>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>公钥 (Public Key)</Label>
                  <ZButton
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => copyToClipboard(publicKey)}
                    disabled={!publicKey}
                  >
                    <Copy className="w-4 h-4 mr-1" /> 复制
                  </ZButton>
                </div>
                <ZTextarea
                  className="font-mono text-xs h-32"
                  value={publicKey}
                  readOnly
                  placeholder="-----BEGIN PUBLIC KEY-----..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>私钥 (Private Key)</Label>
                  <ZButton
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => copyToClipboard(privateKey)}
                    disabled={!privateKey}
                  >
                    <Copy className="w-4 h-4 mr-1" /> 复制
                  </ZButton>
                </div>
                <ZTextarea
                  className="font-mono text-xs min-h-32"
                  value={privateKey}
                  readOnly
                  placeholder="-----BEGIN RSA PRIVATE KEY-----..."
                />
              </div>
            </KeyGenForm>
          </CardContent>
        </Card>

        {/* 右侧：加解密操作 */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {operationMode === 'encrypt' ? (
                <Lock className="w-5 h-5" />
              ) : (
                <Unlock className="w-5 h-5" />
              )}
              加解密测试
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <RsaForm form={rsaForm} className="space-y-4">
              <RsaForm.Item name="mode" label="操作模式">
                <ZToggleGroup type="single" options={MODE_OPTIONS} />
              </RsaForm.Item>

              <RsaForm.Item
                name="key"
                label={
                  operationMode === 'encrypt'
                    ? '公钥 (Public Key)'
                    : '私钥 (Private Key)'
                }
              >
                <ZTextarea
                  className="font-mono text-xs min-h-24"
                  placeholder={
                    operationMode === 'encrypt'
                      ? '请输入公钥...'
                      : '请输入私钥...'
                  }
                />
              </RsaForm.Item>

              <RsaForm.Item
                name="text"
                label={
                  operationMode === 'encrypt' ? '明文 (Input)' : '密文 (Input)'
                }
              >
                <ZTextarea
                  className="min-h-24"
                  placeholder={
                    operationMode === 'encrypt'
                      ? '请输入要加密的内容...'
                      : '请输入要解密的内容...'
                  }
                />
              </RsaForm.Item>

              <div className="flex justify-center">
                <ZButton
                  className="w-full"
                  type="submit"
                  loading={rsaForm.instance.formState.isSubmitting}
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
                    onClick={() => copyToClipboard(outputText)}
                    disabled={!outputText}
                  >
                    <Copy className="w-4 h-4 mr-1" /> 复制
                  </ZButton>
                </div>
                <ZTextarea
                  className="min-h-24 break-all"
                  value={outputText}
                  readOnly
                  placeholder="结果将显示在这里..."
                />
              </div>
            </RsaForm>
          </CardContent>
        </Card>
      </div>
    </ZView>
  );
}
