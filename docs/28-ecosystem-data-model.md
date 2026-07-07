# 开放生态数据模型设计

> **版本**: v1.0
> **阶段**: Phase 7 — 开放生态
> **状态**: 🟠 In Progress
> **最后更新**: 2026-07-08

---

## 一、设计原则

- 遵循 ADR-007 数据库统一字段规范
- 开发者与插件数据独立存储，与用户数据隔离
- 插件版本管理支持灰度发布与回滚
- 调用日志与审计日志分表存储，便于扩展
- 收益结算数据高一致性，使用事务保障

### 表清单

| 表名 | Domain | 说明 |
|------|--------|------|
| `developers` | Developer | 开发者账号 |
| `developer_verifications` | Developer | 开发者认证记录 |
| `api_keys` | Developer | API Key 管理 |
| `plugins` | Plugin | 插件基本信息 |
| `plugin_versions` | Plugin | 插件版本 |
| `plugin_installations` | Plugin | 插件安装记录 |
| `plugin_reviews` | Plugin | 插件评价 |
| `plugin_permissions` | Plugin | 插件权限声明 |
| `plugin_call_logs` | Plugin | 插件调用日志 |
| `plugin_crash_reports` | Plugin | 插件崩溃报告 |
| `developer_revenue` | Developer | 开发者收益记录 |
| `developer_stats` | Developer | 开发者统计数据 |
| `oauth_apps` | API Platform | OAuth 应用 |
| `oauth_tokens` | API Platform | OAuth Token |
| `api_rate_limits` | API Platform | API 限流配置 |
| `webhook_endpoints` | API Platform | Webhook 端点 |
| `webhook_deliveries` | API Platform | Webhook 投递记录 |
| `audit_logs` | Developer | 审计日志 |

---

## 二、开发者相关表

### 2.1 开发者表（developers）

```sql
CREATE TABLE developers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID UNIQUE REFERENCES users(id),

    -- 开发者信息
    display_name        VARCHAR(64) NOT NULL,
    avatar_url          VARCHAR(255),
    bio                 TEXT,
    website             VARCHAR(255),
    company             VARCHAR(128),
    location            VARCHAR(128),

    -- 开发者等级
    level               VARCHAR(16) NOT NULL DEFAULT 'new',
    -- new / advanced / verified / creator / elite

    -- 认证状态
    verification_status VARCHAR(16) NOT NULL DEFAULT 'unverified',
    -- unverified / pending / verified / rejected

    -- 账户类型
    account_type        VARCHAR(16) NOT NULL DEFAULT 'personal',
    -- personal / enterprise / brand

    -- 联系方式
    contact_email       VARCHAR(128),
    contact_phone       VARCHAR(32),

    -- 状态
    status              VARCHAR(16) NOT NULL DEFAULT 'active',
    -- active / suspended / banned / deleted

    -- 统计（冗余字段，定时更新）
    total_plugins       INTEGER NOT NULL DEFAULT 0,
    total_installs      INTEGER NOT NULL DEFAULT 0,
    total_revenue       DECIMAL(12,2) NOT NULL DEFAULT 0,
    average_rating      DECIMAL(3,2),

    -- 元数据
    metadata            JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_dev_level CHECK (level IN ('new', 'advanced', 'verified', 'creator', 'elite')),
    CONSTRAINT chk_verification_status CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    CONSTRAINT chk_account_type CHECK (account_type IN ('personal', 'enterprise', 'brand')),
    CONSTRAINT chk_dev_status CHECK (status IN ('active', 'suspended', 'banned', 'deleted'))
);

CREATE INDEX idx_developers_user ON developers (user_id);
CREATE INDEX idx_developers_level ON developers (level);
CREATE INDEX idx_developers_status ON developers (status) WHERE status = 'active';
```

### 2.2 开发者认证表（developer_verifications）

```sql
CREATE TABLE developer_verifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id        UUID NOT NULL REFERENCES developers(id),

    -- 认证类型
    verification_type   VARCHAR(32) NOT NULL,
    -- personal_id / enterprise / brand / creator

    -- 认证材料
    documents           JSONB NOT NULL,

    -- 审核
    reviewer_id         UUID,
    review_comment      TEXT,
    reviewed_at         TIMESTAMPTZ,

    -- 状态
    status              VARCHAR(16) NOT NULL DEFAULT 'pending',
    -- pending / approved / rejected / expired

    -- 有效期
    valid_from          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until         TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_verification_type CHECK (verification_type IN ('personal_id', 'enterprise', 'brand', 'creator')),
    CONSTRAINT chk_verif_status CHECK (status IN ('pending', 'approved', 'rejected', 'expired'))
);

CREATE INDEX idx_dev_verif_dev ON developer_verifications (developer_id);
CREATE INDEX idx_dev_verif_status ON developer_verifications (status);
```

