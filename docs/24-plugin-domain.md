# Plugin Domain 详细设计

> **版本**: v1.0
> **阶段**: Phase 7 — 开放生态
> **状态**: 🟠 In Progress
> **最后更新**: 2026-07-08

---

## 一、Domain 定位

### 1.1 核心职责

Plugin Domain 是开放生态的运行时核心，负责：
- 插件的加载、卸载、升级管理
- 插件沙箱运行与资源隔离
- 权限控制与安全审计
- 插件生命周期管理
- MCP 协议兼容与转换
- 插件事件分发与调用路由

### 1.2 边界定义

```
Plugin Domain 负责：
├── 插件清单（Manifest）解析与校验
├── 插件沙箱（Sandbox）运行时
├── 权限控制（Permission）
├── 插件生命周期管理
├── MCP 协议适配
└── 插件调用路由与事件分发

Plugin Domain 不负责：
├── 开发者注册与认证（Developer Platform）
├── 插件上架与审核（Marketplace）
├── 收益结算与分成（Wallet）
├── 用户订阅与权益（Subscription）
└── 数字生命核心逻辑（DigitalLife Domain）
```

---

## 二、插件类型体系

### 2.1 类型层级

```
Plugin（插件）
├── Tool Plugin（工具插件）
│   ├── Local Tool（本地工具）
│   ├── Remote Tool（远程服务）
│   └── MCP Tool（MCP 兼容）
├── Skill Plugin（技能插件）
│   ├── Knowledge Skill（知识型）
│   ├── Behavior Skill（行为型）
│   └── Composite Skill（组合型）
└── Life Plugin（数字生命插件）
    ├── Full Life（完整数字生命）
    ├── Life Extension（生命扩展包）
    └── Life Template（生命模板）
```

### 2.2 各类型对比

| 维度 | Tool Plugin | Skill Plugin | Life Plugin |
|------|-------------|-------------|-------------|
| **核心能力** | 提供工具调用 | 注入专业技能 | 完整数字生命 |
| **权限等级** | L0 / L1 | L1 / L2 / L3 | L3 / L4 |
| **运行方式** | 按需调用 | 会话常驻 | 生命实例级 |
| **数据隔离** | 完全隔离 | 会话级隔离 | 实例级隔离 |
| **状态持久化** | 无 | 会话级 | 实例级 |
| **审核等级** | 基础审核 | 严格审核 | 最严审核 |
| **兼容协议** | MCP + LifeOS | LifeOS Protocol | LifeOS Protocol |

---

## 三、插件清单（Manifest）

### 3.1 Manifest 结构

```typescript
interface PluginManifest {
  // 基础信息
  id: string                    // 插件唯一 ID
  name: string                  // 插件名称
  version: string               // 版本号（SemVer）
  type: 'tool' | 'skill' | 'life'  // 插件类型
  description: string           // 描述
  author: {
    id: string
    name: string
    email?: string
  }
  license: string               // 许可证
  homepage?: string             // 主页

  // 权限声明
  permissions: PermissionDeclaration[]

  // 依赖声明
  dependencies?: {
    tools?: string[]            // 依赖的 Tool 插件
    skills?: string[]           // 依赖的 Skill 插件
    minPlatformVersion?: string // 最低平台版本
  }

  // 入口定义
  entry: {
    main: string                // 主入口文件
    type: 'local' | 'remote' | 'mcp'  // 运行类型
    mcpServerUrl?: string       // MCP Server 地址（MCP 类型）
    remoteEndpoint?: string     // 远程服务地址（Remote 类型）
  }

  // Tool 插件专属
  tools?: ToolDefinition[]

  // Skill 插件专属
  skill?: SkillDefinition

  // Life 插件专属
  life?: LifeDefinition

  // 元数据
  metadata: {
    categories: string[]        // 分类标签
    tags: string[]              // 关键词
    icon?: string               // 图标
    screenshots?: string[]      // 截图
    supportedLocales: string[]  // 支持语言
  }
}
```

### 3.2 权限声明

```typescript
interface PermissionDeclaration {
  scope: string                 // 权限范围
  reason: string                // 申请理由
  level: 'read' | 'write' | 'admin'  // 权限级别
  required: boolean             // 是否必须
}
```

**权限范围列表**：

| Scope | 说明 | 等级 |
|-------|------|------|
| `context:read` | 读取当前对话上下文 | read |
| `plugin:state` | 读写插件自身状态 | read / write |
| `tool:invoke` | 调用其他 Tool 插件 | read |
| `digital_life:emotion` | 读取/影响情绪状态 | read / write |
| `digital_life:memory` | 访问记忆系统 | read / write |
| `network:external` | 访问外部网络（域名白名单） | read |
| `user:profile` | 读取用户基本信息 | read |
| `notification:send` | 发送通知 | write |

---

## 四、沙箱运行时

### 4.1 沙箱架构

