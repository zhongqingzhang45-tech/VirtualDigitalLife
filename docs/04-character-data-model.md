# 角色数据模型设计

> **版本**: v1.0
> **阶段**: Phase 2 — 角色系统
> **状态**: 🟠 In Progress
> **最后更新**: 2026-07-08

---

## 一、设计原则

### 1.1 核心原则

| 原则 | 说明 |
|------|------|
| **对齐 AIRI** | AIRI 已有的表结构完全复用，LifeOS 扩展表通过外键关联 |
| **扩展优先** | 不修改 AIRI 原有表，所有 LifeOS 扩展字段放独立表 |
| **统一字段** | 遵循 ADR-007 数据库统一字段规范 |
| **软删除** | 所有业务表使用软删除（`deleted_at`） |

### 1.2 与 AIRI 表的关系

```
AIRI 原生表（不修改）         LifeOS 扩展表（新增）
──────────────────         ──────────────────
characters           ──→   personality_states
character_prompts           character_templates
character_capabilities      evolution_history
character_i18n
avatar_models
```

---

## 二、AIRI 角色表结构（复用）

> 以下为 AIRI 原生表结构，来自 `@proj-airi/stage-ui` 的 Character schema 分析。
> LifeOS 完全复用，不做修改。

### 2.1 characters（角色基础表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) PK | 角色实例 ID |
| `character_id` | VARCHAR(36) | 角色定义 ID（同一角色的不同版本共享） |
| `version` | VARCHAR(32) | 角色版本号 |
| `cover_url` | VARCHAR(512) | 封面图 URL |
| `avatar_url` | VARCHAR(512) NULL | 头像 URL |
| `character_avatar_url` | VARCHAR(512) NULL | 角色形象头像 URL |
| `cover_background_url` | VARCHAR(512) NULL | 封面背景 URL |
| `creator_role` | VARCHAR(64) NULL | 创建者角色 |
| `price_credit` | VARCHAR(32) | 价格（积分） |
| `likes_count` | INT DEFAULT 0 | 点赞数 |
| `bookmarks_count` | INT DEFAULT 0 | 收藏数 |
| `interactions_count` | BIGINT DEFAULT 0 | 互动次数 |
| `forks_count` | INT DEFAULT 0 | 派生次数 |
| `creator_id` | VARCHAR(36) | 创建者用户 ID |
| `owner_id` | VARCHAR(36) | 当前拥有者用户 ID |
| `created_at` | TIMESTAMP | 创建时间 |
| `updated_at` | TIMESTAMP | 更新时间 |
| `deleted_at` | TIMESTAMP NULL | 删除时间（软删除） |

### 2.2 character_i18n（角色多语言表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) PK | |
| `character_id` | VARCHAR(36) FK | 关联 characters |
| `language` | VARCHAR(16) | 语言代码（zh-CN, en-US...） |
| `name` | VARCHAR(128) | 角色名称 |
| `tagline` | VARCHAR(256) NULL | 标语/一句话介绍 |
| `description` | TEXT | 角色描述 |
| `tags` | JSONB | 标签数组 |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

### 2.3 character_prompts（角色 Prompt 表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) PK | |
| `character_id` | VARCHAR(36) FK | 关联 characters |
| `language` | VARCHAR(16) | 语言代码 |
| `type` | ENUM('system','personality','greetings') | Prompt 类型 |
| `content` | TEXT | Prompt 内容 |

> **关键点**：LifeOS 的 Prompt Compiler 编译结果写入 `type='personality'` 的记录。

### 2.4 character_capabilities（角色能力配置表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) PK | |
| `character_id` | VARCHAR(36) FK | |
| `type` | ENUM('llm','tts','vlm','asr') | 能力类型 |
| `config` | JSONB | 配置详情（API Key、模型参数等） |

### 2.5 avatar_models（形象模型表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) PK | |
| `character_id` | VARCHAR(36) FK | |
| `name` | VARCHAR(128) | 模型名称 |
| `type` | ENUM('vrm','live2d','spine') | 模型类型 |
| `description` | TEXT | 描述 |
| `config` | JSONB | 模型配置（URL 等） |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

---

## 三、LifeOS 扩展表（新增）

### 3.1 personality_states（人格状态表）

