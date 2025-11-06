require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const { extractFinancialStatementsData } = require('./services/tableExtractor');
const { prepareLineItems, mergeClassification, buildCandidateMetrics } = require('./services/lineItems');
const { autoClassifyLineItems } = require('./services/classifier');
const { extractQuarterlySops } = require('./services/sopExtractor');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', (_req, res) => {
  res.json({
    service: 'Financial Report Extraction API',
    health: 'ok',
    endpoints: ['/api/health', '/api/process'],
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/process', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded.' });
  }

  try {
    const pdfBuffer = req.file.buffer;
    const pdfName = req.file.originalname;

    const extraction = await extractFinancialStatementsData(pdfBuffer, pdfName);
    const { lineItems, aiRecords, valueColumns } = prepareLineItems(extraction.dataframes);
    const { summary: sopSummary, metadata: sopMetadata } = extractQuarterlySops(extraction.dataframes || {});

    const candidateMetrics = buildCandidateMetrics();
    const aiSuggestions = await autoClassifyLineItems(aiRecords, candidateMetrics);
    const enrichedLineItems = mergeClassification(lineItems, aiSuggestions);

    res.json({
      pdfName,
      pdfBase64: pdfBuffer.toString('base64'),
      tablesMarkdown: extraction.tablesMarkdown,
      dataframes: extraction.dataframes,
      candidateMetrics,
      lineItems: enrichedLineItems,
      aiSuggestions,
      valueColumns,
      sopSummary,
      sopMetadata,
    });
  } catch (error) {
    console.error('[server] Processing failed:', error?.stack || error);
    const responseBody = {
      error: 'Failed to process PDF',
      details: error?.message || String(error),
    };
    if (process.env.NODE_ENV !== 'production' && error?.stack) {
      responseBody.stack = error.stack;
    }
    res.status(500).json(responseBody);
  }
});

if (require.main === module) {
  const port = process.env.PORT || 5005;
  app.listen(port, () => {
    console.log(`Financial QC backend listening on port ${port}`);
  });
}

module.exports = app;
