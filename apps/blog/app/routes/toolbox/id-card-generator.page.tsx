import {
  createZFormMaker,
  ZView,
  ZAddress,
  ZDatePicker,
  ZSelect,
  Button,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@zcat/ui";
import dayjs from "dayjs";
import { useState } from "react";
import { z } from "zod";

import ADDRESS_OPTIONS from "@blog/modules/toolbox/address-options.json";

/**
 * 性别选项
 */
const GENDER_OPTIONS = [
  { label: "男（顺序码奇数）", value: "male" },
  { label: "女（顺序码偶数）", value: "female" },
];

/**
 * 校验位权重与映射
 */
const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
/**
 * 校验位映射
 */
const CHECK_MAP = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];

/**
 * 计算校验位
 * @param id17 17位身份证号（不包含校验位）
 * @returns 校验位
 */
function computeCheckDigit(id17: string): string {
  const sum = id17
    .split("")
    .reduce((acc, ch, i) => acc + parseInt(ch, 10) * WEIGHTS[i], 0);
  const mod = sum % 11;
  return CHECK_MAP[mod];
}

/**
 * 老人顺序码范围（0-1, 996-999）
 */
const oldMan = [0, 1, 996, 997, 998, 999];

/**
 * 生成顺序码（奇数为男，偶数为女）
 * @param sex 性别
 * @returns 顺序码
 */
function randomSeqDigits(sex: "male" | "female"): string {
  const isMale = sex === "male";
  const n = Math.floor(Math.random() * 1000);
  if (oldMan.includes(n)) {
    return randomSeqDigits(sex);
  }
  const parityBit = isMale ? 1 : 0;
  const seqDigits = n % 2 === parityBit ? n : n - 1;

  return seqDigits.toString().padStart(3, "0");
}

const schema = z.object({
  areaCode: z.string().min(0).max(6),
  birthDate: z.custom<dayjs.Dayjs>(dayjs.isDayjs, "Invalid date"),
  gender: z.enum(["male", "female"]),
});

const FormMaker = createZFormMaker(schema);

function generateUniqueIdNumbers(
  data: z.infer<typeof schema>,
  count: number = 10,
) {
  const safeCount =
    Number.isFinite(count) && count > 0 ? Math.floor(count) : 10;
  const result = new Set<string>();
  const maxAttempts = safeCount * 200;

  for (
    let attempts = 0;
    result.size < safeCount && attempts < maxAttempts;
    attempts++
  ) {
    const seqDigits = randomSeqDigits(data.gender);
    const prefix = `${data.areaCode}${data.birthDate.format("YYYYMMDD")}${seqDigits}`;
    const checkDigit = computeCheckDigit(prefix);

    result.add(`${prefix}${checkDigit}`);
  }

  return Array.from(result);
}

export function meta() {
  return [
    { title: "身份证生成" },
    {
      name: "description",
      content:
        "根据地区码、生日与性别生成合法的18位身份证号（含校验位）。示例地区码非完整库，仅供学习与测试使用。",
    },
  ];
}

export default function IdCardGeneratorPage() {
  const form = FormMaker.useForm({
    defaultValues: {
      areaCode: "",
      birthDate: dayjs(),
      gender: "male",
    },
    onSubmit: (data) => {
      const idNumbers = generateUniqueIdNumbers(data, 10);
      setIdNumbers(idNumbers);
      setValidateMsg("");
    },
  });

  // 结果
  const [idNumbers, setIdNumbers] = useState<string[]>([]);
  const [validateMsg, setValidateMsg] = useState<string>("");

  const copyResult = async () => {
    try {
      if (idNumbers.length === 0) return;
      await navigator.clipboard.writeText(idNumbers.join("\n"));
      setValidateMsg("已复制到剪贴板");
    } catch (e) {
      setValidateMsg("复制失败");
    }
  };

  return (
    <ZView className="container mx-auto p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">中国大陆身份证号生成器</h1>
        <p className="text-sm text-muted-foreground">
          根据地区码、生日与性别生成合法的18位身份证号（含校验位）。示例地区码非完整库，仅供学习与测试使用。
        </p>
      </div>
      <FormMaker.Form form={form}>
        <FormMaker.FormItems
          className="max-w-xl"
          title="参数设置"
          footer={
            <ZView className="flex gap-5">
              <Button type="submit">生成</Button>
              <Button
                variant="secondary"
                onClick={copyResult}
                disabled={idNumbers.length === 0}
              >
                复制结果
              </Button>
            </ZView>
          }
        >
          <FormMaker.FormItem name="areaCode" label="省市区">
            <ZAddress options={ADDRESS_OPTIONS} />
          </FormMaker.FormItem>
          <FormMaker.FormItem name="birthDate" label="生日">
            <ZDatePicker />
          </FormMaker.FormItem>
          <FormMaker.FormItem name="gender" label="性别">
            <ZSelect options={GENDER_OPTIONS} />
          </FormMaker.FormItem>
        </FormMaker.FormItems>
      </FormMaker.Form>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>生成结果</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            className="cursor-default"
            value={idNumbers.join("\n")}
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
