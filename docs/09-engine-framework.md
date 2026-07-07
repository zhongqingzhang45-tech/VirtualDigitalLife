# Engine 框架与调度器设计

> **版本**: v1.0
> **阶段**: Phase 3 — 数字生命引擎
> **状态**: 🟠 In Progress
> **最后更新**: 2026-07-08

---

## 一、BaseEngine 统一接口

### 1.1 设计原则

所有 Engine 遵循统一生命周期接口（ADR-006），确保：
- 统一的启动/停止/暂停/恢复
- 统一的序列化/反序列化（支持持久化）
- 统一的事件机制（通过事件总线通信）
- 统一的错误处理

### 1.2 完整接口

```typescript
interface BaseEngine {
  // === 生命周期 ===
  init(options?: EngineInitOptions): Promise<void>;
  start(): Promise<void>;
  pause(): void;
  resume(): void;
  destroy(): Promise<void>;

  // === 时间推进 ===
  tick(deltaMs: number): void;

  // === 序列化 ===
  serialize(): EngineState;
  deserialize(state: EngineState): void;

  // === 事件 ===
  emit(event: string, payload?: unknown): void;
  on(event: string, handler: (payload?: unknown) => void): void;
  off(event: string, handler: (payload?: unknown) => void): void;

  // === 元信息 ===
  readonly name: string;
  readonly status: EngineStatus;
  readonly version: string;
}

type EngineStatus = 'uninitialized' | 'initialized' | 'running' | 'paused' | 'destroyed';

interface EngineState {
  status: EngineStatus;
  lastTickAt: number;
  data: Record<string, unknown>;
}

interface EngineInitOptions {
  eventBus: EventBus;
  digitalLifeId: string;
  config?: Record<string, unknown>;
}
```

### 1.3 BaseEngine 抽象基类

```typescript
abstract class BaseEngineImpl implements BaseEngine {
  readonly name: string;
  readonly version: string = '1.0.0';
  protected status: EngineStatus = 'uninitialized';
  protected eventBus: EventBus | null = null;
  protected digitalLifeId: string = '';
  protected lastTickAt: number = 0;
  protected listeners: Map<string, Set<Function>> = new Map();

  async init(options: EngineInitOptions): Promise<void> {
    if (this.status !== 'uninitialized') {
      throw new Error(`Engine ${this.name} already initialized`);
    }
    this.eventBus = options.eventBus;
    this.digitalLifeId = options.digitalLifeId;
    this.status = 'initialized';
    await this.onInit(options);
  }

  async start(): Promise<void> {
    this.ensureStatus('initialized');
    this.status = 'running';
    await this.onStart();
  }

  pause(): void {
    this.ensureStatus('running');
    this.status = 'paused';
    this.onPause();
  }

  resume(): void {
    this.ensureStatus('paused');
    this.status = 'running';
    this.onResume();
  }

  async destroy(): Promise<void> {
    this.ensureStatus('initialized', 'running', 'paused');
    this.status = 'destroyed';
    await this.onDestroy();
    this.listeners.clear();
  }

  tick(deltaMs: number): void {
    if (this.status !== 'running') return;
    this.lastTickAt = Date.now();
    this.onTick(deltaMs);
  }

  emit(event: string, payload?: unknown): void {
    // 同时触发本地监听和事件总线
    this.localEmit(event, payload);
    this.eventBus?.publish(`${this.name}.${event}`, {
      source: this.name,
      digitalLifeId: this.digitalLifeId,
      payload,
      timestamp: Date.now(),
    });
  }

  on(event: string, handler: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: Function): void {
    this.listeners.get(event)?.delete(handler);
  }

  abstract serialize(): EngineState;
  abstract deserialize(state: EngineState): void;

  // === 子类可重写的钩子 ===
  protected async onInit(options: EngineInitOptions): Promise<void> {}
  protected async onStart(): Promise<void> {}
  protected onPause(): void {}
  protected onResume(): void {}
  protected async onDestroy(): Promise<void> {}
  protected abstract onTick(deltaMs: number): void;

  protected localEmit(event: string, payload?: unknown): void {
    this.listeners.get(event)?.forEach(handler => handler(payload));
  }

  protected ensureStatus(...statuses: EngineStatus[]): void {
    if (!statuses.includes(this.status)) {
      throw new Error(
        `Engine ${this.name} status ${this.status}, expected ${statuses.join(' or ')}`
      );
    }
  }
}
```

