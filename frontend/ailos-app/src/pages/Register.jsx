import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register({ showToast }) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, sendCode } = useAuth();
  const navigate = useNavigate();

  const handleSendCode = async () => {
    const target = phone || email;
    if (!target) { showToast('请输入手机号或邮箱', 'error'); return; }
    setLoading(true);
    try {
      await sendCode(target);
      showToast('验证码已发送');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone && !email) { showToast('请输入手机号或邮箱', 'error'); return; }
    if (!password || password.length < 6) { showToast('密码至少6位', 'error'); return; }
    if (!code) { showToast('请输入验证码', 'error'); return; }

    setLoading(true);
    try {
      await register({
        phone: phone || undefined,
        email: email || undefined,
        password,
        code,
        nickname: nickname || undefined,
      });
      showToast('注册成功！');
      navigate('/');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>创建账号</h1>
        <p>开始你的AI语言学习之旅</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>昵称（选填）</label>
            <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="给自己取个名字吧" />
          </div>
          <div className="form-group">
            <label>手机号</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="用于登录和接收验证码" />
          </div>
          <div className="form-group">
            <label>邮箱（选填）</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="用于找回密码" />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="至少6位密码" required />
          </div>
          <div className="form-group">
            <label>验证码</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="请输入验证码" required style={{ flex: 1 }} />
              <button type="button" className="btn-secondary" onClick={handleSendCode} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
                获取验证码
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14 }}>
          已有账号？<Link to="/login">立即登录</Link>
        </p>
      </div>
    </div>
  );
}