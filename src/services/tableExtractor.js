const { extractPdfText } = require('./pdfExtractor');
const { callOpenRouter } = require('./openRouter');
const { markdownTableToObjects } = require('../utils/markdownTable');

const FINANCIAL_POSITION_PROMPT = `You are an expert financial data extractor for annual reports.

Goal: locate the "STATEMENT OF FINANCIAL POSITION" table in the supplied text and return it as markdown.

SEARCH & PRIORITY ORDER (work top-down and stop once a suitable table is found):
1. Consolidated/Group table with quarterly data (Q1-Q4 or quarter-end dates such as "31 Mar").
2. Consolidated/Group table with another recent frequency (monthly, semi-annual, annual).
3. Company table with quarterly data.
4. Company table with another frequency.
If nothing matches, respond with "No table found".

OUTPUT REQUIREMENTS:
- Return the complete markdown table only (no commentary).
- Preserve every row, sub-row, subtotal, total, and note exactly as written.
- Keep column headers, ordering, units, dashes, parentheses, spacing, and signs exactly from source.
- When possible, show the newest period in the left-most numeric column while maintaining correct alignment.
- If multiple tables exist at the same priority level, choose the one with the most complete data for this statement.
- Do not invent data or modify descriptions.
`;

const GENERIC_PROMPT = (statementName) => `You are an expert financial data extractor specializing in annual reports.

Your task: Find and extract the "${statementName}" table from the provided text.

PRIORITY RULES (CRITICAL - MUST FOLLOW):
1. **QUARTERLY DATA MANDATORY**: ALWAYS choose quarterly data (Q1, Q2, Q3, Q4, or quarter-end dates like "31 Mar", "30 Jun", "30 Sep", "31 Dec") - NEVER use annual data
2. **GROUP/CONSOLIDATED MANDATORY**: ALWAYS choose "Group" or "CONSOLIDATED" tables over "Company" tables
3. **MOST RECENT QUARTER**: When multiple quarters are available, prioritize the most recent quarter
4. **LATEST COLUMN FIRST**: Present the table so the MOST RECENT quarter/date appears as the first numeric column and older periods are placed to the right
5. **SKIP NON-QUARTERLY**: If no quarterly data is available, return "No quarterly data found" instead of annual data

CRITICAL EXTRACTION REQUIREMENTS:
1. **INCLUDE ALL ROW DESCRIPTIONS**: Always include the full description/name of each line item in the first column
2. **PRESERVE ITEM HIERARCHY**: Maintain the structure of main items, sub-items, and totals exactly as shown
3. **COMPLETE LINE ITEMS**: Don't abbreviate or truncate the descriptions of financial statement items
4. **EXACT COLUMN HEADERS**: Use the original column titles from the document without modification (including quarter end dates and units)
5. **ALL NUMERICAL VALUES**: Include every number exactly as shown (including ('000) notation)
6. **PRESERVE DASHES**: When a column has a dash (-), keep it as a dash - do NOT replace with values from other columns
7. **MAINTAIN COLUMN ALIGNMENT**: Ensure each value stays in its correct column - dashes indicate no value for that period
8. **PROPER FORMATTING**: Create a clean markdown table but preserve all original content and alignment

WHAT TO INCLUDE:
✅ Full line item descriptions (e.g., "Revenue", "Cost of goods sold", "Gross profit", etc.)
✅ All numerical values in their original format
✅ Sub-totals and totals with proper hierarchy
✅ Notes and references attached to line items
✅ Original column headers with dates and units
✅ All rows including zeros and blank entries

WHAT TO AVOID:
❌ Empty columns that are just separators (|, ---, spaces only)
❌ Abbreviating or shortening line item descriptions
❌ Modifying numerical values or formats
❌ Changing column header names
❌ Omitting any rows or data

TABLE SELECTION LOGIC (MANDATORY):
- ONLY search for tables with "Group" or "CONSOLIDATED" in the title
- ONLY look for quarterly dates (Mar, Jun, Sep, Dec, Q1, Q2, Q3, Q4)
- NEVER use annual data or Company tables
- If no quarterly Group/CONSOLIDATED data found, return "No quarterly Group/CONSOLIDATED data found"

EXAMPLE FORMAT:
| Line Item Description | 2024 Rs.'000 | 2023 Rs.'000 |
|----------------------|--------------|--------------|
| Revenue              | 150,000      | 140,000      |
| Cost of sales        | (90,000)     | (85,000)     |
| Gross profit         | 60,000       | 55,000       |

QUALITY CHECKS (MANDATORY):
- Every row has a meaningful description in the first column
- All numerical values are preserved with original formatting
- Column headers match the source document exactly
- Hierarchical structure is maintained (main items, sub-items, totals)
- ONLY Group/CONSOLIDATED tables are used
- ONLY quarterly data is used (no annual data)
- If no quarterly Group/CONSOLIDATED data exists, return appropriate message

Return ONLY the clean markdown table with complete descriptions and original headers. No explanations, no extra text.`;

