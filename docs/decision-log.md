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

## 相关文档

- [AGENTS.md](file:///workspace/AGENTS.md) — 入口索引（最高优先级）
- [01_系统架构总览.md](file:///workspace/docs/01_系统架构总览.md) — 架构总览（高层概念）
- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构（技术基线）
- [design-spec.md](file:///workspace/docs/design-spec.md) — 设计规范 🔒 已冻结
- [development-rules.md](file:///workspace/docs/development-rules.md) — 开发规范
- [coding-style.md](file:///workspace/docs/coding-style.md) — 代码风格

---

*（后续 ADR 按编号追加，不得修改或删除已有记录）*
