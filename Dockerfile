# 多阶段构建 Dockerfile
# 麻将计分工具 v2.0.0
# 作者: VerSion1312
# 许可证: MIT

# 第一阶段：构建前端
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 第二阶段：生产环境
FROM node:18-alpine AS production

# 设置工作目录
WORKDIR /app

# 安装生产依赖
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 从构建阶段复制构建后的前端文件
COPY --from=builder /app/dist ./dist

# 复制服务器文件
COPY server.js ./
COPY dev.js ./

# 创建数据目录并设置正确的权限
RUN mkdir -p room_data && \
    chmod 755 room_data && \
    chown -R 1818:1818 room_data

# 创建非root用户
RUN addgroup -g 1818 -S mahjong && \
    adduser -S mahjong -u 1818

# 更改文件所有权
RUN chown -R mahjong:mahjong /app

# 切换到非root用户
USER mahjong

# 暴露端口
EXPOSE 5187

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=5187

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5187/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# 启动命令
CMD ["node", "server.js"] 