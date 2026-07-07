# LifeEngine Runtime 设计

> **文档定位**：Phase 8.1 LifeEngine 运行时设计（调度中心）
> **前置文档**：[09-engine-framework.md](file:///workspace/docs/09-engine-framework.md) · [29-life-core-mvp-architecture.md](file:///workspace/docs/29-life-core-mvp-architecture.md)
> **相关文档**：[31-life-memory-implementation.md](file:///workspace/docs/31-life-memory-implementation.md) · [32-emotion-runtime.md](file:///workspace/docs/32-emotion-runtime.md)
> **最后更新**: 2026-07-08

---

## 1. 模块定位

### 1.1 LifeEngine 是什么

LifeEngine 是数字生命的**调度中心**，它本身不做具体业务（记忆、情绪都有专门的 Domain），而是：
- 接收外部事件（用户消息、系统事件等）
- 协调各个 Domain 协同工作
- 维护生命状态的一致性
- 管理生命周期

**比喻**：LifeEngine 是心脏，各个 Domain 是器官。心脏不做思考，但它让所有器官协同运转。

### 1.2 MVP 范围

| 功能 | MVP | 后续 Phase |
|------|-----|-----------|
| 事件接收与分发 | ✅ | - |
| Domain 协调调度 | ✅ | - |
| 生命状态快照 | ✅ | - |
| 生命周期管理（init/destroy） | ✅ | - |
| 自主行为调度 | ❌ | Phase 8.2 |
| 目标系统 | ❌ | Phase 8.2 |
| 行为规划 | ❌ | Phase 9+ |
| 多生命协同 | ❌ | Phase 9+ |

---

## 2. 核心架构

### 2.1 引擎分层

```
┌─────────────────────────────────────────┐
│          LifeEngine (调度层)             │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │     Event Bus (事件总线)         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌────────────┐  ┌────────────────┐    │
│  │ Scheduler  │  │ State Manager  │    │
│  │ 调度器     │  │ 状态管理器     │    │
│  └────────────┘  └────────────────┘    │
└─────────────────────────────────────────┘
     │          │          │          │
     ▼          ▼          ▼          ▼
  Memory    Emotion   Personality   Character
  Domain    Domain    Domain        Domain
```

### 2.2 统一生命周期接口

遵循 [09-engine-framework.md](file:///workspace/docs/09-engine-framework.md) 的 9 方法生命周期：

```typescript
interface ILifeEngine {
  // 初始化
  init(digitalLifeId: string): Promise<void>;
  
  // 启动
  start(): Promise<void>;
  
  // 停止
  stop(): Promise<void>;
  
  // 销毁
  destroy(): Promise<void>;
  
  // 暂停
  pause(): Promise<void>;
  
  // 恢复
  resume(): Promise<void>;
  
  // 处理事件
  handleEvent(event: LifeEvent): Promise<void>;
  
  // 获取状态
  getState(): Promise<LifeStateSnapshot>;
  
  // Tick（心跳）
  tick(deltaTime: number): Promise<void>;
}
```

**MVP 简化**：
- `init` / `handleEvent` / `getState` / `destroy` 是必须实现的
- `start` / `stop` / `pause` / `resume` 可以先留空或简单实现
- `tick` MVP 不做（没有自主行为）

---

## 3. 核心数据结构

### 3.1 LifeStateSnapshot（生命状态快照）

```typescript
interface LifeStateSnapshot {
  digitalLifeId: string;
  
  // 各 Domain 状态
  character: CharacterState;
  emotion: EmotionState;
  memory: MemorySummary;
  personality: PersonalityProfile;
  
  // 引擎状态
  engineStatus: 'idle' | 'processing' | 'sleeping';
  lastEventTime: Date;
  totalInteractionCount: number;
  
  // 统计
  stats: {
    memoryCount: number;
    daysAlive: number;
    consecutiveDays: number;  // 连续互动天数
  };
  
  snapshotTime: Date;
}

interface MemorySummary {
  totalCount: number;
  lastMemoryTime?: Date;
  recentMemoryPreviews: string[];  // 最近记忆摘要
}
```

### 3.2 LifeEvent（事件基类）

```typescript
interface LifeEvent {
  id: string;
  type: LifeEventType;
  digitalLifeId: string;
  timestamp: Date;
  payload: Record<string, any>;
  
  source: 'user' | 'system' | 'ai' | 'scheduled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

enum LifeEventType {
  // 用户相关
  USER_MESSAGE_RECEIVED = 'user_message_received',
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
  
  // 记忆相关
  MEMORY_SAVED = 'memory_saved',
  MEMORY_RETRIEVED = 'memory_retrieved',
  
  // 情绪相关
  EMOTION_CHANGED = 'emotion_changed',
  
  // 生命周期
  LIFE_CREATED = 'life_created',
  LIFE_ACTIVATED = 'life_activated',
  LIFE_DORMANT = 'life_dormant',
  
  // 定时
  DAILY_TICK = 'daily_tick',
  HOURLY_TICK = 'hourly_tick',
}
```

---

## 4. 核心流程

### 4.1 初始化流程

```
用户创建数字生命
    ↓
DigitalLifeCreated 事件
    ↓
LifeEngine.init(digitalLifeId)
    │
    ├─ 1. 加载 Character 数据
    ├─ 2. 加载 Personality 配置
    ├─ 3. 初始化 Emotion 基线
    ├─ 4. 初始化 Memory（空）
    ├─ 5. 注册事件监听器
    └─ 6. 保存初始状态快照
    ↓
发布 LifeInitialized 事件
```

### 4.2 用户消息处理流程 ⭐

这是 MVP 最核心的流程：

```
用户发送消息
    │
    ▼
ChatController
    │
    ▼
LifeAppService
    │
    ▼
LifeEngine.handleEvent(UserMessageReceived)
    │
    ├─ Step 1: 消息预处理
    │     ├─ 过滤敏感词
    │     └─ 提取基本信息
    │
    ├─ Step 2: 记忆检索（生成回复前）
    │     ├─ 调用 MemoryRetriever.retrieve()
    │     └─ 得到 Top-K 相关记忆
    │
    ├─ Step 3: 情绪更新（从记忆）
    │     ├─ 调用 EmotionService.updateFromMemories()
    │     └─ 记忆影响当前情绪
    │
    ├─ Step 4: 记忆编码（保存这条新消息）
    │     ├─ 调用 MemoryEncoder.encodeFromUserMessage()
    │     └─ 发布 MemorySaved 事件
    │
    ├─ Step 5: 情绪更新（从当前消息）
    │     ├─ 调用 EmotionService.updateFromEvent()
    │     └─ 发布 EmotionChanged 事件
    │
    ├─ Step 6: 构建回复上下文
    │     ├─ 人格风格
    │     ├─ 当前情绪
    │     └─ 相关记忆
    │
    ├─ Step 7: 调用 LLM 生成回复
    │
    ├─ Step 8: 保存状态快照
    │     └─ 更新 lastEventTime / interactionCount
    │
    └─ Step 9: 返回 AI 回复
    │
    ▼
用户收到回复
```

### 4.3 状态快照生成

每次重要事件后保存快照，用于：
- 前端展示"生命状态"
- 回溯历史状态
- 后续做数据驱动的行为分析

```typescript
async takeSnapshot(digitalLifeId: string, reason: string): Promise<LifeStateSnapshot> {
  const [character, emotion, memoryStats, personality] = await Promise.all([
    this.characterService.getById(digitalLifeId),
    this.emotionService.getCurrentState(digitalLifeId),
    this.memoryService.getStats(digitalLifeId),
    this.personalityService.getProfile(digitalLifeId),
  ])
  
  const snapshot: LifeStateSnapshot = {
    digitalLifeId,
    character: this.buildCharacterState(character),
    emotion,
    memory: memoryStats,
    personality,
    engineStatus: 'idle',
    lastEventTime: new Date(),
    totalInteractionCount: await this.getInteractionCount(digitalLifeId),
    stats: {
      memoryCount: memoryStats.totalCount,
      daysAlive: this.calculateDaysAlive(character.birthTime),
      consecutiveDays: await this.calculateConsecutiveDays(digitalLifeId),
    },
    snapshotTime: new Date(),
  }
  
  await this.snapshotRepository.save(snapshot)
  return snapshot
}
```

---

## 5. 事件总线（Event Bus）

### 5.1 设计原则

- Domain 之间**不直接调用**，通过事件通信
- LifeEngine 是事件的协调者
- 事件异步处理，不阻塞主流程

### 5.2 事件流转图

```
UserMessageReceived
    │
    ├─→ MemoryDomain: encodeAndSave()
    │      └─→ MemorySaved
    │             └─→ LifeEngine: 记录状态
    │
    ├─→ EmotionDomain: updateFromEvent()
    │      └─→ EmotionChanged
    │             └─→ LifeEngine: 记录状态
    │
    └─→ LifeEngine: 生成回复 + 保存快照
```

### 5.3 MVP 实现方式

使用 NestJS 内置的 EventEmitterModule：

```typescript
// 发布事件
this.eventEmitter.emit('user.message.received', event)

// 监听事件
@OnEvent('user.message.received')
async handleUserMessage(event: UserMessageEvent) {
  // ...
}
```

---

## 6. 引擎实例管理

### 6.1 实例池

MVP 阶段每个请求创建临时实例即可，不需要常驻内存：

```
用户请求 → 加载数据 → 处理事件 → 保存 → 释放
```

后续 Phase 有自主行为时，才需要常驻实例 + 实例池。

### 6.2 生命周期钩子

```typescript
@Injectable()
export class LifeEngineManager {
  private engines = new Map<string, LifeEngine>()

  async getEngine(digitalLifeId: string): Promise<LifeEngine> {
    let engine = this.engines.get(digitalLifeId)
    if (!engine) {
      engine = await this.createEngine(digitalLifeId)
      this.engines.set(digitalLifeId, engine)
    }
    return engine
  }
  
  // 闲置一段时间后销毁，释放资源
  // MVP 可以先不做
}
```

---

## 7. API 设计

### 7.1 发送消息（核心 API）

```http
POST /api/life/chat/send
Authorization: Bearer <token>

{
  "digitalLifeId": "dl_abc123",
  "message": "最近压力好大",
  "messageId": "msg_xxx"  // 幂等
}
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "reply": "怎么了？愿意和我说说吗？",
    "replyId": "reply_xxx",
    "emotionSnapshot": {
      "joy": 35,
      "trust": 42,
      "concern": 78,
      "sadness": 20,
      "curiosity": 55
    },
    "memoryCount": 42
  }
}
```

### 7.2 获取生命状态

```http
GET /api/life/state/:digitalLifeId
```

### 7.3 获取状态历史

```http
GET /api/life/state/:digitalLifeId/history?days=7
```

---

## 8. 性能与可靠性

### 8.1 性能考虑

| 问题 | 影响 | 应对 |
|------|------|------|
| LLM 调用慢 | 用户等待时间长 | 1) 流式输出；2) 记忆检索和情绪计算并行 |
| 记忆检索慢 | 延迟增加 | 1) pgvector 索引；2) 缓存热点记忆 |
| 状态快照频繁写入 | DB 压力大 | 1) 重要事件才快照；2) 异步写入 |

### 8.2 错误处理

```
处理用户消息时出错
    │
    ├─ Memory 编码失败 → 记录日志，不影响回复
    ├─ 情绪更新失败 → 记录日志，不影响回复
    └─ LLM 调用失败 → 返回兜底回复 + 告警
```

**原则**：非核心功能失败不能影响用户对话体验。

---

## 相关文档

- **MVP 架构总览**：[29-life-core-mvp-architecture.md](file:///workspace/docs/29-life-core-mvp-architecture.md)
- **Engine 框架设计**：[09-engine-framework.md](file:///workspace/docs/09-engine-framework.md)
- **数据模型**：[34-life-core-data-model.md](file:///workspace/docs/34-life-core-data-model.md)
- **Memory 实现**：[31-life-memory-implementation.md](file:///workspace/docs/31-life-memory-implementation.md)
- **Emotion Runtime**：[32-emotion-runtime.md](file:///workspace/docs/32-emotion-runtime.md)

---

**文档版本**: v1.0
**创建日期**: 2026-07-08
**维护者**: Chief Architect
**对应 Phase**: Phase 8.1 Life Core MVP
