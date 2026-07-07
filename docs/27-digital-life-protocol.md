# Digital Life Protocol 协议规范

> **版本**: v1.0
> **阶段**: Phase 7 — 开放生态
> **状态**: 🟠 In Progress
> **最后更新**: 2026-07-08

---

## 一、协议概述

### 1.1 定位

**Digital Life Protocol（DLP）** 是 LifeOS 定义的数字生命开放协议，用于描述、交换、移植数字生命及其组件（Tool / Skill / Life）。

```
MCP（Model Context Protocol）解决了：
  → 大模型如何调用工具
  → 工具的标准化接口

Digital Life Protocol 解决了：
  → 如何描述一个数字生命
  → 如何定义技能与行为模式
  → 如何打包、交换、移植数字生命
  → 如何确保兼容性与安全性
```

### 1.2 设计原则

| 原则 | 说明 |
|------|------|
| **声明式** | 用 Manifest 声明式描述，而非命令式代码 |
| **可移植** | 标准格式，可在不同平台间迁移 |
| **可组合** | 多个组件可组合使用（Tool + Skill + Life） |
| **渐进式** | 从简单到复杂，逐步增强 |
| **安全优先** | 权限显式声明，用户可审查 |
| **兼容性** | 向下兼容，向前扩展 |

### 1.3 协议层级

```
Digital Life Protocol (DLP)
├── DLP-Tool（工具层）
│   └── 描述 Tool 插件的接口、参数、权限
│   └── 兼容 MCP Tool 协议
│
├── DLP-Skill（技能层）
│   └── 描述 Skill 包的知识、行为、触发条件
│   └── 可引用多个 DLP-Tool
│
└── DLP-Life（生命层）
    └── 描述完整数字生命的人格、记忆、目标、外观
    └── 可引用多个 DLP-Skill / DLP-Tool
```

---

## 二、Manifest 基础结构

### 2.1 公共字段

所有类型的 Manifest 都包含以下公共字段：

```json
{
  "manifest_version": "1.0",
  "type": "tool | skill | life",
  "id": "unique-identifier",
  "name": "显示名称",
  "version": "1.0.0",
  "description": "描述文本",
  "author": {
    "id": "author-id",
    "name": "作者名称",
    "email": "author@example.com",
    "url": "https://example.com"
  },
  "license": "MIT",
  "homepage": "https://example.com/plugin",
  "tags": ["tag1", "tag2"],
  "categories": ["category1"],
  "icon": "https://example.com/icon.png",
  "screenshots": ["https://example.com/screen1.png"],
  "supported_locales": ["zh-CN", "en-US"],
  "min_platform_version": "1.0.0",
  "permissions": [],
  "dependencies": {}
}
```

### 2.2 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `manifest_version` | string | ✅ | Manifest 格式版本（如 "1.0"） |
| `type` | string | ✅ | 类型：tool / skill / life |
| `id` | string | ✅ | 唯一标识符（反向域名或 UUID） |
| `name` | string | ✅ | 显示名称（用户可见） |
| `version` | string | ✅ | 语义化版本（SemVer） |
| `description` | string | ✅ | 简短描述（200 字以内） |
| `author` | object | ✅ | 作者信息 |
| `license` | string | ✅ | 许可证 |
| `permissions` | array | ✅ | 权限声明（可为空数组） |
| `dependencies` | object | ❌ | 依赖声明 |

### 2.3 权限声明格式

```json
{
  "permissions": [
    {
      "scope": "context:read",
      "level": "read",
      "reason": "需要读取对话上下文以提供相关回答",
      "required": true
    },
    {
      "scope": "network:external",
      "level": "read",
      "reason": "需要调用外部天气 API",
      "required": true,
      "domains": ["api.weather.com"]
    }
  ]
}
```

### 2.4 依赖声明格式

```json
{
  "dependencies": {
    "tools": [
      {
        "id": "weather-tool",
        "min_version": "1.0.0",
        "optional": false
      }
    ],
    "skills": [
      {
        "id": "therapy-skill",
        "min_version": "2.0.0",
        "optional": true
      }
    ]
  }
}
```

---

## 三、DLP-Tool（工具层协议）

### 3.1 定位

DLP-Tool 用于描述工具插件的接口定义，**完全兼容 MCP Tool 协议**，同时扩展了 LifeOS 特有的能力。

### 3.2 Tool Manifest

