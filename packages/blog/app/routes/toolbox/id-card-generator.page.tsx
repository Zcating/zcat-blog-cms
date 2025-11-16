import { useMemo, useState } from "react";
import { View, ZSelect } from "@blog/components";
import { Input } from "@blog/components/ui/input";
import { Button } from "@blog/components/ui/button";
import { Label } from "@blog/components/ui/label";
import { Textarea } from "@blog/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@blog/components/ui/card";

// 常用地区码（示例，不保证覆盖完整）
const AREA_CODES: { label: string; code: string }[] = [
  { label: "北京市 东城区", code: "110101" },
  { label: "北京市 朝阳区", code: "110105" },
  { label: "上海市 浦东新区", code: "310115" },
  { label: "广东省 广州市 天河区", code: "440106" },
  { label: "广东省 深圳市 南山区", code: "440305" },
  { label: "浙江省 杭州市 西湖区", code: "330106" },
  { label: "四川省 成都市 武侯区", code: "510107" },
  { label: "江苏省 苏州市 吴中区", code: "320506" },
  { label: "湖北省 武汉市 洪山区", code: "420111" },
  { label: "陕西省 西安市 雁塔区", code: "610113" },
];

const GENDER_OPTIONS = [
  { label: "男（顺序码奇数）", value: "male" },
  { label: "女（顺序码偶数）", value: "female" },
];

// 校验位权重与映射
const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const CHECK_MAP = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];

function computeCheckDigit(id17: string): string {
  const sum = id17
    .split("")
    .reduce((acc, ch, i) => acc + parseInt(ch, 10) * WEIGHTS[i], 0);
  const mod = sum % 11;
  return CHECK_MAP[mod];
}

function pad(num: number, len: number): string {
  return num.toString().padStart(len, "0");
}

function isValidDate(yyyyMMdd: string): boolean {
  if (!/^\d{8}$/.test(yyyyMMdd)) return false;
  const y = parseInt(yyyyMMdd.slice(0, 4), 10);
  const m = parseInt(yyyyMMdd.slice(4, 6), 10);
  const d = parseInt(yyyyMMdd.slice(6, 8), 10);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() + 1 === m &&
    date.getDate() === d
  );
}

function validateIdNumber(id: string): { ok: boolean; reason?: string } {
  const upper = id.trim().toUpperCase();
  if (!/^\d{17}[\dX]$/.test(upper)) {
    return {
      ok: false,
      reason: "格式不正确，应为17位数字+1位校验码（0-9或X）",
    };
  }
  const area = upper.slice(0, 6);
  const birth = upper.slice(6, 14);
  const seq = upper.slice(14, 17);
  const check = upper.slice(17);

  if (!/^[0-9]{6}$/.test(area)) {
    return { ok: false, reason: "地区码格式不正确" };
  }
  if (!isValidDate(birth)) {
    return { ok: false, reason: "生日码无效（YYYYMMDD）" };
  }
  if (!/^[0-9]{3}$/.test(seq)) {
    return { ok: false, reason: "顺序码格式不正确" };
  }
  const realCheck = computeCheckDigit(upper.slice(0, 17));
  if (realCheck !== check) {
    return { ok: false, reason: `校验码错误，应为 ${realCheck}` };
  }
  return { ok: true };
}

