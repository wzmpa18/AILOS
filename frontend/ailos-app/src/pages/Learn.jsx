import { useState, useEffect } from 'react';
import api from '../api/client';

export default function Learn({ showToast }) {
  const [languages, setLanguages] = useState([]);
  const [selectedLang, setSelectedLang] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses/languages')
      .then(setLanguages)
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedLang) {
      setLoading(true);
      api.get(`/courses?language=${selectedLang}`)
        .then(setCourses)
        .catch(err => showToast(err.message, 'error'))
        .finally(() => setLoading(false));
    }
  }, [selectedLang]);

  if (loading && !languages.length) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>学习课程</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {languages.map(lang => (
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

      {selectedLang && (
        <div style={{ display: 'grid', gap: 16 }}>
          {courses.map(course => (
            <div key={course.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3>{course.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                    {course.description}
                  </p>
                  <span style={{
                    display: 'inline-block',
                    marginTop: 8,
                    padding: '2px 8px',
                    background: 'var(--primary-light)',
                    color: 'var(--primary-dark)',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {course.level}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                {course.units?.map(unit => (
                  <div key={unit.id} style={{
                    padding: '12px 0',
                    borderTop: '1px solid var(--border)',
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>{unit.title}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {unit.items?.map(item => (
                        <span key={item.id} style={{
                          padding: '4px 10px',
                          background: 'var(--bg)',
                          borderRadius: 6,
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                        }}>
                          {item.itemType === 'lesson' ? '📖' : item.itemType === 'quiz' ? '✏️' : '🎯'} {item.title}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {courses.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
              暂无课程，敬请期待
            </div>
          )}
        </div>
      )}
    </div>
  );
}