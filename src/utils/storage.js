import {
    API
} from './api.js'

// 存储工具类 - 现在使用服务器API
export class Storage {
    // 房间相关方法

    // 验证口令格式
    static validateRoomCode(code) {
        if (!code || typeof code !== 'string') return false
        // 允许中文、英文、数字、短横线、下划线
        const pattern = /^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/
        return pattern.test(code) && code.length >= 4 && code.length <= 16
    }

    // 生成随机口令 - 默认中文+数字
    static generateRoomCode() {
        return this.generateChineseCode()
    }

    // 生成中文+数字口令
    static generateChineseCode() {
        // 常用易记的中文词汇
        const words = [
            '麻将', '胡牌', '杠牌', '碰牌', '听牌', '自摸', '点炮', '和牌',
            '东风', '南风', '西风', '北风', '红中', '发财', '白板',
            '万子', '条子', '筒子', '花牌', '春夏', '秋冬', '梅兰', '竹菊',
            '天胡', '地胡', '人胡', '大四喜', '小四喜', '清一色', '混一色', '七对',
            '国士无双', '九莲宝灯', '四暗刻', '混全', '清全', '十三幺', '龙七对', '十三不靠', '金钩钓',
            '快乐', '幸运', '平安', '顺利', '发达', '富贵',
            "一万", "贰万", "叁万", "四万", "伍万", "六万", "七万", "八万", "九万",
            "幺鸡", "二条", "三条", "四条", "五条", "六条", "七条", "八条", "九条",
            "一筒", "二筒", "三筒", "四筒", "五筒", "六筒", "七筒", "八筒", "九筒",
        ]

        // 随机选择一个词汇
        const word = words[Math.floor(Math.random() * words.length)]

        // 生成2-3位数字，数字始终在中文尾部
        const numberLength = Math.random() > 0.5 ? 2 : 3
        let number = ''
        for (let i = 0; i < numberLength; i++) {
            number += Math.floor(Math.random() * 10)
        }

        return word + number
    }

    // 获取当前房间口令
    static getCurrentRoomCode() {
        return localStorage.getItem('mahjong_current_room')
    }

    // 设置当前房间口令
    static setCurrentRoomCode(code) {
        localStorage.setItem('mahjong_current_room', code)
    }

    // 清除当前房间
    static clearCurrentRoom() {
        localStorage.removeItem('mahjong_current_room')
    }

    // 检查房间是否存在
    static async roomExists(code) {
        return await API.roomExists(code)
    }

    // 创建房间
    static async createRoom(code) {
        return await API.createRoom(code)
    }

    // 获取所有游戏记录（基于当前房间）
    static async getGames() {
        const currentRoom = this.getCurrentRoomCode()
        if (!currentRoom) return []
        return await API.getRoomGames(currentRoom)
    }

    // 获取单个游戏
    static async getGame(gameId) {
        const currentRoom = this.getCurrentRoomCode()
        if (!currentRoom) return null
        return await API.getGame(currentRoom, gameId)
    }

    // 保存单个游戏
    static async saveGame(game) {
        const currentRoom = this.getCurrentRoomCode()
        if (!currentRoom) return
        return await API.saveGame(currentRoom, game)
    }

    // 删除游戏
    static async deleteGame(gameId) {
        const currentRoom = this.getCurrentRoomCode()
        if (!currentRoom) return
        return await API.deleteGame(currentRoom, gameId)
    }

    // 生成唯一ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2)
    }

    // 获取房间最后更新时间（用于轮询）
    static async getRoomLastUpdated() {
        const currentRoom = this.getCurrentRoomCode()
        if (!currentRoom) return 0
        return await API.getRoomLastUpdated(currentRoom)
    }
}