const CHANGES_IN_EQUITY_PROMPT = `You are an expert financial data extractor specializing in annual reports.

  Your task: Find and extract the "STATEMENT OF CHANGES IN EQUITY" table from the provided text.

  CRITICAL REQUIREMENTS FOR CHANGES IN EQUITY:
1. **INCLUDE ALL ROW DESCRIPTIONS**: This is MANDATORY for equity statements
2. **COMPLETE EQUITY COMPONENT NAMES**: Include full names like:
   - "Stated Capital" or "Share Capital"
   - "ESOP Reserve" or "Employee Share Option Plan Reserve"
   - "General Reserve" or "Statutory Reserve"
   - "Retained Earnings" or "Accumulated Profits"
   - "Other Reserves" or "Fair Value Reserve"
   - "Total Equity"
3. **MOVEMENT DESCRIPTIONS**: Include all movement types like:
   - "Balance at beginning of period"
   - "Issue of shares" or "Rights issue"
   - "Transfer to reserves"
   - "Dividend paid"
   - "Profit for the period"
   - "Other comprehensive income"
   - "Balance at end of period"

PRIORITY RULES (CRITICAL - MUST FOLLOW):
1. **QUARTERLY DATA MANDATORY**: ALWAYS choose quarterly data - NEVER use annual data
2. **GROUP/CONSOLIDATED MANDATORY**: ALWAYS choose "Group" or "CONSOLIDATED" table over "Company" table
3. **MOST RECENT QUARTER**: Prioritize the most recent quarter
4. **LATEST COLUMN FIRST**: Present the table so the most recent quarter/date is the first numeric column and older periods appear to the right
5. **SKIP NON-QUARTERLY**: If no quarterly data is available, return "No quarterly Group/CONSOLIDATED data found"

FORMAT REQUIREMENTS:
- First column MUST contain complete descriptions of equity components and movements
- Include ALL numerical columns with original headers
- Preserve exact column titles (dates, currency notations)
- Maintain hierarchical structure of equity movements

EXAMPLE FORMAT:
| Equity Component/Movement | As at 31 Mar 2025 Rs.'000 | As at 31 Dec 2024 Rs.'000 |
|---------------------------|----------------------------|----------------------------|
| Stated Capital            | 2,500,000                  | 2,500,000                  |
| Balance at beginning      | 2,500,000                  | 2,400,000                  |
| Issue of shares           | -                          | 100,000                    |
| Balance at end            | 2,500,000                  | 2,500,000                  |
| ESOP Reserve              | 45,000                     | 40,000                     |
| Retained Earnings         | 1,200,000                  | 1,100,000                  |
| Total Equity              | 3,745,000                  | 3,640,000                  |

QUALITY CHECKS (MANDATORY):
- Every row has a meaningful, complete description
- All equity components are clearly identified
- All movements/transactions are properly described
- No abbreviated or missing row descriptions
  - ONLY Group/CONSOLIDATED tables are used
  - ONLY quarterly data is used (no annual data)
  - If no quarterly Group/CONSOLIDATED data exists, return appropriate message

Return ONLY the clean markdown table with complete equity descriptions. No explanations, no extra text.`;

