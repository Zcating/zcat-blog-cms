const CODE_ENUMS = [
  '0000',
  // 注册验证错误
  'ERR0001',
  // 登录验证错误
  'ERR0002',
  // 数据库操作错误
  'ERR0003',
  // 上传文件错误
  'ERR0004',
  // 数据验证错误
  'ERR0005',
  // 其他未知错误
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