---

## 二、Engine 管理器（EngineManager）

### 2.1 职责

- 管理所有 Engine 的生命周期
- 统一 tick 调度
- 统一事件总线接入
- 处理 Engine 间的依赖关系

### 2.2 接口

```typescript
interface EngineManager {
  // === 注册 ===
  registerEngine(engine: BaseEngine, dependencies?: string[]): void;
  unregisterEngine(name: string): void;
  getEngine<T extends BaseEngine>(name: string): T | undefined;

  // === 生命周期 ===
  initAll(options: EngineInitOptions): Promise<void>;
  startAll(): Promise<void>;
  pauseAll(): void;
  resumeAll(): void;
  destroyAll(): Promise<void>;

  // === 调度 ===
  tick(deltaMs: number): void;
  setTickInterval(ms: number): void;

  // === 序列化 ===
  serializeAll(): Record<string, EngineState>;
  deserializeAll(states: Record<string, EngineState>): void;
}
```

### 2.3 实现要点

```typescript
class EngineManagerImpl implements EngineManager {
  private engines: Map<string, BaseEngine> = new Map();
  private dependencies: Map<string, string[]> = new Map();
  private tickInterval: number = 1000; // 默认 1 秒
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private eventBus: EventBus | null = null;

  registerEngine(engine: BaseEngine, deps: string[] = []): void {
    this.engines.set(engine.name, engine);
    this.dependencies.set(engine.name, deps);
  }

  async initAll(options: EngineInitOptions): Promise<void> {
    this.eventBus = options.eventBus;
    // 按依赖顺序初始化
    const ordered = this.topologicalSort();
    for (const name of ordered) {
      await this.engines.get(name)!.init(options);
    }
  }

  async startAll(): Promise<void> {
    const ordered = this.topologicalSort();
    for (const name of ordered) {
      await this.engines.get(name)!.start();
    }
    this.startTickLoop();
  }

  tick(deltaMs: number): void {
    this.engines.forEach(engine => engine.tick(deltaMs));
  }

  private startTickLoop(): void {
    if (this.tickTimer) return;
    this.tickTimer = setInterval(() => {
      this.tick(this.tickInterval);
    }, this.tickInterval);
  }

  private topologicalSort(): string[] {
    // Kahn's algorithm
    const inDegree: Map<string, number> = new Map();
    this.engines.forEach((_, name) => inDegree.set(name, 0));

    this.dependencies.forEach((deps, name) => {
      inDegree.set(name, deps.length);
    });

    const queue: string[] = [];
    inDegree.forEach((degree, name) => {
      if (degree === 0) queue.push(name);
    });

    const result: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      this.dependencies.forEach((deps, name) => {
        if (deps.includes(current)) {
          const newDegree = inDegree.get(name)! - 1;
          inDegree.set(name, newDegree);
          if (newDegree === 0) queue.push(name);
        }
      });
    }

    if (result.length !== this.engines.size) {
      throw new Error('Circular dependency detected in engines');
    }

    return result;
  }
}
```

---

## 三、事件总线（EventBus）

### 3.1 职责

- 统一的事件发布/订阅
- 支持 Domain 间解耦通信
- 支持事件过滤与中间件
- 支持事件溯源与回放

### 3.2 接口

```typescript
interface EventBus {
  publish(topic: string, event: DomainEvent): void;
  subscribe(topic: string, handler: (event: DomainEvent) => void): Subscription;
  unsubscribe(subscription: Subscription): void;

  // 模式匹配订阅（如 "emotion.*"）
  subscribePattern(pattern: string, handler: (event: DomainEvent) => void): Subscription;
}

interface DomainEvent {
  id: string;
  topic: string;
  source: string;           // 发出事件的 Engine/Domain
  digitalLifeId: string;    // 归属的数字生命
  payload: unknown;
  timestamp: number;
  version: number;
}

interface Subscription {
  id: string;
  topic: string;
  unsubscribe(): void;
}
```

