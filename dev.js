const {
    spawn
} = require('child_process')

// 麻将计分工具 v2.0.0 - 开发环境启动脚本
// 作者: VerSion1312
// 许可证: MIT

// 启动后端服务器
const server = spawn('node', ['server.js'], {
    stdio: 'inherit'
})

// 启动前端开发服务器
const frontend = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
})

// 处理退出信号
process.on('SIGINT', () => {
    server.kill()
    frontend.kill()
    process.exit()
})

// 开发服务器启动中...