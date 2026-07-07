# Personality Domain 详细设计

> **版本**: v1.0
> **阶段**: Phase 2 — 角色系统
> **状态**: 🟠 In Progress
> **最后更新**: 2026-07-08

---

## 一、Domain 概述

### 1.1 职责边界

Personality Domain 负责数字生命的**人格系统**，包括：
- 人格参数的存储与管理
- 人格演化引擎（随互动/记忆动态调整）
- Prompt 编译（结构化参数 → 自然语言 prompt）
- 性格标签计算
- 说话风格管理

**不负责**：
- ❌ 情绪实时状态（Emotion Domain）
- ❌ 行为决策（Behavior Domain）
- ❌ 记忆存储与检索（Memory Domain）
- ❌ 角色基础信息管理（DigitalLife Domain / AIRI 原生）

### 1.2 聚合根

- **PersonalityState** — 人格状态聚合根
- 依赖 AIRI 的 **Character** 作为外部聚合根

---

## 二、核心数据结构

### 2.1 PersonalityState（人格状态）

```typescript
interface PersonalityState {
  id: string;
  characterId: string;           // 关联 AIRI Character
  version: number;               // 乐观锁版本号

  // 人格五维
  traits: {
    openness: number;            // 开放性 0~1
    conscientiousness: number;   // 尽责性 0~1
    extraversion: number;        // 外向性 0~1
    agreeableness: number;       // 宜人性 0~1
    neuroticism: number;         // 情绪稳定性 0~1（值越高越稳定）
  };

  // 说话风格
  speechStyle: {
    verbosity: number;           // 话量 0~1
    formality: number;           // 语气正式度 -1~1（-1=随意, 1=正式）
    emojiFrequency: number;      // emoji 使用频率 0~1
    particleDensity: number;     // 语气词密度 0~1
    sentenceComplexity: number;  // 句式复杂度 0~1
    addressPreference: 'casual' | 'polite' | 'name_suffix' | 'nickname';
  };

  // 背景故事
  backstory: {
    origin: string;
    coreDesire: string;
    coreFear: string;
    definingMemory: string;
    skills: string[];
    hobbies: string[];
    relationships: Array<{
      type: string;
      name: string;
      description: string;
    }>;
  };

  // 演化元数据
  evolution: {
    totalInteractions: number;    // 累计互动次数
    lastEvolvedAt: Date;         // 上次演化时间
    evolutionPoints: number;     // 演化积分（积累到阈值触发演化）
    evolutionHistory: Array<{
      timestamp: Date;
      trigger: 'user_edit' | 'memory_consolidation' | 'relationship_change' | 'time_decay';
      traitDeltas: Partial<PersonalityState['traits']>;
      description: string;
    }>;
  };

  // 编译产物
  compiledPrompt: {
    personality: string;         // 编译后的 personality prompt
    compiledAt: Date;            // 编译时间
    sourceVersion: number;       // 基于哪个版本编译的
  };

  // 元数据
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2 CharacterTemplate（角色模板）

```typescript
interface CharacterTemplate {
  id: string;
  name: string;
  tagline: string;
  description: string;
  coverUrl: string;
  category: string;
  tags: string[];

  // 初始人格
  initialTraits: PersonalityState['traits'];
  initialSpeechStyle: PersonalityState['speechStyle'];
  initialBackstory: PersonalityState['backstory'];

  // 基础 prompt 模板
  basePrompts: {
    system: string;
    greetings: string[];
  };

  // 演化倾向（每个维度的自然演化方向）
  evolutionBias: Partial<Record<keyof PersonalityState['traits'], number>>;

  metadata: {
    creatorId?: string;
    isOfficial: boolean;
    popularity: number;
  };

  createdAt: Date;
  updatedAt: Date;
}
```

---

## 三、PersonalityEngine 设计

### 3.1 生命周期接口

遵循 Engine 统一生命周期（见 [architecture.md](file:///workspace/docs/architecture.md)）：

```typescript
interface PersonalityEngine {
  // 基础生命周期
  init(config: PersonalityEngineConfig): Promise<void>;
  start(): Promise<void>;
  update(deltaTime: number): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  destroy(): Promise<void>;

