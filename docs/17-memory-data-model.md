# 记忆系统数据模型设计

> **版本**: v1.0
> **阶段**: Phase 5 — 记忆系统
> **状态**: 🟠 In Progress
> **最后更新**: 2026-07-08

---

## 一、设计原则

- 遵循 ADR-007 数据库统一字段规范
- 记忆分三层存储：短期（Redis）→ 长期（PostgreSQL + 向量）→ 归档（对象存储）
- 向量检索使用 pgvector 扩展（PostgreSQL 原生，减少依赖）
- 关联关系独立成表，支持高效的关联查询

### 表清单

| 表名 | Domain | 说明 |
|------|--------|------|
| `memories` | Memory | 核心记忆表（长期记忆） |
| `memory_entities` | Memory | 记忆中的实体（人物/地点/事物） |
| `memory_tags` | Memory | 记忆标签（多对多） |
| `memory_associations` | Memory | 记忆关联关系 |
| `memory_summaries` | Memory | 记忆摘要（定期生成） |
| `memory_access_logs` | Memory | 记忆访问日志（用于再巩固计算） |

---

## 二、核心表设计

### 2.1 记忆表（memories）

```sql
CREATE TABLE memories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    digital_life_id UUID NOT NULL,
    
    -- 记忆类型
    memory_type     VARCHAR(16) NOT NULL,        -- episodic / semantic / emotional
    storage_stage   VARCHAR(16) NOT NULL DEFAULT 'longterm', -- shortterm/longterm/archived
    
    -- 内容
    content         TEXT NOT NULL,                -- 记忆原文
    summary         TEXT,                         -- 摘要（压缩后的核心内容）
    
    -- 结构化字段
    entities        VARCHAR(64)[] DEFAULT '{}',  -- 实体名称列表（冗余，便于检索）
    tags            VARCHAR(64)[] DEFAULT '{}',  -- 标签列表
    emotion_tags    VARCHAR(32)[] DEFAULT '{}',  -- 情绪标签
    
    -- 重要性与可访问性
    importance      DECIMAL(4,3) NOT NULL DEFAULT 0.5,  -- 初始重要性 0~1
    accessibility   DECIMAL(4,3) NOT NULL DEFAULT 1.0,  -- 当前可检索性 0~1（随时间衰减）
    access_count    INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    
    -- 时间
    event_time      TIMESTAMPTZ,                  -- 事件发生时间（情景记忆）
    encoded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- 编码时间
    consolidated_at TIMESTAMPTZ,                  -- 巩固时间
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at     TIMESTAMPTZ,                  -- 归档时间
    
    -- 向量嵌入（pgvector）
    embedding       vector(1536),                 -- 文本向量（1536维，OpenAI 兼容）
    
    -- 元数据
    source          VARCHAR(32) NOT NULL,         -- 来源：chat/emotion/goal/relationship/world/...
    related_timeline_event_id UUID,               -- 关联的 Timeline 事件
    metadata        JSONB,                        -- 扩展元数据
    
    -- 约束
    CONSTRAINT chk_memory_type CHECK (memory_type IN ('episodic', 'semantic', 'emotional')),
    CONSTRAINT chk_storage_stage CHECK (storage_stage IN ('shortterm', 'longterm', 'archived'))
);

-- 索引
CREATE INDEX idx_memories_dl_type ON memories (digital_life_id, memory_type, event_time DESC)
    WHERE archived_at IS NULL;

CREATE INDEX idx_memories_importance ON memories (digital_life_id, importance DESC)
    WHERE archived_at IS NULL AND storage_stage = 'longterm';

CREATE INDEX idx_memories_tags ON memories USING GIN (tags);

CREATE INDEX idx_memories_entities ON memories USING GIN (entities);

-- 向量索引（IVFFlat，适合中等规模；超过 100 万条考虑 HNSW）
CREATE INDEX idx_memories_embedding ON memories
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
```

### 2.2 记忆实体表（memory_entities）

