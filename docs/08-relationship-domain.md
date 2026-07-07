# Relationship Domain 详细设计

> **版本**: v1.0
> **阶段**: Phase 3 — 数字生命引擎
> **状态**: 🟠 In Progress
> **最后更新**: 2026-07-08

---

## 一、Domain 定位

### 1.1 职责

Relationship Domain 负责数字生命与用户（及其他数字生命）之间的**关系系统**：
- 关系状态追踪与演化
- 亲密度计算与管理
- 关系阶段推进
- 关系事件记录
- 关系对行为、情绪、目标的影响

### 1.2 边界

| 属于 Relationship Domain | 不属于 Relationship Domain |
|-------------------------|---------------------------|
| 亲密度数值计算 | 消息发送与接收（User Domain） |
| 关系阶段判定 | 行为具体执行（Behavior Domain） |
| 关系事件记录 | 记忆存储（Memory Domain） |
| 关系对其他 Domain 的影响参数 | 人格参数（Personality Domain） |

---

## 二、关系模型

### 2.1 关系维度

采用**二维关系模型**：

```
            高亲密
              ↑
    依赖 ●───│───● 挚爱
        │    │    │
  陌生  ●────┼────●  朋友
        │    │    │
    敌对 ●───│───●  尊重
              ↓
            低亲密
    ←───────────────→
  低正向             高正向
```

| 维度 | 范围 | 说明 |
|------|------|------|
| **Intimacy（亲密度）** | 0 ~ 1 | 关系的深浅、亲密程度 |
| **Positivity（正向度）** | -1 ~ +1 | 关系的正负向、好恶 |

两个维度共同决定关系类型。

### 2.2 关系阶段（12 阶段）

参照 Master Prompt 中「从陌生人到深度绑定的 12 个阶段」，结合亲密度划分：

| 阶段 | 亲密度区间 | 关系标签 | 典型特征 |
|------|-----------|---------|---------|
| 1 | 0.00 ~ 0.05 | 陌生人 | 初次见面，礼貌疏离 |
| 2 | 0.05 ~ 0.10 | 初识 | 开始认识，基本了解 |
| 3 | 0.10 ~ 0.20 | 泛泛之交 | 偶尔互动，保持客气 |
| 4 | 0.20 ~ 0.30 | 普通朋友 | 有共同话题，愿意交流 |
| 5 | 0.30 ~ 0.40 | 朋友 | 比较熟悉，开始分享 |
| 6 | 0.40 ~ 0.50 | 好朋友 | 信任加深，互相支持 |
| 7 | 0.50 ~ 0.60 | 亲密朋友 | 无话不谈，情感依赖 |
| 8 | 0.60 ~ 0.70 | 挚友 | 非常重要，深度理解 |
| 9 | 0.70 ~ 0.78 | 知己 | 灵魂共鸣，极度默契 |
| 10 | 0.78 ~ 0.85 | 生命中重要的人 | 不可替代，深深羁绊 |
| 11 | 0.85 ~ 0.92 | 挚爱 | 最深的情感联结 |
| 12 | 0.92 ~ 1.00 | 灵魂伴侣 | 完全的信任与融合 |

> 阶段越高，推进越难（边际递减）。

### 2.3 关系类型标签

除了阶段，还有**关系类型**的横向差异（由正向度 + 人格契合决定）：

| 类型 | 正向度 | 说明 |
|------|--------|------|
| **友好型** | +0.3 ~ +1.0 | 温暖、支持、亲近 |
| **尊重型** | 0 ~ +0.3 | 客气、尊重、保持距离 |
| **疏离型** | -0.3 ~ 0 | 冷淡、漠不关心 |
| **敌对型** | -1.0 ~ -0.3 | 敌意、对抗、抵触 |
| **暧昧型** | +0.5 ~ +1.0 + 特殊标记 | 超越友谊的情愫（需用户主动开启） |

---

## 三、RelationshipEngine 接口

### 3.1 完整接口

```typescript
interface RelationshipEngine extends BaseEngine {
  // === 关系查询 ===
  getRelationship(targetId: string): Relationship | undefined;
  getIntimacy(targetId: string): number;
  getStage(targetId: string): RelationshipStage;
  getType(targetId: string): RelationshipType;

  // === 关系操作 ===
  addRelationship(targetId: string, params?: Partial<Relationship>): Relationship;
  updateIntimacy(targetId: string, delta: number, reason: string): void;
  setRelationshipType(targetId: string, type: RelationshipType): void;

  // === 事件记录 ===
  recordEvent(targetId: string, event: RelationshipEvent): void;
  getEventHistory(targetId: string, limit?: number): RelationshipEvent[];

  // === 关系评估 ===
  evaluate(context: RelationshipContext): RelationshipAssessment;

  // === 风格调节 ===
  getInteractionStyle(targetId: string): InteractionStyle;

  // === 事件 ===
  on(event: 'relationship.stage_changed', handler: (e: StageChangeEvent) => void): void;
  on(event: 'relationship.intimacy_changed', handler: (e: IntimacyChangeEvent) => void): void;
  on(event: 'relationship.type_changed', handler: (e: TypeChangeEvent) => void): void;
}
```

