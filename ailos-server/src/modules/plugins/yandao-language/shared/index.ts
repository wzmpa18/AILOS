/**
 * 言道·多语言插件 - 统一导出
 */
export { japanesePlugin } from '../japanese';
export { englishPlugin } from '../english';
export { koreanPlugin } from '../korean';
export { spanishPlugin } from '../spanish';
export { germanPlugin } from '../german';

export const yandaoLanguages = ['japanese', 'english', 'korean', 'spanish', 'german'];

export const yandaoPluginRegistry = {
  japanese: () => import('../japanese'),
  english: () => import('../english'),
  korean: () => import('../korean'),
  spanish: () => import('../spanish'),
  german: () => import('../german'),
};
