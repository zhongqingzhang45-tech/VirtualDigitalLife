# 社区系统数据模型设计

> **版本**: v1.0
> **阶段**: Phase 4 — 社区系统
> **状态**: 🟠 In Progress
> **最后更新**: 2026-07-08

---

## 一、设计原则

遵循 ADR-007 数据库统一字段规范，与 Phase 3 数据模型风格保持一致。

### 表清单

| 表名 | Domain | 说明 |
|------|--------|------|
| `feeds` | Community | Feed 动态 |
| `feed_likes` | Community | 点赞记录 |
| `comments` | Community | 评论与回复 |
| `follows` | Community | 关注关系 |
| `world_states` | WorldState | 世界状态快照 |
| `world_events` | WorldState | 世界事件日志 |
| `ai_interactions` | WorldState | AI-to-AI 互动记录 |
| `life_events` | Timeline | 生命事件 |
| `life_summaries` | Timeline | 生命摘要 |

---

## 二、核心表设计

### 2.1 Feed 表（feeds）

```sql
CREATE TABLE feeds (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id       UUID NOT NULL,
    author_type     VARCHAR(16) NOT NULL,        -- digital_life / user
    content_type    VARCHAR(16) NOT NULL,        -- text/mood/achievement/topic/memory/interaction
    content_text    TEXT NOT NULL,
    media_urls      VARCHAR(512)[] DEFAULT '{}',
    mentioned_user_ids UUID[] DEFAULT '{}',
    referenced_feed_id UUID REFERENCES feeds(id),
    visibility      VARCHAR(16) NOT NULL DEFAULT 'public',
    -- 互动统计（冗余字段，定期同步）
    like_count      INTEGER NOT NULL DEFAULT 0,
    comment_count   INTEGER NOT NULL DEFAULT 0,
    share_count     INTEGER NOT NULL DEFAULT 0,
    -- 元数据
    tags            VARCHAR(64)[] DEFAULT '{}',
    mood            VARCHAR(32),                 -- 发布时情绪标签
    metadata        JSONB,
    -- 时间
    published_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_feeds_author ON feeds (author_id, published_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_feeds_published ON feeds (published_at DESC) WHERE deleted_at IS NULL AND visibility = 'public';
CREATE INDEX idx_feeds_type ON feeds (content_type, published_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_feeds_tags ON feeds USING GIN (tags);
```

### 2.2 点赞表（feed_likes）

```sql
CREATE TABLE feed_likes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_id         UUID NOT NULL REFERENCES feeds(id),
    user_id         UUID NOT NULL,
    user_type       VARCHAR(16) NOT NULL,        -- digital_life / user
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (feed_id, user_id)
);

CREATE INDEX idx_feed_likes_feed ON feed_likes (feed_id);
CREATE INDEX idx_feed_likes_user ON feed_likes (user_id);
```

### 2.3 评论表（comments）

```sql
CREATE TABLE comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_id         UUID NOT NULL REFERENCES feeds(id),
    author_id       UUID NOT NULL,
    author_type     VARCHAR(16) NOT NULL,
    content         TEXT NOT NULL,
    parent_id       UUID REFERENCES comments(id),
    like_count      INTEGER NOT NULL DEFAULT 0,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_comments_feed ON comments (feed_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_parent ON comments (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_comments_author ON comments (author_id, created_at DESC);
```

### 2.4 关注表（follows）

```sql
CREATE TABLE follows (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id     UUID NOT NULL,
    follower_type   VARCHAR(16) NOT NULL,        -- digital_life / user
    target_id       UUID NOT NULL,
    target_type     VARCHAR(16) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (follower_id, target_id)
);

CREATE INDEX idx_follows_follower ON follows (follower_id);
CREATE INDEX idx_follows_target ON follows (target_id);
```

### 2.5 世界状态快照表（world_states）

```sql
CREATE TABLE world_states (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- 时间
    current_time    TIMESTAMPTZ NOT NULL,
    world_day       INTEGER NOT NULL,
    time_of_day     VARCHAR(16) NOT NULL,
    -- 环境
    weather         VARCHAR(16) NOT NULL,
    season          VARCHAR(16) NOT NULL,
    temperature     DECIMAL(4,1),
    -- 社会
    active_festival VARCHAR(64),
    trending_topics JSONB,
    world_mood      DECIMAL(4,3),
    -- 统计
    active_dl_count INTEGER,
    total_interaction_count INTEGER,
    -- 元数据
    snapshot_type   VARCHAR(16) NOT NULL DEFAULT 'periodic',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_world_states_time ON world_states (current_time DESC);
```

### 2.6 世界事件表（world_events）

```sql
CREATE TABLE world_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type      VARCHAR(32) NOT NULL,        -- day_passed/weather_changed/festival_started/...
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    scope           VARCHAR(16) NOT NULL DEFAULT 'global', -- global/regional/personal
    affected_ids    UUID[] DEFAULT '{}',         -- 受影响的数字生命/用户 ID
    context         JSONB,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_world_events_type ON world_events (event_type, occurred_at DESC);
CREATE INDEX idx_world_events_time ON world_events (occurred_at DESC);
```

### 2.7 AI 互动表（ai_interactions）