```
┌─────────────────────────────────────────────────────────┐
│                  Plugin Host（插件宿主）                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │           Plugin Sandbox（插件沙箱）             │    │
│  │  ┌─────────────────────────────────────────┐    │    │
│  │  │          Plugin Code（插件代码）          │    │    │
│  │  └─────────────────────────────────────────┘    │    │
│  │  ┌─────────────────────────────────────────┐    │    │
│  │  │       Secure API Proxy（安全 API 代理）   │    │    │
│  │  └─────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │       Permission Engine（权限引擎）              │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │       Resource Monitor（资源监控）               │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 4.2 隔离机制

| 隔离维度 | 实现方式 | 说明 |
|---------|---------|------|
| **进程隔离** | Worker / Child Process / VM | 每个插件独立运行环境 |
| **内存隔离** | 独立内存空间 | 插件无法直接访问宿主内存 |
| **API 隔离** | Secure Proxy | 只能调用授权的 API |
| **网络隔离** | 域名白名单 | 只能访问声明的外部域名 |
| **文件隔离** | 虚拟文件系统 | 只能访问插件自身目录 |
| **数据隔离** | 独立 KV 存储 | 插件数据独立存储 |

### 4.3 资源限制

```typescript
interface ResourceLimits {
  // CPU
  cpuLimit: number             // CPU 使用率上限（%）
  cpuBurst?: number            // 突发 CPU 上限

  // 内存
  memoryLimit: string          // 内存上限（如 "128MB"）
  memorySoftLimit?: string     // 内存软限制

  // 调用
  maxCallsPerMinute: number    // 每分钟最大调用次数
  maxCallsPerHour: number      // 每小时最大调用次数
  maxCallsPerDay: number       // 每天最大调用次数

  // 执行时长
  maxExecutionTime: number     // 单次最大执行时长（ms）
  maxQueueSize: number         // 最大排队任务数

  // 存储
  maxStorageSize: string       // 最大存储空间（如 "10MB"）
}
```

---

## 五、插件生命周期

### 5.1 生命周期状态

```
              安装
               ↓
┌─── 安装失败 ──── 已安装 ──── 卸载 ──── 已卸载 ───┐
│                     ↓                            │
│                   启用                            │
│                     ↓                            │
│  启动失败 ──── 已启用 ──── 停用 ──── 已停用 ───  │
│                     ↓                            │
│                   加载                            │
│                     ↓                            │
│  加载失败 ──── 已加载 ──── 卸载 ──── 已卸载 ───  │
│                     ↓                            │
│                   初始化                          │
│                     ↓                            │
│                运行中 ←─── 暂停 ─── 已暂停       │
│                     ↓                            │
│                   错误                            │
│                     ↓                            │
└──────────── 崩溃 / 终止 ────────────────────────┘
```

### 5.2 生命周期钩子

```typescript
interface PluginLifecycle {
  // 安装阶段
  onInstall?(): Promise<void>          // 安装时
  onUninstall?(): Promise<void>        // 卸载前

  // 加载阶段
  onLoad?(): Promise<void>             // 加载时
  onUnload?(): Promise<void>           // 卸载前

  // 运行阶段
  onStart?(): Promise<void>            // 启动时
  onPause?(): Promise<void>            // 暂停时
  onResume?(): Promise<void>           // 恢复时
  onStop?(): Promise<void>             // 停止时

  // 升级阶段
  onUpgrade?(fromVersion: string): Promise<void>  // 升级时
  onDowngrade?(fromVersion: string): Promise<void> // 降级时

  // 错误处理
  onError?(error: Error): Promise<void>  // 发生错误时
}
```

---

## 六、调用流程

### 6.1 Tool 调用流程

```
数字生命发起 Tool 调用
        ↓
Tool Use 决策层（LLM 决定调用哪个工具）
        ↓
Plugin Router（插件路由器）
        ↓
Permission Check（权限检查）
        ↓
Rate Limit Check（限流检查）
        ↓
Plugin Sandbox（插件沙箱）
        ↓
Tool Execution（工具执行）
        ↓
Result Validation（结果校验）
        ↓
返回给数字生命
```

### 6.2 Skill 激活流程

```
用户对话输入
        ↓
意图识别 / 话题检测
        ↓
Skill Matcher（技能匹配）
        ↓
匹配到相关 Skill？
        ├─ 是 → Skill 激活
        │        ↓
        │   Permission Check（权限检查）
        │        ↓
        │   Skill Sandbox Load（加载 Skill 沙箱）
        │        ↓
        │   Skill Context Injection（注入上下文）
        │        ↓
        │   Skill Interaction（技能交互）
        │        ↓
        │   Skill Deactivation（技能退出）
        └─ 否 → 正常对话流程
```

---

## 七、MCP 兼容层

### 7.1 架构定位

```
┌─────────────────────────────────────────────────────────┐
│              LifeOS Plugin Runtime                       │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │         LifeOS Plugin API（原生 API）             │    │
│  └─────────────────────────────────────────────────┘    │
│                            ↑                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │           MCP Adapter（MCP 适配层）              │    │
│  │  ┌─────────────────────────────────────────┐    │    │
│  │  │       MCP Protocol Handler             │    │    │
│  │  │  (Tools / Resources / Prompts)         │    │    │
│  │  └─────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────┘    │
│                            ↑                              │
└────────────────────────────┼─────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
    外部 MCP Server              LifeOS 原生插件
