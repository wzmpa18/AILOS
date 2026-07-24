import { useState, useEffect } from 'react';
import { getContent, getContentById, getContentSummary } from '../services/api';

const LANGUAGES = [
  { code: 'ja', name: 'Japanese', nameLocal: '日本語' },
  { code: 'en', name: 'English', nameLocal: 'English' },
  { code: 'ko', name: 'Korean', nameLocal: '한국어' },
  { code: 'de', name: 'German', nameLocal: 'Deutsch' },
  { code: 'es', name: 'Spanish', nameLocal: 'Español' },
  { code: 'fr', name: 'French', nameLocal: 'Français' },
];

const CONTENT_TYPES = [
  { key: 'vocabulary', label: '词汇' },
  { key: 'grammar', label: '语法' },
  { key: 'listening', label: '听力' },
  { key: 'dialogue', label: '对话' },
  { key: 'pronunciation', label: '发音' },
];

export default function Learn({ showToast }) {
  const [selectedLang, setSelectedLang] = useState('ja');
  const [selectedType, setSelectedType] = useState('');
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadContentSummary();
  }, [selectedLang]);

  useEffect(() => {
    setPage(1);
    loadContent(1);
  }, [selectedLang, selectedType]);

  async function loadContentSummary() {
    try {
      const data = await getContentSummary(selectedLang);
      setSummary(data.summary || []);
    } catch (err) {
      // Summary is optional, don't show error
    }
  }

  async function loadContent(p) {
    setLoading(true);
    try {
      const params = { language: selectedLang, page: p, pageSize: 12 };
      if (selectedType) params.type = selectedType;
      const result = await getContent(params);
      setItems(result.items || []);
      setTotalPages(result.totalPages || 1);
      setPage(p);
    } catch (err) {
      showToast(err.message, 'error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleItemClick(id) {
    try {
      const item = await getContentById(id);
      setSelectedItem(item);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function renderContentData(data) {
    if (!data) return null;
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (parsed.word) {
        return (
          <div>
            <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>{parsed.word}</div>
            {parsed.reading && <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{parsed.reading}</div>}
            {parsed.meaning && <div style={{ color: 'var(--primary)', marginBottom: 8 }}>{parsed.meaning}</div>}
            {parsed.example && <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>例: {parsed.example}</div>}
          </div>
        );
      }
      if (parsed.question) {
        return (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{parsed.question}</div>
            {parsed.options && (
              <div style={{ display: 'grid', gap: 6 }}>
                {parsed.options.map((opt, i) => (
                  <div key={i} style={{ padding: '6px 10px', background: 'var(--bg)', borderRadius: 6, fontSize: 13 }}>
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      return <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{JSON.stringify(parsed, null, 2)}</pre>;
    } catch {
      return <span>{String(data)}</span>;
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>学习内容</h1>

      {/* Language selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {LANGUAGES.map(lang => (
          <button
            key={lang.code}
            className={selectedLang === lang.code ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setSelectedLang(lang.code)}
            style={{ fontSize: 13 }}
          >
            {lang.nameLocal} {lang.name}
          </button>
        ))}
      </div>

      {/* Content type filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          className={selectedType === '' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setSelectedType('')}
          style={{ fontSize: 13 }}
        >
          全部
        </button>
        {CONTENT_TYPES.map(ct => (
          <button
            key={ct.key}
            className={selectedType === ct.key ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setSelectedType(ct.key)}
            style={{ fontSize: 13 }}
          >
            {ct.label}
            {summary.find(s => s.type === ct.key) && (
              <span style={{ marginLeft: 4, opacity: 0.7 }}>({summary.find(s => s.type === ct.key).count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Content grid */}
      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {items.map(item => (
              <div
                key={item.id}
                className="card"
                style={{ cursor: 'pointer' }}
                onClick={() => handleItemClick(item.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <span style={{
                    padding: '2px 8px',
                    background: 'var(--primary-light)',
                    color: 'var(--primary-dark)',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}>
                    {item.contentType}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {item.difficultyLevel}
                  </span>
                </div>
                {renderContentData(item.contentData)}
              </div>
            ))}
          </div>

          {items.length === 0 && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
              暂无学习内容，敬请期待
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              <button
                className="btn-secondary"
                disabled={page <= 1}
                onClick={() => loadContent(page - 1)}
                style={{ fontSize: 13 }}
              >
                上一页
              </button>
              <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>
                {page} / {totalPages}
              </span>
              <button
                className="btn-secondary"
                disabled={page >= totalPages}
                onClick={() => loadContent(page + 1)}
                style={{ fontSize: 13 }}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {selectedItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setSelectedItem(null)}>
          <div className="card" style={{ maxWidth: 500, width: '90%', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>内容详情</h2>
              <button className="btn-secondary" onClick={() => setSelectedItem(null)} style={{ fontSize: 13 }}>关闭</button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={{
                padding: '2px 8px', background: 'var(--primary-light)', color: 'var(--primary-dark)',
                borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginRight: 8,
              }}>
                {selectedItem.contentType}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {selectedItem.targetLanguage} · {selectedItem.difficultyLevel}
              </span>
            </div>
            {renderContentData(selectedItem.contentData)}
          </div>
        </div>
      )}
    </div>
  );
}