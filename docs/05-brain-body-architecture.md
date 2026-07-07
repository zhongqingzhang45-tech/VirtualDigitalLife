# Brain-Body 分层架构设计

> **版本**: v1.0
> **阶段**: Phase 3 — 数字生命引擎
> **状态**: 🟠 In Progress
> **最后更新**: 2026-07-08

---

## 一、核心思想

### 1.1 设计隐喻

> 数字生命 = 大脑（Brain）+ 身体（Body）
>
> - **Brain**：思考、感知、决策、记忆、情感、目标
> - **Body**：视觉呈现、语音表达、动作表情、交互输入
>
> Brain 决定"想什么、做什么"，Body 决定"怎么表现出来"。

### 1.2 为什么这样分层

| 原则 | 说明 |
|------|------|
| **复用 AIRI** | AIRI 已经有成熟的 Live2D / Spine / 语音 / 对话运行时，完全复用为 Body 层 |
| **关注点分离** | 认知决策与表现执行分离，各自可以独立迭代 |
| **可替换性** | Body 层可以换不同的表现形式（Live2D / Spine / 纯文字 / 3D） |
| **可测试性** | Brain 可以在没有 Body 的情况下做纯逻辑测试 |
| **多端复用** | 同一个 Brain 可以驱动不同端的 Body（Web / 桌面 / 移动端 / VR） |

---

## 二、整体架构

### 2.1 分层图

```
┌─────────────────────────────────────────────────────────────┐
│                    LifeOS Social 产品层                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              LifeOS Brain（大脑层）                    │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │  │
│  │  │Emotion  │  │  Goal   │  │  Memory │              │  │
│  │  │ Engine  │  │ Engine  │  │ Engine  │              │  │
│  │  └────┬────┘  └────┬────┘  └────┬────┘              │  │
│  │       └─────────────┼──────────────┘                 │  │
│  │                     ▼                                │  │
│  │  ┌──────────────────────────────────┐                │  │
│  │  │    Behavior Scheduler（调度器）    │                │  │
│  │  │  优先级 / 冷却 / 预算 / 决策       │                │  │
│  │  └───────────────┬──────────────────┘                │  │
│  │                  │                                   │  │
│  │  ┌───────────────▼──────────────────┐                │  │
│  │  │    Personality Engine（人格）     │                │  │
│  │  └───────────────┬──────────────────┘                │  │
│  │                  ▼                                   │  │
│  │  ┌──────────────────────────────────┐                │  │
│  │  │       Brain Event Bus            │                │  │
│  │  │  （Domain 事件总线）              │                │  │
│  │  └───────────────┬──────────────────┘                │  │
│  └──────────────────┼───────────────────────────────────┘  │
│                     │ 适配层（Brain-Body Adapter）          │
│                     ▼                                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               AIRI Body（身体层）                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │  Chat    │  │  Speech  │  │  Visual  │           │  │
│  │  │Runtime   │  │Pipeline  │  │ Avatar   │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │ Live2D   │  │  Spine   │  │   VRM    │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 各层职责

| 层级 | 模块 | 职责 | 来源 |
|------|------|------|------|
| **Brain 层** | Personality Engine | 人格参数、性格演化、Prompt 编译 | LifeOS（Phase 2 已设计） |
| | Emotion Engine | 情绪状态、情绪触发、情绪衰减 | LifeOS（Phase 3） |
| | Goal Engine | 目标体系、目标状态机、目标生成 | LifeOS（Phase 3） |
| | Memory Engine | 记忆存储、检索、压缩、巩固 | LifeOS（Phase 5） |
| | Relationship Engine | 关系模型、亲密度、关系状态 | LifeOS（Phase 3） |
| | Behavior Scheduler | 行为调度、优先级、冷却、预算 | LifeOS（Phase 3） |
| | Brain Event Bus | Domain 间事件通信 | LifeOS |
| **适配层** | Brain-Body Adapter | 大脑指令 → 身体动作的翻译层 | LifeOS |
| **Body 层** | Chat Runtime | 对话运行时、消息流、上下文管理 | AIRI（core-agent） |
| | Speech Pipeline | 语音合成、播放队列、优先级、中断 | AIRI（pipelines-audio） |
| | Visual Avatar | 视觉形象、表情、动作 | AIRI（stage-ui-live2d/spine） |
| | Live2D / Spine / VRM | 具体渲染引擎 | AIRI |

---

## 三、Brain-Body 适配层

### 3.1 适配层定位

适配层（Adapter）是 Brain 与 Body 之间的**翻译官**，负责：
1. 将 Brain 的**决策指令**翻译成 Body 能理解的**动作指令**
2. 将 Body 的**感知输入**翻译成 Brain 能理解的**事件信号**
3. 屏蔽 Body 层的具体实现差异（换 Live2D 还是 Spine 不影响 Brain）

### 3.2 接口定义

```typescript
interface BrainBodyAdapter {
  // === Brain → Body：动作指令 ===