### 2.3 API Key 表（api_keys）

```sql
CREATE TABLE api_keys (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id        UUID NOT NULL REFERENCES developers(id),

    -- Key 信息
    name                VARCHAR(64) NOT NULL,
    key_prefix          VARCHAR(16) NOT NULL,   -- 用于展示，如 "sk_abc1..."
    key_hash            VARCHAR(255) NOT NULL,  -- 哈希后的完整 key
    key_secret_hash     VARCHAR(255),           -- 哈希后的 secret（高权限用）

    -- 权限范围
    scopes              TEXT[] NOT NULL DEFAULT '{}',

    -- 限流配置（覆盖默认）
    rate_limit_qpd      INTEGER,                -- 每天请求数

    -- 状态
    status              VARCHAR(16) NOT NULL DEFAULT 'active',
    -- active / revoked / expired

    -- 有效期
    expires_at          TIMESTAMPTZ,
    last_used_at        TIMESTAMPTZ,

    -- 统计
    total_calls         BIGINT NOT NULL DEFAULT 0,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_apikey_status CHECK (status IN ('active', 'revoked', 'expired'))
);

CREATE INDEX idx_api_keys_developer ON api_keys (developer_id);
CREATE INDEX idx_api_keys_status ON api_keys (status) WHERE status = 'active';
CREATE UNIQUE INDEX idx_api_keys_key_hash ON api_keys (key_hash);
```

---

## 三、插件相关表

### 3.1 插件表（plugins）

```sql
CREATE TABLE plugins (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id        UUID NOT NULL REFERENCES developers(id),

    -- 基本信息
    plugin_id           VARCHAR(128) NOT NULL UNIQUE,  -- 域名式 ID，如 com.example.weather
    name                VARCHAR(64) NOT NULL,
    description         VARCHAR(255) NOT NULL,
    long_description    TEXT,

    -- 类型
    type                VARCHAR(16) NOT NULL,  -- tool / skill / life
    category            VARCHAR(32) NOT NULL,

    -- 媒体资源
    icon_url            VARCHAR(255),
    banner_url          VARCHAR(255),
    screenshots         TEXT[] DEFAULT '{}',

    -- 标签
    tags                VARCHAR(32)[] DEFAULT '{}',

    -- 当前版本（冗余，便于查询）
    current_version     VARCHAR(32),
    current_version_id  UUID REFERENCES plugin_versions(id),

    -- 定价
    pricing_model       VARCHAR(16) NOT NULL DEFAULT 'free',
    -- free / one_time / subscription / usage / freemium
    price               DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_currency      VARCHAR(8) NOT NULL DEFAULT 'CNY',

    -- 状态
    status              VARCHAR(24) NOT NULL DEFAULT 'draft',
    -- draft / pending_review / rejected / published / unpublished / taken_down

    -- 审核信息
    last_reviewed_at    TIMESTAMPTZ,
    last_reviewer_id    UUID,
    review_comment      TEXT,

    -- 统计（冗余，定时更新）
    total_installs      INTEGER NOT NULL DEFAULT 0,
    total_reviews       INTEGER NOT NULL DEFAULT 0,
    average_rating      DECIMAL(3,2),
    total_revenue       DECIMAL(12,2) NOT NULL DEFAULT 0,

    -- 元数据
    metadata            JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at        TIMESTAMPTZ,

    CONSTRAINT chk_plugin_type CHECK (type IN ('tool', 'skill', 'life')),
    CONSTRAINT chk_pricing_model CHECK (pricing_model IN ('free', 'one_time', 'subscription', 'usage', 'freemium')),
    CONSTRAINT chk_plugin_status CHECK (status IN ('draft', 'pending_review', 'rejected', 'published', 'unpublished', 'taken_down'))
);

CREATE INDEX idx_plugins_developer ON plugins (developer_id);
CREATE INDEX idx_plugins_type ON plugins (type);
CREATE INDEX idx_plugins_status ON plugins (status) WHERE status = 'published';
CREATE INDEX idx_plugins_category ON plugins (category);
CREATE INDEX idx_plugins_rating ON plugins (average_rating DESC) WHERE status = 'published';
CREATE INDEX idx_plugins_installs ON plugins (total_installs DESC) WHERE status = 'published';
CREATE INDEX idx_plugins_tags ON plugins USING GIN (tags);
```

