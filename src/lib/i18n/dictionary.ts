/**
 * 轻量翻译工具，供服务端/客户端共用
 */

export type TranslationDictionary = Record<string, any>;

function getNestedTranslation(source: TranslationDictionary | undefined, keyPath: string) {
  if (!source) return undefined;
  if (!keyPath.includes('.')) return source[keyPath];

  return keyPath.split('.').reduce<any>((acc, segment) => {
    if (acc && typeof acc === 'object' && segment in acc) {
      return acc[segment];
    }
    return undefined;
  }, source);
}

function formatWithParams(value: string, params?: Record<string, string | number>) {
  if (!params) return value;
  return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
    return acc.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
  }, value);
}

export function translate(
  dictionary: TranslationDictionary | undefined,
  key: string,
  params?: Record<string, string | number>,
) {
  if (!dictionary) return key;
  const resolved = getNestedTranslation(dictionary, key);
  if (resolved === undefined || resolved === null) return key;
  if (typeof resolved !== 'string' && typeof resolved !== 'number') return key;
  return formatWithParams(String(resolved), params);
}

export function createTranslator(dictionary: TranslationDictionary | undefined) {
  return (key: string, params?: Record<string, string | number>) =>
    translate(dictionary, key, params);
}


