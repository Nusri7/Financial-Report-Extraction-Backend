function isSeparatorRow(row) {
  return /^[:\-\s|]+$/.test(row);
}

function parseMarkdownRow(row) {
  const trimmed = row.replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((cell) => cell.trim());
}

function normaliseHeader(headers) {
  return headers.map((header, index) => {
    const cleaned = header.trim();
    return cleaned === '' ? `Column ${index + 1}` : cleaned;
  });
}

/**
 * Convert a markdown table string to column metadata and row objects.
 * The parser purposely keeps dash values intact to preserve accounting semantics.
 */
function markdownTableToObjects(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return null;
  }

  const lines = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes('|'));

  if (lines.length < 2) {
    return null;
  }

  let headerRow = parseMarkdownRow(lines[0]);
  let headers = normaliseHeader(headerRow);

  let dataStart = 1;
  while (dataStart < lines.length) {
    const candidate = parseMarkdownRow(lines[dataStart]);
    if (candidate.length !== headers.length) {
      break;
    }
    const firstCell = candidate[0].trim();
    if (firstCell) {
      break;
    }
    const combined = headers.map((header, idx) => `${header} ${candidate[idx] || ''}`.trim());
    headers = combined.map((value, idx) => (value ? value : `Column ${idx + 1}`));
    dataStart += 1;
  }

  const dataRows = [];
  for (let i = dataStart; i < lines.length; i += 1) {
    const line = lines[i];
    if (isSeparatorRow(line)) {
      continue;
    }
    const cells = parseMarkdownRow(line);
    if (cells.every((cell) => cell === '')) {
      continue;
    }

    const row = {};
    headers.forEach((header, idx) => {
      row[header] = typeof cells[idx] === 'undefined' ? '' : cells[idx];
    });
    dataRows.push(row);
  }

  if (!dataRows.length) {
    return null;
  }

  return {
    headers,
    rows: dataRows,
  };
}

module.exports = {
  markdownTableToObjects,
};
