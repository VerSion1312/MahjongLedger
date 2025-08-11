<template>
    <div class="history-container">
      <!-- 顶部导航 -->
      <div class="header">
              <el-button 
        class="home-btn" 
        :icon="House" 
        circle 
        @click="goToHome"
      />
      <h1 class="title">数据</h1>
      <div class="header-right">
        <el-button 
          class="room-code-btn"
          @click="showRoomInfo"
          title="点击查看房间信息"
        >
          <el-icon><InfoFilled /></el-icon>
          <span>{{ currentRoomCode }}</span>
        </el-button>
      </div>
      </div>
  
      <!-- 状态切换标签 -->
      <div class="status-tabs">
        <div 
          class="tab-item"
          :class="{ active: activeTab === 'playing' }"
          @click="switchTab('playing')"
        >
          进行中
        </div>
        <div 
          class="tab-item"
          :class="{ active: activeTab === 'finished' }"
          @click="switchTab('finished')"
        >
          已结束
        </div>
      </div>
  
      <!-- 筛选控件 -->
      <div v-if="activeTab === 'finished'" class="filter-section">
        <div class="filter-label">最近记录</div>
        <el-select 
          v-model="selectedMonth" 
          placeholder="选择月份"
          size="small"
          @change="onMonthChange"
        >
          <el-option
            v-for="month in availableMonths"
            :key="month.value"
            :label="month.label"
            :value="month.value"
          />
        </el-select>
      </div>
  
      <!-- 游戏记录列表 -->
      <div class="records-section">
        <div v-if="filteredGames.length === 0" class="empty-state">
          <el-empty description="暂无记录" />
        </div>
        
        <div 
          v-for="game in filteredGames"
          :key="game.id"
          class="record-item"
          @click="enterGame(game)"
        >
          <!-- 选手头像和分数 -->
          <div class="players-info">
            <div 
              v-for="player in game.players"
              :key="player.id"
              class="player-score"
            >
              <PlayerAvatar 
                :name="player.name" 
                size="small"
                :color="player.color"
              />
              <div 
                class="score"
                :class="{ 
                  'positive': getPlayerTotalScore(game, player.id) > 0, 
                  'negative': getPlayerTotalScore(game, player.id) < 0 
                }"
              >
                {{ getPlayerTotalScore(game, player.id) }}
              </div>
            </div>
          </div>
  
          <!-- 游戏时间 -->
          <div class="game-time">
            {{ formatGameTime(game.startTime) }}
          </div>
  
                  <!-- 删除按钮 -->
        <div class="actions">
          <el-button 
            class="delete-btn"
            :icon="Delete"
            text
            size="small"
            @click.stop="confirmDelete(game)"
          />
        </div>
        </div>
      </div>
  
          <!-- 移除底部导航栏 -->
      
      <!-- 房间信息对话框 -->
      <el-dialog v-model="showRoomInfoDialog" title="房间信息" width="80%" center>
        <div class="room-info-content">
          <div class="room-code-display">
            <div class="room-code-label">房间口令</div>
            <div class="room-code-value">{{ currentRoomCode }}</div>
            <el-button type="primary" size="small" @click="copyRoomCode">复制口令</el-button>
          </div>
        </div>
      </el-dialog>
    </div>
  </template>
  
  <script>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, House, InfoFilled } from '@element-plus/icons-vue'