  /**
   * 让角色说一句话（走语音 + 口型 + 表情）
   */
  speak(params: SpeakParams): Promise<SpeakResult>;

  /**
   * 设置当前情绪（影响表情、动作、语气）
   */
  setEmotion(emotion: EmotionState): void;

  /**
   * 触发一个表情动作
   */
  triggerExpression(expression: string, duration?: number): void;

  /**
   * 触发一个全身动作
   */
  triggerMotion(motion: string, layer?: string): void;

  /**
   * 显示/隐藏角色
   */
  setVisibility(visible: boolean): void;

  /**
   * 打断当前正在进行的所有表现
   */
  interrupt(reason?: string): void;

  // === Body → Brain：感知输入 ===

  /**
   * 用户发送了一条消息
   */
  onUserMessage(callback: (msg: UserMessage) => void): void;

  /**
   * 用户点击/触摸了角色
   */
  onUserInteraction(callback: (interaction: UserInteraction) => void): void;

  /**
   * 语音播放开始/结束
   */
  onSpeechEvent(callback: (event: SpeechEvent) => void): void;

  /**
   * 动画播放结束
   */
  onMotionEnd(callback: (motion: string) => void): void;
}
```

### 3.3 指令翻译规则

#### 情绪 → 表现映射

| Brain 情绪维度 | Body 表现参数 |
|---------------|--------------|
| 效价（正负） | 表情基调（微笑 / 皱眉 / 平静） |
| 唤醒度（高低） | 动作幅度、语速、音量 |
| 主导情绪标签 | 特定表情 / 动作 / 语音风格 |

示例：
- 情绪 = 开心（高效价+高唤醒）→ Body：微笑表情 + 轻快动作 + 音调上扬 + 语速稍快
- 情绪 = 悲伤（低效价+低唤醒）→ Body：低垂表情 + 缓慢动作 + 低沉语调 + 语速放慢

#### 说话指令翻译

Brain 输出的 `speak(text, emotion, style)` → Body 执行：
1. Speech Pipeline：TTS 合成（携带情绪/风格参数）→ 播放队列
2. Visual Avatar：同步口型 + 对应情绪表情 + 辅助手势
3. Chat UI：消息气泡显示

---

## 四、事件流

### 4.1 一次对话的完整事件流

```
用户输入消息
    │
    ▼
Body（Chat Runtime）接收
    │
    ▼
Adapter 翻译为 user.message.received 事件
    │
    ▼
Brain Event Bus
    │
    ├─→ Emotion Engine：根据消息内容更新情绪
    ├─→ Memory Engine：存入短期记忆
    ├─→ Relationship Engine：更新亲密度（根据互动质量）
    └─→ Behavior Scheduler：评估响应策略
              │
              ▼
         决策：生成回复
              │
              ├─ 调用 Personality Engine：调整语气/风格
              ├─ 调用 Goal Engine：检查是否推进目标
              └─ 构造回复内容 + 情绪状态
              │
              ▼
Adapter 翻译为 Body 动作指令
    │
    ├─→ Chat Runtime：发送消息
    ├─→ Speech Pipeline：TTS 合成 + 播放
    └─→ Visual Avatar：表情 + 动作 + 口型同步
```

### 4.2 自主行为触发流

```
Scheduler 定时 tick
    │
    ▼
收集各 Engine 的行为提议
    │
    ├─ Emotion Engine：情绪需要释放（太无聊了想说话）
    ├─ Goal Engine：目标需要推进
    └─ Relationship Engine：太久没互动了想刷存在感
    │
    ▼
优先级排序 + 冷却检查 + 预算检查
    │
    ▼
选中一个行为执行
    │
    ▼
