import {
    Storage
} from './storage.js'

// 数据同步服务
export class DataSync {
    static instance = null
    static pollingInterval = null
    static listeners = new Map()
    static lastUpdated = 0
    static isPolling = false

    // 获取单例实例
    static getInstance() {
        if (!this.instance) {
            this.instance = new DataSync()
        }
        return this.instance
    }

    // 开始轮询
    static startPolling(intervalMs = 3000) {
        if (this.isPolling) return

        this.isPolling = true

        this.pollingInterval = setInterval(async () => {
            await this.checkForUpdates()
        }, intervalMs)

        // 立即执行一次检查
        this.checkForUpdates()
    }

    // 停止轮询
    static stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval)
            this.pollingInterval = null
            this.isPolling = false
        }
    }

    // 检查更新
    static async checkForUpdates() {
        try {
            const currentRoom = Storage.getCurrentRoomCode()
            if (!currentRoom) return

            const lastUpdated = await Storage.getRoomLastUpdated()
            if (lastUpdated > this.lastUpdated) {
                this.lastUpdated = lastUpdated
                await this.notifyListeners('dataUpdated')
            }
        } catch (error) {
            console.error('检查数据更新失败:', error)
        }
    }

    // 添加监听器
    static addListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set())
        }
        this.listeners.get(event).add(callback)
    }

    // 移除监听器
    static removeListener(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback)
        }
    }

    // 通知监听器
    static async notifyListeners(event, data = null) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event)
            for (const callback of callbacks) {
                try {
                    await callback(data)
                } catch (error) {
                    console.error('监听器回调执行失败:', error)
                }
            }
        }
    }

    // 手动触发数据更新
    static async triggerUpdate() {
        this.lastUpdated = Date.now()
        await this.notifyListeners('dataUpdated')
    }

    // 重置状态
    static reset() {
        this.stopPolling()
        this.listeners.clear()
        this.lastUpdated = 0
    }
}