### 3.2 插件版本表（plugin_versions）

```sql
CREATE TABLE plugin_versions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_id           UUID NOT NULL REFERENCES plugins(id),

    -- 版本信息
    version             VARCHAR(32) NOT NULL,   -- SemVer: 1.0.0
    version_code        INTEGER NOT NULL,       -- 数字版本号，用于比较
    changelog           TEXT,
    release_notes       TEXT,

    -- Manifest
    manifest            JSONB NOT NULL,

    -- 包信息
    package_url         VARCHAR(255),
    package_size        BIGINT,                 -- 字节
    package_hash        VARCHAR(64),            -- SHA-256

    -- 签名
    signature           VARCHAR(255),           -- 开发者签名
    platform_signature  VARCHAR(255),           -- 平台签名（审核通过后）

    -- 依赖的最低平台版本
    min_platform_version VARCHAR(32) NOT NULL DEFAULT '1.0.0',

    -- 状态
    status              VARCHAR(24) NOT NULL DEFAULT 'draft',
    -- draft / pending_review / rejected / published / deprecated

    -- 灰度发布
    is_rollout          BOOLEAN NOT NULL DEFAULT FALSE,
    rollout_percentage  INTEGER NOT NULL DEFAULT 100,  -- 0-100
    rollout_seed        INTEGER,

    -- 审核
    reviewer_id         UUID,
    review_comment      TEXT,
    reviewed_at         TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at        TIMESTAMPTZ,

    CONSTRAINT chk_pv_status CHECK (status IN ('draft', 'pending_review', 'rejected', 'published', 'deprecated')),
    UNIQUE(plugin_id, version)
);

CREATE INDEX idx_plugin_versions_plugin ON plugin_versions (plugin_id);
CREATE INDEX idx_plugin_versions_status ON plugin_versions (status);
CREATE INDEX idx_plugin_versions_version ON plugin_versions (plugin_id, version_code DESC);
```

### 3.3 插件安装表（plugin_installations）

```sql
CREATE TABLE plugin_installations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    plugin_id           UUID NOT NULL REFERENCES plugins(id),
    plugin_version_id   UUID NOT NULL REFERENCES plugin_versions(id),

    -- 安装来源
    source              VARCHAR(16) NOT NULL DEFAULT 'marketplace',
    -- marketplace / direct_link / developer_install / sideload

    -- 用户授权的权限（可能少于插件声明的）
    granted_permissions TEXT[] NOT NULL DEFAULT '{}',

    -- 用户配置
    user_config         JSONB,

    -- 状态
    status              VARCHAR(16) NOT NULL DEFAULT 'active',
    -- active / disabled / uninstalled

    -- 时间
    installed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uninstalled_at      TIMESTAMPTZ,

    -- 最后使用时间
    last_used_at        TIMESTAMPTZ,

    CONSTRAINT chk_install_status CHECK (status IN ('active', 'disabled', 'uninstalled')),
    UNIQUE(user_id, plugin_id)
);

CREATE INDEX idx_plugin_installs_user ON plugin_installations (user_id);
CREATE INDEX idx_plugin_installs_plugin ON plugin_installations (plugin_id);
CREATE INDEX idx_plugin_installs_status ON plugin_installations (status) WHERE status = 'active';
```

### 3.4 插件评价表（plugin_reviews）

```sql
CREATE TABLE plugin_reviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    plugin_id           UUID NOT NULL REFERENCES plugins(id),

    -- 评分与内容
    rating              SMALLINT NOT NULL,    -- 1-5
    title               VARCHAR(128),
    content             TEXT,

    -- 有用票数
    helpful_count       INTEGER NOT NULL DEFAULT 0,

    -- 状态
    status              VARCHAR(16) NOT NULL DEFAULT 'published',
    -- published / hidden / removed

    -- 开发者回复
    developer_reply     TEXT,
    developer_replied_at TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_review_status CHECK (status IN ('published', 'hidden', 'removed')),
    UNIQUE(user_id, plugin_id)
);

CREATE INDEX idx_plugin_reviews_plugin ON plugin_reviews (plugin_id);
CREATE INDEX idx_plugin_reviews_user ON plugin_reviews (user_id);
CREATE INDEX idx_plugin_reviews_status ON plugin_reviews (status) WHERE status = 'published';
```

