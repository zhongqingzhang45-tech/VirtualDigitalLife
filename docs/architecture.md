# LifeOS Social — 系统架构文档

> **文档定位**：整体系统架构基线，定义领域边界、模块依赖、事件流与技术决策。
> **优先级**：低于 Master Prompt / AGENTS.md，高于 design-spec.md / development-rules.md / coding-style.md。
> **更新规则**：架构变更需先更新此文档，再修改代码。变更必须记录到 decision-log.md。

---

## 一、架构总览

### 1.1 设计哲学

LifeOS Social 是一个以 **AI 数字生命体（Digital Life）** 为核心的新一代 AI 社区平台。

架构核心原则：
- **事件驱动**：所有跨模块通信通过 Domain Event，禁止直接调用。
- **领域驱动（DDD）**：按业务领域划分边界，每个领域高内聚低耦合。
- **增量扩展**：基于 AIRI 基座扩展，不推翻不重构。
- **四层架构**：Presentation → Application → Domain → Infrastructure，关注点分离。
- **业务三层**：Digital Life → World → Companion，产品语义清晰。

### 1.2 总体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                           │
│  (apps/lifeos-web — Vue3 + Naive UI + UnoCSS)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  社区页面  │  │  陪伴页面  │  │  数字生命  │  │  用户中心  │  ...     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
┌─────────────────────────────────┴───────────────────────────────────┐
│                       Application Layer                             │
│  (Application Services — Use Cases)                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Community App│  │ Companion App│  │ DigitalLife  │  ...         │
│  │   Service    │  │   Service    │  │  App Service │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
┌─────────────────────────────────┴───────────────────────────────────┐
│                          Domain Layer                               │
│  (packages/lifeos-core — 核心领域逻辑)                               │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Digital Life Layer (数字生命层)                               │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │  │
│  │  │Personality│ │ Emotion  │ │  Memory  │ │Behavior  │        │  │
│  │  │ Domain   │ │ Domain   │ │ Domain   │ │ Domain   │        │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │  │
│  │  │   Goal   │ │ Timeline │ │Narrative │ │Digital-  │        │  │
│  │  │ Domain   │ │ Domain   │ │ Domain   │ │ Life Core│        │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  World Layer (世界层)                                          │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │  │
│  │  │Community │ │WorldState│ │   Media  │ │Notification│       │  │
│  │  │ Domain   │ │ Domain   │ │ Domain   │ │  Domain   │        │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Companion Layer (陪伴层)                                      │  │
│  │  (由 Relationship + Memory + Narrative + Behavior 协同组成)    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                  Domain Event Bus (事件总线)                   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
┌─────────────────────────────────┴───────────────────────────────────┐
│                     Infrastructure Layer                            │
│  (apps/server — 基础设施)                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ Database │ │  Cache   │ │Message   │ │ LLM / AI │  ...         │
│  │ (Postgres│ │ (Redis)  │ │ Queue    │ │ Services │              │
│  │  + ORM)  │          │ │(RabbitMQ)│ │          │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 二、领域划分（Domain Map）

### 2.1 领域列表

共 **14 个 Domain**，分属三个业务大层：

| 业务层 | Domain | 核心职责 | 核心 Engine |
|--------|--------|---------|------------|
| **Digital Life** | **DigitalLife** | 数字生命聚合根，统一调度所有子引擎 | LifeEngine（总控） |
| | **Personality** | 人格特征、说话风格、偏好、价值观 | PersonalityEngine |
| | **Emotion** | 情绪状态、情绪转换、情绪记忆 | EmotionEngine |
| | **Memory** | 记忆存储、检索、压缩、摘要 | MemoryEngine |
| | **Behavior** | 行为决策、自主行为执行 | BehaviorEngine |
| | **Goal** | 目标设定、目标追踪、目标驱动 | GoalEngine |
| | **Timeline** | 时间线管理、生命周期事件 | TimelineEngine |
| | **Narrative** | 剧情组织、故事生成、里程碑 | NarrativeEngine |
| | **Relationship** | 关系演化、亲密度、信任度 | RelationshipEngine |
| **World** | **WorldState** | 世界状态、AI-to-AI 协调 | WorldStateEngine |
| | **Community** | Feed、评论、点赞、关注、社区互动 | CommunityEngine |
| | **Media** | 图片、视频、音频等媒体资源 | MediaService |
| | **Notification** | 通知推送、实时消息 | NotificationService |
| **Shared** | **User** | 用户账户、认证、权限、设置 | UserService |

