import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login({ showToast }) {
  const [mode, setMode] = useState('password');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, sendCode, phoneLogin } = useAuth();
  const navigate = useNavigate();

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(account, password);
      showToast('登录成功');
      navigate('/');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!phone) { showToast('请输入手机号', 'error'); return; }
    setLoading(true);
    try {
      await sendCode(phone);
      showToast('验证码已发送');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await phoneLogin(phone, code);
      showToast('登录成功');
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
        <h1>欢迎回来</h1>
        <p>登录 AILOS，继续你的语言学习之旅</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button
            className={mode === 'password' ? 'btn-primary' : 'btn-secondary'}
            style={{ flex: 1 }}
            onClick={() => setMode('password')}
          >密码登录</button>
          <button
            className={mode === 'phone' ? 'btn-primary' : 'btn-secondary'}
            style={{ flex: 1 }}
            onClick={() => setMode('phone')}
          >手机登录</button>
        </div>

        {mode === 'password' ? (
          <form onSubmit={handlePasswordLogin}>
            <div className="form-group">
              <label>手机号/邮箱</label>
              <input type="text" value={account} onChange={e => setAccount(e.target.value)} placeholder="请输入手机号或邮箱" required />
            </div>
            <div className="form-group">
              <label>密码</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入密码" required />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePhoneLogin}>
            <div className="form-group">
              <label>手机号</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="请输入手机号" required />
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
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        )}

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14 }}>
          还没有账号？<Link to="/register">立即注册</Link>
        </p>
      </div>
    </div>
  );
}