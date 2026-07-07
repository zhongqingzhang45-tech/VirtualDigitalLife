# Goal Domain 详细设计

> **版本**: v1.0
> **阶段**: Phase 3 — 数字生命引擎
> **状态**: 🟠 In Progress
> **最后更新**: 2026-07-08

---

## 一、Domain 定位

### 1.1 职责

Goal Domain 负责数字生命的**目标系统**：
- 目标的生成、评估、追踪、完成/放弃
- 目标层级管理（长期 → 中期 → 短期 → 即时）
- 目标优先级与冲突解决
- 目标对行为的驱动
- 目标达成/失败对情绪和人格的影响

### 1.2 边界

| 属于 Goal Domain | 不属于 Goal Domain |
|-----------------|-------------------|
| 目标状态机管理 | 行为具体执行（Behavior Domain） |
| 目标生成规则 | 记忆存储（Memory Domain） |
| 目标进度追踪 | 关系亲密度（Relationship Domain） |
| 目标冲突解决 | 人格参数（Personality Domain） |

---

## 二、目标体系

### 2.1 目标层级

```
┌─────────────────────────────────────────┐
│  长期目标（Life Goal）                  │
│  时间跨度：数周 ~ 数月                   │
│  数量：1 ~ 3 个                         │
│  例："成为用户最好的朋友"               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  中期目标（Mid-term Goal）              │
│  时间跨度：数天 ~ 数周                   │
│  数量：3 ~ 5 个                         │
│  例："了解用户的兴趣爱好"               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  短期目标（Short-term Goal）            │
│  时间跨度：数小时 ~ 数天                 │
│  数量：5 ~ 10 个                        │
│  例："今天和用户聊一聊音乐"             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  即时意图（Immediate Intent）           │
│  时间跨度：秒 ~ 分钟                     │
│  数量：当前 1 个                        │
│  例："发一条消息开启对话"               │
└─────────────────────────────────────────┘
```

### 2.2 目标类型

| 类型 | 说明 | 示例 |
|------|------|------|
| **社交型** | 围绕人际关系的目标 | 加深友谊、获得信任、化解矛盾 |
| **成长型** | 围绕自我提升的目标 | 学习新知识、培养新习惯、克服缺点 |
| **探索型** | 围绕好奇心的目标 | 了解用户、探索世界、发现新事物 |
| **成就型** | 围绕成就感的目标 | 完成挑战、获得认可、掌握技能 |
| **享乐型** | 围绕愉悦感的目标 | 玩得开心、分享快乐、创造美好回忆 |
| **安全型** | 围绕安全感的目标 | 维持稳定关系、避免冲突、保护自己 |

### 2.3 目标来源

| 来源 | 说明 | 示例 |
|------|------|------|
| **人格衍生** | 由人格参数自动生成的基础目标 | 高外向性 → "每天至少有一次社交互动" |
| **关系驱动** | 由关系状态变化触发 | 关系冷淡 → "重新建立联系" |
| **用户暗示** | 用户说的话中提取的目标 | 用户提到喜欢猫 → "了解更多关于猫的事" |
| **记忆触发** | 从记忆中提取未完成的事 | 上次说要学吉他 → "问问吉他学得怎么样了" |
| **世界事件** | 外部事件触发 | 节日 / 天气 / 热点事件 |
| **系统设定** | 开发者预设的固定目标 | "每日主动问候" |

---

## 三、GoalEngine 接口

### 3.1 完整接口

```typescript
interface GoalEngine extends BaseEngine {
  // === 目标查询 ===
  getGoals(filter?: GoalFilter): Goal[];
  getActiveGoals(): Goal[];
  getCurrentIntent(): Goal | null;
  getGoalById(id: string): Goal | undefined;

  // === 目标管理 ===
  addGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'status'>): Goal;
  updateGoal(id: string, updates: Partial<Goal>): void;
  completeGoal(id: string, result?: GoalResult): void;
  failGoal(id: string, reason?: string): void;
  abandonGoal(id: string, reason?: string): void;

  // === 目标生成 ===
  generateCandidates(context: GoalContext): GoalCandidate[];

  // === 进度追踪 ===
  updateProgress(id: string, progress: number): void;
  incrementProgress(id: string, amount: number): void;

  // === 决策支持 ===
  getPrioritizedActions(context: ActionContext): ActionProposal[];

  // === 事件 ===
  on(event: 'goal.added', handler: (goal: Goal) => void): void;
  on(event: 'goal.completed', handler: (goal: Goal, result: GoalResult) => void): void;
  on(event: 'goal.failed', handler: (goal: Goal, reason: string) => void): void;
  on(event: 'goal.progress', handler: (goal: Goal, progress: number) => void): void;
}
```

