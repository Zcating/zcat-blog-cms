import { useMemo, useState } from "react";
import { Image, View, ZSelect } from "@blog/components";
import { Input } from "@blog/components/ui/input";
import { Textarea } from "@blog/components/ui/textarea";
import { Button } from "@blog/components/ui/button";
import { Label } from "@blog/components/ui/label";
import { Dialog, DialogContent } from "@blog/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@blog/components/ui/card";

const MIME_TYPE_OPTIONS = [
  { label: "image/png", value: "image/png" },
  { label: "image/jpeg", value: "image/jpeg" },
  { label: "image/webp", value: "image/webp" },
  { label: "image/gif", value: "image/gif" },
  { label: "image/svg+xml", value: "image/svg+xml" },
];

export function meta() {
  return [
    { title: "图片和 Base64 互转" },
    {
      name: "description",
      content: "将图片转换为 Base64 编码，或将 Base64 编码转换为图片",
    },
  ];
}

export default function Base64ToImagePage() {
  // 图片 -> Base64
  // const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");

  // Base64 -> 图片
  const [base64Input, setBase64Input] = useState<string>("");
  const [mimeType, setMimeType] = useState<string>("image/png");
  const [base64PreviewUrl, setBase64PreviewUrl] = useState<string>("");
  const [dialogIsOpen, setDialogIsOpen] = useState<boolean>(false);
  const [fullscreenSrc, setFullscreenSrc] = useState<string | null>(null);

  const isDataUrl = useMemo(
    () =>
      base64Input.trim().startsWith("data:image/") ||
      base64Input.trim().startsWith("data:application/"),
    [base64Input],
  );

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e,
  ) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      return;
    }

    setImageBase64("");
    setImagePreviewUrl("");
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageBase64(result);
      setImagePreviewUrl(result);
    };
    reader.onerror = () => {
      console.error("读取图片失败");
    };
    reader.readAsDataURL(file);
  };

  const copyImageBase64 = async () => {
    if (!imageBase64) {
      return;
    }
    try {
      await navigator.clipboard.writeText(imageBase64);
      // 可以接入 toast：复制成功
    } catch (err) {
      console.error("复制失败", err);
    }
  };

  const clearImageSide = () => {
    // setImageFile(null);
    setImageBase64("");
    setImagePreviewUrl("");
  };

  const buildDataUrlFromBase64 = () => {
    const trimmed = base64Input.trim();
    if (!trimmed) {
      return "";
    }
    if (isDataUrl) {
      return trimmed;
    } // 已经是 data URL
    return `data:${mimeType};base64,${trimmed}`; // 纯 base64 包装成 data URL
  };

  const generateImageFromBase64 = () => {
    const url = buildDataUrlFromBase64();
    setBase64PreviewUrl(url);
  };

  const downloadFromDataUrl = (dataUrl: string, filename: string) => {
    if (!dataUrl) {
      return;
    }
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const clearBase64Side = () => {
    setBase64Input("");
    setBase64PreviewUrl("");
  };

  const handleOpenDialog = (src: string) => {
    setFullscreenSrc(src);
    setDialogIsOpen(true);
  };

  return (
    <View className="container mx-auto p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">图片和 Base64 互转</h1>
        <p className="text-sm text-muted-foreground">
          将图片转换为 Base64 编码，或将 Base64 编码转换为图片。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 图片 -> Base64 */}
        <Card>
          <CardHeader>
            <CardTitle>图片 → Base64</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imageFile">选择图片</Label>
              <Input
                id="imageFile"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            {imagePreviewUrl ? (
              <div className="space-y-2">
                <Label>预览</Label>
                <img
                  src={imagePreviewUrl}
                  alt="预览图片"
                  className="h-48 w-full rounded-md object-contain border cursor-zoom-in"
                  onClick={() => handleOpenDialog(imagePreviewUrl)}
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Base64（Data URL）</Label>
              <Textarea
                className="h-64"
                value={imageBase64}
                readOnly
                rows={8}
                placeholder="选择图片后自动生成 Base64"
              />
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              variant="default"
              disabled={!imageBase64}
              onClick={copyImageBase64}
            >
              复制 Base64
            </Button>
            <Button
              variant="secondary"
              disabled={!imageBase64}
              onClick={() => {
                downloadFromDataUrl(imageBase64, "image-base64.txt");
              }}
            >
              下载为文本
            </Button>
            <Button variant="outline" onClick={clearImageSide}>
              清空
            </Button>
          </CardFooter>
        </Card>

        {/* Base64 -> 图片 */}
        <Card>
          <CardHeader>
            <CardTitle>Base64 → 图片</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="base64Input">输入 Base64</Label>
              <Textarea
                className="h-32"
                id="base64Input"
                value={base64Input}
                onChange={(e) => setBase64Input(e.target.value)}
                rows={8}
                placeholder="支持 data URL（如 data:image/png;base64,...）或纯 base64 字符串"
              />
            </div>

            {!isDataUrl ? (
              <div className="space-y-2">
                <Label htmlFor="mimeType">
                  选择图片类型（用于纯 base64 包装）
                </Label>
                <ZSelect
                  className="w-full"
                  options={MIME_TYPE_OPTIONS}
                  value={mimeType}
                  onValueChange={setMimeType}
                />
              </div>
            ) : null}

            {base64PreviewUrl ? (
              <div className="space-y-2">
                <Label>预览</Label>
                <Image
                  src={base64PreviewUrl}
                  alt="预览图片"
                  contentMode="contain"
                  className="h-48 w-full rounded-md border cursor-zoom-in"
                  onClick={() => handleOpenDialog(base64PreviewUrl)}
                />
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              variant="default"
              onClick={generateImageFromBase64}
              disabled={!base64Input.trim()}
            >
              生成预览
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                downloadFromDataUrl(buildDataUrlFromBase64(), "converted-image")
              }
              disabled={!base64Input.trim()}
            >
              下载图片
            </Button>
            <Button variant="outline" onClick={clearBase64Side}>
              清空
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
        <DialogContent className="w-[90vw] h-[90vh] sm:max-w-auto flex items-center justify-center">
          {fullscreenSrc ? (
            <Image
              src={fullscreenSrc}
              alt="全屏预览"
              contentMode="contain"
              className="w-full h-auto"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </View>
  );
}
