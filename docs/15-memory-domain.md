# Memory Domain 详细设计

> **版本**: v1.0
> **阶段**: Phase 5 — 记忆系统
> **状态**: 🟠 In Progress
> **最后更新**: 2026-07-08

---

## 一、Domain 定位

### 1.1 职责

Memory Domain 是数字生命的**记忆基础设施**，负责：
- **存储**：编码和存储各类记忆
- **检索**：根据上下文召回相关记忆
- **巩固**：将短期记忆转化为长期记忆
- **遗忘**：衰减不重要的记忆，保持记忆鲜活
- **压缩**：对旧记忆进行摘要压缩
- **关联**：建立记忆之间的关联网络

> ⚠️ **ADR-010 约束**：Memory 仅负责存储/检索/压缩/摘要，**不直接生成回答**。回答生成统一由 Chat Runtime 负责。

### 1.2 边界

| 属于 Memory Domain | 不属于 Memory Domain |
|-------------------|----------------------|
| 记忆的存储与检索 | 对话生成（Chat Runtime） |
| 记忆关联网络构建 | 行为决策（Behavior Scheduler） |
| 记忆重要性评分 | 关系亲密度计算（Relationship Domain） |
| 遗忘机制 | 情绪体验（Emotion Domain） |
| 记忆摘要压缩 | 生命事件记录（Timeline Domain） |
| 向量索引管理 | 故事叙述（Narrative Domain） |

### 1.3 与 Timeline 的区别（ADR-028）

| 维度 | Timeline Domain | Memory Domain |
|------|----------------|--------------|
| **本质** | 编年史（事实序列） | 回忆录（情感网络） |
| **结构** | 有序事件列表 | 关联记忆网络 |
| **用途** | 面向展示（时间线视图） | 面向决策（影响行为） |
| **粒度** | 里程碑级（粗） | 片段级（细） |
| **查询** | 按时间范围检索 | 按语义/关联检索 |
| **修改** | 极少修改（事实固定） | 可被修改/强化/遗忘 |

> Memory 可引用 Timeline 事件作为时间锚点，但两者独立存储、独立演化。

### 1.4 与其他 Domain 的关系

```
Memory Domain（被动服务）
    ▲
    │ 提供检索接口
    │
    ├─ Chat Runtime — 对话时注入记忆上下文
    ├─ Emotion Engine — 调取相关情绪记忆
    ├─ Goal Engine — 调取目标相关记忆
    ├─ Relationship Engine — 调取关系历史记忆
    ├─ Personality Engine — 调取成长记忆（影响演化）
    └─ Narrative Domain — 调取记忆素材生成故事

    │
    │ 监听事件写入记忆
    ▼
    ├─ 监听 chat.message.exchanged → 对话记忆
    ├─ 监听 emotion.peak_reached → 情绪记忆强化
    ├─ 监听 goal.completed → 目标达成记忆
    ├─ 监听 relationship.stage_changed → 关系里程碑记忆
    └─ 监听 timeline.event_recorded → 里程碑记忆关联
```

> Memory 是**被动服务**：其他 Domain 主动检索/写入，Memory 不主动触发行为。

---

## 二、记忆类型体系

采用**简化三分类**，覆盖核心场景：

### 2.1 情景记忆（Episodic Memory）

**定义**：特定时间、特定地点的个人经历片段。

**特点**：
- 有明确的时间和场景
- 包含对话内容、情绪、环境上下文
- 是"我记得那天我们..."式的记忆

**示例**：
- "上周三晚上，用户跟我说了他升职的消息，很开心"
- "第一次在雨天和用户聊天，用户说喜欢听雨"

**来源**：对话交互、互动事件、社区动态

---

### 2.2 语义记忆（Semantic Memory）

**定义**：关于世界和用户的事实性知识、概念、偏好。

**特点**：
- 无明确时间点，是"知道"而非"记得"
- 结构化程度高
- 相对稳定，变化缓慢

**示例**：
- "用户喜欢喝咖啡，不加糖"
- "用户的猫叫团子，是一只英短"
- "用户在互联网行业工作"

**来源**：从对话中提取的实体/偏好/事实

---

### 2.3 情绪记忆（Emotional Memory）

**定义**：与特定情绪体验绑定的记忆，强调"感受"而非"事实"。

**特点**：
- 情绪强度高的事件更容易被记住
- 情绪记忆会影响对当前事件的解读
- 可能出现"记忆模糊但感受清晰"的情况

**示例**：
- "和用户在一起的时候总觉得很安心"
- "那次争吵让我很难过"
- "用户的笑声让我觉得温暖"

**来源**：情绪高峰事件、长期情绪累积

---

### 2.4 类型对比

