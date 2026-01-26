import {
  createZForm,
  ZButton,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ZView,
  ZInput,
  ZQRCode,
  ZSelect,
  ZCheckbox,
  ZNotification,
} from '@zcat/ui';
import { Download, QrCode } from 'lucide-react';
import { useRef, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { z } from 'zod';

export function meta() {
  return [
    { title: '二维码生成器' },
    {
      name: 'description',
      content: '在线二维码生成工具，支持自定义颜色、大小和纠错等级',
    },
  ];
}

const QRCodeSchema = z.object({
  value: z.string().min(1, '请输入内容').default('https://zcat.wiki'),
  size: z.coerce.number().min(64).max(1024).default(256),
  fgColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, '请输入有效的十六进制颜色')
    .default('#000000'),
  bgColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, '请输入有效的十六进制颜色')
    .default('#ffffff'),
  level: z.enum(['L', 'M', 'Q', 'H']).default('M'),
  includeMargin: z.boolean().default(true),
});

const QRCodeForm = createZForm(QRCodeSchema);

export default function QrCodeGeneratorPage() {
  const [qrData, setQrData] = useState<z.infer<typeof QRCodeSchema>>({
    value: 'https://zcat.wiki',
    size: 256,
    fgColor: '#000000',
    bgColor: '#ffffff',
    level: 'M',
    includeMargin: true,
  });

  const form = QRCodeForm.useForm({
    defaultValues: qrData,
    mode: 'onChange', // 实时更新
    onSubmit: (data) => {
      setQrData(data);
      ZNotification.success('配置已保存');
    },
  });

  // 监听表单变化
  const values = useWatch({ control: form.instance.control });

  // 将表单值同步到预览状态
  const previewData = { ...qrData, ...values } as z.infer<typeof QRCodeSchema>;

  const svgRef = useRef<SVGSVGElement>(null);

  const handleDownload = (format: 'png' | 'svg') => {
    const svg = svgRef.current;
    if (!svg) {
      ZNotification.error('无法获取二维码元素');
      return;
    }

    if (format === 'svg') {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode-${Date.now()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // PNG Download
      const canvas = document.createElement('canvas');
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      const svgBlob = new Blob([svgData], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        canvas.width = previewData.size;
        canvas.height = previewData.size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = previewData.bgColor; // Fill background just in case
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `qrcode-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  };

  return (
    <ZView className="p-4 space-y-6 h-full w-full flex flex-col">
      <ZView className="space-y-2">
        <h1 className="text-2xl font-bold">二维码生成器</h1>
        <p className="text-sm text-muted-foreground">
          输入文本或 URL，生成自定义样式的二维码。
        </p>
      </ZView>

      <ZView className="flex-1 flex gap-6 min-h-0 flex-col md:flex-row">
        {/* 左侧：配置表单 */}
        <Card className="flex-1 min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              配置参数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QRCodeForm form={form} className="space-y-4">
              <QRCodeForm.Item name="value" label="内容">
                <ZInput placeholder="https://example.com" />
              </QRCodeForm.Item>

              <div className="grid grid-cols-2 gap-4">
                <QRCodeForm.Item name="size" label="尺寸 (px)">
                  <ZInput type="number" min={64} max={1024} step={32} />
                </QRCodeForm.Item>

                <QRCodeForm.Item name="level" label="纠错等级">
                  <ZSelect
                    options={[
                      { label: 'Low (7%)', value: 'L' },
                      { label: 'Medium (15%)', value: 'M' },
                      { label: 'Quartile (25%)', value: 'Q' },
                      { label: 'High (30%)', value: 'H' },
                    ]}
                  />
                </QRCodeForm.Item>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <QRCodeForm.Item name="fgColor" label="前景色">
                  <div className="flex gap-2">
                    <ZInput type="color" className="w-12 p-1 h-9" />
                    <ZInput placeholder="#000000" />
                  </div>
                </QRCodeForm.Item>

                <QRCodeForm.Item name="bgColor" label="背景色">
                  <div className="flex gap-2">
                    <ZInput type="color" className="w-12 p-1 h-9" />
                    <ZInput placeholder="#ffffff" />
                  </div>
                </QRCodeForm.Item>
              </div>

              <QRCodeForm.Item name="includeMargin" label="边距">
                <div className="flex items-center h-9">
                  <ZCheckbox />
                  <span className="ml-2 text-sm text-muted-foreground">
                    包含白色边距
                  </span>
                </div>
              </QRCodeForm.Item>

              <ZButton type="submit" className="w-full">
                保存配置
              </ZButton>
            </QRCodeForm>
          </CardContent>
        </Card>

        {/* 右侧：预览区 */}
        <Card className="flex-1 min-w-0 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              预览与下载
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center gap-6 min-h-[300px]">
            <ZView className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 shadow-inner overflow-auto max-w-full max-h-[500px] flex items-center justify-center">
              <ZQRCode
                ref={svgRef}
                value={previewData.value || ' '}
                size={previewData.size}
                fgColor={previewData.fgColor}
                bgColor={previewData.bgColor}
                level={previewData.level}
                includeMargin={previewData.includeMargin}
                className="max-w-full h-auto"
              />
            </ZView>

            <div className="flex gap-4">
              <ZButton variant="outline" onClick={() => handleDownload('svg')}>
                下载 SVG
              </ZButton>
              <ZButton onClick={() => handleDownload('png')}>下载 PNG</ZButton>
            </div>
          </CardContent>
        </Card>
      </ZView>
    </ZView>
  );
}
