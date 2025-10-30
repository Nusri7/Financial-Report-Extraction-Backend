const { callOpenRouter } = require('./openRouter');
const { extractJson } = require('../utils/json');

async function autoClassifyLineItems(lineItems, candidateMetrics, options = {}) {
  if (!Array.isArray(lineItems) || !lineItems.length) {
    return {};
  }

  const metrics = Array.isArray(candidateMetrics) && candidateMetrics.length
    ? candidateMetrics.filter((metric) => typeof metric === 'string' && metric.trim())
    : [];

  const compactItems = lineItems.map((entry) => {
    const values = entry?.values || {};
    const cleaned = {};
    Object.entries(values).forEach(([key, value]) => {
      const trimmedValue = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
      if (trimmedValue) {
        cleaned[key] = trimmedValue;
      }
    });
    return {
      id: entry.id,
      statement: entry.statement,
      line_item: entry.line_item,
      values: cleaned,
    };
  });

  const systemPrompt = [
    'You are a senior financial analyst performing quality control.',
    'Classify each provided financial statement line item into one of the supplied internal metrics.',
    "If none of the metrics apply, use 'Unassigned'.",
    'Respond strictly with JSON in the form:',
    '{"classifications": [{"id": "...", "classification": "...", "confidence": 0.0-1.0}]}.',
    'Always include every input id exactly once.',
  ].join(' ');

  const userPayload = {
    candidate_metrics: metrics,
    line_items: compactItems,
  };

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: JSON.stringify(userPayload, null, 2) },
  ];

  try {
    const raw = await callOpenRouter(messages, options);
    const parsed = extractJson(raw);
    const result = {};

    if (parsed?.classifications && Array.isArray(parsed.classifications)) {
      parsed.classifications.forEach((entry) => {
        if (!entry || typeof entry.id !== 'string') {
          return;
        }
        const classification = typeof entry.classification === 'string'
          ? entry.classification.trim()
          : 'Unassigned';

        let confidence = null;
        if (typeof entry.confidence === 'number') {
          confidence = entry.confidence;
        } else if (typeof entry.confidence === 'string') {
          const numeric = Number(entry.confidence);
          if (Number.isFinite(numeric)) {
            confidence = numeric;
          }
        }

        result[entry.id] = {
          classification: classification || 'Unassigned',
          confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : null,
        };
      });
    }

    return result;
  } catch (error) {
    console.error('[classifier] Auto classification failed:', error);
    return {};
  }
}

module.exports = {
  autoClassifyLineItems,
};
