import type { LucideIcon } from 'lucide-react';
import {
  FileCode,
  FileJsonIcon,
  Globe,
  Hash,
  IdCard,
  Image as ImageIcon,
  Key,
  Lock,
  QrCode,
} from 'lucide-react';

export type ToolEntry = {
  name: string;
  description: string;
  path: string;
  Icon: LucideIcon;
};

export const TOOL_REGISTRY: readonly ToolEntry[] = [
  {
    name: 'Markdown 转 HTML',
    description: '将 Markdown 转换为 HTML 源码，支持 GFM 和数学公式。',
    path: '/toolbox/markdown-to-html',
    Icon: FileCode,
  },
  {
    name: 'JSON 查看器',
    description: '在线查看和格式化 JSON 数据，方便调试与分析。',
    path: '/toolbox/json-viewer',
    Icon: FileJsonIcon,
  },
  {
    name: 'IP 查询',
    description: '查询当前网络 IP 地址及归属地信息。',
    path: '/toolbox/ip-lookup',
    Icon: Globe,
  },
  {
    name: 'Hash 计算',
    description: '计算文本的 MD5、SHA-1、SHA-256、SHA-512 摘要。',
    path: '/toolbox/hash',
    Icon: Hash,
  },
  {
    name: 'AES 加解密',
    description: '用 AES 密钥对文本加密或解密，可选加密模式与填充方式。',
    path: '/toolbox/aes-crypto',
    Icon: Lock,
  },
  {
    name: 'RSA 加解密',
    description: '在线生成 RSA 密钥对，进行公钥加密和私钥解密。',
    path: '/toolbox/rsa-crypto',
    Icon: Key,
  },
  {
    name: '图片和 Base64 互转',
    description: '将图片转换为 Base64，或将 Base64 还原为图片。',
    path: '/toolbox/base64-to-image',
    Icon: ImageIcon,
  },
  {
    name: '二维码生成',
    description: '把文本或网址生成二维码，可调尺寸、颜色与纠错等级。',
    path: '/toolbox/qrcode-generator',
    Icon: QrCode,
  },
  {
    name: '身份证生成',
    description: '生成符合规则的身份证信息，用于测试与演示场景。',
    path: '/toolbox/id-card-generator',
    Icon: IdCard,
  },
];
