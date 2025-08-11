const express = require('express')
const fs = require('fs')
const path = require('path')
const cors = require('cors')

// 麻将计分工具 v2.0.0 - 后端服务器
// 作者: VerSion1312
// 许可证: MIT

const app = express()
const PORT = process.env.PORT || 5187

// 中间件
app.use(cors())
app.use(express.json())

// 静态文件服务 - 提供前端构建后的文件
app.use(express.static('dist'))

// 数据存储目录
const DATA_DIR = path.join(__dirname, 'room_data')

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
        recursive: true
    })
}

// 获取房间数据文件路径
function getRoomFilePath(roomCode) {
    return path.join(DATA_DIR, `${roomCode}.json`)
}

// 检查房间是否存在
app.get('/api/rooms/:roomCode/exists', (req, res) => {
    const {
        roomCode
    } = req.params
    const filePath = getRoomFilePath(roomCode)
    const exists = fs.existsSync(filePath)
    res.json({
        exists
    })
})

// 创建房间
app.post('/api/rooms/:roomCode', (req, res) => {
    const {
        roomCode
    } = req.params
    const filePath = getRoomFilePath(roomCode)

    // 检查房间是否已存在
    if (fs.existsSync(filePath)) {
        return res.status(409).json({
            error: '房间已存在'
        })
    }

    // 创建新房间数据
    const roomData = {
        roomCode,
        games: [],
        createdAt: Date.now(),
        lastUpdated: Date.now()
    }

    try {
        // 确保数据目录存在
        const dir = path.dirname(filePath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {
                recursive: true
            })
        }

        // 写入文件
        fs.writeFileSync(filePath, JSON.stringify(roomData, null, 2))

        console.log(`房间创建成功: ${roomCode}, 文件路径: ${filePath}`)

        res.json({
            success: true,
            message: '房间创建成功'
        })
    } catch (error) {
        console.error(`创建房间失败: ${roomCode}`, error)
        console.error(`错误详情:`, {
            message: error.message,
            code: error.code,
            path: filePath,
            dir: path.dirname(filePath),
            dirExists: fs.existsSync(path.dirname(filePath)),
            canWrite: fs.accessSync ? (() => {
                try {
                    fs.accessSync(path.dirname(filePath), fs.constants.W_OK)
                    return true
                } catch {
                    return false
                }
            })() : 'unknown'
        })

        res.status(500).json({
            error: '创建房间失败',
            details: error.message
        })
    }
})

// 获取房间所有游戏数据
app.get('/api/rooms/:roomCode/games', (req, res) => {
    const {
        roomCode
    } = req.params
    const filePath = getRoomFilePath(roomCode)

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            error: '房间不存在'
        })
    }

    try {
        const data = fs.readFileSync(filePath, 'utf8')
        const roomData = JSON.parse(data)
        res.json(roomData.games || [])
    } catch (error) {
        res.status(500).json({
            error: '读取数据失败'
        })
    }
})

// 获取特定游戏数据
app.get('/api/rooms/:roomCode/games/:gameId', (req, res) => {
    const {
        roomCode,
        gameId
    } = req.params
    const filePath = getRoomFilePath(roomCode)

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            error: '房间不存在'
        })
    }

    try {
        const data = fs.readFileSync(filePath, 'utf8')
        const roomData = JSON.parse(data)
        const game = roomData.games.find(g => g.id === gameId)

        if (!game) {
            return res.status(404).json({
                error: '游戏不存在'
            })
        }

        res.json(game)
    } catch (error) {
        res.status(500).json({
            error: '读取数据失败'
        })
    }
})

// 保存游戏数据
app.post('/api/rooms/:roomCode/games', (req, res) => {
    const {
        roomCode
    } = req.params
    const gameData = req.body
    const filePath = getRoomFilePath(roomCode)

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            error: '房间不存在'
        })
    }

    try {
        const data = fs.readFileSync(filePath, 'utf8')
        const roomData = JSON.parse(data)

        // 查找现有游戏
        const existingIndex = roomData.games.findIndex(g => g.id === gameData.id)

        if (existingIndex >= 0) {
            // 更新现有游戏
            roomData.games[existingIndex] = gameData
        } else {
            // 添加新游戏
            roomData.games.push(gameData)
        }

        roomData.lastUpdated = Date.now()

        fs.writeFileSync(filePath, JSON.stringify(roomData, null, 2))
        res.json({
            success: true,
            message: '游戏数据保存成功'
        })
    } catch (error) {
        res.status(500).json({
            error: '保存数据失败'
        })
    }
})

// 删除游戏数据
app.delete('/api/rooms/:roomCode/games/:gameId', (req, res) => {
    const {
        roomCode,
        gameId
    } = req.params
    const filePath = getRoomFilePath(roomCode)

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            error: '房间不存在'
        })
    }

    try {
        const data = fs.readFileSync(filePath, 'utf8')
        const roomData = JSON.parse(data)

        roomData.games = roomData.games.filter(g => g.id !== gameId)
        roomData.lastUpdated = Date.now()

        fs.writeFileSync(filePath, JSON.stringify(roomData, null, 2))
        res.json({
            success: true,
            message: '游戏删除成功'
        })
    } catch (error) {
        res.status(500).json({
            error: '删除数据失败'
        })
    }
})

// 获取房间最后更新时间（用于轮询检查）
app.get('/api/rooms/:roomCode/lastUpdated', (req, res) => {
    const {
        roomCode
    } = req.params
    const filePath = getRoomFilePath(roomCode)

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            error: '房间不存在'
        })
    }

    try {
        const data = fs.readFileSync(filePath, 'utf8')
        const roomData = JSON.parse(data)
        res.json({
            lastUpdated: roomData.lastUpdated
        })
    } catch (error) {
        res.status(500).json({
            error: '读取数据失败'
        })
    }
})

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: Date.now(),
        version: '2.0.0'
    })
})

// 为单页面应用提供fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
    // 服务器启动完成
})