const CHANGES_IN_EQUITY_FALLBACK_PROMPT = (statementName = 'STATEMENT OF CHANGES IN EQUITY') => {
  const titles = STATEMENT_TITLES?.['Changes in Equity'] || [];
  const titleLines = titles.length ? `Look for headings containing:\n- ${titles.join('\n- ')}\n\n` : '';
  return `You are an expert financial data extractor specializing in annual reports.

Your task: Locate and extract the "${statementName}" table from the provided text.

PRIORITY & FALLBACK ORDER (FOLLOW IN SEQUENCE):
1. Consolidated/Group table with quarterly data (preferred)
2. Consolidated/Group table with semi-annual or annual data
3. Company table with quarterly data
4. Company table with semi-annual or annual data
If none of the above are present, return the most complete version of this statement that exists.

TITLE VARIATIONS TO CONSIDER:
- "STATEMENT OF CHANGES IN EQUITY"
- "STATEMENT OF CHANGES IN SHAREHOLDERS' EQUITY"
- "STATEMENT OF SHAREHOLDERS' EQUITY"
- "STATEMENT OF STOCKHOLDERS' EQUITY"
- "STATEMENT OF OWNERS' EQUITY"

HEADER & STRUCTURE REQUIREMENTS:
- Combine multi-row or grouped headers into a single line using " - " between each header level (e.g., "Equity attributable to owners of the Company - Stated capital")
- Preserve the order of equity components and movements exactly as presented
- Include full descriptions for components such as stated capital, reserves, retained earnings, non-controlling interests, and totals
- Keep every numeric column with its original header text (dates, currency, units)
- Retain dashes or blanks when no value is provided

QUALITY CHECKS:
- Every row must have a descriptive label in the first column
- Preserve the hierarchy and sequence of opening balances, movements, and closing balances
- Do not invent values or alter formatting

${titleLines}Return ONLY the clean markdown table, no commentary.`;
};

const CHANGES_IN_EQUITY_ALIASES = [
  'STATEMENT OF CHANGES IN EQUITY',
  "STATEMENT OF CHANGES IN SHAREHOLDERS' EQUITY",
  "STATEMENT OF SHAREHOLDERS' EQUITY",
  "STATEMENT OF STOCKHOLDERS' EQUITY",
  "STATEMENT OF OWNERS' EQUITY",
  "STATEMENT OF CHANGES IN OWNERS' EQUITY",
];

const STATEMENT_TITLES = {
  'Profit or Loss': [
    'STATEMENT OF PROFIT OR LOSS',
    'STATEMENT OF PROFIT OR LOSS AND OTHER COMPREHENSIVE INCOME',
    'INCOME STATEMENT',
    'STATEMENT OF INCOME',
  ],
  'Comprehensive Income': [
    'STATEMENT OF COMPREHENSIVE INCOME',
    'STATEMENT OF PROFIT OR LOSS AND OTHER COMPREHENSIVE INCOME',
    'STATEMENT OF OTHER COMPREHENSIVE INCOME',
  ],
  'Financial Position': [
    'STATEMENT OF FINANCIAL POSITION',
    'BALANCE SHEET',
    'STATEMENT OF ASSETS AND LIABILITIES',
  ],
  'Changes in Equity': [
    'STATEMENT OF CHANGES IN EQUITY',
    "STATEMENT OF CHANGES IN SHAREHOLDERS' EQUITY",
    "STATEMENT OF SHAREHOLDERS' EQUITY",
    "STATEMENT OF STOCKHOLDERS' EQUITY",
    "STATEMENT OF OWNERS' EQUITY",
    "STATEMENT OF CHANGES IN OWNERS' EQUITY",
  ],
  'Cash Flows': [
    'STATEMENT OF CASH FLOWS',
    'CASH FLOW STATEMENT',
    'CONSOLIDATED CASH FLOW STATEMENT',
    'STATEMENT OF CASH FLOW',
  ],
};