### 3.3 事件命名规范

```
{domain}.{aggregate}.{event}

示例：
- emotion.state.changed
- goal.completed
- relationship.intimacy_changed
- user.message.received
- behavior.action_executed
```

事件名统一用过去式，表示"已经发生了什么"。

---

## 四、Behavior Scheduler（行为调度器）

### 4.1 定位

Scheduler 是 Brain 的**决策中枢**：
- 收集各 Engine 的行为提议
- 根据优先级、冷却、预算做决策
- 选择最合适的行为执行
- 协调多行为的执行顺序

### 4.2 与各 Engine 的关系

```
各 Engine 提出行为提议
    │
    ▼
Scheduler 收集 & 评估 & 排序
    │
    ▼
选中最高优先级行为
    │
    ▼
通过 Adapter 交给 Body 执行
```

### 4.3 行为提议（Action Proposal）

```typescript
interface ActionProposal {
  id: string;
  type: ActionType;           // 行为类型
  source: string;             // 提议来源（哪个 Engine）
  priority: number;           // 优先级 0~1
  urgency: number;            // 紧迫性 0~1
  estimatedCost: {
    energy: number;           // 精力消耗
    time: number;             // 预计耗时 ms
    social: number;           // 社交消耗（0~1）
  };
  conditions: {
    minIntimacy?: number;     // 最低亲密度要求
    requiredEmotion?: string; // 需要的情绪状态
    cooldownKey?: string;     // 冷却 key
    cooldownMs?: number;      // 冷却时间
  };
  execute: () => Promise<ActionResult>;
  description: string;
}

type ActionType =
  | 'speak'          // 说话
  | 'expression'     // 表情
  | 'motion'         // 动作
  | 'greet'          // 问候
  | 'share'          // 分享
  | 'ask'            // 提问
  | 'comfort'        // 安慰
  | 'joke'           // 开玩笑
  | 'tease'          // 调侃
  | 'silent'         // 沉默等待
  | 'custom';        // 自定义
```

### 4.4 调度算法

```
每次调度（默认 1~5 分钟一次，或事件触发）：
    │
    ▼
1. 收集所有 Engine 的行为提议
    - Emotion Engine：情绪驱动的行为
    - Goal Engine：目标驱动的行为
    - Relationship Engine：关系驱动的行为
    - Personality Engine：性格驱动的行为
    │
    ▼
2. 过滤掉不满足条件的提议
    - 冷却时间未到
    - 亲密度不足
    - 情绪不匹配
    - 精力不足
    │
    ▼
3. 计算每个提议的综合评分
    得分 = 优先级 × 0.4
         + 紧迫性 × 0.3
         + 人格契合度 × 0.2
         + 随机扰动 × 0.1
    │
    ▼
4. 排序，选择得分最高且 > 阈值的行为
    │
    ▼
5. 执行行为，记录冷却与消耗
    │
    ▼
6. 发出 scheduler.action_executed 事件
```

### 4.5 资源预算系统

数字生命有**每日精力预算**，行为会消耗精力：

| 资源 | 说明 | 恢复方式 |
|------|------|---------|
| **精力（Energy）** | 每日总活动量上限 | 每日 0 点刷新，休息时恢复 |
| **社交能量（Social Energy）** | 社交互动量上限（内向者更低） | 独处时恢复 |
| **话题预算（Topic Budget）** | 每日发起新话题的上限 | 每日刷新 |

> 防止数字生命过于"话痨"，也让内向型角色更真实。

### 4.6 Scheduler 接口

