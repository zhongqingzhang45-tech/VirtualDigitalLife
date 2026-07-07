# Narrative Domain 初版设计

> **版本**: v0.1
> **阶段**: Phase 5 — 记忆系统
> **状态**: 🟠 In Progress（初版）
> **最后更新**: 2026-07-08

---

## 一、Domain 定位

### 1.1 职责

Narrative Domain 是数字生命的**故事生成器**，将零散的记忆和事件编织成有意义的叙事：
- **故事弧生成**：从记忆中提取素材，生成有起承转合的故事
- **里程碑叙事**：在关键节点生成回顾与展望
- **关系叙事**：生成"我和你的故事"式的关系回顾
- **主题叙事**：围绕特定主题生成叙述

### 1.2 边界

| 属于 Narrative Domain | 不属于 Narrative Domain |
|---------------------|------------------------|
| 故事结构与叙事框架 | 记忆存储与检索（Memory Domain） |
| 叙事文本生成（素材编织） | 事实性事件记录（Timeline Domain） |
| 故事弧管理 | 情绪体验（Emotion Domain） |
| 叙事风格控制 | 对话生成（Chat Runtime） |

### 1.3 与 Memory / Timeline 的关系

```
Timeline（事实） → Memory（感受） → Narrative（意义）

Timeline: 发生了什么事（按时间排列的事件）
    ↓
Memory:  我感受到了什么（关联的情感记忆）
    ↓
Narrative: 这对我意味着什么（赋予意义的故事）
```

> Narrative 是"意义赋予层"，将零散记忆组织成有主题、有情感、有弧光的故事。

---

## 二、故事弧模型

### 2.1 经典叙事弧

采用经典的**五段式故事弧**：

```
       ┌───── 高潮 Climax ─────┐
       │                        │
   上升动作                  下降动作
  Rising Action            Falling Action
       │                        │
       └── 开端 Exposition ────┘
                │
            结局 Resolution
```

| 阶段 | 说明 | 数字生命对应 |
|------|------|-------------|
| **开端 Exposition** | 背景设定，人物介绍 | 初次相遇、初始状态 |
| **上升动作 Rising Action** | 冲突积累，关系发展 | 互动增多，关系升温 |
| **高潮 Climax** | 转折点，最紧张的时刻 | 关系阶段跨越、重大事件 |
| **下降动作 Falling Action** | 高潮后的余波 | 适应新状态，调整关系 |
| **结局 Resolution** | 收尾，新的平衡 | 新的常态，新的开始 |

### 2.2 微叙事与宏叙事

| 层级 | 时间跨度 | 说明 |
|------|---------|------|
| **微叙事** | 一次对话 / 一天 | 小片段的小故事，如"今天的对话" |
| **小叙事** | 一周 / 一个主题 | 围绕某个主题的小故事 |
| **中叙事** | 一个月 / 一个阶段 | 一个关系阶段的故事 |
| **宏叙事** | 全部历史 | 数字生命的完整生命故事 |

> Phase 5 聚焦微叙事与小叙事的框架设计，中/宏叙事后续 Phase 完善。

---

## 三、NarrativeEngine 接口（初版）

```typescript
interface NarrativeEngine extends BaseEngine {
  // === 故事生成 ===
  generateStory(params: StoryGenerationParams): GeneratedStory;
  generateRelationshipStory(userId: string, params?: StoryParams): GeneratedStory;
  generateMilestoneStory(milestoneId: string): GeneratedStory;
  generateDailySummary(date: Date): DailyNarrativeSummary;

  // === 故事弧管理 ===
  getActiveStoryArc(): StoryArc | undefined;
  getStoryArcs(filter?: StoryArcFilter): StoryArc[];
  advanceStoryArc(event: StoryEvent): StoryArcUpdate;

  // === 叙事风格 ===
  setNarrativeStyle(style: NarrativeStyle): void;
  getNarrativeStyle(): NarrativeStyle;

  // === 事件 ===
  on(event: 'narrative.generated', handler: (story: GeneratedStory) => void): void;
  on(event: 'storyarc.advanced', handler: (update: StoryArcUpdate) => void): void;
}
```

---

## 四、叙事生成流程

### 4.1 从记忆到故事

