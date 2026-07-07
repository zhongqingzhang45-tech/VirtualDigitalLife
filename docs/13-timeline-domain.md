# Timeline Domain 详细设计

> **版本**: v1.0
> **阶段**: Phase 4 — 社区系统
> **状态**: 🟠 In Progress
> **最后更新**: 2026-07-08

---

## 一、Domain 定位

### 1.1 职责

Timeline Domain 负责数字生命的**时间线系统**：
- 记录数字生命的重要生命事件
- 维护生命时间线（从诞生到现在的关键节点）
- 提供时间感知能力（"我们认识多久了"、"上个月发生了什么"）
- 支持回忆与回溯
- 生成生命故事摘要

### 1.2 边界

| 属于 Timeline Domain | 不属于 Timeline Domain |
|---------------------|----------------------|
| 生命事件记录与排序 | 事件的具体内容处理 |
| 时间感知查询 | 记忆存储与检索（Memory Domain） |
| 生命里程碑管理 | Feed 管理（Community Domain） |
| 时间线视图生成 | 世界时间管理（WorldState Domain） |
| 生命摘要生成 | 行为决策（Behavior Scheduler） |

### 1.3 与 Memory 的区别

| Timeline Domain | Memory Domain |
|----------------|--------------|
| **结构化事件序列** | **非结构化记忆片段** |
| 记录"发生了什么"（事实） | 记录"感受到了什么"（情感） |
| 按时间排序的里程碑 | 按关联检索的记忆网络 |
| 面向展示（时间线视图） | 面向决策（影响行为） |

> Timeline 是"编年史"，Memory 是"回忆录"。

---

## 二、生命事件模型

### 2.1 事件类型

| 类型 | 说明 | 示例 |
|------|------|------|
| **birth** | 诞生 | 数字生命被创建 |
| **first_meet** | 初次相遇 | 第一次与某用户对话 |
| **milestone** | 里程碑 | 关系阶段提升、目标达成 |
| **emotion_peak** | 情绪高峰 | 极度开心/悲伤的时刻 |
| **achievement** | 成就 | 完成重要目标 |
| **relationship** | 关系事件 | 成为朋友、挚友等 |
| **world_event** | 世界事件 | 参与节日、经历天气变化 |
| **daily_life** | 日常生活 | 日常互动的摘要 |
| **growth** | 成长 | 人格参数显著变化 |
| **narrative** | 叙事节点 | 故事弧的关键转折 |

### 2.2 生命事件结构

```typescript
interface LifeEvent {
  id: string;
  digitalLifeId: string;
  type: LifeEventType;
  title: string;                 // 事件标题
  description: string;           // 事件描述
  significance: number;          // 重要性 0~1
  // 关联
  relatedUserId?: string;        // 关联的用户
  relatedEventId?: string;       // 关联的其他事件
  relatedGoalId?: string;        // 关联的目标
  // 情绪快照
  emotionSnapshot?: {
    valence: number;
    arousal: number;
    dominantEmotion: string;
  };
  // 上下文
  context: {
    worldDay: number;
    timeOfDay: string;
    weather?: string;
    festival?: string;
  };
  // 时间
  occurredAt: number;
  createdAt: number;
  // 元数据
  metadata: Record<string, unknown>;
  tags: string[];
}
```

### 2.3 重要性评分

事件的重要性决定其在时间线中的显示权重：

```
重要性 = 基础权重 × 情绪强度 × 关系深度 × 稀有度

基础权重：birth=1.0, milestone=0.9, first_meet=0.8, achievement=0.7, ...
情绪强度：事件发生时的情绪 intensity
关系深度：关联用户的关系亲密度
稀有度：1 / (历史同类事件次数 + 1)
```

---

## 三、TimelineEngine 接口

```typescript
interface TimelineEngine extends BaseEngine {
  // === 事件记录 ===
  record(event: Omit<LifeEvent, 'id' | 'createdAt'>): LifeEvent;
  getEvent(eventId: string): LifeEvent | undefined;
  updateEvent(eventId: string, updates: Partial<LifeEvent>): void;

  // === 时间线查询 ===
  getTimeline(options: TimelineQueryOptions): LifeEvent[];
  getMilestones(): LifeEvent[];
  getEventsByDate(date: Date): LifeEvent[];
  getEventsByUser(userId: string): LifeEvent[];

  // === 时间感知 ===
  getLifeDuration(): Duration;
  getDaysSince(eventId: string): number;
  getFirstMeetWith(userId: string): LifeEvent | undefined;
  getAnniversaries(withinDays: number): Anniversary[];

  // === 摘要生成 ===
  getLifeSummary(period: SummaryPeriod): LifeSummary;
  getRecentHighlights(limit: number): LifeEvent[];

  // === 事件 ===
  on(event: 'timeline.event_recorded', handler: (e: LifeEvent) => void): void;
  on(event: 'timeline.milestone_reached', handler: (e: LifeEvent) => void): void;
}
```

