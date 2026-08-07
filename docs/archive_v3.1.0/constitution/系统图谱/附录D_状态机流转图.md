# 附录 D：用户/学习双状态机完整流转图

> 关联宪法：AILOS Core Constitution v3.0 第 3 章 GlobalStateMachine

## D.1 UserLifecycle 用户生命周期状态机

```mermaid
stateDiagram-v2
    [*] --> GuestVisiting: 访客浏览
    GuestVisiting --> Registered: 注册成功
    Registered --> ProfileFilling: 完善基础资料
    ProfileFilling --> LanguageConfig: 三维语言配置
    LanguageConfig --> InterestCollecting: 兴趣/目标/时长采集
    InterestCollecting --> PlacementTesting: 定级测试
    PlacementTesting --> PlanGenerating: 生成30天学习计划
    PlanGenerating --> CompanionCreating: 创建AI搭子
    CompanionCreating --> DailyLearning: 每日五阶段学习
    DailyLearning --> LevelUpgrade: 阶段测评升级
    LevelUpgrade --> DailyLearning: 进入下一等级
    DailyLearning --> Paused: 暂停学习
    Paused --> DailyLearning: 恢复学习

    note right of LanguageConfig
        禁止跳过此状态
        Core OS 状态机强制拦截
    end note

    note right of PlacementTesting
        LanguageGuard 校验
        题目语言=target_lang
    end note
```

## D.2 DailyLearning 每日学习五阶段状态机

```mermaid
stateDiagram-v2
    [*] --> PhaseReview: 每日开始
    PhaseReview --> PhaseVocab: 复习完成（15%时长）
    PhaseVocab --> PhaseSpeaking: 新词完成（35%时长）
    PhaseSpeaking --> PhaseGame: AI口语完成（15%时长）
    PhaseGame --> PhaseSummary: 学习游戏完成（20%时长）
    PhaseSummary --> [*]: 当日总结完成（15%时长）

    note right of PhaseReview
        昨日错题+重点词汇
        不可跳过，时长不可压缩
    end note

    note right of PhaseVocab
        按兴趣标签生成新词
        5-8个核心词汇
    end note
```

## D.3 状态变更唯一通道

```
前端 → CoreOS.sendCommand(StateTransitionCommand) → StateMachine.validate() → 合法？→ 切换状态
                                                                              → 不合法？→ 返回 9001 拦截
```

---

> **附录 D 版本**: v1.0 | **归档路径**: AILOS_指令中心/系统图谱/附录D_状态机流转图.md
