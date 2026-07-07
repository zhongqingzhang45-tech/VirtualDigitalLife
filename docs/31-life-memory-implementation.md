# Life Memory 实现设计

> **文档定位**：Phase 8.1 Memory Domain 运行时设计（MVP 核心 ⭐）
> **前置文档**：[15-memory-domain.md](file:///workspace/docs/15-memory-domain.md) · [29-life-core-mvp-architecture.md](file:///workspace/docs/29-life-core-mvp-architecture.md)
> **后续文档**：[32-emotion-runtime.md](file:///workspace/docs/32-emotion-runtime.md) · [33-life-engine-runtime.md](file:///workspace/docs/33-life-engine-runtime.md)
> **最后更新**: 2026-07-08

---

## 1. 模块定位

### 1.1 Memory Domain 在 MVP 中的地位

**Memory 是 LifeOS MVP 的灵魂模块。**

没有记忆，就没有"生命感"。用户之所以觉得"这是一个生命"，核心原因是：
> "TA 记得我。"

所以 Memory Domain 是 Phase 8.1 的**第一优先级**，也是验证 MVP 是否成功的关键。

### 1.2 MVP 范围

| 功能 | MVP | 后续 Phase |
|------|-----|-----------|
| 记忆编码（LLM 提取结构化信息） | ✅ | - |
| 记忆存储（PostgreSQL + pgvector） | ✅ | - |
| 语义检索（向量相似度） | ✅ | - |
| 时间检索（近期记忆） | ✅ | - |
| 重要性加权 | ✅ | - |
| 混合检索（语义 + 时间 + 重要性） | ✅ | - |
| 记忆遗忘 | ❌ | Phase 8.2 |
| 记忆重构 / 整合 | ❌ | Phase 9+ |
| 情景记忆 vs 语义记忆分层 | ❌ | Phase 9+ |
| 记忆可视化 / 时间线 | ❌ | Phase 8.2 |

---

## 2. 核心模型

### 2.1 Memory 实体

```typescript
interface Memory {
  id: string;                    // UUID
  digitalLifeId: string;         // 所属数字生命 ID
  userId: string;                // 所属用户 ID（冗余，方便查询）
  
  type: MemoryType;              // 记忆类型
  source: MemorySource;          // 来源
  importance: number;            // 重要性评分（0-1）
  
  // 内容
  content: string;               // 记忆内容（自然语言摘要）
  rawContent?: string;           // 原始内容（完整对话消息等）
  
  // 情感标签
  emotionTags: string[];         // 情绪标签：['stress', 'tired']
  emotionIntensity: number;      // 情绪强度（0-1）
  
  // 实体提取
  entities: MemoryEntity[];      // 提取的实体：人物、地点、事件
  
  // 时间信息
  eventTime?: Date;              // 事件发生时间（如果提及）
  recordedAt: Date;              // 记录时间
  
  // 检索辅助
  embedding: number[];           // 向量嵌入（pgvector 使用）
  
  // 元数据
  accessCount: number;           // 被检索次数
  lastAccessedAt?: Date;         // 最后被检索时间
  
  createdAt: Date;
  updatedAt: Date;
}

enum MemoryType {
  USER_MESSAGE = 'user_message',       // 用户说的话（摘要）
  USER_STATE = 'user_state',           // 用户状态：开心、压力大、生病等
  LIFE_EVENT = 'life_event',           // 生命事件：生日、纪念日等
  SYSTEM_OBSERVATION = 'system_observation',  // 系统观察到的变化
  AI_RESPONSE = 'ai_response',         // AI 的重要回复
}

enum MemorySource {
  CHAT = 'chat',                       // 对话中提取
  USER_INPUT = 'user_input',           // 用户主动记录
  SYSTEM = 'system',                   // 系统生成
}

interface MemoryEntity {
  type: 'person' | 'place' | 'event' | 'thing' | 'date';
  value: string;
  confidence: number;                  // 置信度（0-1）
}
```

### 2.2 为什么这样设计

| 字段 | 作用 |
|------|------|
| `type` | 区分记忆类型，检索时可按类型过滤 |
| `importance` | 重要性评分，高重要性记忆优先被检索 |
| `emotionTags` | 情绪标签，配合 Emotion Domain 使用 |
| `entities` | 实体提取，做精确匹配和知识图谱（后续） |
| `embedding` | 向量嵌入，语义检索的基础 |
| `accessCount` | 访问次数，可用于记忆强化（后续） |

---

## 3. 记忆编码（Memory Encoding）⭐

### 3.1 编码流程

```
用户原始消息
    │
    ▼
  预处理
    │
    ├─ 过滤无意义内容（"哈哈哈"、"嗯"等）
    ├─ 合并短时间内的连续消息
    └─ 基础 NLP 处理（分词、实体识别）
    │
    ▼
  LLM 编码（结构化提取）
    │
    ├─ type: 这条消息属于什么类型？
    ├─ content: 一句话摘要
    ├─ importance: 重要性评分（0-1）
    ├─ emotionTags: 情绪标签
    ├─ emotionIntensity: 情绪强度
    └─ entities: 提取实体
    │
    ▼
  生成 Embedding（向量嵌入）
    │
    ▼
  写入数据库（事务保证一致性）
    │
    ▼
  发布 MemorySaved 事件
```

### 3.2 LLM 编码 Prompt 设计

```
你是一个记忆编码专家，负责将用户的对话提取为结构化的记忆。

用户消息：
"""
{user_message}
"""

上下文：
- 当前情绪状态：{current_emotion}
- 近期记忆摘要：{recent_memory_summary}

请提取以下信息，以 JSON 格式返回：

{
  "type": "user_state | user_message | life_event | system_observation",
  "content": "一句话摘要，不超过 50 字",
  "importance": 0.0-1.0,
  "emotionTags": ["tag1", "tag2"],
  "emotionIntensity": 0.0-1.0,
  "entities": [
    {"type": "person|place|event|thing|date", "value": "...", "confidence": 0.8}
  ],
  "worthRemembering": true|false
}

评分标准：
- importance: 影响用户生活的程度、情感强度、时效性
- worthRemembering: false 表示这条消息不值得存为记忆
```

### 3.3 重要性评分规则（辅助校准 LLM）

| 类型 | 基准重要性 | 示例 |
|------|-----------|------|
| 日常闲聊 | 0.1 - 0.3 | "今天天气不错" |
| 一般状态描述 | 0.3 - 0.5 | "今天有点累" |
| 重要状态 | 0.5 - 0.7 | "最近工作压力很大" |
| 重大事件 | 0.7 - 0.9 | "我升职了" / "我分手了" |
| 人生里程碑 | 0.9 - 1.0 | "我结婚了" / "我有孩子了" |

### 3.4 编码降级策略

LLM 不稳定，需要降级：

```
LLM 编码成功？
    ├─ 是 → 使用 LLM 结果 + 校验
    └─ 否 → 规则引擎 fallback
              ├─ 关键词匹配（"压力"→ stress, "开心"→ happy）
              ├─ 长度启发（越长可能越重要）
              ├─ 实体提取用简单规则
              └─ importance 默认给 0.3
```

---

## 4. 记忆检索（Memory Retrieval）⭐⭐

### 4.1 混合检索策略

MVP 采用 **三路召回 + 融合排序** 的策略：

```
当前对话上下文
    │
    ▼
┌─────────────────────────────────────────────┐
│              三路召回                        │
│                                              │
│  1. 语义检索（向量相似度）                   │
│     → 找"相关"的记忆                         │
│                                              │
│  2. 时间检索（近期记忆）                     │
│     → 找"最近"的记忆                         │
│                                              │
│  3. 重要性检索（高分记忆）                   │
│     → 找"重要"的记忆                         │
└─────────────────────────────────────────────┘
    │
    ▼
  去重 + 融合排序（RRF 算法）
    │
    ▼
  Top-K 记忆（默认 5-10 条）
    │
    ▼
  相关性校验（可选，防止不相关记忆干扰）
    │
    ▼
  注入对话上下文
```

### 4.2 语义检索（pgvector）

```sql
-- 余弦相似度搜索
SELECT 
  m.*,
  1 - (m.embedding <=> query_embedding) AS similarity
FROM memory m
WHERE 
  m.digital_life_id = :digitalLifeId
  AND m.importance >= 0.2  -- 过滤掉太不重要的
ORDER BY m.embedding <=> query_embedding
LIMIT 20;
```

### 4.3 时间衰减函数

时间越近，权重越高：

```
time_weight = e^(-days_passed / time_half_life)

time_half_life = 7 天（半衰期）
```

| 时间 | 时间权重 |
|------|---------|
| 今天 | 1.0 |
| 1 天前 | 0.90 |
| 3 天前 | 0.74 |
| 7 天前 | 0.50 |
| 14 天前 | 0.25 |
| 30 天前 | 0.05 |

### 4.4 融合排序（RRF - Reciprocal Rank Fusion）

```
final_score = sum( 1 / (k + rank_i) )

k = 60（经验值）
rank_i = 第 i 路召回中的排名
```

三路召回各取 Top 20，融合后取 Top 5-10。

### 4.5 记忆注入格式

检索到的记忆，格式化后注入到 LLM 的 system prompt 中：

```
相关记忆（按相关度排序）：
1. [3天前] 用户状态 - 用户最近工作压力很大，经常加班
   情绪: stress  重要性: 0.85

2. [7天前] 生活事件 - 用户说这周末要去杭州旅游
   情绪: excited  重要性: 0.6

3. [1天前] 用户消息 - 用户说昨晚没睡好
   情绪: tired  重要性: 0.4
```

---

## 5. 核心服务设计

### 5.1 MemoryEncoderService

```typescript
@Injectable()
export class MemoryEncoderService {
  constructor(
    private llmGateway: LlmGateway,
    private memoryRepository: MemoryRepository,
  ) {}

  async encodeFromUserMessage(
    digitalLifeId: string,
    message: string,
    context: EncodingContext,
  ): Promise<Memory | null> {
    // 1. 预处理
    const cleaned = this.preprocess(message)
    if (!this.isWorthRemembering(cleaned)) {
      return null
    }

    // 2. LLM 编码
    let encoded: EncodedMemory
    try {
      encoded = await this.llmEncode(cleaned, context)
    } catch (e) {
      // 3. 规则 fallback
      encoded = this.ruleBasedEncode(cleaned)
    }

    if (!encoded.worthRemembering) {
      return null
    }

    // 4. 生成 embedding
    const embedding = await this.llmGateway.embed(encoded.content)

    // 5. 保存
    const memory = await this.memoryRepository.create({
      digitalLifeId,
      ...encoded,
      embedding,
      source: MemorySource.CHAT,
    })

    // 6. 发布事件
    this.eventBus.publish(new MemorySavedEvent(memory))

    return memory
  }
}
```

### 5.2 MemoryRetrieverService

```typescript
@Injectable()
export class MemoryRetrieverService {
  constructor(
    private memoryRepository: MemoryRepository,
    private llmGateway: LlmGateway,
  ) {}

  async retrieve(
    digitalLifeId: string,
    query: string,
    options: RetrieveOptions = {},
  ): Promise<Memory[]> {
    const { topK = 10, minImportance = 0.2 } = options

    // 1. 生成 query embedding
    const queryEmbedding = await this.llmGateway.embed(query)

    // 2. 三路召回
    const [semanticResults, recentResults, importantResults] = await Promise.all([
      this.semanticSearch(digitalLifeId, queryEmbedding, 20, minImportance),
      this.recentSearch(digitalLifeId, 20, minImportance),
      this.importantSearch(digitalLifeId, 20),
    ])

    // 3. RRF 融合排序
    const merged = this.rrfFusion([semanticResults, recentResults, importantResults])

    // 4. 取 Top-K
    return merged.slice(0, topK)
  }
}
```

---

## 6. API 设计

### 6.1 获取记忆列表

```http
GET /api/memory/:digitalLifeId?page=1&pageSize=20&type=user_state
```

### 6.2 获取单条记忆详情

```http
GET /api/memory/:digitalLifeId/:memoryId
```

### 6.3 手动添加记忆

```http
POST /api/memory/:digitalLifeId
{
  "type": "life_event",
  "content": "今天是我们认识 100 天",
  "importance": 0.8,
  "eventTime": "2026-07-08T00:00:00Z"
}
```

### 6.4 修改记忆（标注、编辑重要性等）

```http
PATCH /api/memory/:digitalLifeId/:memoryId
{
  "importance": 0.9,
  "content": "修正后的内容"
}
```

---

## 7. 质量保障策略

### 7.1 记忆质量风险

记忆质量直接决定"生命感"的体验，必须严格保障：

| 风险 | 影响 | 应对策略 |
|------|------|---------|
| 记忆编码错误 | AI 记错了，用户觉得奇怪 | 1) 重要记忆可人工编辑；2) 编码结果做置信度校验 |
| 检索到不相关记忆 | AI 回答跑偏 | 1) 融合排序确保多维度；2) 相关性阈值过滤 |
| 记忆太多干扰对话 | AI 过度回忆，回答不自然 | 1) Top-K 限制数量；2) 重要性过滤；3) 注入时做摘要 |
| 重复记忆 | 同一件事存了多条 | 1) 编码前做相似度去重；2) 同一事件合并 |

### 7.2 A/B 测试指标

上线后重点观察：
- **记忆召回准确率**：人工评估检索结果相关性
- **用户"被记住"感知**：通过问卷或行为数据
- **对话自然度**：记忆注入是否影响对话流畅性
- **留存率**：有记忆 vs 无记忆的用户留存差异

---

## 相关文档

- **MVP 架构总览**：[29-life-core-mvp-architecture.md](file:///workspace/docs/29-life-core-mvp-architecture.md)
- **Memory Domain 设计**：[15-memory-domain.md](file:///workspace/docs/15-memory-domain.md)
- **数据模型**：[34-life-core-data-model.md](file:///workspace/docs/34-life-core-data-model.md)
- **Emotion Runtime**：[32-emotion-runtime.md](file:///workspace/docs/32-emotion-runtime.md)
- **LifeEngine Runtime**：[33-life-engine-runtime.md](file:///workspace/docs/33-life-engine-runtime.md)

---

**文档版本**: v1.0
**创建日期**: 2026-07-08
**维护者**: Chief Architect
**对应 Phase**: Phase 8.1 Life Core MVP
