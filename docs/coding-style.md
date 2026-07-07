# LifeOS Social — 代码风格规范

> **文档定位**：代码层面的风格与最佳实践，所有 TypeScript/Vue 代码必须遵守。
> **优先级**：低于 Master Prompt / AGENTS.md / architecture.md / design-spec.md / development-rules.md，高于 decision-log.md。
> **工具**：ESLint + Prettier（配置与本规范一致）

---

## 一、TypeScript 通用规范

### 1.1 Strict 模式

项目强制开启 TypeScript Strict 模式：

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

- 禁止使用 `any`，如必须使用用 `unknown` 替代
- 禁止非空断言 `!`，除非有明确注释说明原因
- 禁止 `@ts-ignore`，除非有明确注释 + 临时方案说明

### 1.2 Import 规范

#### 排序顺序

```typescript
// 1. 第三方库（按字母序）
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

// 2. 内部模块（按路径深度从外到内）
import { useEmotion } from '@/application/composables/use-emotion'
import { LifeCard } from '@/presentation/components/life-card/LifeCard'

// 3. 类型导入
import type { EmotionState } from '@lifeos/core'

// 4. 样式 / 资源
import './style.css'
```

#### 规则

- 使用 `import type` 导入纯类型
- 绝对路径优先（别名 `@/`），相对路径仅用于同目录文件
- 禁止循环依赖
- 一个 import 语句一个来源（不合并不同模块的 import）

### 1.3 Export 规范

```typescript
// ✅ 命名导出（优先）
export function useEmotion() { ... }
export const EmotionEngine = class { ... }
export type EmotionState = { ... }

// ✅ 默认导出（仅组件和页面）
export default LifeCard

// ❌ 禁止 export default 函数/类/变量（组件除外）
export default function() { ... }
```

- 工具函数、Engine、Service 使用命名导出
- Vue 组件、页面使用默认导出
- 禁止 `export * from '...'`（显式导出每个成员）

### 1.4 Interface & Type

```typescript
// ✅ 对象形状用 interface
interface EmotionState {
  mood: number
  energy: number
  arousal: number
}

// ✅ 联合类型/工具类型用 type
type EmotionType = 'happy' | 'sad' | 'angry' | 'calm'
type PartialEmotion = Partial<EmotionState>

// ✅ 函数类型用 type
type EmotionCallback = (state: EmotionState) => void
```

- 优先用 `interface` 定义对象形状（便于扩展）
- 联合类型、映射类型、函数类型用 `type`
- 接口命名：PascalCase，不加 `I` 前缀（可选）
- 类型导出放在文件顶部或底部集中区域

### 1.5 Enum 规范

```typescript
// ✅ 字符串枚举（优先）
enum EmotionType {
  Happy = 'happy',
  Sad = 'sad',
  Angry = 'angry',
  Calm = 'calm',
}

// ❌ 避免数字枚举（可读性差）
enum Status { Active, Inactive }

// ✅ 常量联合类型作为替代
const EMOTION_TYPES = ['happy', 'sad', 'angry', 'calm'] as const
type EmotionType = typeof EMOTION_TYPES[number]
```

- 优先使用字符串枚举或 `as const` + 类型推导
- 枚举值全部 PascalCase（枚举名）+ 值为小写 kebab/camel
- 枚举定义集中在 `types/` 或 Domain 内的 `enums/` 目录

### 1.6 Const 规范

```typescript
// ✅ 顶层常量用 UPPER_SNAKE_CASE
const MAX_EMOTION_VALUE = 100
const EMOTION_DECAY_RATE = 0.05

// ✅ 相关常量用对象组织
const EMOTION_CONFIG = {
  maxValue: 100,
  decayRate: 0.05,
  updateInterval: 1000,
} as const

// ✅ 函数内部常量用 camelCase
function calculate() {
  const threshold = 0.8
  // ...
}
```

- 模块级常量：UPPER_SNAKE_CASE
- 函数内局部常量：camelCase
- 一组相关常量使用对象组织 + `as const`
- 魔法数字必须提取为命名常量

### 1.7 函数规范

```typescript
// ✅ 函数声明（优先）
function calculateEmotion(state: EmotionState): number {
  return state.mood * 0.6 + state.energy * 0.4
}

// ✅ 箭头函数（回调 / 高阶函数）
const items = list.map((item) => item.name)

// ✅ 参数类型 + 返回值类型明确
function updateEmotion(
  state: EmotionState,
  deltaTime: number,
): EmotionState {
  // ...
}
```

- 每个函数必须有参数类型和返回值类型
- 函数参数不超过 4 个，超过使用对象参数
- 单一职责：一个函数只做一件事
- 函数长度不超过 50 行（超过则拆分）
- 避免副作用，优先纯函数

### 1.8 Async / Promise

```typescript
// ✅ async/await（优先）
async function loadEmotion(): Promise<EmotionState> {
  const response = await fetch('/api/emotion')
  return response.json()
}

// ✅ 错误处理
async function safeLoad() {
  try {
    return await loadEmotion()
  } catch (error) {
    console.error('Failed to load emotion:', error)
    return null
  }
}

// ❌ 禁止 Promise 嵌套 then
loadEmotion().then((s) => update(s)).then(...)

// ❌ 禁止忽略 Promise（未 await 也未 catch）
loadEmotion() // 必须 await 或 .catch()
```

