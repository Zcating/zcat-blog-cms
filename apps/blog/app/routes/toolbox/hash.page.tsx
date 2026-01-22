import {
  ZButton,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  ZTextarea,
  ZView,
} from '@zcat/ui';
import { ArrowDown, Copy, Hash } from 'lucide-react';
import { useState } from 'react';
import SparkMD5 from 'spark-md5';

export function meta() {
  return [
    { title: 'Hash 计算工具' },
    {
      name: 'description',
      content: '在线计算文本的 MD5, SHA-1, SHA-256, SHA-512 哈希值',
    },
  ];
}

export default function HashPage() {
  const [inputText, setInputText] = useState('');
  const [hashes, setHashes] = useState({
    md5: '',
    sha1: '',
    sha256: '',
    sha512: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // 计算 SHA 系列哈希 (使用浏览器原生 API)
  const computeSHA = async (text: string, algorithm: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const handleProcess = async () => {
    if (!inputText) return;
    setIsProcessing(true);

    try {
      // MD5 (使用 spark-md5)
      const md5 = SparkMD5.hash(inputText);

      // SHA 系列 (并行计算)
      const [sha1, sha256, sha512] = await Promise.all([
        computeSHA(inputText, 'SHA-1'),
        computeSHA(inputText, 'SHA-256'),
        computeSHA(inputText, 'SHA-512'),
      ]);

      setHashes({
        md5,
        sha1,
        sha256,
        sha512,
      });
    } catch (e) {
      console.error('Hash calculation failed', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <ZView className="p-4 space-y-6 h-full overflow-y-auto">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Hash 计算</h1>
        <p className="text-sm text-muted-foreground">
          常用的哈希算法工具。支持计算 MD5, SHA-1, SHA-256, SHA-512。
          所有计算均在本地浏览器完成，不会上传服务器。
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 左侧：输入区 */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5" />
              内容输入
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="space-y-2">
              <Label>原文 (Input)</Label>
              <ZTextarea
                className="min-h-64 font-mono text-sm"
                value={inputText}
                onValueChange={setInputText}
                placeholder="请输入需要计算 Hash 的内容..."
              />
            </div>
            <ZButton
              className="w-full"
              onClick={handleProcess}
              loading={isProcessing}
              disabled={!inputText}
            >
              <ArrowDown className="w-4 h-4 mr-2" />
              开始计算
            </ZButton>
          </CardContent>
        </Card>

        {/* 右侧：结果区 */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5" />
              计算结果
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex-1">
            {/* MD5 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>MD5</Label>
                <ZButton
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(hashes.md5)}
                  disabled={!hashes.md5}
                >
                  <Copy className="w-4 h-4 mr-1" /> 复制
                </ZButton>
              </div>
              <ZTextarea
                className="font-mono text-xs h-10 min-h-0 resize-none"
                value={hashes.md5}
                readOnly
                placeholder="MD5 结果..."
              />
            </div>

            {/* SHA-1 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>SHA-1</Label>
                <ZButton
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(hashes.sha1)}
                  disabled={!hashes.sha1}
                >
                  <Copy className="w-4 h-4 mr-1" /> 复制
                </ZButton>
              </div>
              <ZTextarea
                className="font-mono text-xs h-10 min-h-0 resize-none"
                value={hashes.sha1}
                readOnly
                placeholder="SHA-1 结果..."
              />
            </div>

            {/* SHA-256 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>SHA-256</Label>
                <ZButton
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(hashes.sha256)}
                  disabled={!hashes.sha256}
                >
                  <Copy className="w-4 h-4 mr-1" /> 复制
                </ZButton>
              </div>
              <ZTextarea
                className="font-mono text-xs h-16 min-h-0 resize-none"
                value={hashes.sha256}
                readOnly
                placeholder="SHA-256 结果..."
              />
            </div>

            {/* SHA-512 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>SHA-512</Label>
                <ZButton
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(hashes.sha512)}
                  disabled={!hashes.sha512}
                >
                  <Copy className="w-4 h-4 mr-1" /> 复制
                </ZButton>
              </div>
              <ZTextarea
                className="font-mono text-xs h-24 min-h-0 resize-none"
                value={hashes.sha512}
                readOnly
                placeholder="SHA-512 结果..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </ZView>
  );
}
