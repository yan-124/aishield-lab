# 持续优化工作流指南

本文档说明为 aiseclearn 网站搭建的自动化工作流。

## 已部署的 4 条流水线

### 1. 自动部署（deploy.yml）
- **触发**：每次 push 到 main/master 分支
- **功能**：
  - 自动安装依赖并构建
  - 部署前端到 Cloudflare Pages（dist3 目录）
  - 部署 Coze 代理 Worker
- **要求**：需在 GitHub Secrets 中配置 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`

### 2. 性能监控（lighthouse.yml）
- **触发**：每天凌晨 3 点（UTC+8 为上午 11 点）
- **功能**：
  - 对 https://www.aiseclearn.com/ 运行 Lighthouse 性能审计
  - 检查性能、可访问性、最佳实践、SEO 四个维度
  - 低于阈值时发出警告
- **报告**：每次运行后生成可下载的 HTML 报告

### 3. 安全审计（security.yml）
- **触发**：每次 PR、push，以及每周一凌晨 2 点
- **功能**：
  - `npm audit`：扫描依赖漏洞
  - `npm outdated`：检查过时依赖
  - CodeQL：深度代码安全分析

### 4. 健康检查（health-check.yml）
- **触发**：每 6 小时一次
- **功能**：
  - 检查主站 HTTP 200 状态
  - 检查关键资源可用性
  - 失败时触发告警

## 开始使用

### 第一步：配置 GitHub Secrets

在 GitHub 仓库 **Settings → Secrets and variables → Actions** 中添加：

| Secret 名称 | 值 | 获取方式 |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | 你的 API Token | [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) → Create Token，选择 `Cloudflare Pages:Edit` 和 `Workers Scripts:Edit` 权限 |
| `CLOUDFLARE_ACCOUNT_ID` | 你的 Account ID | Cloudflare Dashboard 右侧栏查看 |

### 第二步：提交工作流文件

```bash
git add .github/workflows/ lighthouserc.js docs/OPTIMIZATION_WORKFLOW.md
git commit -m "ci: 添加持续优化工作流（部署、监控、安全、健康检查）"
git push origin main
```

### 第三步：验证

1. 进入 GitHub 仓库的 **Actions** 标签页
2. 应该能看到工作流正在运行
3. 首次部署成功后，访问网站确认正常

## 优化建议（后续迭代）

- [ ] 在 Cloudflare Dashboard 开启 **Web Analytics**（免费 RUM）
- [ ] 配置 **缓存规则**：为 dist3 中的静态资源设置长期缓存头
- [ ] 使用 **Cloudflare Images** 优化 wechat-qr.png
- [ ] 添加 **WAF 规则**：防护常见攻击模式
- [ ] 配置 **自定义域名** SSL/TLS 为"完整（严格）"
- [ ] 考虑使用 **Queues** 处理排行榜等高并发写入
