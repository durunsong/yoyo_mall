import 'server-only';

import path from 'path';
import { promises as fs } from 'fs';
import type { TranslationDictionary } from '@/lib/i18n/dictionary';

const cache = new Map<string, TranslationDictionary>();
const LOCALES_DIR = path.join(process.cwd(), 'public', 'locales');

async function readDictionaryFile(locale: string, namespace: string) {
  const key = `${locale}:${namespace}`;
  if (cache.has(key)) {
    return cache.get(key)!;
  }

  const filePath = path.join(LOCALES_DIR, locale, `${namespace}.json`);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content) as TranslationDictionary;
    cache.set(key, parsed);
    return parsed;
  } catch (error) {
    console.warn(`[i18n] Failed to load ${locale}/${namespace}.json`, error);
    cache.set(key, {});
    return {};
  }
}

function normalizeLocale(locale?: string) {
  if (!locale) return 'en-US';
  const value = locale.toLowerCase();
  if (value.startsWith('zh')) return 'zh-CN';
  if (value.startsWith('en')) return 'en-US';
  return locale;
}

export async function getDictionary(locale: string, namespace: string) {
  const normalizedLocale = normalizeLocale(locale);
  const dictionary = await readDictionaryFile(normalizedLocale, namespace);
  if (Object.keys(dictionary).length === 0 && normalizedLocale !== 'en-US') {
    return readDictionaryFile('en-US', namespace);
  }
  return dictionary;
}

export async function getDictionaries(
  locale: string,
  namespaces: string[],
): Promise<Record<string, TranslationDictionary>> {
  const entries = await Promise.all(
    namespaces.map(async (ns) => [ns, await getDictionary(locale, ns)] as const),
  );
  return Object.fromEntries(entries);
}


