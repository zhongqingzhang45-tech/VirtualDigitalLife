# LifeOS Social — 设计规范文档

> **文档定位**：Design System Single Source of Truth，所有 UI 设计与实现必须严格遵守。
> **设计语言**：Anemone × Neon（海葵霓虹）—— 深紫蓝夜 × 星河粉紫 × 深海青蓝
> **设计原则**：Anime × Future × Emotional × Community
> **状态**：🔒 已冻结（Phase 1 Design Freeze）
> **优先级**：低于 Master Prompt / AGENTS.md / architecture.md，高于 development-rules.md / coding-style.md。

---

## 一、设计理念

### 1.1 设计语言：Anemone × Neon（海葵霓虹）

**核心隐喻**：在深邃的数字海洋中，每一个 AI 数字生命像海葵一样静静地发光、呼吸、生长。

**视觉关键词**：
- 🌌 **沉浸**：深紫蓝的夜空/深海背景，仿佛进入另一个世界
- ✨ **发光**：柔和的霓虹光晕，代表生命与能量
- 🌸 **呼吸**：缓慢的脉动与渐变，模拟生命的呼吸感
- 🫧 **透明**：玻璃态卡片，轻盈通透
- 🎀 **二次元**：圆润的边角，柔和的曲线，动漫般的色彩

### 1.2 参考与差异

| 维度 | iirose（参考） | LifeOS（我们） |
|------|---------------|---------------|
| **背景** | 纯白 | 深紫蓝暗色 |
| **风格** | 极简文艺 | 未来科技 + 情感温度 |
| **光影** | 平面无阴影 | 柔和发光 + 玻璃态 |
| **信息密度** | 极低（仪式感） | 中等（社区场景） |
| **动效** | 淡入淡出 | 呼吸脉动 + 微光流动 |
| **字体** | 衬线体 | 无衬线 + 数字感字体 |

### 1.3 设计四原则

1. **呼吸感优先**：宁可空，不可挤。留白是设计的一部分。
2. **发光即生命**：光效用于强调生命感，不可滥用（仅交互状态/重要元素）。
3. **温度与科技平衡**：粉紫带来温度，青蓝带来理性，两者交替主导不同场景。
4. **动效有意义**：每个动画都应服务于"生命感"或"引导注意力"，不为炫技而动。

---

## 二、Design Token（已冻结）

> ⚠️ **冻结声明**：以下 Token 一经确认，禁止修改。所有组件与页面必须严格引用。

### 2.1 Color（色彩）

#### 基础色板

| Token | 值 | 用途 | 色预览 |
|-------|----|------|--------|
| `--color-primary` | `#B07BFF` | 主色 · 星河粉紫 | 🟣 |
| `--color-primary-light` | `#C9A8FF` | 主色亮 | 🟪 |
| `--color-primary-dark` | `#8A5CF0` | 主色暗 | 🟣 |
| `--color-secondary` | `#4FC3F7` | 辅色 · 深海青蓝 | 🔵 |
| `--color-secondary-light` | `#81D4FA` | 辅色亮 | 🩵 |
| `--color-secondary-dark` | `#0288D1` | 辅色暗 | 🔵 |
| `--color-accent` | `#FF8FD4` | 强调色 · 樱花粉 | 🩷 |
| `--color-accent-light` | `#FFB6E0` | 强调色亮 | 🩷 |
| `--color-accent-dark` | `#F062B9` | 强调色暗 | 💗 |

#### 中性色板

| Token | 值 | 用途 |
|-------|----|------|
| `--color-bg` | `#0D0B1A` | 页面背景 · 深紫蓝夜 |
| `--color-bg-elevated` | `#131028` | 提升背景（浮层） |
| `--color-surface` | `#1A1630` | 卡片/面板表面 |
| `--color-surface-hover` | `#252040` | 表面悬停 |
| `--color-surface-pressed` | `#0F0D20` | 表面按下 |
| `--color-border` | `rgba(176, 123, 255, 0.15)` | 边框 |
| `--color-border-strong` | `rgba(176, 123, 255, 0.3)` | 强调边框 |
| `--color-border-subtle` | `rgba(176, 123, 255, 0.08)` | 弱化边框 |
| `--color-divider` | `rgba(176, 123, 255, 0.08)` | 分割线 |