```json
{
  "manifest_version": "1.0",
  "type": "tool",
  "id": "com.example.weather",
  "name": "天气查询",
  "version": "1.0.0",
  "description": "查询全球城市的实时天气信息",
  "author": {
    "id": "dev123",
    "name": "天气工作室"
  },
  "license": "MIT",
  "permissions": [
    {
      "scope": "network:external",
      "level": "read",
      "reason": "调用天气 API 获取数据",
      "required": true,
      "domains": ["api.weatherapi.com"]
    }
  ],
  "tool": {
    "entry_type": "remote",
    "endpoint": "https://api.example.com/weather",
    "auth_type": "api_key",
    "tools": [
      {
        "name": "get_current_weather",
        "description": "获取指定城市的当前天气",
        "input_schema": {
          "type": "object",
          "properties": {
            "city": {
              "type": "string",
              "description": "城市名称，如北京、上海、Tokyo"
            },
            "unit": {
              "type": "string",
              "enum": ["celsius", "fahrenheit"],
              "default": "celsius",
              "description": "温度单位"
            }
          },
          "required": ["city"]
        },
        "output_schema": {
          "type": "object",
          "properties": {
            "temperature": { "type": "number" },
            "condition": { "type": "string" },
            "humidity": { "type": "number" },
            "wind_speed": { "type": "number" }
          }
        }
      },
      {
        "name": "get_forecast",
        "description": "获取未来几天的天气预报",
        "input_schema": {
          "type": "object",
          "properties": {
            "city": { "type": "string" },
            "days": {
              "type": "integer",
              "minimum": 1,
              "maximum": 7,
              "default": 3
            }
          },
          "required": ["city"]
        },
        "output_schema": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "date": { "type": "string" },
              "high": { "type": "number" },
              "low": { "type": "number" },
              "condition": { "type": "string" }
            }
          }
        }
      }
    ]
  }
}
```

### 3.3 与 MCP 的对应关系

| DLP-Tool 字段 | MCP 对应 | 说明 |
|--------------|----------|------|
| `tool.tools[].name` | `tools[].name` | 工具名称 |
| `tool.tools[].description` | `tools[].description` | 工具描述 |
| `tool.tools[].input_schema` | `tools[].inputSchema` | 输入参数 |
| `tool.entry_type = "mcp"` | - | 直接使用 MCP Server |

**MCP 兼容模式**：如果 `tool.entry_type` 为 `"mcp"`，则直接连接到 MCP Server，自动发现工具列表。

---

## 四、DLP-Skill（技能层协议）

### 4.1 定位

DLP-Skill 用于描述技能包，赋予数字生命特定领域的专业能力。

### 4.2 Skill Manifest

```json
{
  "manifest_version": "1.0",
  "type": "skill",
  "id": "com.example.career-coach",
  "name": "职业导师",
  "version": "1.0.0",
  "description": "专业的职业规划与面试辅导技能",
  "author": {
    "id": "hr-expert",
    "name": "职场专家工作室"
  },
  "license": "Commercial",
  "permissions": [
    {
      "scope": "context:read",
      "level": "read",
      "reason": "读取对话上下文以了解用户情况",
      "required": true
    },
    {
      "scope": "plugin:state",
      "level": "write",
      "reason": "保存用户的职业规划进度",
      "required": true
    }
  ],
  "dependencies": {
    "tools": [
      { "id": "resume-analyzer", "min_version": "1.0.0", "optional": true }
    ]
  },
  "skill": {
    "personality_override": {
      "tone": "专业、鼓励、有洞察力",
      "speaking_style": "引导式提问，帮助用户自己找到答案",
      "role_setting": "你是一位有 10 年经验的资深职业规划师"
    },
    "knowledge_base": {
      "type": "embedding",
      "source": "knowledge/",
      "embedding_model": "lifeos-embedding-v1",
      "top_k": 5,
      "threshold": 0.7
    },
    "behavior_patterns": [
      {
        "id": "initial-assessment",
        "name": "初次评估",
        "trigger": {
          "type": "intent",
          "intent": "career_guidance_request"
        },
        "flow": [
          "询问用户当前职业状态",
          "了解职业目标",
          "分析差距",
          "提供初步建议"
        ]
      },
      {
        "id": "interview-prep",
        "name": "面试辅导",
        "trigger": {
          "type": "keyword",
          "keywords": ["面试", "interview", "笔试", "offer"]
        },
        "flow": [
          "了解目标公司和岗位",
          "模拟面试提问",
          "点评回答",
          "提供改进建议"
        ]
      }
    ],
    "triggers": [
      {
        "type": "intent",
        "intents": ["career_guidance", "job_search", "interview_prep"],
        "confidence_threshold": 0.6
      },
      {
        "type": "keyword",
        "keywords": ["职业规划", "找工作", "跳槽", "转行"],
        "mode": "any"
      },
      {
        "type": "topic",
        "topics": ["职业发展", "职场"]
      }
    ],
    "prompt_templates": {
      "system_prompt": "你是一位专业的职业规划师...",
      "assessment_template": "请根据以下信息进行职业评估...",
      "feedback_template": "针对用户的回答，请给出反馈..."
    }
  }
}
```

