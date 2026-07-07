# 钱包与虚拟资产系统设计（Wallet & Asset Domain）

> **版本**: v1.0
> **阶段**: Phase 6 — 商业化
> **状态**: 🟠 In Progress
> **最后更新**: 2026-07-08

---

## 一、Domain 定位

### 1.1 职责

Wallet & Asset Domain 是数字生命经济系统的**金融基础设施**：
- **Life Coin 管理**：充值、消费、转账、余额管理
- **Experience Point（XP）管理**：获取、累积、消耗
- **资产持有**：用户持有的数字资产（外观、能力、模板等）
- **交易记录**：所有资金流动的完整审计日志
- **创作者钱包**：收益分成、提现

### 1.2 边界

| 属于 Wallet Domain | 不属于 |
|-------------------|--------|
| 货币余额管理 | 订阅管理（Subscription Domain） |
| 充值/消费/转账 | 商品发布（Marketplace Domain） |
| 交易记录 | 物流/交付 |
| 资产持有记录 | 资产内容本身 |
| 创作者收益结算 | 创作者认证 |
| 提现申请 | 银行交互（Payment Gateway） |

---

## 二、双货币体系

### 2.1 Life Coin（付费货币）

```
真实货币（RMB/USD）
        ↓ 充值（Payment Gateway）
    Life Coin
        ↓ 消费
    ├── 礼物打赏
    ├── 外观购买
    ├── 能力解锁
    └── Marketplace 购买
```

| 属性 | 值 |
|------|-----|
| 获取 | 充值（1 元 = 10 LC） |
| 精度 | 整数（最小单位 1 LC） |
| 用途 | 全平台消费 |
| 可交易 | 用户间可赠送 |
| 可退款 | 未消费部分可退 |
| 过期 | 永不过期 |

### 2.2 Experience Point（成长积分）

```
用户行为
    ↓ 奖励
    XP
    ↓ 累积
    ├── 用户等级
    ├── 关系等级
    └── 免费内容解锁
```

| 属性 | 值 |
|------|-----|
| 获取 | 互动/签到/任务/被赞 |
| 精度 | 整数 |
| 用途 | 等级/解锁 |
| 可交易 | ❌ 不可转移 |
| 可购买 | ❌ 不可购买 |
| 过期 | 永不过期 |

### 2.3 XP 获取规则

| 行为 | XP 奖励 | 每日上限 |
|------|---------|---------|
| 每日签到 | 10 XP | 1 次 |
| 与数字生命对话 | 1 XP/条 | 20 XP |
| 发布社区动态 | 5 XP | 50 XP |
| 获得点赞 | 2 XP/个 | 50 XP |
| 完成成就 | 50~500 XP | 无限制 |
| 关系阶段提升 | 100 XP | 无限制 |

---

## 三、WalletEngine 接口

```typescript
interface WalletEngine {
  // === Life Coin ===
  getBalance(userId: string): CoinBalance;
  charge(userId: string, amount: number, payment: PaymentMethod): ChargeResult;
  spend(userId: string, amount: number, reason: SpendReason): SpendResult;
  transfer(from: string, to: string, amount: number, note?: string): TransferResult;
  refund(userId: string, transactionId: string): RefundResult;

  // === XP ===
  getXP(userId: string): XPBalance;
  earnXP(userId: string, amount: number, source: XPSource): void;
  spendXP(userId: string, amount: number, reason: string): boolean;
  getLevel(userId: string): UserLevel;

  // === 资产 ===
  getAssets(userId: string, filter?: AssetFilter): DigitalAsset[];
  addAsset(userId: string, asset: AssetInput): void;
  removeAsset(userId: string, assetId: string): void;
  hasAsset(userId: string, assetType: string, assetId: string): boolean;

  // === 创作者收益 ===
  getCreatorWallet(creatorId: string): CreatorWallet;
  requestWithdrawal(creatorId: string, amount: number): WithdrawalRequest;
  processWithdrawal(requestId: string, status: WithdrawalStatus): void;

  // === 交易记录 ===
  getTransactions(userId: string, filter?: TransactionFilter): Transaction[];
  getTransactionStats(userId: string, period: TimePeriod): TransactionStats;

  // === 事件 ===
  on(event: 'wallet.charged', handler: (t: Transaction) => void): void;
  on(event: 'wallet.spent', handler: (t: Transaction) => void): void;
  on(event: 'wallet.transferred', handler: (t: Transfer) => void): void;
  on(event: 'xp.earned', handler: (e: XPEarning) => void): void;
  on(event: 'asset.acquired', handler: (a: DigitalAsset) => void): void;
}
```