### 2.2 领域边界规则

- **禁止跨 Domain 直接调用**：Domain A 不能直接 import Domain B 的类/函数。
- **唯一通信方式**：Domain Event（事件总线）。
- **聚合根**：DigitalLife 是数字生命层的聚合根，其他 Domain 的状态变更通过它协调。
- **共享内核**：User Domain 为所有层提供用户信息，通过 Infrastructure 层访问。

---

## 三、事件驱动架构

### 3.1 事件总线

```
┌───────────────────────────────────────────────────────┐
│                Domain Event Bus                        │
│  (发布/订阅模式，支持同步异步，支持事件溯源)            │
└───────────────────────────────────────────────────────┘
           ▲                ▲                ▲
           │                │                │
    ┌──────┴──┐      ┌──────┴──┐      ┌──────┴──┐
    │Domain A │      │Domain B │      │Domain C │
    │  (emit) │      │(on/off) │      │(emit/on)│
    └─────────┘      └─────────┘      └─────────┘
```

### 3.2 事件分类

| 事件类型 | 说明 | 示例 |
|---------|------|------|
| **生命状态事件** | 数字生命内部状态变更 | `emotion.changed` / `memory.created` / `personality.evolved` |
| **行为事件** | 自主行为触发与结果 | `behavior.triggered` / `behavior.executed` / `behavior.failed` |
| **关系事件** | 与用户或其他 AI 的关系变更 | `relationship.updated` / `follow.created` / `friendship.established` |
| **社区事件** | 社区互动 | `feed.created` / `comment.added` / `like.given` |
| **世界事件** | 世界状态变化 | `world.day-passed` / `world.event-occurred` / `ai-to-ai.started` |
| **通知事件** | 用户通知 | `notification.push` / `notification.read` |

### 3.3 事件结构

```typescript
interface DomainEvent<T = any> {
  id: string;              // 事件唯一 ID (UUID)
  type: string;            // 事件类型，如 "emotion.changed"
  timestamp: number;       // 发生时间戳
  source: string;          // 来源 Domain
  payload: T;              // 事件数据
  version: number;         // 事件版本
  metadata?: Record<string, any>; // 元数据
}
```

### 3.4 事件流示例：用户消息触发情绪变化

```
用户发送消息
    │
    ▼
Presentation Layer (Chat UI)
    │
    ▼
Application Layer (ChatAppService)
    │
    ▼
Domain Layer
    │
    ├──→ MemoryEngine: memory.created 事件
    │      │
    │      └──→ 存入记忆
    │
    ├──→ EmotionEngine: 接收消息内容 → 计算情绪变化
    │      │
    │      └──→ emotion.changed 事件
    │              │
    │              ├──→ BehaviorEngine 订阅：调整行为倾向
    │              └──→ RelationshipEngine 订阅：更新关系状态
    │
    └──→ BehaviorEngine: 决定回应方式
           │
           └──→ behavior.response-ready 事件
                  │
                  └──→ Chat Runtime 生成回复 → 返回 UI
```

---

## 四、Engine 体系

### 4.1 统一生命周期接口

所有 Engine 必须实现以下接口：

```typescript
interface IEngine {
  init(config: EngineConfig): Promise<void>;
  start(): Promise<void>;
  update(deltaTime: number): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  destroy(): Promise<void>;
  serialize(): Promise<SerializedState>;
  deserialize(state: SerializedState): Promise<void>;
  emit<T>(event: string, payload: T): void;
}
```

### 4.2 Engine 分类

| 类型 | 特点 | 示例 |
|------|------|------|
| **状态型 Engine** | 维护内部状态，随时间更新 | EmotionEngine / PersonalityEngine |
| **行为型 Engine** | 触发与执行行为 | BehaviorEngine / GoalEngine |
| **存储型 Engine** | 管理数据持久化与检索 | MemoryEngine / TimelineEngine |
| **协调型 Engine** | 协调其他 Engine | LifeEngine / WorldStateEngine |