> Personality Domain 的核心表，存储结构化人格参数。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) PK | 人格状态 ID |
| `character_id` | VARCHAR(36) FK | 关联 AIRI characters |
| `version` | INT DEFAULT 1 | 乐观锁版本号 |
| `template_id` | VARCHAR(36) NULL | 来源模板 ID |
| | | |
| `trait_openness` | DECIMAL(4,3) | 开放性（0~1） |
| `trait_conscientiousness` | DECIMAL(4,3) | 尽责性（0~1） |
| `trait_extraversion` | DECIMAL(4,3) | 外向性（0~1） |
| `trait_agreeableness` | DECIMAL(4,3) | 宜人性（0~1） |
| `trait_neuroticism` | DECIMAL(4,3) | 情绪稳定性（0~1，值越高越稳定） |
| | | |
| `speech_verbosity` | DECIMAL(4,3) | 话量（0~1） |
| `speech_formality` | DECIMAL(4,3) | 语气正式度（0~1） |
| `speech_emoji_freq` | DECIMAL(4,3) | emoji 使用频率（0~1） |
| `speech_particle_density` | DECIMAL(4,3) | 语气词密度（0~1） |
| `speech_sentence_complexity` | DECIMAL(4,3) | 句式复杂度（0~1） |
| `speech_address_pref` | VARCHAR(32) | 称呼偏好（casual/polite/name_suffix/nickname） |
| | | |
| `backstory_origin` | TEXT NULL | 出身来历 |
| `backstory_core_desire` | TEXT NULL | 核心愿望 |
| `backstory_core_fear` | TEXT NULL | 核心恐惧 |
| `backstory_defining_memory` | TEXT NULL | 关键记忆 |
| `backstory_skills` | JSONB NULL | 技能数组 |
| `backstory_hobbies` | JSONB NULL | 爱好数组 |
| `backstory_relationships` | JSONB NULL | 关系数组 |
| | | |
| `compiled_prompt` | TEXT NULL | 编译后的 personality prompt |
| `compiled_at` | TIMESTAMP NULL | 编译时间 |
| `compiled_version` | INT NULL | 编译时的版本号 |
| | | |
| `evolution_points` | DECIMAL(10,2) DEFAULT 0 | 演化积分 |
| `total_interactions` | BIGINT DEFAULT 0 | 累计互动次数 |
| `last_evolved_at` | TIMESTAMP NULL | 上次演化时间 |
| | | |
| `created_at` | TIMESTAMP | 创建时间 |
| `updated_at` | TIMESTAMP | 更新时间 |
| `deleted_at` | TIMESTAMP NULL | 软删除 |

**索引**：
- `idx_personality_character_id` ON `character_id`（唯一，一对一关系）
- `idx_personality_template_id` ON `template_id`

### 3.2 evolution_history（人格演化历史表）

> 记录每次人格演化的详情，用于回溯和分析。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) PK | |
| `character_id` | VARCHAR(36) FK | 关联 characters |
| `level` | ENUM('minor','medium','major') | 演化级别 |
| `trigger` | VARCHAR(64) | 触发源（memory_consolidation / relationship_change / user_edit / time_decay） |
| `trigger_detail` | JSONB NULL | 触发详情（如记忆 ID、关系变化类型等） |
| `old_traits` | JSONB | 演化前的五维值 |
| `new_traits` | JSONB | 演化后的五维值 |
| `delta_traits` | JSONB | 变化量 |
| `description` | TEXT NULL | 自然语言描述 |
| `points_consumed` | DECIMAL(10,2) | 消耗的演化积分 |
| `created_at` | TIMESTAMP | 演化时间 |

**索引**：
- `idx_evolution_character_id` ON `character_id`
- `idx_evolution_created_at` ON `created_at`

### 3.3 character_templates（角色模板表）