---

## 四、运行时与日志表

### 4.1 插件调用日志表（plugin_call_logs）

```sql
-- 按月分表，这里是基表结构
CREATE TABLE plugin_call_logs (
    id                  BIGSERIAL PRIMARY KEY,
    call_id             VARCHAR(64) NOT NULL UNIQUE,

    -- 调用方
    user_id             UUID,
    digital_life_id     UUID,
    plugin_id           UUID NOT NULL REFERENCES plugins(id),
    plugin_version_id   UUID NOT NULL REFERENCES plugin_versions(id),

    -- 调用信息
    tool_name           VARCHAR(64),
    skill_id            VARCHAR(64),

    -- 性能
    duration_ms         INTEGER NOT NULL,     -- 执行时长（毫秒）
    queue_time_ms       INTEGER,              -- 排队时间

    -- 结果
    status              VARCHAR(16) NOT NULL, -- success / error / timeout / rate_limited
    error_code          VARCHAR(32),
    error_message       TEXT,

    -- 请求参数（脱敏）
    input_snippet       VARCHAR(512),
    output_snippet      VARCHAR(512),

    -- 资源使用
    cpu_usage_ms        INTEGER,
    memory_usage_kb     INTEGER,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_call_status CHECK (status IN ('success', 'error', 'timeout', 'rate_limited'))
);

CREATE INDEX idx_call_logs_plugin ON plugin_call_logs (plugin_id, created_at DESC);
CREATE INDEX idx_call_logs_user ON plugin_call_logs (user_id, created_at DESC);
CREATE INDEX idx_call_logs_dl ON plugin_call_logs (digital_life_id, created_at DESC);
CREATE INDEX idx_call_logs_created ON plugin_call_logs (created_at DESC);
CREATE INDEX idx_call_logs_status ON plugin_call_logs (status, created_at DESC);
```

> 注：调用日志按月分表（plugin_call_logs_202607 等），使用 PostgreSQL 分区表。

### 4.2 插件崩溃报告表（plugin_crash_reports）

```sql
CREATE TABLE plugin_crash_reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_id           UUID NOT NULL REFERENCES plugins(id),
    plugin_version_id   UUID NOT NULL REFERENCES plugin_versions(id),

    -- 崩溃信息
    error_type          VARCHAR(64) NOT NULL,
    error_message       TEXT NOT NULL,
    stack_trace         TEXT,

    -- 上下文
    user_id             UUID,
    digital_life_id     UUID,
    environment         JSONB,

    -- 处理状态
    status              VARCHAR(16) NOT NULL DEFAULT 'new',
    -- new / investigating / fixed / ignored / wont_fix
    assignee_id         UUID,
    resolution_note     TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_crash_status CHECK (status IN ('new', 'investigating', 'fixed', 'ignored', 'wont_fix'))
);

CREATE INDEX idx_crash_reports_plugin ON plugin_crash_reports (plugin_id);
CREATE INDEX idx_crash_reports_status ON plugin_crash_reports (status);
CREATE INDEX idx_crash_reports_created ON plugin_crash_reports (created_at DESC);
```

---

## 五、收益相关表

### 5.1 开发者收益表（developer_revenue）

```sql
CREATE TABLE developer_revenue (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id        UUID NOT NULL REFERENCES developers(id),

    -- 收益来源
    source_type         VARCHAR(32) NOT NULL,
    -- plugin_sale / subscription / usage / gift / referral
    source_id           UUID,                   -- 关联的订单/交易 ID

    -- 金额
    gross_amount        DECIMAL(12,2) NOT NULL, -- 总收入
    platform_fee        DECIMAL(12,2) NOT NULL, -- 平台分成
    net_amount          DECIMAL(12,2) NOT NULL, -- 开发者实际收入
    currency            VARCHAR(8) NOT NULL DEFAULT 'CNY',

    -- 关联插件
    plugin_id           UUID REFERENCES plugins(id),

    -- 结算周期
    settlement_period   VARCHAR(16),            -- 2026-07 等
    is_settled          BOOLEAN NOT NULL DEFAULT FALSE,
    settled_at          TIMESTAMPTZ,

    -- 状态
    status              VARCHAR(16) NOT NULL DEFAULT 'pending',
    -- pending / available / withheld / refunded

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_source_type CHECK (source_type IN ('plugin_sale', 'subscription', 'usage', 'gift', 'referral')),
    CONSTRAINT chk_rev_status CHECK (status IN ('pending', 'available', 'withheld', 'refunded'))
);

CREATE INDEX idx_dev_revenue_dev ON developer_revenue (developer_id);
CREATE INDEX idx_dev_revenue_settlement ON developer_revenue (settlement_period);
CREATE INDEX idx_dev_revenue_status ON developer_revenue (status);
CREATE INDEX idx_dev_revenue_plugin ON developer_revenue (plugin_id);
```