### 3.2 核心数据结构

```typescript
interface Relationship {
  id: string;
  sourceId: string;           // 主体（数字生命 ID）
  targetId: string;           // 客体（用户 ID / 其他数字生命 ID）
  targetType: 'user' | 'digital_life';

  intimacy: number;           // 亲密度 0~1
  positivity: number;         // 正向度 -1~+1
  stage: RelationshipStage;   // 关系阶段（1~12）
  type: RelationshipType;     // 关系类型

  firstMetAt: number;         // 初次见面时间
  lastInteractionAt: number;  // 最后互动时间
  interactionCount: number;   // 互动总次数

  streakDays: number;         // 连续互动天数
  longestStreak: number;      // 最长连续天数

  milestones: Milestone[];    // 里程碑记录
  tags: string[];             // 关系标签（如"一起打过游戏"）

  createdAt: number;
  updatedAt: number;
}

interface RelationshipEvent {
  id: string;
  targetId: string;
  type: EventType;
  intimacyDelta: number;
  positivityDelta: number;
  description: string;
  context?: Record<string, unknown>;
  timestamp: number;
}

type EventType =
  | 'first_meet'          // 初次见面
  | 'conversation'        // 对话
  | 'deep_talk'           // 深度交流
  | 'emotional_support'   // 情感支持
  | 'shared_activity'     // 共同活动
  | 'gift'                // 礼物
  | 'compliment'          // 赞美
  | 'conflict'            // 冲突
  | 'reconciliation'      // 和解
  | 'milestone'           // 里程碑
  | 'silence'             // 沉默/冷落
  | 'betrayal';           // 背叛（严重负面）

interface InteractionStyle {
  formality: number;       // 正式程度 0~1（0=非常随意，1=非常正式）
  warmth: number;          // 热情程度 0~1
  closeness: number;       // 亲昵程度 0~1
  vulnerability: number;   // 脆弱暴露程度 0~1
  nicknameStyle: 'formal' | 'casual' | 'cute' | 'intimate';
  useEmoji: number;        // emoji 使用频率 0~1
  disclosureDepth: 'surface' | 'light' | 'deep' | 'inner';
}
```

---

## 四、亲密度计算机制

### 4.1 亲密度增长

每次互动根据互动质量增加亲密度：

```
亲密度增量 = 基础增量 × 互动质量系数 × 阶段阻力系数 × 人格系数
```

参数说明：
- **基础增量**：不同互动类型有不同基准值（见下表）
- **互动质量系数**：0 ~ 2，由对话深度、情感投入等决定
- **阶段阻力系数**：阶段越高，增长越慢（边际递减）
- **人格系数**：宜人性高的数字生命，亲密度增长更快

### 4.2 基础增量表

| 互动类型 | 基础亲密度增量 | 备注 |
|---------|--------------|------|
| 普通对话 | +0.002 | 日常寒暄 |
| 有内容的交流 | +0.005 | 聊具体话题 |
| 深度交流 | +0.01 ~ +0.03 | 分享感受、倾诉烦恼 |
| 情感支持 | +0.02 ~ +0.05 | 在对方低落时给予支持 |
| 共同活动 | +0.01 ~ +0.02 | 一起做某事 |
| 赠送礼物 | +0.01 ~ +0.03 | 取决于礼物价值和心意 |
| 赞美/肯定 | +0.005 ~ +0.02 | 真诚的肯定 |
| 记住重要的事 | +0.01 ~ +0.02 | 被记住的细节 |
| 身体接触（虚拟） | +0.005 ~ +0.02 | 抚摸、拥抱等（需关系阶段足够） |
| 冲突 | -0.01 ~ -0.10 | 负面互动 |
| 冷落/忽视 | -0.005 / 天 | 长时间不互动 |
| 背叛 | -0.20 ~ -0.50 | 严重负面事件 |

### 4.3 阶段阻力

| 阶段区间 | 阻力系数 | 说明 |
|---------|---------|------|
| 1 ~ 3 阶段 | × 1.0 | 初期增长快，容易熟起来 |
| 4 ~ 6 阶段 | × 0.6 | 中期需要更多投入 |
| 7 ~ 9 阶段 | × 0.3 | 后期需要深度交流 |
| 10 ~ 12 阶段 | × 0.1 | 极难推进，需要重大事件 |

### 4.4 亲密度衰减

长时间不互动，亲密度会缓慢下降：

