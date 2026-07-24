import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Profile({ showToast }) {
  const { user, logout } = useAuth();
  const [membership, setMembership] = useState(null);
  const [stamina, setStamina] = useState(null);
  const [inviteStats, setInviteStats] = useState(null);
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/membership').catch(() => null),
      api.get('/stamina').catch(() => null),
      api.get('/invite/stats').catch(() => null),
      api.get('/reports/overview').catch(() => null),
    ]).then(([m, s, i, o]) => {
      setMembership(m);
      setStamina(s);
      setInviteStats(i);
      setOverview(o);
    });
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 24 }}>我的</h1>

      <div className="card" style={{ marginBottom: 16, textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--primary)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px', fontSize: 24, fontWeight: 700,
        }}>
          {(user?.nickname || 'U')[0].toUpperCase()}
        </div>
        <h2>{user?.nickname || '学习者'}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Lv.{overview?.user?.level || 1} · {overview?.user?.xp || 0} XP
        </p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>会员</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{
              padding: '4px 12px',
              background: 'var(--primary-light)',
              color: 'var(--primary-dark)',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 14,
            }}>
              {membership?.plan?.name || '免费版'}
            </span>
            {membership?.expiresAt && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                到期：{new Date(membership.expiresAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <button className="btn-secondary" style={{ fontSize: 13 }}>升级</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>体力</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div className="progress-bar" style={{ height: 12 }}>
              <div className="progress-bar-fill" style={{
                width: `${stamina ? (stamina.current / stamina.max * 100) : 0}%`,
                background: 'var(--success)',
              }} />
            </div>
          </div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>
            {stamina?.current || 0}/{stamina?.max || 100}
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
          每10分钟恢复1点
        </p>
      </div>

      {inviteStats && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 12 }}>邀请好友</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>邀请码</span>
            <span style={{ fontWeight: 600, letterSpacing: 2 }}>{inviteStats.code || '暂无'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>已邀请</span>
            <span style={{ fontWeight: 600 }}>{inviteStats.totalInvites} 人</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
            每邀请1人注册，双方各得50XP
          </p>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>学习统计</h3>
        <div className="stats-grid" style={{ marginBottom: 0 }}>
          <div className="stat-card">
            <div className="stat-value" style={{ fontSize: 20 }}>{overview?.total?.studyMinutes || 0}min</div>
            <div className="stat-label">总学习时长</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ fontSize: 20 }}>{overview?.total?.wordsLearned || 0}</div>
            <div className="stat-label">学习词汇</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ fontSize: 20 }}>{overview?.total?.conversationsCount || 0}</div>
            <div className="stat-label">对话次数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ fontSize: 20 }}>{overview?.streak || 0}天</div>
            <div className="stat-label">连续签到</div>
          </div>
        </div>
      </div>

      <button className="btn-danger" onClick={handleLogout} style={{ width: '100%' }}>
        退出登录
      </button>
    </div>
  );
}