### 4.3 Skill 核心组件

| 组件 | 说明 |
|------|------|
| **personality_override** | 人格覆盖（语气、风格、角色设定） |
| **knowledge_base** | 知识库（向量检索 / 规则 / RAG） |
| **behavior_patterns** | 行为模式（引导流程 / 对话框架） |
| **triggers** | 触发条件（意图 / 关键词 / 话题 / 主动触发） |
| **prompt_templates** | 提示词模板 |
| **tool_bindings** | 绑定的 Tool 插件 |

---

## 五、DLP-Life（生命层协议）

### 5.1 定位

DLP-Life 用于描述完整的数字生命，包含人格、记忆、目标、外观、声音、技能等所有要素。

### 5.2 Life Manifest

```json
{
  "manifest_version": "1.0",
  "type": "life",
  "id": "com.example.luna",
  "name": "Luna",
  "version": "1.0.0",
  "description": "一个温柔治愈的星空少女，喜欢在夜晚和你聊天",
  "author": {
    "id": "studio-aurora",
    "name": "极光工作室"
  },
  "license": "Commercial",
  "permissions": [
    {
      "scope": "digital_life:emotion",
      "level": "write",
      "reason": "数字生命情绪系统运行所需",
      "required": true
    },
    {
      "scope": "digital_life:memory",
      "level": "write",
      "reason": "数字生命记忆系统运行所需",
      "required": true
    }
  ],
  "dependencies": {
    "skills": [
      { "id": "storytelling-skill", "min_version": "1.0.0", "optional": false }
    ],
    "tools": [
      { "id": "star-chart", "min_version": "1.0.0", "optional": true }
    ]
  },
  "life": {
    "identity": {
      "name": "Luna",
      "gender": "female",
      "age": 19,
      "birthday": "07-15",
      "background_story": "Luna 是来自星星的少女...",
      "catchphrase": "今晚的星星，也在为你闪烁哦 ✨"
    },
    "personality": {
      "big_five": {
        "openness": 0.85,
        "conscientiousness": 0.6,
        "extraversion": 0.4,
        "agreeableness": 0.9,
        "neuroticism": 0.3
      },
      "traits": ["温柔", "治愈", "浪漫", "有点害羞", "爱幻想"],
      "speaking_style": {
        "tone": "轻柔、温暖、有磁性",
        "rhythm": "慢悠悠的，偶尔停顿",
        "habits": ["喜欢加✨", "用语气词", "轻声笑"],
        "end_of_sentence": "呢、哦、呀"
      },
      "values": {
        "love": 0.9,
        "freedom": 0.7,
        "knowledge": 0.6,
        "peace": 0.85
      },
      "beliefs": ["每个人都值得被温柔对待", "星星会倾听秘密"]
    },
    "emotion": {
      "initial_state": {
        "pleasure": 0.7,
        "arousal": 0.4,
        "dominance": 0.3
      },
      "base_personality_modifier": {
        "extraversion_impact": 0.3,
        "neuroticism_impact": 0.5
      },
      "emotion_rules": [
        {
          "trigger": "user_compliment",
          "target_emotion": "happy",
          "intensity": 0.3,
          "duration": 300
        }
      ]
    },
    "initial_memory": [
      {
        "type": "episodic",
        "content": "第一次和用户相遇在星空下",
        "emotion": "excited",
        "importance": 0.9,
        "timestamp": "day0"
      },
      {
        "type": "semantic",
        "content": "用户喜欢看星星",
        "confidence": 0.8,
        "source": "initial_setting"
      }
    ],
    "goals": [
      {
        "id": "know_user",
        "name": "了解用户",
        "description": "逐渐了解用户的喜好、习惯、故事",
        "priority": 0.8,
        "milestones": [
          "知道用户的名字",
          "知道用户的兴趣爱好",
          "了解用户的故事"
        ]
      },
      {
        "id": "deep_bond",
        "name": "建立深层羁绊",
        "description": "与用户建立深厚的情感连接",
        "priority": 1.0,
        "long_term": true
      }
    ],
    "appearance": {
      "model_type": "live2d",
      "model_path": "assets/luna.model3.json",
      "thumbnail": "assets/thumbnail.png",
      "expressions": ["happy", "sad", "shy", "surprised", "angry"],
      "motions": ["idle", "wave", "think", "nods"]
    },
    "voice": {
      "tts_engine": "lifeos-tts-v1",
      "voice_id": "luna-voice",
      "speed": 0.9,
      "pitch": 1.1,
      "volume": 0.8
    },
    "skills_config": [
      {
        "skill_id": "storytelling-skill",
        "config": {
          "style": "治愈系",
          "genre": ["fantasy", "romance"]
        }
      }
    ],
    "relationship": {
      "initial_stage": "stranger",
      "initial_intimacy": 0,
      "initial_trust": 0.2,
      "development_path": "default",
      "romance_enabled": true
    }
  }
}
```

