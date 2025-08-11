import {
    createRouter,
    createWebHashHistory
} from 'vue-router'
import Home from '../views/Home.vue'
import Scoring from '../views/Scoring.vue'
import History from '../views/History.vue'
import {
    Storage
} from '../utils/storage.js'

const routes = [{
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/join/:roomCode',
        name: 'JoinRoom',
        component: Home,
        props: true
    },
    {
        path: '/continue/:gameId',
        name: 'ContinueGame',
        component: Home,
        props: true,
        meta: {
            requiresRoom: true
        }
    },
    {
        path: '/game/:gameId',
        name: 'GameDetail',
        component: Home,
        props: true,
        meta: {
            requiresRoom: true
        }
    },
    {
        path: '/scoring/:gameId',
        name: 'Scoring',
        component: Scoring,
        props: true,
        meta: {
            requiresRoom: true
        }
    },
    {
        path: '/history',
        name: 'History',
        component: History,
        meta: {
            requiresRoom: true
        }
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

// 路由守卫 - 检查房间状态
router.beforeEach(async (to, from, next) => {
    // 检查是否需要房间验证
    if (to.meta.requiresRoom) {
        const currentRoom = Storage.getCurrentRoomCode()

        // 如果没有当前房间，重定向到首页
        if (!currentRoom) {
            Storage.clearCurrentRoom()
            next('/')
            return
        }

        // 异步检查房间是否存在（但不阻塞导航）
        try {
            const exists = await Storage.roomExists(currentRoom)
            if (!exists) {
                Storage.clearCurrentRoom()
                next('/')
                return
            }
        } catch (error) {
            // 网络错误时，允许通过但记录错误
            console.warn('房间验证失败，允许继续:', error)
        }
    }

    next()
})

export default router