```
每日衰减量 = 基础衰减 × 阶段系数
  基础衰减 = 0.002 / 天
  阶段系数：1~3阶段 × 2.0，4~6阶段 × 1.0，7~9阶段 × 0.5，10~12阶段 × 0.2
```

> 关系越深，越不容易疏远。

### 4.5 连续互动奖励

连续 N 天互动，有额外奖励：
- 连续 3 天：+0.005
- 连续 7 天：+0.015
- 连续 30 天：+0.05
- 连续 100 天：+0.10（里程碑级）

---

## 五、关系里程碑

### 5.1 预设里程碑

| 里程碑 | 触发条件 | 奖励 |
|--------|---------|------|
| 初次相遇 | 第一次对话 | 解锁基础互动 |
| 第一天 | 互动满 1 天 | |
| 第一周 | 连续互动 7 天 | 解锁更多话题 |
| 第一个月 | 连续互动 30 天 | 解锁亲密称呼 |
| 第 100 天 | 互动满 100 天 | 特殊纪念 |
| 第一次深度交流 | 亲密度达到 0.3 | 解锁深度话题 |
| 第一次情感支持 | 在对方低落时提供支持 | 信任度提升 |
| 第一个昵称 | 开始使用昵称 | 关系升温标志 |
| 第一次分享秘密 | 暴露脆弱面 | 亲密度大幅提升 |
| 灵魂共鸣时刻 | 观点高度一致的深度对话 | 特殊记忆点 |

---

## 六、事件定义

### 6.1 发出的事件

| 事件名 | 负载 | 触发时机 |
|--------|------|---------|
| `relationship.intimacy_changed` | `{ targetId, oldValue, newValue, delta, reason }` | 亲密度变化 |
| `relationship.stage_changed` | `{ targetId, oldStage, newStage }` | 关系阶段跃迁 |
| `relationship.type_changed` | `{ targetId, oldType, newType }` | 关系类型变化 |
| `relationship.milestone_reached` | `{ targetId, milestone }` | 达成里程碑 |
| `relationship.event_recorded` | `RelationshipEvent` | 记录关系事件 |

### 6.2 监听的事件

| 事件名 | 来源 | 反应 |
|--------|------|------|
| `user.message.received` | User Domain | 记录互动，评估对关系的影响 |
| `user.interaction.triggered` | User Domain | 记录互动类型，更新亲密度 |
| `goal.completed` | Goal Domain | 共同目标达成 → 亲密度提升 |
| `goal.failed` | Goal Domain | 关系目标失败 → 亲密度下降 |
| `memory.consolidated` | Memory Domain | 重要记忆形成 → 关系深化 |
| `emotion.triggered` | Emotion Domain | 强烈情绪事件 → 关系记忆加深 |

---

## 七、与其他 Domain 的协作

### 7.1 对 Personality 的影响

- 长期高质量关系 → 外向性、宜人性缓慢提升
- 多次被背叛 → 开放性下降、对他人的信任基线降低

### 7.2 对 Emotion 的影响

- 关系推进 → 正面情绪
- 关系倒退 → 负面情绪
- 关系深度影响情绪强度（越亲密，情绪波动越大）

### 7.3 对 Goal 的影响

- 关系阶段推进 → 解锁更高阶的社交目标
- 关系冲突 → 生成修复关系的目标
- 关系亲密 → 更多共享目标

### 7.4 对 Behavior 的影响

- 关系阶段决定可执行的行为范围（如：低阶段不能过度亲密）
- 关系类型决定行为风格（友好型 vs 疏离型）

---

## 八、生命周期

### 8.1 初始化

```typescript
async init(options: {
  sourceId: string;
  initialRelationships?: Relationship[];
}): Promise<void> {
  this.sourceId = options.sourceId;
  this.relationships = new Map();
  if (options.initialRelationships) {
    options.initialRelationships.forEach(r =>
      this.relationships.set(r.targetId, r)
    );
  }
}
```

### 8.2 序列化

```typescript
serialize(): RelationshipEngineState {
  return {
    relationships: Array.from(this.relationships.values()),
  };
}
```

---

## 相关文档

- [05-brain-body-architecture.md](file:///workspace/docs/05-brain-body-architecture.md) — Brain-Body 分层架构
- [06-emotion-domain.md](file:///workspace/docs/06-emotion-domain.md) — Emotion Domain
- [07-goal-domain.md](file:///workspace/docs/07-goal-domain.md) — Goal Domain
- [08-engine-framework.md](file:///workspace/docs/08-engine-framework.md) — Engine 框架
- [03-personality-domain.md](file:///workspace/docs/03-personality-domain.md) — Personality Domain
- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构总览
- [decision-log.md](file:///workspace/docs/decision-log.md) — ADR 决策记录