- 优先使用 `async/await`，避免 `.then()` 链式调用
- 所有 Promise 必须处理错误（try/catch 或 .catch）
- 并行使用 `Promise.all` / `Promise.race`

### 1.9 错误处理

```typescript
// ✅ 自定义错误类
class EmotionEngineError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'EmotionEngineError'
  }
}

// ✅ 抛出错误时包含上下文
throw new EmotionEngineError(
  `Failed to update emotion: invalid state ${JSON.stringify(state)}`,
  'INVALID_STATE',
)

// ✅ 错误类型判断
if (error instanceof EmotionEngineError) {
  // 处理特定错误
}
```

- 禁止 `throw 'string'`，必须 throw Error 对象
- 业务错误使用自定义错误类
- 错误信息要可读，包含必要的上下文
- 不吞掉错误（catch 后至少要 log）

### 1.10 日志规范

```typescript
// ✅ 分级日志
console.debug('[EmotionEngine] updating state:', state)
console.info('[EmotionEngine] state updated successfully')
console.warn('[EmotionEngine] decay rate is unusually high:', rate)
console.error('[EmotionEngine] failed to serialize:', error)

// ❌ 禁止无意义的 console.log
console.log('123')
console.log('here')
```

- 使用 `console.debug/info/warn/error` 分级
- 日志前缀：`[ModuleName]` 格式
- 生产环境移除 debug 日志
- 禁止提交调试用的 console.log

---

## 二、Vue 组件规范

### 2.1 组件结构（SFC 顺序）

```vue
<script setup lang="ts">
// 1. import
import { ref, computed } from 'vue'

// 2. props
const props = defineProps<{
  emotion: EmotionState
  size?: 'sm' | 'md' | 'lg'
}>()

// 3. emit
const emit = defineEmits<{
  (e: 'click', value: number): void
}>()

// 4. 响应式状态
const isHovered = ref(false)

// 5. 计算属性
const moodPercent = computed(() => props.emotion.mood * 100)

// 6. 方法
const handleClick = () => {
  emit('click', props.emotion.mood)
}

// 7. 生命周期
onMounted(() => {
  // ...
})
</script>

<template>
  <div class="emotion-card" @click="handleClick">
    <!-- 内容 -->
  </div>
</template>

<style scoped>
.emotion-card {
  /* 样式 */
}
</style>
```

### 2.2 Props 规范

```typescript
// ✅ 使用 TypeScript 类型定义
const props = defineProps<{
  emotion: EmotionState
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}>()

// ✅ 带默认值
const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
}>(), {
  size: 'md',
})

// ❌ 禁止数组形式
defineProps(['emotion', 'size'])
```

- Props 必须有明确类型
- 可选 Props 有合理默认值
- Props 命名：camelCase（JS）/ kebab-case（模板）

### 2.3 Emit 规范

```typescript
// ✅ 类型定义 emits
const emit = defineEmits<{
  (e: 'update', value: EmotionState): void
  (e: 'click', event: MouseEvent): void
}>()

// ✅ 事件命名：动词 + 名词，kebab-case
emit('update-emotion', newState)
emit('item-click', item)
```

- 事件名使用 kebab-case
- 事件必须有明确的参数类型
- 不使用 `v-model` 以外的隐式约定

### 2.4 响应式规范

```typescript
// ✅ ref（基本类型 / 小型对象）
const count = ref(0)
const isActive = ref(false)

// ✅ reactive（复杂对象 / 表单）
const form = reactive({
  name: '',
  email: '',
})

// ✅ computed（派生状态）
const doubled = computed(() => count.value * 2)

// ❌ 禁止滥用 reactive（基本类型用 ref）
const count = reactive({ value: 0 })
```

- 基本类型用 `ref`
- 复杂对象用 `reactive`
- 派生状态用 `computed`
- 避免在组件内直接修改 props（用 computed 或 emit）

### 2.5 组合式函数规范

```typescript
// ✅ use 前缀
export function useEmotionState(lifeId: string) {
  const state = ref<EmotionState | null>(null)
  const loading = ref(false)

  const fetch = async () => {
    loading.value = true
    try {
      state.value = await emotionService.get(lifeId)
    } finally {
      loading.value = false
    }
  }

  return { state, loading, fetch }
}

// ✅ 返回对象，解构使用
const { state, loading, fetch: fetchEmotion } = useEmotionState(lifeId)
```

- Composable 以 `use` 开头
- 返回对象（非数组），便于按需解构
- 内部状态封装，外部通过方法修改

### 2.6 模板规范

