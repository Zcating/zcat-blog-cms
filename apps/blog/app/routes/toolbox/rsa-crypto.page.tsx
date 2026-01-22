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
} from '@zcat/ui';
import { ArrowDown, Copy, Key, Lock, Unlock } from 'lucide-react';
import { useState } from 'react';

let rsaWasmLoaded = false;

const uint8ArrayToBase64 = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const base64ToUint8Array = (base64: string) => {
  const binary_string = window.atob(base64);
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

export default function RsaCryptoPage() {
  // 密钥生成
  const [keySize, setKeySize] = useState('1024');
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 加密/解密
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [inputKey, setInputKey] = useState('');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');

  const generateKeys = () => {
    setIsGenerating(true);
    // 使用 setTimeout 让出主线程，避免 UI 卡死
    setTimeout(async () => {
      try {
        if (!rsaWasmLoaded) {
          await CryptoJSW.RSA.loadWasm();
          rsaWasmLoaded = true;
        }
        CryptoJSW.RSA.updateRsaKey(parseInt(keySize));
        const pub = CryptoJSW.RSA.getKeyContent('public', 'pem');
        const priv = CryptoJSW.RSA.getKeyContent('private', 'pem');
        setPublicKey(pub);
        setPrivateKey(priv);

        // 自动填充到操作区
        if (mode === 'encrypt') {
          setInputKey(pub);
        } else {
          setInputKey(priv);
        }
      } catch (e) {
        console.error('生成密钥失败', e);
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  };

  const handleProcess = async () => {
    if (!inputKey || !inputText) return;
    try {
      if (!rsaWasmLoaded) {
        await CryptoJSW.RSA.loadWasm();
        rsaWasmLoaded = true;
      }

      if (mode === 'encrypt') {
        try {
          const encrypted = CryptoJSW.RSA.encrypt(inputText, {
            key: inputKey,
            isPublicKey: true,
            encryptPadding: 'PKCS1V15',
          });
          setOutputText(uint8ArrayToBase64(encrypted));
        } catch {
          setOutputText('加密失败：可能公钥无效或文本过长');
        }
      } else {
        try {
          const decrypted = CryptoJSW.RSA.decrypt(
            base64ToUint8Array(inputText),
            {
              key: inputKey,
              isPublicKey: false,
              encryptPadding: 'PKCS1V15',
            },
          );
          setOutputText(new TextDecoder().decode(decrypted));
        } catch {
          setOutputText('解密失败：可能私钥无效或密文不匹配');
        }
      }
    } catch (e) {
      setOutputText('处理出错：' + (e as Error).message);
    }
  };

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
          <CardContent className="space-y-4 flex-1">
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label>密钥长度</Label>
                <ZSelect
                  options={KEY_SIZE_OPTIONS}
                  value={keySize}
                  onValueChange={setKeySize}
                />
              </div>
              <ZButton onClick={generateKeys} loading={isGenerating}>
                {isGenerating ? '生成中...' : '生成密钥对'}
              </ZButton>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>公钥 (Public Key)</Label>
                <ZButton
                  variant="ghost"
                  size="sm"
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
          </CardContent>
        </Card>

        {/* 右侧：加解密操作 */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {mode === 'encrypt' ? (
                <Lock className="w-5 h-5" />
              ) : (
                <Unlock className="w-5 h-5" />
              )}
              加解密测试
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <ZToggleGroup
              type="single"
              options={MODE_OPTIONS}
              value={mode}
              onValueChange={(value) => {
                const newMode = value as 'encrypt' | 'decrypt';
                setMode(newMode);
                if (newMode === 'encrypt' && publicKey) {
                  setInputKey(publicKey);
                } else if (newMode === 'decrypt' && privateKey) {
                  setInputKey(privateKey);
                }
              }}
            />

            <div className="space-y-2">
              <Label>
                {mode === 'encrypt'
                  ? '公钥 (Public Key)'
                  : '私钥 (Private Key)'}
              </Label>
              <ZTextarea
                className="font-mono text-xs min-h-24"
                value={inputKey}
                onValueChange={setInputKey}
                placeholder={
                  mode === 'encrypt' ? '请输入公钥...' : '请输入私钥...'
                }
              />
            </div>

            <div className="space-y-2">
              <Label>
                {mode === 'encrypt' ? '明文 (Input)' : '密文 (Input)'}
              </Label>
              <ZTextarea
                className="min-h-24"
                value={inputText}
                onValueChange={setInputText}
                placeholder={
                  mode === 'encrypt'
                    ? '请输入要加密的内容...'
                    : '请输入要解密的内容...'
                }
              />
            </div>

            <div className="flex justify-center">
              <ZButton className="w-full" onClick={handleProcess}>
                <ArrowDown className="w-4 h-4 mr-2" />
                {mode === 'encrypt' ? '执行加密' : '执行解密'}
              </ZButton>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>
                  {mode === 'encrypt' ? '密文 (Output)' : '明文 (Output)'}
                </Label>
                <ZButton
                  variant="ghost"
                  size="sm"
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
          </CardContent>
        </Card>
      </div>
    </ZView>
  );
}