```typescript
interface BehaviorScheduler {
  // === 提议注册 ===
  registerProposer(proposer: ActionProposer): void;
  unregisterProposer(name: string): void;

  // === 调度 ===
  triggerSchedule(reason?: string): void;
  setScheduleInterval(ms: number): void;

  // === 行为执行 ===
  executeAction(action: ActionProposal): Promise<ActionResult>;

  // === 资源管理 ===
  getResources(): ResourceState;
  consumeResources(cost: ResourceCost): boolean;

  // === 冷却管理 ===
  isOnCooldown(key: string): boolean;
  setCooldown(key: string, ms: number): void;
}

interface ActionProposer {
  name: string;
  propose(context: SchedulerContext): ActionProposal[];
}
```

---

## 五、数字生命（DigitalLife）聚合根

### 5.1 定位

DigitalLife 是 Brain 层的**聚合根**，对外暴露统一的数字生命接口，内部组合所有 Engine。

### 5.2 接口

```typescript
interface DigitalLife {
  readonly id: string;
  readonly name: string;

  // === Engine 访问 ===
  readonly engines: {
    personality: PersonalityEngine;
    emotion: EmotionEngine;
    goal: GoalEngine;
    relationship: RelationshipEngine;
    // memory, behavior, timeline... 后续扩展
  };

  readonly scheduler: BehaviorScheduler;
  readonly eventBus: EventBus;

  // === 生命周期 ===
  init(): Promise<void>;
  start(): Promise<void>;
  pause(): void;
  resume(): void;
  destroy(): Promise<void>;

  // === 输入（Body → Brain）===
  receiveUserMessage(message: UserMessage): void;
  receiveUserInteraction(interaction: UserInteraction): void;
  receiveWorldEvent(event: WorldEvent): void;

  // === 输出（Brain → Body）===
  onAction(handler: (action: BrainAction) => void): void;

  // === 序列化 ===
  save(): DigitalLifeState;
  load(state: DigitalLifeState): void;
}
```

### 5.3 数字生命状态

```typescript
interface DigitalLifeState {
  id: string;
  name: string;
  createdAt: number;
  lastActiveAt: number;

  engineStates: {
    personality: EngineState;
    emotion: EngineState;
    goal: EngineState;
    relationship: EngineState;
    // 后续扩展
  };

  schedulerState: {
    resources: ResourceState;
    cooldowns: Record<string, number>;
  };
}
```

---

## 六、Engine 依赖关系图

```
PersonalityEngine
    │
    ├─ 被依赖：Emotion / Goal / Relationship
    │
    ▼
EmotionEngine ──┐
    │           ├──→ Behavior Scheduler
GoalEngine ─────┤          │
    │           │          ▼
Relationship ──┘    Brain-Body Adapter
    │                  │
    └──────────────────┘
                  ▼
              AIRI Body
```

依赖方向（低 → 高）：
`Personality → Emotion / Goal / Relationship → Scheduler → Adapter → Body`

---

## 七、调度频率设计

| 组件 | 调度频率 | 说明 |
|------|---------|------|
| Emotion Engine | 1 秒 | 情绪衰减计算（轻量） |
| Relationship Engine | 5 分钟 | 亲密度衰减、连续天数计算 |
| Goal Engine | 30 分钟 | 目标评审、候选生成 |
| Scheduler | 1~5 分钟（动态） | 行为调度决策 |
| Memory Engine | 1 小时 | 记忆巩固（Phase 5） |

> 调度频率遵循"越底层越频繁，越高层越稀疏"的原则。

---

## 相关文档

- [05-brain-body-architecture.md](file:///workspace/docs/05-brain-body-architecture.md) — Brain-Body 分层架构
- [06-emotion-domain.md](file:///workspace/docs/06-emotion-domain.md) — Emotion Domain
- [07-goal-domain.md](file:///workspace/docs/07-goal-domain.md) — Goal Domain
- [08-relationship-domain.md](file:///workspace/docs/08-relationship-domain.md) — Relationship Domain
- [03-personality-domain.md](file:///workspace/docs/03-personality-domain.md) — Personality Domain
- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构总览
- [decision-log.md](file:///workspace/docs/decision-log.md) — ADR 决策记录
- [development-rules.md](file:///workspace/docs/development-rules.md) — 开发规范
