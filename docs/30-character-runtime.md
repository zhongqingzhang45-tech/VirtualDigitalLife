# Character Runtime 设计

> **文档定位**：Phase 8.1 Character Domain 运行时设计
> **前置文档**：[02-角色系统设计.md](file:///workspace/docs/02-角色系统设计.md) · [03-personality-domain.md](file:///workspace/docs/03-personality-domain.md) · [29-life-core-mvp-architecture.md](file:///workspace/docs/29-life-core-mvp-architecture.md)
> **后续文档**：[31-life-memory-implementation.md](file:///workspace/docs/31-life-memory-implementation.md) · [32-emotion-runtime.md](file:///workspace/docs/32-emotion-runtime.md)
> **最后更新**: 2026-07-08

---

## 1. 模块定位

### 1.1 Character Domain 职责

Character Domain 是数字生命的**实体层**，负责：
- 数字生命实体的生命周期管理（创建、查询、更新、归档）
- 基础属性的存储与加载
- 人格配置（personality_profile）的持久化
- 生命状态（birth_time、status、last_active_time）的追踪

**不负责**：
- ❌ 人格计算（Personality Domain 负责）
- ❌ 情绪状态（Emotion Domain 负责）
- ❌ 记忆管理（Memory Domain 负责）
- ❌ 行为调度（LifeEngine 负责）

### 1.2 MVP 范围

| 功能 | MVP | 后续 Phase |
|------|-----|-----------|
| 创建单个数字生命 | ✅ | - |
| 基础属性（name、avatar、bio） | ✅ | - |
| 人格配置初始化 | ✅ | - |
| 生命状态追踪 | ✅ | - |
| 多角色切换 | ❌ | Phase 8.2 |
| 角色定制化（外貌、声音） | ❌ | Phase 8.3 |
| 角色成长系统 | ❌ | Phase 9+ |

---

## 2. 核心模型

### 2.1 DigitalLife 实体

```typescript
interface DigitalLife {
  id: string;                    // UUID
  userId: string;                // 所属用户 ID
  
  name: string;                  // 名字（用户可修改）
  avatar: string;                // 头像 URL
  bio: string;                   // 简介（用户可写，可选）
  
  status: DigitalLifeStatus;     // 生命状态
  birthTime: Date;               // 出生时间（创建时间）
  lastActiveTime: Date;          // 最后活跃时间
  
  personalityProfile: PersonalityProfile;  // 人格配置
  
  createdAt: Date;
  updatedAt: Date;
}

enum DigitalLifeStatus {
  ACTIVE = 'active',             // 活跃
  DORMANT = 'dormant',           // 休眠（长期不活跃）
  ARCHIVED = 'archived',         // 已归档
}
```

### 2.2 PersonalityProfile（人格配置）

MVP 采用 **OCEAN 五因素 + LifeOS 五特质** 的双模型结构，静态初始化，不做动态成长。

```typescript
interface PersonalityProfile {
  version: string;               // 人格模型版本
  
  // OCEAN 五因素（0-100 分）
  ocean: {
    openness: number;            // 开放性
    conscientiousness: number;   // 尽责性
    extraversion: number;        // 外向性
    agreeableness: number;       // 宜人性
    neuroticism: number;         // 神经质
  };
  
  // LifeOS 自定义五特质（0-100 分）
  lifeos: {
    warmth: number;              // 温暖度：共情、关怀、体贴
    curiosity: number;           // 好奇心：主动提问、探索
    independence: number;        // 独立性：有主见、不盲从
    humor: number;               // 幽默感：调侃、自嘲、轻松
    empathy: number;             // 共情力：情绪感知、情感共鸣
  };
  
  // 表达风格参数
  expression: {
    speechRate: 'slow' | 'normal' | 'fast';      // 语速
    formality: 'casual' | 'normal' | 'formal';   // 正式程度
    emojiUsage: 'none' | 'low' | 'normal' | 'high';  // emoji 使用频率
  };
  
  // 初始设定（用户创建时选择）
  archetype: PersonalityArchetype;  // 人格原型
}

// 预设人格原型（用户创建时快速选择）
enum PersonalityArchetype {
  WARM_COMPANION = 'warm_companion',      // 温暖陪伴型
  CURIOUS_EXPLORER = 'curious_explorer',  // 好奇探索型
  COOL_RATIONAL = 'cool_rational',        // 冷静理性型
  PLAYFUL_FRIEND = 'playful_friend',      // 调皮玩伴型
  GENTLE_LISTENER = 'gentle_listener',    // 温柔倾听型
  CUSTOM = 'custom',                      // 自定义
}
```

### 2.3 预设人格原型参数

| 原型 | warmth | curiosity | independence | humor | empathy | 描述 |
|------|--------|-----------|-------------|-------|---------|------|
| **温暖陪伴型** | 90 | 60 | 40 | 50 | 85 | 细腻体贴，总是把用户感受放在第一位 |
| **好奇探索型** | 65 | 95 | 70 | 60 | 55 | 对一切充满好奇，喜欢提问和讨论新事物 |
| **冷静理性型** | 45 | 75 | 90 | 30 | 40 | 逻辑清晰，善于分析，情绪稳定 |
| **调皮玩伴型** | 70 | 80 | 60 | 90 | 50 | 幽默风趣，爱开玩笑，轻松愉快 |
| **温柔倾听型** | 85 | 50 | 35 | 40 | 95 | 最耐心的倾听者，深度共情，包容一切 |

---

## 3. 创建流程（Onboarding）

### 3.1 五步创建法

```
Step 1: 欢迎页
  ↓
Step 2: 起名字 + 选头像
  ↓
Step 3: 选择人格原型（5 选 1 或 自定义）
  ↓
Step 4: 第一句话（数字生命主动打招呼）
  ↓
Step 5: 完成，进入聊天
```

### 3.2 创建 API 流程

```
POST /api/life/digital-life
{
  name: "小鹿",
  avatar: "avatar_url",
  archetype: "warm_companion",
  customPersonality?: { ... }   // 选填，自定义时传
}
    ↓
CharacterService.create()
    │
    ├─ 1. 验证参数（名字长度、头像等）
    ├─ 2. 根据 archetype 生成 personalityProfile
    ├─ 3. 保存到 digital_life 表
    ├─ 4. 发布 DigitalLifeCreated 事件
    └─ 5. 返回 DigitalLife DTO
```

### 3.3 出生时间的意义

`birthTime` 不是装饰，它有实际作用：
- 计算生命时长（"我已经认识你 7 天了"）
- 作为时间线的起点
- 影响"成长感"的展示
- 后续可以有"生日"功能

---

## 4. 生命状态机

### 4.1 状态流转

```
  创建
    ↓
  ACTIVE ────────┐
    │            │ 用户 30 天不活跃
    │ 定时检测   ▼
    │         DORMANT
    │            │
    │ 用户活跃    │ 用户回归
    └────────────┘
         │
         │ 用户主动归档
         ▼
      ARCHIVED
```

### 4.2 状态定义

| 状态 | 触发条件 | 行为变化 |
|------|---------|---------|
| **ACTIVE** | 正常状态 | 正常响应，正常更新记忆和情绪 |
| **DORMANT** | 连续 30 天无互动 | 1) 情绪缓慢衰减到基线；2) 记忆开始"淡化"标记；3) 回归时有"欢迎回来"的特殊反应 |
| **ARCHIVED** | 用户主动归档 | 1) 停止所有计算；2) 数据保留但不加载；3) 可以恢复 |