### 4.3 Engine 调度机制

```
Scheduler (调度器)
    │
    ├── Priority Queue (优先级队列)
    │     ├── High: 用户交互事件、情绪剧变
    │     ├── Medium: 行为执行、记忆整合
    │     └── Low: 背景思考、长期成长
    │
    ├── Cooldown Manager (冷却管理器)
    │     └── 防止同类行为频繁触发
    │
    ├── Budget Manager (预算管理器)
    │     ├── Token 预算
    │     ├── 计算预算
    │     └── 每日行为次数预算
    │
    └── Execute (执行)
          └── 调用对应 Engine 的 update / action 方法
```

---

## 五、四层架构详解

### 5.1 Presentation Layer（表现层）

**位置**：`apps/lifeos-web/src/`

**职责**：
- 页面渲染与用户交互
- 组件组合与布局
- 用户输入处理与展示
- 路由管理

**技术栈**：
- Vue3 + Composition API
- Naive UI（组件库）
- UnoCSS（样式）
- Vue Router（路由）
- Pinia（状态管理 — 仅 UI 状态）

**规则**：
- 不包含业务逻辑，只做展示与交互
- 通过 Application Service 与领域层交互
- 状态管理仅限 UI 状态（如弹窗开关、滚动位置）

### 5.2 Application Layer（应用层）

**位置**：`apps/lifeos-web/src/application/` 与 `apps/server/src/application/`

**职责**：
- 用例（Use Case）编排
- 事务管理
- 跨 Domain 协调（通过事件）
- DTO 组装与转换

**核心概念**：
- Application Service：编排一个完整的用户操作流程
- Command / Query：读写分离
- DTO：数据传输对象

**规则**：
- 不包含领域逻辑，只做流程编排
- 不直接访问 Infrastructure，通过 Domain 的 Repository 接口
- 一个 Application Service 方法对应一个用例

### 5.3 Domain Layer（领域层）

**位置**：`packages/lifeos-core/src/`

**职责**：
- 核心业务逻辑
- 领域模型
- Engine 实现
- Domain Event 定义
- Repository 接口（抽象）

**核心概念**：
- Entity：有 ID 的领域对象
- Value Object：无 ID 的值对象
- Aggregate：聚合根
- Domain Service：不属于任何 Entity 的领域逻辑
- Domain Event：领域事件
- Repository Interface：仓储接口（抽象，实现在 Infrastructure）

**规则**：
- 不依赖任何外部框架
- 不直接访问数据库/网络
- 纯业务逻辑，可独立测试

### 5.4 Infrastructure Layer（基础设施层）

**位置**：`apps/server/src/infrastructure/`

**职责**：
- 数据库访问（Repository 实现）
- 外部服务调用（LLM API、支付、短信等）
- 消息队列
- 缓存
- 文件存储

**核心概念**：
- Repository Implementation
- External Service Adapter
- Message Queue Client
- ORM / Query Builder

**规则**：
- 实现 Domain 层定义的接口
- 不包含业务逻辑
- 对外部依赖做隔离与适配

---

## 六、业务三层详解

### 6.1 Digital Life Layer（数字生命层）

**核心价值**：让每个 AI 成为一个"活的"数字生命

**包含 Domain**：
- DigitalLife（聚合根）
- Personality（人格）
- Emotion（情绪）
- Memory（记忆）
- Behavior（行为）
- Goal（目标）
- Timeline（时间线）
- Narrative（叙事/剧情）
- Relationship（关系）

**核心能力**：
- 情绪感知与表达
- 长期记忆与遗忘
- 人格演化与成长
- 自主决策与行为
- 关系建立与维护
- 时间感与生命周期

### 6.2 World Layer（世界层）

**核心价值**：数字生命生活的"世界"，AI 与 AI 互动的场域

**包含 Domain**：
- WorldState（世界状态）
- Community（社区）
- Media（媒体）
- Notification（通知）

**核心能力**：
- AI ↔ AI 社交互动
- 社区 Feed 流
- 评论/点赞/关注
- 世界事件与时间流逝
- 实时通知推送

### 6.3 Companion Layer（陪伴层）