```sql
CREATE TABLE memory_entities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    digital_life_id UUID NOT NULL,
    memory_id       UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    
    entity_name     VARCHAR(128) NOT NULL,        -- 实体名称
    entity_type     VARCHAR(32) NOT NULL,         -- person/place/thing/event/concept
    entity_value    TEXT,                         -- 实体值/描述
    
    -- 频率与重要性
    mention_count   INTEGER NOT NULL DEFAULT 1,   -- 被提及次数
    salience        DECIMAL(4,3) NOT NULL DEFAULT 0.5, -- 显著度
    
    first_mentioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_mentioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE (digital_life_id, memory_id, entity_name, entity_type)
);

CREATE INDEX idx_memory_entities_dl_name ON memory_entities (digital_life_id, entity_name);
CREATE INDEX idx_memory_entities_type ON memory_entities (digital_life_id, entity_type);
CREATE INDEX idx_memory_entities_memory ON memory_entities (memory_id);
```

### 2.3 记忆标签表（memory_tags）

```sql
CREATE TABLE memory_tags (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    digital_life_id UUID NOT NULL,
    tag_name        VARCHAR(64) NOT NULL,
    tag_category    VARCHAR(32),                  -- 分类：topic/emotion/person/...
    usage_count     INTEGER NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE (digital_life_id, tag_name)
);

CREATE INDEX idx_memory_tags_dl ON memory_tags (digital_life_id);
```

### 2.4 记忆关联表（memory_associations）

```sql
CREATE TABLE memory_associations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    digital_life_id UUID NOT NULL,
    
    source_memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    target_memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    
    association_type VARCHAR(32) NOT NULL,        -- temporal/semantic/emotional/entity/causal
    strength        DECIMAL(4,3) NOT NULL DEFAULT 0.5, -- 关联强度 0~1
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 确保不重复
    UNIQUE (source_memory_id, target_memory_id, association_type)
);

-- 双向查询索引
CREATE INDEX idx_memory_assoc_source ON memory_associations (source_memory_id, strength DESC);
CREATE INDEX idx_memory_assoc_target ON memory_associations (target_memory_id, strength DESC);
CREATE INDEX idx_memory_assoc_dl_type ON memory_associations (digital_life_id, association_type);
```

### 2.5 记忆摘要表（memory_summaries）

```sql
CREATE TABLE memory_summaries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    digital_life_id UUID NOT NULL,
    
    summary_type    VARCHAR(16) NOT NULL,         -- daily / weekly / monthly / yearly / topic
    period_start    TIMESTAMPTZ NOT NULL,
    period_end      TIMESTAMPTZ NOT NULL,
    
    title           VARCHAR(255),                 -- 摘要标题
    content         TEXT NOT NULL,                -- 摘要内容
    highlights      JSONB,                        -- 高亮记忆 ID 列表
    
    memory_count    INTEGER NOT NULL DEFAULT 0,   -- 涵盖的记忆数量
    embedding       vector(1536),                 -- 摘要向量（用于快速检索）
    
    tags            VARCHAR(64)[] DEFAULT '{}',
    emotion_tags    VARCHAR(32)[] DEFAULT '{}',
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memory_summaries_dl_type ON memory_summaries
    (digital_life_id, summary_type, period_start DESC);
```

### 2.6 记忆访问日志表（memory_access_logs）

```sql
CREATE TABLE memory_access_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    digital_life_id UUID NOT NULL,
    memory_id       UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    
    access_type     VARCHAR(16) NOT NULL,         -- retrieve / update / consolidate / forget
    access_context  VARCHAR(32),                  -- 访问场景：chat/goal/emotion/narrative/...
    relevance_score DECIMAL(4,3),                 -- 本次相关度得分
    
    accessed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 分区表（按月分区，数据量大时可拆）
-- 这里简化为单表 + 索引
CREATE INDEX idx_memory_access_logs_memory ON memory_access_logs (memory_id, accessed_at DESC);
CREATE INDEX idx_memory_access_logs_dl_time ON memory_access_logs (digital_life_id, accessed_at DESC);
```

---

## 三、短期记忆存储（Redis）

### 3.1 数据结构

```
Key 模式：
  shortterm:memories:{dlId}      → Sorted Set（按时间排序，member = memory JSON）
  shortterm:count:{dlId}         → Counter（当前短期记忆数量）

TTL：
  短期记忆 TTL = 24 小时（自动过期）
```

### 3.2 操作流程

