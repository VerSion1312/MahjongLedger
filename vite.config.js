import {
    defineConfig
} from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    server: {
        port: 5173,
        host: true
    },
    optimizeDeps: {
        force: true // 强制重新构建依赖
    },
    cacheDir: './node_modules/.vite-cache' // 使用自定义缓存目录
})