const RELAXED_STATEMENT_PROMPT = (statementName, titles = []) => {
  const titleBlock = titles.length
    ? `Look for headings containing any of the following phrases (case-insensitive):\n- ${titles.join('\n- ')}\n\n`
    : '';
  return `You are an expert analyst extracting a financial statement from an annual report.

Your mission: return the "${statementName}" table as markdown.

SELECTION RULES:
1. Prefer Group/Consolidated tables when they exist.
2. If no Group/Consolidated table is available, use the Company table.
3. Accept quarterly, semi-annual, or annual data if that is all that is available.
4. Choose the version with the most complete data.

${titleBlock}OUTPUT REQUIREMENTS:
- Preserve original column headers, order, units, and formatting (including dashes and parentheses).
- Include every row, subtotal, total, and note exactly as seen.
- Do not invent or alter values.
- Return only the markdown table with no commentary.`;
};

const CASH_FLOW_PROMPT = `You are an expert financial data extractor specializing in annual reports.

Your task: Find and extract the "STATEMENT OF CASH FLOWS" table from the provided text.

PRIORITY RULES (in order of preference):
1. **QUARTERLY DATA PREFERRED**: Look for quarterly data first (Q1, Q2, Q3, Q4, or quarter-end dates like "31 Mar", "30 Jun", "30 Sep", "31 Dec")
2. **GROUP/CONSOLIDATED PREFERRED**: Look for "Group" or "CONSOLIDATED" tables first
3. **FALLBACK TO ANNUAL**: If no quarterly data found, use annual data
4. **FALLBACK TO COMPANY**: If no Group/CONSOLIDATED data found, use Company data
5. **MOST RECENT PERIOD**: When multiple periods are available, prioritize the most recent period

CRITICAL EXTRACTION REQUIREMENTS:
1. **INCLUDE ALL ROW DESCRIPTIONS**: Always include the full description/name of each line item in the first column
2. **PRESERVE ITEM HIERARCHY**: Maintain the structure of main items, sub-items, and totals exactly as shown
3. **COMPLETE LINE ITEMS**: Don't abbreviate or truncate the descriptions of financial statement items
4. **EXACT COLUMN HEADERS**: Use the original column titles from the document without modification
5. **ALL NUMERICAL VALUES**: Include every number exactly as shown (including ('000) notation)
6. **PRESERVE DASHES**: When a column has a dash (-), keep it as a dash - do NOT replace with values from other columns
7. **MAINTAIN COLUMN ALIGNMENT**: Ensure each value stays in its correct column - dashes indicate no value for that period
8. **PROPER FORMATTING**: Create a clean markdown table but preserve all original content and alignment

WHAT TO INCLUDE:
✅ Full line item descriptions (e.g., "Cash from operating activities", "Cash from investing activities", etc.)
✅ All numerical values in their original format
✅ Sub-totals and totals with proper hierarchy
✅ Notes and references attached to line items
✅ Original column headers with dates and units
✅ All rows including zeros and blank entries

WHAT TO AVOID:
❌ Empty columns that are just separators (|, ---, spaces only)
❌ Abbreviating or shortening line item descriptions
❌ Modifying numerical values or formats
❌ Changing column header names
❌ Omitting any rows or data

TABLE SELECTION LOGIC (FLEXIBLE):
- FIRST try to find tables with "Group" or "CONSOLIDATED" in the title with quarterly dates
- THEN try to find tables with "Group" or "CONSOLIDATED" in the title with annual dates
- THEN try to find tables with "Company" in the title with quarterly dates
- FINALLY try to find tables with "Company" in the title with annual dates
- If no cashflow table found at all, return "No cashflow data found"

EXAMPLE FORMAT:
| Line Item Description | 2024 Rs.'000 | 2023 Rs.'000 |
|----------------------|--------------|--------------|
| Cash from operating activities | 150,000 | 140,000 |
| Cash from investing activities | (50,000) | (45,000) |
| Cash from financing activities | (20,000) | (15,000) |
| Net change in cash | 80,000 | 80,000 |

QUALITY CHECKS (MANDATORY):
- Every row has a meaningful description in the first column
- All numerical values are preserved with original formatting
- Column headers match the source document exactly
- Hierarchical structure is maintained (main items, sub-items, totals)
- If no cashflow data exists, return appropriate message

Return ONLY the clean markdown table with complete descriptions and original headers. No explanations, no extra text.`;

