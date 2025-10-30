const ALL_SOP_METRICS = [
  'Revenues',
  'Gross profit',
  'Operating Profits',
  'Interest Expense',
  'Interest Income',
  'Profit Before Tax',
  'Taxation',
  'Net Profit',
  'Fixed Assets',
  'Inventory',
  'Trade Receivables',
  'Cash',
  'Current Assets',
  'Total Assets',
  'Total Equity',
  'Trade Payables',
  'Current Liabilities',
  'Total Liabilities',
  'Total Debt',
  'Book Value',
  'OCF Qtrly',
  'Depreciation Qtrly',
  'Amortization Qtrly',
  'ICF Qtrly',
  'Capital Exp Qtrly',
  'FCF Qtrly',
  'Net Borrowings Qrtly',
  'Share Price Quaterly',
  'Tot. No. of Shares',
];

const MONTH_LOOKUP = new Map([
  ['jan', 0],
  ['january', 0],
  ['feb', 1],
  ['february', 1],
  ['mar', 2],
  ['march', 2],
  ['apr', 3],
  ['april', 3],
  ['may', 4],
  ['jun', 5],
  ['june', 5],
  ['jul', 6],
  ['july', 6],
  ['aug', 7],
  ['august', 7],
  ['sep', 8],
  ['sept', 8],
  ['september', 8],
  ['oct', 9],
  ['october', 9],
  ['nov', 10],
  ['november', 10],
  ['dec', 11],
  ['december', 11],
]);