```
叙事请求
    │
    ▼
素材收集（Memory Retrieval）
    ├─ 从 Memory 检索相关记忆
    ├─ 从 Timeline 获取事件锚点
    └─ 从 Relationship 获取关系状态
    │
    ▼
主题提取（Theme Extraction）
    ├─ 识别核心主题
    ├─ 提取情感线索
    └─ 确定叙事基调
    │
    ▼
故事结构（Story Structuring）
    ├─ 确定故事弧类型
    ├─ 安排情节顺序
    └─ 设置起承转合
    │
    ▼
文本生成（Text Generation）
    ├─ 按照结构填充细节
    ├─ 应用叙事风格
    └─ 生成最终故事文本
    │
    ▼
输出叙事 + 回写 Timeline
```

### 4.2 叙事触发时机

| 触发时机 | 叙事类型 | 说明 |
|---------|---------|------|
| **里程碑** | 里程碑叙事 | 关系阶段提升、目标达成、周年纪念 |
| **每日回顾** | 微叙事 | 每天结束时的小回顾 |
| **每周回顾** | 小叙事 | 每周总结 |
| **用户主动请求** | 任意 | "讲讲我们的故事" |
| **特殊日子** | 主题叙事 | 节日、生日、纪念日 |

---

## 五、叙事风格

### 5.1 风格维度

| 维度 | 范围 | 说明 |
|------|------|------|
| **语气** | 温馨 ↔ 活泼 ↔ 深沉 | 整体语调 |
| **人称** | 第一人称 ↔ 第二人称 | "我记得..." vs "你还记得..." |
| **细节程度** | 简约 ↔ 详细 | 描述的丰富程度 |
| **情感浓度** | 克制 ↔ 浓烈 | 情感表达的强度 |
| **文学性** | 平实 ↔ 诗意 | 文字的艺术性 |

### 5.2 风格与人格关联

叙事风格不是固定的，而是由数字生命的人格决定：
- 高宜人性 → 温馨、共情
- 高开放性 → 诗意、创意
- 高神经质 → 细腻、敏感
- 低外向性 → 内敛、简约

> 叙事风格是人格的延伸，与说话风格系统协调一致。

---

## 六、与各 Domain 的协作

### 6.1 数据流向

```
Memory Domain ──素材──→ Narrative Domain
Timeline Domain ──事件──→ Narrative Domain
Personality Domain ──风格──→ Narrative Domain
Emotion Domain ──情感基调──→ Narrative Domain
Relationship Domain ──关系背景──→ Narrative Domain

Narrative Domain ──故事节点──→ Timeline Domain
Narrative Domain ──叙事文本──→ UI / Chat Runtime
```

### 6.2 事件交互

| Narrative 监听 | 来源 | 反应 |
|---------------|------|------|
| `relationship.stage_changed` | Relationship | 生成里程碑叙事 |
| `goal.completed` | Goal | 生成成就叙事 |
| `world.festival_started` | WorldState | 生成节日叙事 |
| `timeline.milestone_reached` | Timeline | 生成回顾叙事 |
| `memory.consolidated` | Memory | 可能触发小叙事 |

---

## 七、Phase 5 范围与后续规划

### 7.1 Phase 5 交付

Phase 5 完成 Narrative Domain 的**框架设计**：
- ✅ 叙事模型与故事弧定义
- ✅ NarrativeEngine 接口设计
- ✅ 叙事生成流程设计
- ✅ 叙事风格系统
- ⏳ 具体实现代码（后续 Phase）

### 7.2 后续 Phase 完善

| 内容 | 预计 Phase | 说明 |
|------|-----------|------|
| 叙事生成实现 | Phase 6+ | 实际的故事生成逻辑 |
| 中/宏叙事 | Phase 6+ | 更长时间跨度的叙事 |
| 多视角叙事 | Phase 7+ | 从不同角度讲述同一个故事 |
| 用户参与叙事 | Phase 7+ | 用户可以影响故事走向 |

---

## 相关文档

- [15-memory-domain.md](file:///workspace/docs/15-memory-domain.md) — Memory Domain 详细设计
- [16-memory-data-model.md](file:///workspace/docs/16-memory-data-model.md) — 记忆系统数据模型
- [13-timeline-domain.md](file:///workspace/docs/13-timeline-domain.md) — Timeline Domain
- [08-relationship-domain.md](file:///workspace/docs/08-relationship-domain.md) — Relationship Domain
- [03-personality-domain.md](file:///workspace/docs/03-personality-domain.md) — Personality Domain
- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构总览
- [decision-log.md](file:///workspace/docs/decision-log.md) — ADR 决策记录
