# 会员订阅系统设计（Subscription Domain）

> **版本**: v1.0
> **阶段**: Phase 6 — 商业化
> **状态**: 🟠 In Progress
> **最后更新**: 2026-07-08

---

## 一、Domain 定位

### 1.1 职责

Subscription Domain 负责会员订阅全生命周期管理：
- **订阅管理**：创建、续费、取消、恢复
- **权益管理**：权益定义、权益解锁、权益回收
- **等级管理**：Free / Pro / Creator 三层
- **计费管理**：月度/年度计费周期、自动续费

### 1.2 边界

| 属于 Subscription Domain | 不属于 |
|-------------------------|--------|
| 订阅状态管理 | 支付处理（Payment Gateway） |
| 权益定义与查询 | 钱包余额（Wallet Domain） |
| 订阅周期计算 | 虚拟货币（Wallet Domain） |
| 降级/过期处理 | 商品管理（Marketplace Domain） |

---

## 二、会员等级体系

### 2.1 等级定义

| 等级 | 标识 | 价格 | 核心定位 |
|------|------|------|---------|
| Free | `free` | ¥0 | 体验数字生命 |
| Pro | `pro` | ¥30/月 ¥288/年 | 深度互动 |
| Creator | `creator` | ¥100/月 ¥888/年 | 创作与变现 |

### 2.2 权益矩阵

| 权益项 | Free | Pro | Creator |
|--------|------|-----|---------|
| 每日互动次数 | 50 | 无限 | 无限 |
| AI 模型 | 基础 | 高级 | 高级 |
| 记忆容量 | 7 天 | 无限 | 无限 |
| 情绪系统 | 基础 | 完整 | 完整 |
| 数字生命数量 | 1 | 3 | 无限 |
| 自定义外观 | ❌ | ✅ | ✅ |
| Marketplace 购买 | ✅ | ✅ | ✅ |
| Marketplace 发布 | ❌ | ❌ | ✅ |
| 收益分成 | ❌ | ❌ | 70% |
| 创作者工具 | ❌ | ❌ | ✅ |
| 优先客服 | ❌ | ✅ | ✅ |
| 专属标识 | ❌ | Pro 徽章 | Creator 徽章 |

### 2.3 权益检查接口

```typescript
interface SubscriptionEngine {
  // === 订阅管理 ===
  subscribe(userId: string, plan: SubscriptionPlan, cycle: BillingCycle): Subscription;
  cancel(userId: string, reason?: string): void;
  resume(userId: string): void;
  upgrade(userId: string, newPlan: SubscriptionPlan): void;
  downgrade(userId: string, newPlan: SubscriptionPlan): void;

  // === 查询 ===
  getSubscription(userId: string): Subscription | null;
  getPlan(userId: string): SubscriptionPlan;
  getStatus(userId: string): SubscriptionStatus;

  // === 权益 ===
  hasEntitlement(userId: string, entitlement: string): boolean;
  getEntitlements(userId: string): Entitlement[];
  checkQuota(userId: string, resource: string): QuotaResult;

  // === 计费 ===
  getBillingCycle(userId: string): BillingInfo;
  processRenewal(userId: string): RenewalResult;
  processExpiry(userId: string): void;

  // === 事件 ===
  on(event: 'subscription.activated', handler: (s: Subscription) => void): void;
  on(event: 'subscription.expired', handler: (s: Subscription) => void): void;
  on(event: 'subscription.cancelled', handler: (s: Subscription) => void): void;
}
```

---

## 三、订阅生命周期

```
未订阅（Free）
    ↓ 订阅
活跃（Active）
    ├─ 自动续费成功 → 保持 Active
    ├─ 取消订阅 → 待过期（Pending Expiry）
    │   └─ 到期日 → 过期（Expired）→ 回到 Free
    ├─ 升级 → 立即生效，剩余时长折算
    └─ 降级 → 下个周期生效
```

### 3.1 续费机制

- **自动续费**：到期前 3 天扣款，扣款失败有 3 天宽限期
- **手动续费**：到期后 30 天内可恢复，超过 30 天降级
- **宽限期**：扣款失败后 3 天内保持权益，超期降级

---

## 四、配额管理

### 4.1 配额类型

| 配额 | Free | Pro | Creator | 重置周期 |
|------|------|-----|---------|---------|
| 每日互动 | 50 | ∞ | ∞ | 每日 0 点 |
| 记忆天数 | 7 | ∞ | ∞ | 不重置 |
| 数字生命数 | 1 | 3 | ∞ | 不重置 |
| Marketplace 发布 | 0 | 0 | 50/月 | 每月 |

### 4.2 配额检查流程

```
用户请求操作
    ↓
查询用户订阅等级
    ↓
查询对应配额
    ├─ 未超限 → 放行，计数 +1
    └─ 已超限 → 拒绝，提示升级
```

---

## 五、事件定义

### 5.1 发出的事件

| 事件名 | 负载 | 触发时机 |
|--------|------|---------|
| `subscription.activated` | `{ userId, plan, expireAt }` | 订阅激活 |
| `subscription.renewed` | `{ userId, plan, newExpireAt }` | 自动续费成功 |
| `subscription.expired` | `{ userId, previousPlan }` | 订阅过期 |
| `subscription.cancelled` | `{ userId, reason }` | 用户取消 |
| `subscription.upgraded` | `{ userId, from, to }` | 升级 |
| `subscription.downgraded` | `{ userId, from, to }` | 降级 |
| `quota.exceeded` | `{ userId, resource, limit }` | 配额超限 |

### 5.2 监听的事件

| 事件名 | 来源 | 反应 |
|--------|------|------|
| `wallet.charged` | Wallet | 检查是否为订阅付款 |
| `payment.subscription_charged` | Payment Gateway | 续费处理 |

---

## 相关文档

- [18-commercial-architecture.md](file:///workspace/docs/18-commercial-architecture.md) — 商业化总体架构
- [20-wallet-asset-domain.md](file:///workspace/docs/20-wallet-asset-domain.md) — 钱包与虚拟资产
- [21-marketplace-domain.md](file:///workspace/docs/21-marketplace-domain.md) — AI Marketplace
- [22-commercial-data-model.md](file:///workspace/docs/22-commercial-data-model.md) — 商业化数据模型
- [decision-log.md](file:///workspace/docs/decision-log.md) — ADR 决策记录