#### 文字色板

| Token | 值 | 用途 |
|-------|----|------|
| `--color-text-primary` | `#F0ECFF` | 主要文字 |
| `--color-text-secondary` | `#A89FCC` | 次要文字 |
| `--color-text-tertiary` | `#6B648F` | 三级文字（辅助） |
| `--color-text-disabled` | `#4A4568` | 禁用文字 |
| `--color-text-inverse` | `#0D0B1A` | 反色文字（浅色背景上） |

#### 语义色板

| Token | 值 | 用途 |
|-------|----|------|
| `--color-success` | `#69F0AE` | 成功 · 薄荷绿 |
| `--color-warning` | `#FFD54F` | 警告 · 暖黄 |
| `--color-danger` | `#FF6B8A` | 错误/危险 · 珊瑚粉 |
| `--color-info` | `#4FC3F7` | 信息 · 青蓝（同辅色） |

#### 交互状态色

| 状态 | Primary | Secondary | Surface |
|------|---------|-----------|---------|
| **Default** | `#B07BFF` | `#4FC3F7` | `#1A1630` |
| **Hover** | `#C9A8FF` | `#81D4FA` | `#252040` |
| **Pressed** | `#8A5CF0` | `#0288D1` | `#0F0D20` |
| **Disabled** | `rgba(176, 123, 255, 0.3)` | `rgba(79, 195, 247, 0.3)` | `rgba(26, 22, 48, 0.5)` |
| **Selected** | `rgba(176, 123, 255, 0.2)` | `rgba(79, 195, 247, 0.2)` | `#252040` |
| **Focus** | `0 0 0 2px rgba(176, 123, 255, 0.5)` | `0 0 0 2px rgba(79, 195, 247, 0.5)` | - |

### 2.2 Typography（字体）

#### 字体家族

