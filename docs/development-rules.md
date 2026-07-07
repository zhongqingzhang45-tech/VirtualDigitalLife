# LifeOS Social — 开发规范文档

> **文档定位**：开发流程与架构规范，所有代码必须遵守。
> **优先级**：低于 Master Prompt / AGENTS.md / architecture.md / design-spec.md，高于 coding-style.md / decision-log.md。

---

## 一、目录规范

### 1.1 Monorepo 结构

```
/ (根目录)
├── apps/
│   ├── lifeos-web/          # 前端 Web 应用（Vue3 + Naive UI）
│   └── server/              # 后端服务（Node.js）
├── packages/
│   └── lifeos-core/         # 数字生命核心引擎（前后端共享）
├── docs/                    # 文档
│   ├── architecture.md
│   ├── design-spec.md
│   ├── development-rules.md
│   ├── coding-style.md
│   └── decision-log.md
├── AGENTS.md                # 索引文档
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

### 1.2 禁止的一级目录

以下目录名**禁止**作为一级目录使用：
- `common/`
- `shared/`
- `modules/`
- `libs/`
- `system/`
- `logic/`
- `features/`
- `core2/`
- `new-core/`

如需新增一级目录，必须先更新 architecture.md 并记录到 decision-log.md。

### 1.3 apps/lifeos-web 内部结构

```
apps/lifeos-web/src/
├── presentation/            # Presentation Layer
│   ├── pages/               # 页面组件
│   │   ├── home/
│   │   ├── chat/
│   │   └── community/
│   ├── components/          # 展示组件（纯 UI）
│   │   ├── life-card/
│   │   ├── feed-item/
│   │   └── ...
│   ├── layouts/             # 布局组件
│   ├── router/              # 路由配置
│   └── assets/              # 静态资源
├── application/             # Application Layer
│   ├── services/            # Application Services
│   ├── composables/         # 组合式函数（应用层）
│   ├── dto/                 # Data Transfer Objects
│   └── commands/            # CQRS Commands / Queries
├── stores/                  # UI 状态管理（Pinia）
│   ├── ui/                  # 纯 UI 状态
│   └── view/                # 视图状态
└── main.ts
```

### 1.4 packages/lifeos-core 内部结构

```
packages/lifeos-core/src/
├── domain/                  # Domain Layer
│   ├── digital-life/        # DigitalLife Domain
│   │   ├── entities/
│   │   ├── engines/
│   │   ├── events/
│   │   └── repositories/    # 接口
│   ├── personality/         # Personality Domain
│   ├── emotion/             # Emotion Domain
│   ├── memory/              # Memory Domain
│   ├── behavior/            # Behavior Domain
│   ├── goal/                # Goal Domain
│   ├── timeline/            # Timeline Domain
│   ├── narrative/           # Narrative Domain
│   ├── relationship/        # Relationship Domain
│   └── shared/              # Domain 共享内核（Value Objects, Base Classes）
├── infrastructure/          # Infrastructure Layer（接口实现）
│   └── repositories/
├── events/                  # 事件总线
│   ├── bus.ts
│   └── types.ts
└── index.ts
```

### 1.5 apps/server 内部结构

```
apps/server/src/
├── presentation/            # Presentation Layer (API)
│   ├── controllers/
│   ├── middleware/
│   └── dto/
├── application/             # Application Layer
│   └── services/
├── domain/                  # Domain 引用（通过 packages/lifeos-core）
├── infrastructure/          # Infrastructure Layer
│   ├── database/
│   │   ├── migrations/
│   │   └── entities/
│   ├── repositories/
│   ├── llm/                 # LLM 接入
│   ├── cache/
│   └── queue/
└── main.ts
```

---

## 二、命名规范

### 2.1 文件名

| 类型 | 规范 | 示例 |
|------|------|------|
| **组件** | PascalCase | `LifeCard.vue` / `FeedList.vue` |
| **页面** | PascalCase | `HomePage.vue` / `ChatPage.vue` |
| **布局** | PascalCase | `DefaultLayout.vue` |
| **Engine** | PascalCase + Engine 后缀 | `EmotionEngine.ts` / `MemoryEngine.ts` |
| **Store** | camelCase + .store | `ui.store.ts` / `chat.store.ts` |
| **Composable** | camelCase + use 前缀 | `useEmotion.ts` / `useMemory.ts` |
| **Hook** | camelCase + use 前缀 | `useDebounce.ts` |
| **Service** | PascalCase + Service | `UserService.ts` |
| **Repository** | PascalCase + Repository | `MemoryRepository.ts` |
| **Entity** | PascalCase | `DigitalLife.ts` / `Memory.ts` |
| **DTO** | PascalCase + DTO 后缀 | `CreateFeedDTO.ts` |
| **Event** | PascalCase + Event 后缀 | `EmotionChangedEvent.ts` |
| **工具函数** | camelCase | `formatTime.ts` |
| **常量** | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| **类型** | PascalCase | `EmotionState` |
| **枚举** | PascalCase + 单数 | `EmotionType` |
| **测试文件** | 原名 + .test | `emotion-engine.test.ts` |

### 2.2 目录名

- 全小写，**kebab-case**
- 例如：`life-card/` / `emotion-engine/` / `user-profile/`

### 2.3 变量命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量/函数 | camelCase | `userName` / `getUserInfo()` |
| 常量 | UPPER_SNAKE_CASE | `DEFAULT_TIMEOUT` |
| 类 | PascalCase | `EmotionEngine` |
| 接口 | PascalCase（I 前缀可选） | `IEngine` / `EmotionState` |
| 类型别名 | PascalCase | `EmotionValue` |
| 枚举 | PascalCase（单数） | `BehaviorType` |
| Boolean 变量 | is/has/should/can 前缀 | `isActive` / `hasPermission` |
| 异步函数 | 动词开头 | `fetchUser()` / `loadData()` |
| 事件处理函数 | on 前缀 + 事件名 | `onClick()` / `onEmotionChange()` |

### 2.4 CSS 类名

- 使用 UnoCSS 原子类为主
- 自定义类名使用 **kebab-case**
- BEM 变体（可选）：`block__element--modifier`

---

## 三、Store 规范

### 3.1 基本原则

- **Store 只存 UI 状态**，不存业务状态（业务状态在 Domain 层）
- 使用 **Pinia**
- 使用 Composition API 风格（`defineStore` + setup 语法）

### 3.2 Store 分类

| 类型 | 位置 | 职责 | 示例 |
|------|------|------|------|
| **UI Store** | `stores/ui/` | 纯界面状态（弹窗开关、侧边栏收起） | `useUiStore` |
| **View Store** | `stores/view/` | 当前视图数据（页面展示用） | `useChatViewStore` |
| **App Store** | `stores/` | 应用级 UI 状态 | `useAppStore` |

### 3.3 命名规范

```typescript
// 定义
export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false)
  const toggleSidebar = () => { sidebarCollapsed.value = !sidebarCollapsed.value }
  return { sidebarCollapsed, toggleSidebar }
})