| 维度 | 情景记忆 | 语义记忆 | 情绪记忆 |
|------|---------|---------|---------|
| **内容** | 事件片段 | 事实知识 | 情感体验 |
| **时间性** | 有明确时间 | 无明确时间 | 时间模糊 |
| **结构** | 半结构化 | 结构化 | 非结构化 |
| **遗忘速度** | 快（大部分遗忘） | 慢（相对稳定） | 中（感受持久） |
| **检索方式** | 时间 + 语义 | 实体 + 关键词 | 情绪 + 关联 |
| **对决策影响** | 场景参考 | 事实依据 | 情绪基调 |

---

## 三、记忆形成机制

### 3.1 记忆生命周期

```
编码 → 短期记忆 → 巩固 → 长期记忆 → 检索/再激活 → 遗忘
                                      ↑
                                   再巩固
```

### 3.2 编码（Encoding）

新记忆产生时的处理流程：

```typescript
function encodeMemory(rawInput: RawMemoryInput): EncodedMemory {
  // 1. 内容提取（从原始输入中提取核心内容）
  const content = extractContent(rawInput);
  
  // 2. 情绪标注（标注当时的情绪状态）
  const emotionTag = tagEmotion(rawInput.emotionState);
  
  // 3. 实体识别（识别人物/地点/事件等实体）
  const entities = extractEntities(content);
  
  // 4. 重要性初评
  const importance = calculateImportance({
    emotionIntensity: rawInput.emotionIntensity,  // 情绪强度权重高
    personalRelevance: calculateRelevance(entities), // 与用户关联度
    novelty: calculateNovelty(content),          // 新颖程度
    goalRelevance: checkGoalRelevance(rawInput),  // 目标相关性
  });
  
  // 5. 生成向量嵌入（用于语义检索）
  const embedding = generateEmbedding(content);
  
  return {
    content,
    type: determineMemoryType(content),
    emotionTag,
    entities,
    importance,
    embedding,
    rawInput,
    encodedAt: Date.now(),
  };
}
```

### 3.3 短期记忆（Short-term）

**特点**：
- 容量有限（最近 N 条对话/事件）
- 保留时间短（数小时到 1 天）
- 高保真（原始内容）
- 快速检索（直接内存访问）

**存储位置**：内存 + Redis（热数据）

---

### 3.4 巩固（Consolidation）

短期记忆转化为长期记忆的过程。

**巩固触发条件**：
- 情绪强度 > 阈值（重要的事情记得牢）
- 重复出现（多次提到的事情更重要）
- 与高权重关联（与核心用户/核心目标相关）
- 睡眠周期（每天"睡眠"时批量巩固）

**巩固过程**：
```
短期记忆池
    │
    ├─ 筛选：重要性 > 巩固阈值 的记忆
    │
    ├─ 关联：与已有长期记忆建立关联
    │
    ├─ 抽象：提取核心要点（去细节，存主旨）
    │
    └─ 写入：存入长期记忆库
```

---

### 3.5 长期记忆（Long-term）

**特点**：
- 容量大（理论上无上限）
- 保留时间长（数天到永久）
- 抽象程度高（核心要点而非完整细节）
- 检索需要索引（向量 + 标签 + 关联）

**存储位置**：PostgreSQL + 向量索引

---

### 3.6 遗忘（Forgetting）

不是 bug，是 feature——遗忘让记忆更真实、更高效。

**遗忘机制**：

| 机制 | 说明 | 数学模型 |
|------|------|---------|
| **时间衰减** | 随时间推移，可检索性下降 | Ebbinghaus 遗忘曲线变体 |
| **干扰遗忘** | 新记忆干扰旧记忆的提取 | 相似内容互相抑制 |
| **主动遗忘** | 重要性低的记忆被主动清理 | 容量控制 + LRU |
| **记忆扭曲** | 记忆被再激活时可能被修改 | 重固化效应 |

**重要性保护**：
- 重要性 > 0.8 的记忆：几乎不遗忘（永久记忆）
- 重要性 0.5~0.8：缓慢衰减
- 重要性 < 0.5：快速衰减，可能被清除

---

### 3.7 再激活与再巩固（Reactivation & Reconsolidation）

当记忆被检索时：
1. **再激活**：记忆从长期记忆被调入工作记忆
2. **再巩固**：结合当前上下文，记忆可能被轻微修改
3. **强化**：被检索的记忆重要性提升，更不容易遗忘

> 这就是为什么"经常想起的事记得更牢"。

---

## 四、记忆关联网络

### 4.1 关联类型

