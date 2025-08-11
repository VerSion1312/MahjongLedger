# 麻将计分工具 v2.0.0 - 部署指南

> 作者: VerSion1312  
> 许可证: MIT  
> 版本: v2.0.0

## 🚀 一键部署方案

现在的架构非常简单：
- **构建**: `npm run build` 生成 `dist/` 文件夹
- **运行**: `npm start` 启动Express服务器，同时托管静态文件和API
- **端口**: 只需要一个端口 (默认5187)，没有跨域问题

## 📦 生产部署步骤

### 1. 本地构建
```bash
# 安装依赖
npm install

# 构建前端
npm run build

# 启动生产服务器（测试）
npm start
```

### 2. 服务器部署

#### 方案一：直接使用Express服务器（推荐）
```bash
# 在服务器上
git clone <your-repo>
cd mahjong-ledger
npm install --production
npm run build
npm start
```

服务器会在端口5187运行，包含：
- 静态文件服务（前端页面）
- API接口（/api/*)
- 自动处理单页面应用路由

#### 方案二：Nginx反向代理
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5187;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 方案三：纯Nginx静态文件服务（仅前端）
如果你只想要静态文件，不需要多终端同步功能：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/mahjong-ledger/dist;
    index index.html;
    
    # 处理Vue Router的路由
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 🔧 环境变量配置

在服务器上可以设置环境变量：
```bash
export PORT=5187
export NODE_ENV=production
npm start
```

或者创建 `.env` 文件：
```env
PORT=5187
NODE_ENV=production
```

## 🐳 Docker部署（可选）

创建 `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 5187
CMD ["npm", "start"]
```

构建和运行：
```bash
docker build -t mahjong-ledger .
docker run -d -p 5187:5187 -v ./room_data:/app/room_data mahjong-ledger
```

## 📁 数据目录

确保 `room_data/` 目录有正确的权限：
```bash
mkdir -p room_data
chmod 755 room_data
chown your-user:your-group room_data
```

## 🔒 HTTPS配置

### Nginx HTTPS配置
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5187;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 🖥️ 系统服务配置

### Systemd服务文件
创建 `/etc/systemd/system/mahjong-ledger.service`:
```ini
[Unit]
Description=Mahjong Ledger App
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/mahjong-ledger
Environment=NODE_ENV=production
Environment=PORT=5187
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl daemon-reload
sudo systemctl enable mahjong-ledger
sudo systemctl start mahjong-ledger
sudo systemctl status mahjong-ledger
```

## 📊 监控和日志

### PM2管理（推荐）
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name mahjong-ledger

# 查看状态
pm2 status
pm2 logs mahjong-ledger

# 设置开机自启
pm2 startup
pm2 save
```

### 日志轮转
```bash
# PM2自动日志轮转
pm2 install pm2-logrotate
```

## 🔍 故障排除

### 常见问题
1. **端口被占用**: 修改 `PORT` 环境变量
2. **权限问题**: 确保 `room_data/` 目录权限正确
3. **内存不足**: 建议至少512MB内存
4. **文件描述符**: 检查 `ulimit -n` 设置

### 检查服务状态
```bash
# 检查端口
netstat -tulpn | grep :5187

# 检查进程
ps aux | grep node

# 检查日志
tail -f /var/log/your-app.log
```

## 📈 性能优化

### Nginx缓存配置
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location /api/ {
    proxy_pass http://localhost:3000;
    proxy_cache_bypass $http_pragma;
    proxy_cache_revalidate on;
}
```

### Gzip压缩
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/json
    application/javascript
    application/xml+rss
    application/atom+xml
    image/svg+xml;
```

现在部署就非常简单了：
1. `npm run build` - 构建前端
2. `npm start` - 启动服务器（包含前端和API）
3. 通过Nginx反向代理或直接访问端口5187

没有跨域问题，只需要管理一个端口！ 