// 使用
const uiStore = useUiStore()
```

### 3.4 禁止事项

- ❌ 禁止在 Store 中写业务逻辑
- ❌ 禁止 Store 直接调用 API（通过 Application Service）
- ❌ 禁止跨 Store 直接调用（通过事件或组合式函数）

---

## 四、Composable 规范

### 4.1 分类

| 类型 | 位置 | 职责 | 示例 |
|------|------|------|------|
| **UI Composable** | `presentation/composables/` | 纯 UI 交互逻辑 | `useModal` / `useDrag` |
| **Application Composable** | `application/composables/` | 应用层逻辑编排 | `useDigitalLife` / `useFeed` |
| **Utility Composable** | 共享工具 | 通用工具逻辑 | `useDebounce` / `useLocalStorage` |

### 4.2 命名规范

- 统一 `use` 前缀
- 驼峰命名
- 返回响应式对象 + 方法

```typescript
export function useEmotion(digitalLifeId: string) {
  const emotionState = ref<EmotionState | null>(null)
  const isLoading = ref(false)

  const refresh = async () => {
    isLoading.value = true
    try {
      emotionState.value = await emotionAppService.getState(digitalLifeId)
    } finally {
      isLoading.value = false
    }
  }

  return { emotionState, isLoading, refresh }
}
```

### 4.3 规范

- 输入参数明确，返回值结构清晰
- 内部状态封装，外部只读（如需修改暴露方法）
- 支持 SSR（避免直接访问 `window` / `document`）
- 自动清理副作用（定时器、事件监听）

---

## 五、Engine 规范

### 5.1 统一生命周期接口

所有 Engine 必须实现 `IEngine` 接口：

```typescript
interface IEngine {
  init(config: EngineConfig): Promise<void>
  start(): Promise<void>
  update(deltaTime: number): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  destroy(): Promise<void>
  serialize(): Promise<SerializedState>
  deserialize(state: SerializedState): Promise<void>
  emit<T>(event: string, payload: T): void
}
```

### 5.2 Engine 结构

```typescript
export class EmotionEngine implements IEngine {
  private state: EmotionState
  private eventBus: EventBus

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus
  }

  async init(config: EmotionEngineConfig): Promise<void> { ... }
  async start(): Promise<void> { ... }
  async update(deltaTime: number): Promise<void> { ... }
  async pause(): Promise<void> { ... }
  async resume(): Promise<void> { ... }
  async destroy(): Promise<void> { ... }
  async serialize(): Promise<EmotionSerializedState> { ... }
  async deserialize(state: EmotionSerializedState): Promise<void> { ... }
  emit<T>(event: string, payload: T): void {
    this.eventBus.emit(`emotion.${event}`, payload)
  }
}
```

### 5.3 规范

- Engine 之间**禁止直接调用**，通过事件总线通信
- 所有状态变更必须发出事件
- `update` 方法幂等、可重复调用
- `serialize/deserialize` 保证完整状态可恢复
- 构造函数只注入依赖，不做初始化逻辑

---

## 六、API 规范

### 6.1 RESTful 风格

| 操作 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 列表 | GET | `/api/v1/{resources}` | 获取列表 |
| 详情 | GET | `/api/v1/{resources}/{id}` | 获取单个 |
| 创建 | POST | `/api/v1/{resources}` | 创建 |
| 更新 | PATCH | `/api/v1/{resources}/{id}` | 部分更新 |
| 替换 | PUT | `/api/v1/{resources}/{id}` | 全量替换 |
| 删除 | DELETE | `/api/v1/{resources}/{id}` | 删除 |

### 6.2 响应格式

```typescript
interface ApiResponse<T> {
  code: number          // 业务状态码（0 成功）
  data: T               // 响应数据
  message: string       // 提示信息
  timestamp: number     // 时间戳
  requestId: string     // 请求 ID
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
```

### 6.3 错误码

| 范围 | 类别 | 示例 |
|------|------|------|
| 0 | 成功 | 0: OK |
| 1000-1999 | 通用错误 | 1001: 参数错误 / 1002: 未认证 |
| 2000-2999 | 用户相关 | 2001: 用户不存在 |
| 3000-3999 | 数字生命相关 | 3001: 生命不存在 |
| 4000-4999 | 社区相关 | 4001: Feed 不存在 |
| 5000-5999 | 服务器错误 | 5000: 内部错误 |

### 6.4 前端调用

- 统一封装 `request` 工具
- 自动处理 Token、错误提示、Loading
- 通过 Application Service 调用，不直接在组件中调 API

---

## 七、DDD 规范

### 7.1 四层架构依赖方向

```
Presentation → Application → Domain ← Infrastructure
```

- **只能上层依赖下层**
- **Domain 不依赖任何外部框架**
- **Infrastructure 实现 Domain 的接口**（依赖倒置）

### 7.2 跨 Domain 通信

- 禁止直接 import 其他 Domain 的类
- 统一使用 **Domain Event**
- 事件总线是唯一通信通道

```typescript
// ❌ 禁止：直接调用其他 Domain
import { MemoryEngine } from '../memory/memory-engine'

// ✅ 正确：通过事件
this.eventBus.emit('memory.created', { ... })
```

### 7.3 领域事件命名

格式：`{domain}.{action}`

- 过去式：已发生的事 → `emotion.changed` / `memory.created`
- 现在式：正在进行的动作 → `behavior.triggering`
- 命令式：要求做某事 → `life.start` / `memory.compress`

### 7.4 聚合根

- DigitalLife 是 Digital Life 层的聚合根
- 外部只能通过聚合根访问子实体
- 聚合根保证内部一致性

---

## 八、测试规范

### 8.1 测试金字塔

```
    ▲
   /E2E\      少量（关键路径）
  /Integration\  中量（核心用例）
 /Unit_______\  大量（领域逻辑）
```

### 8.2 测试框架

- **单元测试**：Vitest
- **组件测试**：Vue Test Utils + Vitest
- **E2E 测试**：Playwright

### 8.3 测试文件位置

- 单元测试：与源文件同目录，`.test.ts` 后缀
- E2E 测试：`tests/e2e/` 目录

### 8.4 覆盖率要求

| 层级 | 行覆盖率要求 |
|------|------------|
| Domain 层 | ≥ 80% |
| Application 层 | ≥ 60% |
| Infrastructure 层 | ≥ 50% |
| Presentation 层 | 组件 ≥ 40% |

### 8.5 命名规范

```typescript
describe('EmotionEngine', () => {
  describe('init', () => {
    it('should initialize with default emotion state', () => { ... })
  })

  describe('update', () => {
    it('should decay emotion intensity over time', () => { ... })
  })
})
```

---

## 九、Git 规范

### 9.1 分支命名

```
main                  # 主分支，生产环境
develop               # 开发分支
feature/xxx           # 功能分支
fix/xxx               # 修复分支
hotfix/xxx            # 紧急修复
chore/xxx             # 杂项（配置、工具）
docs/xxx              # 文档
```

### 9.2 Commit Message

遵循 **Conventional Commits**：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 列表**：

| type | 说明 |
|------|------|
| feat | 新功能 |
| fix | Bug 修复 |
| docs | 文档 |
| style | 格式（不影响代码运行） |
| refactor | 重构 |
| perf | 性能优化 |
| test | 测试 |
| chore | 构建/工具/配置 |
| revert | 回滚 |

**示例**：
```
feat(emotion): add emotion decay mechanism

- Implement linear decay over time
- Add configurable decay rate per emotion type
- Add tests for decay behavior

Refs: #123
```

### 9.3 PR 规范

- 每个 PR 对应一个功能或修复
- PR 描述包含：背景、改动点、测试方法、截图（UI 相关）
- 至少 1 人 Review 后合并
- 合并后删除分支

---

## 十、依赖管理

### 10.1 包管理

- 使用 **pnpm**
- monorepo 工作空间

### 10.2 依赖分层

| 层级 | 可依赖 |
|------|--------|
| apps/lifeos-web | packages/lifeos-core, ui 相关 |
| apps/server | packages/lifeos-core, 后端相关 |
| packages/lifeos-core | 纯逻辑，尽量零依赖 |

### 10.3 新增依赖

- 新增依赖需评估：是否必要？是否可复用现有？
- 生产依赖与开发依赖严格区分
- 定期审计依赖安全

---

## 十一、性能规范

### 11.1 前端性能

- **Lazy Load**：路由级懒加载 + 组件级懒加载
- **虚拟滚动**：长列表必须使用虚拟滚动
- **Web Worker**：计算密集型逻辑放入 Worker
- **Tree Shaking**：确保未使用代码被摇掉
- **图片优化**：WebP 格式 + 懒加载 + 自适应尺寸
- **CDN**：静态资源走 CDN

### 11.2 后端性能

- 数据库索引：查询字段必须有索引
- 缓存：热点数据 Redis 缓存
- 异步：非实时操作走消息队列
- 连接池：数据库/Redis 连接池配置合理

---

## 十二、安全规范

### 12.1 前端安全

- 所有用户输入必须转义（防 XSS）
- Token 存储在 HttpOnly Cookie（优先）或 localStorage
- 敏感操作二次确认

### 12.2 后端安全

- 参数校验（Joi / Zod）
- SQL 注入防护（使用 ORM / 参数化查询）
- 速率限制（Rate Limiting）
- CORS 严格配置

---

## 十三、代码组织原则

1. **高内聚**：相关功能放在一起
2. **低耦合**：模块间依赖最小化
3. **单一职责**：每个模块/函数只做一件事
4. **开闭原则**：对扩展开放，对修改关闭
5. **依赖倒置**：依赖抽象不依赖具体
6. **优先组合**：Composition over Inheritance
7. **避免过早优化**：先正确再优化
8. **YAGNI**：不做暂时不需要的功能

---

**文档版本**: v1.0
**最后更新**: 2026-07-08
**维护者**: Chief Architect