---

## 四、资产体系

### 4.1 资产类型

| 类型 | 标识 | 说明 | 来源 |
|------|------|------|------|
| 外观 | `appearance` | Live2D/VRM 模型、头像框 | 商店购买/活动奖励 |
| 能力 | `ability` | 特殊技能解锁 | 商店购买/等级解锁 |
| 模板 | `template` | 数字生命模板 | Marketplace 购买 |
| 插件 | `plugin` | 功能扩展 | Marketplace 购买 |
| 声音包 | `voice` | TTS 语音配置 | Marketplace 购买 |
| 特效 | `effect` | 互动特效 | 商店购买/活动奖励 |
| 徽章 | `badge` | 身份标识 | 成就解锁/订阅 |

### 4.2 资产属性

```typescript
interface DigitalAsset {
  id: string;
  userId: string;
  assetType: string;          // appearance/ability/template/...
  assetId: string;            // 资产内容 ID
  source: 'purchased' | 'rewarded' | 'unlocked' | 'gifted';
  acquiredAt: number;
  expiresAt?: number;         // 限时资产
  metadata: Record<string, unknown>;
}
```

---

## 五、交易类型

| 交易类型 | 方向 | 说明 |
|---------|------|------|
| `recharge` | 入账 | 充值 Life Coin |
| `spend` | 出账 | 消费 Life Coin |
| `transfer_in` | 入账 | 收到转账 |
| `transfer_out` | 出账 | 转出转账 |
| `refund` | 入账 | 退款 |
| `withdrawal` | 出账 | 创作者提现 |
| `creator_earning` | 入账 | 创作者收益 |
| `gift_received` | 入账 | 收到礼物 |
| `gift_sent` | 出账 | 送出礼物 |

---

## 六、创作者收益

### 6.1 收益来源

| 来源 | 分成比例 | 说明 |
|------|---------|------|
| Marketplace 销售 | 70% 创作者 / 30% 平台 | 数字生命模板/插件/外观 |
| 礼物打赏 | 70% 收件人 / 30% 平台 | 用户给创作者送礼物 |
| 推广分成 | 10% 推荐人 / 90% 平台 | 推荐新用户充值 |

### 6.2 提现规则

- 最低提现金额：¥100（1000 LC）
- 提现手续费：2%
- 提现周期：T+3 工作日
- 月度提现限制：4 次/月
- 税务：代扣代缴个税（按劳务报酬）

---

## 七、事件定义

### 7.1 发出的事件

| 事件名 | 负载 | 触发时机 |
|--------|------|---------|
| `wallet.charged` | `{ userId, amount, paymentId }` | 充值成功 |
| `wallet.spent` | `{ userId, amount, reason }` | 消费成功 |
| `wallet.transferred` | `{ from, to, amount }` | 转账成功 |
| `wallet.insufficient` | `{ userId, required, balance }` | 余额不足 |
| `xp.earned` | `{ userId, amount, source }` | 获得 XP |
| `xp.level_up` | `{ userId, newLevel }` | 等级提升 |
| `asset.acquired` | `{ userId, asset }` | 获得资产 |
| `creator.earning` | `{ creatorId, amount, source }` | 创作者收益 |
| `withdrawal.requested` | `{ creatorId, amount }` | 提现申请 |
| `withdrawal.processed` | `{ requestId, status }` | 提现处理完成 |

### 7.2 监听的事件

| 事件名 | 来源 | 反应 |
|--------|------|------|
| `subscription.activated` | Subscription | 记录订阅消费 |
| `marketplace.purchased` | Marketplace | 扣款 + 资产转移 + 创作者分成 |
| `payment.charged` | Payment Gateway | Life Coin 入账 |
| `community.gift_sent` | Community | 礼物扣款 + 转账 |

---

## 相关文档

- [18-commercial-architecture.md](file:///workspace/docs/18-commercial-architecture.md) — 商业化总体架构
- [19-subscription-domain.md](file:///workspace/docs/19-subscription-domain.md) — 会员订阅系统
- [21-marketplace-domain.md](file:///workspace/docs/21-marketplace-domain.md) — AI Marketplace
- [22-commercial-data-model.md](file:///workspace/docs/22-commercial-data-model.md) — 商业化数据模型
- [decision-log.md](file:///workspace/docs/decision-log.md) — ADR 决策记录
