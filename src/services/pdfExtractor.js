const fsPromises = require('fs/promises');
const path = require('path');
const os = require('os');
const { LLMWhispererClientV2, LLMWhispererClientException } = require('llmwhisperer-client');
const { LLM_WHISPERER_BASE_URL, LLM_WHISPERER_API_KEYS } = require('../constants');

const WAIT_TIMEOUT_MS = Number(process.env.LLMWHISPERER_WAIT_TIMEOUT_MS || 180000);
const WAIT_TIMEOUT_SECONDS = Math.max(30, Math.floor(WAIT_TIMEOUT_MS / 1000));
const LOGGING_LEVEL = process.env.LLMWHISPERER_LOGGING_LEVEL || 'error';

const QUOTA_KEYWORDS = [
  'quota',
  'limit',
  'exceeded',
  'daily',
  'usage',
  'rate limit',
  'too many requests',
  '429',
  'insufficient',
  'exhausted',
  'maximum',
  'threshold',
  'billing',
  'credit',
  'subscription',
];

function sanitiseFileName(fileName) {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 128);
}

function maskApiKey(key) {
  if (!key) {
    return 'UNKNOWN';
  }
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return trimmed;
  }
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

function parseExtractionResult(payload) {
  if (!payload) {
    return '';
  }
  const extraction = payload.extraction || {};
  const rawText = extraction.result_text
    || extraction.resultText
    || extraction.text
    || '';
  return typeof rawText === 'string' ? rawText.trim() : '';
}

function isQuotaError(error) {
  if (!error) {
    return false;
  }
  if (typeof error.statusCode === 'number' && error.statusCode === 429) {
    return true;
  }
  const message = (error.message || '').toLowerCase();
  return QUOTA_KEYWORDS.some((keyword) => message.includes(keyword));
}

async function writeBufferToTempFile(buffer, originalName) {
  const tmpDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'llmwhisperer-'));
  const safeName = sanitiseFileName(originalName) || `upload-${Date.now()}.pdf`;
  const tmpPath = path.join(tmpDir, safeName);
  await fsPromises.writeFile(tmpPath, buffer);

  const cleanup = async () => {
    try {
      await fsPromises.rm(tmpDir, { recursive: true, force: true });
    } catch (removalError) {
      console.warn('[pdfExtractor] Warning: unable to remove temp directory:', removalError);
    }
  };

  return { tmpPath, cleanup };
}

async function whisperWithClient(buffer, fileName, apiKey) {
  const client = new LLMWhispererClientV2({
    baseUrl: LLM_WHISPERER_BASE_URL,
    apiKey,
    loggingLevel: LOGGING_LEVEL,
  });

  const { tmpPath, cleanup } = await writeBufferToTempFile(buffer, fileName);
  try {
    const response = await client.whisper({
      filePath: tmpPath,
      waitForCompletion: true,
      waitTimeout: WAIT_TIMEOUT_SECONDS,
      mode: 'high_quality',
      outputMode: 'layout_preserving',
      pageSeparator: '<<<',
      filename: fileName || undefined,
    });

    const statusCode = response.status_code ?? response.statusCode;
    const status = response.status;
    if (statusCode !== 200 || status !== 'processed') {
      const message = response.message || 'Whisper operation did not complete successfully';
      throw new Error(`LLMWhisperer returned status ${statusCode} (${status}): ${message}`);
    }

    const text = parseExtractionResult(response);
    if (!text) {
      throw new Error('LLMWhisperer returned an empty result.');
    }
    return text;
  } catch (error) {
    if (error instanceof LLMWhispererClientException) {
      error.statusCode = error.statusCode ?? -1;
    }
    throw error;
  } finally {
    await cleanup();
  }
}

async function extractWithWhisperer(buffer, fileName) {
  if (!LLM_WHISPERER_API_KEYS.length) {
    throw new Error('No LLMWhisperer API keys configured.');
  }

  console.info(`[pdfExtractor] Starting LLMWhisperer extraction with ${LLM_WHISPERER_API_KEYS.length} key(s).`);

  let lastError;
  for (let index = 0; index < LLM_WHISPERER_API_KEYS.length; index += 1) {
    const apiKey = LLM_WHISPERER_API_KEYS[index];
    const maskedKey = maskApiKey(apiKey);
    console.info(`[pdfExtractor] Attempt ${index + 1}/${LLM_WHISPERER_API_KEYS.length} using key ${maskedKey}`);
    try {
      const text = await whisperWithClient(buffer, fileName, apiKey);
      console.info(`[pdfExtractor] LLMWhisperer succeeded with key ${maskedKey}.`);
      return text;
    } catch (error) {
      lastError = error;
      const message = error?.message || 'Unknown error';
      console.warn(`[pdfExtractor] LLMWhisperer key ${maskedKey} failed: ${message}`);
      if (!isQuotaError(error)) {
        break;
      }
    }
  }

  if (lastError) {
    console.error('[pdfExtractor] LLMWhisperer extraction failed for all configured keys.');
    throw lastError;
  }
  throw new Error('LLMWhisperer extraction failed for all keys.');
}

async function extractWithPdfParse(buffer) {
  const { PDFParse } = require('pdf-parse'); // eslint-disable-line global-require
  const parser = new PDFParse({ data: buffer });

  try {
    const textResult = await parser.getText();
    const textFromResult = textResult?.text
      || (Array.isArray(textResult?.pages)
        ? textResult.pages
          .map((page) => page?.text || page?.content || '')
          .filter(Boolean)
          .join('\n')
        : '');

    const cleaned = (textFromResult || '').trim();
    if (!cleaned) {
      throw new Error('No text extracted from PDF.');
    }
    return cleaned;
  } finally {
    try {
      await parser.destroy();
    } catch (destroyError) {
      console.warn('[pdfExtractor] Warning: unable to destroy pdf-parse instance:', destroyError);
    }
  }
}

async function extractPdfText(buffer, fileName = '') {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('extractPdfText expects a Buffer.');
  }

  if (!LLM_WHISPERER_API_KEYS.length) {
    console.info('[pdfExtractor] No LLMWhisperer keys configured. Using pdf-parse only.');
    return extractWithPdfParse(buffer);
  }

  try {
    return await extractWithWhisperer(buffer, fileName);
  } catch (error) {
    console.error('[pdfExtractor] LLMWhisperer extraction failed:', error?.stack || error);
    console.info('[pdfExtractor] Falling back to local pdf-parse extraction.');
    return extractWithPdfParse(buffer);
  }
}

module.exports = {
  extractPdfText,
};
