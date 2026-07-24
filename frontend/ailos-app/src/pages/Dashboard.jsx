import { useState, useEffect } from 'react';
import api from '../api/client';

export default function Dashboard({ showToast }) {
  const [data, setData] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    api.get('/dashboard').then(setData).catch(err => showToast(err.message, 'error'));
  }, []);

  const handleCheckin = async () => {
    setCheckingIn(true);
    try {
      const result = await api.post('/checkin');
      showToast(`签到成功！连续${result.streak}天`);
      const updated = await api.get('/dashboard');
      setData(updated);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  if (!data) return <div className="loading-page"><div className="spinner" /></div>;

  const { user, checkin, aiQuota, learning } = data;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>你好，{user.nickname || '学习者'} 👋</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{user.xp || 0}</div>
          <div className="stat-label">总经验值</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">Lv.{user.level || 1}</div>
          <div className="stat-label">当前等级</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{learning?.totalWords || 0}</div>
          <div className="stat-label">词汇量</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{learning?.totalMinutes || 0}min</div>
          <div className="stat-label">学习时长</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>签到</h3>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--primary)' }}>
            {checkin?.checkInStreak || 0} 天
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>连续签到</p>
          <button
            className="btn-primary"
            onClick={handleCheckin}
            disabled={checkin?.todayCheckedIn || checkingIn}
            style={{ width: '100%' }}
          >
            {checkin?.todayCheckedIn ? '今日已签到' : checkingIn ? '签到中...' : '签到 +5XP'}
          </button>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>AI 额度</h3>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span>对话</span>
              <span>{aiQuota?.used?.conversation || 0}/{aiQuota?.max?.conversation || 5}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${((aiQuota?.used?.conversation || 0) / (aiQuota?.max?.conversation || 5)) * 100}%` }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span>纠错</span>
              <span>{aiQuota?.used?.correction || 0}/{aiQuota?.max?.correction || 3}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${((aiQuota?.used?.correction || 0) / (aiQuota?.max?.correction || 3)) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}