const DEFAULT_CLASSIFICATION_METRICS = [
  'Revenue',
  'Net Revenue',
  'Gross Profit',
  'Operating Profit',
  'EBITDA',
  'Profit Before Tax',
  'Net Profit',
  'Total Assets',
  'Total Liabilities',
  'Total Equity',
  "Cash and Cash Equivalents",
  "Cash and Cash Equivalents at End of Period",
  'Cost of Sales',
  'Operating Expenses',
  'Administrative Expenses',
  'Selling and Distribution Expenses',
  'Impairment Charges',
  'Depreciation',
  'Amortisation',
  'Interest Income',
  'Interest Expense',
  'Loan Loss Provision',
  'Other Operating Income',
  'Other Operating Expenses',
  'Total Debt',
  'Short Term Borrowings',
  'Long Term Borrowings',
  'Share Capital',
  'Retained Earnings',
  'Taxation',
  'Operating Cash Flow',
  'Investing Cash Flow',
  'Financing Cash Flow',
  'Net Cash Flow',
];

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-5-mini';
const LLM_WHISPERER_BASE_URL = process.env.LLMWHISPERER_BASE_URL_V2
  || 'https://llmwhisperer-api.us-central.unstract.com/api/v2';
const LLM_WHISPERER_API_KEYS = [
  process.env.LLMWHISPERER_API_KEY,
  process.env.LLMWHISPERER_API_KEY_1,
  process.env.LLMWHISPERER_API_KEY_2,
  process.env.LLMWHISPERER_API_KEY_3,
].filter((key) => typeof key === 'string' && key.trim());

module.exports = {
  DEFAULT_CLASSIFICATION_METRICS,
  OPENROUTER_URL,
  MODEL,
  LLM_WHISPERER_BASE_URL,
  LLM_WHISPERER_API_KEYS,
};
