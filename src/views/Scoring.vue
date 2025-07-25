<template>
  <div class="scoring-container">
    <!-- 顶部导航 -->
    <div class="header">
      <el-button 
        class="home-btn" 
        :icon="House" 
        circle 
        @click="goHome"
      />
      <h1 class="title">计分</h1>
      <div class="header-right">
        <!-- 移除多余的菜单按钮 -->
      </div>
    </div>

    <!-- 局数显示 -->
    <div class="round-info">
      <h2 class="round-title">第 {{ currentRound }} 圈</h2>
    </div>

    <!-- 选手列表 -->
    <div class="players-list">
      <div class="table-header">
        <div class="header-item name">选手名称</div>
        <div class="header-item result">胜负</div>
        <div class="header-item score">得分</div>
      </div>

      <div 
        v-for="(player, index) in playerScores" 
        :key="player.id"
        class="player-row"
      >
        <!-- 选手信息 -->
        <div class="player-info">
          <PlayerAvatar 
            :name="player.name" 
            size="medium"
            :color="player.color"
          />
          <span class="player-name">{{ player.name }}</span>
        </div>

        <!-- 胜负选择 -->
        <div class="result-selection">
          <el-radio-group 
            v-model="player.result" 
            @change="onResultChange(index)"
            class="result-radio-group"
          >
            <el-radio-button label="win" class="win-button">胜</el-radio-button>
            <el-radio-button label="lose" class="lose-button">负</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 得分输入 -->
        <div class="score-input">
          <el-input-number
            v-model="player.score"
            :min="0"
            :max="9999"
            :controls="false"
            placeholder="得分"
            :class="{ 
              'win-score': player.result === 'win',
              'lose-score': player.result === 'lose'
            }"
            @blur="onScoreBlur"
          />
        </div>
      </div>
    </div>

    <!-- 移除总分显示区域 -->

    <!-- 底部按钮 -->
    <div class="bottom-buttons">
      <el-button 
        size="large" 
        class="cancel-btn"
        @click="cancelScoring"
      >
        取消
      </el-button>
      <el-button 
        type="primary"
        size="large" 
        class="confirm-btn"
        :disabled="!canSubmit"
        @click="confirmScore"
      >
        确定
      </el-button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { House } from '@element-plus/icons-vue'
import PlayerAvatar from '../components/PlayerAvatar.vue'
import { Storage } from '../utils/storage.js'