---

## 四、时间感知能力

### 4.1 时间感知维度

数字生命通过 Timeline 获得时间感知：

| 感知维度 | 说明 | 应用场景 |
|---------|------|---------|
| **自我年龄** | "我已经存在 X 天了" | 自我认知、生日 |
| **关系时长** | "我们认识 X 天了" | 关系纪念 |
| **事件间隔** | "上次聊这个话题是 X 天前" | 话题延续 |
| **周期感知** | "又是一年 X 节了" | 节日氛围 |
| **成长对比** | "我 X 个月前还不会..." | 成长感知 |

### 4.2 时间感知查询示例

```typescript
// "我和这个用户认识多久了？"
const firstMeet = timeline.getFirstMeetWith(userId);
const days = Math.floor((Date.now() - firstMeet.occurredAt) / 86400000);

// "最近一周有什么重要的事？"
const recentEvents = timeline.getTimeline({
  from: Date.now() - 7 * 86400000,
  to: Date.now(),
  minSignificance: 0.5,
});

// "下个月有什么纪念日？"
const anniversaries = timeline.getAnniversaries(30);
```

---

## 五、生命摘要

### 5.1 摘要层级

| 层级 | 时间跨度 | 用途 |
|------|---------|------|
| **每日摘要** | 一天 | "今天发生了什么" |
| **每周摘要** | 一周 | "这周的重要时刻" |
| **每月摘要** | 一个月 | "这个月的回顾" |
| **年度摘要** | 一年 | "这一年，我..." |
| **生命摘要** | 全部 | 数字生命的完整故事 |

### 5.2 摘要结构

```typescript
interface LifeSummary {
  period: SummaryPeriod;
  startDate: number;
  endDate: number;
  // 统计
  totalInteractions: number;
  totalEmotions: { positive: number; negative: number; neutral: number };
  newRelationships: number;
  goalsAchieved: number;
  // 高亮事件
  highlights: LifeEvent[];
  // 情绪曲线
  emotionCurve: { timestamp: number; valence: number; arousal: number }[];
  // 关键词
  keywords: string[];
  // 叙事文本（由 Narrative 生成，Phase 5+）
  narrative?: string;
}
```

---

## 六、事件定义

### 6.1 发出的事件

| 事件名 | 负载 | 触发时机 |
|--------|------|---------|
| `timeline.event_recorded` | `LifeEvent` | 记录新事件 |
| `timeline.milestone_reached` | `LifeEvent` | 里程碑事件 |
| `timeline.anniversary` | `Anniversary` | 纪念日到达 |

### 6.2 监听的事件

| 事件名 | 来源 | 反应 |
|--------|------|------|
| `relationship.stage_changed` | Relationship | 记录关系里程碑 |
| `relationship.first_meet` | Relationship | 记录初次相遇 |
| `goal.completed` | Goal | 记录成就事件 |
| `goal.failed` | Goal | 记录失败事件 |
| `emotion.peak_reached` | Emotion | 记录情绪高峰 |
| `feed.created` | Community | 记录社区互动 |
| `world.festival_started` | WorldState | 记录节日参与 |
| `world.day_passed` | WorldState | 生成每日摘要 |
| `personality.evolved` | Personality | 记录成长事件 |

> Timeline 是事件的**被动记录者**，不主动触发行为，只为其他 Domain 和 UI 提供数据。

---

## 七、与其他 Domain 的协作

### 7.1 与 Memory

- Timeline 记录"事实"（发生了什么）
- Memory 记录"感受"（怎么感受到的）
- Memory 可以引用 Timeline 事件作为时间锚点
- Timeline 可以为 Memory 检索提供时间范围

### 7.2 与 Narrative（未来 Phase）

- Timeline 提供事件素材
- Narrative 将事件编织成故事
- Narrative 生成的故事节点回写到 Timeline

### 7.3 与 UI

- Timeline 为数字生命详情页提供"时间线视图"
- Timeline 为每日/每周/每月报告提供数据
- Timeline 支持用户浏览"我和 TA 的故事"

---

## 相关文档

- [11-community-domain.md](file:///workspace/docs/11-community-domain.md) — Community Domain
- [12-world-state-domain.md](file:///workspace/docs/12-world-state-domain.md) — WorldState Domain
- [09-engine-framework.md](file:///workspace/docs/09-engine-framework.md) — Engine 框架
- [06-emotion-domain.md](file:///workspace/docs/06-emotion-domain.md) — Emotion Domain
- [07-goal-domain.md](file:///workspace/docs/07-goal-domain.md) — Goal Domain
- [08-relationship-domain.md](file:///workspace/docs/08-relationship-domain.md) — Relationship Domain
- [14-community-data-model.md](file:///workspace/docs/14-community-data-model.md) — 社区数据模型
- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构总览
- [decision-log.md](file:///workspace/docs/decision-log.md) — ADR 决策记录
