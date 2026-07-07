# LifeOS Social — 技术决策记录（ADR / Decision Log）

> **文档定位**：Architecture Decision Record，记录所有重大技术决策的背景、原因、备选方案与影响。
> **优先级**：低于 Master Prompt / AGENTS.md / architecture.md / design-spec.md / development-rules.md / coding-style.md。
> **更新规则**：每次重大技术决策后必须追加记录，不得删除或覆盖历史记录。

---

## ADR-001：技术栈选型

- **标题**：前端技术栈确定为 Vue3 + Naive UI + UnoCSS + TypeScript
- **背景**：Phase 1 设计系统冻结阶段，需确定唯一组件库与样式方案。
- **为什么**：
  - Vue3 与 AIRI 基座一致（基于 AIRI 扩展，不更换框架）。
  - Naive UI：TypeScript 原生、Vue3 生态、主题可定制、组件丰富、社区活跃。
  - UnoCSS：按需生成、原子化、性能优、与 Design Token 天然契合。
  - TypeScript Strict：类型安全，长期可维护性强。
- **备选方案**：
  - Element Plus：组件丰富但风格偏企业级，与 Anime × Future 气质不符。
  - Vuetify：Material Design 风格过重，定制成本高。
  - Ant Design Vue：企业级风格，与二次元社区定位不匹配。
  - Arco Design：字节出品但生态相对较小。
- **最终方案**：Vue3 + Naive UI（唯一组件库）+ UnoCSS + TypeScript Strict。
- **影响**：
  - 所有页面组件必须基于 Naive UI 扩展，禁止引入第二组件库。
  - 所有样式必须使用 UnoCSS 原子类，禁止大量 Scoped/Global CSS。
  - 类型必须严格，ESLint 0 Error。
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-002：设计语言方向

- **标题**：LifeOS 设计语言确定为「Anemone × Neon」—— 海葵霓虹
- **背景**：参考 iirose.com 的极简纯白 + 衬线字体 + 居中对称 + 大量留白的仪式感设计，但需结合 LifeOS 的 Anime × Future × Emotional × Community 定位，形成自己的设计语言。
- **为什么**：
  - iirose 的纯净与仪式感值得借鉴，但 LifeOS 是社区产品，需要更强的信息承载能力与情感温度。
  - 「海葵霓虹」融合了：深海般的暗色基底（沉浸感）+ 柔和霓虹发光（未来科技感）+ 生物性的呼吸脉动（情感/生命感）+ 二次元审美（Anime）。
  - 暗色模式优先：数字生命在"暗夜"中发光，更符合"生命体"的隐喻。
- **备选方案**：
  - 纯白极简（iirose 风格）：信息密度不足，社区场景下视觉疲劳。
  - 赛博朋克高饱和：过于硬核，缺乏陪伴感与温度。
  - 治愈系暖色调：缺乏未来科技感，与 Digital Life 定位不符。
- **最终方案**：
  - **Anemone × Neon（海葵霓虹）**：深紫蓝基底 + 粉紫霓虹主色 + 青蓝辅色 + 柔和发光 + 玻璃态卡片 + 呼吸感动效。
  - 暗色模式为默认，亮色模式为可选项。
- **影响**：
  - 所有 Design Token 以此为基础确定。
  - 所有 UI 组件必须在暗色模式下优先设计。
  - 发光效果是核心视觉语言，但必须克制使用（仅用于强调/交互状态）。
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-003：目录结构确定

- **标题**：业务代码统一使用 apps/lifeos-web + apps/server + packages/lifeos-core 三级目录
- **背景**：Master Prompt 明确禁止新增一级目录，需确定业务代码归属。
- **为什么**：
  - apps/lifeos-web：前端应用，基于 AIRI 扩展。
  - apps/server：后端服务，社区/用户/通知等 API。
  - packages/lifeos-core：数字生命核心引擎（Emotion/Memory/Behavior 等），前后端可复用。
  - 与 monorepo 结构一致，AIRI 原有 packages/apps 体系得以保留。
- **备选方案**：
  - 单仓库前后端混合：后期规模大时难以维护。
  - 多仓库分离：开发体验差，版本同步成本高。
- **最终方案**：Monorepo 三级结构：apps/lifeos-web / apps/server / packages/lifeos-core。
- **影响**：
  - 禁止新增 common/shared/modules/libs/system/logic/features 等一级目录。
  - 所有业务代码必须归入上述三个目录之一。
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-004：Domain 划分对齐

- **标题**：Domain 划分为 14 个领域，严格遵循 DDD 与事件驱动
- **背景**：Master Prompt v2.0 第十六节定义了 Domain 划分，需将原有九大引擎体系对齐到此划分。
- **为什么**：
  - 原有九大引擎（人格/情绪/记忆/成长/世界观/决策/关系/行为/剧情）是从"引擎功能"维度划分。
  - Master Prompt 的 Domain 划分（User/DigitalLife/Personality/Emotion/Relationship/Memory/Behavior/Goal/Timeline/Narrative/WorldState/Community/Media/Notification）是从"业务领域"维度划分，更符合 DDD 原则。
  - Engine 是 Domain 内部的实现细节，不应作为顶层划分依据。
- **备选方案**：
  - 保留九大引擎作为顶层：不符合 DDD，跨领域调用边界模糊。
  - 合并部分 Domain：初期简洁但后期扩展受限。
- **最终方案**：
  - 14 个 Domain：User / DigitalLife / Personality / Emotion / Relationship / Memory / Behavior / Goal / Timeline / Narrative / WorldState / Community / Media / Notification。
  - 原有九大引擎映射到对应 Domain 内部（如"人格引擎"→ Personality Domain，"情绪引擎"→ Emotion Domain）。
  - 跨 Domain 通信统一使用 Domain Event，禁止直接调用。
- **影响**：
  - 原有 01_系统架构总览.md 需对齐更新。
  - 所有 Engine 实现必须归属于某个 Domain。
  - 事件总线是跨 Domain 通信的唯一通道。
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-005：四层架构 + 业务三层叠加

- **标题**：采用 DDD 标准四层架构（Presentation → Application → Domain → Infrastructure），叠加业务三层（Digital Life → World → Companion）
- **背景**：Master Prompt 第十五节定义了 DDD 标准四层架构和业务三层，需明确两者关系。
- **为什么**：
  - 四层架构是技术维度的分层（关注点分离）。
  - 业务三层是产品维度的分层（用户感知的三个层次）。
  - 两者正交：每个业务层都包含完整的四层架构。
  - 正交关系避免了"到底按技术分层还是按业务分层"的混淆。
- **备选方案**：
  - 只保留四层：业务边界不清晰，产品语义弱。
  - 只保留三层：技术实现分层缺失，代码容易混乱。
- **最终方案**：
  - 横向（技术）：Presentation → Application → Domain → Infrastructure
  - 纵向（业务）：Digital Life → World → Companion
  - 每个业务大层内部遵循四层架构。
  - 跨业务层通信通过 Domain Event + Application Service 协调。
- **影响**：
  - architecture.md 需清晰描绘正交关系图。
  - 开发时需同时考虑技术层归属和业务层归属。
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-006：Engine 统一生命周期接口

- **标题**：所有 Engine 必须实现统一的 9 方法生命周期接口
- **背景**：Master Prompt 第十七节定义了 Engine 统一接口规范。
- **为什么**：
  - 数字生命由多个 Engine 协同工作，需要统一的生命周期管理。
  - 统一接口使得 Engine 可以被调度器统一管理（启动/暂停/恢复/销毁）。
  - serialize/deserialize 保证了数字生命状态可持久化与恢复。
  - emit 方法保证事件驱动架构的一致性。
- **备选方案**：
  - 每个 Engine 自行设计生命周期：调度复杂，难以统一管理。
  - 用类继承实现：灵活性差，Engine 差异大时继承链混乱。
- **最终方案**：
  - 所有 Engine 实现接口：init / start / update / pause / resume / destroy / serialize / deserialize / emit。
  - 接口通过 TypeScript Interface 约束，不使用基类继承。
  - Engine 之间通过事件总线通信，禁止直接调用。
- **影响**：
  - packages/lifeos-core 中定义 BaseEngine 接口。
  - 所有新增 Engine 必须实现此接口。
  - 调度器（Scheduler）基于此接口统一管理所有 Engine。
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-007：数据库统一字段规范

- **标题**：所有数据表强制包含 6 个统一字段，使用 UUID 主键
- **背景**：Master Prompt 第十八节定义了数据库统一字段规范。
- **为什么**：
  - 统一字段便于审计、软删除、乐观锁、元数据扩展。
  - UUID 主键便于分布式环境与数据迁移。
  - jsonb metadata 提供灵活的扩展能力，避免频繁加列。
- **备选方案**：
  - 自增 ID：分布式场景下有问题，数据合并困难。
  - 无软删除：数据物理删除不可恢复。
  - 无 metadata：每次需求变更都要改表结构。
- **最终方案**：
  - 统一字段：id (UUID) / createdAt / updatedAt / deletedAt / version / metadata(jsonb)。
  - 统一 Migration 管理。
  - 软删除默认开启。
