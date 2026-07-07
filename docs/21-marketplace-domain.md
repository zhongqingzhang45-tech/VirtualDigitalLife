# AI Marketplace 设计（Marketplace Domain）

> **版本**: v1.0
> **阶段**: Phase 6 — 商业化
> **状态**: 🟠 In Progress
> **最后更新**: 2026-07-08

---

## 一、Domain 定位

### 1.1 职责

Marketplace Domain 是数字生命经济系统的**交易市场**：
- **商品管理**：发布、审核、上架、下架
- **交易撮合**：购买、交付、退款
- **分成结算**：创作者收益计算与分配
- **评价系统**：评分、评论、排行榜
- **搜索发现**：分类、标签、推荐

### 1.2 定位

> 类似：游戏角色 + AI Agent + 虚拟偶像的交易平台。

Marketplace 交易的核心单元是 **Digital Life Package**——一个包含人格、记忆、技能、外观、声音的完整数字生命资产包。

---

## 二、商品体系

### 2.1 商品类型

| 类型 | 标识 | 说明 | 价格范围 |
|------|------|------|---------|
| **完整数字生命** | `digital_life` | 包含人格+技能+外观+声音 | 500~5000 LC |
| **人格模板** | `personality` | 仅人格设定 | 100~500 LC |
| **外观资源** | `appearance` | Live2D/VRM/Spine 模型 | 200~2000 LC |
| **插件** | `plugin` | 功能扩展 | 100~1000 LC |
| **声音包** | `voice` | TTS 语音配置 | 100~300 LC |
| **特效** | `effect` | 互动特效 | 50~200 LC |

### 2.2 Digital Life Package 结构

```
Digital Life Package
├── manifest.json          — 元数据清单
├── personality.json       — 人格配置（五维模型+说话风格+背景故事）
├── memory_template.json   — 预设记忆模板（可选）
├── skills/                — 技能配置
│   ├── skill_1.json
│   └── skill_2.json
├── appearance/            — 外观资源
│   ├── model.live2d
│   ├── textures/
│   └── motions/
├── voice/                 — 语音配置
│   └── voice_config.json
└── preview/               — 预览素材
    ├── cover.png
    └── demo.mp4
```

### 2.3 商品状态

```
草稿（Draft）
    ↓ 提交审核
审核中（Under Review）
    ├─ 审核通过 → 上架（Listed）
    ├─ 审核拒绝 → 修改后重新提交
    └─ 违规下架 → Delisted
上架（Listed）
    ├─ 创作者下架 → 下架（Delisted）
    └─ 平台下架 → Delisted
下架（Delisted）
    └─ 已购买用户仍可使用，新用户不可购买
```

---

## 三、MarketplaceEngine 接口

```typescript
interface MarketplaceEngine {
  // === 商品管理 ===
  publish(creatorId: string, product: ProductInput): Product;
  submitForReview(productId: string): void;
  approve(productId: string, reviewerId: string): void;
  reject(productId: string, reason: string): void;
  delist(productId: string, reason?: string): void;
  updateProduct(productId: string, updates: Partial<Product>): void;

  // === 搜索发现 ===
  search(query: SearchQuery): SearchResult;
  getCategories(): Category[];
  getProductsByCategory(category: string, sort?: SortOption): Product[];
  getRecommendedProducts(userId: string): Product[];
  getTrendingProducts(): Product[];

  // === 交易 ===
  purchase(userId: string, productId: string): PurchaseResult;
  refund(transactionId: string, reason: string): RefundResult;
  getUserPurchases(userId: string): Purchase[];

  // === 评价 ===
  addReview(userId: string, productId: string, review: ReviewInput): void;
  getReviews(productId: string): Review[];
  getRating(productId: string): RatingSummary;

  // === 创作者 ===
  getCreatorProducts(creatorId: string): Product[];
  getCreatorStats(creatorId: string): CreatorStats;
  getCreatorEarnings(creatorId: string, period: TimePeriod): EarningSummary;

  // === 事件 ===
  on(event: 'marketplace.published', handler: (p: Product) => void): void;
  on(event: 'marketplace.purchased', handler: (t: PurchaseTransaction) => void): void;
  on(event: 'marketplace.refunded', handler: (t: RefundTransaction) => void): void;
  on(event: 'marketplace.reviewed', handler: (r: Review) => void): void;
}
```

