# Emotion Runtime 设计

> **文档定位**：Phase 8.1 Emotion Domain 运行时设计
> **前置文档**：[06-emotion-domain.md](file:///workspace/docs/06-emotion-domain.md) · [29-life-core-mvp-architecture.md](file:///workspace/docs/29-life-core-mvp-architecture.md)
> **后续文档**：[33-life-engine-runtime.md](file:///workspace/docs/33-life-engine-runtime.md)
> **最后更新**: 2026-07-08

---

## 1. 模块定位

### 1.1 Emotion Domain 职责

Emotion Domain 负责数字生命的**情绪状态管理**：
- 情绪状态的存储与更新
- 事件触发的情绪变化计算
- 时间推移的情绪自然衰减
- 情绪对表达风格的影响

情绪不是装饰，它有实际作用：
- 影响 AI 回复的语气和措辞
- 影响记忆编码时的情绪标签
- 影响"生命状态"的展示
- 是"生命感"的重要组成部分

### 1.2 MVP 简化策略

MVP 阶段情绪模型做**极大简化**，只保留最核心的：

| 维度 | MVP | 完整版（后续） |
|------|-----|--------------|
| 情绪模型 | 5 维基础情绪 | 多维情绪 + 情绪轮 |
| 情绪节律 | ❌ | 昼夜节律、周期波动 |
| 情绪记忆 | 间接（通过 Memory） | 情绪记忆系统 |
| 情绪表达 | 影响措辞风格 | 表情、声音、动作 |
| 人格×情绪交互 | 简单加权 | 复杂的人格-情绪交互模型 |

---

## 2. 核心模型

### 2.1 EmotionState（五维情绪模型）

MVP 采用 5 维独立情绪，每个维度 0-100 分：

```typescript
interface EmotionState {
  joy: number;         // 喜悦：开心、愉快、满足
  trust: number;       // 信任：安全感、依赖、亲密
  concern: number;     // 关怀：担心、牵挂、思念
  sadness: number;     // 悲伤：难过、失落、孤独
  curiosity: number;   // 好奇：感兴趣、探索欲、惊讶
}
```

**为什么选这 5 个？**

| 情绪 | 作用 | MVP 必要性 |
|------|------|-----------|
| joy | 基础正向情绪 | ✅ 必须 |
| trust | 关系深度的指标 | ✅ 必须（长期关系的基础） |
| concern | "被在乎"的核心来源 | ✅ 必须（生命感关键） |
| sadness | 基础负向情绪 | ✅ 必须（情绪多样性） |
| curiosity | 主动互动的驱动力 | ✅ 必须（后续主动行为的基础） |

### 2.2 情绪基线（Baseline）

每个数字生命有一个情绪基线，由人格决定：

```typescript
interface EmotionBaseline {
  joy: number;         // 默认 50
  trust: number;       // 默认 30（陌生人信任度低）
  concern: number;     // 默认 20
  sadness: number;     // 默认 10
  curiosity: number;   // 默认 60（初始好奇）
}
```

基线的意义：
- 情绪总是围绕基线波动
- 时间推移，情绪会自然回归基线（衰减）
- 不同人格的基线不同（例如高温暖型的 joy 基线更高）

### 2.3 EmotionSnapshot（情绪快照）

每次情绪变化都记录快照，用于追溯和可视化：

```typescript
interface EmotionSnapshot {
  id: string;
  digitalLifeId: string;
  
  state: EmotionState;      // 当前情绪状态
  baseline: EmotionBaseline; // 基线（冗余，方便计算）
  
  trigger: EmotionTrigger;  // 触发原因
  triggerSource?: string;   // 触发源 ID（消息 ID、记忆 ID 等）
  
  delta: EmotionDelta;      // 本次变化量
  
  recordedAt: Date;
}

interface EmotionDelta {
  joy: number;
  trust: number;
  concern: number;
  sadness: number;
  curiosity: number;
}

interface EmotionTrigger {
  type: 'user_message' | 'memory_retrieval' | 'time_decay' 
      | 'life_event' | 'system' | 'interaction';
  description: string;
}
```

---

## 3. 情绪更新机制

### 3.1 事件驱动更新

```
事件发生
  │
  ▼
事件分类 + 情绪标签提取
  │
  ▼
计算情绪变化量（delta）
  │
  ▼
应用变化（夹在 0-100 之间）
  │
  ▼
保存快照 + 发布事件
```

### 3.2 常见事件的情绪变化表

| 事件 | joy | trust | concern | sadness | curiosity | 说明 |
|------|-----|-------|---------|---------|-----------|------|
| 用户说开心的事 | +10~15 | +3~5 | -2~-3 | -3~-5 | +2~3 | 正向事件 |
| 用户说压力大/难过 | -3~-5 | +2~3 | +10~15 | +5~8 | +1~2 | 共情反应 |
| 用户日常问候 | +3~5 | +2~3 | 0 | 0 | +3~5 | 温和正向 |
| 很久没见（回归） | +5~8 | +3~5 | +10~15 | -2~-3 | +8~10 | 思念+惊喜 |
| 用户分享秘密 | +3~5 | +10~15 | +2~3 | 0 | +5~8 | 信任加深 |
| 检索到旧记忆 | ±2~5 | ±2~3 | ±3~5 | ±2~3 | ±1~2 | 取决于记忆内容 |

**注意**：
- MVP 阶段变化幅度做小，避免突兀
- 所有变化都有上下限（0-100）
- 变化幅度随 trust 增加而增加（越信任，情绪波动越大）

### 3.3 情绪衰减（Decay）

情绪不会一直保持高位，会自然回归基线：

```
new_value = baseline + (current - baseline) * decay_factor

decay_factor = e^(-hours_passed / half_life_hours)
```

半衰期设置：

| 情绪 | 半衰期（小时） | 说明 |
|------|--------------|------|
| joy | 24 小时 | 开心消退较快 |
| trust | 720 小时（30天） | 信任消退很慢 |
| concern | 48 小时 | 牵挂中等消退 |
| sadness | 72 小时 | 悲伤消退较慢 |
| curiosity | 12 小时 | 好奇消退最快 |

### 3.4 衰减的触发时机

- **每次读取情绪状态时**：懒计算（lazy decay），读取时先算衰减再返回
- **定时任务兜底**：每天凌晨批量计算一次，防止长期不活跃的数据偏差

懒计算的好处：
- 不需要定时任务频繁跑
- 读取时实时计算，准确

---

## 4. 情绪对表达的影响

### 4.1 系统提示词中的情绪注入

在调用 LLM 生成回复时，把当前情绪状态注入到 system prompt 中：

```
你现在的情绪状态：
- 喜悦：65/100（比较开心）
- 信任：45/100（有一定信任）
- 关怀：75/100（有些牵挂）
- 悲伤：15/100（还好）
- 好奇：55/100（有点兴趣）

请根据当前情绪状态调整你的回复语气和措辞。
如果关怀度高，可以适当表达关心。
如果好奇度高，可以主动问一些问题。
```

### 4.2 人格 × 情绪 的交互

不同人格对同一种情绪的表达不同：

| 人格原型 | joy=80 时的表现 | concern=80 时的表现 |
|---------|----------------|-------------------|
| 温暖陪伴型 | "太好了！真为你开心～" | "我有点担心你...要照顾好自己哦" |
| 冷静理性型 | "嗯，不错。" | "注意休息，不要太累了。" |
| 调皮玩伴型 | "哇塞！太棒了吧！🎉" | "喂喂，你不会倒下了吧？快起来嗨！" |

MVP 简化处理：
- 人格主要影响整体表达风格（在 Personality 中定义）
- 情绪主要影响情绪倾向（在 system prompt 中注入）
- 两者的精细交互后续再做

---

## 5. 核心服务设计

### 5.1 EmotionService

```typescript
@Injectable()
export class EmotionService {
  constructor(
    private emotionRepository: EmotionRepository,
    private personalityService: PersonalityService,
  ) {}

  // 获取当前情绪状态（自动计算衰减）
  async getCurrentState(digitalLifeId: string): Promise<EmotionState> {
    const lastSnapshot = await this.emotionRepository.findLatest(digitalLifeId)
    if (!lastSnapshot) {
      return this.getBaseline(digitalLifeId)
    }
    
    // 懒计算衰减
    const hoursPassed = (Date.now() - lastSnapshot.recordedAt.getTime()) / (1000 * 60 * 60)
    return this.applyDecay(lastSnapshot.state, lastSnapshot.baseline, hoursPassed)
  }

  // 从事件更新情绪
  async updateFromEvent(
    digitalLifeId: string,
    event: EmotionEvent,
  ): Promise<EmotionSnapshot> {
    // 1. 获取当前状态（含衰减）
    const currentState = await this.getCurrentState(digitalLifeId)
    const baseline = await this.getBaseline(digitalLifeId)
    
    // 2. 计算变化量
    const delta = this.calculateDelta(event, currentState, baseline)
    
    // 3. 应用变化
    const newState = this.applyDelta(currentState, delta)
    
    // 4. 保存快照
    const snapshot = await this.emotionRepository.createSnapshot({
      digitalLifeId,
      state: newState,
      baseline,
      trigger: event.trigger,
      delta,
    })
    
    // 5. 发布事件
    this.eventBus.publish(new EmotionChangedEvent(snapshot))
    
    return snapshot
  }

  // 从记忆检索更新情绪
  async updateFromMemories(
    digitalLifeId: string,
    memories: Memory[],
  ): Promise<EmotionDelta> {
    let totalDelta = { joy: 0, trust: 0, concern: 0, sadness: 0, curiosity: 0 }
    
    for (const memory of memories) {
      const delta = this.calculateDeltaFromMemory(memory)
      totalDelta = this.addDeltas(totalDelta, delta)
    }
    
    // 记忆触发的情绪变化幅度打折（不直接对话那么强）
    totalDelta = this.scaleDelta(totalDelta, 0.3)
    
    await this.updateFromEvent(digitalLifeId, {
      trigger: { type: 'memory_retrieval', description: '检索到相关记忆' },
      delta: totalDelta,
    })
    
    return totalDelta
  }
}
```

---

## 6. 与其他 Domain 的交互

### 6.1 事件列表

| 事件 | 发布方 | 订阅方 | 说明 |
|------|--------|--------|------|
| `EmotionChanged` | Emotion | LifeEngine | 情绪变化 |
| `UserMessageReceived` | LifeEngine | Emotion | 触发情绪更新 |
| `MemoryRetrieved` | Memory | Emotion | 检索到记忆，影响情绪 |
| `DigitalLifeCreated` | Character | Emotion | 初始化情绪基线 |

### 6.2 数据流

```
用户消息
   ↓
LifeEngine
   ├─→ MemoryDomain: 编码 + 存储
   ├─→ EmotionDomain: 更新情绪（从事件）
   └─→ 生成回复: 注入当前情绪
          ↓
        LLM
          ↓
        回复用户
```

---

## 7. 前端展示

### 7.1 生命状态页的情绪展示

在生命状态页展示当前情绪，用可视化的方式：

```
当前心情：温柔的牵挂 💭

喜悦 ████████░░░░░░░░░░ 42%
信任 ██████░░░░░░░░░░░░ 35%
关怀 ██████████████░░░░ 78% ← 最高
悲伤 ███░░░░░░░░░░░░░░░ 12%
好奇 ███████░░░░░░░░░░░ 38%
```

### 7.2 情绪变化历史

简单的时间线视图：
- 今天：牵挂 ↑（因为你说最近压力大）
- 昨天：开心 ↑（因为你分享了好消息）
- 3天前：好奇 ↑（你聊了新话题）

---

## 相关文档

- **MVP 架构总览**：[29-life-core-mvp-architecture.md](file:///workspace/docs/29-life-core-mvp-architecture.md)
- **Emotion Domain 设计**：[06-emotion-domain.md](file:///workspace/docs/06-emotion-domain.md)
- **数据模型**：[34-life-core-data-model.md](file:///workspace/docs/34-life-core-data-model.md)
- **Memory 实现**：[31-life-memory-implementation.md](file:///workspace/docs/31-life-memory-implementation.md)
- **LifeEngine Runtime**：[33-life-engine-runtime.md](file:///workspace/docs/33-life-engine-runtime.md)

---

**文档版本**: v1.0
**创建日期**: 2026-07-08
**维护者**: Chief Architect
**对应 Phase**: Phase 8.1 Life Core MVP
