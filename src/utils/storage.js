// 本地存储工具类
export class Storage {
    // 获取所有游戏记录
    static getGames() {
        const games = localStorage.getItem('mahjong_games')
        return games ? JSON.parse(games) : []
    }

    // 保存游戏记录
    static saveGames(games) {
        localStorage.setItem('mahjong_games', JSON.stringify(games))
    }

    // 获取单个游戏
    static getGame(gameId) {
        const games = this.getGames()
        return games.find(game => game.id === gameId)
    }

    // 保存单个游戏
    static saveGame(game) {
        const games = this.getGames()
        const existingIndex = games.findIndex(g => g.id === game.id)

        if (existingIndex >= 0) {
            games[existingIndex] = game
        } else {
            games.push(game)
        }

        this.saveGames(games)
    }

    // 删除游戏
    static deleteGame(gameId) {
        const games = this.getGames()
        const filteredGames = games.filter(game => game.id !== gameId)
        this.saveGames(filteredGames)
    }

    // 生成唯一ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2)
    }
}