import PlayerAvatar from '../components/PlayerAvatar.vue'
import { Storage } from '../utils/storage.js'
import { DataSync } from '../utils/dataSync.js'
  
  export default {
  name: 'History',
  components: {
    PlayerAvatar
  },
    setup() {
      const router = useRouter()
      
      // 数据状态
      const games = ref([])
      const activeTab = ref('finished')
      const selectedMonth = ref('')
      const currentRoomCode = ref('')
      const showRoomInfoDialog = ref(false)
      
      // 计算属性
      const playingGames = computed(() => {
        return games.value.filter(game => game.status === 'playing')
      })
      
      const finishedGames = computed(() => {
        return games.value.filter(game => game.status === 'finished')
          .sort((a, b) => b.startTime - a.startTime) // 按开始时间倒序排列
      })
      
      const filteredGames = computed(() => {
        if (activeTab.value === 'playing') {
          return playingGames.value
        }
        
        if (!selectedMonth.value) {
          return finishedGames.value
        }
        
        // 根据选择的月份筛选
        const [year, month] = selectedMonth.value.split('-')
        return finishedGames.value.filter(game => {
          const gameDate = new Date(game.startTime)
          return gameDate.getFullYear() == year && (gameDate.getMonth() + 1) == month
        })
      })
      
      const availableMonths = computed(() => {
        const months = new Set()
        
        finishedGames.value.forEach(game => {
          const date = new Date(game.startTime)
          const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          months.add(yearMonth)
        })
        
        return Array.from(months)
          .sort((a, b) => b.localeCompare(a)) // 按时间倒序
          .map(month => {
            const [year, monthNum] = month.split('-')
            return {
              value: month,
              label: `${year}年${monthNum}月`
            }
          })
      })
      
      // 方法
      const loadGames = async () => {
        games.value = await Storage.getGames()
      }
      
      const switchTab = (tab) => {
        activeTab.value = tab
        if (tab === 'playing') {
          selectedMonth.value = ''
        }
      }
      
      const onMonthChange = () => {
        // 月份改变时的处理
      }
      
      const getPlayerTotalScore = (game, playerId) => {
        return game.rounds.reduce((total, round) => {
          return total + (round.scores[playerId] || 0)
        }, 0)
      }
      
      const formatGameTime = (timestamp) => {
        const date = new Date(timestamp)
        const now = new Date()
        const isToday = date.toDateString() === now.toDateString()
        
        if (isToday) {
          return `今天 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
        }
        
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        const isYesterday = date.toDateString() === yesterday.toDateString()
        
        if (isYesterday) {
          return `昨天 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
        }
        
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
      }
      
          const enterGame = (game) => {
      if (game.status === 'playing') {
        // 进行中的游戏，跳转到继续游戏页面
        router.push(`/continue/${game.id}`)
      } else {
        // 已结束的游戏，跳转到游戏详情页面
        router.push(`/game/${game.id}`)
      }
    }
      
      const confirmDelete = async (game) => {
        try {
          await ElMessageBox.confirm(
            `确认删除这场游戏记录吗？`, 
            '删除确认', 
            {
              confirmButtonText: '删除',
              cancelButtonText: '取消',
              type: 'warning',
              confirmButtonClass: 'el-button--danger'
            }
          )
          
          await Storage.deleteGame(game.id)
          await loadGames()
          ElMessage.success('删除成功')
        } catch {
          // 用户取消
        }
      }
      
          const goToHome = () => {
      router.push('/')
    }
    
    const showRoomInfo = () => {
      showRoomInfoDialog.value = true
    }
    
    const copyRoomCode = async () => {
      try {
        await navigator.clipboard.writeText(currentRoomCode.value)
        ElMessage.success('口令已复制到剪贴板')
      } catch {
        ElMessage.warning('复制失败，请手动复制')
      }
    }
      
      // 数据同步回调
      const handleDataUpdate = async () => {
        await loadGames()
      }
      
      // 初始化
      onMounted(async () => {
        // 获取当前房间口令
        currentRoomCode.value = Storage.getCurrentRoomCode()
        
        await loadGames()
        // 默认选择最近的月份
        if (availableMonths.value.length > 0) {
          selectedMonth.value = availableMonths.value[0].value
        }
        
        // 开始数据同步
        DataSync.startPolling()
        DataSync.addListener('dataUpdated', handleDataUpdate)
      })
      
      // 清理
      onUnmounted(() => {
        DataSync.removeListener('dataUpdated', handleDataUpdate)
      })
      
      return {
        games,
        activeTab,
        selectedMonth,
        currentRoomCode,
        showRoomInfoDialog,
        playingGames,
        finishedGames,
        filteredGames,
        availableMonths,
        switchTab,
        onMonthChange,
        getPlayerTotalScore,
              formatGameTime,
      enterGame,
      confirmDelete,
            goToHome,
        showRoomInfo,
        copyRoomCode,
      // 图标
      Delete,
      House,
      InfoFilled
      }
    }
  }
  </script>
  
  <style scoped>
  .history-container {
    min-height: 100vh;
    background-color: #f5f5f5;
    display: flex;
    flex-direction: column;
  }
  
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background-color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .title {
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin: 0;
  }
  
  .header-right {
    display: flex;
    align-items: center;
  }
  
  .room-code-btn {
    border-radius: 20px;
    background-color: #409EFF;
    border: 1px solid #409EFF;
    color: white;
    font-size: 12px;
    padding: 8px 16px;
    white-space: nowrap;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .room-code-btn:hover {
    background-color: #337ecc;
    border-color: #337ecc;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
  }

  .room-code-btn:active {
    transform: translateY(0);
  }

  .room-code-btn .el-icon {
    font-size: 14px;
  }
  
  .status-tabs {
    display: flex;
    background-color: white;
    margin: 16px;
    border-radius: 12px;
    padding: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .tab-item {
    flex: 1;
    text-align: center;
    padding: 12px;
    border-radius: 8px;
    font-weight: 500;
    color: #666;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .tab-item.active {
    background-color: #67c23a;
    color: white;
  }
  
  .filter-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    margin-bottom: 16px;
  }
  
  .filter-label {
    font-size: 16px;
    font-weight: 500;
    color: #333;
  }
  
  .records-section {
  flex: 1;
  padding: 0 16px 16px 16px;
}
  
  .empty-state {
    text-align: center;
    padding: 60px 20px;
  }
  
  .record-item {
    background-color: white;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: transform 0.2s;
    position: relative;
  }
  
  .record-item:hover {
    transform: translateY(-2px);
  }
  
  .record-item:active {
    transform: translateY(0);
  }
  
  .players-info {
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .player-score {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  
  .score {
    font-size: 14px;
    font-weight: bold;
    text-align: center;
  }
  
  .score.positive {
    color: #f56c6c;
  }
  
  .score.negative {
    color: #67c23a;
  }
  
  .game-time {
    text-align: center;
    font-size: 12px;
    color: #999;
  }
  
  .actions {
  position: absolute;
  bottom: 12px;
  right: 12px;
}

.delete-btn {
  color: #f56c6c;
  background: none;
  border: none;
  padding: 4px;
}

.delete-btn:hover {
  color: #f78989;
  background-color: rgba(245, 108, 108, 0.1);
}

.room-info-content {
  text-align: center;
}

.room-code-display {
  margin-bottom: 20px;
}

.room-code-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.room-code-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  word-break: break-all;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #409EFF;
  display: inline-block;
  margin-bottom: 15px;
  letter-spacing: 2px;
}
  
  /* 移除底部导航样式 */
  
  /* Element Plus 组件样式覆盖 */
  :deep(.el-select) {
    width: 120px;
  }
  
  /* 移动端优化 */
  @media (max-width: 768px) {
    .status-tabs {
      margin: 12px;
    }
    
      .records-section {
    padding: 0 12px 16px 12px;
  }
    
    .record-item {
      margin-bottom: 8px;
      padding: 12px;
    }
  }
  
  /* 桌面端优化 */
@media (min-width: 1025px) {
  .history-container {
    max-width: 400px;
    margin: 0 auto;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  }
}
  </style>