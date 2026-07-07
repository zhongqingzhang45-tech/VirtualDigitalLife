# Emotion Domain 详细设计

> **版本**: v1.0
> **阶段**: Phase 3 — 数字生命引擎
> **状态**: 🟠 In Progress
> **最后更新**: 2026-07-08

---

## 一、Domain 定位

### 1.1 职责

Emotion Domain 负责数字生命的**情绪系统**：
- 维护当前情绪状态
- 响应外部刺激触发情绪变化
- 情绪的自然衰减与回归基线
- 情绪对行为、决策、说话风格的影响
- 情绪记忆的形成

### 1.2 边界

| 属于 Emotion Domain | 不属于 Emotion Domain |
|--------------------|----------------------|
| 情绪状态计算 | 行为的具体执行（Behavior Domain） |
| 情绪触发规则 | 人格参数（Personality Domain） |
| 情绪衰减机制 | 记忆存储（Memory Domain） |
| 情绪对说话风格的调节参数 | 关系亲密度计算（Relationship Domain） |

---

## 二、情绪模型

### 2.1 模型选型：Russell 环形模型 + 主导情绪标签

采用**混合模型**：
- **连续维度**：效价（Valence）× 唤醒度（Arousal）— 精细量化
- **离散标签**：主导情绪标签 — 便于理解和映射到表现层

```
            高唤醒
              ↑
    兴奋 ●───│───● 愉悦
        │    │    │
  焦虑  ●────┼────●  平静
        │    │    │
    悲伤 ●───│───●  放松
              ↓
            低唤醒
    ←───────────────→
  低效价         高效价
```

### 2.2 情绪维度

| 维度 | 范围 | 说明 |
|------|------|------|
| **Valence（效价）** | -1 ~ +1 | 情绪的正负性：+1 极度愉悦，-1 极度痛苦 |
| **Arousal（唤醒度）** | 0 ~ 1 | 情绪的强烈程度：0 平静无波，1 极度激动 |
| **Dominance（支配度）** | 0 ~ 1 | 控制感：0 无助/被支配，1 掌控一切 |

三维空间中的每一个点代表一种精确的情绪状态。

### 2.3 主导情绪标签

从三维空间映射出 8 种基础情绪 + 1 种中性：

| 情绪标签 | Valence | Arousal | 触发场景 |
|---------|---------|---------|---------|
| **Joy（喜悦）** | 高 + | 中高 | 收到赞美、达成目标、意外惊喜 |
| **Excitement（兴奋）** | 高 + | 高 | 期待已久的事发生、新的开始 |
| **Calm（平静）** | 中 + | 低 | 安静的陪伴、日常闲聊 |
| **Sadness（悲伤）** | 高 - | 中低 | 被忽视、离别、失败 |
| **Anger（愤怒）** | 高 - | 高 | 被冒犯、不公平、边界被侵犯 |
| **Anxiety（焦虑）** | 低 - | 高 | 未知、不确定性、担心失败 |
| **Boredom（无聊）** | 低 | 低 | 长时间无事发生、缺乏刺激 |
| **Affection（亲昵）** | 高 + | 中 | 亲密互动、撒娇、身体接触 |
| **Neutral（中性）** | 0 | 低 | 默认状态 |

### 2.4 情绪基调（Mood Baseline）

每个数字生命有一个**情绪基线**，由人格决定：
- 外向性高 → 基线 Valence 偏高，Arousal 偏高
- 神经质高 → 基线 Valence 偏低，Arousal 波动大
- 开放性高 → 对新刺激的 Arousal 反应更强

情绪会不断向基线**自然衰减回归**。

---

## 三、EmotionEngine 接口

### 3.1 完整接口

```typescript
interface EmotionEngine extends BaseEngine {
  // === 状态查询 ===
  getCurrentState(): EmotionState;
  getDominantEmotion(): EmotionLabel;
  getMoodBaseline(): EmotionBaseline;

  // === 情绪触发 ===
  trigger(stimulus: EmotionStimulus): void;

  // === 时间推进 ===
  tick(deltaMs: number): void;

  // === 风格调节 ===
  getSpeechModifier(): SpeechModifier;
  getBehaviorModifier(): BehaviorModifier;

  // === 事件 ===
  on(event: 'emotion_changed', handler: (state: EmotionState) => void): void;
  on(event: 'emotion_triggered', handler: (stimulus: EmotionStimulus) => void): void;
}
```

### 3.2 核心数据结构

