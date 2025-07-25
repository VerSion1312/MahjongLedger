<template>
  <div class="home-container">
    <!-- 顶部导航 -->
    <div class="header">
      <el-button 
        v-if="isScoring || isViewingHistory" 
        class="back-btn" 
        :icon="ArrowLeft" 
        circle 
        @click="goBack"
      />
      <h1 class="title">
        {{ isViewingHistory ? '历史详情' : (isScoring ? '麻将计分' : '麻将账本') }}
      </h1>
      <div class="header-right">
        <el-button 
          v-if="!isScoring && !isViewingHistory"
          class="history-btn" 
          @click="goToHistory"
        >
          历史记录
        </el-button>
      </div>
    </div>

    <!-- 参与者区域 -->
    <div class="players-section">
      <!-- 提示文本 -->
      <div v-if="!isScoring && !isViewingHistory && currentPlayers.length === 0" class="empty-hint">
        <div class="hint-icon">🀄</div>
        <div class="hint-title">欢迎使用麻将账本</div>
        <div class="hint-text">点击下方加号添加选手开始记分</div>
      </div>
      
      <div class="players-grid">
        <!-- 现有选手 -->
        <div 
          v-for="(player, index) in currentPlayers" 
          :key="player.id"
          class="player-card"
          :class="{ 'scoring-mode': isScoring }"
        >
          <PlayerAvatar 
            :name="player.name" 
            :size="isScoring ? 'medium' : 'large'"
            :color="player.color"
          />
          <div v-if="isScoring || isViewingHistory" class="player-score">
            <div class="player-name">{{ getDisplayName(player.name) }}</div>
            <div 
              class="score-value"
              :class="{ 'positive': player.totalScore > 0, 'negative': player.totalScore < 0 }"
            >
              {{ player.totalScore > 0 ? '+' : '' }}{{ player.totalScore }}
            </div>
          </div>
          <el-button 
            v-if="!isScoring && !isViewingHistory"
            class="remove-btn" 
            :icon="Minus" 
            circle 
            size="small"
            @click="removePlayer(index)"
          />
        </div>

        <!-- 添加选手按钮 -->
        <div 
          v-if="!isScoring && !isViewingHistory && currentPlayers.length < 4" 
          class="add-player-card"
          @click="showAddDialog = true"
        >
          <el-button class="add-btn" :icon="Plus" circle size="large" />
        </div>
      </div>
    </div>

    <!-- 计分历史区域 -->
    <div v-if="isScoring || isViewingHistory" class="history-section">
      <div class="history-header">
        <div class="header-layout">
          <div class="round-header">局数</div>
          <div class="player-names">
            <div 
              v-for="player in currentPlayers" 
              :key="player.id"
              class="player-name-header"
            >
              <PlayerAvatar 
                :name="player.name" 
                size="small"
                :color="player.color"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="history-list">
        <div 
          v-for="(round, index) in reversedRounds" 
          :key="round.timestamp"
          class="history-item"
        >
          <div class="round-info">
            <div class="round-number">第{{ currentGame.rounds.length - index }}局</div>
            <div class="round-time">{{ formatTime(round.timestamp) }}</div>
          </div>
          <div class="round-scores">
            <div 
              v-for="(score, playerId) in round.scores" 
              :key="playerId"
              class="round-score"
              :class="{ 'positive': score > 0, 'negative': score < 0, 'zero': score === 0 }"
            >
              {{ score > 0 ? '+' : '' }}{{ score }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div v-if="!isViewingHistory" class="bottom-buttons">
      <el-button 
        v-if="!isScoring"
        type="primary" 
        size="large" 
        class="start-btn"
        :disabled="currentPlayers.length < 2"
        @click="startGame"
      >
        开始计分
      </el-button>
      
      <template v-else>
        <el-button 
          type="primary" 
          size="large" 
          class="score-btn"
          @click="goToScoring"
        >
          计分
        </el-button>
        <el-button 
          type="success" 
          size="large" 
          class="settle-btn"
          @click="confirmSettle"
        >
          结算
        </el-button>
      </template>
    </div>

    <!-- 添加选手对话框 -->
    <el-dialog v-if="!isViewingHistory" v-model="showAddDialog" title="添加选手" width="80%" center>
      <el-form @submit.prevent="addPlayer">
        <el-form-item label="选手姓名">
          <el-input 
            v-model="newPlayerName" 
            placeholder="请输入选手姓名"
            maxlength="10"
            ref="nameInput"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addPlayer">确定</el-button>
      </template>
    </el-dialog>

    <!-- 移除菜单抽屉 -->
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Minus, Plus } from '@element-plus/icons-vue'
import PlayerAvatar from '../components/PlayerAvatar.vue'
import { Storage } from '../utils/storage.js'

