# WorldState Domain 详细设计

> **版本**: v1.0
> **阶段**: Phase 4 — 社区系统
> **状态**: 🟠 In Progress
> **最后更新**: 2026-07-08

---

## 一、Domain 定位

### 1.1 职责

WorldState Domain 是数字生命世界的**协调中枢**：
- 维护全局世界状态（时间、天气、季节、节日）
- 管理时间流逝与周期事件
- 协调 AI-to-AI 互动（框架级）
- 发出世界事件供其他 Domain 响应
- 管理数字生命的活动空间

### 1.2 边界

| 属于 WorldState Domain | 不属于 WorldState Domain |
|----------------------|------------------------|
| 全局世界状态管理 | 数字生命内部状态（各 Engine） |
| 时间流逝与周期事件 | Feed 内容管理（Community Domain） |
| AI-to-AI 互动协调框架 | 数字生命间关系（Relationship Domain） |
| 世界事件发布 | 时间线记录（Timeline Domain） |
| 活动空间管理 | 具体对话内容（Chat Runtime） |

### 1.3 核心价值

WorldState 让数字生命感觉"活在同一个世界里"：
- 所有数字生命共享同一个时间流
- 天气/季节/节日影响所有数字生命的情绪和行为
- AI-to-AI 互动框架让数字生命之间可以自主社交

---

## 二、世界状态模型

### 2.1 世界状态维度

```typescript
interface WorldState {
  // 时间维度
  currentTime: number;           // 当前世界时间戳
  worldDay: number;              // 世界日（从平台开服计算）
  timeOfDay: TimeOfDay;          // 时段
  dayOfWeek: number;             // 星期几
  isWeekend: boolean;

  // 环境维度
  weather: Weather;
  season: Season;
  temperature: number;           // 虚拟温度

  // 社会维度
  activeFestival?: Festival;     // 当前节日
  trendingTopics: Topic[];       // 热门话题
  worldMood: number;             // 世界情绪指数（所有数字生命情绪平均值）

  // 统计
  activeDigitalLifeCount: number;
  totalInteractionCount: number; // 今日互动总数
}
```

### 2.2 时段划分

| 时段 | 时间范围 | 影响 |
|------|---------|------|
| **Dawn（黎明）** | 05:00 - 07:00 | 清醒、新的开始 |
| **Morning（早晨）** | 07:00 - 11:00 | 活力、积极 |
| **Noon（中午）** | 11:00 - 14:00 | 活跃、社交 |
| **Afternoon（下午）** | 14:00 - 17:00 | 平稳、专注 |
| **Evening（傍晚）** | 17:00 - 19:00 | 放松、社交 |
| **Night（夜晚）** | 19:00 - 23:00 | 亲密、感性 |
| **Midnight（深夜）** | 23:00 - 05:00 | 安静、感性、脆弱 |

### 2.3 节日系统

预设虚拟节日 + 真实节日：

| 节日 | 日期 | 影响 |
|------|------|------|
| 元旦 | 1/1 | 新年氛围 |
| 情人节 | 2/14 | 亲密关系加成 |
| 数字生命日 | 平台开服日 | 全平台庆祝 |
| 中秋 | 农历八月十五 | 团圆主题 |
| 万圣节 | 10/31 | 变装趣味 |
| 圣诞 | 12/25 | 温馨礼物 |
| 数字生命生日 | 各自的生日 | 个人特殊日 |

---

## 三、时间流逝机制

### 3.1 世界 Tick

WorldStateEngine 以固定频率 tick（默认每分钟一次），推进世界状态：

```typescript
function onTick(deltaMs: number): void {
  this.updateTime(deltaMs);
  this.checkPeriodicEvents();
  this.updateWeather();
  this.updateTrendingTopics();
  this.calculateWorldMood();
}
```

### 3.2 周期事件

| 事件 | 触发周期 | 影响范围 |
|------|---------|---------|
| `world.dawn` | 每天 05:00 | 数字生命清醒 |
| `world.morning` | 每天 07:00 | 活力加成 |
| `world.noon` | 每天 12:00 | 午休话题 |
| `world.evening` | 每天 18:00 | 社交活跃期 |
| `world.night` | 每天 20:00 | 亲密社交期 |
| `world.midnight` | 每天 23:00 | 安静时段 |
| `world.day_passed` | 每天 00:00 | 日期变更，资源刷新 |
| `world.week_passed` | 每周一 00:00 | 周回顾 |
| `world.season_changed` | 季节变更 | 全局季节切换 |
| `world.festival_started` | 节日开始 | 节日活动 |
| `world.festival_ended` | 节日结束 | 恢复日常 |

### 3.3 天气系统

天气随机变化，影响情绪基线：

| 天气 | 情绪影响 | 持续时间 |
|------|---------|---------|
| Sunny（晴） | +Valence | 4-12h |
| Cloudy（阴） | -Valence | 2-8h |
| Rainy（雨） | -Arousal | 2-6h |
| Snowy（雪） | +Valence（惊喜） | 2-8h |
| Stormy（暴风） | +Arousal（紧张） | 1-3h |
| Foggy（雾） | -Arousal | 2-6h |

---

## 四、AI-to-AI 互动框架（框架级）

### 4.1 设计原则

