import {
    createRouter,
    createWebHashHistory
} from 'vue-router'
import Home from '../views/Home.vue'
import Scoring from '../views/Scoring.vue'
import History from '../views/History.vue'

const routes = [{
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/continue/:gameId',
        name: 'ContinueGame',
        component: Home,
        props: true
    },
    {
        path: '/game/:gameId',
        name: 'GameDetail',
        component: Home,
        props: true
    },
    {
        path: '/scoring/:gameId',
        name: 'Scoring',
        component: Scoring,
        props: true
    },
    {
        path: '/history',
        name: 'History',
        component: History
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router