// ============================================================
// src/services/api.js
// Module 02 API 层 — 学习内容 + SRS 复习 + AI 导师 + 学习报表
// ============================================================
import api from '../api/client';

// ============================================================
// Content — 学习内容体系
// ============================================================
export function getContent(params = {}) {
  const query = new URLSearchParams(params).toString();
  return api.get(`/content${query ? '?' + query : ''}`);
}

export function getContentById(id) {
  return api.get(`/content/${id}`);
}

export function getContentSummary(language) {
  const query = language ? `?language=${language}` : '';
  return api.get(`/content/summary${query}`);
}

// ============================================================
// Reviews — SRS 间隔复习引擎
// ============================================================
export function getDueReviews(limit = 20) {
  return api.get(`/reviews/due?limit=${limit}`);
}

export function getDueReviewCount() {
  return api.get('/reviews/due-count');
}

export function submitReview(id, quality, elapsedMs) {
  return api.post(`/reviews/${id}/submit`, { quality, elapsedMs });
}

export function getReviewStats() {
  return api.get('/reviews/stats');
}

// ============================================================
// AI Tutor — AI 导师对话记录
// ============================================================
export function getAiTutorDialogue(goalId, limit = 50) {
  const query = new URLSearchParams();
  if (goalId) query.set('goalId', goalId);
  if (limit) query.set('limit', String(limit));
  return api.get(`/ai/tutor/dialogue?${query.toString()}`);
}

export function saveAiTutorDialogue(data) {
  return api.post('/ai/tutor/dialogue', data);
}

// ============================================================
// Reports — 学习报表 + XP
// ============================================================
export function getReportSummary() {
  return api.get('/reports/summary');
}

export function getXpHistory(page = 1, pageSize = 20) {
  return api.get(`/reports/xp-history?page=${page}&pageSize=${pageSize}`);
}