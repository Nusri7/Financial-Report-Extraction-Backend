function extractJson(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const codeBlockMatch = text.match(/```json([\s\S]*?)```/i) || text.match(/```([\s\S]*?)```/i);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch (error) {
      // fall through to broader search
    }
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (error) {
      return null;
    }
  }

  return null;
}

module.exports = {
  extractJson,
};
