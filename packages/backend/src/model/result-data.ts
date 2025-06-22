const CODE_ENUMS = [
  '0000',
  // 注册验证错误
  'ERR0001',
  //
  'ERR0002',
  'ERR0003',
  'ERR0004',
  'ERR0005',
  'ERR0006',
] as const;

export interface ResultData<T> {
  code: (typeof CODE_ENUMS)[number];
  message: string;
  data?: T;
}

interface CreateResultParams<T> {
  code: (typeof CODE_ENUMS)[number];
  message: string;
  data?: T;
}

export function createResult<T>(params: CreateResultParams<T>): ResultData<T> {
  if (!CODE_ENUMS.includes(params.code)) {
    throw new Error('Invalid code');
  }

  return {
    code: params.code,
    message: params.message,
    data: params.data,
  };
}
