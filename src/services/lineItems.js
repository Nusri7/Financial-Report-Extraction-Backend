const { DEFAULT_CLASSIFICATION_METRICS } = require('../constants');

const DASH_VALUES = new Set(['-', '--', '—', '–', '―']);

function sanitiseValue(raw) {
  if (raw === null || typeof raw === 'undefined') {
    return '';
  }
  const str = String(raw).trim();
  if (!str || DASH_VALUES.has(str)) {
    return '';
  }
  return str;
}

function collectValueColumns(frames) {
  const valueColumns = new Set();
  Object.values(frames).forEach((frame) => {
    if (!frame || !Array.isArray(frame.headers) || frame.headers.length < 2) {
      return;
    }
    frame.headers.slice(1).forEach((header) => {
      const name = header?.trim();
      if (name) {
        valueColumns.add(name);
      }
    });
  });
  return Array.from(valueColumns);
}

function prepareLineItems(dataframes) {
  if (!dataframes || !Object.keys(dataframes).length) {
    return { lineItems: [], aiRecords: [] };
  }

  const valueColumns = collectValueColumns(dataframes);
  const seenIds = new Set();
  const lineItems = [];
  const aiRecords = [];

  Object.entries(dataframes).forEach(([statementName, frame]) => {
    if (!frame || !Array.isArray(frame.rows) || !frame.rows.length) {
      return;
    }
    const headers = Array.isArray(frame.headers) ? frame.headers : Object.keys(frame.rows[0] ?? {});
    if (!headers.length) {
      return;
    }
    const labelColumn = headers[0];

    frame.rows.forEach((row, idx) => {
      const rawLabel = row[labelColumn];
      const lineItem = typeof rawLabel === 'string' ? rawLabel.trim() : String(rawLabel ?? '').trim();
      if (!lineItem || /^[-\s]+$/.test(lineItem.toLowerCase()) || ['nan', 'none'].includes(lineItem.toLowerCase())) {
        return;
      }

      let rowId = `${statementName}__${idx}`;
      while (seenIds.has(rowId)) {
        rowId = `${rowId}_${Math.floor(Math.random() * 1000)}`;
      }
      seenIds.add(rowId);

      const record = {
        rowId,
        statement: statementName,
        lineItem,
      };

      const valuePayload = {};
      headers.slice(1).forEach((colName) => {
        const cleanedName = colName?.trim();
        if (!cleanedName) {
          return;
        }
        const value = sanitiseValue(row[colName]);
        record[cleanedName] = value;
        if (value) {
          valuePayload[cleanedName] = value;
        }
      });

      valueColumns.forEach((colName) => {
        if (typeof record[colName] === 'undefined') {
          record[colName] = '';
        }
      });

      record.classification = '';
      record.aiConfidence = null;

      lineItems.push(record);
      aiRecords.push({
        id: rowId,
        statement: statementName,
        line_item: lineItem,
        values: valuePayload,
      });
    });
  });

  return {
    lineItems,
    aiRecords,
    valueColumns,
  };
}

function mergeClassification(lineItems, suggestions) {
  if (!Array.isArray(lineItems) || !suggestions) {
    return lineItems ?? [];
  }
  return lineItems.map((item) => {
      const suggestion = suggestions[item.rowId];
    if (!suggestion) {
      return {
        ...item,
        classification: item.classification || 'Unassigned',
        aiConfidence: item.aiConfidence ?? null,
      };
    }
    return {
      ...item,
      classification: suggestion.classification || 'Unassigned',
      aiConfidence: typeof suggestion.confidence === 'number'
        ? Number(suggestion.confidence.toFixed(4))
        : null,
    };
  });
}

function buildCandidateMetrics(dynamicMetrics) {
  const safeDynamic = Array.isArray(dynamicMetrics)
    ? dynamicMetrics.filter((entry) => typeof entry === 'string' && entry.trim())
    : [];
  const merged = new Set(DEFAULT_CLASSIFICATION_METRICS);
  safeDynamic.forEach((metric) => merged.add(metric.trim()));
  return Array.from(merged).sort();
}

module.exports = {
  prepareLineItems,
  mergeClassification,
  buildCandidateMetrics,
};
