import { Injectable, Logger } from '@nestjs/common';
import { SceneType } from './dto/gateway-request.dto';

/**
 * 降级兜底机制
 * Step 9-12 中的兜底路径：所有异常场景返回预设静态兜底内容
 *
 * 触发场景：
 * - 模型故障
 * - 用户超额
 * - 审核不通过
 * - 系统熔断
 * - 任何不可恢复的错误
 */
@Injectable()
export class FallbackService {
  private readonly logger = new Logger(FallbackService.name);

  // 静态兜底内容库
  private readonly fallbackContent: Record<string, string> = {
    // 通用兜底
    default: '抱歉，系统当前繁忙，请稍后再试。',

    // 学习类兜底
    exercise_generation: JSON.stringify({
      exercises: [
        {
          id: 'fallback_001',
          type: 'choice',
          question: '请选择正确的答案。',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'A',
          explanation: '系统暂时无法生成新题目，请稍后再试。',
          knowledgePoint: 'general',
          difficulty: 1,
        },
      ],
    }),
    course_generation: '## 学习内容\n\n系统暂时无法生成新课程内容，请稍后再试。\n\n您可以先复习已学内容或进行练习。',
    assessment: JSON.stringify({
      message: '系统暂时无法生成新的测评，请稍后再试。',
      suggestedAction: 'review_previous',
    }),

    // 陪伴类兜底
    chat: '你好！我现在有点忙，请稍等一下再和我聊天吧~',
    encouragement: '继续加油！你在学习路上已经很棒了！',
    error_correction: '你的表达已经很接近了！稍微休息一下，等会儿我们再一起看看怎么改进。',
    storytelling: '从前有一个热爱学习的小伙伴...系统暂时无法生成新故事，请稍后再试。',

    // 工具类兜底
    translation: '翻译服务暂时不可用，请稍后再试。',
    explanation: '系统暂时无法提供详细解释，请稍后再试。',
  };

  /**
   * 获取兜底内容
   */
  getFallback(scene: SceneType, reason: string): { content: string; isFallback: true; reason: string } {
    this.logger.warn(`[Fallback] Activated for scene=${scene}, reason=${reason}`);

    const content = this.fallbackContent[scene] || this.fallbackContent.default;

    return {
      content,
      isFallback: true,
      reason,
    };
  }

  /**
   * 获取鼓励性兜底（用于非关键场景）
   */
  getEncouragingFallback(): string {
    const encouragements = [
      '别担心，系统正在努力恢复中，请稍等一下~',
      '学习之路不怕暂停，等一下我们继续！',
      '系统正在充电中，马上就好！',
    ];
    return encouragements[Math.floor(Math.random() * encouragements.length)];
  }
}
