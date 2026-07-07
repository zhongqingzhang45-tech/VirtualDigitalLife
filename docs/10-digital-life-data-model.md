# 数字生命引擎数据模型设计

> **版本**: v1.0
> **阶段**: Phase 3 — 数字生命引擎
> **状态**: 🟠 In Progress
> **最后更新**: 2026-07-08

---

## 一、设计原则

### 1.1 分层存储策略

| 数据类型 | 存储方式 | 说明 |
|---------|---------|------|
| **引擎运行时状态** | 内存 + 定期快照 | 高频读写，tick 级更新 |
| **情绪快照** | 时序数据库 / 分表 | 用于回溯分析，写入频繁 |
| **关系 / 目标** | 关系型数据库 | 结构化数据，需事务 |
| **事件日志** | 事件存储（Event Store） |  append-only，用于事件溯源 |

### 1.2 命名规范

- 表名：蛇形命名，Domain 前缀，如 `emotion_states`
- 主键：`id`（UUID v7，时间有序）
- 外键：`{table}_id`
- 时间字段：`created_at` / `updated_at` / `deleted_at`
- JSON 字段：后缀 `_data`

> 遵循 ADR-007 数据库统一字段规范。

---

## 二、核心表设计

### 2.1 情绪状态表（emotion_states）

记录数字生命的情绪快照，用于回溯和情绪记忆。

```sql
CREATE TABLE emotion_states (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    digital_life_id UUID NOT NULL,
    -- 情绪三维
    valence         DECIMAL(5,4) NOT NULL,   -- -1 ~ +1 效价
    arousal         DECIMAL(4,3) NOT NULL,   -- 0 ~ 1  唤醒度
    dominance       DECIMAL(4,3) NOT NULL,   -- 0 ~ 1  支配度
    -- 情绪标签
    dominant_emotion VARCHAR(32) NOT NULL,   -- joy/sadness/anger/...
    intensity       DECIMAL(4,3) NOT NULL,   -- 0 ~ 1 情绪强度
    -- 基线（快照时的基线，用于分析变化）
    baseline_valence DECIMAL(5,4) NOT NULL,
    baseline_arousal DECIMAL(4,3) NOT NULL,
    -- 触发原因
    trigger_type    VARCHAR(32),             -- user_message/goal_achieved/...
    trigger_source  VARCHAR(64),             -- 来源 ID
    trigger_data    JSONB,                   -- 触发详情
    -- 时间
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emotion_states_dl_time ON emotion_states (digital_life_id, recorded_at DESC);
CREATE INDEX idx_emotion_states_emotion ON emotion_states (digital_life_id, dominant_emotion);
```

### 2.2 目标表（goals）

```sql
CREATE TABLE goals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    digital_life_id UUID NOT NULL,
    -- 目标基本信息
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    goal_type       VARCHAR(32) NOT NULL,    -- social/growth/exploration/...
    goal_level      VARCHAR(16) NOT NULL,    -- life/midterm/shortterm/immediate
    priority        DECIMAL(4,3) NOT NULL DEFAULT 0.5, -- 0 ~ 1
    status          VARCHAR(16) NOT NULL DEFAULT 'pending',
    -- 进度
    progress        DECIMAL(5,4) NOT NULL DEFAULT 0, -- 0 ~ 1
    deadline        TIMESTAMPTZ,
    -- 层级关系
    parent_goal_id  UUID REFERENCES goals(id),
    -- 来源与条件
    source          VARCHAR(32) NOT NULL,    -- personality/relationship/memory/...
    triggers        JSONB,                   -- 触发条件数组
    conditions      JSONB,                   -- 完成条件数组
    -- 元数据
    metadata        JSONB,
    -- 时间
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    failed_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_dl_status ON goals (digital_life_id, status);
CREATE INDEX idx_goals_dl_level ON goals (digital_life_id, goal_level);
CREATE INDEX idx_goals_parent ON goals (parent_goal_id);
CREATE INDEX idx_goals_deadline ON goals (digital_life_id, deadline) WHERE deadline IS NOT NULL;
```

### 2.3 关系表（relationships）

