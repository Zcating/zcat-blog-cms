---
title: ZQRCode
slug: z-qrcode
---

# ZQRCode

## 用途

二维码生成。

## 基础示例

```tsx
import { ZQRCode } from "@zcat/ui";

<ZQRCode value="https://blog.zcat.example" size={200} />
```

## 关键 Props

| name | type | default | 说明 |
| --- | --- | --- | --- |
| `value` | `string` | — | 内容 |
| `size` | `number` | `128` | 像素 |
| `level` | `"L" \| "M" \| "Q" \| "H"` | `"M"` | 容错等级 |

## 注意事项

- 内部走 `qrcode.react`，可在暗色主题下调整前景色
- 大量文本会提高 Q 等级要求
