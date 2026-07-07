# API 开放平台设计

> **版本**: v1.0
> **阶段**: Phase 7 — 开放生态
> **状态**: 🟠 In Progress
> **最后更新**: 2026-07-08

---

## 一、平台定位

### 1.1 核心目标

API 开放平台是 LifeOS 对外开放的统一入口，为第三方开发者提供：
- **标准化接口**：RESTful API + Webhook + SDK
- **安全认证**：API Key + OAuth 2.0 + 签名验证
- **流量管控**：限流 + 配额 + 熔断 + 降级
- **可观测性**：调用日志 + 监控告警 + 数据分析

### 1.2 API 分层

```
API 分层
├── L1: 工具类 API（Tool API）
│   └── 第三方通过 API 提供工具能力
│
├── L2: 数据类 API（Data API）
│   └── 第三方读取授权数据（只读）
│
├── L3: 交互类 API（Interaction API）
│   └── 第三方与数字生命交互
│
└── L4: 管理类 API（Management API）
    └── 第三方管理自己的应用 / 插件
```

---

## 二、API 网关架构

### 2.1 网关架构图

```
┌─────────────────────────────────────────────────────────┐
│                    第三方应用 / 插件                       │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────┐
│                    API Gateway（API 网关）                │
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  接入层   │  │  控制层   │  │  数据层   │              │
│  │          │  │          │  │          │              │
│  │ 协议解析  │  │ 认证鉴权  │  │ 限流熔断  │              │
│  │ 路由分发  │  │ 权限校验  │  │ 监控统计  │              │
│  │ 协议转换  │  │ 签名验证  │  │ 日志审计  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└────────────────────────────┬────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼──────┐  ┌──────────▼──────────┐  ┌────▼─────┐
│  Digital Life │  │    Plugin Runtime   │  │ Developer│
│    Core API   │  │       API           │  │   API    │
└──────────────┘  └─────────────────────┘  └──────────┘
```

### 2.2 网关核心能力

| 能力 | 说明 |
|------|------|
| **协议支持** | HTTP/HTTPS、WebSocket、SSE、gRPC（内部） |
| **认证方式** | API Key、OAuth 2.0、JWT、签名验证 |
| **路由策略** | 路径路由、版本路由、灰度路由、地域路由 |
| **限流策略** | 令牌桶、漏桶、并发数限制、IP 限流 |
| **熔断降级** | 错误率熔断、超时熔断、降级返回、缓存兜底 |
| **安全防护** | WAF、DDoS 防护、SQL 注入检测、XSS 防护 |
| **监控统计** | 调用量、延迟、错误率、P50/P95/P99 |
| **日志审计** | 全量请求日志、敏感数据脱敏、审计追溯 |

---

## 三、认证与授权

### 3.1 认证方式

#### 方式一：API Key（简单模式）

适用于服务端到服务端的调用，插件内部使用。

```
请求头：
X-API-Key: {api_key}
X-API-Secret: {api_secret}    // 部分接口需要
X-API-Sign: {signature}       // 高安全级别接口
```

**使用场景**：
- Tool 插件调用
- 服务端 API 调用
- 内部系统集成

#### 方式二：OAuth 2.0（用户授权模式）

适用于需要用户授权的场景，第三方应用代表用户操作。

```
授权流程：
1. 第三方应用引导用户到授权页
2. 用户登录并授权
3. 平台返回 Authorization Code
4. 第三方用 Code 换取 Access Token
5. 使用 Access Token 调用 API
```

**授权范围（Scope）**：

| Scope | 说明 |
|-------|------|
| `user:profile.read` | 读取用户基本信息 |
| `digital_life:read` | 读取数字生命基本信息 |
| `digital_life:chat` | 与数字生命聊天 |
| `digital_life:memory.read` | 读取记忆（需额外授权） |
| `plugin:manage` | 管理自己的插件 |
| `wallet:read` | 读取钱包余额 |

### 3.2 签名验证

对于高安全级别接口，使用 HMAC-SHA256 签名验证。

```
签名算法：
1. 将所有参数按字母序排序
2. 拼接成 query string 格式
3. 加上时间戳和随机数
4. 使用 API Secret 进行 HMAC-SHA256 签名
5. 将签名放入请求头 X-API-Sign

请求头：
X-API-Key: {api_key}
X-API-Timestamp: {unix_timestamp}
X-API-Nonce: {random_string}
X-API-Sign: {hmac_signature}
```

---

## 四、API 设计规范

### 4.1 RESTful 规范

**URL 设计**：
```
基础路径：
https://api.lifeos.ai/v1/

资源命名：
- 名词复数：/digital-lives，/conversations，/messages
- 层级结构：/digital-lives/{id}/memory，/conversations/{id}/messages
- 动作使用子资源：/digital-lives/{id}/chat
```

**HTTP 方法**：