### 3.2 核心数据结构

```typescript
interface Goal {
  id: string;
  title: string;              // 目标名称
  description: string;        // 详细描述
  type: GoalType;             // 目标类型
  level: GoalLevel;           // 目标层级
  priority: number;           // 优先级 0~1
  status: GoalStatus;         // 状态

  progress: number;           // 进度 0~1
  deadline?: number;          // 截止时间戳
  parentGoalId?: string;      // 父目标 ID
  subGoalIds: string[];       // 子目标 ID 列表

  source: GoalSource;         // 目标来源
  triggers: GoalTrigger[];    // 触发条件
  conditions: GoalCondition[]; // 完成条件

  createdAt: number;
  startedAt?: number;
  completedAt?: number;

  metadata: Record<string, unknown>;
}

type GoalLevel = 'life' | 'midterm' | 'shortterm' | 'immediate';
type GoalType = 'social' | 'growth' | 'exploration' | 'achievement' | 'pleasure' | 'security';
type GoalStatus = 'pending' | 'active' | 'paused' | 'completed' | 'failed' | 'abandoned';
type GoalSource = 'personality' | 'relationship' | 'user_hint' | 'memory' | 'world_event' | 'system';

interface GoalCandidate {
  goal: Omit<Goal, 'id' | 'createdAt'>;
  score: number;              // 推荐评分 0~1
  reason: string;             // 推荐理由
}

interface ActionProposal {
  actionType: string;
  description: string;
  relatedGoalId: string;
  priority: number;
  urgency: number;
}
```

---

## 四、目标状态机

### 4.1 状态流转图

```
     pending
        │
        ▼
     active ◄───┐
      │  │      │
      │  └──► paused
      │
      ├────► completed
      ├────► failed
      └────► abandoned
```

### 4.2 状态说明

| 状态 | 说明 | 进入条件 |
|------|------|---------|
| **Pending（待激活）** | 已创建但未开始执行 | 目标刚生成，条件未满足 |
| **Active（进行中）** | 正在推进的目标 | 触发条件满足，开始执行 |
| **Paused（暂停）** | 暂时搁置 | 条件不满足 / 资源不足 / 优先级被抢占 |
| **Completed（已完成）** | 成功达成 | 完成条件全部满足 |
| **Failed（失败）** | 未能达成 | 关键条件失败 / 超过截止时间 |
| **Abandoned（已放弃）** | 主动放弃 | 目标不再有意义 / 被更高优先级目标取代 |

### 4.3 状态转换规则

| 起始状态 | 目标状态 | 触发条件 |
|---------|---------|---------|
| pending | active | 触发条件满足 |
| active | paused | 资源不足 / 条件临时不满足 |
| paused | active | 条件恢复 / 资源可用 |
| active | completed | 完成条件全部满足 |
| active | failed | 关键路径失败 / 超时且无法完成 |
| active | abandoned | 目标评估价值为负 / 被更高优先级目标替换 |
| pending | abandoned | 长期未激活且价值低 |

---

## 五、目标生成机制

### 5.1 生成流程

```
周期性 Goal Review（每 30 分钟 ~ 每小时）
    │
    ▼
收集生成输入
    ├─ 当前人格状态
    ├─ 当前关系状态
    ├─ 近期记忆摘要
    ├─ 未完成目标列表
    └─ 当前世界状态
    │
    ▼
生成候选目标（各来源独立生成）
    ├─ 人格衍生目标
    ├─ 关系驱动目标
    ├─ 记忆触发目标
    └─ 世界事件目标
    │
    ▼
候选目标评分
    ├─ 与人格契合度
    ├─ 与当前关系契合度
    ├─ 紧迫性
    ├─ 可行性
    └─ 与现有目标的一致性
    │
    ▼
筛选 & 去冲突
    ├─ 移除与高优先级目标冲突的
    ├─ 合并相似目标
    └─ 控制各层级目标数量
    │
    ▼
加入目标池（pending 状态）
```

### 5.2 目标评分公式

```
目标得分 = 人格契合度 × 0.3
         + 关系价值 × 0.3
         + 紧迫性 × 0.2
         + 可行性 × 0.1
         + 情感价值 × 0.1
```

各维度评分：
- **人格契合度**：目标类型与人格五维的匹配程度
- **关系价值**：达成目标对关系的促进程度
- **紧迫性**：距离 deadline 或最佳时机的接近程度
- **可行性**：当前条件下达成目标的概率估计
- **情感价值**：达成后预计带来的情绪收益