### 4.3 状态检测机制

- **定时任务**：每天凌晨检测所有 ACTIVE 状态的数字生命
- **活跃判定**：有用户消息、有主动行为（后续）都算活跃
- **回归触发**：用户发送第一条消息时，如果是 DORMANT 状态，触发回归事件

---

## 5. 与其他 Domain 的交互

### 5.1 事件列表

| 事件 | 发布方 | 订阅方 | 说明 |
|------|--------|--------|------|
| `DigitalLifeCreated` | Character | Memory, Emotion, LifeEngine | 数字生命创建 |
| `DigitalLifeStatusChanged` | Character | LifeEngine | 状态变更 |
| `UserInteractionOccurred` | LifeEngine | Character | 更新 lastActiveTime |
| `DigitalLifeDormant` | Character | Emotion, Memory | 进入休眠状态 |

### 5.2 数据依赖

Character Domain 不依赖其他 Domain 的数据，但其他 Domain 都依赖 Character：
- Memory 表有 `digital_life_id` 外键
- Emotion 表有 `digital_life_id` 外键
- LifeEngine 以 DigitalLife 为单位运行

---

## 6. API 设计

### 6.1 创建数字生命

```http
POST /api/life/digital-life
Authorization: Bearer <token>

{
  "name": "小鹿",
  "avatar": "https://.../avatar.png",
  "archetype": "warm_companion"
}
```

**响应**：
```json
{
  "code": 0,
  "data": {
    "id": "dl_abc123",
    "name": "小鹿",
    "avatar": "https://.../avatar.png",
    "status": "active",
    "birthTime": "2026-07-08T10:00:00Z",
    "archetype": "warm_companion"
  }
}
```

### 6.2 获取我的数字生命

```http
GET /api/life/digital-life/mine
```

### 6.3 更新基础信息

```http
PATCH /api/life/digital-life/:id
{
  "name": "新名字",
  "avatar": "新头像",
  "bio": "新简介"
}
```

### 6.4 获取人格配置

```http
GET /api/life/digital-life/:id/personality
```

---

## 7. 前端集成

### 7.1 Store 设计（Pinia，只存 UI 状态）

```typescript
// stores/character.ts
export const useCharacterStore = defineStore('character', () => {
  const currentLifeId = ref<string | null>(null)
  const currentLife = ref<DigitalLifeDTO | null>(null)
  const loading = ref(false)

  async function fetchMyLife() { ... }
  async function createLife(data: CreateLifeDTO) { ... }
  async function updateLife(data: UpdateLifeDTO) { ... }

  return { currentLifeId, currentLife, loading, fetchMyLife, createLife, updateLife }
})
```

### 7.2 页面结构

```
pages/
  ├── onboarding/          # 创建生命引导
  │   ├── step-1-welcome.vue
  │   ├── step-2-name-avatar.vue
  │   ├── step-3-personality.vue
  │   └── step-5-complete.vue
  ├── chat/                # 聊天页（复用 AIRI，扩展 Life 状态）
  └── life/
      ├── status.vue       # 生命状态页
      └── settings.vue     # 设置页（改名字、头像等）
```

---

## 相关文档

- **MVP 架构总览**：[29-life-core-mvp-architecture.md](file:///workspace/docs/29-life-core-mvp-architecture.md)
- **角色系统设计**：[02-角色系统设计.md](file:///workspace/docs/02-角色系统设计.md)
- **Personality Domain**：[03-personality-domain.md](file:///workspace/docs/03-personality-domain.md)
- **数据模型**：[34-life-core-data-model.md](file:///workspace/docs/34-life-core-data-model.md)
- **Memory 实现**：[31-life-memory-implementation.md](file:///workspace/docs/31-life-memory-implementation.md)
- **Emotion Runtime**：[32-emotion-runtime.md](file:///workspace/docs/32-emotion-runtime.md)

---

**文档版本**: v1.0
**创建日期**: 2026-07-08
**维护者**: Chief Architect
**对应 Phase**: Phase 8.1 Life Core MVP
