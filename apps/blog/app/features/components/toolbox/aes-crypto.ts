interface CipherOption {
  mode: (typeof CryptoJS.mode)['CBC'];
  padding: (typeof CryptoJS.pad)['Pkcs7'];
  iv?: CryptoJS.lib.WordArray;
}

type AesModeEnum = 'CBC' | 'ECB' | 'CFB' | 'OFB' | 'CTR';
export const AES_MODES = [
  { label: 'CBC', value: 'CBC' },
  { label: 'ECB', value: 'ECB' },
  { label: 'CFB', value: 'CFB' },
  { label: 'OFB', value: 'OFB' },
  { label: 'CTR', value: 'CTR' },
] as CommonOption<AesModeEnum>[];

export type AesPaddingEnum =
  | 'Pkcs7'
  | 'Iso97971'
  | 'AnsiX923'
  | 'Iso10126'
  | 'ZeroPadding'
  | 'NoPadding';

export const AES_PADDINGS = [
  { label: 'Pkcs7', value: 'Pkcs7' },
  { label: 'Iso97971', value: 'Iso97971' },
  { label: 'AnsiX923', value: 'AnsiX923' },
  { label: 'Iso10126', value: 'Iso10126' },
  { label: 'ZeroPadding', value: 'ZeroPadding' },
  { label: 'NoPadding', value: 'NoPadding' },
] as CommonOption<AesPaddingEnum>[];

export type AesEncodingEnum = 'Utf8' | 'Hex' | 'Base64' | 'Latin1';
export const AES_ENCODINGS = [
  { label: 'UTF-8', value: 'Utf8' },
  { label: 'Hex', value: 'Hex' },
  { label: 'Base64', value: 'Base64' },
  { label: 'Latin1', value: 'Latin1' },
] as CommonOption<AesEncodingEnum>[];

export type OperationModeEnum = 'encrypt' | 'decrypt';
export const OPERATION_MODES: CommonOption<OperationModeEnum>[] = [
  { label: '加密', value: 'encrypt' },
  { label: '解密', value: 'decrypt' },
];

const parseInput = (input: string, encoding: AesEncodingEnum) => {
  try {
    // 清理空白字符，避免 Base64/Hex 解析因换行符报错
    const cleanInput =
      encoding === 'Base64' || encoding === 'Hex'
        ? input.replace(/\s/g, '')
        : input;

    return CryptoJS.enc[encoding].parse(cleanInput);
  } catch (e) {
    throw new Error(`无法使用 ${encoding} 解析输入: ${(e as Error).message}`);
  }
};

const formatOutput = (
  wordArray: CryptoJS.lib.WordArray,
  encoding: AesEncodingEnum,
) => {
  try {
    return wordArray.toString(CryptoJS.enc[encoding]);
  } catch (e) {
    throw new Error(`无法使用 ${encoding} 格式化输出: ${(e as Error).message}`);
  }
};

interface AesCryptoParams {
  mode: OperationModeEnum;
  text: string;
  key: string;
  keyEncoding: AesEncodingEnum;
  iv?: string;
  ivEncoding: AesEncodingEnum;
  plaintextEncoding: AesEncodingEnum;
  ciphertextEncoding: AesEncodingEnum;
  aesMode: AesModeEnum;
  padding: AesPaddingEnum;
}

function encrypt(params: AesCryptoParams) {
  const {
    text,
    key,
    keyEncoding,
    iv,
    ivEncoding,
    plaintextEncoding,
    ciphertextEncoding,
    aesMode,
    padding,
  } = params;

  // Config
  const config: CipherOption = {
    mode: CryptoJS.mode[aesMode],
    padding: CryptoJS.pad[padding],
  };

  // IV 处理：ECB 不需要 IV，其他模式如果用户输入了 IV 则使用
  if (aesMode !== 'ECB' && iv) {
    config.iv = parseInput(iv, ivEncoding);
  }

  const keyParsed = parseInput(key, keyEncoding);

  const textParsed = parseInput(text, plaintextEncoding);
  // encrypt 接受 WordArray
  const encrypted = CryptoJS.AES.encrypt(textParsed, keyParsed, config);
  // 加密结果通常转换为 Base64 或 Hex
  return formatOutput(encrypted.ciphertext, ciphertextEncoding);
}

function decrypt(params: AesCryptoParams) {
  const {
    text,
    key,
    keyEncoding,
    iv,
    ivEncoding,
    plaintextEncoding,
    ciphertextEncoding,
    aesMode,
    padding,
  } = params;

  // Config
  const config: CipherOption = {
    mode: CryptoJS.mode[aesMode],
    padding: CryptoJS.pad[padding],
  };

  // IV 处理：ECB 不需要 IV，其他模式如果用户输入了 IV 则使用
  if (aesMode !== 'ECB' && iv) {
    config.iv = parseInput(iv, ivEncoding);
  }

  const keyParsed = parseInput(key, keyEncoding);

  const textParsed = parseInput(text, ciphertextEncoding);
  // 解密
  // decrypt 接受 CipherParams (或 Base64 字符串)
  // 这里我们传入 WordArray (作为 ciphertext)，需要构建 CipherParams
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: textParsed,
  });
  const decrypted = CryptoJS.AES.decrypt(cipherParams, keyParsed, config);

  console.log(formatOutput(decrypted, plaintextEncoding));
  return formatOutput(decrypted, plaintextEncoding);
}

const CRYPTO_STRATEGIES = {
  encrypt,
  decrypt,
} as const;

export function runAesCryptoLogic(params: AesCryptoParams) {
  return CRYPTO_STRATEGIES[params.mode](params);
}
