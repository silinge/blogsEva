# EVA Blog Skeleton

这是一个可直接用于 GitHub 仓库的 EVA 机甲风个人博客的骨架，包含前后端、主题切换、部署工作流等核心结构。后续可在此基础上逐步实现业务逻辑和安全策略。

- Node.js + Express 后端
- SQLite 数据存储（单文件）
- EVA 三套主题切换（eva-00、eva-01、eva-02）
- GitHub Actions 部署到 VPS 的自动化流程
- 最小管理员登录与文章增删改接口

结构说明
- server/ 后端逻辑
- public/ 静态资源（CSS/JS/图片）
- views/ 页面模版（静态 HTML）
- data/ 数据库文件位置
- .env 示例环境变量
- .github/workflows/ 部署工作流

本地运行
- npm install
- cp .env.sample .env  或自行设置环境变量
- npm start

后续步骤
- 完善前端路由与富文本编辑器
- 增强身份认证与授权、输入校验、XSS 防护
- 完成 Nginx/HTTPS 部署脚本
