# FanCraft - 五月天应援物料设计工具

一个基于 React 18+、TypeScript 5.0+、Tailwind CSS 3.0+ 和 Vite 4.0+ 的单页应用，专为五月天粉丝设计应援物料。

## 功能特性

- 🎨 **模板选择系统**：提供 5 种不同风格的应援物料模板
- ✏️ **文字编辑模块**：支持字体选择、大小调整、颜色修改、对齐方式设置
- 👁️ **实时预览**：所见即所得的编辑体验
- 📥 **高清下载**：一键导出高质量 PNG 图片
- 📱 **响应式设计**：在桌面端和移动端均有良好体验

## 技术栈

- 前端框架：React 18+
- 类型系统：TypeScript 5.0+
- 构建工具：Vite 5.0+
- CSS 框架：Tailwind CSS 3.4+
- 图片处理：html2canvas
- 状态管理：React Context API + useReducer

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 项目结构

```
fancraft/
├── src/
│   ├── components/          # 组件目录
│   │   ├── AppProvider.tsx  # 应用状态提供者
│   │   ├── MainContent.tsx  # 主内容组件
│   │   ├── TemplateSelector.tsx  # 模板选择器
│   │   ├── TextEditor.tsx   # 文字编辑器
│   │   └── PreviewArea.tsx  # 预览区域
│   ├── constants/           # 常量目录
│   │   └── templates.ts     # 模板数据
│   ├── context/             # Context 目录
│   │   └── AppContext.tsx   # 应用 Context
│   ├── reducers/            # Reducer 目录
│   │   └── appReducer.ts    # 应用 Reducer
│   ├── types/               # 类型定义目录
│   │   └── index.ts         # TypeScript 类型
│   ├── utils/               # 工具函数目录
│   │   └── image.ts         # 图片处理工具
│   ├── index.css            # 全局样式
│   └── main.tsx             # 应用入口
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 使用说明

1. **选择模板**：在顶部选择喜欢的模板风格
2. **编辑文字**：点击预览区域的文字，然后在左侧编辑器修改文字内容、字体、大小、颜色和对齐方式
3. **下载图片**：点击预览区域右上角的"下载PNG"按钮，保存设计好的图片

## 模板介绍

- **经典蓝色**：五月天标志性蓝色主题，适合演唱会应援
- **摇滚红色**：热情奔放的红色主题，充满力量感
- **星空渐变**：梦幻紫色星空，浪漫唯美风格
- **阳光橙色**：温暖明亮的橙色，充满希望和活力
- **简约黑白**：经典黑白配色，简约而不简单

## 开发说明

本项目采用组件化开发模式，使用 React Context API 和 useReducer 进行状态管理，确保代码的可维护性和可扩展性。