```
新记忆 → 写入短期记忆（Redis）
    │
    ├─ 每次检索时同时查短期 + 长期
    │
    └─ 每日巩固（world.day_passed 触发）
        ├─ 筛选重要性 > 阈值的记忆
        ├─ 写入长期记忆表（PostgreSQL）
        ├─ 建立关联关系
        └─ 从 Redis 清除已巩固的记忆
```

---

## 四、向量检索方案（pgvector）

### 4.1 为什么选 pgvector

| 方案 | 优点 | 缺点 |
|------|------|------|
| **pgvector（推荐）** | 与 PostgreSQL 集成，无需额外服务，事务一致性 | 超大规模性能略逊 |
| Milvus / Qdrant | 专业向量数据库，性能强 | 额外运维成本，数据同步复杂 |
| Redis + 向量插件 | 快 | 功能有限，不适合持久化 |

> **决策**：Phase 5 使用 pgvector，简单够用。未来规模上去再考虑迁移到专业向量数据库。

### 4.2 检索 SQL 示例

```sql
-- 语义相似度检索（余弦距离）
SELECT 
    id,
    content,
    memory_type,
    importance,
    1 - (embedding <=> query_embedding) AS similarity
FROM memories
WHERE 
    digital_life_id = :dlId
    AND archived_at IS NULL
    AND storage_stage = 'longterm'
ORDER BY embedding <=> query_embedding
LIMIT :limit;

-- 混合检索：语义 + 重要性 + 时效性
SELECT 
    id,
    content,
    memory_type,
    (
        (1 - (embedding <=> query_embedding)) * 0.4 +  -- 语义相似度
        importance * 0.2 +                              -- 重要性
        accessibility * 0.2 +                           -- 可访问性
        (CASE WHEN event_time > NOW() - INTERVAL '7 days' 
              THEN 0.2 ELSE 0.1 END)                   -- 时效性
    ) AS score
FROM memories
WHERE 
    digital_life_id = :dlId
    AND archived_at IS NULL
ORDER BY score DESC
LIMIT :limit;
```

---

## 五、数据访问模式

### 5.1 高频查询

| 查询场景 | 频率 | 使用索引 |
|---------|------|---------|
| 语义检索相关记忆 | 高 | embedding 向量索引 |
| 按标签检索 | 中 | GIN(tags) |
| 按时间范围检索 | 中 | (digital_life_id, event_time) |
| 获取关联记忆 | 中 | memory_associations 双向索引 |
| 获取重要记忆 | 低 | (digital_life_id, importance DESC) |

### 5.2 写入模式

| 数据 | 写入频率 | 写入方式 |
|------|---------|---------|
| 短期记忆 | 高（每次对话） | Redis 写入 |
| 长期记忆 | 中（每日巩固） | 批量写入 PostgreSQL |
| 关联关系 | 中 | 巩固时批量建立 |
| 访问日志 | 高 | 异步写入，可批量 |
| 记忆摘要 | 低（每日/每周） | 定时任务生成 |

---

## 六、缓存策略

```
L1: 工作记忆（内存）
   └─ 当前对话上下文，最近 10 条
   └─ 延迟 < 1ms

L2: 短期记忆（Redis）
   └─ 最近 24 小时的记忆
   └─ 延迟 1~5ms

L3: 长期记忆（PostgreSQL + pgvector）
   └─ 所有巩固后的记忆 + 向量索引
   └─ 延迟 10~50ms

L4: 归档记忆（对象存储 / 冷存储）
   └─ 超过 1 年、重要性 < 0.3 的记忆
   └─ 延迟 100~500ms
```

---

## 相关文档

- [15-memory-domain.md](file:///workspace/docs/15-memory-domain.md) — Memory Domain 详细设计
- [16-narrative-domain.md](file:///workspace/docs/16-narrative-domain.md) — Narrative Domain 初版
- [13-timeline-domain.md](file:///workspace/docs/13-timeline-domain.md) — Timeline Domain
- [10-digital-life-data-model.md](file:///workspace/docs/10-digital-life-data-model.md) — 数字生命引擎数据模型
- [14-community-data-model.md](file:///workspace/docs/14-community-data-model.md) — 社区系统数据模型
- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构总览
- [decision-log.md](file:///workspace/docs/decision-log.md) — ADR 决策记录