> 预设角色模板，用户可基于模板快速创建角色。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) PK | |
| `name` | VARCHAR(128) | 模板名称 |
| `tagline` | VARCHAR(256) NULL | 标语 |
| `description` | TEXT | 模板描述 |
| `cover_url` | VARCHAR(512) | 封面图 |
| `category` | VARCHAR(64) | 分类 |
| `tags` | JSONB NULL | 标签数组 |
| | | |
| `init_trait_openness` | DECIMAL(4,3) | 初始开放性 |
| `init_trait_conscientiousness` | DECIMAL(4,3) | 初始尽责性 |
| `init_trait_extraversion` | DECIMAL(4,3) | 初始外向性 |
| `init_trait_agreeableness` | DECIMAL(4,3) | 初始宜人性 |
| `init_trait_neuroticism` | DECIMAL(4,3) | 初始情绪稳定性 |
| | | |
| `init_speech_verbosity` | DECIMAL(4,3) | 初始话量 |
| `init_speech_formality` | DECIMAL(4,3) | 初始正式度 |
| `init_speech_emoji_freq` | DECIMAL(4,3) | 初始 emoji 频率 |
| `init_speech_particle_density` | DECIMAL(4,3) | 初始语气词密度 |
| `init_speech_sentence_complexity` | DECIMAL(4,3) | 初始句式复杂度 |
| `init_speech_address_pref` | VARCHAR(32) | 初始称呼偏好 |
| | | |
| `init_backstory` | JSONB NULL | 初始背景故事 |
| `base_system_prompt` | TEXT NULL | 基础 system prompt |
| `base_greetings` | JSONB NULL | 基础问候语数组 |
| | | |
| `evolution_bias` | JSONB NULL | 演化倾向（各维度的自然偏移方向） |
| | | |
| `creator_id` | VARCHAR(36) NULL | 创建者 ID |
| `is_official` | BOOLEAN DEFAULT FALSE | 是否官方模板 |
| `popularity` | INT DEFAULT 0 | 人气/使用次数 |
| | | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |
| `deleted_at` | TIMESTAMP NULL | |

**索引**：
- `idx_template_category` ON `category`
- `idx_template_official` ON `is_official`
- `idx_template_popularity` ON `popularity` DESC

---

## 四、ER 图

```
┌────────────────────┐         ┌────────────────────┐
│     characters     │         │ personality_states │
│     (AIRI 原生)    │1───────1│   (LifeOS 扩展)    │
├────────────────────┤         ├────────────────────┤
│ id PK              │         │ id PK              │
│ character_id       │         │ character_id FK  UK│
│ version            │         │ version            │
│ cover_url          │         │ template_id FK     │
│ creator_id         │         │ trait_*            │
│ owner_id           │         │ speech_*           │
│ ...                │         │ backstory_*        │
└─────────┬──────────┘         │ compiled_prompt    │
          │                    │ evolution_points   │
          │                    │ ...                │
          │                    └─────────┬──────────┘
          │                              │
          │                              │ 1
          │                              │ N
          │                    ┌─────────▼──────────┐
          │                    │ evolution_history  │
          │                    │   (LifeOS 扩展)    │
          │                    ├────────────────────┤
          │                    │ id PK              │
          │                    │ character_id FK    │
          │                    │ level              │
          │                    │ trigger            │
          │                    │ old_traits         │
          │                    │ new_traits         │
          │                    │ ...                │
          │                    └────────────────────┘
          │
          │ 1
          │ N
┌─────────▼──────────┐
│   character_i18n   │
│   (AIRI 原生)      │
├────────────────────┤
│ id PK              │
│ character_id FK    │
│ language           │
│ name               │
│ description        │
│ tags               │
└────────────────────┘

┌────────────────────┐
│ character_templates│
│   (LifeOS 扩展)    │
├────────────────────┤
│ id PK              │
│ name               │
│ category           │
│ init_trait_*       │
│ init_speech_*      │
│ is_official        │
└────────────────────┘
```

---

## 五、数据一致性策略

### 5.1 一对一关系约束

`characters` ↔ `personality_states` 是一对一关系，通过以下方式保证：
1. `personality_states.character_id` 设为唯一索引
2. 创建角色时通过事务同时创建 `personality_states`
3. 删除角色时通过事务软删除 `personality_states`

### 5.2 Prompt 编译一致性

- 人格参数变化 → 触发编译 → 写入 AIRI 的 `character_prompts`
- 编译版本号与 `personality_states.version` 严格对齐
- 失败重试机制：编译失败不更新 version，保证可重入

### 5.3 演化原子性

- 每次演化在事务内完成：扣积分 + 更新 traits + 写历史记录 + 触发编译
- 失败整体回滚，不出现中间状态

---

## 相关文档

- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构与 Domain 划分
- [02-角色系统设计.md](file:///workspace/docs/02-角色系统设计.md) — 角色系统总览
- [03-personality-domain.md](file:///workspace/docs/03-personality-domain.md) — Personality Domain 详细设计
- [development-rules.md](file:///workspace/docs/development-rules.md) — 开发规范
- [decision-log.md](file:///workspace/docs/decision-log.md) — 技术决策记录（ADR-007 统一字段规范）
