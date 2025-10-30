const axios = require('axios');
const { OPENROUTER_URL, MODEL } = require('../constants');

function ensureApiKey() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error('Missing OPENROUTER_API_KEY environment variable.');
  }
  return key;
}

async function callOpenRouter(messages, options = {}) {
  const apiKey = ensureApiKey();
  const payload = {
    model: options.model || MODEL,
    messages,
    temperature: typeof options.temperature === 'number' ? options.temperature : 0,
  };

  try {
    const response = await axios.post(
      OPENROUTER_URL,
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: options.timeoutMs ?? 120000,
      },
    );

    const content = response?.data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('Unexpected OpenRouter response structure.');
    }
    return content;
  } catch (error) {
    const cause = error?.response?.data || error.message || error.toString();
    console.error('[openRouter] Request failed:', cause);
    throw error;
  }
}

module.exports = {
  callOpenRouter,
};