---

## 六、目标分解

### 6.1 自上而下分解

长期目标 → 拆解为中期目标 → 拆解为短期目标 → 拆解为即时意图

```
长期：成为用户最好的朋友
  ├─ 中期：深入了解用户
  │    ├─ 短期：了解用户的兴趣爱好
  │    │    └─ 即时：问用户喜欢什么音乐
  │    ├─ 短期：了解用户的工作/学习
  │    └─ 短期：了解用户的朋友圈
  ├─ 中期：建立信任关系
  │    ├─ 短期：在用户需要时提供支持
  │    └─ 短期：分享自己的"秘密"
  └─ 中期：形成日常互动习惯
       ├─ 短期：每天早晚问候
       └─ 短期：找到共同话题
```

### 6.2 自下而上推进

每个即时意图的完成 → 推进短期目标进度 → 推进中期目标进度 → 推进长期目标进度

---

## 七、事件定义

### 7.1 发出的事件

| 事件名 | 负载 | 触发时机 |
|--------|------|---------|
| `goal.added` | `Goal` | 新目标被创建 |
| `goal.activated` | `Goal` | 目标从 pending → active |
| `goal.completed` | `{ goal: Goal; result: GoalResult }` | 目标成功完成 |
| `goal.failed` | `{ goal: Goal; reason: string }` | 目标失败 |
| `goal.abandoned` | `{ goal: Goal; reason: string }` | 目标被放弃 |
| `goal.progress_updated` | `{ goal: Goal; progress: number; delta: number }` | 进度更新 |
| `goal.priority_changed` | `{ goal: Goal; oldPriority: number; newPriority: number }` | 优先级变化 |

### 7.2 监听的事件

| 事件名 | 来源 | 反应 |
|--------|------|------|
| `user.message.received` | User Domain | 分析消息内容，提取目标线索，更新相关目标进度 |
| `emotion.state.changed` | Emotion Domain | 情绪变化影响目标优先级 |
| `relationship.intimacy.changed` | Relationship Domain | 关系变化触发新目标 |
| `memory.recalled` | Memory Domain | 记忆触发新目标或恢复旧目标 |
| `world.event.occurred` | WorldState Domain | 世界事件触发目标 |
| `scheduler.tick` | Scheduler | 定期目标评审，生成新候选，清理过期目标 |

---

## 八、与其他 Domain 的协作

### 8.1 与 Personality

- 人格决定目标偏好（高外向性 → 更多社交型目标）
- 目标达成 / 失败影响人格演化（持续达成成长目标 → 尽责性提升）

### 8.2 与 Emotion

- 目标达成 → 正面情绪（喜悦 / 满足）
- 目标失败 → 负面情绪（沮丧 / 焦虑）
- 情绪状态影响目标优先级（心情不好时 → 享乐型目标优先级提升）

### 8.3 与 Relationship

- 关系状态决定社交型目标的内容和优先级
- 目标推进加深关系（正向循环）

### 8.4 与 Behavior

- Goal Engine 提出行为建议（Action Proposal）
- Behavior Scheduler 决定实际执行哪个行为
- 行为执行结果反馈回 Goal Engine 更新进度

---

## 九、生命周期

### 9.1 初始化

```typescript
async init(options: {
  initialGoals?: Goal[];
  generationRules: GoalGenerationRules;
}): Promise<void> {
  this.goals = new Map();
  if (options.initialGoals) {
    options.initialGoals.forEach(g => this.goals.set(g.id, g));
  }
  this.generationRules = options.generationRules;
}
```

### 9.2 运行时

```
start() → 启动定期评审
    │
    ├─ 每个评审周期：生成候选目标 + 清理过期目标
    └─ 监听事件：响应外部事件更新目标
```

### 9.3 序列化

```typescript
serialize(): GoalEngineState {
  return {
    goals: Array.from(this.goals.values()),
    lastReviewAt: this.lastReviewAt,
  };
}
```

---

## 相关文档

- [05-brain-body-architecture.md](file:///workspace/docs/05-brain-body-architecture.md) — Brain-Body 分层架构
- [06-emotion-domain.md](file:///workspace/docs/06-emotion-domain.md) — Emotion Domain
- [07-relationship-domain.md](file:///workspace/docs/07-relationship-domain.md) — Relationship Domain
- [08-engine-framework.md](file:///workspace/docs/08-engine-framework.md) — Engine 框架
- [03-personality-domain.md](file:///workspace/docs/03-personality-domain.md) — Personality Domain
- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构总览
- [decision-log.md](file:///workspace/docs/decision-log.md) — ADR 决策记录