```

### 7.2 兼容范围

| MCP 能力 | 支持状态 | 说明 |
|---------|---------|------|
| **Tools** | ✅ 完全支持 | MCP Tool → LifeOS Tool Plugin |
| **Resources** | ✅ 完全支持 | MCP Resource → 只读数据源 |
| **Prompts** | ✅ 完全支持 | MCP Prompt → Skill 模板 |
| **Sampling** | ⚠️ 有限支持 | 需额外权限申请 |
| **Roots** | ❌ 不支持 | 安全考虑，不开放文件系统 |
| **Transport** | ⚠️ 部分支持 | 支持 HTTP/SSE，不支持 stdio |

---

## 八、事件系统

### 8.1 插件事件

```typescript
// 插件发出的事件
interface PluginEvents {
  // 生命周期事件
  'plugin:installed': { pluginId: string; version: string }
  'plugin:uninstalled': { pluginId: string }
  'plugin:started': { pluginId: string; instanceId: string }
  'plugin:stopped': { pluginId: string; instanceId: string }
  'plugin:crashed': { pluginId: string; instanceId: string; error: string }

  // 调用事件
  'plugin:call:start': { pluginId: string; toolName: string; callId: string }
  'plugin:call:end': { pluginId: string; toolName: string; callId: string; duration: number }
  'plugin:call:error': { pluginId: string; toolName: string; callId: string; error: string }

  // 自定义事件
  'plugin:custom': { pluginId: string; eventName: string; data: any }
}
```

### 8.2 插件可订阅的平台事件

| 事件 | 所需权限 | 说明 |
|------|---------|------|
| `message:received` | context:read | 收到用户消息 |
| `message:sent` | context:read | 发送消息给用户 |
| `emotion:changed` | digital_life:emotion | 情绪状态变化 |
| `memory:created` | digital_life:memory | 新记忆生成 |
| `user:online` | user:profile | 用户上线 |
| `user:offline` | user:profile | 用户下线 |

---

## 九、错误处理与容错

### 9.1 错误分级

| 级别 | 说明 | 处理策略 |
|------|------|---------|
| **Info** | 正常运行信息 | 记录日志 |
| **Warning** | 潜在问题 | 告警 + 监控 |
| **Error** | 插件功能异常 | 重试 + 降级 |
| **Critical** | 影响系统稳定 | 隔离 + 熔断 |
| **Fatal** | 安全风险 | 立即终止 + 告警 |

### 9.2 容错机制

```
容错机制
├── 重试机制
│   ├── 指数退避重试
│   ├── 最大重试次数
│   └── 幂等性保证
├── 熔断机制
│   ├── 错误率阈值
│   ├── 熔断时长
│   └── 半开探测
├── 降级机制
│   ├── 功能降级
│   ├── 缓存兜底
│   └── 默认值返回
├── 隔离机制
│   ├── 进程隔离
│   ├── 资源隔离
│   └── 故障隔离
└── 自愈机制
    ├── 自动重启
    ├── 自动回滚
    └── 健康检查
```

---

## 十、监控与可观测性

### 10.1 监控指标

| 类别 | 指标 |
|------|------|
| **性能** | 调用延迟、吞吐量、错误率、P50/P95/P99 |
| **资源** | CPU 使用率、内存使用、存储使用、网络 IO |
| **业务** | 调用次数、活跃插件数、安装量、卸载量 |
| **安全** | 权限拒绝次数、异常检测、安全事件数 |

### 10.2 日志与审计

```
日志体系
├── 调用日志（每一次插件调用）
│   ├── 调用时间
│   ├── 插件 ID
│   ├── 调用参数（脱敏）
│   ├── 返回结果（脱敏）
│   ├── 执行时长
│   └── 调用结果
├── 运行日志（插件运行状态）
│   ├── 生命周期事件
│   ├── 资源使用
│   └── 错误与异常
├── 审计日志（安全相关操作）
│   ├── 权限变更
│   ├── 敏感操作
│   └── 安全事件
└── 开发者日志（插件输出）
    ├── stdout / stderr
    └── 自定义日志（分级）
```

---

## 相关文档

- [23-open-ecosystem-architecture.md](file:///workspace/docs/23-open-ecosystem-architecture.md) — 开放生态总体架构
- [25-developer-platform.md](file:///workspace/docs/25-developer-platform.md) — 开发者平台
- [26-api-platform-design.md](file:///workspace/docs/26-api-platform-design.md) — API 开放平台
- [27-digital-life-protocol.md](file:///workspace/docs/27-digital-life-protocol.md) — Digital Life Protocol
- [28-ecosystem-data-model.md](file:///workspace/docs/28-ecosystem-data-model.md) — 开放生态数据模型
- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构总览
- [decision-log.md](file:///workspace/docs/decision-log.md) — ADR 决策记录