export default {
  name: 'Home',
  components: {
    PlayerAvatar
  },
  props: {
    gameId: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const router = useRouter()
    const route = useRoute()
    
    // 数据状态
    const currentPlayers = ref([])
    const currentGame = ref(null)
    const showAddDialog = ref(false)
    const showMenu = ref(false)
    const newPlayerName = ref('')
    const nameInput = ref(null)
    
    // 计算属性
    const isScoring = computed(() => {
      return (currentGame.value && currentGame.value.status === 'playing') || isContinuingGame.value
    })
    
    const isViewingHistory = computed(() => {
      return props.gameId && currentGame.value && currentGame.value.status === 'finished'
    })
    
    const isContinuingGame = computed(() => {
      return route.name === 'ContinueGame' && currentGame.value && currentGame.value.status === 'playing'
    })
    
    const reversedRounds = computed(() => {
      if (!currentGame.value || !currentGame.value.rounds) return []
      // 返回反转的数组，最新的记录在最前面
      return [...currentGame.value.rounds].reverse()
    })
    
    // 方法
    const addPlayer = () => {
      if (!newPlayerName.value.trim()) {
        ElMessage.warning('请输入选手姓名')
        return
      }
      
      if (currentPlayers.value.some(p => p.name === newPlayerName.value.trim())) {
        ElMessage.warning('选手姓名已存在')
        return
      }
      
      const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C']
      const player = {
        id: Storage.generateId(),
        name: newPlayerName.value.trim(),
        color: colors[currentPlayers.value.length % colors.length],
        totalScore: 0
      }
      
      currentPlayers.value.push(player)
      newPlayerName.value = ''
      showAddDialog.value = false
      ElMessage.success('添加成功')
    }
    
    const removePlayer = (index) => {
      currentPlayers.value.splice(index, 1)
    }
    
    const startGame = () => {
      if (currentPlayers.value.length < 2) {
        ElMessage.warning('至少需要2名选手才能开始游戏')
        return
      }
      
      // 检查是否有进行中的游戏
      const games = Storage.getGames()
      const playingGame = games.find(game => game.status === 'playing')
      
      if (playingGame) {
        ElMessage.warning('已有进行中的游戏，请先结算或从历史记录继续')
        return
      }
      
      const game = {
        id: Storage.generateId(),
        players: [...currentPlayers.value],
        rounds: [],
        status: 'playing',
        startTime: Date.now()
      }
      
      currentGame.value = game
      Storage.saveGame(game)
      ElMessage.success('游戏开始')
    }
    
    const goToScoring = () => {
      if (!currentGame.value) return
      router.push(`/scoring/${currentGame.value.id}`)
    }
    
    const confirmSettle = async () => {
      try {
        await ElMessageBox.confirm('确认结算当前游戏吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        currentGame.value.status = 'finished'
        currentGame.value.endTime = Date.now()
        Storage.saveGame(currentGame.value)
        
        // 重置状态
        currentGame.value = null
        currentPlayers.value = []
        
        ElMessage.success('游戏已结算')
      } catch {
        // 用户取消
      }
    }
    
    const goToHistory = () => {
      router.push('/history')
    }
    
    const goBack = () => {
      if (isViewingHistory.value || isContinuingGame.value) {
        router.push('/history')
      } else {
        router.go(-1)
      }
    }
    
    const getDisplayName = (name) => {
      return name.length > 3 ? name.substring(0, 3) + '...' : name
    }
    
    const formatTime = (timestamp) => {
      const date = new Date(timestamp)
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
    }
    
    // 初始化数据
    onMounted(() => {
      if (props.gameId) {
        // 查看特定游戏
        const game = Storage.getGame(props.gameId)
        if (game) {
          currentGame.value = game
          currentPlayers.value = game.players.map(player => ({
            ...player,
            totalScore: calculatePlayerTotal(game, player.id)
          }))
        } else {
          ElMessage.error('游戏记录不存在')
          router.push('/')
        }
      }
      // 移除自动加载进行中游戏的逻辑，始终显示空白主页
    })
    
    // 计算选手总分
    const calculatePlayerTotal = (game, playerId) => {
      return game.rounds.reduce((total, round) => {
        return total + (round.scores[playerId] || 0)
      }, 0)
    }
    
    // 监听对话框打开，自动聚焦输入框
    const handleDialogOpen = () => {
      nextTick(() => {
        if (nameInput.value) {
          nameInput.value.focus()
        }
      })
    }
    
    return {
      currentPlayers,
      currentGame,
      showAddDialog,
      showMenu,
      newPlayerName,
      nameInput,
      isScoring,
      isViewingHistory,
      isContinuingGame,
      reversedRounds,
      addPlayer,
      removePlayer,
      startGame,
      goToScoring,
      confirmSettle,
      goToHistory,
      goBack,
      getDisplayName,
      formatTime,
      handleDialogOpen,
      // 图标
      ArrowLeft,
      Minus,
      Plus
    }
  }
}
</script>

<style scoped>
.home-container {
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
  gap: 8px;
}

.history-btn {
  border-radius: 20px;
  background-color: #f0f0f0;
  border: none;
  color: #666;
  font-size: 12px;
  padding: 8px 16px;
}

.players-section {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-hint {
  text-align: center;
  margin-bottom: 40px;
  opacity: 0.8;
}

.hint-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.hint-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.hint-text {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  max-width: 300px;
  margin: 0 auto;
}

.player-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.player-card.scoring-mode {
  padding: 16px;
}

.player-score {
  margin-top: 8px;
  text-align: center;
}

.player-name {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.score-value {
  font-size: 16px;
  font-weight: bold;
}

.score-value.positive {
  color: #f56c6c;
}

.score-value.negative {
  color: #67c23a;
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: white;
}

.add-player-card {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: white;
  border: 2px dashed #ddd;
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.3s;
}

.add-player-card:hover {
  border-color: #409EFF;
}

.add-btn {
  background-color: #409EFF;
  border-color: #409EFF;
  color: white;
}

.history-section {
  background-color: white;
  margin: 16px 16px 100px 16px;
  border-radius: 12px;
  overflow: hidden;
}

.history-header {
  padding: 16px;
  background-color: #fafafa;
  border-bottom: 1px solid #eee;
}

.header-layout {
  display: flex;
  align-items: center;
}

.round-header {
  width: 80px;
  flex-shrink: 0;
  font-size: 14px;
  font-weight: bold;
  color: #666;
  text-align: center;
}

.player-names {
  flex: 1;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.player-name-header {
  text-align: center;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.round-info {
  width: 80px;
  flex-shrink: 0;
}

.round-number {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.round-time {
  font-size: 12px;
  color: #999;
}

.round-scores {
  flex: 1;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.round-score {
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  min-width: 40px;
}

.round-score.positive {
  color: #f56c6c;
}

.round-score.negative {
  color: #67c23a;
}

.round-score.zero {
  color: #999;
}

.bottom-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background-color: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 12px;
}

.start-btn,
.score-btn,
.settle-btn {
  flex: 1;
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: bold;
}

.start-btn:disabled {
  background-color: #f5f5f5;
  border-color: #e4e7ed;
  color: #c0c4cc;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .players-grid {
    gap: 16px;
  }
  
  .player-card {
    padding: 16px;
  }
}

/* 桌面端优化 */
@media (min-width: 1025px) {
  .home-container {
    max-width: 400px;
    margin: 0 auto;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  }
  
  .bottom-buttons {
    position: relative;
    box-shadow: none;
  }
}
</style> 