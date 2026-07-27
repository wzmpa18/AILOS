function sendErr(res, err) {
  const code = err.status || 500;
  res.status(code).json({ success: false, error: { code: err.code || 'ERR', message: err.message } });
}
const { getVocabularyService } = require('../../services/vocabularyService');
const svc = getVocabularyService();
exports.add = async (req, res) => {
  try { const r = await svc.addWord(req.user.id, req.body || {}); res.json({ success: true, data: r }); }
  catch (e) { sendErr(res, e); }
};
exports.batch = async (req, res) => {
  try {
    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : (Array.isArray(body) ? body : []);
    const r = await svc.batchSync(req.user.id, items);
    res.json({ success: true, data: r });
  } catch (e) { sendErr(res, e); }
};
exports.list = async (req, res) => {
  try { const r = await svc.listWords(req.user.id, { lang: req.query.lang }); res.json({ success: true, data: r }); }
  catch (e) { sendErr(res, e); }
};
exports.remove = async (req, res) => {
  try { const r = await svc.deleteWord(req.user.id, req.params.id); res.json({ success: true, data: r }); }
  catch (e) { sendErr(res, e); }
};