export default function IdCardGeneratorPage() {
  // 选项
  const [areaCode, setAreaCode] = useState<string>(AREA_CODES[0].code);
  const [birthDate, setBirthDate] = useState<string>(""); // yyyy-MM-dd
  const [gender, setGender] = useState("male");
  const [seqInput, setSeqInput] = useState<string>(""); // 可选 001-999

  // 结果
  const [resultId, setResultId] = useState<string>("");
  const [validateMsg, setValidateMsg] = useState<string>("");

  const birthCode = useMemo(() => {
    if (!birthDate) return "";
    const d = new Date(birthDate);
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1, 2);
    const dd = pad(d.getDate(), 2);
    return `${yyyy}${mm}${dd}`;
  }, [birthDate]);

  const randomArea = () => {
    const idx = Math.floor(Math.random() * AREA_CODES.length);
    setAreaCode(AREA_CODES[idx].code);
  };

  const randomSeq = (sex: string) => {
    // 001-999，奇数男，偶数女
    let n = Math.floor(Math.random() * 999) + 1; // 1..999
    // 调整奇偶性
    const isMale = sex === "male";
    const parity = n % 2;
    if (isMale && parity === 0) n += 1; // 保证奇数
    if (!isMale && parity === 1) n += 1; // 保证偶数
    if (n > 999) n -= 2; // 调整到范围内
    return pad(n, 3);
  };

  const ensureSeq = (): string => {
    const s = seqInput.trim();
    if (!s) return randomSeq(gender);
    if (!/^\d{1,3}$/.test(s)) return randomSeq(gender);
    let n = parseInt(s, 10);
    if (n < 1) n = 1;
    if (n > 999) n = 999;
    // 调整奇偶
    const isMale = gender === "male";
    if (isMale && n % 2 === 0) n = n === 999 ? 997 : n + 1;
    if (!isMale && n % 2 === 1) n = n === 998 ? 996 : n + 1;
    return pad(n, 3);
  };

  const generateId = () => {
    if (!/^[0-9]{6}$/.test(areaCode)) {
      setValidateMsg("地区码格式错误，应为6位数字");
      return;
    }
    if (!isValidDate(birthCode)) {
      setValidateMsg("生日未选择或格式无效（YYYY-MM-DD）");
      return;
    }
    const seq = ensureSeq();
    const id17 = `${areaCode}${birthCode}${seq}`;
    const check = computeCheckDigit(id17);
    const id = `${id17}${check}`;
    setResultId(id);
    setValidateMsg("生成成功");
  };

  const copyResult = async () => {
    if (!resultId) return;
    try {
      await navigator.clipboard.writeText(resultId);
      setValidateMsg("已复制到剪贴板");
    } catch (e) {
      setValidateMsg("复制失败");
    }
  };

  const validateCurrent = () => {
    if (!resultId) {
      setValidateMsg("请先生成身份证号");
      return;
    }
    const { ok, reason } = validateIdNumber(resultId);
    setValidateMsg(ok ? "校验通过" : `校验失败：${reason}`);
  };

  const clearAll = () => {
    setResultId("");
    setSeqInput("");
    setValidateMsg("");
  };

  return (
    <View className="container mx-auto p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">中国大陆身份证号生成器</h1>
        <p className="text-sm text-muted-foreground">
          根据地区码、生日与性别生成合法的18位身份证号（含校验位）。示例地区码非完整库，仅供学习与测试使用。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>参数设置</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="area">选择地区</Label>
            <div className="flex gap-2">
              <select
                id="area"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value)}
              >
                {AREA_CODES.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.label}（{a.code}）
                  </option>
                ))}
              </select>
              <Button variant="secondary" onClick={randomArea}>
                随机地区
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth">生日</Label>
            <Input
              id="birth"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">性别</Label>
            <ZSelect
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={gender}
              onValueChange={setGender}
              options={GENDER_OPTIONS}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seq">顺序码（可选）</Label>
            <Input
              id="seq"
              placeholder="001-999（不填则随机，自动调整奇偶）"
              value={seqInput}
              onChange={(e) => setSeqInput(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={generateId}>生成</Button>
          <Button variant="secondary" onClick={copyResult} disabled={!resultId}>
            复制结果
          </Button>
          <Button
            variant="outline"
            onClick={validateCurrent}
            disabled={!resultId}
          >
            校验
          </Button>
          <Button variant="ghost" onClick={clearAll}>
            清空结果
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>生成结果</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            value={resultId}
            readOnly
            rows={3}
            placeholder="点击生成后显示身份证号"
          />
          {validateMsg ? (
            <p className="text-sm text-muted-foreground">{validateMsg}</p>
          ) : null}
        </CardContent>
      </Card>
    </View>
  );
}
