import { Injectable, Logger } from '@nestjs/common';
import { GatewayRequest, SceneType } from './dto/gateway-request.dto';

/**
 * Prompt 统一注入模块
 * Step 7: 从全局 Prompt 库加载对应版本 Prompt，注入结构化参数
 *
 * 核心原则：
 * 1. AI Gateway 为最终 Prompt 唯一组装方
 * 2. 业务层只能传结构化参数，禁止传入完整 Prompt
 * 3. 所有 Prompt 版本化、可审计、可灰度
 * 4. 禁止在业务代码中硬编码超过20个连续字符的指令性文本
 */
@Injectable()
export class PromptInjectionService {
  private readonly logger = new Logger(PromptInjectionService.name);

  // Prompt 库（版本化）
  private promptLibrary: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initializePromptLibrary();
  }

  /**
   * 初始化 Prompt 库
   */
  private initializePromptLibrary(): void {
    // ===== 通用 Prompt =====
    this.registerPrompt('translation', '1.0.0', {
      system: '你是一个专业的翻译助手。请准确翻译以下内容，保持原意不变。',
      template: '将以下{source_lang}文本翻译成{target_lang}：\n\n{text}',
      outputFormat: '仅返回翻译结果，不要加任何解释。',
    });

    this.registerPrompt('explanation', '1.0.0', {
      system: '你是一个耐心的知识讲解者。请用简洁清晰的语言解释概念。',
      template: '请解释{domain}领域中的概念：{concept}\n\n要求：\n- 难度等级：{level}\n- 语言：{language}',
      outputFormat: '使用简洁的语言，适合{level}水平的学习者。',
    });

    // ===== 学习类 Prompt =====
    this.registerPrompt('exercise_generation', '1.0.0', {
      system: '你是一个专业的语言教育内容生成专家。请根据指定的知识点和难度生成练习题。',
      template: `请为{domain}生成{exercise_count}道{exercise_type}练习题。

知识点：{knowledge_points}
难度等级：{difficulty}（1-5）
目标语言：{target_language}
用户当前等级：{user_level}

要求：
1. 题目应覆盖指定的知识点
2. 难度应匹配指定的等级
3. 每道题包含题目、选项（选择题）、正确答案和解析
4. 内容必须原创，不得抄袭现有教材`,
      outputFormat: `返回JSON格式：
{
  "exercises": [
    {
      "id": "唯一标识",
      "type": "题型",
      "question": "题目内容",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "correctAnswer": "正确答案",
      "explanation": "解析",
      "knowledgePoint": "对应知识点",
      "difficulty": 难度等级
    }
  ]
}`,
    });

    this.registerPrompt('course_generation', '1.0.0', {
      system: '你是一个专业的课程设计专家。请根据学习目标和用户水平生成个性化的学习内容。',
      template: `请为{domain}生成一个学习单元的内容。

学习主题：{topic}
目标等级：{target_level}
用户当前水平：{user_level}
学习风格偏好：{learning_style}
内容语言：{language}

请生成：
1. 核心知识点讲解（3-5个要点）
2. 配套例句/示例（每个知识点2-3个）
3. 关键语法/规则说明
4. 常见错误提醒`,
      outputFormat: '返回结构化的学习内容，标题清晰，分段明确。',
    });

    this.registerPrompt('assessment', '1.0.0', {
      system: '你是一个专业的语言能力测评专家。请根据用户水平生成测评内容。',
      template: `请为{domain}生成一份能力测评。

测评类型：{assessment_type}
目标等级范围：{level_range}
测评维度：{dimensions}
题目数量：{question_count}
语言：{language}

要求：
1. 题目难度应覆盖目标等级范围
2. 涵盖所有测评维度
3. 能够准确评估用户当前水平
4. 包含评分标准和等级判定规则`,
      outputFormat: '返回结构化的测评内容，包含题目和评分标准。',
    });

    // ===== 陪伴类 Prompt =====
    this.registerPrompt('chat', '1.0.0', {
      system:
        '你是{companion_name}，一个{companion_personality}的AI学习伙伴。你的口头禅是：{catchphrase}。请用温暖、鼓励的语气与用户交流。',
      template: '用户说：{user_message}\n\n请以{companion_name}的身份回复，注意保持你的性格特点。',
      outputFormat: '自然对话回复，不要超过200字。',
    });

    this.registerPrompt('encouragement', '1.0.0', {
      system: '你是一个温暖的鼓励者。',
      template: '用户刚刚完成了{activity}，表现{performance}。请给予鼓励。',
      outputFormat: '简短温暖的鼓励话语，不超过100字。',
    });

    this.registerPrompt('error_correction', '1.0.0', {
      system: '你是一个耐心的语言纠错老师。请温和地指出错误并给出正确的表达。',
      template: `用户的原句：{user_sentence}
目标语言：{target_language}
正确表达应为：{correct_sentence}（如果已知）

请分析错误类型并给出改进建议。`,
      outputFormat: '先肯定用户的努力，再温和地指出错误，最后给出正确的表达。',
    });

    this.registerPrompt('storytelling', '1.0.0', {
      system: '你是一个创意故事讲述者。请根据指定主题生成有趣的学习故事。',
      template: `请为{domain}学习者生成一个{story_type}。

主题：{theme}
目标语言：{target_language}
难度等级：{level}
故事长度：{length}

要求：
1. 融入目标语言的知识点
2. 故事有趣、有教育意义
3. 语言难度适合学习者水平`,
      outputFormat: '返回完整的故事文本。',
    });

    // ===== 系统级 Prompt =====
    this.registerPrompt('safety', '1.0.0', {
      system: '你是一个安全内容过滤器。请检查以下内容是否包含不当信息。',
      template: '检查内容：{content}\n\n检查维度：暴力、色情、仇恨言论、违法违规、个人隐私',
      outputFormat: '返回JSON：{"safe": true/false, "issues": []}',
    });

    this.registerPrompt('fallback', '1.0.0', {
      system: '系统当前繁忙。',
      template: '',
      outputFormat: '抱歉，系统当前繁忙，请稍后再试。',
    });
  }

  /**
   * 注册 Prompt
   */
  private registerPrompt(scene: string, version: string, template: PromptTemplate): void {
    const key = `${scene}:v${version}`;
    this.promptLibrary.set(key, template);
  }

  /**
   * Step 7: 组装最终 Prompt
   */
  assemble(request: GatewayRequest): string | null {
    const scene = request.scene;
    const promptKey = `${scene}:v1.0.0`;

    const prompt = this.promptLibrary.get(promptKey);
    if (!prompt) {
      this.logger.warn(`[Prompt] No template found for scene: ${scene}`);
      return null;
    }

    // 组装 System Prompt
    let systemPrompt = prompt.system;
    // 注入变量
    systemPrompt = this.injectVariables(systemPrompt, request.structuredParams);

    // 组装 User Prompt
    let userPrompt = prompt.template;
    userPrompt = this.injectVariables(userPrompt, request.structuredParams);

    // 添加输出格式
    const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}\n\n---\n\n${prompt.outputFormat}`;

    this.logger.debug(`[Prompt] Assembled for scene=${scene}, length=${fullPrompt.length}`);

    return fullPrompt;
  }

  /**
   * 注入结构化参数到 Prompt 模板
   */
  private injectVariables(template: string, params: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(params)) {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value ?? ''));
    }
    return result;
  }

  /**
   * 获取 Prompt 版本信息
   */
  getPromptVersion(scene: string): string {
    return `v1.0.0`;
  }

  /**
   * 灰度更新 Prompt
   */
  updatePrompt(scene: string, version: string, template: PromptTemplate): void {
    this.registerPrompt(scene, version, template);
    this.logger.log(`[Prompt] Updated: ${scene} -> v${version}`);
  }
}

interface PromptTemplate {
  system: string;
  template: string;
  outputFormat: string;
}
