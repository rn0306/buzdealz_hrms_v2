// Legacy documentController stub — document templates removed.
// All endpoints return 410 Gone to indicate the feature is removed.

function tombstone(res) {
  return res.status(410).json({ error: 'Document templates feature removed. Use /api/documents/send-offer-letter and email templates instead.' });
}

async function listTemplates(req, res) { return tombstone(res); }
async function getTemplate(req, res) { return tombstone(res); }
async function createTemplate(req, res) { return tombstone(res); }
async function updateTemplate(req, res) { return tombstone(res); }
async function deleteTemplate(req, res) { return tombstone(res); }
async function generateDocument(req, res) { return tombstone(res); }
async function sendDocument(req, res) { return tombstone(res); }

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  generateDocument,
  sendDocument,
};