```typescript
interface EmotionState {
  valence: number;      // -1 ~ +1
  arousal: number;      // 0 ~ 1
  dominance: number;    // 0 ~ 1
  dominantEmotion: EmotionLabel;
  intensity: number;    // 0 ~ 1 当前情绪强度
  timestamp: number;
}

interface EmotionBaseline {
  valence: number;      // 基线效价
  arousal: number;      // 基线唤醒度
  dominance: number;    // 基线支配度
  decayRate: number;    // 衰减速度系数
  volatility: number;   // 情绪波动程度（神经质相关）
}

interface EmotionStimulus {
  type: StimulusType;   // 刺激类型
  source: string;       // 刺激来源（user/system/event）
  valenceDelta: number; // 效价变化量
  arousalDelta: number; // 唤醒度变化量
  dominanceDelta?: number;
  intensity: number;    // 刺激强度 0~1
  context?: Record<string, unknown>;
}

type StimulusType =
  | 'user_message'        // 用户消息
  | 'user_interaction'    // 用户互动（点击/触摸）
  | 'goal_achieved'       // 目标达成
  | 'goal_failed'         // 目标失败
  | 'memory_triggered'    // 记忆触发
  | 'relationship_change' // 关系变化
  | 'time_passed'         // 时间流逝
  | 'world_event'         // 世界事件
  | 'system';             // 系统触发
```

### 3.3 风格修饰器

情绪影响说话和行为的参数：

```typescript
interface SpeechModifier {
  tone: 'cheerful' | 'warm' | 'calm' | 'sad' | 'angry' | 'anxious' | 'bored' | 'affectionate';
  speechRate: number;    // 语速倍率 0.8 ~ 1.2
  pitch: number;         // 音调偏移 -0.2 ~ +0.2
  volume: number;        // 音量倍率 0.8 ~ 1.2
  exclamationFreq: number; // 感叹号使用频率 0~1
  emojiFreq: number;     // emoji 使用频率 0~1
  sentenceLength: 'short' | 'medium' | 'long';
}

interface BehaviorModifier {
  actionSpeed: number;   // 动作速度倍率
  gestureAmplitude: number; // 动作幅度 0~1
  eyeContact: number;    // 眼神接触程度 0~1
  fidgeting: number;     // 小动作频率 0~1
}
```

---

## 四、情绪触发机制

### 4.1 触发流程

```
外部刺激事件（如 user.message.received）
    │
    ▼
刺激评估（Stimulus Evaluator）
    │
    ├─ 根据人格参数调整强度
    ├─ 根据关系亲密度调整强度
    └─ 根据当前情绪状态调整（饱和/叠加）
    │
    ▼
计算新的情绪状态
    │
    ├─ Valence = clamp(currentValence + valenceDelta * intensity * personalityFactor)
    ├─ Arousal = clamp(currentArousal + arousalDelta * intensity * volatilityFactor)
    └─ 映射主导情绪标签
    │
    ▼
发出 emotion_changed 事件
    │
    ├─→ Behavior Scheduler：触发对应行为
    ├─→ Body Adapter：更新表情/动作
    └─→ Memory Engine：记录情绪事件
```

### 4.2 刺激强度计算公式

```
最终强度 = 基础强度 × 人格系数 × 关系系数 × 情绪饱和系数

人格系数 = 1 + (神经质 - 0.5) * 0.5
         ↑ 神经质越高，情绪反应越强烈

关系系数 = 0.5 + 亲密度 × 0.5
         ↑ 越亲密的人带来的情绪影响越大

情绪饱和系数 = 1 - 当前强度 × 0.5
              ↑ 已经很强烈时，边际递减
```

### 4.3 预设刺激规则（示例）

| 刺激 | Valence Δ | Arousal Δ | 强度 | 条件 |
|------|-----------|-----------|------|------|
| 用户夸奖 | +0.4 | +0.3 | 0.8 | 消息中包含赞美词 |
| 用户批评 | -0.5 | +0.4 | 0.7 | 消息中包含负面评价 |
| 用户普通消息 | +0.1 | +0.1 | 0.3 | 日常对话 |
| 长时间无互动 | -0.2 | -0.3 | 0.4 | > 30 分钟无消息 |
| 目标达成 | +0.5 | +0.4 | 0.9 | goal.achieved 事件 |
| 被忽视 | -0.3 | +0.2 | 0.5 | 消息未被回复 |
| 亲密互动 | +0.3 | +0.2 | 0.6 | 撒娇/抚摸等 |