### 5.2 提现表（withdrawals）

```sql
-- 注：此处的 withdrawals 是开发者提现，与用户钱包提现区分开
CREATE TABLE developer_withdrawals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id        UUID NOT NULL REFERENCES developers(id),

    -- 金额
    amount              DECIMAL(12,2) NOT NULL,
    fee                 DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_amount          DECIMAL(12,2) NOT NULL,
    currency            VARCHAR(8) NOT NULL DEFAULT 'CNY',

    -- 收款方式
    payment_method      VARCHAR(32) NOT NULL,
    -- alipay / wechat / bank_transfer
    payment_account     VARCHAR(255) NOT NULL,
    payee_name          VARCHAR(64) NOT NULL,

    -- 状态
    status              VARCHAR(24) NOT NULL DEFAULT 'pending',
    -- pending / reviewing / approved / processing / completed / failed / cancelled

    -- 审核
    reviewer_id         UUID,
    review_comment      TEXT,
    reviewed_at         TIMESTAMPTZ,

    -- 打款
    transaction_id      VARCHAR(128),
    completed_at        TIMESTAMPTZ,
    failure_reason      TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_withdraw_status CHECK (status IN ('pending', 'reviewing', 'approved', 'processing', 'completed', 'failed', 'cancelled'))
);

CREATE INDEX idx_dev_withdrawals_dev ON developer_withdrawals (developer_id);
CREATE INDEX idx_dev_withdrawals_status ON developer_withdrawals (status);
CREATE INDEX idx_dev_withdrawals_created ON developer_withdrawals (created_at DESC);
```

---

## 六、API 平台相关表

### 6.1 OAuth 应用表（oauth_apps）

```sql
CREATE TABLE oauth_apps (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id        UUID NOT NULL REFERENCES developers(id),

    -- 应用信息
    name                VARCHAR(64) NOT NULL,
    description         TEXT,
    homepage_url        VARCHAR(255),
    icon_url            VARCHAR(255),

    -- OAuth 配置
    client_id           VARCHAR(64) NOT NULL UNIQUE,
    client_secret_hash  VARCHAR(255) NOT NULL,
    redirect_uris       TEXT[] NOT NULL DEFAULT '{}',

    -- 权限范围
    default_scopes      TEXT[] NOT NULL DEFAULT '{}',

    -- 类型
    app_type            VARCHAR(16) NOT NULL DEFAULT 'web',
    -- web / mobile / desktop / service

    -- 状态
    status              VARCHAR(16) NOT NULL DEFAULT 'active',
    -- active / suspended / revoked

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_app_type CHECK (app_type IN ('web', 'mobile', 'desktop', 'service')),
    CONSTRAINT chk_oauth_status CHECK (status IN ('active', 'suspended', 'revoked'))
);

CREATE INDEX idx_oauth_apps_developer ON oauth_apps (developer_id);
CREATE UNIQUE INDEX idx_oauth_apps_client_id ON oauth_apps (client_id);
```

### 6.2 OAuth Token 表（oauth_tokens）

```sql
CREATE TABLE oauth_tokens (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id              UUID NOT NULL REFERENCES oauth_apps(id),
    user_id             UUID NOT NULL REFERENCES users(id),

    -- Token
    access_token_hash   VARCHAR(255) NOT NULL UNIQUE,
    refresh_token_hash  VARCHAR(255) UNIQUE,
    token_type          VARCHAR(16) NOT NULL DEFAULT 'bearer',

    -- 权限范围
    scopes              TEXT[] NOT NULL DEFAULT '{}',

    -- 时间
    issued_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMPTZ NOT NULL,
    revoked_at          TIMESTAMPTZ,

    -- 状态
    status              VARCHAR(16) NOT NULL DEFAULT 'active',
    -- active / expired / revoked

    CONSTRAINT chk_token_status CHECK (status IN ('active', 'expired', 'revoked'))
);

CREATE INDEX idx_oauth_tokens_user ON oauth_tokens (user_id);
CREATE INDEX idx_oauth_tokens_app ON oauth_tokens (app_id);
CREATE INDEX idx_oauth_tokens_expires ON oauth_tokens (expires_at) WHERE status = 'active';
```