| Token | 值 | 用途 |
|-------|----|------|
| `--font-sans` | `'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | 正文 · 无衬线 |
| `--font-display` | `'Orbitron', 'Inter', 'Noto Sans SC', sans-serif` | 展示 · 数字/标题（科技感） |
| `--font-mono` | `'JetBrains Mono', 'Fira Code', monospace` | 代码 · 等宽 |

#### 字号体系（12 档）

| Token | 字号 | 行高 | 字重 | 用途 |
|-------|------|------|------|------|
| `--text-xs` | 11px | 16px | 400 | 标签、辅助说明 |
| `--text-sm` | 12px | 18px | 400 | 次要文字 |
| `--text-base` | 14px | 22px | 400 | 正文（默认） |
| `--text-lg` | 16px | 26px | 400 | 大正文 |
| `--text-xl` | 18px | 28px | 500 | 小标题 |
| `--text-2xl` | 20px | 30px | 600 | 卡片标题 |
| `--text-3xl` | 24px | 36px | 600 | 页面标题 |
| `--text-4xl` | 30px | 44px | 700 | Hero 标题 |
| `--text-5xl` | 38px | 56px | 700 | 大标题 |
| `--text-6xl` | 48px | 68px | 800 | 超大标题 |
| `--text-7xl` | 60px | 82px | 800 | 展示级 |
| `--text-8xl` | 76px | 100px | 900 | 巨型展示 |

#### 字重

| Token | 值 | 用途 |
|-------|----|------|
| `--font-normal` | 400 | 常规 |
| `--font-medium` | 500 | 中等 |
| `--font-semibold` | 600 | 半粗 |
| `--font-bold` | 700 | 粗体 |
| `--font-extrabold` | 800 | 特粗 |
| `--font-black` | 900 | 极粗 |

#### 字间距

| Token | 值 | 用途 |
|-------|----|------|
| `--tracking-tight` | -0.02em | 紧凑标题 |
| `--tracking-normal` | 0 | 常规 |
| `--tracking-wide` | 0.04em | 宽松（按钮/标签） |
| `--tracking-wider` | 0.08em | 极宽（装饰性文字） |

### 2.3 Radius（圆角）

| Token | 值 | 用途 |
|-------|----|------|
| `--radius-xs` | 4px | 极小圆角（标签、徽章） |
| `--radius-sm` | 8px | 小圆角（输入框、小按钮） |
| `--radius-md` | 12px | 中圆角（卡片默认） |
| `--radius-lg` | 16px | 大圆角（大卡片、弹窗） |
| `--radius-xl` | 20px | 超大圆角（容器、面板） |
| `--radius-2xl` | 24px | 极圆角（Hero 元素） |
| `--radius-full` | 9999px | 全圆角（胶囊、圆形头像） |

### 2.4 Spacing（间距）

| Token | 值 | 用途 |
|-------|----|------|
| `--space-1` | 4px | 最小间距 |
| `--space-2` | 8px | 小间距 |
| `--space-3` | 12px | 中小间距 |
| `--space-4` | 16px | 基础间距（默认） |
| `--space-6` | 24px | 大间距 |
| `--space-8` | 32px | 超大间距 |
| `--space-10` | 40px | 区块间距 |
| `--space-12` | 48px | 大区块间距 |
| `--space-16` | 64px | 页面级间距 |

### 2.5 Shadow（阴影）

#### 盒阴影

| Token | 值 | 用途 |
|-------|----|------|
| `--shadow-xs` | `0 1px 2px rgba(0, 0, 0, 0.2)` | 极轻阴影 |
| `--shadow-sm` | `0 2px 8px rgba(0, 0, 0, 0.25)` | 小阴影 |
| `--shadow-md` | `0 4px 16px rgba(0, 0, 0, 0.3)` | 中等阴影（卡片默认） |
| `--shadow-lg` | `0 8px 32px rgba(0, 0, 0, 0.4)` | 大阴影（弹窗） |

#### 发光阴影

| Token | 值 | 用途 |
|-------|----|------|
| `--glow-primary` | `0 0 20px rgba(176, 123, 255, 0.4), 0 0 40px rgba(176, 123, 255, 0.2)` | 主色发光 |
| `--glow-primary-soft` | `0 0 12px rgba(176, 123, 255, 0.25)` | 主色柔光 |
| `--glow-secondary` | `0 0 20px rgba(79, 195, 247, 0.4), 0 0 40px rgba(79, 195, 247, 0.2)` | 辅色发光 |
| `--glow-accent` | `0 0 20px rgba(255, 143, 212, 0.4), 0 0 40px rgba(255, 143, 212, 0.2)` | 强调色发光 |
| `--glow-danger` | `0 0 16px rgba(255, 107, 138, 0.4)` | 危险色发光 |
| `--glow-success` | `0 0 16px rgba(105, 240, 174, 0.4)` | 成功色发光 |

> ⚠️ **发光使用原则**：仅用于 **交互状态（hover/focus）**、**重要强调元素**、**生命状态指示器**。普通卡片/按钮默认不发光，避免视觉噪音。

### 2.6 Motion（动效）

#### 时长

| Token | 值 | 用途 |
|-------|----|------|
| `--duration-instant` | 100ms | 即时反馈（点击波纹） |
| `--duration-fast` | 200ms | 快速过渡（悬停） |
| `--duration-base` | 300ms | 基础过渡（默认） |
| `--duration-slow` | 500ms | 慢速过渡（面板切换） |
| `--duration-slower` | 800ms | 超慢过渡（页面入场） |
| `--duration-breath` | 3000ms | 呼吸周期（发光脉动） |

#### 缓动函数

| Token | 值 | 用途 |
|-------|----|------|
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | 标准缓动（默认） |
| `--ease-decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | 减速进场 |
| `--ease-accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | 加速离场 |
| `--ease-emphasized` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | 强调缓动（弹性） |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 弹簧效果 |
| `--ease-breath` | `cubic-bezier(0.4, 0, 0.6, 1)` | 呼吸缓动（正弦感） |

#### 转场预设

| Token | 值 | 用途 |
|-------|----|------|
| `--transition-base` | `all var(--duration-base) var(--ease-standard)` | 基础过渡 |
| `--transition-fast` | `all var(--duration-fast) var(--ease-standard)` | 快速过渡 |
| `--transition-color` | `color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)` | 颜色过渡 |
| `--transition-transform` | `transform var(--duration-base) var(--ease-spring)` | 变换过渡 |
| `--transition-opacity` | `opacity var(--duration-base) var(--ease-standard)` | 透明度过渡 |

#### 关键动画

| 动画名 | 描述 | 时长 | 缓动 |
|--------|------|------|------|
| `breath` | 呼吸发光脉动 | 3s | `ease-in-out` |
| `float` | 轻微上下漂浮 | 4s | `ease-in-out` |
| `fade-in` | 淡入 | 300ms | `ease-out` |
| `fade-in-up` | 上移淡入 | 400ms | `ease-out` |
| `scale-in` | 缩放入场 | 200ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `pulse-glow` | 发光脉冲 | 2s | `ease-in-out` |
| `shimmer` | 微光扫过 | 2.5s | `linear` |

> ⚠️ **动效原则**：
> 1. **克制使用**：非必要不动效，避免视觉干扰
> 2. **有意义**：动效服务于功能（引导注意、反馈状态、表达生命感）
> 3. **性能优先**：只动画 `transform` 和 `opacity`，避免触发重排重绘
> 4. **尊重偏好**：检测 `prefers-reduced-motion`，对偏好减少动效的用户关闭非必要动画

---

## 三、组件规范

### 3.1 Button（按钮）

#### 类型

| 类型 | 样式 | 使用场景 |
|------|------|---------|
| **Primary** | 实心底，主色填充，发光 hover | 主要操作（确认、提交） |
| **Secondary** | 边框 + 透明底 | 次要操作（取消、返回） |
| **Tertiary** | 纯文字，无背景无边框 | 三级操作（链接、更多） |
| **Ghost** | 背景 10% 透明度 + 主色文字 | 暗色背景上的次要强调 |
| **Danger** | 珊瑚粉色 | 删除、危险操作 |

#### 尺寸

| 尺寸 | 高度 | 内边距 | 字号 | 圆角 |
|------|------|--------|------|------|
| **Mini** | 24px | 0 8px | 11px | 6px |
| **Small** | 32px | 0 12px | 12px | 8px |
| **Medium** | 40px | 0 20px | 14px | 10px |
| **Large** | 48px | 0 28px | 16px | 12px |

#### 状态

Default → Hover（上移 1px + 发光）→ Pressed（下沉 + 变暗）→ Disabled（50% 不透明度）

#### 规范
- 按钮内容水平居中，字重 500
- Primary 按钮 hover 时显示 `--glow-primary-soft` 发光
- 两个按钮并排时，间距为 `--space-3`
- 按钮组使用胶囊式（左右圆角合并）

### 3.2 Input / Textarea（输入框）

#### 样式

- 背景：`--color-surface`
- 边框：1px `--color-border`，focus 时 `--color-primary` + 发光
- 文字：`--color-text-primary`
- 占位符：`--color-text-tertiary`
- 圆角：`--radius-sm`
- 高度：36px（默认）

#### 状态

Default → Hover（边框变亮）→ Focus（主色边框 + 发光外描边）→ Disabled → Error（危险色边框）

#### 规范
- label 在上，间距 8px，字号 12px，字重 500
- 错误提示在下方，字号 11px，`--color-danger`
- 前缀/后缀图标与文字间距 8px

### 3.3 Card（卡片）

#### 类型

| 类型 | 样式 | 使用场景 |
|------|------|---------|
| **Default** | 表面色 + 1px 边框 + 中等阴影 | 通用卡片 |
| **Glass** | 半透明背景 + backdrop-blur + 边框 | Hero 区、浮层 |
| **Elevated** | 提升背景色 + 大阴影 | 弹窗、悬浮层 |
| **Outlined** | 仅边框，无背景 | 轻量分组 |

#### 尺寸

| 尺寸 | 内边距 | 圆角 |
|------|--------|------|
| **Sm** | 12px | 10px |
| **Md** | 16px | 12px |
| **Lg** | 24px | 16px |

#### 规范
- 卡片内标题与内容间距 12px
- 卡片之间间距 16px（列表中）
- hover 状态：上移 2px + 阴影加深 + 边框微亮
- 卡片内底部操作区：顶部分割线，padding-top 12px

### 3.4 Tag / Badge（标签/徽章）

#### 类型

- **默认标签**：背景 15% 主色透明度 + 主色文字
- **实心标签**：主色填充 + 反色文字
- **状态标签**：绿/黄/红/蓝 表示状态
- **数字徽章**：小圆角胶囊，右上角定位

#### 规范
- 标签高度：20px（默认）/ 24px（大号）
- 内边距：0 8px
- 字号：11px / 12px
- 圆角：4px（标签）/ 9999px（徽章）
- 字重：500

### 3.5 Avatar（头像）

#### 尺寸

| 尺寸 | 直径 | 字号 |
|------|------|------|
| Xs | 24px | 10px |
| Sm | 32px | 12px |
| Md | 40px | 14px |
| Lg | 56px | 18px |
| Xl | 80px | 24px |

#### 规范
- 圆形：`border-radius: 50%`
- 边框：2px `--color-border-strong`（在线状态用发光边框）
- 在线状态点：右下角，大小 8px/10px/12px，绿色发光
- 缺省头像：主色渐变 + 用户名字首字母

### 3.6 Modal / Dialog（弹窗）

#### 规范
- 宽度：480px（默认）/ 640px（大）/ 320px（小）
- 最大高度：80vh，内容区滚动
- 背景：`--color-bg-elevated` + backdrop-blur(8px)
- 圆角：`--radius-xl`
- 阴影：`--shadow-lg`
- 入场动画：`scale-in` + `fade-in`
- 遮罩：黑色 60% 透明度 + backdrop-blur(4px)
- 标题区：底部边框，padding 20px 24px
- 内容区：padding 24px
- 操作区：顶部分割线，padding 16px 24px，右对齐按钮

### 3.7 Navigation（导航）

#### 侧边栏导航
- 宽度：240px（收起：64px）
- 背景：`--color-bg`
- Logo 区：高度 64px，底部边框
- 菜单项：高度 44px，左右 padding 16px，圆角 10px
- 激活态：主色 15% 背景 + 主色文字 + 左侧 3px 主色条
- hover：表面色背景

#### 顶部导航
- 高度：56px
- 背景：半透明 `--color-bg` + backdrop-blur
- 底部边框：1px `--color-divider`

### 3.8 List（列表）

#### 规范
- 列表项高度：48px（默认）/ 56px（大号）/ 40px（紧凑）
- 分割线：`--color-divider`，左右 inset 16px
- hover：`--color-surface-hover` 背景
- 选中：`--color-surface-pressed` + 左侧主色边框
- 图标与文字间距：12px

### 3.9 Icon（图标）

#### 规范
- 图标库：使用 `@vicons/ionicons5`（与 Naive UI 一致）
- 尺寸：16px / 20px / 24px / 32px
- 颜色：继承文字色
- 与文字对齐：垂直居中，间距 6-8px
- 状态图标：使用语义色（成功绿、警告黄、危险红）

### 3.10 Tooltip（气泡提示）

- 背景：`--color-surface`
- 文字：`--color-text-secondary`，12px
- padding：6px 10px
- 圆角：8px
- 阴影：`--shadow-sm`
- 间距：与目标元素 8px
- 动画：淡入 + 微缩放，150ms

---

## 四、布局规范

### 4.1 栅格系统

- 基于 12 列栅格
- Gutter：24px
- 最大内容宽度：1200px
- 侧边栏宽度：240px

### 4.2 断点（响应式）

| 断点 | 宽度 | 命名 | 场景 |
|------|------|------|------|
| **xs** | < 480px | 超小屏 | 手机竖屏 |
| **sm** | ≥ 480px | 小屏 | 手机横屏 / 小平板 |
| **md** | ≥ 768px | 中屏 | 平板 |
| **lg** | ≥ 1024px | 大屏 | 笔记本 |
| **xl** | ≥ 1280px | 超大屏 | 桌面 |
| **2xl** | ≥ 1536px | 极大屏 | 大桌面 |

### 4.3 页面布局模板

| 模板 | 结构 | 使用场景 |
|------|------|---------|
| **Standard** | 侧边栏 + 顶部栏 + 内容区 | 主应用 |
| **Centered** | 居中内容（左右留白） | 登录、设置 |
| **Full** | 全屏内容 | 沉浸式页面 |
| **Dashboard** | 顶部栏 + 多栏内容 | 数据看板 |

---

## 五、暗色/亮色模式

### 5.1 默认策略

- **默认**：暗色模式（Anemone × Neon 的核心体验）
- **亮色模式**：支持切换（Phase 2 实现）

### 5.2 亮色模式色板（规划）

| Token | 暗值 | 亮值（规划） |
|-------|------|-------------|
| `--color-bg` | `#0D0B1A` | `#FAF9FF` |
| `--color-surface` | `#1A1630` | `#FFFFFF` |
| `--color-text-primary` | `#F0ECFF` | `#1A1630` |
| `--color-text-secondary` | `#A89FCC` | `#6B648F` |
| `--color-border` | `rgba(176,123,255,0.15)` | `rgba(138,92,240,0.12)` |