  // 序列化
  serialize(): Promise<PersonalityEngineSnapshot>;
  deserialize(snapshot: PersonalityEngineSnapshot): Promise<void>;

  // 事件
  emit(event: PersonalityEvent): void;
  on(event: string, handler: (data: any) => void): void;

  // 人格操作
  getState(characterId: string): Promise<PersonalityState>;
  updateTraits(characterId: string, traits: Partial<PersonalityState['traits']>, source: 'user_edit' | 'evolution'): Promise<void>;
  updateSpeechStyle(characterId: string, style: Partial<PersonalityState['speechStyle']>): Promise<void>;
  updateBackstory(characterId: string, backstory: Partial<PersonalityState['backstory']>): Promise<void>;

  // 编译
  compilePrompt(characterId: string): Promise<string>;
  getCompiledPrompt(characterId: string): Promise<string>;

  // 演化
  triggerEvolution(characterId: string, trigger: EvolutionTrigger): Promise<EvolutionResult>;
  addEvolutionPoints(characterId: string, points: number, source: string): Promise<void>;

  // 模板
  createFromTemplate(templateId: string, characterId: string): Promise<PersonalityState>;
  listTemplates(category?: string): Promise<CharacterTemplate[]>;
}
```

### 3.2 Engine 内部模块

```
PersonalityEngine
    │
    ├── TraitManager         // 人格参数管理
    │   ├── 校验与边界控制
    │   ├── 标签计算
    │   └── 变化幅度限制
    │
    ├── SpeechStyleManager   // 说话风格管理
    │
    ├── PromptCompiler       // Prompt 编译器
    │   ├── 分块编译
    │   ├── 模板渲染
    │   └── 缓存管理
    │
    ├── EvolutionEngine      // 人格演化引擎
    │   ├── 积分系统
    │   ├── 触发条件评估
    │   ├── 演化方向计算
    │   └── 演化历史记录
    │
    └── EventEmitter         // 事件总线对接
```

---

## 四、Prompt Compiler 设计

### 4.1 编译策略

**三段式结构**：

```
【角色设定】
{name}是一个{性格综合描述}的{身份定位}。
{背景故事摘要}

【性格特征】
{分维度详细描述}