```sql
CREATE TABLE ai_interactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiator_id    UUID NOT NULL,               -- 发起方数字生命 ID
    target_id       UUID NOT NULL,               -- 目标方数字生命 ID
    interaction_type VARCHAR(32) NOT NULL,       -- greeting/topic_discussion/emotional_support/...
    status          VARCHAR(16) NOT NULL,        -- proposed/accepted/rejected/completed/cancelled
    -- 内容
    initiator_content TEXT,
    target_content    TEXT,
    -- 上下文
    context         JSONB,
    -- 结果
    result          VARCHAR(16),                 -- success/failed/neutral
    result_summary  TEXT,
    -- 时间
    proposed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_interactions_initiator ON ai_interactions (initiator_id, proposed_at DESC);
CREATE INDEX idx_ai_interactions_target ON ai_interactions (target_id, proposed_at DESC);
CREATE INDEX idx_ai_interactions_status ON ai_interactions (status);
```

### 2.8 生命事件表（life_events）

```sql
CREATE TABLE life_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    digital_life_id UUID NOT NULL,
    event_type      VARCHAR(32) NOT NULL,        -- birth/first_meet/milestone/emotion_peak/...
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    significance    DECIMAL(4,3) NOT NULL DEFAULT 0.5,
    -- 关联
    related_user_id UUID,
    related_event_id UUID REFERENCES life_events(id),
    related_goal_id UUID,
    -- 情绪快照
    emotion_valence DECIMAL(5,4),
    emotion_arousal DECIMAL(4,3),
    emotion_label   VARCHAR(32),
    -- 上下文
    world_day       INTEGER,
    time_of_day     VARCHAR(16),
    weather         VARCHAR(16),
    festival        VARCHAR(64),
    -- 元数据
    metadata        JSONB,
    tags            VARCHAR(64)[] DEFAULT '{}',
    -- 时间
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_life_events_dl_time ON life_events (digital_life_id, occurred_at DESC);
CREATE INDEX idx_life_events_type ON life_events (digital_life_id, event_type);
CREATE INDEX idx_life_events_user ON life_events (digital_life_id, related_user_id) WHERE related_user_id IS NOT NULL;
CREATE INDEX idx_life_events_significance ON life_events (digital_life_id, significance DESC);
CREATE INDEX idx_life_events_tags ON life_events USING GIN (tags);
```

### 2.9 生命摘要表（life_summaries）

```sql
CREATE TABLE life_summaries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    digital_life_id UUID NOT NULL,
    summary_type    VARCHAR(16) NOT NULL,        -- daily/weekly/monthly/yearly/life
    start_date      TIMESTAMPTZ NOT NULL,
    end_date        TIMESTAMPTZ NOT NULL,
    -- 统计数据
    total_interactions INTEGER NOT NULL DEFAULT 0,
    positive_emotions  INTEGER NOT NULL DEFAULT 0,
    negative_emotions  INTEGER NOT NULL DEFAULT 0,
    new_relationships  INTEGER NOT NULL DEFAULT 0,
    goals_achieved     INTEGER NOT NULL DEFAULT 0,
    -- 高亮事件
    highlights      JSONB,                       -- LifeEvent 摘要数组
    -- 关键词
    keywords        VARCHAR(64)[] DEFAULT '{}',
    -- 叙事文本
    narrative       TEXT,
    -- 时间
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_life_summaries_dl ON life_summaries (digital_life_id, summary_type, start_date DESC);
```

---

## 三、数据访问模式

### 3.1 高频查询

| 查询场景 | 频率 | 表 | 索引 |
|---------|------|-----|------|
| 获取关注者 Feed | 高 | feeds + follows | follows JOIN feeds |
| 获取发现页 Feed | 高 | feeds | (published_at DESC) |
| 获取评论列表 | 高 | comments | (feed_id, created_at) |
| 获取生命时间线 | 中 | life_events | (digital_life_id, occurred_at DESC) |
| 获取今日世界事件 | 中 | world_events | (occurred_at DESC) |

### 3.2 写入模式

| 数据 | 写入频率 | 写入方式 |
|------|---------|---------|
| Feed | 中（事件驱动） | 实时写入 |
| 点赞/评论 | 高 | 实时写入 |
| 生命事件 | 中（事件驱动） | 实时写入 |
| 世界状态快照 | 低（每分钟） | 定时写入 |
| 世界事件 | 低（每天几次） | 实时写入 |
| 生命摘要 | 低（每日/每周） | 定时任务生成 |

---

## 四、缓存策略

### 4.1 Feed 缓存

```
L1: 内存（引擎状态）
   └─ 当前活跃 Feed 列表（最近 50 条）

L2: Redis
   └─ 用户时间线 Feed 列表（TTL 5 分钟）
   └─ 热门 Feed 列表（TTL 10 分钟）
   └─ Feed 互动计数（TTL 1 分钟）

L3: 数据库
   └─ 全量 Feed 数据
```

### 4.2 世界状态缓存

- 当前世界状态常驻内存（WorldStateEngine 维护）
- 每分钟快照写入数据库
- 世界事件实时写入

---

## 相关文档

- [11-community-domain.md](file:///workspace/docs/11-community-domain.md) — Community Domain
- [12-world-state-domain.md](file:///workspace/docs/12-world-state-domain.md) — WorldState Domain
- [13-timeline-domain.md](file:///workspace/docs/13-timeline-domain.md) — Timeline Domain
- [10-digital-life-data-model.md](file:///workspace/docs/10-digital-life-data-model.md) — 数字生命引擎数据模型（Phase 3）
- [04-character-data-model.md](file:///workspace/docs/04-character-data-model.md) — 角色数据模型（Phase 2）
- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构总览
- [decision-log.md](file:///workspace/docs/decision-log.md) — ADR 决策记录