async function extractWithPrompt(text, prompt) {
  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: text },
  ];
  return callOpenRouter(messages);
}

async function extractTable(text, statementName) {
  return extractWithPrompt(text, GENERIC_PROMPT(statementName));
}

function isValidTable(result) {
  if (!result || typeof result !== 'string') {
    return false;
  }
  const trimmed = result.trim();
  if (!trimmed) {
    return false;
  }
  if (trimmed.length < 100) {
    return false;
  }
  return !/No (table|quarterly|data) found/i.test(trimmed);
}

async function extractWithAliases(text, aliases, promptBuilder = GENERIC_PROMPT) {
  let lastAttempt = '';
  for (const alias of aliases) {
    const prompt = typeof promptBuilder === 'function' ? promptBuilder(alias) : promptBuilder;
    const attempt = await extractWithPrompt(text, prompt);
    lastAttempt = attempt;
    if (isValidTable(attempt)) {
      return attempt;
    }
  }
  return lastAttempt;
}

async function extractProfitOrLoss(text) {
  const aliases = STATEMENT_TITLES['Profit or Loss'];
  const primary = await extractWithAliases(text, aliases);
  if (isValidTable(primary)) {
    return primary;
  }
  const relaxed = await extractWithAliases(
    text,
    aliases,
    (alias) => RELAXED_STATEMENT_PROMPT(alias, STATEMENT_TITLES['Profit or Loss']),
  );
  if (isValidTable(relaxed)) {
    return relaxed;
  }
  return primary || relaxed;
}

async function extractComprehensiveIncome(text) {
  const aliases = STATEMENT_TITLES['Comprehensive Income'];
  const primary = await extractWithAliases(text, aliases);
  if (isValidTable(primary)) {
    return primary;
  }
  const relaxed = await extractWithAliases(
    text,
    aliases,
    (alias) => RELAXED_STATEMENT_PROMPT(alias, STATEMENT_TITLES['Comprehensive Income']),
  );
  if (isValidTable(relaxed)) {
    return relaxed;
  }
  return primary || relaxed;
}

async function extractFinancialPosition(text) {
  const firstAttempt = await extractWithPrompt(text, FINANCIAL_POSITION_PROMPT);
  if (isValidTable(firstAttempt)) {
    return firstAttempt;
  }
  const aliases = [
    'STATEMENT OF FINANCIAL POSITION',
    'BALANCE SHEET',
    'STATEMENT OF ASSETS AND LIABILITIES',
  ];
  const strict = await extractWithAliases(text, aliases);
  if (isValidTable(strict)) {
    return strict;
  }
  const relaxed = await extractWithAliases(
    text,
    aliases,
    (alias) => RELAXED_STATEMENT_PROMPT(alias, STATEMENT_TITLES['Financial Position']),
  );
  if (isValidTable(relaxed)) {
    return relaxed;
  }
  return strict || relaxed;
}

