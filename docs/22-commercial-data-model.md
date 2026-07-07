# 商业化数据模型设计

> **版本**: v1.0
> **阶段**: Phase 6 — 商业化
> **状态**: 🟠 In Progress
> **最后更新**: 2026-07-08

---

## 一、设计原则

- 遵循 ADR-007 数据库统一字段规范
- 交易数据高一致性要求，使用 PostgreSQL 事务
- 余额操作使用乐观锁（version 字段）防止并发问题
- 交易记录只追加，不修改（append-only）

### 表清单

| 表名 | Domain | 说明 |
|------|--------|------|
| `subscriptions` | Subscription | 用户订阅记录 |
| `subscription_plans` | Subscription | 订阅计划定义 |
| `wallets` | Wallet | 用户钱包（Life Coin + XP） |
| `wallet_transactions` | Wallet | 钱包交易记录 |
| `digital_assets` | Wallet | 用户持有的数字资产 |
| `products` | Marketplace | Marketplace 商品 |
| `product_reviews` | Marketplace | 商品评价 |
| `purchases` | Marketplace | 购买记录 |
| `creator_earnings` | Marketplace | 创作者收益记录 |
| `withdrawals` | Wallet | 提现记录 |

---

## 二、核心表设计

### 2.1 订阅计划表（subscription_plans）

```sql
CREATE TABLE subscription_plans (
    id              VARCHAR(16) PRIMARY KEY,       -- free / pro / creator
    name            VARCHAR(32) NOT NULL,
    display_name    VARCHAR(64) NOT NULL,
    description     TEXT,
    
    -- 价格（分）
    price_monthly   INTEGER NOT NULL DEFAULT 0,    -- 月价格（分），0 = 免费
    price_yearly    INTEGER NOT NULL DEFAULT 0,    -- 年价格（分）
    
    -- 权益配置
    entitlements    JSONB NOT NULL DEFAULT '{}',   -- 权益 JSON
    
    -- 状态
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.2 用户订阅表（subscriptions）

```sql
CREATE TABLE subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE,          -- 一个用户只有一个活跃订阅
    
    plan_id         VARCHAR(16) NOT NULL REFERENCES subscription_plans(id),
    billing_cycle   VARCHAR(8) NOT NULL,           -- monthly / yearly
    
    -- 时间
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end   TIMESTAMPTZ NOT NULL,
    expire_at       TIMESTAMPTZ NOT NULL,
    cancelled_at    TIMESTAMPTZ,
    
    -- 状态
    status          VARCHAR(16) NOT NULL DEFAULT 'active', -- active/pending_expiry/expired/cancelled
    
    -- 自动续费
    auto_renew      BOOLEAN NOT NULL DEFAULT TRUE,
    renewal_payment_method_id UUID,
    
    -- 元数据
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_billing_cycle CHECK (billing_cycle IN ('monthly', 'yearly')),
    CONSTRAINT chk_sub_status CHECK (status IN ('active', 'pending_expiry', 'expired', 'cancelled', 'grace_period'))
);

CREATE INDEX idx_subscriptions_user ON subscriptions (user_id);
CREATE INDEX idx_subscriptions_expire ON subscriptions (expire_at) WHERE status = 'active';
```

### 2.3 钱包表（wallets）

```sql
CREATE TABLE wallets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE,
    
    -- Life Coin 余额
    lc_balance      INTEGER NOT NULL DEFAULT 0,    -- Life Coin 余额
    lc_locked       INTEGER NOT NULL DEFAULT 0,    -- 冻结的 Life Coin（进行中的交易）
    
    -- XP
    xp_total        INTEGER NOT NULL DEFAULT 0,    -- 累计 XP
    xp_available    INTEGER NOT NULL DEFAULT 0,    -- 可用 XP
    
    -- 创作者收益（待结算）
    creator_pending INTEGER NOT NULL DEFAULT 0,    -- 待结算收益（LC）
    creator_withdrawable INTEGER NOT NULL DEFAULT 0, -- 可提现收益（LC）
    creator_withdrawn   INTEGER NOT NULL DEFAULT 0, -- 已提现收益（LC）
    
    -- 乐观锁
    version         INTEGER NOT NULL DEFAULT 0,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 余额变更必须使用乐观锁
