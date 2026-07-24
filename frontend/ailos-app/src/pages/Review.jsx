import { useState, useEffect } from 'react';
import api from '../api/client';

export default function Review({ showToast }) {
  const [decks, setDecks] = useState([]);
  const [currentDeck, setCurrentDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      const data = await api.get('/srs/decks');
      setDecks(data);
      const statsData = await api.get('/srs/stats');
      setStats(statsData);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const startReview = async (deckId) => {
    try {
      const data = await api.get(`/srs/decks/${deckId}/review?limit=20`);
      setCards(data);
      setCurrentDeck(deckId);
      setCurrentCardIdx(0);
      setFlipped(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleQuality = async (quality) => {
    const card = cards[currentCardIdx];
    if (!card) return;

    try {
      await api.post(`/srs/cards/${card.id}/review`, { quality });
      if (currentCardIdx < cards.length - 1) {
        setCurrentCardIdx(prev => prev + 1);
        setFlipped(false);
      } else {
        showToast('复习完成！');
        setCards([]);
        setCurrentDeck(null);
        loadDecks();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  // Flashcard review mode
  if (cards.length > 0 && currentCardIdx < cards.length) {
    const card = cards[currentCardIdx];
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ marginBottom: 8 }}>复习中</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          {currentCardIdx + 1} / {cards.length}
        </p>

        <div className="flashcard" onClick={() => setFlipped(!flipped)}>
          <div className={`flashcard-inner ${flipped ? 'flipped' : ''}`}>
            <div className="flashcard-front">
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>问题</div>
                <div>{card.front}</div>
              </div>
            </div>
            <div className="flashcard-back">
              <div>
                <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 8 }}>答案</div>
                <div>{card.back}</div>
                {card.notes && <div style={{ fontSize: 13, marginTop: 8, opacity: 0.8 }}>{card.notes}</div>}
              </div>
            </div>
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 8 }}>点击卡片翻转</p>

        {flipped && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 24 }}>
            <button className="btn-danger" onClick={() => handleQuality(0)}>完全忘记</button>
            <button className="btn-secondary" onClick={() => handleQuality(2)}>有点难</button>
            <button className="btn-secondary" onClick={() => handleQuality(3)}>记住了</button>
            <button className="btn-secondary" onClick={() => handleQuality(4)} style={{ gridColumn: '1 / 3' }}>很简单</button>
            <button className="btn-primary" onClick={() => handleQuality(5)}>太简单了</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>SRS 间隔复习</h1>

      {stats && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-value">{stats.dueCards}</div>
            <div className="stat-label">待复习</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalCards}</div>
            <div className="stat-label">总卡片</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.reviewsToday}</div>
            <div className="stat-label">今日已复习</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.retentionRate}%</div>
            <div className="stat-label">记忆保持率</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {decks.map(deck => (
          <div key={deck.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>{deck.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                {deck._count?.cards || 0} 张卡片 · {deck.cards?.length || 0} 张待复习
              </p>
            </div>
            <button
              className="btn-primary"
              onClick={() => startReview(deck.id)}
              disabled={!deck.cards?.length}
            >
              {deck.cards?.length ? `开始复习 (${deck.cards.length})` : '无待复习'}
            </button>
          </div>
        ))}

        {decks.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
            还没有复习牌组，开始学习后会自动创建
          </div>
        )}
      </div>
    </div>
  );
}