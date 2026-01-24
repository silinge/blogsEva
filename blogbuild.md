太好了，这个需求**非常完整而且专业**，已经接近一个真正可维护的个人博客产品方案了 👍
我会**不直接写代码**，而是先帮你把**整体架构 + 技术选型 + 安全策略 + 自动部署逻辑**梳理清楚，最后给你一份**从 0 到上线、可拆解执行的「任务列表（Checklist）」**，方便你一步步实现，或者之后让我逐项帮你写。

---

## 一、整体目标重述（我对你需求的理解）

你要的是：

* ✅ Ubuntu VPS 上运行的 **个人博客网站**
* ✅ 代码 **全部存放在 GitHub 普通仓库（非 GitHub Pages）**
* ✅ **GitHub 更新 → VPS 自动部署**
* ✅ **EVA 机甲风主题**

  * 三套可切换主题

    1. 初号机：黄 / 灰 / 白
    2. 1号机：紫 / 黑 / 绿
    3. 2号机：红 / 黑 / 白
  * 页面底部主题切换色条
* ✅ **管理员系统**

  * 只有 1 个管理员
  * 无注册、无用户管理
  * 密码放 `.env`，不进 GitHub
* ✅ **后台文章管理**

  * 新增 / 编辑 / 删除文章
  * 富文本编辑器
* ✅ 前后端分离但不过度复杂
* ✅ README 里有 **完整 VPS 部署文档**

---

## 二、推荐的技术架构（为你的需求优化后）

### 1️⃣ 整体架构（简单、可控、不臃肿）

```
[ 浏览器 ]
    ↓
[ Nginx ]
    ↓
[ Node.js (Express) ]
    ├── 前台页面（博客）
    ├── 后台管理页面
    ├── API（文章 / 登录）
    ↓
[ 本地数据存储（JSON / SQLite） ]
```

> 💡 **不建议一开始就用 MySQL / MongoDB**
> 个人博客 + 单管理员 → SQLite 或 JSON 文件完全够用，维护成本极低

---

### 2️⃣ 技术选型说明（为什么这么选）

| 模块         | 技术                       | 理由            |
| ---------- | ------------------------ | ------------- |
| Web Server | Nginx                    | 高性能、VPS 标配    |
| 后端         | Node.js + Express        | 逻辑简单、生态成熟     |
| 数据存储       | SQLite（推荐）               | 单文件、可备份、无服务进程 |
| 前端         | 原生 HTML / CSS / JS       | 主题控制最自由       |
| 编辑器        | Quill / TinyMCE          | 成熟、易集成        |
| 认证         | Session + Cookie         | 简单安全          |
| 部署         | GitHub Webhook / Actions | 自动化           |

---

## 三、GitHub → VPS 自动更新的推荐方案

### ✅ 推荐方案：**GitHub Actions + SSH 部署**

**流程：**

```
git push
 ↓
GitHub Actions
 ↓
SSH 登录 VPS
 ↓
git pull
 ↓
npm install（如有变更）
 ↓
pm2 restart
```

**优点：**

* 不需要 VPS 暴露 webhook 端口
* 安全（SSH Key）
* 日志可追踪
* 专业、稳定

---

## 四、项目目录结构设计（核心）

```
eva-blog/
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions 自动部署
├── public/
│   ├── css/
│   │   ├── base.css
│   │   ├── theme-eva-00.css  # 初号机
│   │   ├── theme-eva-01.css  # 1号机
│   │   └── theme-eva-02.css  # 2号机
│   ├── js/
│   │   ├── theme.js
│   │   └── main.js
│   └── assets/
│       └── icons/            # EVA 风格 UI 元素
├── views/
│   ├── index.html            # 博客首页
│   ├── post.html             # 文章页
│   ├── login.html            # 管理员登录
│   └── admin.html            # 后台管理
├── server/
│   ├── app.js                # Express 入口
│   ├── auth.js               # 登录验证
│   ├── posts.js              # 文章 CRUD
│   └── db.js                 # SQLite 操作
├── data/
│   └── posts.db              # SQLite 数据库
├── .env                      # 管理员密码（不提交）
├── .gitignore
├── package.json
└── README.md
```

---

## 五、EVA 机甲风主题系统设计思路

### 🎨 主题切换逻辑（前端）

* 使用 `data-theme="eva-00"` 挂在 `<html>` 或 `<body>`
* CSS 使用变量：

```css
:root[data-theme="eva-00"] {
  --bg: #f6f6f6;
  --primary: #fdd835;
  --accent: #9e9e9e;
}
```

* 底部放 3 条 **“驾驶员识别条”**（EVA 彩条）

```html
<div class="theme-switcher">
  <span data-theme="eva-00"></span>
  <span data-theme="eva-01"></span>
  <span data-theme="eva-02"></span>
</div>
```

* JS 保存到 `localStorage`

---

## 六、管理员系统设计（安全 & 简化）

### 🔐 登录逻辑

* `.env`

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=superStrongPassword
SESSION_SECRET=randomstring
```

* 登录成功 → 设置 Session
* 所有 `/admin/*` API 必须校验 Session

**✔ 无注册
✔ 无用户表
✔ 无暴露密码风险**

---

## 七、文章系统设计（推荐方案）

### 📄 文章字段

```json
{
  "id": "uuid",
  "title": "文章标题",
  "content": "<p>HTML内容</p>",
  "created_at": "2026-01-01",
  "updated_at": "2026-01-02",
  "status": "published"
}
```

### ✍ 编辑器

* 后台使用 Quill / TinyMCE
* 内容直接存 HTML（简单 & 高保真）

---

## 八、README 中必须包含的部署文档结构

```
# EVA Blog

## 1. 项目介绍
## 2. 技术栈
## 3. 本地开发
## 4. Ubuntu VPS 环境准备
   - Node.js
   - Nginx
   - PM2
## 5. GitHub Actions 自动部署
## 6. Nginx 配置示例
## 7. HTTPS（Let's Encrypt）
## 8. 常见问题
```

---

## 九、最终：完整「任务列表（可直接执行）」✅

### 阶段一：基础准备

* [ ] 创建 GitHub 仓库（非 github.io）
* [ ] 初始化 Node.js 项目
* [ ] 配置 `.gitignore`（包含 `.env`）
* [ ] 创建 Express 服务
* [ ] 本地跑通 Hello World

---

### 阶段二：前端页面

* [ ] 首页文章列表 HTML
* [ ] 文章详情页 HTML
* [ ] EVA UI 基础布局
* [ ] 三套主题 CSS
* [ ] 主题切换 JS（localStorage）

---

### 阶段三：后台系统

* [ ] 管理员登录页面
* [ ] Session 登录逻辑
* [ ] 后台文章列表
* [ ] 富文本编辑器
* [ ] 新增 / 编辑 / 删除 API

---

### 阶段四：数据层

* [ ] SQLite 初始化
* [ ] 文章表结构
* [ ] CRUD 封装
* [ ] 数据备份策略

---

### 阶段五：部署与自动化

* [ ] VPS 安装 Node.js / PM2 / Nginx
* [ ] Nginx 反向代理
* [ ] GitHub Actions SSH Key
* [ ] 自动部署 workflow
* [ ] HTTPS 配置

---

### 阶段六：打磨 & 安全

* [ ] 管理页路由保护
* [ ] XSS 基本防护
* [ ] 404 / 错误页
* [ ] README 完整文档

---