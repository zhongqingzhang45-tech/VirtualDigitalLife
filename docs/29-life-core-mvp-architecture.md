# Life Core MVP 架构设计

> **文档定位**：Phase 8.1 Life Core MVP 总体架构设计
> **前置文档**：[architecture.md](file:///workspace/docs/architecture.md) · [09-engine-framework.md](file:///workspace/docs/09-engine-framework.md)
> **后续文档**：[30-character-runtime.md](file:///workspace/docs/30-character-runtime.md) · [31-life-memory-implementation.md](file:///workspace/docs/31-life-memory-implementation.md) · [32-emotion-runtime.md](file:///workspace/docs/32-emotion-runtime.md) · [33-life-engine-runtime.md](file:///workspace/docs/33-life-engine-runtime.md)
> **最后更新**：2026-07-08

---

## 1. MVP 定位与目标

### 1.1 为什么做 Life Core MVP

Phase 1-7 完成了完整的设计蓝图，但**设计 ≠ 实现**。

LifeOS 的核心价值不是功能列表，而是**"生命感"**——用户能感觉到对面是一个有记忆、有情绪、会成长的真实存在，而不是一个问答机器。

MVP 的唯一目标：**验证第一个"生命感"闭环**。

### 1.2 成功标准（唯一验证标准）

不是页面完成，不是功能完成，而是完成这个体验闭环：

```
Day 1
  用户: "最近工作压力特别大，每天都加班到很晚。"
    ↓
  AI: （倾听 + 共情）
    ↓
  系统后台:
    MemoryEngine 编码并存储记忆
    EmotionEngine 更新情绪状态（concern↑）
    ↓
  数据库: memory #001 写入

================

Day 7（用户再次打开）
  用户: "嗨，最近怎么样？"
    ↓
  Memory Retrieval: 检索到 7 天前的"工作压力"记忆
    ↓
  Emotion Update: 根据记忆更新当前情绪基线
    ↓
  AI Response: "之前你说工作压力挺大的，
               每天都加班到很晚，
               现在有没有好一点？"
    ↓
  用户反应: "你居然记得？！"
```

**当用户说出"你居然记得"的那一刻，MVP 成功。**

### 1.3 MVP 范围（做什么 / 不做什么）

| 模块 | 做（MVP） | 不做（后续 Phase） |
|------|----------|-------------------|
| **Character** | 创建单个数字生命实体、基础属性 | 多角色、角色切换、角色定制化 |
| **Personality** | OCEAN 五因素 + LifeOS 五特质（静态） | 人格成长、人格动态演化 |
| **Memory** | 事件编码 + 语义检索 + 时间检索 | 记忆遗忘、记忆重构、记忆整合 |
| **Emotion** | 5 种基础情绪 + 衰减模型 | 复杂情绪、情绪节律、情绪表达多样性 |
| **LifeEngine** | 事件驱动调度 + 状态快照 | 自主行为、目标系统、行为规划 |
| **Relationship** | ❌ | Phase 8.2 |
| **Timeline** | ❌ | Phase 8.2 |
| **Narrative** | ❌ | Phase 8.2 |
| **AIRI Body** | ❌ | Phase 8.3 |
| **Community** | ❌ | Phase 9+ |
| **商业化** | ❌ | Phase 10+ |

---

## 2. 总体架构

### 2.1 架构分层

```
┌──────────────────────────────────────────────────────────┐
│                    Presentation Layer                      │
│              （基于 AIRI Chat UI 扩展）                   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  创建生命引导  │  │  聊天界面    │  │  生命状态页   │   │
│  │  Onboarding  │  │  Chat View   │  │  Life Status │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                    Application Layer                       │
│                                                              │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Life Application Service               │  │
│  │  （用例编排层：协调各 Domain 完成业务用例）          │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Memory     │ │  LifeEngine  │ │  Character   │
│   Domain     │ │  Domain      │ │  Domain      │
│  （核心）    │ │  （调度）    │ │  （实体）    │
└──────────────┘ └──────────────┘ └──────────────┘
         │               │               │
         ▼               ▼               ▼
┌──────────────────────────────────────────────────────────┐
│                    Domain Layer 共用                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │ Personality  │ │   Emotion    │ │   事件总线    │    │
│  │  Domain      │ │   Domain    │ │  Event Bus   │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ PostgreSQL   │  │ Vector Store │  │  LLM Gateway │   │
│  │  关系数据库   │  │  pgvector    │  │   AI 网关    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### 2.2 技术选型（MVP）

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | Vue 3 + TypeScript + Naive UI + UnoCSS | 复用 AIRI 基座，不引入新框架 |
| **状态管理** | Pinia | 只存 UI 状态，遵循 [development-rules.md](file:///workspace/docs/development-rules.md) 规范 |
| **后端** | NestJS (Node.js + TypeScript) | 与前端同语言，DDD 分层清晰 |
| **数据库** | PostgreSQL 15+ | 主数据库 |
| **向量存储** | pgvector | PostgreSQL 扩展，避免引入新数据库 |
| **认证** | JWT | 简化 MVP 认证流程 |
| **AI 网关** | 统一 LLM Gateway | 抽象底层模型，后续可替换 |
| **API 风格** | RESTful | 遵循 [development-rules.md](file:///workspace/docs/development-rules.md) 规范 |

### 2.3 为什么选择 NestJS + PostgreSQL + pgvector

| 选择 | 原因 |
|------|------|
| **NestJS** | 1) TypeScript 全栈，前后端共享类型；2) 原生支持 DDD 分层 + 依赖注入；3) Module 体系与 Domain 划分天然契合；4) 社区成熟，生态完善 |
| **PostgreSQL + pgvector** | 1) 避免同时维护关系库 + 向量库两套系统；2) MVP 数据量小，pgvector 性能够用；3) 事务一致性好，记忆写入 + 向量写入可以在同一事务中；4) 后续规模上来了再迁移到专门向量库 |
| **单数据库** | MVP 阶段最小化基础设施复杂度，把注意力集中在核心体验上 |

---

## 3. 核心 Domain 职责边界

### 3.1 Domain 依赖关系（严格遵守依赖方向）

```
Character Domain ◄─── LifeEngine Domain
         ▲                  ▲
         │                  │
         └──── Memory Domain ┘
                  ▲       ▲
                  │       │
         Personality Domain │
                          Emotion Domain
```

**依赖方向规则**（摘自 [development-rules.md](file:///workspace/docs/development-rules.md)）：
- 上层可以依赖下层，下层不能反向依赖
- Domain 之间通过**事件**通信，不直接调用
- LifeEngine 作为调度中心，协调各 Domain

### 3.2 各 Domain 职责

#### Character Domain（实体层）
- 数字生命实体的创建、查询、更新
- 基础属性管理（name、avatar、birth_time、status）
- personality_profile 的存储与加载
- **不做**：人格计算、情绪计算、记忆管理

#### Personality Domain（特质层）
- OCEAN 五因素模型
- LifeOS 自定义五特质（warmth / curiosity / independence / humor / empathy）
- 人格对表达风格的影响计算
- **MVP 状态**：静态初始化，不做动态成长

#### Memory Domain（核心层）⭐ 第一优先级
- 记忆编码：用户消息 → 结构化 Memory Event
- 记忆存储：PostgreSQL + pgvector
- 记忆检索：语义检索 + 时间检索 + 重要性加权
- 记忆类型：USER_MESSAGE、USER_STATE、LIFE_EVENT、SYSTEM_OBSERVATION
- **核心价值**：这是 MVP 中最重要的模块

#### Emotion Domain（状态层）
- EmotionState 五维模型（joy / trust / concern / sadness / curiosity）
- 情绪更新：事件触发情绪变化
- 情绪衰减：时间推移情绪自然回归基线
- 情绪对响应的影响
- **MVP 简化**：五维足够，不用复杂的情绪模型

#### LifeEngine Domain（调度层）
- 事件接收与分发
- Domain 协调调度
- 生命状态快照（state snapshot）
- 生命周期管理（init / tick / destroy）
- **MVP 简化**：只做事件驱动，不做自主行为调度

---

## 4. 核心数据流（记忆闭环）

### 4.1 写入流程（Day 1: 用户说压力大）

```
用户输入消息
    │
    ▼
Chat Controller（Presentation）
    │
    ▼
LifeAppService（Application）
    │ 发布事件: UserMessageReceived
    ▼
LifeEngine（调度层）
    │
    ├────► MemoryDomain.handleMessage()
    │          │
    │          ├─ 1. LLM 编码: 提取事件类型、情绪、重要性
    │          ├─ 2. 生成 embedding
    │          └─ 3. 写入 memory 表 + vector 表
    │
    ├────► EmotionDomain.updateFromEvent()
    │          │
    │          └─ concern +0.3, 其他情绪微调
    │
    └────► 生成 AI 回复
              │
              ├─ 从 Personality 获取表达风格
              ├─ 从 Emotion 获取当前情绪基调
              └─ 调用 LLM 生成回复
    │
    ▼
返回用户
```

### 4.2 读取流程（Day 7: 用户再次对话）

```
用户再次发送消息
    │
    ▼
LifeAppService
    │
    ▼
LifeEngine 处理新消息前
    │
    ├─ 1. Memory Retrieval
    │     │
    │     ├─ 语义检索: 与当前消息相关的记忆
    │     ├─ 时间检索: 近期的重要记忆
    │     └─ 重要性加权: 高重要性记忆优先
    │
    ├─ 2. Emotion Update
    │     │
    │     └─ 根据检索到的记忆更新当前情绪
    │        （例如：看到"压力大"的记忆 → concern↑）
    │
    └─ 3. 构建 Response Context
          │
          ├─ 相关记忆摘要
          ├─ 当前情绪状态
          └─ 人格特质
    │
    ▼
LLM 生成回复（带上记忆上下文）
    │
    ▼
"之前你说工作压力挺大的，现在有没有好一点？"
```

### 4.3 事件流示例

```
UserMessageReceived 事件
    │
    ├─ MemoryDomain: encodeAndSave() ────► MemorySaved 事件
    ├─ EmotionDomain: updateFromEvent() ──► EmotionChanged 事件
    └─ LifeEngine: takeSnapshot() ────────► LifeStateSnapshotted 事件
```

---

## 5. MVP 用例列表

### 5.1 用户侧用例

| 用例 ID | 用例名称 | 描述 | 优先级 |
|---------|---------|------|--------|
| UC-001 | 用户注册/登录 | 创建账号、登录 | P0 |
| UC-002 | 创建数字生命 | Onboarding 引导，设置名字、头像、初始人格 | P0 |
| UC-003 | 发送消息 | 与数字生命对话 | P0 |
| UC-004 | 查看生命状态 | 查看当前情绪、记忆数量、生命时长 | P1 |
| UC-005 | 查看记忆列表 | 浏览历史记忆（时间线视图简化版） | P1 |
| UC-006 | 修改基础信息 | 修改名字、头像 | P2 |

### 5.2 系统侧用例

| 用例 ID | 用例名称 | 描述 | 优先级 |
|---------|---------|------|--------|
| UC-S01 | 记忆编码 | 用户消息 → 结构化记忆 | P0 |
| UC-S02 | 记忆检索 | 语义 + 时间 + 重要性混合检索 | P0 |
| UC-S03 | 情绪更新 | 事件触发情绪变化 | P0 |
| UC-S04 | 情绪衰减 | 定时任务，情绪自然回归基线 | P1 |
| UC-S05 | 状态快照 | 定期保存生命状态 | P1 |
| UC-S06 | 记忆上下文注入 | 对话时注入相关记忆 | P0 |

---

## 6. 目录结构

### 6.1 Monorepo 结构

```
lifeos/
├── apps/
│   ├── web/                 # 前端应用（基于 AIRI 扩展）
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── life/    # 数字生命相关 UI
│   │   │   │   └── chat/    # 聊天 UI
│   │   │   └── ...
│   │   └── package.json
│   │
│   └── api/                 # 后端 API（NestJS）
│       ├── src/
│       │   ├── modules/
│       │   │   ├── character/     # Character Domain
│       │   │   ├── personality/   # Personality Domain
│       │   │   ├── memory/        # Memory Domain ⭐
│       │   │   ├── emotion/       # Emotion Domain
│       │   │   ├── life-engine/   # LifeEngine Domain
│       │   │   └── common/        # 公共基础设施
│       │   └── main.ts
│       └── package.json
│
├── packages/
│   ├── shared-types/        # 前后端共享类型定义
│   └── ai-gateway/          # AI 网关（LLM 抽象）
│
└── docs/                    # 设计文档（当前位置）
```

### 6.2 后端 Domain 目录结构（以 Memory 为例）

```
memory/
├── domain/                 # Domain 层
│   ├── entities/
│   │   └── memory.entity.ts
│   ├── value-objects/
│   │   ├── memory-type.vo.ts
│   │   └── memory-importance.vo.ts
│   ├── repositories/
│   │   └── memory.repository.ts  # 接口定义
│   └── services/
│       ├── memory-encoder.service.ts
│       └── memory-retriever.service.ts
├── application/            # Application 层
│   └── memory.app-service.ts
├── infrastructure/         # Infrastructure 层
│   ├── repositories/
│   │   └── memory.repository.impl.ts
│   └── ai/
│       └── memory-encoder.ai.ts
└── interface/              # Interface 层（API）
    ├── memory.controller.ts
    └── dto/
        └── memory.dto.ts
```

---

## 7. 风险与应对

| 风险 | 概率 | 影响 | 应对策略 |
|------|------|------|---------|
| 记忆检索质量差，用户感知不到"被记住" | 高 | 致命 | 1) 先做人工规则 + 关键词匹配，再逐步上向量；2) 重要记忆强制置顶；3) 记忆注入前做相关性校验 |
| 情绪更新不合理，用户觉得突兀 | 中 | 中 | 1) MVP 情绪变化幅度做小；2) 情绪只影响措辞，不影响事实回答；3) 情绪状态可视化，让用户感知 |
| LLM 编码记忆质量不稳定 | 中 | 高 | 1) 用结构化 prompt + 输出 schema 约束；2) 关键信息人工提取 fallback；3) 编码结果可编辑 |
| pgvector 性能不达标 | 低 | 中 | MVP 数据量小（<10万条），性能足够；后续迁移 Milvus/pinecone |
| 前后端联调成本高 | 中 | 中 | 1) 前后端共享 TypeScript 类型；2) 先做 API 契约再开发；3) Mock 数据并行开发 |

---

## 8. 开发顺序建议

```
Week 1: 基础设施搭建
  ├─ 后端 NestJS 脚手架 + 数据库
  ├─ 前后端共享类型
  └─ AI Gateway 抽象

Week 2: Character + Personality（基础）
  ├─ 用户注册/登录
  ├─ 创建数字生命 API
  └─ 人格模型定义

Week 3: Memory Domain（核心 ⭐）
  ├─ 记忆编码服务
  ├─ pgvector 集+
  ├─ 记忆检索服务
  └─ 记忆 CRUD API

Week 4: Emotion + LifeEngine
  ├─ 情绪模型 + 更新逻辑
  ├─ 情绪衰减定时任务
  ├─ LifeEngine 事件调度
  └─ 状态快照

Week 5: 前端集成 + 闭环验证
  ├─ 创建生命 Onboarding UI
  ├─ 聊天界面集成
  ├─ 生命状态页
  └─ 端到端测试"生命感"闭环

Week 6: 优化 + 打磨
  ├─ 记忆质量调优
  ├─ 情绪表达自然度
  ├─ 性能优化
  └─ Bug 修复
```

---

## 相关文档

- **技术架构基线**：[architecture.md](file:///workspace/docs/architecture.md)
- **数据模型设计**：[34-life-core-data-model.md](file:///workspace/docs/34-life-core-data-model.md)
- **Character Runtime**：[30-character-runtime.md](file:///workspace/docs/30-character-runtime.md)
- **Memory 实现设计**：[31-life-memory-implementation.md](file:///workspace/docs/31-life-memory-implementation.md)
- **Emotion Runtime**：[32-emotion-runtime.md](file:///workspace/docs/32-emotion-runtime.md)
- **LifeEngine Runtime**：[33-life-engine-runtime.md](file:///workspace/docs/33-life-engine-runtime.md)
- **开发规范**：[development-rules.md](file:///workspace/docs/development-rules.md)
- **决策记录**：[decision-log.md](file:///workspace/docs/decision-log.md)（ADR-042 ~ ADR-045）

---

**文档版本**: v1.0
**创建日期**: 2026-07-08
**维护者**: Chief Architect
**对应 Phase**: Phase 8.1 Life Core MVP
