// API 通信工具类
export class API {
    static baseURL =
        import.meta.env.PROD ? '' : 'http://localhost:5187'

    // 通用请求方法
    static async request(url, options = {}) {
        const fullURL = `${this.baseURL}${url}`
        const response = await fetch(fullURL, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                error: '网络错误'
            }))
            throw new Error(error.error || '请求失败')
        }

        return response.json()
    }

    // 检查房间是否存在
    static async roomExists(roomCode) {
        try {
            const result = await this.request(`/api/rooms/${roomCode}/exists`)
            return result.exists
        } catch (error) {
            console.error('检查房间存在性失败:', error)
            return false
        }
    }

    // 创建房间
    static async createRoom(roomCode) {
        return this.request(`/api/rooms/${roomCode}`, {
            method: 'POST'
        })
    }

    // 获取房间所有游戏数据
    static async getRoomGames(roomCode) {
        try {
            return await this.request(`/api/rooms/${roomCode}/games`)
        } catch (error) {
            console.error('获取房间游戏数据失败:', error)
            return []
        }
    }

    // 获取特定游戏数据
    static async getGame(roomCode, gameId) {
        try {
            return await this.request(`/api/rooms/${roomCode}/games/${gameId}`)
        } catch (error) {
            console.error('获取游戏数据失败:', error)
            return null
        }
    }

    // 保存游戏数据
    static async saveGame(roomCode, gameData) {
        return this.request(`/api/rooms/${roomCode}/games`, {
            method: 'POST',
            body: JSON.stringify(gameData)
        })
    }

    // 删除游戏数据
    static async deleteGame(roomCode, gameId) {
        return this.request(`/api/rooms/${roomCode}/games/${gameId}`, {
            method: 'DELETE'
        })
    }

    // 获取房间最后更新时间
    static async getRoomLastUpdated(roomCode) {
        try {
            const result = await this.request(`/api/rooms/${roomCode}/lastUpdated`)
            return result.lastUpdated
        } catch (error) {
            console.error('获取房间更新时间失败:', error)
            return 0
        }
    }
}