---
title: ZQRCode
slug: z-qrcode
---

# ZQRCode

## 用途

把一段内容渲染成 SVG 二维码。

## 基础示例

```tsx
import { ZQRCode } from '@zcat/ui';

<ZQRCode value="https://blog.zcat.example" size={200} />;
```

调整配色与容错等级：

```tsx
import { ZQRCode } from '@zcat/ui';

<ZQRCode value="https://blog.zcat.example" level="H" fgColor="#0f172a" />;
```

## 关键 props

| name               | type                       | default     | 说明                                          |
| ------------------ | -------------------------- | ----------- | --------------------------------------------- |
| `value`            | `string \| string[]`       | —           | 编码内容，必传；数组表示多段                  |
| `size`             | `number`                   | `128`       | 边长，像素                                    |
| `level`            | `'L' \| 'M' \| 'Q' \| 'H'` | `'L'`       | 容错等级，`ZQRCode` 不覆盖，沿用 qrcode.react |
| `bgColor`          | `string`                   | `'#FFFFFF'` | 背景色                                        |
| `fgColor`          | `string`                   | `'#000000'` | 前景色                                        |
| `title`            | `string`                   | —           | 无障碍标题                                    |
| `minVersion`       | `number`                   | `1`         | 最低版本 1–40                                 |
| `boostLevel`       | `boolean`                  | `true`      | 允许在不升版本的前提下提高容错等级            |
| `marginSize`       | `number`                   | `0`         | 静区模块数                                    |
| `className`        | `string`                   | —           | 落在 `<svg>` 上的类名                         |
| `wrapperClassName` | `string`                   | —           | 落在外层卡片上的类名                          |

`ref` 透传到内部 `<svg>`（`SVGSVGElement`），其余 `QRCodeSVG` 的 props（含 `imageSettings`）原样转发。

## 注意事项

- 旧文档写的 `level` 默认 `'M'` 是错的：默认值在 `qrcode.react` 里是 `'L'`，`ZQRCode` 只覆盖了 `size`（`z-qrcode.tsx:12`）
- 外层卡片写死了 `bg-white`（`z-qrcode.tsx:16`），暗色主题下仍是一块白底。要融入主题得用 `wrapperClassName` 覆盖
- `wrapperClassName` 改外层卡片，`className` 改 svg 本身，两者是不同元素
- `value` 必传；内容超出可编码容量时 `qrcode.react` 在渲染中抛 `RangeError("Data too long")`，不会降级渲染。要兜住就自己校验长度
- 纯展示组件，没有加载态与错误态