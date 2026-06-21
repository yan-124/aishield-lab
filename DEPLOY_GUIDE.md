# AIShield Lab 部署指南

## 方案：Cloudflare Pages（国内访问快）

### 方法一：自动脚本（推荐）

1. **双击运行** `deploy-cf.bat`
2. 首次运行会要求登录 Cloudflare，按提示操作
3. 部署完成后会显示访问链接

### 方法二：手动上传（无需命令行）

1. 打开 https://dash.cloudflare.com
2. 左侧菜单 → **Pages**
3. 点击 **"创建项目"**
4. 选择 **"直接上传"**
5. 拖拽 `dist3` 文件夹到上传区域
6. 项目名填 `aishield-lab`
7. 点击 **部署**

### 方法三：Wrangler CLI

```bash
# 安装 wrangler
npm install -g wrangler

# 登录（会弹出浏览器）
wrangler login

# 构建
npm run build

# 部署
wrangler pages deploy dist3 --project-name=aishield-lab
```

## 自定义域名

部署完成后，在 Cloudflare Pages 项目设置里可以绑定自己的域名（如 `aiseclearn.com`）。

## 当前状态

- 构建产物：`dist3/`（已就绪）
- 项目名建议：`aishield-lab`
