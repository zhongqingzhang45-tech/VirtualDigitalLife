# Life Core 数据模型设计

> **文档定位**：Phase 8.1 Life Core MVP 数据库设计
> **前置文档**：[29-life-core-mvp-architecture.md](file:///workspace/docs/29-life-core-mvp-architecture.md) · [architecture.md](file:///workspace/docs/architecture.md)
> **相关文档**：[30-character-runtime.md](file:///workspace/docs/30-character-runtime.md) · [31-life-memory-implementation.md](file:///workspace/docs/31-life-memory-implementation.md) · [32-emotion-runtime.md](file:///workspace/docs/32-emotion-runtime.md)
> **最后更新**: 2026-07-08

---

## 1. 数据库选型

### 1.1 主数据库：PostgreSQL 15+

| 特性 | 原因 |
|------|------|
| **pgvector 扩展** | 向量存储，避免引入单独的向量数据库 |
| **JSONB** | 存储非结构化数据（人格配置、实体等） |
| **事务** | 记忆写入 + 向量写入一致性保证 |
| **成熟稳定** | 社区生态完善，运维成本低 |

### 1.2 命名规范

遵循 [development-rules.md](file:///workspace/docs/development-rules.md) 中的数据库命名规范：
- 表名：snake_case，复数形式
- 字段名：snake_case
- 主键：id (UUID)
- 外键：{table_singular}_id
- 时间字段：created_at, updated_at

### 1.3 统一字段（遵循 ADR-007）

每张表必须包含：
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
deleted_at TIMESTAMPTZ,  -- 软删除（需要的表）
```

---

## 2. ER 关系概览

```
users
  │
  │ 1:N
  ▼
digital_lives
  │
  ├── 1:N ──► memories
  │              │
  │              └── 1:1 ──► memory_embeddings (pgvector)
  │
  ├── 1:N ──► emotion_snapshots
  │
  ├── 1:N ──► life_state_snapshots
  │
  └── 1:1 ──► personality_profiles
```

---

## 3. 核心表结构

### 3.1 users（用户表）

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 账号信息
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),  -- 仅邮箱/密码登录时用
  
  -- 基本信息
  nickname VARCHAR(50),
  avatar_url VARCHAR(500),
  
  -- 状态
  status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active / banned / deleted
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL;
```

### 3.2 digital_lives（数字生命表）

```sql
CREATE TABLE digital_lives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- 基础属性
  name VARCHAR(50) NOT NULL,
  avatar_url VARCHAR(500),
  bio TEXT,
  
  -- 生命状态
  status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active / dormant / archived
  birth_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 统计（冗余，提升查询性能）
  total_interaction_count INTEGER NOT NULL DEFAULT 0,
  total_memory_count INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_digital_lives_user_id ON digital_lives(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_digital_lives_status ON digital_lives(status) WHERE deleted_at IS NULL;
```

### 3.3 personality_profiles（人格配置表）

```sql
CREATE TABLE personality_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digital_life_id UUID NOT NULL UNIQUE REFERENCES digital_lives(id),
  
  version VARCHAR(20) NOT NULL DEFAULT '1.0',
  archetype VARCHAR(30) NOT NULL,  -- 人格原型
  
  -- OCEAN 五因素（0-100）
  ocean_openness INTEGER NOT NULL DEFAULT 50,
  ocean_conscientiousness INTEGER NOT NULL DEFAULT 50,
  ocean_extraversion INTEGER NOT NULL DEFAULT 50,
  ocean_agreeableness INTEGER NOT NULL DEFAULT 50,
  ocean_neuroticism INTEGER NOT NULL DEFAULT 50,
  
  -- LifeOS 五特质（0-100）
  lifeos_warmth INTEGER NOT NULL DEFAULT 50,
  lifeos_curiosity INTEGER NOT NULL DEFAULT 50,
  lifeos_independence INTEGER NOT NULL DEFAULT 50,
  lifeos_humor INTEGER NOT NULL DEFAULT 50,
  lifeos_empathy INTEGER NOT NULL DEFAULT 50,
  
  -- 表达风格
  expression_speech_rate VARCHAR(10) NOT NULL DEFAULT 'normal',
  expression_formality VARCHAR(10) NOT NULL DEFAULT 'normal',
  expression_emoji_usage VARCHAR(10) NOT NULL DEFAULT 'normal',
  
  -- 自定义配置（JSONB，扩展性）
  custom_config JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_personality_profiles_digital_life_id ON personality_profiles(digital_life_id);
```

### 3.4 memories（记忆表）⭐

```sql
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digital_life_id UUID NOT NULL REFERENCES digital_lives(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- 类型与来源
  type VARCHAR(30) NOT NULL,  -- user_message / user_state / life_event / system_observation / ai_response
  source VARCHAR(20) NOT NULL,  -- chat / user_input / system
  
  -- 重要性评分（0-1）
  importance DECIMAL(3,2) NOT NULL DEFAULT 0.3,
  
  -- 内容
  content TEXT NOT NULL,
  raw_content TEXT,
  
  -- 情绪标签
  emotion_tags VARCHAR(50)[] NOT NULL DEFAULT '{}',
  emotion_intensity DECIMAL(3,2) NOT NULL DEFAULT 0.0,
  
  -- 实体提取（JSONB 数组）
  entities JSONB NOT NULL DEFAULT '[]',
  
  -- 时间信息
  event_time TIMESTAMPTZ,  -- 事件发生的实际时间
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- 记录时间
  
  -- 访问统计
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  
  -- 关联消息 ID（可选，便于追溯）
  source_message_id UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_memories_digital_life_id ON memories(digital_life_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_memories_user_id ON memories(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_memories_type ON memories(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_memories_importance ON memories(importance DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_memories_recorded_at ON memories(recorded_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_memories_emotion_tags ON memories USING GIN(emotion_tags) WHERE deleted_at IS NULL;
```

### 3.5 memory_embeddings（记忆向量表）

使用 pgvector 扩展存储向量，单独拆表避免影响主表性能。

```sql
-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE memory_embeddings (
  memory_id UUID PRIMARY KEY REFERENCES memories(id) ON DELETE CASCADE,
  digital_life_id UUID NOT NULL REFERENCES digital_lives(id),
  
  -- 1536 维向量（text-embedding-ada-002 维度）
  embedding vector(1536) NOT NULL,
  
  model VARCHAR(50) NOT NULL,  -- 使用的 embedding 模型
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memory_embeddings_digital_life_id ON memory_embeddings(digital_life_id);

-- 向量索引（IVFFlat，适合 MVP）
CREATE INDEX idx_memory_embeddings_embedding 
ON memory_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**关于向量索引**：
- MVP 数据量小，IVFFlat 足够
- lists = sqrt(rows)，预计 1万条时 lists=100
- 后续数据量大了可以换成 HNSW

### 3.6 emotion_snapshots（情绪快照表）

```sql
CREATE TABLE emotion_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digital_life_id UUID NOT NULL REFERENCES digital_lives(id),
  
  -- 当前情绪状态（0-100）
  joy INTEGER NOT NULL DEFAULT 50,
  trust INTEGER NOT NULL DEFAULT 30,
  concern INTEGER NOT NULL DEFAULT 20,
  sadness INTEGER NOT NULL DEFAULT 10,
  curiosity INTEGER NOT NULL DEFAULT 60,
  
  -- 基线（冗余，方便计算衰减）
  baseline_joy INTEGER NOT NULL DEFAULT 50,
  baseline_trust INTEGER NOT NULL DEFAULT 30,
  baseline_concern INTEGER NOT NULL DEFAULT 20,
  baseline_sadness INTEGER NOT NULL DEFAULT 10,
  baseline_curiosity INTEGER NOT NULL DEFAULT 60,
  
  -- 触发原因
  trigger_type VARCHAR(30) NOT NULL,  -- user_message / memory_retrieval / time_decay / life_event / system
  trigger_description VARCHAR(200),
  trigger_source_id UUID,  -- 触发源 ID（消息 ID、记忆 ID 等）
  
  -- 本次变化量
  delta_joy INTEGER NOT NULL DEFAULT 0,
  delta_trust INTEGER NOT NULL DEFAULT 0,
  delta_concern INTEGER NOT NULL DEFAULT 0,
  delta_sadness INTEGER NOT NULL DEFAULT 0,
  delta_curiosity INTEGER NOT NULL DEFAULT 0,
  
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emotion_snapshots_digital_life_id ON emotion_snapshots(digital_life_id);
CREATE INDEX idx_emotion_snapshots_recorded_at ON emotion_snapshots(recorded_at DESC);
```

### 3.7 life_state_snapshots（生命状态快照表）

```sql
CREATE TABLE life_state_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digital_life_id UUID NOT NULL REFERENCES digital_lives(id),
  
  -- 引擎状态
  engine_status VARCHAR(20) NOT NULL DEFAULT 'idle',
  last_event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 统计
  total_interaction_count INTEGER NOT NULL DEFAULT 0,
  memory_count INTEGER NOT NULL DEFAULT 0,
  days_alive INTEGER NOT NULL DEFAULT 0,
  consecutive_days INTEGER NOT NULL DEFAULT 0,
  
  -- 快照原因
  reason VARCHAR(50),  -- user_message / daily / manual
  
  snapshot_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_life_state_snapshots_digital_life_id ON life_state_snapshots(digital_life_id);
CREATE INDEX idx_life_state_snapshots_snapshot_time ON life_state_snapshots(snapshot_time DESC);
```

### 3.8 chat_messages（聊天消息表）

聊天消息记录，供追溯和分析用：

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digital_life_id UUID NOT NULL REFERENCES digital_lives(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  role VARCHAR(10) NOT NULL,  -- user / assistant / system
  content TEXT NOT NULL,
  
  -- 关联记忆 ID（如果这条消息触发了记忆）
  memory_id UUID REFERENCES memories(id),
  
  -- 元数据
  tokens_used INTEGER,
  model_used VARCHAR(50),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_digital_life_id ON chat_messages(digital_life_id, created_at DESC);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id, created_at DESC);
```

---

## 4. 表总数统计

| 表名 | 用途 | 优先级 |
|------|------|--------|
| users | 用户 | P0 |
| digital_lives | 数字生命实体 | P0 |
| personality_profiles | 人格配置 | P0 |
| memories | 记忆（核心） | P0 ⭐ |
| memory_embeddings | 记忆向量 | P0 ⭐ |
| emotion_snapshots | 情绪快照 | P0 |
| life_state_snapshots | 生命状态快照 | P1 |
| chat_messages | 聊天消息 | P1 |

**MVP 必须 8 张表**。

---

## 5. 关键查询模式与索引优化

### 5.1 记忆检索（最高频）

```sql
-- 语义检索
SELECT m.*
FROM memory_embeddings e
JOIN memories m ON m.id = e.memory_id
WHERE 
  e.digital_life_id = :digitalLifeId
  AND m.importance >= 0.2
  AND m.deleted_at IS NULL
ORDER BY e.embedding <=> :query_embedding
LIMIT 20;

-- 近期记忆
SELECT * FROM memories
WHERE 
  digital_life_id = :digitalLifeId
  AND importance >= 0.2
  AND deleted_at IS NULL
ORDER BY recorded_at DESC
LIMIT 20;

-- 重要记忆
SELECT * FROM memories
WHERE 
  digital_life_id = :digitalLifeId
  AND deleted_at IS NULL
ORDER BY importance DESC
LIMIT 20;
```

### 5.2 情绪状态读取

```sql
-- 读最新快照，然后应用衰减计算
SELECT * FROM emotion_snapshots
WHERE digital_life_id = :digitalLifeId
ORDER BY recorded_at DESC
LIMIT 1;
```

---

## 6. 迁移策略

### 6.1 迁移工具

使用 **Prisma** 或 **TypeORM** 的 migration 功能：

| 选择 | 原因 |
|------|------|
| Prisma | TypeScript 生态好，类型安全，迁移管理方便 |
| TypeORM | NestJS 官方推荐，集成度高 |

**推荐 Prisma**：类型安全更好，开发体验佳。

### 6.2 初始迁移顺序

```
0001_init_users.sql
0002_init_digital_lives.sql
0003_init_personality_profiles.sql
0004_init_memories.sql
0005_init_memory_embeddings.sql  -- 需要先 CREATE EXTENSION vector
0006_init_emotion_snapshots.sql
0007_init_life_state_snapshots.sql
0008_init_chat_messages.sql
```

---

## 相关文档

- **MVP 架构总览**：[29-life-core-mvp-architecture.md](file:///workspace/docs/29-life-core-mvp-architecture.md)
- **架构基线**：[architecture.md](file:///workspace/docs/architecture.md)
- **Character Runtime**：[30-character-runtime.md](file:///workspace/docs/30-character-runtime.md)
- **Memory 实现**：[31-life-memory-implementation.md](file:///workspace/docs/31-life-memory-implementation.md)
- **Emotion Runtime**：[32-emotion-runtime.md](file:///workspace/docs/32-emotion-runtime.md)
- **LifeEngine Runtime**：[33-life-engine-runtime.md](file:///workspace/docs/33-life-engine-runtime.md)
- **开发规范**：[development-rules.md](file:///workspace/docs/development-rules.md)
- **决策记录**：[decision-log.md](file:///workspace/docs/decision-log.md)（ADR-007 / ADR-044）

---

**文档版本**: v1.0
**创建日期**: 2026-07-08
**维护者**: Chief Architect
**对应 Phase**: Phase 8.1 Life Core MVP