```sql
CREATE TABLE relationships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    digital_life_id UUID NOT NULL,
    target_id       UUID NOT NULL,
    target_type     VARCHAR(16) NOT NULL,    -- user / digital_life
    -- 关系维度
    intimacy        DECIMAL(5,4) NOT NULL DEFAULT 0,   -- 0 ~ 1 亲密度
    positivity      DECIMAL(5,4) NOT NULL DEFAULT 0,   -- -1 ~ +1 正向度
    stage           SMALLINT NOT NULL DEFAULT 1,       -- 1 ~ 12 阶段
    relationship_type VARCHAR(32) NOT NULL DEFAULT 'friendly', -- friendly/respectful/...
    -- 互动统计
    first_met_at    TIMESTAMPTZ,
    last_interaction_at TIMESTAMPTZ,
    interaction_count INTEGER NOT NULL DEFAULT 0,
    streak_days     INTEGER NOT NULL DEFAULT 0,
    longest_streak  INTEGER NOT NULL DEFAULT 0,
    -- 里程碑与标签
    milestones      JSONB,                   -- 里程碑数组
    tags            VARCHAR(64)[] DEFAULT '{}',
    -- 元数据
    metadata        JSONB,
    -- 时间
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- 唯一约束：一个数字生命对一个目标只有一条关系
    UNIQUE (digital_life_id, target_id, target_type)
);

CREATE INDEX idx_relationships_dl ON relationships (digital_life_id);
CREATE INDEX idx_relationships_target ON relationships (target_id, target_type);
CREATE INDEX idx_relations_intimacy ON relationships (digital_life_id, intimacy DESC);
```

### 2.4 关系事件表（relationship_events）

记录每一次关系变化的详细事件，用于回溯。

```sql
CREATE TABLE relationship_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_id UUID NOT NULL REFERENCES relationships(id),
    digital_life_id UUID NOT NULL,
    target_id       UUID NOT NULL,
    event_type      VARCHAR(32) NOT NULL,    -- conversation/deep_talk/gift/conflict/...
    intimacy_delta  DECIMAL(6,4) NOT NULL DEFAULT 0,
    positivity_delta DECIMAL(6,4) NOT NULL DEFAULT 0,
    description     TEXT,
    context         JSONB,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rel_events_rel ON relationship_events (relationship_id, occurred_at DESC);
CREATE INDEX idx_rel_events_dl ON relationship_events (digital_life_id, occurred_at DESC);
CREATE INDEX idx_rel_events_type ON relationship_events (event_type);
```

### 2.5 行为记录表（behavior_records）

记录调度器执行的每一个行为。

```sql
CREATE TABLE behavior_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    digital_life_id UUID NOT NULL,
    action_type     VARCHAR(32) NOT NULL,    -- speak/expression/motion/greet/...
    source_engine   VARCHAR(32) NOT NULL,    -- emotion/goal/relationship/...
    priority        DECIMAL(4,3) NOT NULL,
    final_score     DECIMAL(4,3) NOT NULL,
    result          VARCHAR(16) NOT NULL,    -- success/failed/cancelled/interrupted
    duration_ms     INTEGER,
    description     TEXT,
    metadata        JSONB,
    executed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_behavior_dl_time ON behavior_records (digital_life_id, executed_at DESC);
CREATE INDEX idx_behavior_type ON behavior_records (digital_life_id, action_type);
```

### 2.6 引擎状态快照表（engine_snapshots）

各 Engine 的定期持久化快照，用于恢复和备份。

```sql
CREATE TABLE engine_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    digital_life_id UUID NOT NULL,
    engine_name     VARCHAR(32) NOT NULL,    -- personality/emotion/goal/...
    snapshot_type   VARCHAR(16) NOT NULL DEFAULT 'periodic', -- periodic/manual/shutdown
    state_data      JSONB NOT NULL,
    version         INTEGER NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_snapshots_dl_engine ON engine_snapshots (digital_life_id, engine_name, created_at DESC);
```

### 2.7 数字生命总表（digital_lives）

数字生命聚合根表，关联 AIRI Character。

```sql
CREATE TABLE digital_lives (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,           -- 所属用户
    -- AIRI 关联
    character_id    UUID NOT NULL,           -- AIRI Character ID
    character_version VARCHAR(32),           -- Character 版本
    -- 基本信息
    name            VARCHAR(64) NOT NULL,
    avatar_url      VARCHAR(512),
    birthday        DATE,
    -- 生命周期
    status          VARCHAR(16) NOT NULL DEFAULT 'active', -- active/suspended/deleted
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    first_activated_at TIMESTAMPTZ,          -- 首次激活时间
    total_lifetime  BIGINT NOT NULL DEFAULT 0 -- 总活跃时长（秒）
);

CREATE INDEX idx_digital_lives_user ON digital_lives (user_id);
CREATE INDEX idx_digital_lives_status ON digital_lives (status);
```