-- UPDATE wallets SET lc_balance = lc_balance - 100, version = version + 1
--   WHERE user_id = ? AND version = ? AND lc_balance >= 100
```

### 2.4 钱包交易记录表（wallet_transactions）

```sql
CREATE TABLE wallet_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    wallet_id       UUID NOT NULL REFERENCES wallets(id),
    
    -- 交易类型
    transaction_type VARCHAR(20) NOT NULL,         -- recharge/spend/transfer_in/transfer_out/refund/withdrawal/creator_earning/gift_received/gift_sent
    
    -- 金额
    amount          INTEGER NOT NULL,              -- 正数入账，负数出账
    currency        VARCHAR(8) NOT NULL DEFAULT 'LC', -- LC / XP
    
    -- 关联
    related_user_id UUID,                          -- 转账对方
    related_transaction_id UUID,                   -- 关联交易（如退款关联原交易）
    product_id      UUID,                          -- 关联商品
    subscription_id UUID,                          -- 关联订阅
    
    -- 描述
    description     VARCHAR(255),
    reason          VARCHAR(64),                   -- 消费原因分类
    metadata        JSONB,
    
    -- 余额快照
    balance_after   INTEGER,                       -- 交易后余额
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallet_tx_user_time ON wallet_transactions (user_id, created_at DESC);
CREATE INDEX idx_wallet_tx_type ON wallet_transactions (user_id, transaction_type, created_at DESC);
```

### 2.5 数字资产表（digital_assets）

```sql
CREATE TABLE digital_assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    
    asset_type      VARCHAR(16) NOT NULL,          -- appearance/ability/template/plugin/voice/effect/badge
    asset_id        VARCHAR(128) NOT NULL,         -- 资产内容 ID
    
    -- 来源
    source          VARCHAR(16) NOT NULL,          -- purchased/rewarded/unlocked/gifted
    source_id       UUID,                          -- 购买记录 ID / 活动ID
    
    -- 时间
    acquired_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,                   -- 限时资产过期时间
    
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE (user_id, asset_type, asset_id)
);

CREATE INDEX idx_digital_assets_user ON digital_assets (user_id, asset_type);
CREATE INDEX idx_digital_assets_expiry ON digital_assets (expires_at) WHERE expires_at IS NOT NULL;
```

### 2.6 Marketplace 商品表（products）

```sql
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id      UUID NOT NULL,
    
    -- 商品信息
    title           VARCHAR(128) NOT NULL,
    description     TEXT NOT NULL,
    product_type    VARCHAR(16) NOT NULL,          -- digital_life/personality/appearance/plugin/voice/effect
    category        VARCHAR(32) NOT NULL,
    tags            VARCHAR(64)[] DEFAULT '{}',
    
    -- 定价
    price           INTEGER NOT NULL,              -- Life Coin
    is_free         BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- 内容
    content_ref     VARCHAR(256) NOT NULL,         -- 资源存储路径
    
    -- 预览
    cover_image     VARCHAR(256),
    preview_video   VARCHAR(256),
    demo_url        VARCHAR(256),
    
    -- 状态
    status          VARCHAR(16) NOT NULL DEFAULT 'draft', -- draft/under_review/listed/delisted
    
    -- 统计（冗余，定期更新）
    sales_count     INTEGER NOT NULL DEFAULT 0,
    view_count      INTEGER NOT NULL DEFAULT 0,
    rating_avg      DECIMAL(3,2) NOT NULL DEFAULT 0,
    rating_count    INTEGER NOT NULL DEFAULT 0,
    
    -- 审核
    submitted_at    TIMESTAMPTZ,
    reviewed_at     TIMESTAMPTZ,
    reviewed_by     UUID,
    review_note     TEXT,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_product_type CHECK (product_type IN ('digital_life', 'personality', 'appearance', 'plugin', 'voice', 'effect')),
    CONSTRAINT chk_product_status CHECK (status IN ('draft', 'under_review', 'listed', 'delisted', 'rejected'))
);

CREATE INDEX idx_products_creator ON products (creator_id, status);
CREATE INDEX idx_products_type ON products (product_type, status, sales_count DESC);
CREATE INDEX idx_products_tags ON products USING GIN (tags);
```

### 2.7 购买记录表（purchases）

```sql
CREATE TABLE purchases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id        UUID NOT NULL,
    product_id      UUID NOT NULL REFERENCES products(id),
    
    -- 交易信息
    price           INTEGER NOT NULL,              -- 购买时价格（LC）
    platform_fee    INTEGER NOT NULL,              -- 平台分成（LC）
    creator_earning INTEGER NOT NULL,              -- 创作者收益（LC）
    
    -- 交易ID
    transaction_id  UUID NOT NULL REFERENCES wallet_transactions(id),
    
    -- 状态
    status          VARCHAR(16) NOT NULL DEFAULT 'completed', -- completed/refunded
    
    refunded_at     TIMESTAMPTZ,
    refund_reason   TEXT,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_purchase_status CHECK (status IN ('completed', 'refunded', 'refunding'))
);

