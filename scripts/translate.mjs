#!/usr/bin/env node
/**
 * Auto-translate i18n JSON files using DeepSeek API.
 *
 * Usage:
 *   DEEPSEEK_API_KEY=sk-xxx node scripts/translate.mjs
 *
 * This script:
 * 1. Reads zh.json as the source of truth
 * 2. Compares with en.json to find new/changed keys
 * 3. Sends untranslated text to DeepSeek for translation
 * 4. Writes the updated en.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ZH_PATH = resolve(__dirname, '../src/i18n/zh.json');
const EN_PATH = resolve(__dirname, '../src/i18n/en.json');

const API_KEY = process.env.DEEPSEEK_API_KEY;
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

if (!API_KEY) {
  console.error('Error: DEEPSEEK_API_KEY environment variable is required');
  process.exit(1);
}

function flattenObj(obj, prefix = '') {
  const result = {};
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenObj(obj[key], fullKey));
    } else {
      result[fullKey] = obj[key];
    }
  }
  return result;
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

async function translate(text) {
  const isArray = Array.isArray(text);
  const content = isArray ? JSON.stringify(text, null, 2) : text;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following Chinese text to English.
This is for a personal portfolio website of a software engineer.
- Keep technical terms (React, TypeScript, Golang, etc.) unchanged
- Keep proper nouns (UNSW, Kuaishou, etc.) unchanged
- Maintain the same tone: professional but friendly
- If the input is a JSON array, return a JSON array with the same structure but translated
- Return ONLY the translated text, no explanations or markdown`,
        },
        {
          role: 'user',
          content: content,
        },
      ],
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  const result = data.choices?.[0]?.message?.content?.trim();

  if (isArray) {
    try {
      return JSON.parse(result);
    } catch {
      console.warn('Failed to parse array translation, returning as-is');
      return text;
    }
  }
  return result;
}

async function main() {
  const zh = JSON.parse(readFileSync(ZH_PATH, 'utf8'));
  const en = JSON.parse(readFileSync(EN_PATH, 'utf8'));

  const flatZh = flattenObj(zh);
  const flatEn = flattenObj(en);

  // Find keys in zh that are missing or different in en
  const toTranslate = {};
  for (const [key, value] of Object.entries(flatZh)) {
    if (!(key in flatEn)) {
      toTranslate[key] = value;
    }
  }

  if (Object.keys(toTranslate).length === 0) {
    console.log('✓ All keys are already translated. Nothing to do.');
    return;
  }

  console.log(`Found ${Object.keys(toTranslate).length} keys to translate:`);

  for (const [key, value] of Object.entries(toTranslate)) {
    const displayValue = typeof value === 'string'
      ? value.substring(0, 50) + (value.length > 50 ? '...' : '')
      : `[${Array.isArray(value) ? 'array' : typeof value}]`;
    console.log(`  - ${key}: ${displayValue}`);

    try {
      const translated = await translate(value);
      setNestedValue(en, key, translated);
      console.log(`    → ${typeof translated === 'string' ? translated.substring(0, 50) + '...' : 'translated'}`);
    } catch (err) {
      console.error(`    ✗ Failed to translate ${key}: ${err.message}`);
    }
  }

  writeFileSync(EN_PATH, JSON.stringify(en, null, 2) + '\n', 'utf8');
  console.log(`\n✓ Updated ${EN_PATH}`);
}

main().catch(console.error);
