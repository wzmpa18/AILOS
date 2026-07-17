import { Injectable, Logger } from '@nestjs/common';
import { GatewayRequest, SceneType } from './dto/gateway-request.dto';

/**
 * 模板生成引擎
 * Step 5: 标准化场景通过模板+变量拼接生成内容，不调用大模型
 *
 * 模板命中规则：
 * 1. 翻译类：直接拼接词典
 * 2. 简单问候：预设模板
 * 3. 标准化练习：填空/选择模板
 * 4. 鼓励话术：预设随机池
 */
@Injectable()
export class TemplateEngineService {
  private readonly logger = new Logger(TemplateEngineService.name);

  // 模板适用范围
  private readonly TEMPLATABLE_SCENES: SceneType[] = [
    SceneType.TRANSLATION,
    SceneType.ENCOURAGEMENT,
    SceneType.EXPLANATION,
  ];

  // 鼓励话术模板池
  private readonly encouragementTemplates = [
    '加油！你已经做得很棒了，继续坚持！',
    '每一次努力都在让你变得更好，相信自己！',
    '学习是一个过程，不必急于求成，你已经进步很多了！',
    '错误是成长的阶梯，不要害怕犯错，继续前进！',
    '你今天的学习状态非常好，保持下去！',
    '看到你的进步，我真的很开心！继续加油！',
  ];

  // 翻译模板（简单词句）
  private readonly translationTemplates: Record<string, Record<string, string>> = {
    hello: { 'zh-CN': '你好', en: 'Hello', ja: 'こんにちは', ko: '안녕하세요', es: 'Hola', de: 'Hallo' },
    goodbye: {
      'zh-CN': '再见',
      en: 'Goodbye',
      ja: 'さようなら',
      ko: '안녕히 가세요',
      es: 'Adiós',
      de: 'Auf Wiedersehen',
    },
    thank_you: { 'zh-CN': '谢谢', en: 'Thank you', ja: 'ありがとう', ko: '감사합니다', es: 'Gracias', de: 'Danke' },
    yes: { 'zh-CN': '是', en: 'Yes', ja: 'はい', ko: '네', es: 'Sí', de: 'Ja' },
    no: { 'zh-CN': '不是', en: 'No', ja: 'いいえ', ko: '아니요', es: 'No', de: 'Nein' },
    sorry: {
      'zh-CN': '对不起',
      en: 'Sorry',
      ja: 'ごめんなさい',
      ko: '미안합니다',
      es: 'Lo siento',
      de: 'Entschuldigung',
    },
    please: { 'zh-CN': '请', en: 'Please', ja: 'お願いします', ko: '제발', es: 'Por favor', de: 'Bitte' },
    good_morning: {
      'zh-CN': '早上好',
      en: 'Good morning',
      ja: 'おはようございます',
      ko: '좋은 아침입니다',
      es: 'Buenos días',
      de: 'Guten Morgen',
    },
    good_night: {
      'zh-CN': '晚安',
      en: 'Good night',
      ja: 'おやすみなさい',
      ko: '잘 자요',
      es: 'Buenas noches',
      de: 'Gute Nacht',
    },
    how_are_you: {
      'zh-CN': '你好吗',
      en: 'How are you',
      ja: 'お元気ですか',
      ko: '잘 지내세요',
      es: '¿Cómo estás?',
      de: 'Wie geht es Ihnen?',
    },
    my_name_is: {
      'zh-CN': '我的名字是',
      en: 'My name is',
      ja: '私の名前は',
      ko: '제 이름은',
      es: 'Mi nombre es',
      de: 'Mein Name ist',
    },
    i_love_you: {
      'zh-CN': '我爱你',
      en: 'I love you',
      ja: '愛してる',
      ko: '사랑해요',
      es: 'Te quiero',
      de: 'Ich liebe dich',
    },
    delicious: { 'zh-CN': '好吃', en: 'Delicious', ja: '美味しい', ko: '맛있어요', es: 'Delicioso', de: 'Lecker' },
    beautiful: { 'zh-CN': '漂亮', en: 'Beautiful', ja: '綺麗', ko: '아름다워요', es: 'Hermoso', de: 'Wunderschön' },
    help: { 'zh-CN': '帮助', en: 'Help', ja: '助けて', ko: '도와주세요', es: 'Ayuda', de: 'Hilfe' },
  };

  /**
   * 判断是否可模板化
   */
  isTemplatable(scene: SceneType): boolean {
    return this.TEMPLATABLE_SCENES.includes(scene);
  }

  /**
   * 尝试模板生成
   * 返回生成内容，如果不可模板化则返回 null
   */
  tryGenerate(request: GatewayRequest): string | null {
    switch (request.scene) {
      case SceneType.TRANSLATION:
        return this.generateTranslation(request);
      case SceneType.ENCOURAGEMENT:
        return this.generateEncouragement();
      case SceneType.EXPLANATION:
        return this.generateExplanation(request);
      default:
        return null;
    }
  }

  /**
   * 翻译模板生成
   */
  private generateTranslation(request: GatewayRequest): string | null {
    const { word, sourceLang, targetLang } = request.structuredParams;
    if (!word) return null;

    const normalizedWord = String(word).toLowerCase().replace(/\s+/g, '_');
    const template = this.translationTemplates[normalizedWord];
    if (template && targetLang && template[targetLang]) {
      this.logger.debug(`[Template] Translation hit: ${word} -> ${targetLang}`);
      return template[targetLang];
    }

    return null; // 不在模板库中，需要走模型
  }

  /**
   * 鼓励话术生成
   */
  private generateEncouragement(): string {
    const idx = Math.floor(Math.random() * this.encouragementTemplates.length);
    const template = this.encouragementTemplates[idx];
    this.logger.debug(`[Template] Encouragement generated`);
    return template;
  }

  /**
   * 简单解释生成
   */
  private generateExplanation(request: GatewayRequest): string | null {
    const { concept, domain } = request.structuredParams;
    if (!concept) return null;

    // 简单概念解释模板（仅用于非常基础的概念）
    const basicExplanations: Record<string, string> = {
      noun: '名词是表示人、事物、地点或抽象概念的名称的词。',
      verb: '动词是表示动作、状态或过程的词。',
      adjective: '形容词是描述名词性质或状态的词。',
      adverb: '副词是修饰动词、形容词或其他副词的词。',
      sentence: '句子是由词或词组构成的、能够表达完整意思的语言单位。',
    };

    const key = String(concept).toLowerCase();
    if (basicExplanations[key]) {
      this.logger.debug(`[Template] Explanation hit: ${concept}`);
      return basicExplanations[key];
    }

    return null;
  }
}