```vue
<!-- ✅ 语义化标签 -->
<article class="feed-card">
  <header class="feed-card__header">...</header>
  <section class="feed-card__content">...</section>
  <footer class="feed-card__footer">...</footer>
</article>

<!-- ✅ v-for 带 key -->
<div
  v-for="item in items"
  :key="item.id"
  class="item"
>
  {{ item.name }}
</div>

<!-- ✅ 简单表达式 -->
<p>{{ formattedDate }}</p>

<!-- ❌ 复杂表达式放入 computed -->
<p>{{ new Date(item.timestamp).toLocaleDateString('zh-CN', { ... }) }}</p>
```

- 模板中只放简单绑定，复杂逻辑放 computed
- `v-for` 必须有 `:key`
- 避免 `v-if` 和 `v-for` 同时用在同一元素上
- 语义化 HTML 标签优先

---

## 三、样式规范（UnoCSS）

### 3.1 基本原则

- 优先使用 UnoCSS 原子类
- 禁止大量 scoped CSS / 全局 CSS
- 组件样式通过 props 控制，不写死颜色/尺寸

### 3.2 常用原子类

```html
<!-- 间距 -->
<div class="p-4 m-4 gap-4">...</div>

<!-- 颜色 -->
<div class="text-primary bg-surface border-border">...</div>

<!-- 圆角 -->
<div class="rounded-md rounded-full">...</div>

<!-- 阴影/发光 -->
<div class="shadow-md glow-primary">...</div>

<!-- 排版 -->
<div class="text-base font-medium leading-relaxed">...</div>

<!-- 过渡 -->
<div class="transition-base hover:translate-y--1px">...</div>

<!-- 布局 -->
<div class="flex items-center justify-between">...</div>
<div class="grid grid-cols-3 gap-4">...</div>
```

### 3.3 何时使用 scoped CSS

- 复杂动画（关键帧）
- 特殊选择器（::before, ::after）
- 第三方组件深度定制（:deep()）

```vue
<style scoped>
.emotion-glow {
  animation: breath 3s ease-in-out infinite;
}

@keyframes breath {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>
```

---

## 四、文件与函数长度

| 类型 | 建议长度 | 最大长度 |
|------|---------|---------|
| 组件文件 | < 300 行 | 500 行 |
| Engine 类 | < 300 行 | 500 行 |
| Service 类 | < 200 行 | 400 行 |
| 工具函数文件 | < 200 行 | 300 行 |
| 单个函数 | < 30 行 | 50 行 |
| 单测文件 | 不限 | — |

超过最大长度需考虑拆分。

---

## 五、注释规范

### 5.1 注释原则

- **代码自解释优先**：好的命名 > 注释
- **注释"为什么"，不是"是什么"**：解释设计决策、业务背景
- **保持更新**：修改代码时同步更新注释

### 5.2 JSDoc

```typescript
/**
 * 计算情绪的总体强度。
 *
 * 基于情绪效价和唤醒度的欧氏距离计算，
 * 用于衡量当前情绪的"强烈程度"。
 *
 * @param state - 当前情绪状态
 * @returns 情绪强度值，范围 [0, 1]
 * @throws {EmotionEngineError} 状态值超出范围时抛出
 *
 * @example
 * ```ts
 * const intensity = calculateIntensity({ mood: 0.8, energy: 0.6, arousal: 0.7 })
 * // => ~0.74
 * ```
 */
export function calculateIntensity(state: EmotionState): number {
  // ...
}
```

### 5.3 行内注释

```typescript
// 衰减情绪强度：时间越久越平缓
// 公式: value * exp(-rate * deltaTime)
const decayed = value * Math.exp(-decayRate * deltaTime / 1000)

// HACK: 临时绕过 NaN 问题，需在 v2.0 修复
// TODO: 改用更稳定的数值计算方法
```

- `//` 单行注释，与代码空一格
- `TODO:` 标记待办
- `HACK:` / `FIXME:` 标记临时方案
- 禁止注释掉的代码（直接删除，用 Git 回溯）

---

## 六、ESLint 规则（核心）

> 详细配置在 `.eslintrc.js` 中，此处列出核心规则。

| 规则 | 级别 | 说明 |
|------|------|------|
| `@typescript-eslint/no-explicit-any` | error | 禁止 any |
| `@typescript-eslint/no-unused-vars` | error | 禁止未使用变量 |
| `@typescript-eslint/explicit-function-return-type` | warn | 函数显式返回类型 |
| `@typescript-eslint/strict-boolean-expressions` | warn | 严格布尔表达式 |
| `no-console` | warn | 生产环境禁用 console.log |
| `no-debugger` | error | 禁止 debugger |
| `prefer-const` | error | 优先 const |
| `eqeqeq` | error | 必须用 === |
| `no-magic-numbers` | warn | 禁止魔法数字 |
| `vue/multi-word-component-names` | error | 组件名多单词 |
| `vue/require-prop-types` | error | props 必须有类型 |

---

## 七、Prettier 配置

| 选项 | 值 |
|------|----|
| printWidth | 100 |
| tabWidth | 2 |
| useTabs | false |
| semi | false |
| singleQuote | true |
| quoteProps | as-needed |
| trailingComma | all |
| bracketSpacing | true |
| arrowParens | always |
| endOfLine | lf |

---

**文档版本**: v1.0
**最后更新**: 2026-07-08
**维护者**: Chief Architect