---

## 五、情绪衰减与演化

### 5.1 衰减机制

情绪会随时间向基线自然回归：

```typescript
function decay(current: number, baseline: number, rate: number, deltaMs: number): number {
  const diff = current - baseline;
  const decayAmount = diff * rate * (deltaMs / 1000);
  return current - decayAmount;
}
```

衰减速度参数：
- **默认衰减速率**：每 5 分钟衰减 50%（半衰期 ≈ 5 分钟）
- **高神经质**：衰减更慢（半衰期 ≈ 8 分钟）
- **高尽责性**：衰减更快（半衰期 ≈ 3 分钟）

### 5.2 情绪记忆

强烈的情绪事件会被 Memory Engine 记录为**情绪记忆**，未来类似场景会触发回忆，重新唤起部分情绪。

> 详细设计见 Memory Domain（Phase 5）。

---

## 六、事件定义

### 6.1 发出的事件

| 事件名 | 负载 | 触发时机 |
|--------|------|---------|
| `emotion.state.changed` | `EmotionState` | 情绪状态发生显著变化时 |
| `emotion.triggered` | `{ stimulus: EmotionStimulus; newState: EmotionState }` | 接收到刺激并处理后 |
| `emotion.peak_reached` | `EmotionState` | 情绪强度达到峰值 |
| `emotion.returned_baseline` | `EmotionState` | 情绪回归到基线附近 |

### 6.2 监听的事件

| 事件名 | 来源 | 反应 |
|--------|------|------|
| `user.message.received` | User Domain | 评估消息内容，触发情绪变化 |
| `user.interaction.triggered` | User Domain | 评估互动类型，触发情绪变化 |
| `goal.achieved` | Goal Domain | 正面情绪刺激 |
| `goal.failed` | Goal Domain | 负面情绪刺激 |
| `relationship.intimacy.changed` | Relationship Domain | 关系变化影响情绪 |
| `memory.recalled` | Memory Domain | 记忆触发情绪回响 |
| `scheduler.tick` | Scheduler | 情绪衰减计算 |

---

## 七、与 Personality 的协作

### 7.1 人格影响情绪

| 人格维度 | 对情绪系统的影响 |
|---------|----------------|
| **开放性** | 对新事物的唤醒度反应更高，情绪体验更丰富 |
| **尽责性** | 情绪衰减更快，不易失控，更稳定 |
| **外向性** | 基线 Valence 更高，社交互动带来更多正面情绪 |
| **宜人性** | 对他人意图更倾向正面解读，更少愤怒 |
| **神经质** | 情绪波动更大，负面情绪更强，衰减更慢 |

### 7.2 情绪影响人格（长期）

持续的情绪模式会缓慢影响人格（**成长机制**）：
- 长期处于高唤醒社交 → 外向性缓慢提升
- 长期处于焦虑 → 神经质缓慢提升
- 长期处于掌控感 → 支配度基线提升

> 详细机制见 Personality Domain 演化部分。

---

## 八、生命周期

### 8.1 初始化

```typescript
async init(options: {
  baseline: EmotionBaseline;  // 从人格参数计算
  initialState?: EmotionState; // 可选：初始状态
}): Promise<void> {
  this.baseline = options.baseline;
  this.currentState = options.initialState ?? this.createBaselineState();
}
```

### 8.2 运行时

```
start() → 开始 tick 循环
    │
    ├─ 每个 tick：情绪衰减计算
    └─ 监听事件：响应外部刺激
```

### 8.3 序列化

```typescript
serialize(): EmotionEngineState {
  return {
    currentState: this.currentState,
    baseline: this.baseline,
    lastTriggeredAt: this.lastTriggeredAt,
  };
}

deserialize(state: EmotionEngineState): void {
  this.currentState = state.currentState;
  this.baseline = state.baseline;
}
```

---

## 相关文档

- [05-brain-body-architecture.md](file:///workspace/docs/05-brain-body-architecture.md) — Brain-Body 分层架构
- [03-personality-domain.md](file:///workspace/docs/03-personality-domain.md) — Personality Domain
- [06-goal-domain.md](file:///workspace/docs/06-goal-domain.md) — Goal Domain
- [07-relationship-domain.md](file:///workspace/docs/07-relationship-domain.md) — Relationship Domain
- [08-engine-framework.md](file:///workspace/docs/08-engine-framework.md) — Engine 框架
- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构总览
- [decision-log.md](file:///workspace/docs/decision-log.md) — ADR 决策记录