export default {
  name: 'Scoring',
  components: {
    PlayerAvatar
  },
  props: {
    gameId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const router = useRouter()
    const route = useRoute()
    
    // 数据状态
    const game = ref(null)
    const playerScores = ref([])
    
    // 计算属性
    const currentRound = computed(() => {
      return game.value ? game.value.rounds.length + 1 : 1
    })
    
    const totalScore = computed(() => {
      return playerScores.value.reduce((sum, player) => {
        const score = player.score || 0
        // 根据胜负状态计算实际分数
        const actualScore = player.result === 'lose' ? -score : score
        return sum + actualScore
      }, 0)
    })
    
    const canSubmit = computed(() => {
      // 所有选手都需要选择胜负
      const allResultsSelected = playerScores.value.every(player => player.result)
      // 总分必须为0
      const totalIsZero = totalScore.value === 0
      // 至少有一个选手有得分
      const hasScores = playerScores.value.some(player => player.score !== null && player.score !== undefined)
      
      return allResultsSelected && totalIsZero && hasScores
    })
    
    // 方法
    const initializeGame = () => {
      const gameData = Storage.getGame(props.gameId)
      if (!gameData) {
        ElMessage.error('游戏不存在')
        router.push('/')
        return
      }
      
      game.value = gameData
      
      // 初始化选手得分数据
      playerScores.value = gameData.players.map(player => ({
        id: player.id,
        name: player.name,
        color: player.color,
        result: 'win',
        score: null
      }))
    }
    
    const onResultChange = (index) => {
      const player = playerScores.value[index]
      
      // 检查是否还有未填写的选手
      const unfilledPlayers = playerScores.value.filter(p => 
        p.score === null || p.score === undefined || p.score === ''
      )
      
      // 只有当还有未填写的选手时，才进行自动计算
      // 如果所有选手都已填写，只是切换胜负状态，不重新计算
      if (unfilledPlayers.length > 0) {
        calculateAutoScore()
      }
    }
    
    const onScoreBlur = () => {
      // 当输入框失焦时，将输入值转为绝对值（显示为正数）
      playerScores.value.forEach(player => {
        if (player.score !== null && player.score !== undefined) {
          // 统一转换为正数显示，正负由胜负按钮决定
          player.score = Math.abs(player.score)
        }
      })
      
      calculateAutoScore()
    }
    
    const calculateAutoScore = () => {
      // 找到还未填写分数的选手
      const unfilledPlayers = playerScores.value.filter(player => 
        player.score === null || player.score === undefined || player.score === ''
      )
      
      // 如果只剩下一个选手未填写，自动计算
      if (unfilledPlayers.length === 1) {
        const filledPlayersTotal = playerScores.value
          .filter(player => player !== unfilledPlayers[0])
          .reduce((sum, player) => {
            const score = player.score || 0
            // 根据胜负状态计算实际分数
            return sum + (player.result === 'lose' ? -score : score)
          }, 0)
        
        const autoScore = -filledPlayersTotal
        // 显示为绝对值，设置对应的胜负状态
        unfilledPlayers[0].score = Math.abs(autoScore)
        
        // 自动设置胜负
        if (autoScore >= 0) {
          unfilledPlayers[0].result = 'win'
        } else {
          unfilledPlayers[0].result = 'lose'
        }
      }
    }
    
    const confirmScore = () => {
      if (!canSubmit.value) {
        ElMessage.warning('请检查输入信息')
        return
      }
      
      // 创建新的回合记录
      const newRound = {
        roundNumber: currentRound.value,
        timestamp: Date.now(),
        scores: {}
      }
      
      // 添加选手得分 - 根据胜负状态转换为实际分数
      playerScores.value.forEach(player => {
        const score = player.score || 0
        const actualScore = player.result === 'lose' ? -score : score
        newRound.scores[player.id] = actualScore
      })
      
      // 保存到游戏记录
      game.value.rounds.push(newRound)
      Storage.saveGame(game.value)
      
      ElMessage.success('计分完成')
      // 返回到游戏页面
      router.push(`/continue/${game.value.id}`)
    }
    
    const goHome = () => {
      // 自动保存当前游戏状态
      if (game.value) {
        Storage.saveGame(game.value)
        ElMessage.success('游戏已保存')
      }
      // 返回空白主页
      router.push('/')
    }
    
    const cancelScoring = () => {
      // 取消计分，返回到游戏页面
      router.push(`/continue/${game.value.id}`)
    }
    
    // 移除自动监听，改为失焦时手动触发
    
    // 初始化
    onMounted(() => {
      initializeGame()
    })
    
    return {
      game,
      playerScores,
      currentRound,
      totalScore,
      canSubmit,
      onResultChange,
      onScoreBlur,
      confirmScore,
      goHome,
      cancelScoring,
      // 图标
      House
    }
  }
}
</script>

<style scoped>
.scoring-container {
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
  width: 40px; /* 保持布局平衡 */
}