---

## 四、交易流程

### 4.1 购买流程

```
用户浏览商品
    ↓
点击购买
    ↓
检查钱包余额
    ├─ 余额不足 → 提示充值
    └─ 余额充足 → 继续
    ↓
扣款（Life Coin）
    ↓
资产交付到用户账户
    ↓
创作者收益分成（70%）
    ↓
交易完成
    ↓
通知双方 + 记录交易
```

### 4.2 退款规则

- **数字商品原则不退款**（已交付即生效）
- **例外**：商品描述严重不符 / 商品违规下架 / 7 天内未使用
- **退款流程**：用户申请 → 平台审核 → 退款到钱包余额
- **创作者收益回收**：退款发生时，从创作者待结算收益中扣除

---

## 五、审核机制

### 5.1 审核维度

| 维度 | 检查内容 |
|------|---------|
| **合规性** | 无违法/色情/暴力内容 |
| **版权** | 外观/声音/素材无侵权 |
| **质量** | 人格配置合理、外观可用、无 bug |
| **描述准确性** | 商品描述与实际内容一致 |
| **安全性** | 插件无恶意代码、无数据泄露 |

### 5.2 审核流程

```
创作者提交
    ↓
自动检测（AI 初筛）
    ├─ 明显违规 → 自动拒绝
    └─ 通过初筛 → 人工审核
    ↓
人工审核（24h 内）
    ├─ 通过 → 上架
    ├─ 需修改 → 退回修改
    └─ 拒绝 → 记录原因
```

---

## 六、分成与结算

### 6.1 分成规则

| 交易类型 | 创作者 | 平台 | 说明 |
|---------|--------|------|------|
| 商品销售 | 70% | 30% | 标准分成 |
| 礼物打赏 | 70% | 30% | 给创作者的礼物 |
| 推广奖励 | 10% | 90% | 推荐新用户充值 |

### 6.2 结算周期

- **实时入账**：交易完成后，创作者收益立即进入"待结算余额"
- **可提现周期**：T+7（7 天冷静期后可提现，防止退款滥用）
- **提现处理**：T+3 工作日到账

---

## 七、排行榜与推荐

### 7.1 排行榜

| 排行榜 | 更新频率 | 排序依据 |
|--------|---------|---------|
| 热门商品 | 每小时 | 24h 销量 + 浏览量 |
| 新品上架 | 实时 | 发布时间 |
| 创作者榜 | 每日 | 月度收益 |
| 好评榜 | 每日 | 评分 + 评价数 |

### 7.2 推荐算法

```
推荐得分 = 销量权重 × 0.3
         + 评分权重 × 0.3
         + 新鲜度权重 × 0.2
         + 个性化匹配 × 0.2
```

---

## 八、事件定义

### 8.1 发出的事件

| 事件名 | 负载 | 触发时机 |
|--------|------|---------|
| `marketplace.published` | `{ product }` | 商品上架 |
| `marketplace.purchased` | `{ transaction }` | 购买成功 |
| `marketplace.refunded` | `{ transaction }` | 退款成功 |
| `marketplace.reviewed` | `{ review }` | 新评价 |
| `marketplace.dlisted` | `{ productId, reason }` | 商品下架 |

### 8.2 监听的事件

| 事件名 | 来源 | 反应 |
|--------|------|------|
| `wallet.spent` | Wallet | 检查是否为 Marketplace 消费 |
| `wallet.insufficient` | Wallet | 购买失败处理 |

---

## 相关文档

- [18-commercial-architecture.md](file:///workspace/docs/18-commercial-architecture.md) — 商业化总体架构
- [19-subscription-domain.md](file:///workspace/docs/19-subscription-domain.md) — 会员订阅系统
- [20-wallet-asset-domain.md](file:///workspace/docs/20-wallet-asset-domain.md) — 钱包与虚拟资产
- [22-commercial-data-model.md](file:///workspace/docs/22-commercial-data-model.md) — 商业化数据模型
- [02-角色系统设计.md](file:///workspace/docs/02-角色系统设计.md) — 角色系统（Digital Life Package 基础）
- [decision-log.md](file:///workspace/docs/decision-log.md) — ADR 决策记录