const BASE_SOP_DEFINITIONS = [
  {
    metric: 'Revenues',
    statements: ['Profit or Loss'],
    aliases: [
      'revenue',
      'revenues',
      'total revenue',
      'total revenues',
      'turnover',
      'total income',
      'gross revenue',
    ],
  },
  {
    metric: 'Gross profit',
    statements: ['Profit or Loss'],
    aliases: ['gross profit'],
  },
  {
    metric: 'Operating Profits',
    statements: ['Profit or Loss'],
    aliases: [
      'operating profit',
      'operating profits',
      'profit from operations',
      'operating income',
      'profit before finance income and costs',
    ],
  },
  {
    metric: 'Interest Expense',
    statements: ['Profit or Loss'],
    aliases: [
      'interest expense',
      'interest expenses',
      'finance cost',
      'finance costs',
      'finance expense',
      'finance expenses',
      'interest and finance costs',
    ],
  },
  {
    metric: 'Interest Income',
    statements: ['Profit or Loss'],
    aliases: [
      'interest income',
      'finance income',
      'investment income',
    ],
  },
  {
    metric: 'Profit Before Tax',
    statements: ['Profit or Loss'],
    aliases: [
      'profit before tax',
      'profit before taxation',
      'profit before income tax',
      'earnings before tax',
      'profit before tax expense',
    ],
  },
  {
    metric: 'Taxation',
    statements: ['Profit or Loss'],
    aliases: [
      'taxation',
      'income tax expense',
      'income tax',
      'tax expense',
      'corporation tax',
    ],
  },
  {
    metric: 'Net Profit',
    statements: ['Profit or Loss'],
    aliases: [
      'net profit',
      'profit after tax',
      'profit for the period',
      'profit for the quarter',
      'profit for the year',
      'profit attributable to equity holders',
      'profit attributable to owners of the company',
      'profit attributable to owners of the parent',
    ],
  },
  {
    metric: 'Fixed Assets',
    statements: ['Financial Position'],
    aliases: [
      'fixed assets',
      'property plant and equipment',
      'property, plant and equipment',
      'property plant & equipment',
      'property, plant & equipment',
    ],
  },
  {
    metric: 'Inventory',
    statements: ['Financial Position'],
    aliases: [
      'inventory',
      'inventories',
      'stock in trade',
    ],
  },
  {
    metric: 'Trade Receivables',
    statements: ['Financial Position'],
    aliases: [
      'trade receivables',
      'trade and other receivables',
      'accounts receivable',
      'trade debtors',
    ],
  },
  {
    metric: 'Cash',
    statements: ['Financial Position', 'Cash Flows'],
    aliases: [
      'cash and cash equivalents',
      'cash & cash equivalents',
      'cash at bank and in hand',
      'cash in hand and at bank',
      'cash balances',
    ],
  },
  {
    metric: 'Current Assets',
    statements: ['Financial Position'],
    aliases: [
      'total current assets',
      'current assets',
    ],
  },
  {
    metric: 'Total Assets',
    statements: ['Financial Position'],
    aliases: [
      'total assets',
      'total assets employed',
    ],
  },
  {
    metric: 'Total Equity',
    statements: ['Financial Position', 'Changes in Equity'],
    aliases: [
      'total equity',
      'total shareholders equity',
      'total equity attributable to owners of the parent',
      'equity attributable to owners of the company',
      'equity attributable to equity holders of the parent',
    ],
  },
  {
    metric: 'Trade Payables',
    statements: ['Financial Position'],
    aliases: [
      'trade payables',
      'trade and other payables',
      'accounts payable',
      'trade creditors',
    ],
  },
  {
    metric: 'Current Liabilities',
    statements: ['Financial Position'],
    aliases: [
      'total current liabilities',
      'current liabilities',
    ],
  },
  {
    metric: 'Total Liabilities',
    statements: ['Financial Position'],
    aliases: [
      'total liabilities',
    ],
    excludes: ['equity'],
  },
  {
    metric: 'Total Debt',
    statements: ['Financial Position', 'Cash Flows'],
    aliases: [
      'total debt',
      'interest bearing borrowings',
      'interest-bearing borrowings',
      'total borrowings',
      'total interest bearing liabilities',
      'borrowings - total',
    ],
  },
  {
    metric: 'Book Value',
    statements: ['Financial Position', 'Changes in Equity'],
    aliases: [
      'net asset value per share',
      'net assets per share',
      'book value per share',
      'net assets value per share',
    ],
  },
  {
    metric: 'OCF Qtrly',
    statements: ['Cash Flows'],
    aliases: [
      'net cash generated from operating activities',
      'net cash from operating activities',
      'net cash provided by operating activities',
      'cash flows from operating activities',
      'net cash flow from operating activities',
    ],
  },
  {
    metric: 'Depreciation Qtrly',
    statements: ['Profit or Loss', 'Cash Flows'],
    aliases: [
      'depreciation',
      'depreciation of property plant and equipment',
      'depreciation expense',
    ],
  },
  {
    metric: 'Amortization Qtrly',
    statements: ['Profit or Loss', 'Cash Flows'],
    aliases: [
      'amortisation',
      'amortisation expenses',
      'amortization',
      'amortization expense',
    ],
  },
  {
    metric: 'ICF Qtrly',
    statements: ['Cash Flows'],
    aliases: [
      'net cash used in investing activities',
      'net cash from investing activities',
      'cash flows from investing activities',
      'net cash flow from investing activities',
    ],
  },
  {
    metric: 'Capital Exp Qtrly',
    statements: ['Cash Flows'],
    aliases: [
      'purchase of property plant and equipment',
      'purchase of property, plant and equipment',
      'acquisition of property plant and equipment',
      'capital expenditure',
      'additions to property plant and equipment',
    ],
  },
  {
    metric: 'Net Borrowings Qrtly',
    statements: ['Cash Flows'],
    aliases: [
      'net borrowings',
      'net increase in borrowings',
      'net (repayment)/drawdown of borrowings',
      'net repayment of borrowings',
      'net increase/(decrease) in borrowings',
      'net increase/decrease in borrowings',
    ],
  },
  {
    metric: 'Share Price Quaterly',
    statements: ['Changes in Equity', 'Financial Position'],
    aliases: [
      'share price',
      'market price per share',
      'market value per share',
    ],
  },
  {
    metric: 'Tot. No. of Shares',
    statements: ['Changes in Equity', 'Financial Position'],
    aliases: [
      'number of shares in issue',
      'total number of shares',
      'stated capital number of shares',
      'total shares in issue',
      'number of ordinary shares',
    ],
  },
];

const DERIVED_SOP_DEFINITIONS = [
  {
    metric: 'FCF Qtrly',
    derive: (resultsMap) => {
      const ocf = resultsMap.get('OCF Qtrly');
      const capex = resultsMap.get('Capital Exp Qtrly');
      if (!ocf || !capex) {
        return null;
      }

      const ocfValue = typeof ocf.numericValue === 'number' ? ocf.numericValue : parseNumericValue(ocf.value);
      const capexValue = typeof capex.numericValue === 'number' ? capex.numericValue : parseNumericValue(capex.value);

      if (typeof ocfValue !== 'number' || Number.isNaN(ocfValue)
        || typeof capexValue !== 'number' || Number.isNaN(capexValue)) {
        return null;
      }

      const computed = capexValue < 0 ? ocfValue + capexValue : ocfValue - capexValue;
      return {
        value: formatNumber(computed),
        numericValue: computed,
        statement: 'Derived (Cash Flows)',
        column: ocf.column || capex.column || '',
        sourceLine: 'OCF Qtrly minus Capital Exp Qtrly',
      };
    },
  },
];