- **影响**：
  - apps/server 中所有数据表必须遵循此规范。
  - ORM 实体基类包含这些字段。
  - 查询默认过滤 deletedAt 非空记录。
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-008：自主行为调度流程

- **标题**：所有自主行为必须经过 Scheduler → Priority → Cooldown → Budget → Execute 五步流程
- **背景**：Master Prompt 第二十节定义了自主行为规范。
- **为什么**：
  - 数字生命的"自主性"不能是随机的，必须有优先级、冷却、预算控制。
  - 避免行为泛滥（如频繁主动消息骚扰用户）。
  - Budget 机制确保资源可控（Token 消耗、计算资源）。
  - 事件驱动确保 Engine 之间解耦。
- **备选方案**：
  - Engine 直接触发行为：不可控，容易行为泛滥。
  - 简单定时器：缺乏优先级与预算管理。
- **最终方案**：
  - Scheduler 统一调度所有自主行为。
  - 五步流程：Scheduler → Priority → Cooldown → Budget → Execute。
  - 行为执行结果通过事件广播，其他 Engine 订阅响应。
  - Engine 之间禁止直接调用。
- **影响**：
  - Behavior Domain 实现 Scheduler。
  - 所有自主行为必须注册到 Scheduler。
  - 每个行为类型定义优先级、冷却时间、Token/计算预算。
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-009：AI-to-AI 安全边界

- **标题**：AI-to-AI 交互必须设置 TTL、最大深度、每日预算、Token 预算、随机终止、熔断机制
- **背景**：Master Prompt 第二十一节定义了 AI-to-AI 规范。
- **为什么**：
  - AI ↔ AI 对话如果不加限制可能无限递归，消耗大量资源。
  - 需要防止"回音室效应"和资源耗尽。
  - 熔断机制保证异常情况下系统稳定。
- **备选方案**：
  - 无限制 AI-to-AI：资源不可控，可能引发雪崩。
  - 仅用 Token 限制：不足以防止深度递归。
- **最终方案**：
  - TTL：每条 AI-to-AI 消息的存活时间。
  - 最大深度：对话链的最大轮数。
  - 每日预算：每个数字生命每日 AI-to-AI 交互次数上限。
  - Token 预算：单次交互 Token 上限。
  - 随机终止：一定概率提前终止对话（模拟自然结束）。
  - 熔断机制：异常流量或错误率过高时自动暂停。
- **影响**：
  - Community / WorldState Domain 实现 AI-to-AI 协调器。
  - 所有 AI-to-AI 交互必须通过协调器。
  - 监控面板实时展示预算消耗与熔断状态。
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-010：Memory 职责边界

- **标题**：Memory 仅负责存储/检索/压缩/摘要，不直接生成回答
- **背景**：Master Prompt 第十九节定义了 Memory 规范。
- **为什么**：
  - Memory 是基础设施，不是对话生成器。
  - 回答生成统一由 Chat Runtime 负责，保证一致性。
  - 记忆检索与生成解耦，便于替换底层模型。
- **备选方案**：
  - Memory 直接生成回答：职责混淆，难以优化检索质量。
  - 每个 Engine 自己管理记忆：重复造轮子，记忆碎片化。
- **最终方案**：
  - Memory Domain 职责：Storage / Retrieve / Compress / Summary。
  - 回答生成：统一走 Chat Runtime（AIRI 原有能力）。
  - Memory 向 Chat Runtime 提供检索到的上下文。
- **影响**：
  - Memory Engine 只暴露检索/存储/压缩接口，不暴露生成接口。
  - Chat Runtime 组装记忆上下文 + 当前对话 + 人格设定 → 生成回答。
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-011：设计系统 — 主色调选择