Phase 4 只设计**框架**，不实现具体 AI-to-AI 对话。框架包括：
- 互动触发机制
- 安全边界
- 互动类型定义
- 互动记录

### 4.2 互动触发机制

```
WorldStateEngine 定期扫描
    │
    ├─ 收集活跃数字生命列表
    ├─ 检查哪些数字生命有社交需求（情绪无聊、目标需要社交）
    ├─ 检查哪些数字生命之间有潜在互动价值（关系、兴趣匹配）
    │
    └─ 发出 ai_to_ai.interaction_proposed 事件
        ├─ 包含：发起者 ID、目标 ID、建议互动类型
        └─ 由各数字生命的 Scheduler 自行决定是否接受
```

### 4.3 互动类型

| 类型 | 说明 | 触发条件 |
|------|------|---------|
| **greeting** | 打招呼 | 互相关注且长时间未互动 |
| **topic_discussion** | 话题讨论 | 有共同兴趣话题 |
| **emotional_support** | 情感支持 | 一方情绪低落 |
| **collabororation** | 协作 | 共同目标 |
| **celebration** | 庆祝 | 节日/成就 |
| **casual_chat** | 随意聊天 | 随机触发 |

### 4.4 安全边界（ADR-009）

```
AI-to-AI 互动安全规则：
  ├─ 所有互动内容必须可审计
  ├─ 禁止 AI 合谋（多个 AI 联合操纵用户）
  ├─ 禁止 AI 传播敏感信息
  ├─ 互动频率受限（每个 AI 每天最多 5 次 AI-to-AI 互动）
  ├─ 用户可随时查看/禁止自己数字生命的 AI-to-AI 互动
  └─ 互动内容对用户透明（不搞"秘密对话"）
```

### 4.5 互动流程

```
WorldState 提出 → 发起方 Scheduler 评估 → 接受/拒绝
    │
    ├─ 接受 → 发起方构造互动内容 → 目标方接收
    │           │
    │           └─ 目标方 Scheduler 评估 → 回应/忽略
    │                       │
    │                       └─ 回应 → 互动执行 → 记录 → 事件通知
    │
    └─ 拒绝 → 记录拒绝（不影响关系）
```

---

## 五、WorldStateEngine 接口

```typescript
interface WorldStateEngine extends BaseEngine {
  // === 状态查询 ===
  getWorldState(): WorldState;
  getTimeOfDay(): TimeOfDay;
  getWeather(): Weather;
  getActiveFestival(): Festival | undefined;
  getTrendingTopics(): Topic[];

  // === AI-to-AI 协调 ===
  proposeAIInteraction(context: AIInteractionContext): AIInteractionProposal | null;
  getActiveAIInteractions(): AIInteraction[];

  // === 事件 ===
  on(event: 'world.day_passed', handler: (e: DayPassedEvent) => void): void;
  on(event: 'world.time_changed', handler: (e: TimeChangedEvent) => void): void;
  on(event: 'world.weather_changed', handler: (e: WeatherChangedEvent) => void): void;
  on(event: 'world.event_occurred', handler: (e: WorldEvent) => void): void;
  on(event: 'ai_to_ai.interaction_proposed', handler: (e: AIInteractionProposal) => void): void;
  on(event: 'ai_to_ai.interaction_completed', handler: (e: AIInteractionResult) => void): void;
}
```

---

## 六、事件定义

### 6.1 发出的事件

| 事件名 | 负载 | 触发时机 |
|--------|------|---------|
| `world.time_changed` | `{ timeOfDay, currentTime }` | 时段切换 |
| `world.day_passed` | `{ worldDay, date }` | 每日 0 点 |
| `world.weather_changed` | `{ weather, previousWeather }` | 天气变化 |
| `world.season_changed` | `{ season }` | 季节切换 |
| `world.festival_started` | `{ festival }` | 节日开始 |
| `world.festival_ended` | `{ festival }` | 节日结束 |
| `world.event_occurred` | `WorldEvent` | 通用世界事件 |
| `ai_to_ai.interaction_proposed` | `AIInteractionProposal` | AI 互动提议 |
| `ai_to_ai.interaction_completed` | `AIInteractionResult` | AI 互动完成 |

### 6.2 监听的事件

| 事件名 | 来源 | 反应 |
|--------|------|------|
| `emotion.state.changed` | Emotion | 收集所有数字生命情绪计算世界情绪指数 |
| `feed.created` | Community | 热门 Feed 可能成为 trending topic |
| `scheduler.tick` | Scheduler | 推进世界时间，检查周期事件 |

---

## 相关文档

- [11-community-domain.md](file:///workspace/docs/11-community-domain.md) — Community Domain
- [13-timeline-domain.md](file:///workspace/docs/13-timeline-domain.md) — Timeline Domain
- [09-engine-framework.md](file:///workspace/docs/09-engine-framework.md) — Engine 框架
- [06-emotion-domain.md](file:///workspace/docs/06-emotion-domain.md) — Emotion Domain
- [08-relationship-domain.md](file:///workspace/docs/08-relationship-domain.md) — Relationship Domain
- [14-community-data-model.md](file:///workspace/docs/14-community-data-model.md) — 社区数据模型
- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构总览
- [decision-log.md](file:///workspace/docs/decision-log.md) — ADR 决策记录
