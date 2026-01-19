import {
  createZForm,
  ZView,
  ZCascader,
  ZDatePicker,
  ZSelect,
  Button,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ZMessage,
  ZButton,
} from '@zcat/ui';
import dayjs from 'dayjs';
import { useState } from 'react';
import z from 'zod';

import {
  GENDER_OPTIONS,
  ADDRESS_OPTIONS,
  generateUniqueIdNumbers,
} from '@blog/features';

const ZForm = createZForm({
  areaCodes: z.array(z.string()),
  birthDate: z.custom<dayjs.Dayjs>(dayjs.isDayjs, 'Invalid date'),
  gender: z.enum(['male', 'female']),
});

export function meta() {
  return [
    { title: '身份证生成' },
    {
      name: 'description',
      content:
        '根据地区码、生日与性别生成合法的18位身份证号（含校验位）。示例地区码非完整库，仅供学习与测试使用。',
    },
  ];
}

export default function IdCardGeneratorPage() {
  const form = ZForm.useForm({
    defaultValues: {
      areaCodes: [],
      birthDate: dayjs(),
      gender: 'male',
    },
    onSubmit: (data) => {
      const idNumbers = generateUniqueIdNumbers(
        {
          areaCode: data.areaCodes[2] || '',
          birthDate: data.birthDate,
          gender: data.gender,
        },
        10,
      );
      setIdNumbers(idNumbers);
      setValidateMsg('');
    },
  });

  // 结果
  const [idNumbers, setIdNumbers] = useState<string[]>([]);
  const [validateMsg, setValidateMsg] = useState<string>('');

  const copyResult = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      if (idNumbers.length === 0) return;
      await navigator.clipboard.writeText(idNumbers.join('\n'));
      ZMessage.success('已复制到剪贴板');
    } catch (e) {
      ZMessage.error('复制失败');
    }
  };

  return (
    <ZView className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">中国大陆身份证号生成器</h1>
        <p className="text-sm text-muted-foreground">
          根据地区码、生日与性别生成合法的18位身份证号（含校验位）。示例地区码非完整库，仅供学习与测试使用。
        </p>
      </div>
      <ZForm form={form}>
        <ZForm.Items className="max-w-xl" title="参数设置">
          <ZForm.Item name="areaCodes" label="省市区">
            <ZCascader options={ADDRESS_OPTIONS} />
          </ZForm.Item>
          <ZForm.Item name="birthDate" label="生日">
            <ZDatePicker />
          </ZForm.Item>
          <ZForm.Item name="gender" label="性别">
            <ZSelect options={GENDER_OPTIONS} />
          </ZForm.Item>

          <ZView className="flex gap-5">
            <Button type="submit">生成</Button>
            <ZButton
              variant="ghost"
              onClick={copyResult}
              disabled={idNumbers.length === 0}
            >
              复制结果
            </ZButton>
          </ZView>
        </ZForm.Items>
      </ZForm>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>生成结果</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            className="cursor-default"
            value={idNumbers.join('\n')}
            readOnly
            rows={10}
            placeholder="点击生成后显示身份证号"
          />
          {validateMsg ? (
            <p className="text-sm text-muted-foreground">{validateMsg}</p>
          ) : null}
        </CardContent>
      </Card>
    </ZView>
  );
}