| 方法 | 用途 | 幂等性 |
|------|------|--------|
| `GET` | 读取资源 | ✅ 幂等 |
| `POST` | 创建资源 / 执行操作 | ❌ 非幂等 |
| `PUT` | 全量更新资源 | ✅ 幂等 |
| `PATCH` | 部分更新资源 | ❌ 非幂等 |
| `DELETE` | 删除资源 | ✅ 幂等 |

### 4.2 统一响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": {
    // 业务数据
  },
  "request_id": "req_abc123",
  "timestamp": 1234567890
}
```

**错误码规范**：

| 码段 | 说明 | 示例 |
|------|------|------|
| 0 | 成功 | 0: success |
| 10000-19999 | 通用错误 | 10001: 参数错误, 10002: 未授权 |
| 20000-29999 | 认证错误 | 20001: API Key 无效, 20002: Token 过期 |
| 30000-39999 | 限流错误 | 30001: 调用频率超限, 30002: 配额不足 |
| 40000-49999 | 业务错误 | 40001: 资源不存在, 40002: 权限不足 |
| 50000-59999 | 系统错误 | 50001: 服务内部错误 |

### 4.3 分页规范

```
请求参数：
GET /v1/digital-lives?page=1&page_size=20

响应格式：
{
  "code": 0,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "page_size": 20,
    "total_pages": 5
  }
}
```

### 4.4 版本策略

```
版本策略：
├── URL 版本号：/v1/，/v2/
├── 向后兼容：小版本迭代不破坏兼容性
├── 版本升级：大版本升级提供过渡期
└── 废弃策略：提前 6 个月通知，提供迁移指南
```

---

## 五、核心 API 列表

### 5.1 Digital Life API

| API | 方法 | 说明 | 权限 |
|-----|------|------|------|
| `/v1/digital-lives` | GET | 获取数字生命列表 | digital_life:read |
| `/v1/digital-lives/{id}` | GET | 获取数字生命详情 | digital_life:read |
| `/v1/digital-lives/{id}/chat` | POST | 发送消息 | digital_life:chat |
| `/v1/digital-lives/{id}/conversations` | GET | 获取会话列表 | digital_life:read |
| `/v1/digital-lives/{id}/memory` | GET | 获取记忆 | digital_life:memory.read |
| `/v1/digital-lives/{id}/emotion` | GET | 获取情绪状态 | digital_life:read |

### 5.2 Plugin API

| API | 方法 | 说明 | 权限 |
|-----|------|------|------|
| `/v1/plugins` | GET | 获取插件列表 | plugin:manage |
| `/v1/plugins` | POST | 创建插件 | plugin:manage |
| `/v1/plugins/{id}` | GET | 获取插件详情 | plugin:manage |
| `/v1/plugins/{id}` | PATCH | 更新插件 | plugin:manage |
| `/v1/plugins/{id}/versions` | GET | 获取版本列表 | plugin:manage |
| `/v1/plugins/{id}/versions` | POST | 发布新版本 | plugin:manage |
| `/v1/plugins/{id}/submit` | POST | 提交审核 | plugin:manage |

### 5.3 Tool API（插件调用）

| API | 方法 | 说明 | 权限 |
|-----|------|------|------|
| `/v1/tools` | GET | 获取可用工具列表 | tool:read |
| `/v1/tools/{name}/invoke` | POST | 调用工具 | tool:invoke |

### 5.4 Developer API

| API | 方法 | 说明 | 权限 |
|-----|------|------|------|
| `/v1/developer/profile` | GET | 获取开发者信息 | developer:read |
| `/v1/developer/stats` | GET | 获取统计数据 | developer:read |
| `/v1/developer/revenue` | GET | 获取收益数据 | developer:read |
| `/v1/developer/api-keys` | GET | 获取 API Key 列表 | developer:manage |
| `/v1/developer/api-keys` | POST | 创建 API Key | developer:manage |
| `/v1/developer/api-keys/{id}` | DELETE | 撤销 API Key | developer:manage |

---

## 六、Webhook 事件

### 6.1 Webhook 机制

```
事件触发
    ↓
事件队列
    ↓
Webhook 推送
    ↓
（失败重试，最多 5 次，指数退避）
```

### 6.2 事件列表

| 事件 | 说明 | 触发时机 |
|------|------|---------|
| `digital_life.message.received` | 收到用户消息 | 用户发送消息时 |
| `digital_life.message.sent` | 发送消息 | 数字生命回复时 |
| `digital_life.emotion.changed` | 情绪变化 | 情绪状态改变时 |
| `digital_life.memory.created` | 新记忆生成 | 生成新记忆时 |
| `plugin.installed` | 插件被安装 | 用户安装插件时 |
| `plugin.uninstalled` | 插件被卸载 | 用户卸载插件时 |
| `plugin.updated` | 插件更新 | 插件版本更新时 |
| `plugin.crashed` | 插件崩溃 | 插件运行崩溃时 |
| `developer.revenue.generated` | 收益产生 | 有新的收益时 |
| `developer.review.approved` | 审核通过 | 插件审核通过时 |
| `developer.review.rejected` | 审核拒绝 | 插件审核拒绝时 |

### 6.3 Webhook 签名验证

```
Webhook 请求头：
X-LifeOS-Event: {event_name}
X-LifeOS-Delivery: {delivery_id}
X-LifeOS-Signature: {signature}
X-LifeOS-Timestamp: {timestamp}