CREATE INDEX idx_purchases_buyer ON purchases (buyer_id, created_at DESC);
CREATE INDEX idx_purchases_product ON purchases (product_id, created_at DESC);
```

### 2.8 创作者收益表（creator_earnings）

```sql
CREATE TABLE creator_earnings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id      UUID NOT NULL,
    
    source          VARCHAR(16) NOT NULL,          -- marketplace/gift/promotion
    source_id       UUID,                          -- 购买ID/礼物ID
    
    -- 金额
    gross_amount    INTEGER NOT NULL,              -- 总额（LC）
    platform_fee    INTEGER NOT NULL,              -- 平台分成（LC）
    net_amount      INTEGER NOT NULL,              -- 净收益（LC）
    
    -- 状态
    status          VARCHAR(16) NOT NULL DEFAULT 'pending', -- pending/available/withdrawn/deducted
    available_at    TIMESTAMPTZ NOT NULL,          -- 可提现时间（T+7）
    
    -- 退款扣除
    deducted_at     TIMESTAMPTZ,
    deduction_reason TEXT,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_earning_status CHECK (status IN ('pending', 'available', 'withdrawn', 'deducted'))
);

CREATE INDEX idx_creator_earnings_creator ON creator_earnings (creator_id, status, created_at DESC);
CREATE INDEX idx_creator_earnings_available ON creator_earnings (creator_id, status, available_at)
    WHERE status = 'pending';
```

### 2.9 提现记录表（withdrawals）

```sql
CREATE TABLE withdrawals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id      UUID NOT NULL,
    
    amount          INTEGER NOT NULL,              -- 提现金额（LC）
    amount_cny      DECIMAL(10,2) NOT NULL,        -- 折算人民币
    fee             DECIMAL(10,2) NOT NULL,        -- 手续费
    net_amount      DECIMAL(10,2) NOT NULL,        -- 实际到账
    
    -- 收款信息
    payment_method  VARCHAR(32) NOT NULL,          -- alipay/wechat/bank
    payment_account VARCHAR(128) NOT NULL,         -- 收款账号
    
    -- 状态
    status          VARCHAR(16) NOT NULL DEFAULT 'pending', -- pending/processing/completed/rejected
    
    -- 审核
    reviewed_by     UUID,
    reviewed_at     TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    reject_reason   TEXT,
    
    -- 关联
    earning_ids     UUID[] DEFAULT '{}',           -- 关联的收益记录
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_withdrawal_status CHECK (status IN ('pending', 'processing', 'completed', 'rejected'))
);

CREATE INDEX idx_withdrawals_creator ON withdrawals (creator_id, status, created_at DESC);
```

### 2.10 商品评价表（product_reviews）

```sql
CREATE TABLE product_reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL,
    
    rating          INTEGER NOT NULL,              -- 1~5
    content         TEXT,
    
    -- 互动
    helpful_count   INTEGER NOT NULL DEFAULT 0,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE (product_id, user_id),
    CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5)
);

CREATE INDEX idx_reviews_product ON product_reviews (product_id, created_at DESC);
CREATE INDEX idx_reviews_user ON product_reviews (user_id);
```

---

## 三、数据一致性保障

### 3.1 余额操作 — 乐观锁

```sql
-- 消费 Life Coin（原子操作）
UPDATE wallets 
SET lc_balance = lc_balance - :amount,
    version = version + 1,
    updated_at = NOW()
WHERE user_id = :userId 
  AND version = :expectedVersion 
  AND lc_balance >= :amount;
-- 如果 affected_rows = 0，说明余额不足或并发冲突
```

### 3.2 交易+扣款 — 事务

```sql
BEGIN;
  -- 1. 扣款（乐观锁）
  UPDATE wallets SET lc_balance = lc_balance - 100, version = version + 1
    WHERE user_id = ? AND version = ? AND lc_balance >= 100;
  
  -- 2. 记录交易
  INSERT INTO wallet_transactions (user_id, transaction_type, amount, ...)
    VALUES (?, 'spend', -100, ...);
  
  -- 3. 添加资产
  INSERT INTO digital_assets (user_id, asset_type, asset_id, source, ...)
    VALUES (?, 'appearance', ?, 'purchased', ...);
  
  -- 4. 创作者收益
  INSERT INTO creator_earnings (creator_id, source, gross_amount, platform_fee, net_amount, ...)
    VALUES (?, 'marketplace', 100, 30, 70, ...);
  
  -- 5. 更新创作者钱包
  UPDATE wallets SET creator_pending = creator_pending + 70, version = version + 1
    WHERE user_id = ?;
COMMIT;
```

---

## 相关文档

- [18-commercial-architecture.md](file:///workspace/docs/18-commercial-architecture.md) — 商业化总体架构
- [19-subscription-domain.md](file:///workspace/docs/19-subscription-domain.md) — 会员订阅系统
- [20-wallet-asset-domain.md](file:///workspace/docs/20-wallet-asset-domain.md) — 钱包与虚拟资产
- [21-marketplace-domain.md](file:///workspace/docs/21-marketplace-domain.md) — AI Marketplace
- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构总览
- [decision-log.md](file:///workspace/docs/decision-log.md) — ADR 决策记录