---

## 三、AIRI 原生表复用说明

### 3.1 复用策略

| AIRI 原生表 | 用途 | LifeOS 复用方式 |
|------------|------|----------------|
| `characters` | 角色基础数据 | 直接复用，`digital_lives.character_id` 外键关联 |
| `character_versions` | 角色版本 | 直接复用 |
| `chat_messages` | 聊天消息 | 直接复用（User Domain 管理） |
| `chat_sessions` | 会话管理 | 直接复用 |

### 3.2 关联方式

```
LifeOS 层                      AIRI 原生层
──────────                     ───────────
digital_lives ────────┐
  id (PK)             │
  character_id ───────┴──→ characters.id
  user_id
  status
  ...

emotion_states ────────┐
  id (PK)               │
  digital_life_id ──────┴──→ digital_lives.id
  valence / arousal / ...

goals ─────────────────┐
  id (PK)               │
  digital_life_id ──────┴──→ digital_lives.id
  ...

relationships ─────────┐
  id (PK)               │
  digital_life_id ──────┴──→ digital_lives.id
  target_id ────────→ user_id / digital_life_id
  ...
```

### 3.3 写入约束

- **只写 LifeOS 扩展表**：不直接修改 AIRI 原生表的结构和数据
- **通过 API 访问**：LifeOS 访问 AIRI 数据走 AIRI 提供的 API / Service
- **只读关联查询**：可以 JOIN 读，但写入必须通过适配层

---

## 四、数据访问模式

### 4.1 高频查询

| 查询场景 | 频率 | 表 | 索引 |
|---------|------|-----|------|
| 获取当前情绪状态 | 极高（实时） | emotion_states | （最新一条可从内存读） |
| 获取活跃目标列表 | 高 | goals | (digital_life_id, status) |
| 获取某用户关系 | 高 | relationships | (digital_life_id, target_id) |
| 获取最近 N 条行为 | 中 | behavior_records | (digital_life_id, executed_at DESC) |

### 4.2 写入模式

| 数据 | 写入频率 | 写入方式 |
|------|---------|---------|
| 情绪状态 | 高（可能几秒一次） | 内存 + 批量落盘（每分钟一次快照） |
| 目标进度 | 中（事件驱动） | 实时写入 |
| 关系亲密度 | 中（每次互动） | 实时写入 |
| 行为记录 | 中（每次调度） | 实时写入 |
| 引擎快照 | 低（定期/关机时） | 定时写入 |

---

## 五、缓存策略

### 5.1 多层缓存

```
L1: 引擎内存
   └─ 当前状态（EmotionState / 活跃 Goals / Relationship）
   └─ 读写最快，tick 级访问
      │
L2: Redis 缓存
   └─ 数字生命完整状态（序列化后）
   └─ TTL = 30 分钟，访问时续期
      │
L3: 数据库持久化
   └─ 全量数据
   └─ 定期快照 + 事件溯源
```

### 5.2 加载策略

- **冷启动**：从 DB 加载 → 反序列化 → 写入引擎内存 → 写入 Redis
- **热加载**：从 Redis 读取 → 反序列化 → 写入引擎内存
- **写回**：定期快照 + 重要事件实时写库

---

## 相关文档

- [05-brain-body-architecture.md](file:///workspace/docs/05-brain-body-architecture.md) — Brain-Body 分层架构
- [06-emotion-domain.md](file:///workspace/docs/06-emotion-domain.md) — Emotion Domain
- [07-goal-domain.md](file:///workspace/docs/07-goal-domain.md) — Goal Domain
- [08-relationship-domain.md](file:///workspace/docs/08-relationship-domain.md) — Relationship Domain
- [09-engine-framework.md](file:///workspace/docs/09-engine-framework.md) — Engine 框架
- [04-character-data-model.md](file:///workspace/docs/04-character-data-model.md) — 角色数据模型（Phase 2）
- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构总览
- [decision-log.md](file:///workspace/docs/decision-log.md) — ADR 决策记录
- [development-rules.md](file:///workspace/docs/development-rules.md) — 开发规范
