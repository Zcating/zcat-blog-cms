import dayjs from 'dayjs';

import ADDRESS_OPTIONS from './address-options.json';
export { ADDRESS_OPTIONS };

/**
 * 性别选项
 */
export const GENDER_OPTIONS = [
  { label: '男（顺序码奇数）', value: 'male' },
  { label: '女（顺序码偶数）', value: 'female' },
];

/**
 * 老人顺序码范围（0-1, 996-999）
 */
const oldMan = [0, 1, 996, 997, 998, 999];

/**
 * 校验位权重与映射
 */
const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];

/**
 * 校验位映射
 */
const CHECK_MAP = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

/**
 * 计算校验位
 * @param id17 17位身份证号（不包含校验位）
 * @returns 校验位
 */
function computeCheckDigit(id17: string): string {
  const sum = id17
    .split('')
    .reduce((acc, ch, i) => acc + parseInt(ch, 10) * WEIGHTS[i], 0);
  const mod = sum % 11;
  return CHECK_MAP[mod];
}

/**
 * 生成顺序码（奇数为男，偶数为女）
 * @param sex 性别
 * @returns 顺序码
 */
function randomSeqDigits(sex: 'male' | 'female'): string {
  const isMale = sex === 'male';
  const n = Math.floor(Math.random() * 1000);
  if (oldMan.includes(n)) {
    return randomSeqDigits(sex);
  }
  const parityBit = isMale ? 1 : 0;
  const seqDigits = n % 2 === parityBit ? n : n - 1;

  return seqDigits.toString().padStart(3, '0');
}

interface IdCardNumberData {
  areaCode: string;
  birthDate: dayjs.Dayjs;
  gender: 'male' | 'female';
}

/**
 * 生成唯一的身份证号
 * @param data 身份证号数据
 * @param count 生成数量（默认10个）
 * @returns 唯一的身份证号数组
 */
export function generateUniqueIdNumbers(
  data: IdCardNumberData,
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
    const prefix = `${data.areaCode}${data.birthDate.format('YYYYMMDD')}${seqDigits}`;
    const checkDigit = computeCheckDigit(prefix);

    result.add(`${prefix}${checkDigit}`);
  }

  return Array.from(result);
}