> 亮色模式在 Phase 2 实现并验证，当前 Phase 1 仅冻结暗色模式 Token。

---

## 六、插画与图形

### 6.1 风格
- 二次元 / Anime 风格
- 柔和渐变 + 发光轮廓
- 线条细腻，色彩通透

### 6.2 空状态
- 使用 3D 插画或矢量图形
- 色彩与主色调一致
- 文案温暖有情感

---

## 七、声音与触觉（规划）

> Phase 后续实现，此处仅占位。

- 界面音效：柔和的电子音，短促（< 200ms）
- 生命音效：呼吸声、心跳声（极低音量，背景氛围）
- 触觉反馈：移动端轻震动反馈

---

## 八、设计系统使用规范

### 8.1 Token 使用原则

1. **禁止硬编码**：所有颜色/字号/间距/圆角/阴影/动效必须引用 Token
2. **禁止新增 Token**：除非设计系统迭代，否则不得新增
3. **禁止修改 Token**：已冻结 Token 不得修改值
4. **语义优先**：使用语义化 Token（如 `--color-primary`），而非值 Token（如 `--color-purple-500`）

### 8.2 UnoCSS 预设

所有 Token 将配置为 UnoCSS shortcuts / theme，组件直接使用原子类：
- 颜色：`text-primary` / `bg-surface` / `border-border`
- 间距：`p-4` / `m-6` / `gap-4`
- 圆角：`rounded-md` / `rounded-full`
- 阴影：`shadow-md` / `glow-primary`
- 动效：`transition-base` / `duration-fast`

---

## 相关文档

- [AGENTS.md](file:///workspace/AGENTS.md) — 入口索引（最高优先级）
- [01_系统架构总览.md](file:///workspace/docs/01_系统架构总览.md) — 架构总览（高层概念）
- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构（技术基线）
- [development-rules.md](file:///workspace/docs/development-rules.md) — 开发规范
- [coding-style.md](file:///workspace/docs/coding-style.md) — 代码风格
- [decision-log.md](file:///workspace/docs/decision-log.md) — 决策记录（ADR）

---

**文档版本**: v1.0（冻结）
**设计语言**: Anemone × Neon
**最后更新**: 2026-07-08
**维护者**: Chief Architect
**状态**: 🔒 Phase 1 Design Freeze
