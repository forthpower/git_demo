# Schema Generator

可视化的 Schema 生成器，快速创建和管理数据模型配置。

## 快速开始

```bash
# 安装依赖
pip install -r requirements.txt

# 启动应用
python app.py

# 访问 http://localhost:5000
```

## 功能特性

- 🎨 **可视化配置** - 直观的图形界面配置模型、字段、动作
- 📝 **字段管理** - 支持多种字段类型（String, Integer, Select, File等）
- 🔄 **动作配置** - 灵活配置 CRUD 操作和自定义动作
- 📥 **批量导入** - 从文件夹批量导入 Python schema 文件
- 🔄 **自动同步** - 将修改自动同步回源文件

## 项目结构

```
schema_generator/
├── app.py                      # 启动文件
├── backend/                    # 后端模块
│   ├── app.py                 # 主应用
│   ├── routes/                # 路由（待扩展）
│   ├── services/              # 业务逻辑（待扩展）
│   └── utils/                 # 工具函数（待扩展）
├── static/                     # 前端资源
│   ├── index.html             # 主页面
│   ├── script.js              # 全局函数 (~2000行)
│   └── js/                    # 模块化JS ✨新
│       ├── core/              # 核心模块
│       │   ├── admin-system.js  # AdminSystem类 ✨
│       │   └── config.js        # 全局配置 ✨
│       ├── utils/             # 工具函数
│       │   ├── api.js           # API调用封装 ✨
│       │   └── dom.js           # DOM操作工具 ✨
│       └── main.js            # 应用入口 ✨
└── models/                     # Schema示例

✨ 标记为新的模块化文件
```

## 代码结构说明

### 模块化改进

- **原来**: 单个 `script.js` 文件 (3985行)
- **现在**: 
  - `admin-system.js` - AdminSystem 核心类 (~2000行)
  - `script.js` - 全局函数 (~2000行)
  - `config.js` - 配置常量
  - `api.js` - API 调用封装
  - `dom.js` - DOM 工具函数
  - `main.js` - 应用初始化

### 加载顺序

```html
1. js/core/config.js          (配置常量)
2. js/utils/api.js            (API封装)
3. js/utils/dom.js            (DOM工具)
4. js/core/admin-system.js    (AdminSystem类)
5. script.js                  (全局函数)
6. js/main.js                 (初始化)
```

## 使用指南

### 基础使用

1. **创建模型** - 点击"新增模型"配置基本信息
2. **配置字段** - 添加字段并设置类型和属性
3. **配置动作** - 选择需要的操作（列表/创建/编辑/删除）
4. **生成代码** - 生成 Python schema 代码

### 批量导入

1. 点击"从文件导入" → 选择"批量导入(文件夹)"
2. 输入包含 `.py` schema 文件的文件夹路径
3. 系统自动解析并导入所有模型
4. 自动识别父菜单结构

### 自动同步

1. 通过"批量导入"功能导入的模型会记录源文件路径
2. 在界面中编辑模型配置
3. 点击"🔄 自动同步"按钮
4. 修改自动写回到源文件（会自动备份原文件为 `.backup`）

## 开发

### 前端

新增功能模块：在 `static/js/modules/` 目录创建新文件，在 `index.html` 中引入即可。

### 后端

新增API：在 `app.py` 中添加路由，或在 `backend/routes/` 创建新模块。

## 技术栈

- **前端**: Vanilla JavaScript + CSS3
- **后端**: Python Flask
- **数据库**: SQLite

## License

MIT