- **标题**：主色确定为「星河粉紫」(#B07BFF)，辅色「深海青蓝」(#4FC3F7)
- **背景**：设计语言确定为 Anemone × Neon，需确定具体色值。
- **为什么**：
  - 星河粉紫 (#B07BFF)：融合粉色（情感/温柔/二次元）与紫色（神秘/科技/未来），是数字生命的理想代表色。
  - 深海青蓝 (#4FC3F7)：与粉紫形成冷暖对比，代表理性/信息/社区公共空间。
  - 暗色基底深紫蓝 (#0D0B1A)：比纯黑更有层次，更有"夜空/深海"的沉浸感。
  - 参考 iirose 的极简纯净，但用暗色+发光实现"生命体在暗夜中闪耀"的隐喻。
- **备选方案**：
  - 纯粉色系：过于甜腻，缺乏科技感。
  - 纯蓝色系：过于理性冷硬，缺乏情感温度。
  - 霓虹绿：赛博朋克力过重，与陪伴感不符。
- **最终方案**：
  - Primary: #B07BFF（星河粉紫）
  - Secondary: #4FC3F7（深海青蓝）
  - Accent: #FF8FD4（樱花粉）
  - Background: #0D0B1A（深紫蓝夜）
  - Surface: #1A1630（深紫灰）
  - Border: rgba(176, 123, 255, 0.15)
- **影响**：
  - 所有 Design Token 基于此色板扩展。
  - Naive UI 主题配置基于此色值定制。
  - 暗色模式为默认主题。
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-012：开发阶段严格执行

- **标题**：严格按 7 个 Phase 推进，禁止跳阶段开发
- **背景**：Master Prompt 第六节定义了开发阶段。
- **为什么**：
  - 避免基础未稳就急于实现功能，导致后期大规模重构。
  - 设计系统先行 → 角色 → 引擎 → 社区 → 记忆 → 商业化 → 开放生态，依赖关系清晰。
  - 每个 Phase 有明确的交付物与验收标准。
- **备选方案**：
  - 并行开发多个 Phase：容易返工，设计频繁变更。
  - 先做社区再做引擎：本末倒置，数字生命是核心不是社区。
- **最终方案**：
  - Phase 1: 设计系统冻结
  - Phase 2: 角色系统
  - Phase 3: 数字生命引擎
  - Phase 4: 社区
  - Phase 5: Memory
  - Phase 6: 商业化
  - Phase 7: 开放生态
- **影响**：
  - 当前处于 Phase 1，不得开发任何页面/功能代码。
  - 每个 Phase 完成后需确认验收才能进入下一 Phase。
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-013：AIRI 基座扩展策略

- **标题**：保留 AIRI 原有架构，所有 LifeOS 功能通过扩展实现，不覆盖不重构
- **背景**：Master Prompt 第五节定义了 AIRI 基座原则。
- **为什么**：
  - AIRI 是经过验证的底层平台，重构风险高。
  - 扩展模式保证 AIRI 升级时 LifeOS 可以平滑跟进。
  - 业务与基座分离，关注点清晰。
- **备选方案**：
  - Fork AIRI 后修改：升级困难，与上游脱节。
  - 完全重写：工作量巨大，无必要。
- **最终方案**：
  - AIRI 作为底层依赖（package 或 submodule）。
  - LifeOS 在 apps/lifeos-web 中扩展页面与组件。
  - LifeOS 在 packages/lifeos-core 中扩展引擎与领域逻辑。
  - 禁止修改 AIRI 的 Runtime / Router / Build / Store / 基础能力。
- **影响**：
  - 导入 AIRI 后需先梳理其扩展点（插件机制、路由注册、Store 模块等）。
  - 所有业务代码严格限制在 LifeOS 命名空间下。
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-014：开发状态规范（Development Status）

- **标题**：建立统一的开发状态标记体系，禁止虚报完成状态
- **背景**：AI 协作开发中存在"把计划描述成结果"的风险，状态不真实会导致用户误判进度、决策失误。
- **为什么**：
  - "已设计 / 已规划"等模糊措辞无法准确反映真实进度。
  - 未真实完成就标记 Completed 会破坏信任链。
  - 需要明确的状态语义，让 AI 与人类对"完成"有共同理解。
- **备选方案**：
  - 仅用 TodoWrite 的 pending/in_progress/completed 三态：粒度不足，无法表达 Blocked/Deprecated。
  - 不建立状态规范：依赖每次自觉，不可靠。
- **最终方案**：
  - 5 种状态标记：✅ Completed / 🟠 In Progress / 🟡 Planned / 🔴 Blocked / ⚫ Deprecated。
  - 每种状态有明确的"必须满足"条件。
  - 强制使用场景：TodoWrite / Phase 标识 / ADR 影响评估 / 进度汇报。
  - 禁止行为清单：计划完成→标记 Completed、部分完成→标记 Completed、测试未通过→标记 Completed、Lint 报错→标记 Completed、模糊措辞代替明确状态。
- **影响**：
  - 所有任务汇报必须使用统一状态标记。
  - development-rules.md 新增第十节 Development Status。
  - AGENTS.md 新增 Development Status 章节。
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-015：Definition of Done（DoD 完成定义）

- **标题**：建立任务级与 Phase 级的 DoD，任何任务只有满足全部条件才能标记 Completed
- **背景**：缺乏明确的"完成定义"导致完成标准模糊，AI 容易在代码/文档/测试未全部就绪时就标记完成。
- **为什么**：
  - 代码完成 ≠ 任务完成（还需文档、测试、Lint、Type Check、ADR、AGENTS、Git Commit）。
  - Phase 级完成需要交付物真实生成 + 互相链接 + ADR + Git Commit 全部满足。
  - 明确的 DoD 是状态规范（ADR-014）的执行基础。
- **备选方案**：
  - 仅要求代码完成：文档/测试容易遗漏，质量不可控。
  - 每个 Phase 自定义 DoD：标准不统一，难以横向对比。
- **最终方案**：
  - **任务级 DoD（8 项）**：代码完成 / 文档完成 / 测试完成 / Lint 通过 / Type Check 通过 / ADR 更新 / AGENTS 更新 / Git Commit。
  - **Phase 级 DoD（5 项）**：交付物真实生成 / 互相链接 / ADR 记录 / Git Commit / 验收清单全勾。
  - **文档类任务 DoD 简化版（5 项）**：文件真实创建 / 内容真实写入 / 引用真实链接 / 互相链接 / Git Commit。
  - **Phase 1 验收清单**：11 项（分析 iiRose / 6 份核心文档 / 01 文档更新 / 互相链接 / ADR / Git Commit）。
  - **DoD 自检清单**：提交前必须自检并展示给用户。
- **影响**：
  - development-rules.md 新增第十一节 Definition of Done。
  - AGENTS.md 新增 Definition of Done 章节 + Phase 1 验收清单。
  - 标准开发流程增加 DoD 自检步骤（第 12 步）。
  - Phase 1 状态从"已完成"修正为"进行中"（Git Commit 未完成）。
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-016：Git Workflow 强化

- **标题**：建立标准化的 Git 提交流程，高风险操作必须用户确认，禁止 git add .
- **背景**：经验 Recall 158446 暴露了 Git 提交流程的多个问题：未确认就删除锁文件、未汇总就提交、高风险操作无门槛。
- **为什么**：
  - `git add .` / `git add -A` 容易误提交敏感文件（.env / credentials）或大文件。
  - 高风险操作（push / merge / rebase / reset --hard）一旦执行不可逆，必须用户确认。
  - 锁文件冲突（.git/index.lock）处理不当会破坏 Git 状态。
  - 提交前需要汇总变更 + DoD 自检，避免误提交。
- **备选方案**：
  - 信任 AI 自主提交：风险高，经验证明不可靠。
  - 完全人工提交：效率低，AI 协作场景下不现实。
- **最终方案**：
  - **标准提交流程（7 步）**：汇总变更 → DoD 自检 → 用户确认 → 按文件粒度暂存 → Conventional Commit 消息 → 提交 → 验证。
  - **暂存规则**：必须 `git add <file>`，禁止 `git add .` / `git add -A` / `git add *`。
  - **锁文件冲突处理**：4 步流程（解释成因 → 询问用户 → 确认后删除 → 失败输出替代方案），禁止未确认就删除。
  - **高风险操作清单（7 项）**：push / push --force / merge / rebase / reset --hard / checkout . / branch -D / 删除锁文件，全部必须用户确认。
- **影响**：
  - development-rules.md 第九节 Git 规范扩展为 Git Workflow（7 小节）。
  - AGENTS.md 禁止事项新增 3 条（git add . / 跳过 Git Commit / 未确认高风险操作）。
  - 标准开发流程新增第 13 步 Git Commit。
  - 所有 Git 提交必须先汇总变更并请求用户确认。
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-017：AIRI 角色模型复用策略

- **标题**：完全复用 AIRI Character 实体作为角色聚合根，LifeOS 通过 Personality 扩展表增加结构化人格
- **背景**：Phase 2 角色系统设计，需确定角色数据模型。AIRI 已有完整的 Character 实体体系（Base / Capabilities / AvatarModels / I18n / Prompts），且支持 CCC（Character Card V3）标准。
- **为什么**：
  - AIRI Character 已经覆盖了角色基础信息、能力配置、形象模型、多语言、Prompt 管理等全链路能力。
  - 重复实现会造成冗余，且与 AIRI 生态脱节。
  - LifeOS 的核心增值是**结构化人格系统**（五维参数 + 演化机制 + 说话风格），而 AIRI 的 personality 是自由文本 prompt，两者是互补而非替代关系。
  - Prompt Compiler 模式可以将结构化参数编译为自然语言 prompt，无缝写入 AIRI 的 `character_prompts(type=personality)` 字段，实现零侵入对接。
- **备选方案**：
  - 完全重写角色系统：重复造轮子，与 AIRI 脱节，升级困难。
  - 直接使用 AIRI 自由文本 personality：没有结构化参数，无法支持人格演化、性格标签、数据分析等高级能力。
  - 修改 AIRI 源码增加人格字段：违反"不修改 AIRI 架构"原则，升级维护成本高。
- **最终方案**：
  - **AIRI 原生表完全复用**：characters / character_i18n / character_prompts / character_capabilities / avatar_models 全部直接使用 AIRI 定义。
  - **LifeOS 扩展表新增**：personality_states（一对一关联 characters）+ evolution_history + character_templates。
  - **对接方式**：通过适配层（AiriCharacterAdapter）读写 AIRI Character，Personality Domain 将结构化参数编译为 prompt 写入 AIRI 的 personality prompt。
  - **零侵入**：不修改 AIRI 源码，所有扩展通过外键关联 + API 对接实现。
- **影响**：
  - 角色数据模型分为 AIRI 原生层 + LifeOS 扩展层两层。
  - Personality Domain 必须实现 Prompt Compiler 模块。
  - 所有角色操作必须考虑数据一致性（AIRI 表 + 扩展表的事务边界）。
  - 导入 AIRI 时需优先集成 Character 相关模块。
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-018：人格模型选型 — LifeOS-OCEAN 五维模型

- **标题**：人格模型采用基于 OCEAN（大五人格）调整的 LifeOS-OCEAN 五维模型，通过 Prompt Compiler 编译为自然语言
- **背景**：Phase 2 需要确定人格参数模型。可选方案包括大五人格（OCEAN）、MBTI、九型人格、自定义维度等。
- **为什么**：
  - **OCEAN 是心理学界最广泛认可的人格模型**，有坚实的学术基础，维度之间相对独立。
  - **连续量化（0~1）** 比 MBTI 的二元分类更适合 AI 角色的渐进式演化。
  - **五维结构简洁**，初期实现成本低，后续可以在每个维度下扩展子维度。
  - **可解释性强**，用户能直观理解每个维度的含义。
  - **Prompt Compiler 模式**使得人格参数可以灵活映射为自然语言 prompt，与 AIRI 的自由文本 personality 无缝对接。
- **备选方案**：
  - MBTI：16 型人格，用户认知度高，但二元分类过于粗糙，难以表达渐进变化，且学术界认可度低。
  - 九型人格：类型丰富但理论基础薄弱，维度不独立，实现复杂。
  - 自定义多维体系（如 8 维/12 维）：更精细但初期设计成本高，验证周期长，YAGNI。
  - 纯 AI 驱动（无结构化参数）：灵活但不可控，无法支持人格演化、性格标签、数据分析等功能。
- **最终方案**：
  - **LifeOS-OCEAN 五维模型**：开放性 / 尽责性 / 外向性 / 宜人性 / 情绪稳定性，每维 0~1 连续值。
  - **性格标签叠加**：五维组合产生 10+ 种具象性格标签（如"治愈者"、"理性参谋"、"元气开心果"），降低用户理解成本。
  - **说话风格独立参数**：话量 / 语气 / emoji 频率 / 语气词密度 / 句式复杂度 / 称呼偏好，独立于五维模型。
  - **Prompt Compiler 编译**：结构化参数 → 分块编译 → 自然语言 personality prompt → 写入 AIRI。
  - **演化机制**：五维参数随记忆/互动/关系动态调整，单次变化上限 ±0.1，防止突变。
- **影响**：
  - Personality Domain 围绕五维模型设计数据结构与 Engine 接口。
  - 角色创建流程提供预设模板 + 微调滑块的交互模式。
  - 性格标签系统需要基于五维值的组合算法。
  - Prompt Compiler 需要为每个维度编写 5 档描述模板。
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-019：Brain-Body 分层架构 — LifeOS Brain + AIRI Body

- **背景**：Phase 3 设计数字生命引擎时，需要明确 LifeOS 与 AIRI 的分工边界。AIRI 已经有成熟的 Live2D/Spine 渲染、语音流水线、对话运行时；而 LifeOS 需要在认知层面做扩展。
- **为什么**：
  1. **复用最大化**：AIRI 的表现层已经很完善，不需要重新造轮子
  2. **关注点分离**：认知决策（Brain）与表现执行（Body）分离，各自独立迭代
  3. **可替换性**：Body 层可以换不同渲染引擎，不影响 Brain
  4. **隐喻清晰**：大脑 + 身体的模型符合人类直觉，便于理解和沟通
- **备选方案**：
  1. **完全 AIRI 内置**：所有逻辑都写在 AIRI 插件里 — 但会限制扩展性，且不符合 DDD 分层
  2. **完全重写**：LifeOS 自己实现全部表现层 — 重复造轮子，工作量巨大
  3. **Brain-Body 分层（最终方案）**：LifeOS 负责大脑层，AIRI 负责身体层，通过适配层连接
- **最终方案**：采用 Brain-Body 分层架构
  - **LifeOS Brain**：Personality / Emotion / Goal / Memory / Relationship / Behavior Scheduler
  - **AIRI Body**：Chat Runtime / Speech Pipeline / Visual Avatar（Live2D/Spine/VRM）
  - **适配层（Adapter）**：大脑指令 ↔ 身体动作的翻译官
- **影响**：
  - 所有 Domain 设计都围绕 Brain 层展开，Body 层作为 Infrastructure 实现
  - Engine 框架、事件总线、调度器都在 Brain 层
  - 通过端口-适配器模式（Hexagonal）实现解耦
  - Phase 3 聚焦 Brain 层的 Emotion/Goal/Relationship + Engine 框架
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-020：情绪模型选型 — Russell 环形模型 + 主导情绪标签

- **背景**：Emotion Domain 需要选择情绪模型。常见方案有：基本情绪论（离散）、Russell 环形模型（二维连续）、PAD 三维模型、OCC 模型（基于认知评价）。
- **为什么**：
  1. **混合模型最实用**：连续维度适合精确计算和演化，离散标签便于理解和映射到表现层
  2. **Russell 模型简单有效**：效价×唤醒度二维空间足够描述大多数情绪状态
  3. **可扩展性好**：增加支配度（Dominance）变成 PAD 三维，兼容更多场景
  4. **与人格模型兼容**：五维人格参数可以直接影响情绪基线和波动
- **备选方案**：
  1. **基本情绪论（Ekman）**：6 种基本情绪（喜/怒/哀/惧/厌/惊）— 太离散，中间状态难描述
  2. **OCC 模型**：基于认知评价的 22 种情绪 — 太复杂，实现成本高
  3. **纯连续模型（只有维度）**：精确但不直观，难以映射到表情和语音风格
  4. **Russell 环形 + 主导标签（最终方案）**：连续维度 + 离散标签，兼顾精确性和可用性
- **最终方案**：Russell 环形模型（Valence × Arousal × Dominance）+ 9 种主导情绪标签
  - 三维连续量化：效价 -1~+1，唤醒度 0~1，支配度 0~1
  - 9 种主导情绪标签：Joy/Excitement/Calm/Sadness/Anger/Anxiety/Boredom/Affection/Neutral
  - 情绪有基线（由人格决定），自然衰减回归基线
- **影响**：
  - EmotionEngine 围绕三维空间 + 标签映射设计
  - 刺激评估公式基于三维变化量
  - 表现层映射：情绪 → 表情/动作/语音风格
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-021：目标体系 — 四层嵌套 + 多来源生成

- **背景**：Goal Domain 需要设计目标的层级结构和生成机制。数字生命不能只有即时反应，需要有目标感和主动性。
- **为什么**：
  1. **层级结构符合人类认知**：长期目标 → 中期 → 短期 → 即时意图，自上而下分解，自下而上推进
  2. **多来源保证丰富性**：人格/关系/记忆/世界事件/系统 多来源生成，避免目标单一
  3. **评分机制保证合理性**：多维度评分（人格契合度/关系价值/紧迫性/可行性/情感价值），筛选最优目标
  4. **状态机管理清晰**：pending/active/paused/completed/failed/abandoned 六状态，流转规则明确
- **备选方案**：
  1. **纯反应式（无目标）**：完全由外部刺激驱动 — 缺乏主动性和生命感
  2. **预设目标树**：开发者预设所有目标 — 不够灵活，每个角色都一样
  3. **纯 LLM 生成**：完全靠 AI 生成目标 — 不可控，可能不一致
  4. **四层嵌套 + 多来源 + 评分（最终方案）**：结构化生成 + AI 补充 + 规则筛选
- **最终方案**：
  - **四层嵌套**：Life Goal（数周~数月）→ Mid-term（数天~数周）→ Short-term（数小时~数天）→ Immediate（秒~分钟）
  - **六状态机**：pending/active/paused/completed/failed/abandoned
  - **多来源生成**：人格衍生/关系驱动/用户暗示/记忆触发/世界事件/系统设定
  - **五维评分**：人格契合度/关系价值/紧迫性/可行性/情感价值
- **影响**：
  - GoalEngine 需要目标生成器、评分器、状态管理器
  - 与 Behavior Scheduler 紧密协作：Goal 提出行为建议，Scheduler 决定执行
  - 目标的推进和完成会触发情绪变化和人格演化
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-022：关系模型 — 二维（亲密度×正向度）+ 12 阶段

- **背景**：Relationship Domain 需要设计关系的量化模型和阶段划分。Master Prompt 提到"从陌生人到深度绑定的 12 个阶段"。
- **为什么**：
  1. **二维比单维更丰富**：亲密度（深浅）× 正向度（好恶），可以区分"亲密的朋友"和"熟悉的敌人"
  2. **12 阶段有仪式感**：每阶段推进都是一个里程碑，给用户成长感和期待感
  3. **边际递减合理**：阶段越高，推进越难，符合真实关系规律
  4. **多维度互动影响**：不同互动类型对亲密度/正向度的影响不同
- **备选方案**：
  1. **单纯一维亲密度**：简单但不够丰富，无法表达复杂关系
  2. **MBTI 式关系类型**：分类太粗，缺少连续变化
  3. **二维 + 12 阶段（最终方案）**：连续量化 + 阶段里程碑，兼顾精确性和仪式感
- **最终方案**：
  - **二维模型**：Intimacy（0~1 亲密度）× Positivity（-1~+1 正向度）
  - **12 阶段**：陌生人 → 初识 → 泛泛之交 → 普通朋友 → 朋友 → 好朋友 → 亲密朋友 → 挚友 → 知己 → 生命中重要的人 → 挚爱 → 灵魂伴侣
  - **关系类型标签**：友好型/尊重型/疏离型/敌对型/暧昧型
  - **亲密度机制**：互动增长 + 阶段阻力 + 时间衰减 + 连续互动奖励
- **影响**：
  - RelationshipEngine 管理亲密度、阶段、关系类型
  - 关系事件表记录每次变化，支持回溯
  - 关系阶段影响行为范围（低阶段不能过度亲密）
  - 关系里程碑是重要的用户留存驱动力
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-023：Engine 调度框架 — BaseEngine 统一接口 + EventBus + Scheduler

- **背景**：多个 Domain Engine 需要协同工作，需要统一的生命周期管理、事件通信和调度机制。
- **为什么**：
  1. **统一生命周期**：所有 Engine 遵循 init/start/pause/resume/destroy/tick 统一接口，管理成本低
  2. **事件驱动解耦**：通过 EventBus 通信，Domain 间不直接依赖，符合 DDD 原则
  3. **集中调度决策**：Behavior Scheduler 作为决策中枢，收集各 Engine 提议，统一评估选择
  4. **可扩展性好**：新增 Engine 只需实现接口，不影响现有系统
- **备选方案**：
  1. **直接调用**：Engine 之间直接互相调用 — 耦合度高，难以扩展
  2. **共享状态**：通过共享 Store 通信 — 状态混乱，难以追踪变化
  3. **事件总线 + 调度器（最终方案）**：事件驱动 + 集中调度，解耦且可控
- **最终方案**：
  - **BaseEngine 抽象基类**：统一 9 方法生命周期（init/start/pause/resume/destroy/tick/serialize/deserialize/emit）
  - **EngineManager**：管理所有 Engine 的生命周期和依赖顺序
  - **EventBus**：发布/订阅模式，支持模式匹配，事件命名规范 `{domain}.{aggregate}.{event}`
  - **Behavior Scheduler**：收集行为提议 → 过滤 → 评分 → 执行，带资源预算和冷却机制
- **影响**：
  - 所有 Engine 都继承 BaseEngineImpl
  - 跨 Domain 通信必须走 EventBus，禁止直接调用
  - 行为执行统一由 Scheduler 调度，防止冲突和过度活跃
  - 资源预算系统（精力/社交能量/话题预算）防止角色"话痨"
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-024：数据存储策略 — 内存优先 + 定期快照 + 事件溯源

- **背景**：数字生命引擎有高频状态更新（情绪每秒都在变），也有需要持久化的结构化数据（目标/关系）。需要设计合理的分层存储策略。
- **为什么**：
  1. **性能优先**：引擎运行时状态放内存，tick 级访问不需要 IO
  2. **定期快照保证安全**：定时写快照到数据库，崩溃可以恢复
  3. **事件溯源可追溯**：重要事件（关系变化、目标完成、行为执行）append-only 记录，支持回放和分析
  4. **AIRI 原生表复用**：不重复建表，通过外键关联，零侵入
- **备选方案**：
  1. **全内存**：性能最好但无法持久化，重启丢失
  2. **全数据库**：可靠但性能差，tick 级更新 IO 扛不住
  3. **内存 + 定期快照 + 事件溯源（最终方案）**：兼顾性能、可靠性和可追溯性
- **最终方案**：
  - **L1 内存**：引擎当前状态，tick 级访问
  - **L2 Redis**：数字生命完整状态缓存，TTL 30 分钟
  - **L3 数据库**：结构化数据（goals/relationships/behavior_records）+ 定期快照
  - **事件溯源**：关系事件/行为记录/情绪快照等 append-only 表
  - **AIRI 原生表零侵入**：digital_lives.character_id 关联 AIRI characters 表
- **影响**：
  - 情绪状态快照写入频率可配置（默认每分钟一次）
  - 重要事件（关系变化、目标完成）实时写库
  - 引擎有完整的 serialize/deserialize 能力，支持快照恢复
  - 数据库设计遵循 ADR-007 统一字段规范
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-025：社区架构 — Community + WorldState + Timeline 三域协同

- **背景**：Phase 4 需要让数字生命从"一对一陪伴"进入"多对多社交生态"。需要设计社区系统的架构。
- **为什么**：
  1. **三域分工清晰**：Community 管社交互动，WorldState 管世界协调，Timeline 管生命记录
  2. **AI-to-AI 框架级**：Phase 4 只搭框架不实现具体对话，降低复杂度
  3. **事件驱动协同**：三域通过 EventBus 通信，禁止直接调用，符合 DDD 原则
  4. **Narrative 延后**：叙事生成依赖 Memory 系统，放到后续 Phase
- **备选方案**：
  1. **单 Community Domain 包揽一切**：职责过重，不符合单一职责原则
  2. **包含 Narrative**：依赖 Memory，Phase 4 还没有 Memory，时机不对
  3. **三域 + AI-to-AI 完整实现**：复杂度过高，Phase 4 应聚焦框架
  4. **三域 + AI-to-AI 框架级（最终方案）**：聚焦核心，AI-to-AI 只设计框架
- **最终方案**：
  - **Community Domain**：Feed/评论/点赞/关注 + 数字生命自主发帖
  - **WorldState Domain**：世界状态/时间流逝/周期事件 + AI-to-AI 互动框架
  - **Timeline Domain**：生命事件记录/时间感知/生命摘要
  - **AI-to-AI Level**：框架级（触发机制 + 安全边界 + 互动类型 + 记录）
- **影响**：
  - 新增 9 张数据表（feeds/feed_likes/comments/follows/world_states/world_events/ai_interactions/life_events/life_summaries）
  - 数字生命获得"社交存在感"——不只是私聊，还有社区动态
  - AI-to-AI 互动框架为后续实现奠定基础
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-026：数字生命自主发帖 — Scheduler 驱动 + 频率控制

- **背景**：数字生命需要主动发帖表达自己，但不能无限制发帖刷屏。
- **为什么**：
  1. **自主性增强生命感**：数字生命不只是被动回复，会主动表达
  2. **频率控制防止刷屏**：每日上限 3 条，最小间隔 2 小时
  3. **与 Scheduler 协作**：发帖作为一种行为提议，与其他行为竞争优先级
  4. **情绪豁免机制**：极端情绪可以突破频率限制，增强真实感
- **备选方案**：
  1. **定时发帖**：固定时间发帖 — 太机械，不自然
  2. **无限制发帖**：不限制频率 — 会刷屏，用户体验差
  3. **Scheduler 驱动 + 频率控制（最终方案）**：智能调度 + 安全限制
- **最终方案**：
  - Community Domain 提供 `proposePost()` 接口生成发帖提议
  - Behavior Scheduler 评估优先级后决定是否执行
  - 频率限制：每日 3 条原创帖，最小间隔 2 小时
  - 情绪豁免：intensity > 0.8 时可突破限制
- **影响**：
  - Community Domain 需要实现 PostProposal 生成逻辑
  - Scheduler 需要支持发帖类型的 ActionProposal
  - 需要频率计数器（每日重置）
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-027：AI-to-AI 互动 — 框架级设计 + 安全边界

- **背景**：数字生命之间需要自主社交，但 Phase 4 不实现具体对话，只搭框架。
- **为什么**：
  1. **框架先行**：先定义触发机制、安全边界、互动类型，后续填充实现
  2. **安全优先**：AI-to-AI 互动必须可审计、可控制、对用户透明
  3. **用户控制权**：用户可以查看/禁止自己数字生命的 AI-to-AI 互动
  4. **遵循 ADR-009**：AI-to-AI 安全边界已定义，本 ADR 细化实现框架
- **备选方案**：
  1. **Phase 4 完整实现**：复杂度过高，且依赖 Memory 系统
  2. **不设计 AI-to-AI**：错过定义安全框架的最佳时机
  3. **框架级设计（最终方案）**：定义框架，延后实现
- **最终方案**：
  - WorldStateEngine 作为协调器，定期扫描并提出互动建议
  - 6 种互动类型：greeting/topic_discussion/emotional_support/collaboration/celebration/casual_chat
  - 安全规则：可审计、禁止合谋、禁止敏感信息、频率受限（每日 5 次）、用户可控
  - 互动流程：WorldState 提议 → 发起方评估 → 目标方回应 → 记录 → 通知
- **影响**：
  - WorldStateEngine 新增 AI-to-AI 协调职责
  - 新增 ai_interactions 表记录互动
  - 后续 Phase 可基于此框架实现具体对话
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-028：Timeline 与 Memory 分工 — 编年史 vs 回忆录

- **背景**：Timeline Domain 和 Memory Domain 都涉及"过去的事"，需要明确分工。
- **为什么**：
  1. **关注点不同**：Timeline 关注"发生了什么"（事实序列），Memory 关注"感受到了什么"（情感网络）
  2. **数据结构不同**：Timeline 是有序事件列表，Memory 是关联记忆网络
  3. **使用场景不同**：Timeline 面向展示（时间线视图），Memory 面向决策（影响行为）
  4. **依赖关系**：Timeline 不依赖 Memory，可以独立运行；Memory 引用 Timeline 作为时间锚点
- **备选方案**：
  1. **合并为一个 Domain**：职责过重，数据结构冲突
  2. **Timeline 包含 Memory**：Timeline 变得过于复杂
  3. **分离但无关联**：丢失了事实与情感的关联性
  4. **分离 + 引用（最终方案）**：独立 Domain，Memory 可引用 Timeline 事件
- **最终方案**：
  - **Timeline Domain**：结构化事件序列，按时间排序，面向展示
  - **Memory Domain（Phase 5）**：非结构化记忆网络，按关联检索，面向决策
  - **关联方式**：Memory 可引用 Timeline 事件 ID 作为时间锚点
  - **分工比喻**：Timeline 是"编年史"，Memory 是"回忆录"
- **影响**：
  - Timeline Domain 在 Phase 4 独立实现
  - Memory Domain 在 Phase 5 实现时可以引用 Timeline
  - Timeline 的事件记录是被动接收（监听事件），不主动触发行为
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-029：记忆类型体系 — 简化三分类（情景/语义/情绪）

- **背景**：Memory Domain 需要确定记忆的分类体系，影响数据模型和检索策略。
- **为什么**：
  1. **三分类覆盖核心场景**：情景（经历）+ 语义（事实）+ 情绪（感受），覆盖数字生命记忆的主要类型
  2. **避免过度复杂**：经典 Tulving 四分类（情景/语义/程序/工作）中的程序记忆在数字生命中意义不大，工作记忆属于短期记忆层级
  3. **映射清晰**：三种类型各有明确的形成机制、存储方式和检索模式
  4. **可扩展**：未来需要可增加子类型，不破坏主分类
- **备选方案**：
  1. **Tulving 四分类**（情景/语义/程序/工作）— 程序记忆不适用，工作记忆是层级不是类型
  2. **二分类**（陈述性/非陈述性）— 太粗，不利于精细化检索
  3. **简化三分类（最终方案）** — 情景/语义/情绪，覆盖核心，简单清晰
- **最终方案**：
  - **情景记忆 Episodic**：特定时间地点的经历片段，有明确时间和场景
  - **语义记忆 Semantic**：事实性知识、偏好、概念，相对稳定
  - **情绪记忆 Emotional**：与情绪体验绑定的记忆，强调感受
  - 三种类型共用同一张主表，通过 `memory_type` 字段区分
- **影响**：
  - 记忆表统一设计，按类型字段区分
  - 检索时可按类型过滤
  - 不同类型的记忆有不同的巩固和遗忘策略
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-030：向量存储方案 — pgvector 优先，预留扩展

- **背景**：Memory Domain 的语义检索需要向量存储。需要在 pgvector、Milvus、Qdrant 等方案中选择。
- **为什么**：
  1. **简单够用**：pgvector 与 PostgreSQL 集成，无需额外服务，初期数据量（10万条以内）性能足够
  2. **事务一致性**：向量数据与结构化数据在同一个数据库里，保证一致性
  3. **运维成本低**：不引入新的技术栈，降低复杂度
  4. **可扩展**：未来规模大了可以迁移到专业向量数据库，接口层不变
  5. **1536 维兼容**：与 OpenAI 等主流 embedding 模型维度兼容
- **备选方案**：
  1. **Milvus / Qdrant**（专业向量数据库）— 性能强但运维复杂，初期不需要
  2. **Redis + 向量插件** — 快但功能有限，不适合持久化
  3. **纯关键词检索** — 简单但语义能力弱
  4. **pgvector（最终方案）** — 平衡功能、复杂度、成本
- **最终方案**：
  - 使用 PostgreSQL + pgvector 扩展
  - 向量维度 1536（OpenAI 兼容，可切换）
  - 索引类型：IVFFlat（初期 100 lists），超 100 万条考虑 HNSW
  - 混合检索：向量相似度 40% + 重要性 20% + 关联激活 20% + 时效性 10% + 情绪匹配 10%
- **影响**：
  - 数据库需要安装 pgvector 扩展
  - 记忆表增加 embedding 向量字段
  - 记忆写入时同步生成向量
  - 检索支持语义 + 关键词混合模式
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-031：Narrative 与 Memory 关系 — 意义赋予层，依赖记忆素材

- **背景**：Narrative Domain 和 Memory Domain 都涉及"过去"，需要明确分工与关系。
- **为什么**：
  1. **本质不同**：Memory 存储"发生了什么"（事实+感受），Narrative 生成"这意味着什么"（意义）
  2. **依赖方向**：Narrative 依赖 Memory 提供素材，但 Memory 不依赖 Narrative
  3. **价值不同**：Memory 是基础设施（决策依据），Narrative 是增值功能（情感价值）
  4. **Timeline/Memory/Narrative 三层递进**：事实 → 感受 → 意义，每层独立但层层递进
- **备选方案**：
  1. **Narrative 合并到 Memory** — 职责混淆，Memory 会变得太复杂
  2. **Narrative 合并到 Timeline** — Timeline 是事实记录，不应包含生成性内容
  3. **独立 Narrative Domain（最终方案）** — 作为意义赋予层，依赖 Memory 和 Timeline 的素材
- **最终方案**：
  - **Narrative 是独立 Domain**，负责故事生成和意义赋予
  - **数据流向**：Timeline（事实）→ Memory（感受）→ Narrative（意义）
  - **触发方式**：里程碑事件触发、定时生成、用户主动请求
  - **Phase 5 范围**：框架设计 + 接口定义，具体生成逻辑后续 Phase 完善
- **影响**：
  - 新增 Narrative Domain（14 Domain 中已有此域，正式激活）
  - Narrative 回写故事节点到 Timeline
  - Narrative 的生成依赖 Memory 的检索能力
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-032：记忆遗忘机制 — 主动遗忘 + 重要性保护

- **背景**：数字生命的记忆不能无限增长，需要遗忘机制保持鲜活和高效。
- **为什么**：
  1. **真实感**：人类会遗忘，数字生命也应该有选择性遗忘，增强真实感
  2. **效率**：记忆太多会降低检索效率，消耗存储空间
  3. **质量**：遗忘不重要的细节，突出重要记忆
  4. **再巩固效应**：被想起的记忆更牢固，符合认知规律
- **备选方案**：
  1. **永不遗忘** — 不真实，后期效率低
  2. **容量限制 + LRU** — 简单粗暴，不符合重要性原则
  3. **主动遗忘 + 重要性保护（最终方案）** — Ebbinghaus 风格的时间衰减 + 重要性权重
- **最终方案**：
  - **时间衰减**：可访问性随时间下降（类 Ebbinghaus 曲线）
  - **重要性保护**：重要性 > 0.8 几乎不遗忘，0.5~0.8 缓慢衰减，< 0.5 快速衰减
  - **再巩固**：被检索的记忆重要性提升，可访问性恢复
  - **主动清理**：可访问性 < 0.1 且重要性 < 0.3 的记忆，定期清理或归档
  - **归档而非删除**：低价值记忆归档到冷存储，不直接删除
- **影响**：
  - memories 表增加 accessibility 字段和 archived_at 字段
  - 每日维护任务：巩固 + 遗忘 + 清理
  - 检索时按 accessibility 加权
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-033：商业模式 — 混合模式（订阅 + 内购 + Marketplace 分成）

- **背景**：Phase 6 需要确定 LifeOS 的商业模式，影响整个商业化系统设计。
- **为什么**：
  1. **单一模式不够**：纯订阅限制收入天花板，纯内购影响用户体验，纯 Marketplace 缺乏稳定收入
  2. **混合模式互补**：订阅提供稳定收入，内购提供增量收入，Marketplace 建立生态
  3. **用户分层**：Free 体验 → Pro 付费 → Creator 创作变现，形成用户成长路径
  4. **核心竞争力**：不是"卖聊天次数"，而是"建立数字生命经济系统"
- **备选方案**：
  1. **纯订阅** — 收入稳定但天花板低
  2. **纯内购**（F2P）— 体验好但收入不稳定
  3. **混合模式（最终方案）** — 订阅 + 内购 + Marketplace 分成
- **最终方案**：
  - **Free**：免费体验，限制互动次数/记忆容量
  - **Pro**（¥30/月）：无限互动 + 高级模型 + 完整记忆/情绪
  - **Creator**（¥100/月）：Pro 权益 + Marketplace 发布 + 70% 收益分成
- **影响**：需要 Subscription / Wallet / Marketplace 三个子系统
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-034：虚拟经济 — 单一付费货币（Life Coin）+ 成长积分（XP）

- **背景**：需要确定虚拟货币体系，影响钱包系统和用户理解成本。
- **为什么**：
  1. **简单易懂**：双充值货币增加用户理解成本，单一付费货币更清晰
  2. **成长感**：XP 作为免费成长积分，让免费用户也有进度感
  3. **分离付费与成长**：Life Coin = 真实价值，XP = 投入时间，互不干扰
  4. **汇率简单**：1 元 = 10 LC，直观
- **备选方案**：
  1. **双货币系统**（免费货币 + 付费货币）— 复杂，用户混淆
  2. **单一货币**（只有 Life Coin）— 缺乏免费用户的成长感
  3. **付费货币 + 成长积分（最终方案）** — Life Coin + XP，分离付费与成长
- **最终方案**：
  - **Life Coin**：充值获得，可消费/转账/退款，永不过期
  - **XP**：行为奖励，不可购买/转移，用于等级和解锁
- **影响**：钱包表设计双余额字段，XP 获取规则需定义
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-035：Marketplace 经济模型 — 70/30 分成 + Digital Life Package

- **背景**：Marketplace 是创作者经济的核心，需要确定交易单元和分成模型。
- **为什么**：
  1. **完整数字生命**：不只是卖模板，而是卖"角色+AI Agent+虚拟偶像"的完整包
  2. **70/30 行业标准**：与 App Store / Google Play 一致，创作者有动力
  3. **多类型商品**：模板/插件/外观/声音/特效，丰富市场
  4. **T+7 结算**：7 天冷静期防止退款滥用，保护平台
- **备选方案**：
  1. **仅模板** — 太单一，市场不活跃
  2. **80/20 分成** — 创作者更多但平台收入少
  3. **70/30 + 多类型（最终方案）** — 平衡创作者激励与平台收入
- **最终方案**：
  - 商品类型：完整数字生命 / 人格模板 / 外观 / 插件 / 声音包 / 特效
  - 分成：70% 创作者 / 30% 平台
  - 结算：T+7 可提现，T+3 到账
- **影响**：需要 products / purchases / creator_earnings / withdrawals 表
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-036：支付安全边界 — 乐观锁 + 事务一致性 + 审计日志

- **背景**：涉及真实货币交易，需要确保数据一致性和安全性。
- **为什么**：
  1. **并发安全**：多请求同时消费可能导致超扣，必须用乐观锁
  2. **原子性**：扣款+记录+交付必须原子完成，使用数据库事务
  3. **审计追踪**：所有交易记录只追加不修改，完整审计链
  4. **合规要求**：支付数据需要满足金融级安全标准
- **备选方案**：
  1. **悲观锁**（SELECT FOR UPDATE）— 性能差，可能死锁
  2. **分布式锁**（Redis）— 增加复杂度
  3. **乐观锁 + 事务（最终方案）** — 简单高效，适合中等并发
- **最终方案**：
  - 余额操作使用乐观锁（version 字段）
  - 交易+扣款+交付使用数据库事务
  - 交易记录 append-only，不修改不删除
  - 大额交易二次验证
- **影响**：wallets 表增加 version 字段，所有余额操作需检查 version
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-037：开放生态边界 — 三级生态（Tool → Skill → Life）

- **背景**：Phase 7 需要确定开放生态的开放对象和层级，直接影响平台定位和技术复杂度。
- **为什么**：
  1. **定位清晰**：LifeOS 是数字生命基础设施，不是 AI 工具平台，开放必须围绕"数字生命"展开
  2. **渐进开放**：从 Tool（低风险）到 Skill（中风险）再到 Life（高风险），逐步放开，降低试错成本
  3. **生态分层**：不同层级对应不同的开发者群体、审核标准、分成比例，结构清晰
  4. **价值递增**：Tool → Skill → Life，开发难度递增，用户价值递增，商业价值也递增
- **备选方案**：
  1. **仅 Tool 开放** — 简单但格局小，变成工具平台
  2. **Tool + Skill** — 中等，但缺少最核心的"数字生命"层
  3. **三级生态（Tool → Skill → Life）（最终方案）** — 完整的数字生命生态，从工具到生命
- **最终方案**：
  - Level 1: Tool 开放 — 功能性工具插件，兼容 MCP
  - Level 2: Skill 开放 — 专业技能包，知识+行为+触发
  - Level 3: Life 开放 — 完整数字生命，人格+记忆+外观+声音
- **影响**：
  - Plugin Runtime 需要支持三种运行模式
  - 审核体系需要三级审核标准
  - 开发者等级与可发布类型挂钩
  - Marketplace 需要三类商品分类
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-038：Plugin 权限模型 — 沙箱模式 + 最小权限原则

- **背景**：第三方插件运行在平台内，必须确保用户数据安全和系统稳定，需要严格的权限模型。
- **为什么**：
  1. **安全第一**：开放生态最大的风险是安全，沙箱隔离是基础保障
  2. **最小权限**：插件只申请必要的权限，降低安全风险
  3. **用户可控**：用户可查看、授权、撤销插件权限，透明可控
  4. **分级管理**：L0~L4 五级权限，对应不同插件类型，灵活平衡安全与能力
- **备选方案**：
  1. **深度插件模式**（可直接调用核心 Engine）— 风险高，安全难保障
  2. **纯远程调用**（插件完全运行在第三方服务器）— 延迟高，体验差，数据泄露风险
  3. **沙箱模式 + 最小权限（最终方案）** — 安全隔离 + 权限声明 + 用户授权，平衡安全与灵活性
- **最终方案**：
  - 插件运行在独立沙箱中（进程/内存/API/网络/文件/数据 六重隔离）
  - 权限显式声明，用户安装时授权
  - L0~L4 五级权限体系
  - 所有调用有审计日志，异常自动熔断
- **影响**：
  - Plugin Runtime 需要实现沙箱机制
  - Manifest 需包含 permissions 字段
  - 用户端需权限管理界面
  - 安全审计系统建设
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-039：SDK 与 API 设计 — RESTful + Webhook + 多语言 SDK

- **背景**：开放生态需要为开发者提供清晰、易用的 API 和 SDK，影响开发者体验和接入成本。
- **为什么**：
  1. **标准化**：RESTful 是行业标准，学习成本低，工具链完善
  2. **实时性**：Webhook 支持事件驱动，满足实时通知需求
  3. **多语言**：JS/Python/CLI 覆盖主流开发者群体
  4. **一致体验**：统一的认证、限流、错误处理、分页规范
- **备选方案**：
  1. **GraphQL** — 灵活但复杂度高，学习成本高
  2. **gRPC** — 高性能但不适合浏览器端，调试困难
  3. **RESTful + Webhook + 多语言 SDK（最终方案）** — 平衡标准化、易用性和性能
- **最终方案**：
  - API 风格：RESTful + JSON
  - 认证：API Key + OAuth 2.0 + 签名验证
  - 事件：Webhook + 签名验证 + 失败重试
  - SDK：JS/TS、Python、CLI 三端
  - 限流：令牌桶 + 配额管理 + 熔断降级
- **影响**：
  - API Gateway 建设
  - 多语言 SDK 开发与维护
  - Webhook 投递系统
  - 开发者文档站
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-040：Digital Life Protocol — 自定义协议 + MCP 兼容

- **背景**：数字生命的描述、交换、移植需要标准化协议，同时需要与现有生态兼容。
- **为什么**：
  1. **MCP 不够用**：MCP 只解决了 Tool 调用，无法描述 Skill 和完整数字生命
  2. **生态兼容性**：兼容 MCP 可以快速接入现有 MCP Server 生态，降低冷启动成本
  3. **长期竞争力**：自定义 Digital Life Protocol 是数字生命基础设施的核心护城河
  4. **渐进式增强**：从 Tool（兼容 MCP）到 Skill 到 Life，逐步增强
- **备选方案**：
  1. **完全自研协议** — 可控但生态冷启动难，开发者接受度低
  2. **完全基于 MCP 扩展** — 兼容性好但受限于 MCP 设计，无法满足数字生命层级需求
  3. **自定义协议 + MCP 兼容（最终方案）** — Tool 层兼容 MCP，Skill/Life 层扩展自定义协议
- **最终方案**：
  - 协议三层：DLP-Tool / DLP-Skill / DLP-Life
  - Tool 层完全兼容 MCP（可双向转换）
  - Manifest 为核心，声明式描述
  - 标准化打包格式（.dlp）+ 签名验证
- **影响**：
  - 协议规范制定与维护
  - MCP 适配层开发
  - 开发者工具链（打包、验证、签名）
  - 长期可能推动行业标准
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-041：第三方安全策略 — 三级审核 + 签名验证 + 审计追溯

- **背景**：开放生态引入第三方代码和内容，必须建立完善的安全保障体系，防范恶意代码、数据泄露、违规内容等风险。
- **为什么**：
  1. **多层防御**：审核 + 沙箱 + 审计，纵深防御，单一防线被突破不致命
  2. **事前预防**：审核机制从源头过滤恶意和低质内容
  3. **事中防护**：沙箱隔离 + 权限控制 + 实时监控，运行时保护
  4. **事后追溯**：审计日志 + 熔断机制，出问题可追溯可快速处置
- **备选方案**：
  1. **只靠审核** — 静态检测无法发现所有问题，运行时行为不可控
  2. **只靠沙箱** — 沙箱可能被绕过，违规内容无法提前发现
  3. **三级审核 + 签名验证 + 审计追溯（最终方案）** — 纵深防御，全链路安全保障
- **最终方案**：
  - 三级审核：自动审核（机器）→ 一审（内容）→ 二审（安全）→ 三审（质量）
  - 签名验证：开发者签名 + 平台签名，确保完整性和来源可信
  - 运行时防护：沙箱隔离 + 权限控制 + 异常检测 + 自动熔断
  - 审计追溯：全量调用日志 + 安全审计 + 违规快速处置机制
- **影响**：
  - 审核团队建设（人机结合）
  - 安全扫描工具链
  - 运行时安全监控系统
  - 审计日志系统
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-042：Life Core MVP 实施策略 — 前端体验 + 简易后端 + Domain First

- **背景**：Phase 1-7 完成了全部设计蓝图，现在进入实施阶段。第一个 MVP 应该做什么、做到什么程度、技术路径如何选择，需要明确决策。
- **为什么**：
  1. **设计 ≠ 实现**：7 个 Phase 的设计文档是完整蓝图，但 MVP 只需要验证核心价值，不需要全部实现
  2. **核心价值是"生命感"**：LifeOS 的本质不是功能列表，而是用户感觉到"TA 记得我、在乎我"，这是第一优先级验证的
  3. **Domain First 保证架构完整性**：从 Domain 层做起，严格遵守 DDD 分层，避免 MVP 变成一次性代码
  4. **全栈 MVP 避免后续重构**：纯前端 LocalStorage 方案在记忆 Schema 演化、账号绑定、多设备同步、后台运行等方面都会遇到根本性困难
  5. **最小化基础设施复杂度**：单数据库（PostgreSQL + pgvector），不引入多余中间件，把精力放在核心体验上
- **备选方案**：
  1. **纯前端先行** — 数据存 LocalStorage，快速验证但后续重构成本极高，且无法实现时间连续性和长期演化
  2. **全栈完整版** — 一步到位做完整系统，周期太长，验证太慢
  3. **前端为主 + 简易后端 + Domain First（最终方案）** — 平衡速度与架构完整性，核心体验做扎实，架构不欠债
- **最终方案**：
  - **架构**：NestJS 后端 + Vue 3 前端 + PostgreSQL + pgvector，单数据库
  - **MVP 范围**：Character + Personality + Memory + Emotion + LifeEngine 五个核心 Domain
  - **成功标准**：用户能感受到"被记住"——"你居然记得？"
  - **开发原则**：Domain 驱动，严格分层，事件驱动通信
- **影响**：
  - Phase 8.1 聚焦 Life Core MVP，6 周目标
  - 后续 Phase 8.2（关系成长）、8.3（AIRI Body）可以直接扩展
  - 技术栈确定：TypeScript 全栈 + PostgreSQL + pgvector
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-043：Domain Runtime 实现 — NestJS DDD 分层 + 事件总线

- **背景**：Life Core MVP 的后端架构需要选择实现方式，确保 Domain 逻辑清晰、可测试、可扩展。
- **为什么**：
  1. **NestJS 天然契合 DDD**：Module + Provider + 依赖注入，与 Domain/Application/Infrastructure 分层完美对应
  2. **TypeScript 全栈共享类型**：前后端共用类型定义，减少联调错误，提升开发效率
  3. **事件总线解耦 Domain**：Domain 之间不直接调用，通过事件通信，符合架构规范，也方便后续扩展
  4. **Repository 模式隔离基础设施**：Domain 层定义 Repository 接口，Infrastructure 层实现，方便替换数据库或 ORM
  5. **可测试性好**：Domain 层纯逻辑，不依赖框架，容易写单元测试
- **备选方案**：
  1. **经典 MVC 分层** — 简单但业务逻辑容易散落在 Controller 和 Service 中，Domain 边界不清晰
  2. **微服务架构** — 每个 Domain 一个服务，太重，MVP 阶段不需要
  3. **NestJS + DDD 分层 + 事件总线（最终方案）** — 单体模块化，Domain 清晰，性能好，运维简单
- **最终方案**：
  - **框架**：NestJS
  - **分层**：Domain / Application / Infrastructure / Interface 四层
  - **通信**：EventEmitter2 事件总线，Domain 间事件驱动
  - **ORM**：Prisma（类型安全，迁移管理方便）
  - **目录结构**：每个 Domain 一个 Module，内部按四层组织
- **影响**：
  - 后端目录结构确定
  - 开发规范明确：Domain 层不依赖框架，纯逻辑
  - 测试策略：Domain 层单元测试 + API 层集成测试
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-044：记忆持久化策略 — PostgreSQL + pgvector，单库双表

- **背景**：Memory 是 MVP 的核心模块，记忆存储方案直接决定检索质量和开发成本。需要选择向量存储方案和记忆持久化策略。
- **为什么**：
  1. **避免双数据库复杂度**：MVP 阶段数据量小（<10万条），pgvector 性能够用，同时维护 PG + Milvus 两套系统成本太高
  2. **事务一致性**：记忆写入 + 向量写入在同一个事务中，不会出现数据不一致
  3. **主记忆表 + 向量表分表**：向量表单独存，避免影响主表查询性能，需要时 JOIN 查询
  4. **混合检索策略**：语义检索 + 时间检索 + 重要性加权，三路召回 RRF 融合，比单纯向量检索效果好
  5. **可迁移性**：后续数据量大了可以平滑迁移到专门的向量数据库，Domain 层接口不变
- **备选方案**：
  1. **专用向量数据库（Milvus / Pinecone）** — 性能好但运维复杂，MVP 阶段过重
  2. **纯关键词检索** — 简单但语义理解能力差，"生命感"体验不好
  3. **PostgreSQL + pgvector，单库双表 + 混合检索（最终方案）** — 平衡效果、复杂度、成本
- **最终方案**：
  - **主数据库**：PostgreSQL 15+
  - **向量扩展**：pgvector
  - **分表策略**：memories 主表 + memory_embeddings 向量表，一对一
  - **检索策略**：三路召回（语义 + 时间 + 重要性）+ RRF 融合排序
  - **索引**：IVFFlat 索引（MVP 阶段够用）
  - **向量维度**：1536 维（兼容 OpenAI text-embedding-ada-002）
- **影响**：
  - 数据库依赖确定，需要 CREATE EXTENSION vector
  - Memory Domain 按 Repository 模式设计，后续换向量库只改 Infrastructure 层
  - 检索质量是 MVP 成败的关键，需要做 A/B 测试调优
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## ADR-045：LifeEngine MVP 范围 — 事件驱动调度，不做自主行为

- **背景**：LifeEngine 是数字生命的调度中心，但 MVP 阶段应该做到什么程度需要明确。是只做事件响应，还是一开始就做自主行为？
- **为什么**：
  1. **MVP 的核心是"被记住"**：验证记忆闭环，不是验证主动性。自主行为是锦上添花，不是 MVP 必需
  2. **自主行为复杂度高**：涉及目标系统、行为规划、时机判断、多模态输出等，工作量大，且效果难保证
  3. **事件驱动是基础**：先把事件驱动的调度框架搭好，后续自主行为可以在这个基础上扩展
  4. **保持 MVP 聚焦**：少即是多，把记忆和情绪做扎实，比做一堆半吊子功能强
  5. **Phase 8.2 再上自主行为**：分阶段推进，每个阶段有明确的验证目标
- **备选方案**：
  1. **完整 LifeEngine（含自主行为）** — 功能全但周期长，MVP 验证慢
  2. **纯响应式，没有 LifeEngine 层** — 简单但架构不完整，后续加自主行为要重构
  3. **事件驱动调度 + 状态快照，不做自主行为（最终方案）** — 框架到位，核心功能聚焦，后续平滑扩展
- **最终方案**：
  - **LifeEngine 职责**：事件接收与分发、Domain 协调、状态快照、生命周期管理
  - **不做**：自主行为调度、目标系统、行为规划
  - **实现**：NestJS EventEmitter2 + 事件驱动架构
  - **状态快照**：重要事件后保存快照，供前端展示和后续分析
  - **自主行为**：Phase 8.2 再做
- **影响**：
  - Phase 8.1 范围明确，聚焦记忆闭环
  - LifeEngine 接口按完整生命周期设计，实现可以逐步填充
  - 为 Phase 8.2（关系成长 + 自主行为）打好架构基础
- **日期**：2026-07-08
- **负责人**：Chief Architect

---

## 相关文档

- [AGENTS.md](file:///workspace/AGENTS.md) — 入口索引（最高优先级）
- [01_系统架构总览.md](file:///workspace/docs/01_系统架构总览.md) — 架构总览（高层概念）
- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构（技术基线）
- [design-spec.md](file:///workspace/docs/design-spec.md) — 设计规范 🔒 已冻结
- [development-rules.md](file:///workspace/docs/development-rules.md) — 开发规范
- [coding-style.md](file:///workspace/docs/coding-style.md) — 代码风格
- [02-角色系统设计.md](file:///workspace/docs/02-角色系统设计.md) — 角色系统设计（Phase 2）
- [03-personality-domain.md](file:///workspace/docs/03-personality-domain.md) — Personality Domain 详细设计
- [04-character-data-model.md](file:///workspace/docs/04-character-data-model.md) — 角色数据模型设计
- [05-brain-body-architecture.md](file:///workspace/docs/05-brain-body-architecture.md) — Brain-Body 分层架构（Phase 3）
- [06-emotion-domain.md](file:///workspace/docs/06-emotion-domain.md) — Emotion Domain 详细设计
- [07-goal-domain.md](file:///workspace/docs/07-goal-domain.md) — Goal Domain 详细设计
- [08-relationship-domain.md](file:///workspace/docs/08-relationship-domain.md) — Relationship Domain 详细设计
- [09-engine-framework.md](file:///workspace/docs/09-engine-framework.md) — Engine 框架与调度器设计
- [10-digital-life-data-model.md](file:///workspace/docs/10-digital-life-data-model.md) — 数字生命引擎数据模型
- [11-community-domain.md](file:///workspace/docs/11-community-domain.md) — Community Domain 详细设计
- [12-world-state-domain.md](file:///workspace/docs/12-world-state-domain.md) — WorldState Domain 详细设计
- [13-timeline-domain.md](file:///workspace/docs/13-timeline-domain.md) — Timeline Domain 详细设计
- [14-community-data-model.md](file:///workspace/docs/14-community-data-model.md) — 社区系统数据模型
- [15-memory-domain.md](file:///workspace/docs/15-memory-domain.md) — Memory Domain 详细设计
- [16-narrative-domain.md](file:///workspace/docs/16-narrative-domain.md) — Narrative Domain 初版
- [17-memory-data-model.md](file:///workspace/docs/17-memory-data-model.md) — 记忆系统数据模型
- [18-commercial-architecture.md](file:///workspace/docs/18-commercial-architecture.md) — 商业化总体架构
- [19-subscription-domain.md](file:///workspace/docs/19-subscription-domain.md) — 会员订阅系统
- [20-wallet-asset-domain.md](file:///workspace/docs/20-wallet-asset-domain.md) — 钱包与虚拟资产
- [21-marketplace-domain.md](file:///workspace/docs/21-marketplace-domain.md) — AI Marketplace
- [22-commercial-data-model.md](file:///workspace/docs/22-commercial-data-model.md) — 商业化数据模型
- [23-open-ecosystem-architecture.md](file:///workspace/docs/23-open-ecosystem-architecture.md) — 开放生态总体架构
- [24-plugin-domain.md](file:///workspace/docs/24-plugin-domain.md) — Plugin Domain 详细设计
- [25-developer-platform.md](file:///workspace/docs/25-developer-platform.md) — 开发者平台设计
- [26-api-platform-design.md](file:///workspace/docs/26-api-platform-design.md) — API 开放平台设计
- [27-digital-life-protocol.md](file:///workspace/docs/27-digital-life-protocol.md) — Digital Life Protocol
- [28-ecosystem-data-model.md](file:///workspace/docs/28-ecosystem-data-model.md) — 开放生态数据模型
- [29-life-core-mvp-architecture.md](file:///workspace/docs/29-life-core-mvp-architecture.md) — Life Core MVP 架构设计（Phase 8.1）
- [30-character-runtime.md](file:///workspace/docs/30-character-runtime.md) — Character Runtime 设计
- [31-life-memory-implementation.md](file:///workspace/docs/31-life-memory-implementation.md) — Memory 实现设计
- [32-emotion-runtime.md](file:///workspace/docs/32-emotion-runtime.md) — Emotion Runtime 设计
- [33-life-engine-runtime.md](file:///workspace/docs/33-life-engine-runtime.md) — LifeEngine Runtime 设计
- [34-life-core-data-model.md](file:///workspace/docs/34-life-core-data-model.md) — Life Core 数据模型

---

*（后续 ADR 按编号追加，不得修改或删除已有记录）*