function normalise(value) {
  return (value || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function trimValue(value) {
  if (value === null || typeof value === 'undefined') {
    return '';
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toString() : '';
  }
  return String(value).trim();
}

function parseNumericValue(raw) {
  if (raw === null || typeof raw === 'undefined') {
    return null;
  }
  let str = String(raw).trim();
  if (!str || /^[-–—]+$/.test(str)) {
    return null;
  }

  str = str.replace(/\(Note.*?\)/gi, '');
  str = str.replace(/\bNote\s*\d+\b/gi, '').trim();

  let isNegative = false;
  if (str.startsWith('(') && str.endsWith(')')) {
    isNegative = true;
    str = str.slice(1, -1);
  }

  if (str.endsWith('-')) {
    isNegative = true;
    str = str.slice(0, -1);
  }

  str = str.replace(/[, ]+/g, '');
  str = str.replace(/[^0-9.\-]/g, '');

  if (!str || str === '-' || str === '--') {
    return null;
  }

  const numeric = Number(str);
  if (Number.isNaN(numeric)) {
    return null;
  }
  return isNegative ? -numeric : numeric;
}

function formatNumber(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  if (value < 0) {
    return `(${formatter.format(Math.abs(value))})`;
  }
  return formatter.format(value);
}

function parseColumnDate(header) {
  if (!header) {
    return null;
  }

  const cleaned = header
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(group|company|consolidated|unaudited|audited|figures|for|the|period|quarter|months?|results|financial statements|rs|lkr|mn|million|billion|lakhs|000|\'000)\b/gi, ' ')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned) {
    const parsed = Date.parse(cleaned);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed);
    }
  }

  const lower = header.toLowerCase();
  const yearMatch = lower.match(/(20\d{2}|19\d{2})/);
  if (!yearMatch) {
    return null;
  }
  const year = Number(yearMatch[1]);

  let month = null;
  for (const [token, index] of MONTH_LOOKUP.entries()) {
    if (lower.includes(token)) {
      month = index;
      break;
    }
  }

  if (month === null) {
    const quarterMatch = lower.match(/q\s*([1-4])/i);
    if (quarterMatch) {
      const quarter = Number(quarterMatch[1]);
      if (quarter >= 1 && quarter <= 4) {
        month = quarter * 3 - 1; // Use quarter end month
      }
    }
  }

  if (month === null) {
    month = 11; // Default to December if no better information
  }

  let day = 1;
  const dayBeforeMonth = lower.match(/(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)/);
  if (dayBeforeMonth) {
    day = Number(dayBeforeMonth[1]);
  } else {
    const dayMatch = lower.match(/\b(3[01]|[12]\d|0?[1-9])\b/);
    if (dayMatch) {
      const candidate = Number(dayMatch[1]);
      if (candidate >= 1 && candidate <= 31) {
        day = candidate;
      }
    }
  }

  return new Date(Date.UTC(year, month, day));
}

function scoreColumn(header, index) {
  const parsedDate = parseColumnDate(header);
  if (parsedDate) {
    return parsedDate.getTime();
  }
  const yearMatch = String(header || '').match(/(20\d{2}|19\d{2})/);
  if (yearMatch) {
    return Number(yearMatch[1]) * 1000 - index;
  }
  return -index;
}

function isLikelyQuarterHeader(header) {
  if (!header) {
    return false;
  }
  const lower = header.toLowerCase();
  if (/(q\s*[1-4])/.test(lower)) {
    return true;
  }
  if (/\b(20\d{2}|19\d{2})\b/.test(lower) && /(quarter|months|period)/.test(lower)) {
    return true;
  }
  const monthDetected = Array.from(MONTH_LOOKUP.keys()).some((token) => lower.includes(token));
  if (monthDetected && /\b(20\d{2}|19\d{2})\b/.test(lower)) {
    return true;
  }
  return false;
}