签名算法：
HMAC-SHA256(webhook_secret, timestamp + "." + body)
```

---

## 七、限流与配额

### 7.1 限流策略

| 维度 | 说明 | 默认值 |
|------|------|--------|
| **QPS 限制** | 每秒请求数 | 100 / API Key |
| **QPM 限制** | 每分钟请求数 | 500 / API Key |
| **QPD 限制** | 每天请求数 | 10,000 / API Key |
| **并发限制** | 同时处理的请求数 | 50 / API Key |
| **IP 限流** | 单 IP 限制 | 1,000 / 分钟 |

> 更高等级开发者可获得更高配额。

### 7.2 配额管理

```
配额类型
├── 免费配额
│   └── L1 开发者：1,000 次/天
├── 基础配额
│   └── L2 开发者：10,000 次/天
├── 进阶配额
│   └── L3 开发者：100,000 次/天
├── 高级配额
│   └── L4 创作者：500,000 次/天
└── 定制配额
    └── L5 顶级：按需定制
```

### 7.3 熔断与降级

```
熔断策略：
├── 错误率 > 50% 持续 1 分钟 → 熔断 5 分钟
├── 错误率 > 30% 持续 5 分钟 → 熔断 2 分钟
├── 超时率 > 30% 持续 1 分钟 → 熔断 2 分钟
└── 半开状态：放行 10% 流量探测

降级策略：
├── 返回缓存数据（如有）
├── 返回默认值
├── 返回部分数据
└── 优雅失败（友好错误提示）
```

---

## 八、SDK 设计

### 8.1 SDK 架构

```
SDK 架构
├── Core Layer（核心层）
│   ├── HTTP Client
│   ├── 认证管理
│   ├── 签名验证
│   ├── 错误处理
│   └── 重试逻辑
├── API Layer（API 层）
│   ├── DigitalLifeClient
│   ├── PluginClient
│   ├── DeveloperClient
│   └── ToolClient
├── Plugin Framework（插件框架）
│   ├── ToolPlugin 基类
│   ├── SkillPlugin 基类
│   ├── 生命周期钩子
│   └── 上下文管理
└── Utils（工具函数）
    ├── 参数校验
    ├── 类型定义
    └── 日志
```

### 8.2 SDK 代码示例（TypeScript）

```typescript
// 初始化客户端
import { LifeOSClient } from '@lifeos/sdk'

const client = new LifeOSClient({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  baseUrl: 'https://api.lifeos.ai/v1',
})

// 调用数字生命 API
const digitalLife = await client.digitalLife.get('dl_abc123')
console.log(digitalLife.name, digitalLife.emotion)

// 发送消息
const response = await client.digitalLife.chat('dl_abc123', {
  message: '你好！',
  conversationId: 'conv_xyz789',
})
console.log(response.reply)

// 插件开发
import { ToolPlugin } from '@lifeos/sdk'

class WeatherPlugin extends ToolPlugin {
  async getWeather(params: { city: string }) {
    // 调用天气 API
    return { temperature: 25, condition: 'sunny' }
  }
}

const plugin = new WeatherPlugin({
  id: 'weather-plugin',
  name: '天气查询',
})

plugin.start()
```

---

## 九、安全与合规

### 9.1 数据安全

| 措施 | 说明 |
|------|------|
| **传输加密** | 全站 HTTPS / TLS 1.3 |
| **存储加密** | 敏感数据加密存储（AES-256） |
| **数据脱敏** | 日志中敏感信息脱敏 |
| **数据隔离** | 不同开发者数据完全隔离 |
| **访问控制** | 最小权限原则 |

### 9.2 合规要求

- **个人信息保护**：符合《个人信息保护法》
- **数据跨境**：数据存储在境内，跨境需合规
- **审计日志**：所有 API 调用可追溯
- **用户授权**：用户数据访问需明确授权
- **数据删除**：支持用户数据删除权（被遗忘权）

---

## 相关文档

- [23-open-ecosystem-architecture.md](file:///workspace/docs/23-open-ecosystem-architecture.md) — 开放生态总体架构
- [24-plugin-domain.md](file:///workspace/docs/24-plugin-domain.md) — Plugin Domain
- [25-developer-platform.md](file:///workspace/docs/25-developer-platform.md) — 开发者平台
- [27-digital-life-protocol.md](file:///workspace/docs/27-digital-life-protocol.md) — Digital Life Protocol
- [28-ecosystem-data-model.md](file:///workspace/docs/28-ecosystem-data-model.md) — 开放生态数据模型
- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构总览
- [decision-log.md](file:///workspace/docs/decision-log.md) — ADR 决策记录