Adapter → Body 表现
```

---

## 五、AIRI Body 能力清单

### 5.1 已确认的 AIRI 能力

| 能力模块 | AIRI 包 | 能力说明 |
|---------|---------|---------|
| **Chat Runtime** | `@proj-airi/core-agent` | ChatOrchestratorRuntime、ContextRegistry、ResponseCategoriser |
| **语音流水线** | `@proj-airi/pipelines-audio` | SpeechPipeline、优先级队列、TTS 请求、播放控制、中断机制 |
| **Live2D 渲染** | `@proj-airi/stage-ui-live2d` | Live2D 组件、composable、store |
| **Spine 渲染** | `@proj-airi/stage-ui-spine` | Spine 动画组件 |
| **角色管理** | `@proj-airi/stage-ui` | Character store / service / model |
| **CCC 标准** | `@proj-airi/ccc` | Character Card V3 标准支持 |

### 5.2 Body 层抽象接口

不管底层用什么渲染引擎，Body 层对 Brain 暴露统一接口：

```typescript
interface BodyInterface {
  // 语音
  speak(text: string, options?: SpeakOptions): PlaybackHandle;
  stopSpeech(): void;

  // 视觉
  setExpression(expression: string): void;
  playMotion(motion: string, options?: MotionOptions): void;
  setMood(mood: string): void;

  // 对话
  sendMessage(content: string): void;
  showTypingIndicator(): void;
  hideTypingIndicator(): void;

  // 生命周期
  mount(): void;
  unmount(): void;
}
```

---

## 六、Domain 归属

### 6.1 Brain 层 Domain 划分

| Domain | 职责 | 对应 Engine |
|--------|------|------------|
| **Personality** | 人格特征、说话风格、性格演化 | PersonalityEngine |
| **Emotion** | 情绪状态、情绪触发、情绪衰减、情绪记忆 | EmotionEngine |
| **Goal** | 目标体系、目标状态机、目标生成与评估 | GoalEngine |
| **Memory** | 记忆存储、检索、压缩、巩固 | MemoryEngine |
| **Behavior** | 行为调度、优先级、冷却、预算、决策 | Scheduler |
| **Relationship** | 关系模型、亲密度、关系阶段 | RelationshipEngine |
| **Timeline** | 时间感知、生命时间线、事件记录 | TimelineEngine |
| **Narrative** | 剧情生成、叙事弧、角色成长故事 | NarrativeEngine |

### 6.2 Body 层归属

Body 层 **不作为独立 Domain**，而是作为 Infrastructure 层的实现。
- Domain 层定义 `BodyInterface`（端口）
- Infrastructure 层用 AIRI 实现 `AiriBodyAdapter`（适配器）

---

## 七、技术实现路径

### 7.1 实现顺序

```
Phase 3：引擎骨架
    ├─ 定义 BaseEngine 接口 + 事件总线
    ├─ Emotion Domain 初版
    ├─ Goal Domain 初版
    ├─ Relationship Domain 初版
    └─ Behavior Scheduler 初版

Phase 5：Memory 系统
    └─ Memory Engine 实现

Phase 4：社区系统
    └─ WorldState / Narrative / Timeline 扩展

后续：逐步完善
    └─ 每个 Engine 逐步深化能力
```

### 7.2 技术栈

- **语言**：TypeScript Strict
- **架构模式**：DDD + 事件驱动 + 端口-适配器（Hexagonal）
- **引擎实现**：Class-based，实现 `BaseEngine` 接口
- **事件总线**：轻量级事件发射器（可用 mitt / nanobus）
- **状态管理**：引擎内部状态，不依赖 UI Store

---

## 相关文档

- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构总览
- [02-角色系统设计.md](file:///workspace/docs/02-角色系统设计.md) — 角色系统（Personality）
- [03-personality-domain.md](file:///workspace/docs/03-personality-domain.md) — Personality Domain
- [05-emotion-domain.md](file:///workspace/docs/05-emotion-domain.md) — Emotion Domain
- [06-goal-domain.md](file:///workspace/docs/06-goal-domain.md) — Goal Domain
- [07-relationship-domain.md](file:///workspace/docs/07-relationship-domain.md) — Relationship Domain
- [08-engine-framework.md](file:///workspace/docs/08-engine-framework.md) — Engine 框架与调度
- [decision-log.md](file:///workspace/docs/decision-log.md) — ADR 决策记录
- [development-rules.md](file:///workspace/docs/development-rules.md) — 开发规范
