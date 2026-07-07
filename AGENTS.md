# LifeOS Social — AGENTS

> **⚠️ 最高优先级文档**
>
> 任何 AI / 开发者在开始任何工作之前，**必须**先按顺序阅读本文档中索引的所有规范。
>
> 不阅读本文档直接开发 = 违规。

---

## 文档优先级（从高到低）

```
Master Prompt (v2.0)
        ↓
AGENTS.md  ←── 你正在读这个
        ↓
architecture.md
        ↓
design-spec.md  🔒 已冻结
        ↓
development-rules.md
        ↓
coding-style.md
        ↓
decision-log.md (ADR)
        ↓
Existing Code
```

**冲突处理**：高优先级文档覆盖低优先级文档。
- 旧文档与 Master Prompt 冲突时，自动按 Master Prompt 更新旧文档，无需暂停。
- 代码与文档冲突时，以文档为准（修复代码）。

---

## 必读文档索引

### 1. 架构总览（高层概念）

**[01_系统架构总览.md](file:///workspace/docs/01_系统架构总览.md)**

> 快速理解产品核心：什么是数字生命？九大引擎是什么？从陌生人到深度绑定的 12 个阶段。
> 适合：所有人，快速上手概念。

---

### 2. 系统架构（技术基线）

**[architecture.md](file:///workspace/docs/architecture.md)**

> 🔴 **必读** — 完整的技术架构基线。
>
> **内容**：
> - 总体架构图（四层 + 三层业务）
> - 14 个 Domain 划分与边界
> - 事件驱动架构（事件总线 + 事件流示例）
> - Engine 统一生命周期接口
> - 四层架构详解（Presentation / Application / Domain / Infrastructure）
> - 业务三层详解（Digital Life / World / Companion）
> - AI-to-AI 安全边界
> - 数据库架构与核心表
> - 模块依赖方向
> - 技术栈总览
> - 架构演进路线

> **什么时候读**：开始任何架构设计、新增 Domain、跨模块开发之前。

---

### 3. 设计规范 🔒 已冻结

**[design-spec.md](file:///workspace/docs/design-spec.md)**

> 🔴 **必读** — Design System Single Source of Truth。
>
> **状态**：🔒 Phase 1 Design Freeze — 禁止修改 Token
>
> **内容**：
> - 设计理念：Anemone × Neon（海葵霓虹）
> - **Design Token（已冻结）**：
>   - Color（主色 / 中性 / 语义 / 交互状态）
>   - Typography（12 档字号 / 字重 / 字间距 / 字体家族）
>   - Radius（7 档圆角）
>   - Spacing（9 档间距）
>   - Shadow（4 档阴影 + 6 种发光）
>   - Motion（6 种时长 / 6 种缓动 / 5 种转场 / 7 个关键动画）
> - 组件规范（Button / Input / Card / Tag / Avatar / Modal / Nav / List / Icon / Tooltip）
> - 布局规范（12 列栅格 / 6 级响应式断点）
> - 暗色 / 亮色模式策略
> - Token 使用原则

> **什么时候读**：写任何 UI 代码、新增组件、调整样式之前。
> **禁止事项**：禁止硬编码颜色/字号/间距，禁止修改已冻结 Token。

---

### 4. 开发规范

**[development-rules.md](file:///workspace/docs/development-rules.md)**

> 🔴 **必读** — 开发流程与架构规范。
>
> **内容**：
> - 目录规范（monorepo 三级结构 + 各层内部目录）
> - 命名规范（文件 / 目录 / 变量 / CSS / 组件 / Engine）
> - Store 规范（Pinia + Composition API + 只存 UI 状态）
> - Composable 规范（use 前缀 + 分类 + 返回对象）
> - Engine 规范（统一 9 方法生命周期 + 事件驱动）
> - API 规范（RESTful + 响应格式 + 错误码体系）
> - DDD 规范（四层依赖方向 + 跨 Domain 事件通信 + 聚合根）
> - 测试规范（金字塔 + 覆盖率要求 + Vitest / Playwright）
> - Git 规范（分支命名 + Conventional Commits + PR 规范）
> - 依赖管理 + 性能规范 + 安全规范
> - 代码组织 8 原则

> **什么时候读**：开始任何模块开发、新增功能、写测试之前。

---

### 5. 代码风格

**[coding-style.md](file:///workspace/docs/coding-style.md)**

> 🟡 **参考** — 具体代码风格与最佳实践。
>
> **内容**：
> - TypeScript 通用规范（Strict + Import/Export + Interface/Type/Enum + 函数 + Async + 错误处理 + 日志）
> - Vue 组件规范（SFC 顺序 + Props/Emit + 响应式 + 组合式函数 + 模板）
> - UnoCSS 样式规范
> - 文件与函数长度限制
> - 注释规范（JSDoc + TODO/HACK/FIXME）
> - ESLint 核心规则 + Prettier 配置

> **什么时候读**：写具体代码时，确保风格一致。

---

### 6. 决策记录（ADR）

**[decision-log.md](file:///workspace/docs/decision-log.md)**

> 🟡 **参考** — 所有重大技术决策的背景与原因。
>
> **格式**：ADR-XXX + 标题 / 背景 / 为什么 / 备选方案 / 最终方案 / 影响 / 日期 / 负责人
>
> **当前已记录的决策**（截止 Phase 1）：
> - ADR-001：技术栈选型（Vue3 + Naive UI + UnoCSS + TS）
> - ADR-002：设计语言（Anemone × Neon 海葵霓虹）
> - ADR-003：目录结构（apps / packages 三级）
> - ADR-004：Domain 划分（14 个 Domain）
> - ADR-005：四层架构 + 业务三层叠加
> - ADR-006：Engine 统一生命周期接口
> - ADR-007：数据库统一字段规范
> - ADR-008：自主行为调度流程
> - ADR-009：AI-to-AI 安全边界
> - ADR-010：Memory 职责边界
> - ADR-011：主色调选择（星河粉紫 + 深海青蓝）
> - ADR-012：开发阶段严格执行
> - ADR-013：AIRI 基座扩展策略

> **什么时候读**：遇到技术选型疑问、想推翻已有决策时。先读 ADR，再考虑是否需要新增决策。

---

## 标准开发流程（Standard Workflow）

每次开发**必须**按以下流程执行：

```
1. 读取 AGENTS.md（本文档）
        ↓
2. 读取 architecture.md
        ↓
3. 读取 design-spec.md（UI 相关任务）
        ↓
4. 读取 development-rules.md
        ↓
5. 读取 coding-style.md（代码任务）
        ↓
6. 查看 decision-log.md（相关决策）
        ↓
7. 分析需求
        ↓
8. 检查冲突（与现有架构/规范是否冲突）
        ↓
9. 增量开发（不推翻，不重构，只扩展）
        ↓
10. 测试
        ↓
11. 更新 ADR（如有重大决策）
```

---

## 禁止事项（最高优先级）

以下行为**严格禁止**，违者需回退：

| 编号 | 禁止事项 |
|------|---------|
| 1 | 重构 AIRI 架构 / 修改 AIRI Runtime / Router / Build / Store |
| 2 | 推翻已有系统 / 大面积重写 |
| 3 | 修改 Design Token / 修改 UI 风格 |
| 4 | 引入第二个组件库（只能用 Naive UI） |
| 5 | 重复造轮子 / 重复实现已有功能 |
| 6 | 随意增加依赖 |
| 7 | 修改 API 风格 / 修改命名规范 / 修改目录规范 |
| 8 | 删除已有代码（除非确认无用且有记录） |
| 9 | 使用示例代码代替正式实现 |
| 10 | 为了"更优雅"而大面积重写代码 |
| 11 | 跨 Domain 直接调用（必须用事件） |
| 12 | 跨 Layer 直接调用（必须遵循依赖方向） |
| 13 | 跳阶段开发（必须按 Phase 1→7 顺序） |
| 14 | 硬编码颜色 / 字号 / 间距（必须用 Token） |

---

## 何时需要暂停确认

### ✅ 无需暂停，直接做

- 文档同步更新（对齐高优先级文档）
- 命名统一 / 目录整理（不破坏规范）
- Design Token 的引用（不是修改）
- 新增符合规范的模块
- 修复明显 Bug
- 补充测试
- 更新 ADR
- 更新 AGENTS 索引

### ⛔ 必须暂停，等待确认

- 修改核心产品定位
- 更换技术栈
- 引入新的基础框架
- 修改数据库核心模型
- 修改 AIRI Runtime
- 删除已有核心模块
- 涉及商业模式或安全策略的重大调整

---

## 当前阶段

```
Phase 1: 设计系统冻结  ✅ 已完成
    ↓
Phase 2: 角色系统  ◀── 下一阶段
    ↓
Phase 3: 数字生命引擎
    ↓
Phase 4: 社区系统
    ↓
Phase 5: 记忆系统
    ↓
Phase 6: 商业化
    ↓
Phase 7: 开放生态
```

---

**文档版本**: v1.0
**对应 Master Prompt**: v2.0
**最后更新**: 2026-07-08
**维护者**: Chief Architect
