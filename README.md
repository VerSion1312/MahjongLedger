# 麻将计分工具 v2.0.0

一个专为麻将比赛设计的多用户实时计分记录工具，支持房间系统、实时数据同步和二维码分享功能。

## ✨ 新版本特性 (v2.0.0)

### 🏠 房间系统
- **房间创建**：支持自定义口令或系统自动生成
- **房间加入**：通过口令快速加入房间
- **多用户同步**：多个终端实时查看相同数据
- **房间管理**：房间信息展示、退出房间功能

### 📱 二维码分享
- **一键生成**：自动生成房间专属二维码
- **扫码加入**：其他用户扫描二维码直接加入
- **链接分享**：复制房间链接分享给好友
- **下载功能**：下载二维码图片保存到本地

### 🔄 实时同步
- **数据同步**：多终端数据实时更新
- **状态同步**：游戏状态、计分记录实时同步
- **操作同步**：任一终端操作，其他终端自动刷新

### 🎮 增强功能
- **再来一局**：基于历史记录快速开始新游戏
- **智能跳转**：加入房间时自动进入进行中的游戏
- **优化界面**：更直观的房间信息展示

## 🎯 核心功能

### 选手管理
- 支持2-4名选手参与
- 自动生成彩色头像
- 选手信息实时同步

### 实时计分
- 单局计分，自动计算总分
- 确保总和为0的验证机制
- 多终端实时更新计分状态

### 历史记录
- 完整的游戏记录查看
- 支持查看和删除操作
- 基于历史记录快速重开

### 房间系统
- 口令创建/加入房间
- 房间信息管理
- 多用户数据共享

## 🛠️ 技术栈

### 前端
- **Vue 3**：主框架，使用Composition API
- **Vue Router**：路由管理，支持路由守卫
- **Element Plus**：UI组件库，提供丰富组件
- **Vite**：现代化构建工具

### 后端
- **Node.js**：服务器运行环境
- **Express**：轻量级Web框架
- **文件系统**：JSON文件存储，无需数据库

### 数据同步
- **RESTful API**：前后端通信
- **轮询机制**：实时数据同步
- **CORS支持**：跨域请求处理

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 开发模式
```bash
# 同时启动前端和后端
npm run dev:full

# 或分别启动
npm run dev        # 前端开发服务器
npm run server     # 后端服务器
```

### 3. 生产部署
```bash
# 构建并启动生产服务器
npm run deploy

# 或分步执行
npm run build      # 构建前端
npm start          # 启动生产服务器
```

### 4. 访问应用
- 开发模式：http://localhost:5173
- 生产模式：http://localhost:5187

## 📁 项目结构

```
MahjongLedger/
├── src/
│   ├── components/          # 组件
│   │   └── PlayerAvatar.vue # 选手头像组件
│   ├── views/              # 页面
│   │   ├── Home.vue        # 主界面（房间管理）
│   │   ├── Scoring.vue     # 计分界面
│   │   └── History.vue     # 历史记录界面
│   ├── router/             # 路由配置
│   │   └── index.js
│   ├── utils/              # 工具类
│   │   ├── storage.js      # 数据存储抽象层
│   │   ├── api.js          # API客户端
│   │   └── dataSync.js     # 数据同步服务
│   ├── App.vue            # 根组件
│   └── main.js            # 入口文件
├── server.js              # Express后端服务器
├── dev.js                 # 开发环境启动脚本
├── package.json           # 项目配置
└── DEPLOY.md              # 部署指南
```

## 📖 使用说明

### 创建/加入房间
1. **创建房间**：
   - 选择"创建房间"标签
   - 输入自定义口令或点击"随机生成"
   - 点击"创建房间"按钮

2. **加入房间**：
   - 选择"加入房间"标签
   - 输入房间口令
   - 点击"加入房间"按钮

3. **二维码分享**：
   - 点击房间信息按钮
   - 扫描二维码或复制链接
   - 其他用户可直接加入

### 游戏流程
1. **添加选手**：在房间内添加2-4名选手
2. **开始游戏**：点击"开始计分"开始新游戏
3. **记录得分**：每局结束后记录各选手得分
4. **游戏结算**：点击"结算"结束游戏
5. **查看历史**：在历史记录中查看完整数据

### 实时同步
- 任一终端操作后，其他终端自动刷新
- 加入房间时自动检测进行中的游戏
- 数据实时保存到服务器

## 🌐 部署指南

### 单机部署
```bash
# 构建并启动
npm run deploy

# 使用PM2管理进程
pm2 start server.js --name mahjong-ledger
```

### Nginx反向代理
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5187;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Docker部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5187
CMD ["npm", "start"]
```

详细部署说明请参考 [DEPLOY.md](./DEPLOY.md)

## 🔧 开发说明

### 开发环境
- Node.js 16+
- npm 8+
- 现代浏览器支持

### 代码规范
- Vue 3 Composition API
- ES6+ 语法
- 响应式设计优先
- 组件化开发

### API接口
```javascript
// 房间管理
GET    /api/room/:roomCode/exists     # 检查房间是否存在
POST   /api/room                      # 创建房间

// 游戏数据
GET    /api/room/:roomCode/games      # 获取房间所有游戏
GET    /api/room/:roomCode/game/:id   # 获取特定游戏
POST   /api/room/:roomCode/game       # 保存游戏数据
DELETE /api/room/:roomCode/game/:id   # 删除游戏
GET    /api/room/:roomCode/last-updated # 获取最后更新时间
```

### 数据结构
```javascript
// 房间对象
{
  roomCode: String,        // 房间口令
  createdAt: Number,       // 创建时间戳
  lastUpdated: Number      // 最后更新时间
}

// 游戏对象
{
  id: String,              // 游戏唯一ID
  players: Array,          // 选手列表
  rounds: Array,           // 局数记录
  status: String,          // 'playing' | 'finished'
  startTime: Number,       // 开始时间戳
  endTime: Number          // 结束时间戳
}

// 选手对象
{
  id: String,              // 选手唯一ID
  name: String,            // 选手姓名
  color: String,           // 头像颜色
  totalScore: Number       // 当前总分
}
```

## 🌟 特色功能

### 智能口令系统
- 支持中文、英文、数字、短横线、下划线
- 长度限制：4-16字符
- 自动生成非生僻中文+数字组合

### 二维码分享
- 高质量二维码生成
- 美观的UI设计
- 一键下载功能

### 实时数据同步
- 轻量级轮询机制
- 自动检测数据更新
- 多终端状态同步

### 响应式设计
- 移动端优先
- 自适应各种屏幕
- 触摸友好交互

## 📱 浏览器支持

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+
- 移动端浏览器

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 👨‍💻 作者

**VerSion1312**

- GitHub: [@VerSion1312](https://github.com/VerSion1312)
- 个人主页:[白泽文档库](https://www.version-carol.cn/#/)

## 📝 更新日志

### v2.0.0 (2024-01-XX)
- ✨ 新增房间系统，支持多用户实时同步
- ✨ 新增二维码分享功能
- ✨ 新增实时数据同步机制
- ✨ 新增"再来一局"功能
- ✨ 新增房间信息管理
- 🔧 重构为前后端分离架构
- 🔧 使用文件系统存储替代本地存储
- 🎨 优化用户界面和交互体验
- 🐛 修复多个已知问题

### v1.0.0 (2023-XX-XX)
- 🎉 初始版本发布
- ✨ 基础计分功能
- ✨ 选手管理系统
- ✨ 历史记录功能
- ✨ 响应式设计

---

⭐ 如果这个项目对你有帮助，请给它一个星标！ 