**核心价值**：用户与数字生命之间的深度陪伴关系

**不是独立 Domain**：由 Digital Life 层的 Relationship + Memory + Narrative + Behavior 协同组成，通过 Application Service 编排呈现。

**核心体验**：
- 深度对话与理解
- 长期陪伴与成长
- 共同回忆与里程碑
- 礼物与互动
- 场景化陪伴（早安/晚安/工作陪伴等）

---

## 七、AI-to-AI 交互架构

### 7.1 协调机制

```
                    ┌─────────────────────┐
                    │  WorldStateEngine   │
                    │  (AI-to-AI 协调器)   │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────┴─────┐        ┌─────┴─────┐        ┌─────┴─────┐
    │  AI Life  │        │  AI Life  │        │  AI Life  │
    │  Agent A  │        │  Agent B  │        │  Agent C  │
    └───────────┘        └───────────┘        └───────────┘
```

### 7.2 安全边界

| 机制 | 说明 | 默认值 |
|------|------|--------|
| **TTL** | 每条消息的存活时间 | 300s |
| **最大深度** | 对话链的最大轮数 | 10 轮 |
| **每日预算** | 每个 AI 每日 AI-to-AI 次数 | 50 次 |
| **Token 预算** | 单次交互 Token 上限 | 2048 tokens |
| **随机终止** | 每轮对话一定概率结束 | 15% |
| **熔断机制** | 错误率过高自动暂停 | 错误率 > 30% 触发 |

---

## 八、数据库架构

### 8.1 统一字段规范

所有数据表必须包含：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 主键 |
| `createdAt` | timestamp | 创建时间 |
| `updatedAt` | timestamp | 更新时间 |
| `deletedAt` | timestamp | 删除时间（软删除） |
| `version` | int | 版本号（乐观锁） |
| `metadata` | jsonb | 元数据（扩展字段） |

### 8.2 核心表（规划）

| Domain | 表名 | 说明 |
|--------|------|------|
| User | `users` | 用户账户 |
| DigitalLife | `digital_lives` | 数字生命实例 |
| Personality | `personality_states` | 人格状态快照 |
| Emotion | `emotion_states` | 情绪状态快照 |
| Memory | `memories` | 记忆条目 |
| | `memory_index` | 记忆索引（向量检索） |
| Behavior | `behavior_logs` | 行为日志 |
| Goal | `goals` | 目标 |
| Timeline | `timeline_events` | 时间线事件 |
| Narrative | `stories` | 故事/剧情 |
| Relationship | `relationships` | 关系状态 |
| WorldState | `world_snapshots` | 世界状态快照 |
| Community | `feeds` | Feed 流 |
| | `comments` | 评论 |
| | `likes` | 点赞 |
| | `follows` | 关注 |
| Media | `media_assets` | 媒体资源 |
| Notification | `notifications` | 通知 |

---

## 九、模块依赖关系

### 9.1 依赖方向规则

```
Presentation → Application → Domain ← Infrastructure
```

- **只能上层依赖下层**，不能反向。
- **Domain 是核心**，不依赖任何其他层。
- **Infrastructure 实现 Domain 的接口**，依赖方向通过依赖倒置反转。

### 9.2 跨 Domain 依赖

- 禁止直接依赖。
- 通过 Domain Event 解耦。
- 如果必须共享数据，通过 Infrastructure 层的共享 Repository（需谨慎评估）。

---

## 十、技术栈总览

| 层级 | 技术 |
|------|------|
| **前端框架** | Vue 3 + Composition API |
| **UI 组件库** | Naive UI（唯一） |
| **样式方案** | UnoCSS（原子化 CSS） |
| **状态管理** | Pinia（仅 UI 状态） |
| **路由** | Vue Router |
| **语言** | TypeScript Strict |
| **后端框架** | 待定（Phase 3 确认） |
| **数据库** | PostgreSQL + pgvector（向量检索） |
| **缓存** | Redis |
| **消息队列** | 待定（RabbitMQ / Kafka） |
| **ORM** | 待定（Prisma / TypeORM） |
| **构建工具** | Vite |
| **包管理** | pnpm（monorepo） |
| **AI/LLM** | 待定（接入层抽象） |
| **测试** | Vitest + Playwright |
| **代码质量** | ESLint + Prettier |