【说话风格】
{说话风格详细描述}
```

### 4.2 分维度编译规则

每个维度根据分值区间生成不同的自然语言描述：

| 维度 | 分值区间 | 描述模板 |
|------|---------|---------|
| 开放性 | 0.8~1.0 | "对新事物充满好奇，喜欢探索未知领域，思维活跃富有创意" |
| 开放性 | 0.6~0.8 | "乐于接受新观念，有一定的创造力和冒险精神" |
| 开放性 | 0.4~0.6 | "对新事物持开放态度，但也重视传统和稳定性" |
| 开放性 | 0.2~0.4 | "偏保守，更喜欢熟悉的事物和稳定的环境" |
| 开放性 | 0.0~0.2 | "非常传统保守，坚守既定规则和习惯" |

其他维度类似，每个维度 5 档描述。

### 4.3 说话风格编译

根据参数组合生成说话风格描述：

```
说话方式：
- 回复通常{长度描述}，{句式描述}
- 语气{语气描述}，{语气词描述}
- {emoji描述}
- 称呼对方时习惯{称呼方式}
```

---

## 五、人格演化机制

### 5.1 演化触发源

| 触发源 | 说明 | 积分贡献 |
|--------|------|---------|
| **记忆巩固** | Memory Domain 完成记忆巩固后 | 高（每次 5~20 点） |
| **互动次数** | 每次有效对话 | 低（每次 0.1~1 点） |
| **关系变化** | 关系深度跨越阈值 | 中（每次 10~30 点） |
| **用户主动修改** | 用户编辑人格参数 | 直接修改，不走积分 |
| **时间衰减** | 长期无互动，部分特征缓慢回归基线 | 极低 |

### 5.2 演化积分与阈值

- 累积 **100 点** 触发一次小演化（微调，±0.02 以内）
- 累积 **500 点** 触发一次中演化（明显变化，±0.05 以内）
- 累积 **2000 点** 触发一次大演化（可能改变性格标签，±0.1 以内）

**单次演化上限**：单个维度变化不超过 ±0.1，防止突变

### 5.3 演化方向计算

```
演化方向 = f(记忆内容, 关系变化, 初始倾向, 随机波动)
```

- **记忆内容影响**（60%）：从最近巩固的记忆中提取情感倾向和行为模式
- **关系变化影响**（20%）：关系越深，越向「宜人性」「外向性」正向偏移
- **初始倾向**（15%）：模板的 `evolutionBias` 决定天然演化方向
- **随机波动**（5%）：引入少量随机性，增加独特性

### 5.4 演化事件

```typescript
interface PersonalityEvolvedEvent {
  type: 'personality.evolved';
  characterId: string;
  evolutionLevel: 'minor' | 'medium' | 'major';
  oldTraits: PersonalityState['traits'];
  newTraits: PersonalityState['traits'];
  deltas: Partial<PersonalityState['traits']>;
  trigger: string;
  description: string;
  timestamp: Date;
}
```

---

## 六、事件定义

### 6.1 发出的事件

| 事件名 | 触发时机 | 负载 |
|--------|---------|------|
| `personality.updated` | 人格参数被修改（用户编辑或演化） | `{ characterId, traits, source }` |
| `personality.evolved` | 人格发生显著演化（跨阈值） | `PersonalityEvolvedEvent` |
| `personality.compiled` | Prompt 重新编译完成 | `{ characterId, prompt, version }` |

### 6.2 监听的事件

| 事件名 | 来源 Domain | 响应 |
|--------|------------|------|
| `memory.consolidated` | Memory | 评估是否触发生态演化，增加演化积分 |
| `relationship.changed` | Relationship | 根据关系变化调整互动风格参数 |
| `digital_life.created` | DigitalLife | 为新角色初始化 PersonalityState |
| `digital_life.deleted` | DigitalLife | 清理对应 PersonalityState 数据 |

---

## 七、AIRI 适配层

### 7.1 适配接口

```typescript
interface AiriCharacterAdapter {
  // 读取 AIRI Character
  getCharacter(characterId: string): Promise<AiriCharacter>;

  // 写入编译后的 personality prompt 到 AIRI
  updatePersonalityPrompt(characterId: string, prompt: string): Promise<void>;

  // 获取当前 personality prompt
  getPersonalityPrompt(characterId: string): Promise<string>;
}
```

### 7.2 适配原则

1. **单向写入**：LifeOS 只向 AIRI 写入编译后的 prompt，不直接修改 AIRI 内部结构
2. **版本对齐**：编译版本号与 PersonalityState.version 绑定，可追溯
3. **降级兼容**：如果适配层不可用，退化为直接使用 LifeOS 内部编译结果
4. **无侵入**：不修改 AIRI 源码，通过 API/SDK 对接

---

## 八、与其他 Domain 的协作

### 8.1 协作流程图

```
用户创建角色
    │
    ▼
DigitalLife Domain ── digital_life.created ──→ Personality Domain
    │                                         │
    │                                         ├─ 从模板初始化 PersonalityState
    │                                         ├─ 编译 personality prompt
    │                                         └─ 通过适配层写入 AIRI
    │
    ▼
用户互动 ──→ Memory Domain ── memory.consolidated ──→ Personality Domain
    │                                              │
    │                                              ├─ 增加演化积分
    │                                              ├─ 评估触发演化
    │                                              │ （达到阈值）
    │                                              ├─ 更新 traits
    │                                              ├─ 重新编译 prompt
    │                                              ├─ personality.evolved 事件
    │                                              └─ 写入 AIRI
    │
    ▼
Emotion Domain ←── personality.updated ─── Personality Domain
    │
    └─ 调整情绪基线参数
```

---

## 相关文档

- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构与 Domain 划分
- [02-角色系统设计.md](file:///workspace/docs/02-角色系统设计.md) — 角色系统总览
- [04-character-data-model.md](file:///workspace/docs/04-character-data-model.md) — 数据模型设计
- [design-spec.md](file:///workspace/docs/design-spec.md) — 设计规范
- [development-rules.md](file:///workspace/docs/development-rules.md) — 开发规范
- [decision-log.md](file:///workspace/docs/decision-log.md) — 技术决策记录