### 6.3 Webhook 端点表（webhook_endpoints）

```sql
CREATE TABLE webhook_endpoints (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id        UUID NOT NULL REFERENCES developers(id),

    -- 端点配置
    url                 VARCHAR(512) NOT NULL,
    description         VARCHAR(255),
    secret_hash         VARCHAR(255) NOT NULL,

    -- 订阅的事件
    events              VARCHAR(64)[] NOT NULL DEFAULT '{}',

    -- 状态
    status              VARCHAR(16) NOT NULL DEFAULT 'active',
    -- active / paused / disabled / failed

    -- 健康状态
    last_delivery_at    TIMESTAMPTZ,
    last_success_at     TIMESTAMPTZ,
    last_failure_at     TIMESTAMPTZ,
    failure_count       INTEGER NOT NULL DEFAULT 0,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_webhook_status CHECK (status IN ('active', 'paused', 'disabled', 'failed'))
);

CREATE INDEX idx_webhook_endpoints_dev ON webhook_endpoints (developer_id);
CREATE INDEX idx_webhook_endpoints_status ON webhook_endpoints (status);
```

---

## 七、审计日志表

### 7.1 审计日志表（audit_logs）

```sql
CREATE TABLE audit_logs (
    id                  BIGSERIAL PRIMARY KEY,

    -- 操作主体
    actor_type          VARCHAR(16) NOT NULL,  -- user / developer / system / admin
    actor_id            UUID,
    actor_ip            INET,

    -- 操作类型
    action              VARCHAR(64) NOT NULL,
    resource_type       VARCHAR(32) NOT NULL,
    resource_id         UUID,

    -- 详细信息
    description         TEXT,
    before_state        JSONB,
    after_state         JSONB,

    -- 结果
    result              VARCHAR(16) NOT NULL DEFAULT 'success',
    -- success / failed / denied
    failure_reason      VARCHAR(255),

    -- 请求信息
    request_id          VARCHAR(64),
    user_agent          VARCHAR(512),

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_actor_type CHECK (actor_type IN ('user', 'developer', 'system', 'admin')),
    CONSTRAINT chk_audit_result CHECK (result IN ('success', 'failed', 'denied'))
);

CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_type, actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs (resource_type, resource_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs (action, created_at DESC);
CREATE INDEX idx_audit_logs_created ON audit_logs (created_at DESC);
```

> 注：审计日志按季度分表，永不删除，只归档。

---

## 八、ER 关系概览

```
developers (1) ── (N) plugins
   │                  │
   │                  ├── (N) plugin_versions
   │                  ├── (N) plugin_installations ← (1) users
   │                  └── (N) plugin_reviews ← (1) users
   │
   ├── (N) api_keys
   ├── (N) developer_revenue
   ├── (N) developer_withdrawals
   ├── (N) oauth_apps
   │       └── (N) oauth_tokens ← (1) users
   └── (N) webhook_endpoints

plugin_call_logs → plugins / plugin_versions / users / digital_lives
plugin_crash_reports → plugins / plugin_versions
audit_logs → 所有资源
```

---

## 相关文档

- [23-open-ecosystem-architecture.md](file:///workspace/docs/23-open-ecosystem-architecture.md) — 开放生态总体架构
- [24-plugin-domain.md](file:///workspace/docs/24-plugin-domain.md) — Plugin Domain
- [25-developer-platform.md](file:///workspace/docs/25-developer-platform.md) — 开发者平台
- [26-api-platform-design.md](file:///workspace/docs/26-api-platform-design.md) — API 开放平台
- [27-digital-life-protocol.md](file:///workspace/docs/27-digital-life-protocol.md) — Digital Life Protocol
- [22-commercial-data-model.md](file:///workspace/docs/22-commercial-data-model.md) — 商业化数据模型
- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构总览
- [decision-log.md](file:///workspace/docs/decision-log.md) — ADR 决策记录