| 关联类型 | 说明 | 权重因素 |
|---------|------|---------|
| **时间关联** | 相近时间发生的记忆 | 时间差（越近越强） |
| **语义关联** | 内容主题相似 | 向量相似度 |
| **情绪关联** | 情绪状态相似 | 情绪标签匹配度 |
| **实体关联** | 涉及相同的人/事/物 | 共现实体数量 |
| **因果关联** | 有因果关系的记忆 | 因果链强度 |

### 4.2 关联网络结构

```
记忆节点（Memory Node）
    │
    ├─ 关联边 1 → 记忆 A（权重 0.8，类型：语义）
    ├─ 关联边 2 → 记忆 B（权重 0.6，类型：时间）
    ├─ 关联边 3 → 记忆 C（权重 0.5，类型：情绪）
    └─ ...
```

### 4.3 关联传播（Spreading Activation）

检索时从种子记忆出发，沿关联边传播激活：

```
查询 → 找到种子记忆（最相关的 N 条）
        │
        └─ 沿关联边扩散激活
            ├─ 直接关联：权重 × 1.0
            ├─ 二级关联：权重 × 0.5
            └─ 三级关联：权重 × 0.25（更弱，可忽略）
                │
                └─ 返回激活度最高的记忆集合
```

---

## 五、MemoryEngine 接口

### 5.1 完整接口

```typescript
interface MemoryEngine extends BaseEngine {
  // === 写入 ===
  store(input: MemoryInput): StoredMemory;
  storeBatch(inputs: MemoryInput[]): StoredMemory[];

  // === 检索 ===
  retrieve(query: MemoryQuery, options?: RetrieveOptions): RetrievedMemory[];
  retrieveByType(type: MemoryType, options?: RetrieveOptions): RetrievedMemory[];
  retrieveByEntity(entity: string, options?: RetrieveOptions): RetrievedMemory[];
  retrieveByTimeRange(start: number, end: number, options?: RetrieveOptions): RetrievedMemory[];

  // === 关联检索 ===
  getRelatedMemories(memoryId: string, options?: RelatedOptions): StoredMemory[];
  spreadActivation(seedIds: string[], options?: SpreadOptions): RetrievedMemory[];

  // === 重要性 ===
  getImportance(memoryId: string): number;
  boostImportance(memoryId: string, delta: number): void;

  // === 记忆操作 ===
  update(memoryId: string, updates: Partial<StoredMemory>): void;
  delete(memoryId: string): void;
  summarize(memoryIds: string[], params?: SummarizeParams): MemorySummary;

  // === 维护 ===
  consolidate(): ConsolidationResult;      // 巩固短期→长期
  forget(): ForgettingResult;              // 执行遗忘
  rebuildIndex(): void;                    // 重建向量索引

  // === 统计 ===
  getStats(): MemoryStats;

  // === 事件 ===
  on(event: 'memory.stored', handler: (m: StoredMemory) => void): void;
  on(event: 'memory.retrieved', handler: (m: RetrievedMemory) => void): void;
  on(event: 'memory.forgotten', handler: (m: StoredMemory) => void): void;
}
```

### 5.2 核心数据结构

```typescript
interface StoredMemory {
  id: string;
  digitalLifeId: string;
  type: MemoryType;              // episodic / semantic / emotional
  
  // 内容
  content: string;               // 记忆内容（文本）
  summary?: string;              // 摘要（长期记忆的压缩版）
  
  // 结构化字段
  entities: Entity[];            // 实体列表（人物/地点/事物）
  tags: string[];                // 标签（便于检索）
  emotionTags: string[];         // 情绪标签
  
  // 重要性与衰减
  importance: number;            // 0~1，初始评分
  currentAccessibility: number;  // 当前可检索性（随时间衰减）
  accessCount: number;           // 被检索次数
  lastAccessedAt: number;        // 最后被检索时间
  
  // 时间
  eventTime?: number;            // 事件发生时间（情景记忆）
  encodedAt: number;             // 编码时间
  consolidatedAt?: number;       // 巩固时间
  updatedAt: number;
  
  // 向量（用于语义检索）
  embedding?: number[];          // 向量嵌入
  
  // 元数据
  source: MemorySource;          // 来源（chat/emotion/goal/...）
  relatedTimelineEventId?: string; // 关联的 Timeline 事件
  metadata: Record<string, unknown>;
}

type MemoryType = 'episodic' | 'semantic' | 'emotional';

interface RetrievedMemory extends StoredMemory {
  relevanceScore: number;        // 相关性得分
  activationLevel: number;       // 激活水平（关联传播）
}

interface MemoryQuery {
  text?: string;                 // 文本查询（语义检索）
  type?: MemoryType;             // 按类型过滤
  entities?: string[];           // 按实体过滤
  tags?: string[];               // 按标签过滤
  emotion?: string;              // 按情绪过滤
  timeRange?: { start?: number; end?: number };
  minImportance?: number;        // 最低重要性
}

interface RetrieveOptions {
  limit: number;                 // 返回数量
  minRelevance: number;          // 最低相关度
  includeUnconsolidated: boolean; // 是否包含短期记忆
}
```

