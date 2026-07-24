import { useState, useRef, useEffect } from 'react';
import api from '../api/client';

export default function Chat({ showToast }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '你好！我是AILOS学习助手。你可以用任何语言跟我聊天，我会帮你练习和纠正错误。你想聊什么？' },
  ]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const result = await api.post('/ai/chat', {
        message: userMessage,
        conversationId,
        language: 'auto',
        level: 'A1',
      });
      setConversationId(result.conversationId);
      setMessages(prev => [...prev, { role: 'assistant', content: result.message }]);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 24 }}>AI 对话练习</h1>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="chat-messages" style={{ padding: 16, height: 'calc(100vh - 280px)', overflowY: 'auto' }}>
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="chat-message assistant">
              <div className="spinner" />
            </div>
          )}
          <div ref={messagesEnd} />
        </div>

        <div className="chat-input-area" style={{ padding: '12px 16px' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你想说的话..."
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button className="btn-primary" onClick={handleSend} disabled={loading || !input.trim()}>
            发送
          </button>
        </div>
      </div>
    </div>
  );
}