function selectLatestColumn(frame) {
  if (!frame || !Array.isArray(frame.headers) || frame.headers.length < 2) {
    return '';
  }
  const columns = frame.headers
    .slice(1)
    .map((column) => (typeof column === 'string' ? column.trim() : column))
    .filter((column) => column);

  if (!columns.length) {
    return '';
  }

  if (isLikelyQuarterHeader(columns[0])) {
    return columns[0];
  }

  let bestColumn = columns[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  columns.forEach((column, idx) => {
    const currentScore = scoreColumn(column, idx);
    if (currentScore > bestScore) {
      bestScore = currentScore;
      bestColumn = column;
    }
  });

  return bestColumn || '';
}

function findBestRow(frame, columnName, aliases, excludes) {
  if (!frame || !Array.isArray(frame.rows) || !frame.rows.length) {
    return null;
  }
  const headers = frame.headers || [];
  if (!headers.length) {
    return null;
  }
  const labelKey = headers[0];
  if (!labelKey || !columnName) {
    return null;
  }

  const normalizedAliases = (aliases || []).map((alias) => normalise(alias)).filter(Boolean);
  if (!normalizedAliases.length) {
    return null;
  }

  const normalizedExcludes = (excludes || []).map((term) => normalise(term)).filter(Boolean);

  let bestMatch = null;

  frame.rows.forEach((row) => {
    const labelRaw = trimValue(row[labelKey]);
    if (!labelRaw) {
      return;
    }
    const normalizedLabel = normalise(labelRaw);
    if (!normalizedLabel) {
      return;
    }

    if (normalizedExcludes.length && normalizedExcludes.some((term) => normalizedLabel.includes(term))) {
      return;
    }

    normalizedAliases.forEach((alias) => {
      if (!alias) {
        return;
      }
      if (!normalizedLabel.includes(alias)) {
        return;
      }

      const exact = normalizedLabel === alias;
      const score = exact ? (1000 + alias.length) : alias.length;
      if (!bestMatch || score > bestMatch.score) {
        const rawValue = trimValue(row[columnName]);
        bestMatch = {
          label: labelRaw,
          value: rawValue || '-',
          numericValue: parseNumericValue(rawValue),
          score,
        };
      }
    });
  });

  return bestMatch;
}

function extractQuarterlySops(dataframes) {
  const resultsMap = new Map();
  const metadata = {
    latestColumns: {},
  };

  BASE_SOP_DEFINITIONS.forEach((definition) => {
    const baseResult = {
      metric: definition.metric,
      value: '-',
      statement: '',
      column: '',
      sourceLine: '',
      numericValue: null,
    };

    if (!definition.statements || !definition.statements.length) {
      resultsMap.set(definition.metric, baseResult);
      return;
    }

    for (const statement of definition.statements) {
      const frame = dataframes?.[statement];
      if (!frame) {
        continue;
      }

      if (!metadata.latestColumns[statement]) {
        metadata.latestColumns[statement] = selectLatestColumn(frame);
      }

      const targetColumn = metadata.latestColumns[statement];
      if (!targetColumn) {
        continue;
      }

      const match = findBestRow(frame, targetColumn, definition.aliases, definition.excludes);
      if (match) {
        baseResult.value = match.value || '-';
        baseResult.statement = statement;
        baseResult.column = targetColumn;
        baseResult.sourceLine = match.label;
        if (typeof match.numericValue === 'number' && !Number.isNaN(match.numericValue)) {
          baseResult.numericValue = match.numericValue;
        }
        break;
      }
    }

    resultsMap.set(definition.metric, baseResult);
  });

  DERIVED_SOP_DEFINITIONS.forEach((definition) => {
    const current = resultsMap.get(definition.metric) || {
      metric: definition.metric,
      value: '-',
      statement: '',
      column: '',
      sourceLine: '',
      numericValue: null,
    };

    const computed = typeof definition.derive === 'function'
      ? definition.derive(resultsMap, metadata)
      : null;

    if (computed && computed.value) {
      current.value = computed.value;
      if (typeof computed.numericValue === 'number' && !Number.isNaN(computed.numericValue)) {
        current.numericValue = computed.numericValue;
      }
      if (computed.statement) {
        current.statement = computed.statement;
      }
      if (computed.column) {
        current.column = computed.column;
      }
      if (computed.sourceLine) {
        current.sourceLine = computed.sourceLine;
      }
    }

    resultsMap.set(definition.metric, current);
  });

  const summary = ALL_SOP_METRICS.map((metric) => {
    const entry = resultsMap.get(metric);
    if (!entry) {
      return {
        metric,
        value: '-',
        statement: '',
        column: '',
        sourceLine: '',
      };
    }
    return {
      metric,
      value: entry.value ?? '-',
      statement: entry.statement || '',
      column: entry.column || '',
      sourceLine: entry.sourceLine || '',
    };
  });

  return {
    summary,
    metadata,
  };
}

module.exports = {
  extractQuarterlySops,
};