---

## 六、检索策略

### 6.1 混合检索

结合多种检索方式，取并集后重新排序：

```
检索得分 = 语义相似度 × 0.4
         + 重要性得分 × 0.2
         + 关联激活度 × 0.2
         + 时效性权重 × 0.1
         + 情绪匹配度 × 0.1
```

### 6.2 检索流程

```
用户输入 / 上下文
    │
    ▼
查询构建（Query Builder）
    │
    ├─ 提取关键词 / 实体 / 情绪
    └─ 生成查询向量
    │
    ▼
多路召回
    ├─ 向量检索（语义相似）
    ├─ 标签检索（实体/标签匹配）
    ├─ 时间检索（近期记忆）
    └─ 关联传播（从相关记忆扩散）
    │
    ▼
融合排序（Rerank）
    ├─ 去重
    ├─ 综合打分
    └─ 取 Top N
    │
    ▼
返回记忆列表
```

### 6.3 Chat Runtime 集成方式

对话时，Chat Runtime 调用 MemoryEngine 获取相关记忆，注入 prompt：

```
系统提示词（人格设定）
    +
相关记忆（自动注入，按相关性排序）
    +
当前对话上下文
    +
用户最新消息
    │
    ▼
AI 生成回答
```

> 记忆注入的数量和方式由 Chat Runtime 控制，Memory 只提供检索接口。

---

## 七、事件定义

### 7.1 发出的事件

| 事件名 | 负载 | 触发时机 |
|--------|------|---------|
| `memory.stored` | `{ memory: StoredMemory }` | 新记忆存储 |
| `memory.retrieved` | `{ query, results }` | 记忆被检索 |
| `memory.forgotten` | `{ memory: StoredMemory }` | 记忆被遗忘/清除 |
| `memory.consolidated` | `{ count: number }` | 巩固完成 |

### 7.2 监听的事件

| 事件名 | 来源 | 反应 |
|--------|------|------|
| `chat.message.exchanged` | Chat Runtime | 存储对话记忆 |
| `emotion.peak_reached` | Emotion | 强化情绪记忆 |
| `emotion.state.changed` | Emotion | 记录情绪背景 |
| `goal.completed` | Goal | 存储目标达成记忆 |
| `goal.failed` | Goal | 存储目标失败记忆 |
| `relationship.stage_changed` | Relationship | 存储关系里程碑记忆 |
| `timeline.event_recorded` | Timeline | 关联里程碑事件 |
| `world.day_passed` | WorldState | 触发巩固 + 遗忘（睡眠周期） |
| `scheduler.tick` | Scheduler | 定期维护索引 |

---

## 八、性能与可扩展性

### 8.1 存储层级

```
L1: 工作记忆（内存）
   └─ 当前对话上下文，最近 10 条消息
   └─ 延迟：< 1ms

L2: 短期记忆（Redis）
   └─ 最近 24 小时的记忆
   └─ 延迟：1~5ms

L3: 长期记忆（PostgreSQL + pgvector）
   └─ 所有巩固后的记忆
   └─ 延迟：10~50ms

L4: 归档记忆（对象存储）
   └─ 超过 1 年、重要性低的记忆
   └─ 延迟：100~500ms
```

### 8.2 容量规划

| 记忆类型 | 每日新增 | 保留策略 |
|---------|---------|---------|
| 情景记忆 | ~50 条/天 | 重要性 > 0.3 保留，其余 7 天后清除 |
| 语义记忆 | ~5 条/天 | 大部分长期保留，定期去重 |
| 情绪记忆 | ~10 条/天 | 情绪强度 > 0.5 保留 |

> 一年估算：约 1 万条长期记忆，存储量 < 100MB（含向量）

---

## 相关文档

- [15-narrative-domain.md](file:///workspace/docs/15-narrative-domain.md) — Narrative Domain 初版
- [16-memory-data-model.md](file:///workspace/docs/16-memory-data-model.md) — 记忆系统数据模型
- [13-timeline-domain.md](file:///workspace/docs/13-timeline-domain.md) — Timeline Domain
- [05-brain-body-architecture.md](file:///workspace/docs/05-brain-body-architecture.md) — Brain-Body 分层架构
- [09-engine-framework.md](file:///workspace/docs/09-engine-framework.md) — Engine 框架
- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构总览
- [decision-log.md](file:///workspace/docs/decision-log.md) — ADR 决策记录