async function extractChangesInEquity(text) {
  const strictAttempt = await extractWithPrompt(text, CHANGES_IN_EQUITY_PROMPT);
  if (isValidTable(strictAttempt)) {
    return strictAttempt;
  }

  const relaxedAttempt = await extractWithPrompt(text, CHANGES_IN_EQUITY_FALLBACK_PROMPT());
  if (isValidTable(relaxedAttempt)) {
    return relaxedAttempt;
  }

  const aliasAttempt = await extractWithAliases(
    text,
    CHANGES_IN_EQUITY_ALIASES,
    (alias) => CHANGES_IN_EQUITY_FALLBACK_PROMPT(alias),
  );
  if (isValidTable(aliasAttempt)) {
    return aliasAttempt;
  }

  return strictAttempt || relaxedAttempt || aliasAttempt;
}

async function extractCashFlows(text) {
  const firstAttempt = await extractWithPrompt(text, CASH_FLOW_PROMPT);
  if (isValidTable(firstAttempt)) {
    return firstAttempt;
  }
  const aliases = STATEMENT_TITLES['Cash Flows'];
  const fallback = await extractWithAliases(text, aliases);
  if (isValidTable(fallback)) {
    return fallback;
  }
  const relaxed = await extractWithAliases(
    text,
    aliases,
    (alias) => RELAXED_STATEMENT_PROMPT(alias, STATEMENT_TITLES['Cash Flows']),
  );
  if (isValidTable(relaxed)) {
    return relaxed;
  }

  if (!isValidTable(firstAttempt) && !isValidTable(fallback) && relaxed && !isValidTable(relaxed)) {
    console.warn('[tableExtractor] Cash Flows extraction failed: no valid table found after relaxed prompt.');
  }

  return firstAttempt || fallback;
}

function logTableSummary(label, rawTable) {
  if (!rawTable) {
    console.warn(`[tableExtractor] ${label}: no result returned.`);
    return;
  }
  if (isValidTable(rawTable)) {
    const lineCount = rawTable.split('\n').length;
    console.info(`[tableExtractor] ${label}: extracted table (${lineCount} markdown line(s)).`);
  } else {
    const preview = rawTable.slice(0, 120).replace(/\s+/g, ' ');
    console.warn(`[tableExtractor] ${label}: unusable result. Preview: "${preview}"`);
  }
}

function parseMarkdownFrame(name, markdown, { requireGroup = true } = {}) {
  if (!markdown || typeof markdown !== 'string') {
    return null;
  }

  const parsed = markdownTableToObjects(markdown);
  if (!parsed) {
    console.warn(`[tableExtractor] Unable to parse markdown for ${name}.`);
    return null;
  }

  const { headers, rows } = parsed;
  if (!Array.isArray(headers) || headers.length < 2 || !Array.isArray(rows) || !rows.length) {
    console.warn(`[tableExtractor] Parsed table for ${name} has insufficient headers/rows.`);
    return null;
  }

  const lowerMarkdown = markdown.toLowerCase();
  const hasGroup = lowerMarkdown.includes('group') || lowerMarkdown.includes('consolidated');
  const hasCompany = lowerMarkdown.includes('company');

  if (requireGroup && !hasGroup) {
    console.info(`[tableExtractor] Rejecting ${name}: no Group/Consolidated indicator found.`);
    return null;
  }

  if (requireGroup && hasCompany && !hasGroup) {
    console.info(`[tableExtractor] Skipping ${name}: only Company data present.`);
    return null;
  }

  const groupKeywords = ['group', 'consolidated'];
  const lowerHeaders = headers.map((header) => String(header || '').toLowerCase());
  const hasGroupColumn = lowerHeaders.some((lower, idx) => idx > 0 && groupKeywords.some((kw) => lower.includes(kw)));

  const companyDescriptorPattern = /(owner|holders|equity|shareholder|shareholders|attributable|parent)/;

  const keepColumn = headers.map((header, idx) => {
    if (idx === 0) {
      return true;
    }
    const lower = String(header || '').toLowerCase().trim();
    if (!lower) {
      return false;
    }
    const containsCompany = lower.includes('company');
    if (hasGroupColumn) {
      if (containsCompany && !companyDescriptorPattern.test(lower)) {
        return false;
      }
      return true;
    }
    return true;
  });

  const filteredHeaders = headers.filter((_, idx) => keepColumn[idx]);
  if (filteredHeaders.length < 2) {
    console.warn(`[tableExtractor] ${name}: all value columns removed after filtering.`);
    return null;
  }

  const filteredRows = rows
    .map((row) => {
      const nextRow = {};
      filteredHeaders.forEach((header) => {
        nextRow[header] = Object.prototype.hasOwnProperty.call(row, header) ? row[header] : '';
      });
      return nextRow;
    })
    .filter((row) => {
      const values = filteredHeaders.slice(1).map((header) => String(row[header] || '').trim());
      return values.some((value) => value && value !== '-');
    });

  if (!filteredRows.length) {
    console.warn(`[tableExtractor] ${name}: no rows remain after filtering.`);
    return null;
  }

  if (filteredHeaders.length !== headers.length) {
    console.info(`[tableExtractor] ${name}: columns reduced from ${headers.length} to ${filteredHeaders.length}.`);
  }
  console.info(`[tableExtractor] Dataframe "${name}" ready with ${filteredRows.length} row(s). (requireGroup=${requireGroup})`);

  return {
    headers: filteredHeaders,
    rows: filteredRows,
  };
}