.round-info {
  text-align: center;
  padding: 20px;
  background-color: white;
  margin: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.round-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.players-list {
  flex: 1;
  background-color: white;
  margin: 0 16px 16px 16px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #fafafa;
  border-bottom: 1px solid #eee;
  font-weight: bold;
  color: #666;
}

.header-item {
  text-align: center;
}

.header-item.name {
  flex: 2;
  text-align: left;
}

.header-item.result {
  flex: 2;
}

.header-item.score {
  flex: 1.5;
}

.player-row {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.player-row:last-child {
  border-bottom: none;
}

.player-info {
  flex: 2;
  display: flex;
  align-items: center;
  gap: 12px;
}

.player-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.result-selection {
  flex: 2;
  display: flex;
  justify-content: center;
}

.score-input {
  flex: 1.5;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}



.bottom-buttons {
  padding: 16px;
  background-color: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 12px;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: bold;
}

.confirm-btn:disabled {
  background-color: #f5f5f5;
  border-color: #e4e7ed;
  color: #c0c4cc;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-radio-button__inner) {
  padding: 8px 16px;
  font-size: 12px;
  border-radius: 16px;
}

:deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-radius: 16px;
}

:deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 16px;
}

/* 胜负按钮颜色 - 完整覆盖 */
:deep(.result-radio-group .win-button.is-active .el-radio-button__inner) {
  background-color: #67c23a !important;
  border: 1px solid #67c23a !important;
  border-left: 1px solid #67c23a !important;
  border-right: 1px solid #67c23a !important;
  color: white !important;
  box-shadow: none !important;
}

:deep(.result-radio-group .lose-button.is-active .el-radio-button__inner) {
  background-color: #f56c6c !important;
  border: 1px solid #f56c6c !important;
  border-left: 1px solid #f56c6c !important;
  border-right: 1px solid #f56c6c !important;
  color: white !important;
  box-shadow: none !important;
}

/* 胜负按钮hover效果 - 完整覆盖 */
:deep(.result-radio-group .win-button:hover .el-radio-button__inner) {
  background-color: #85ce61 !important;
  border: 1px solid #85ce61 !important;
  border-left: 1px solid #85ce61 !important;
  border-right: 1px solid #85ce61 !important;
  color: white !important;
}

:deep(.result-radio-group .lose-button:hover .el-radio-button__inner) {
  background-color: #f78989 !important;
  border: 1px solid #f78989 !important;
  border-left: 1px solid #f78989 !important;
  border-right: 1px solid #f78989 !important;
  color: white !important;
}

/* 胜按钮 - 选中+hover状态 */
:deep(.result-radio-group .win-button.is-active:hover .el-radio-button__inner) {
  background-color: #85ce61 !important;
  border: 1px solid #85ce61 !important;
  border-left: 1px solid #85ce61 !important;
  border-right: 1px solid #85ce61 !important;
  color: white !important;
}

/* 负按钮 - 选中+hover状态 */
:deep(.result-radio-group .lose-button.is-active:hover .el-radio-button__inner) {
  background-color: #f78989 !important;
  border: 1px solid #f78989 !important;
  border-left: 1px solid #f78989 !important;
  border-right: 1px solid #f78989 !important;
  color: white !important;
}

/* 默认状态边框移除 */
:deep(.result-radio-group .el-radio-button__inner) {
  border: 1px solid #dcdfe6 !important;
}

:deep(.result-radio-group .el-radio-button:first-child .el-radio-button__inner) {
  border-left: 1px solid #dcdfe6 !important;
}

:deep(.result-radio-group .el-radio-button:last-child .el-radio-button__inner) {
  border-right: 1px solid #dcdfe6 !important;
}

/* 得分输入框颜色 */
:deep(.win-score .el-input__inner) {
  color: #67c23a;
  font-weight: bold;
}

:deep(.lose-score .el-input__inner) {
  color: #f56c6c;
  font-weight: bold;
}

:deep(.el-input-number) {
  width: 80px;
}

:deep(.el-input-number .el-input__inner) {
  text-align: center;
  font-weight: bold;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .round-info {
    margin: 12px;
    padding: 16px;
  }
  
  .players-list {
    margin: 0 12px;
  }
  
  .total-section {
    margin: 12px;
  }
  
  .player-name {
    font-size: 13px;
  }
}

/* 桌面端优化 */
@media (min-width: 1025px) {
  .scoring-container {
    max-width: 400px;
    margin: 0 auto;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  }
}
</style> 