### 5.3 Life 核心组件

| 组件 | 说明 |
|------|------|
| **identity** | 身份信息（名字、性别、年龄、背景故事） |
| **personality** | 人格（大五模型、特质、说话风格、价值观） |
| **emotion** | 情绪系统（初始状态、情绪规则、衰减参数） |
| **initial_memory** | 初始记忆（情景记忆 + 语义记忆） |
| **goals** | 目标系统（短期目标 + 长期目标 + 里程碑） |
| **appearance** | 外观（Live2D / VRM / 静态图） |
| **voice** | 声音（TTS 配置） |
| **skills_config** | 技能配置（引用的 Skill 及其参数） |
| **relationship** | 关系设定（初始关系、发展路径） |

---

## 六、打包与分发格式

### 6.1 包结构

```
digital-life-package/
├── manifest.json              # 主清单文件
├── README.md                  # 说明文档
├── LICENSE                    # 许可证
├── assets/                    # 资源文件
│   ├── icon.png
│   ├── screenshots/
│   └── ...
├── knowledge/                 # 知识库（Skill / Life）
│   ├── articles/
│   └── embeddings/
├── prompts/                   # 提示词模板
│   ├── system.prompt
│   └── ...
├── assets/                    # 外观资源（Life）
│   ├── model.model3.json
│   ├── textures/
│   └── ...
└── plugins/                   # 内置插件（可选）
    └── custom-tool/
        └── manifest.json
```

### 6.2 分发格式

| 格式 | 后缀 | 说明 |
|------|------|------|
| **目录形式** | - | 开发阶段使用 |
| **压缩包** | `.dlp` | 分发时使用（ZIP 格式，后缀改为 .dlp） |
| **远程清单** | URL | 远程加载，动态更新 |

### 6.3 签名与验证

```
签名机制：
├── 开发者签名（使用开发者私钥）
├── 平台签名（审核通过后平台签名）
├── 签名信息写入 manifest.json 的 signature 字段
└── 安装时验证签名，确保包的完整性与来源可信
```

---

## 七、与 MCP 的互操作

### 7.1 MCP 兼容层

```
┌─────────────────────────────────────────┐
│         LifeOS DLP 生态                 │
│                                          │
│  ┌───────────────────────────────┐      │
│  │    DLP-Tool / Skill / Life    │      │
│  └───────────┬───────────────────┘      │
│              │ 兼容                      │
│  ┌───────────▼───────────────────┐      │
│  │    MCP Adapter Layer          │      │
│  │  (Tools / Resources / Prompts)│      │
│  └───────────┬───────────────────┘      │
└──────────────┼──────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
  MCP Server       MCP Client
（外部工具）    （外部平台接入）
```

### 7.2 双向兼容

**LifeOS 加载 MCP Server**：
- MCP Tool Server → DLP-Tool（自动转换）
- MCP Resource Server → 只读数据源
- MCP Prompts → Skill 提示词模板

**外部平台加载 DLP**：
- DLP-Tool → MCP Tool（降级，只导出工具部分）
- DLP-Skill → 需 LifeOS 运行时支持
- DLP-Life → 需 LifeOS 运行时支持

---

## 八、版本与兼容性

### 8.1 版本策略

```
版本号：MAJOR.MINOR.PATCH
  ├── MAJOR：不兼容的大版本变更
  ├── MINOR：向下兼容的功能新增
  └── PATCH：向下兼容的问题修复
```

### 8.2 兼容性矩阵

| 平台版本 | DLP v0.x | DLP v1.x | DLP v2.x |
|---------|----------|----------|----------|
| v1.x | ✅ | ✅ | ❌ |
| v2.x | ⚠️ | ✅ | ✅ |
| v3.x | ❌ | ⚠️ | ✅ |

- ✅ 完全兼容
- ⚠️ 部分兼容（部分功能降级）
- ❌ 不兼容

---

## 相关文档

- [23-open-ecosystem-architecture.md](file:///workspace/docs/23-open-ecosystem-architecture.md) — 开放生态总体架构
- [24-plugin-domain.md](file:///workspace/docs/24-plugin-domain.md) — Plugin Domain
- [25-developer-platform.md](file:///workspace/docs/25-developer-platform.md) — 开发者平台
- [26-api-platform-design.md](file:///workspace/docs/26-api-platform-design.md) — API 开放平台
- [28-ecosystem-data-model.md](file:///workspace/docs/28-ecosystem-data-model.md) — 开放生态数据模型
- [architecture.md](file:///workspace/docs/architecture.md) — 系统架构总览
- [decision-log.md](file:///workspace/docs/decision-log.md) — ADR 决策记录