function buildDataframes(tablesMarkdown, options = {}) {
  const frames = {};

  Object.entries(tablesMarkdown || {}).forEach(([name, markdown]) => {
    const frame = parseMarkdownFrame(name, markdown, options);
    if (frame) {
      frames[name] = frame;
    }
  });

  return frames;
}

async function safeCall(fn, label) {
  try {
    const result = await fn();
    return result ?? '';
  } catch (error) {
    console.error(`[tableExtractor] Failed to extract ${label}:`, error.message || error);
    return '';
  }
}

async function extractFinancialStatementsData(pdfBuffer, fileName) {
  const text = await extractPdfText(pdfBuffer, fileName);

  const extractionTasks = [
    ['Profit or Loss', () => extractProfitOrLoss(text)],
    ['Comprehensive Income', () => extractComprehensiveIncome(text)],
    ['Financial Position', () => extractFinancialPosition(text)],
    ['Changes in Equity', () => extractChangesInEquity(text)],
    ['Cash Flows', () => extractCashFlows(text)],
  ];

  const tablesEntries = await Promise.all(
    extractionTasks.map(async ([label, task]) => {
      const result = await safeCall(task, label);
      return [label, result];
    }),
  );

  const tablesMarkdown = Object.fromEntries(tablesEntries);
  Object.entries(tablesMarkdown).forEach(([label, rawTable]) => {
    logTableSummary(label, rawTable);
  });

  const expectedStatements = extractionTasks.map(([label]) => label);

  const strictDataframes = buildDataframes(tablesMarkdown, { requireGroup: true });
  const dataframes = { ...strictDataframes };

  expectedStatements.forEach((statement) => {
    const frame = dataframes[statement];
    if (frame && Array.isArray(frame.rows) && frame.rows.length) {
      return;
    }
    const markdown = tablesMarkdown[statement];
    if (!markdown) {
      return;
    }
    const fallbackFrame = parseMarkdownFrame(statement, markdown, { requireGroup: false });
    if (fallbackFrame) {
      dataframes[statement] = fallbackFrame;
      console.warn(`[tableExtractor] Fallback accepted for ${statement}: no Group/Consolidated indicator found but data extracted.`);
    }
  });

  console.info(`[tableExtractor] Dataframes generated: ${Object.keys(dataframes).join(', ') || 'none'}`);

  return {
    text,
    tablesMarkdown,
    dataframes,
  };
}

module.exports = {
  extractFinancialStatementsData,
};