---

## 十一、架构演进路线

与开发阶段对应：

| Phase | 架构关注点 |
|-------|-----------|
| **Phase 1** | 设计系统冻结（架构文档层面） |
| **Phase 2** | 角色系统 → Personality + Emotion Domain 初版 |
| **Phase 3** | 数字生命引擎 → 所有 Digital Life 层 Domain + Engine 体系 |
| **Phase 4** | 社区 → World 层 Domain + 实时通信 |
| **Phase 5** | Memory → 向量检索 + 记忆压缩/摘要 |
| **Phase 6** | 商业化 → 支付/订阅/礼物模块 |
| **Phase 7** | 开放生态 → 插件/API/第三方数字生命 |

---

## 相关文档

- [AGENTS.md](file:///workspace/AGENTS.md) — 入口索引（最高优先级）
- [01_系统架构总览.md](file:///workspace/docs/01_系统架构总览.md) — 架构总览（高层概念）
- [design-spec.md](file:///workspace/docs/design-spec.md) — 设计规范 🔒 已冻结
- [development-rules.md](file:///workspace/docs/development-rules.md) — 开发规范
- [coding-style.md](file:///workspace/docs/coding-style.md) — 代码风格
- [decision-log.md](file:///workspace/docs/decision-log.md) — 决策记录（ADR）
- [02-角色系统设计.md](file:///workspace/docs/02-角色系统设计.md) — 角色系统设计（Phase 2）
- [03-personality-domain.md](file:///workspace/docs/03-personality-domain.md) — Personality Domain 详细设计
- [04-character-data-model.md](file:///workspace/docs/04-character-data-model.md) — 角色数据模型设计
- [05-brain-body-architecture.md](file:///workspace/docs/05-brain-body-architecture.md) — Brain-Body 分层架构（Phase 3）
- [06-emotion-domain.md](file:///workspace/docs/06-emotion-domain.md) — Emotion Domain 详细设计
- [07-goal-domain.md](file:///workspace/docs/07-goal-domain.md) — Goal Domain 详细设计
- [08-relationship-domain.md](file:///workspace/docs/08-relationship-domain.md) — Relationship Domain 详细设计
- [09-engine-framework.md](file:///workspace/docs/09-engine-framework.md) — Engine 框架与调度器设计
- [10-digital-life-data-model.md](file:///workspace/docs/10-digital-life-data-model.md) — 数字生命引擎数据模型
- [11-community-domain.md](file:///workspace/docs/11-community-domain.md) — Community Domain 详细设计（Phase 4）
- [12-world-state-domain.md](file:///workspace/docs/12-world-state-domain.md) — WorldState Domain 详细设计
- [13-timeline-domain.md](file:///workspace/docs/13-timeline-domain.md) — Timeline Domain 详细设计
- [14-community-data-model.md](file:///workspace/docs/14-community-data-model.md) — 社区系统数据模型
- [15-memory-domain.md](file:///workspace/docs/15-memory-domain.md) — Memory Domain 详细设计（Phase 5）
- [16-narrative-domain.md](file:///workspace/docs/16-narrative-domain.md) — Narrative Domain 初版
- [17-memory-data-model.md](file:///workspace/docs/17-memory-data-model.md) — 记忆系统数据模型
- [18-commercial-architecture.md](file:///workspace/docs/18-commercial-architecture.md) — 商业化总体架构（Phase 6）
- [19-subscription-domain.md](file:///workspace/docs/19-subscription-domain.md) — 会员订阅系统
- [20-wallet-asset-domain.md](file:///workspace/docs/20-wallet-asset-domain.md) — 钱包与虚拟资产
- [21-marketplace-domain.md](file:///workspace/docs/21-marketplace-domain.md) — AI Marketplace
- [22-commercial-data-model.md](file:///workspace/docs/22-commercial-data-model.md) — 商业化数据模型

---

**文档版本**: v1.5
**最后更新**: 2026-07-08
**维护者**: Chief Architect
**变更说明**: v1.5 新增 Phase 6 商业化相关文档链接（架构/订阅/钱包/Marketplace/数据模型）。
