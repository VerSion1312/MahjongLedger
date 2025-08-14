<template>
  <div class="home-container">
    <!-- 加入游戏加载遮罩 -->
    <div v-if="joiningGameLoading" class="joining-game-overlay">
      <div class="joining-game-content">
        <div class="loading-spinner">
          <el-icon class="rotating"><Loading /></el-icon>
        </div>
        <div class="loading-text">正在加入游戏...</div>
        <div class="loading-subtext">请稍候，不要刷新页面</div>
      </div>
    </div>
    <!-- 房间登录界面 -->
    <div v-if="!isInRoom" class="room-login-container">
      <div class="login-card">
        <div class="logo-section">
          <div class="logo-icon">🀄</div>
          <h1 class="app-title">麻将账本</h1>
          <p class="app-description">多人实时计分工具</p>
        </div>
        
        <div class="room-actions">
          <!-- 功能切换标签 -->
                        <div class="action-tabs">
                <div 
                  class="tab-item" 
                  :class="{ active: activeActionTab === 'join', disabled: joiningGameLoading }" 
                  @click="!joiningGameLoading && switchActionTab('join')"
                >
                  加入房间
                </div>
                <div 
                  class="tab-item" 
                  :class="{ active: activeActionTab === 'create', disabled: joiningGameLoading }" 
                  @click="!joiningGameLoading && switchActionTab('create')"
                >
                  创建房间
                </div>
              </div>
          
          <!-- 加入房间 -->
          <div v-if="activeActionTab === 'join'" class="action-content">
            <el-form @submit.prevent="joinRoom" class="room-form">
              <el-form-item>
                                <el-input 
                  v-model="roomCode" 
                  placeholder="请输入房间口令" 
                  size="large"
                  maxlength="16"
                  ref="roomCodeInput"
                  :disabled="loading || joiningGameLoading"
                >
                  <template #prefix>
                    <el-icon><Key /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
                              <el-button 
                  type="primary" 
                  size="large" 
                  class="action-btn"
                  @click="joinRoom"
                  :loading="loading"
                  :disabled="!roomCode.trim() || joiningGameLoading"
                >
                加入房间
              </el-button>
            </el-form>
          </div>
          
          <!-- 创建房间 -->
          <div v-if="activeActionTab === 'create'" class="action-content">
            <el-form @submit.prevent="createRoom" class="room-form">
              <el-form-item>
                                <el-input 
                  v-model="newRoomCode" 
                  placeholder="输入自定义口令（留空将自动生成）" 
                  size="large"
                  maxlength="16"
                  :disabled="loading || joiningGameLoading"
                >
                  <template #prefix>
                    <el-icon><Key /></el-icon>
                  </template>
                  <template #suffix>
                                          <el-button 
                        type="text" 
                        size="small"
                        @click="generateRandomCode"
                        :disabled="loading || joiningGameLoading"
                        title="生成随机口令"
                      >
                      随机
                    </el-button>
                  </template>
                </el-input>
              </el-form-item>
                              <el-button 
                  type="success" 
                  size="large" 
                  class="action-btn"
                  @click="createRoom"
                  :loading="loading"
                  :disabled="joiningGameLoading"
                >
                {{ newRoomCode.trim() ? '创建房间' : '创建房间（随机口令）' }}
              </el-button>
            </el-form>
          </div>
        </div>
        
        <div class="room-info">
          <div class="info-item">
            <el-icon><InfoFilled /></el-icon>
            <span>口令支持中英文、数字、短横线和下划线，4-16个字符</span>
          </div>
          <div class="info-item">
            <el-icon><User /></el-icon>
            <span>同一房间内的用户可实时共享数据</span>
          </div>
        </div>
        
        <!-- 关于作者按钮 -->
        <div class="about-section">
          <el-button 
            type="info" 
            size="small" 
            class="about-btn"
            @click="openAboutDialog"
            plain
          >
            <el-icon><InfoFilled /></el-icon>
            <span>关于作者</span>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 原有的游戏界面 -->
    <div v-else class="game-container">
    <!-- 顶部导航 -->
    <div class="header">
        <div class="header-left">
      <el-button 
        v-if="isScoring || isViewingHistory" 
        class="back-btn" 
        :icon="ArrowLeft" 
        circle 
        @click="goBack"
      />
          <el-button 
            v-if="isViewingHistory" 
            class="home-btn" 
            :icon="House" 
            circle 
            @click="goToHome"
          />
        </div>
      <h1 class="title">
        {{ isViewingHistory ? '历史详情' : (isScoring ? '麻将计分' : '麻将账本') }}
      </h1>
      <div class="header-right">
        <el-button 
            class="room-code-btn"
            @click="showRoomInfo"
            title="点击查看房间信息"
          >
            <el-icon><Link /></el-icon>
            <span>{{ currentRoomCode }}</span>
          </el-button>
          <el-button 
            v-if="!isViewingHistory"
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
        <div class="safety-tips">
          <div>抵制不良游戏，拒绝盗版游戏。</div>
          <div>注意自我保护，谨防受骗上当。</div>
          <div>适度游戏益脑，沉迷游戏伤身。</div>
          <div>合理安排时间，享受健康生活。</div>
        </div>
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

      <!-- 历史详情底部按钮 -->
      <div v-if="isViewingHistory" class="history-bottom-buttons">
        <el-button 
          type="primary" 
          size="large" 
          class="restart-btn"
          @click="restartWithSamePlayers"
        >
          再来一局
        </el-button>
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
    </div>

    <!-- 房间信息对话框 -->
    <el-dialog v-model="showRoomInfoDialog" title="房间信息" width="90%" center>
      <div class="room-info-content">
        <div class="room-code-display">
          <div class="room-code-header">
            <el-icon class="room-icon"><Key /></el-icon>
            <span class="room-code-label">房间口令</span>
          </div>
          <div class="room-code-content">
            <div class="room-code-value">{{ currentRoomCode }}</div>
            <div class="room-code-actions">
              <el-button type="primary" size="small" @click="copyRoomCode" class="copy-btn">
                <el-icon><DocumentCopy /></el-icon>
                <span>复制</span>
              </el-button>
              <el-button type="warning" size="small" @click="leaveRoom" class="exit-btn">
                <el-icon><SwitchButton /></el-icon>
                <span>退出房间</span>
              </el-button>
            </div>
          </div>
        </div>
        
        <!-- 二维码分享区域 -->
        <div class="qr-code-section">
          <div class="qr-code-title">
            <el-icon class="qr-icon"><Grid /></el-icon>
            扫码快速加入
          </div>
          <div class="qr-code-container">
            <div v-if="qrCodeDataUrl" class="qr-code-wrapper">
              <img :src="qrCodeDataUrl" alt="房间二维码" class="qr-code-image" />
              <div class="qr-code-corners">
                <div class="corner corner-tl"></div>
                <div class="corner corner-tr"></div>
                <div class="corner corner-bl"></div>
                <div class="corner corner-br"></div>
              </div>
            </div>
            <div v-else class="qr-code-loading">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <span>生成二维码中...</span>
            </div>
          </div>
          <div class="qr-code-description">
            <el-icon><Connection /></el-icon>
            其他用户扫描此二维码可直接加入房间
          </div>
                               <div class="qr-code-actions">
            <el-button type="success" size="small" @click="copyRoomUrl" class="share-btn">
              <el-icon><Share /></el-icon>
              <span>复制链接</span>
            </el-button>
            <el-button type="primary" size="small" @click="downloadQRCode" class="download-btn">
              <el-icon><Download /></el-icon>
              <span>下载二维码</span>
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
    
    <!-- 关于作者对话框 -->
    <el-dialog v-model="showAboutDialog" title="关于作者" width="90%" center>
      <div class="about-content">
        <div class="about-header">
          <div class="app-logo">🀄</div>
          <h2 class="app-name">麻将账本 v2.0.0</h2>
          <p class="app-tagline">多用户实时麻将计分记录工具</p>
        </div>
        
        <div class="about-sections">
          
          <div class="about-section-item">
            <h3>👨‍💻 作者信息</h3>
            <div class="author-info">
              <div class="author-item">
                <strong>作者</strong>：<a href="https://github.com/VerSion1312" target="_blank" rel="noopener">VerSion1312</a>
              </div>
              <div class="author-item">
                <strong>个人主页</strong>：<a href="https://www.version-carol.cn/#/" target="_blank" rel="noopener">白泽文档库</a>
              </div>
              <div class="author-item">
                <strong>GitHub</strong>：<a href="https://github.com/VerSion1312/MahjongLedger" target="_blank" rel="noopener">麻将账本</a>
              </div>
              <div class="author-item">
                <strong>许可证</strong>：<a href="https://mit-license.org/" target="_blank" rel="noopener">MIT License</a>
              </div>
            </div>
          </div>
          
        </div>
        
        <div class="about-footer">
          <p>⭐ 如果这个项目对你有帮助，请给它一个星标！</p>
          <div class="about-actions">
            <el-button 
              type="primary" 
              size="small"
              @click="openGitHub"
              class="github-btn"
            >
              <el-icon><Link /></el-icon>
              访问 GitHub
            </el-button>
            <el-button 
              type="info" 
              size="small"
              @click="showAboutDialog = false"
            >
              关闭
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Minus, Plus, Key, InfoFilled, User, Loading, House, DocumentCopy, Grid, Connection, Share, Download, SwitchButton,Link } from '@element-plus/icons-vue'
import PlayerAvatar from '../components/PlayerAvatar.vue'
import { Storage } from '../utils/storage.js'
import { DataSync } from '../utils/dataSync.js'
import QRCode from 'qrcode'

export default {
  name: 'Home',
  components: {
    PlayerAvatar
  },
  props: {
    gameId: {
      type: String,
      default: null
    },
    roomCode: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const router = useRouter()
    const route = useRoute()
    
    // 房间相关状态
    const isInRoom = ref(false)
    const currentRoomCode = ref('')
    const roomCode = ref('')
    const newRoomCode = ref('')
    const loading = ref(false)
    const joiningGameLoading = ref(false) // 加入游戏时的加载状态
    const showRoomInfoDialog = ref(false)
    const showAboutDialog = ref(false)
    const qrCodeDataUrl = ref('')
    const roomCodeInput = ref(null)
    const activeActionTab = ref('join')
    
    // 基于本地存储的房间信息进行同步初始化，避免首次渲染闪屏
    const initialRoomCode = Storage.getCurrentRoomCode()
    if (initialRoomCode) {
      isInRoom.value = true
      currentRoomCode.value = initialRoomCode
    }
    
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
    
    // 房间方法
    const joinRoom = async () => {
      const code = roomCode.value.trim()
      if (!code) {
        ElMessage.warning('请输入房间口令')
        return
      }
      
      if (!Storage.validateRoomCode(code)) {
        ElMessage.warning('房间口令格式不正确')
        return
      }
      
      loading.value = true
      
      try {
        // 检查房间是否存在
        const exists = await Storage.roomExists(code)
        if (!exists) {
          ElMessage.error('房间不存在')
          return
        }
        
        // 加入房间
        Storage.setCurrentRoomCode(code)
        currentRoomCode.value = code
        isInRoom.value = true
        roomCode.value = ''
        
        // 加载房间数据
        await loadRoomData()
        
        // 检查是否有进行中的游戏，如果有则自动进入
        await checkAndJoinActiveGame()
        
        ElMessage.success(`成功加入房间：${code}`)
      } catch (error) {
        ElMessage.error('加入房间失败，'+error.message)
      } finally {
        loading.value = false
      }
    }
    
    const switchActionTab = (tab) => {
      activeActionTab.value = tab
      // 切换时清空输入
      if (tab === 'join') {
        newRoomCode.value = ''
      } else {
        roomCode.value = ''
      }
    }
    
    const generateRandomCode = () => {
      newRoomCode.value = Storage.generateRoomCode()
    }
    
    const createRoom = async () => {
      loading.value = true
      
      try {
        let code = newRoomCode.value.trim()
        
        // 如果没有输入自定义口令，则生成随机口令
        if (!code) {
          code = Storage.generateRoomCode()
        } else {
          // 验证自定义口令格式
          if (!Storage.validateRoomCode(code)) {
            ElMessage.warning('房间口令格式不正确')
            loading.value = false
            return
          }
          
          // 检查房间是否已存在
          const exists = await Storage.roomExists(code)
          if (exists) {
            ElMessage.warning('该口令的房间已存在，请选择其他口令')
            loading.value = false
            return
          }
        }
        
        // 创建房间
        await Storage.createRoom(code)
        Storage.setCurrentRoomCode(code)
        currentRoomCode.value = code
        isInRoom.value = true
        newRoomCode.value = ''
        
        ElMessage.success(`房间创建成功！口令：${code}`)
      } catch (error) {
        ElMessage.error('创建房间失败，'+error.message)
      } finally {
        loading.value = false
      }
    }
    
    const leaveRoom = async () => {
      try {
        await ElMessageBox.confirm('确认退出当前房间吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        Storage.clearCurrentRoom()
        isInRoom.value = false
        currentRoomCode.value = ''
        currentPlayers.value = []
        currentGame.value = null
        showRoomInfoDialog.value = false
        
        ElMessage.success('已退出房间')
      } catch {
        // 用户取消
      }
    }
    
    const showRoomInfo = async () => {
      showRoomInfoDialog.value = true
      await generateQRCode()
    }
    
    // 显示关于对话框
    const openAboutDialog = () => {
      showAboutDialog.value = true
    }
    
    // 打开GitHub仓库
    const openGitHub = () => {
      window.open('https://github.com/VerSion1312/MahjongLedger', '_blank')
    }
    
    // 生成房间URL
    const generateRoomUrl = () => {
      const currentUrl = window.location.origin + window.location.pathname
      const roomUrl = `${currentUrl}#/join/${encodeURIComponent(currentRoomCode.value)}`
      return roomUrl
    }
    
    // 生成二维码
    const generateQRCode = async () => {
      try {
        const roomUrl = generateRoomUrl()
        const qrCodeData = await QRCode.toDataURL(roomUrl, {
          width: 240,
          margin: 3,
          color: {
            dark: '#2563eb',  // 更好看的蓝色
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M',
          type: 'image/png',
          quality: 0.92,
          rendererOpts: {
            quality: 0.92
          }
        })
        qrCodeDataUrl.value = qrCodeData
      } catch (error) {
        ElMessage.error('生成二维码失败，'+error.message)
      }
    }
    
    const copyRoomCode = async () => {
      try {
        await navigator.clipboard.writeText(currentRoomCode.value)
        ElMessage.success('口令已复制到剪贴板')
      } catch {
        ElMessage.warning('复制失败，请手动复制')
      }
    }
    
    const copyRoomUrl = async () => {
      try {
        const roomUrl = generateRoomUrl()
        await navigator.clipboard.writeText(roomUrl)
        ElMessage.success('房间链接已复制到剪贴板')
      } catch (error) {
        ElMessage.error('复制失败，请手动复制，'+error.message)
      }
    }
    
    // 下载二维码
    const downloadQRCode = async () => {
      try {
        if (!qrCodeDataUrl.value) {
          ElMessage.warning('二维码还未生成，请稍候')
          return
        }
        
        // 创建一个临时的 a 标签用于下载
        const link = document.createElement('a')
        link.href = qrCodeDataUrl.value
        link.download = `麻将房间-${currentRoomCode.value}-二维码.png`
        
        // 触发下载
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        ElMessage.success('二维码下载成功')
      } catch (error) {
        ElMessage.error('下载失败，请重试，'+error.message)
      }
    }
    
    const loadRoomData = async () => {
      if (props.gameId) {
        // 查看特定游戏
        const game = await Storage.getGame(props.gameId)
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
    }
    
    const checkAndJoinActiveGame = async () => {
      try {
        const games = await Storage.getGames()
        
        const activeGame = games.find(game => game.status === 'playing')
        
        if (activeGame) {
          // 显示加载状态
          joiningGameLoading.value = true
          
          // 安全机制：10秒后自动清除加载状态
          const timeoutId = setTimeout(() => {
            if (joiningGameLoading.value) {
              joiningGameLoading.value = false
            }
          }, 10000)
          
          ElMessage({
            message: '检测到进行中的游戏，正在加入...',
            type: 'success',
            duration: 2000
          })
          
          // 延迟一下让用户看到消息，并确保房间状态已同步
          setTimeout(async () => {
            try {
              await router.push(`/continue/${activeGame.id}`)
              // 手动清除加载状态，确保用户可以操作
              clearTimeout(timeoutId) // 清除超时定时器
              joiningGameLoading.value = false
            } catch (routerError) {
              clearTimeout(timeoutId) // 清除超时定时器
              joiningGameLoading.value = false // 失败时清除加载状态
              ElMessage.error('加入游戏失败，请手动从历史记录进入')
            }
          }, 1500)
        }
      } catch (error) {
        joiningGameLoading.value = false // 出错时清除加载状态
        ElMessage.error('检查进行中游戏失败')
      }
    }
    
    // 原有方法
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
    
    const startGame = async () => {
      if (currentPlayers.value.length < 2) {
        ElMessage.warning('至少需要2名选手才能开始游戏')
        return
      }
      
      // 检查是否有进行中的游戏
      const games = await Storage.getGames()
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
      await Storage.saveGame(game)
      
      // 触发数据同步，让其他终端看到新游戏
      DataSync.triggerUpdate()
      
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
        await Storage.saveGame(currentGame.value)
        
        // 触发数据同步，让其他终端看到更新
        DataSync.triggerUpdate()
        
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
    
    // 回到首页（添加选手页面）
    const goToHome = () => {
      // 清除当前游戏状态
      currentGame.value = null
      currentPlayers.value = []
      
      // 跳转到首页
      router.push('/')
      
    }
    
    // 再来一局 - 使用当前游戏的选手开始新游戏
    const restartWithSamePlayers = () => {
      if (!currentGame.value || !currentGame.value.players) {
        ElMessage.error('无法获取选手信息')
        return
      }
      
      // 复制当前游戏的选手信息
      const playersToAdd = currentGame.value.players.map(player => ({
        id: Storage.generateId(), // 生成新的ID
        name: player.name,
        color: player.color,
        totalScore: 0 // 重置总分
      }))
      
      // 清除当前游戏状态
      currentGame.value = null
      
      // 设置新的选手列表
      currentPlayers.value = playersToAdd
      
      // 跳转到主页面（添加选手页面）
          router.push('/')
      
      ElMessage.success(`已添加 ${playersToAdd.length} 名选手，可以开始新游戏了！`)
    }
    
    // 处理二维码进入房间
    const handleQRCodeEntry = async (scannedRoomCode) => {
      try {
        // 解码房间码（因为URL中可能被编码）
        const decodedRoomCode = decodeURIComponent(scannedRoomCode)
        
        // 验证房间码格式
        if (!Storage.validateRoomCode(decodedRoomCode)) {
          ElMessage.error('无效的房间口令')
          router.replace('/')
          return
        }
        
        // 检查房间是否存在
        const exists = await Storage.roomExists(decodedRoomCode)
        if (!exists) {
          ElMessage.error('房间不存在或已过期')
          router.replace('/')
          return
        }
        
        // 加入房间
        Storage.setCurrentRoomCode(decodedRoomCode)
        currentRoomCode.value = decodedRoomCode
        isInRoom.value = true
        
        // 加载房间数据
        await loadRoomData()
        
        // 检查是否有活跃游戏
        await checkAndJoinActiveGame()
        
        // 跳转到主页面
        router.replace('/')
        
        ElMessage.success(`通过扫码成功加入房间：${decodedRoomCode}`)
      } catch (error) {
        ElMessage.error('加入房间失败，请重试')
        router.replace('/')
      }
    }
    
    const getDisplayName = (name) => {
      return name.length > 3 ? name.substring(0, 3) + '...' : name
    }
    
    const formatTime = (timestamp) => {
      const date = new Date(timestamp)
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
    }
    
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
    
    // 处理数据同步更新
    const handleDataUpdate = async () => {
      if (isInRoom.value) {
        if (props.gameId) {
          // 如果在查看特定游戏，重新加载该游戏数据
          const prevStatus = currentGame.value?.status
          await loadRoomData()

          // 如果当前处于继续对局页面，且状态由 playing 变为 finished，则提醒并跳转
          if (route.name === 'ContinueGame' && prevStatus === 'playing' && currentGame.value?.status === 'finished') {
            ElMessage.info('该局已被其他成员结算')
            router.replace(`/game/${props.gameId}`)
            return
          }
        } else {
          // 如果在游戏主界面，检查是否有新的活跃游戏或更新
          await loadRoomData()

          // 当首页正处于继续对局状态时，也检测状态变化
          if (route.name === 'ContinueGame') {
            const prevStatus = currentGame.value?.status
            // 重新拉取数据后 currentGame 可能被更新
            if (prevStatus === 'playing' && currentGame.value?.status === 'finished') {
              ElMessage.info('该局已被其他成员结算')
              router.replace(`/game/${currentGame.value.id}`)
              return
            }
          }
        }
      }
    }
    
    // 初始化数据
    // 监听gameId变化
    watch(() => props.gameId, async (newGameId, oldGameId) => {
      if (newGameId !== oldGameId && isInRoom.value) {
        // 清除加载状态
        joiningGameLoading.value = false
        await loadRoomData()
      }
    }, { immediate: false })

    onMounted(async () => {
      // 确保加载状态被清除
      joiningGameLoading.value = false
      
      // 检查是否是通过二维码进入（/join/:roomCode 路由）
      if (props.roomCode && route.name === 'JoinRoom') {
        await handleQRCodeEntry(props.roomCode)
        return
      }
      
      // 检查是否已在房间中
      const existingRoomCode = Storage.getCurrentRoomCode()
      if (existingRoomCode) {
        const exists = await Storage.roomExists(existingRoomCode)
        if (exists) {
          currentRoomCode.value = existingRoomCode
          isInRoom.value = true
          await loadRoomData()
          
          // 如果没有查看特定游戏，检查是否有活跃游戏
          if (!props.gameId) {
            await checkAndJoinActiveGame()
          }
          
          // 启动数据同步
          DataSync.startPolling()
          DataSync.addListener('dataUpdated', handleDataUpdate)
        } else {
          // 房间不存在，清除本地记录
          Storage.clearCurrentRoom()
        }
      }
    })
    
    // 组件卸载时清理
    onUnmounted(() => {
      DataSync.removeListener('dataUpdated', handleDataUpdate)
    })
    
    return {
      // 房间相关
      isInRoom,
      currentRoomCode,
      roomCode,
      newRoomCode,
      loading,
      joiningGameLoading,
      showRoomInfoDialog,
      showAboutDialog,
      roomCodeInput,
      activeActionTab,
      switchActionTab,
      joinRoom,
      createRoom,
      generateRandomCode,
      checkAndJoinActiveGame,
      leaveRoom,
      showRoomInfo,
      openAboutDialog,
      openGitHub,
      copyRoomCode,
      copyRoomUrl,
      downloadQRCode,
      generateRoomUrl,
      generateQRCode,
      qrCodeDataUrl,
      
      // 游戏相关
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
      goToHome,
      restartWithSamePlayers,
      getDisplayName,
      formatTime,
      handleDialogOpen,
      handleDataUpdate,
      
      // 图标
      ArrowLeft,
      Minus,
      Plus,
      Key,
      InfoFilled,
      User,
      Loading,
      House,
      DocumentCopy,
      Grid,
      Connection,
      Share,
      Download,
      SwitchButton,
      Link
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

.room-login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.login-card {
  background-color: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 100%;
  max-width: 450px;
}

.logo-section {
  margin-bottom: 30px;
}

.logo-icon {
  font-size: 60px;
  margin-bottom: 15px;
}

.app-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0 0 8px 0;
}

.app-description {
  font-size: 14px;
  color: #666;
  margin: 0 0 30px 0;
}

.room-actions {
  margin-bottom: 20px;
}

.action-tabs {
  display: flex;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 20px;
}

.action-tabs .tab-item {
  flex: 1;
  text-align: center;
  padding: 12px 16px;
  border-radius: 6px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.action-tabs .tab-item.active {
  background-color: #409EFF;
  color: white;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
}

.action-tabs .tab-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.action-tabs .tab-item:hover:not(.active) {
  color: #409EFF;
  background-color: rgba(64, 158, 255, 0.1);
}

.action-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.room-form .el-form-item {
  margin-bottom: 15px;
}

.room-form .el-input {
  width: 100%;
}

.action-btn {
  width: 100%;
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: bold;
}

.divider {
  font-size: 14px;
  color: #999;
  margin: 20px 0;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background-color: #eee;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.room-info {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.about-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
  text-align: center;
}

.about-btn {
  font-size: 13px;
  color: #666;
  border-color: #ddd;
}

.about-btn:hover {
  color: #409EFF;
  border-color: #409EFF;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 10px;
  font-size: 13px;
  color: #666;
}

.info-item .el-icon {
  margin-right: 8px;
  font-size: 16px;
  flex-shrink: 0;
}

.game-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.room-login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.login-card {
  background-color: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 90%;
  max-width: 450px;
}

.logo-section {
  margin-bottom: 30px;
}

.logo-icon {
  font-size: 60px;
  margin-bottom: 15px;
}

.app-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.app-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 30px;
}

.room-actions {
  margin-bottom: 20px;
}

.action-section {
  margin-bottom: 20px;
}

.action-section h3 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.room-form .el-form-item {
  margin-bottom: 15px;
}

.room-form .el-input {
  width: 100%;
}

.action-btn {
  width: 100%;
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: bold;
}

.divider {
  font-size: 14px;
  color: #999;
  margin: 20px 0;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background-color: #eee;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.room-info {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
  color: #666;
}

.info-item .el-icon {
  margin-right: 8px;
  font-size: 16px;
}

.game-container {
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

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-left .home-btn {
  transition: all 0.3s ease;
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

.safety-tips {
  margin-top: 16px;
  color: #888;
  font-size: 12px;
  line-height: 1.8;
  text-align: center;
}

.safety-tips div {
  margin: 2px 0;
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

.room-info-content {
  text-align: center;
}

.room-code-display {
  margin-bottom: 20px;
  padding: 18px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.room-code-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.room-icon {
  font-size: 16px;
  color: #409EFF;
}

.room-code-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.room-code-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.room-code-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.room-code-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  word-break: break-all;
  padding: 10px 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #d4e4f7;
  letter-spacing: 1px;
  min-width: 160px;
  text-align: center;
}

.copy-btn {
  font-weight: 500;
  padding: 6px 16px;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.copy-btn:hover {
  transform: translateY(-1px);
}

.copy-btn .el-icon {
  margin-right: 4px;
}

/* 二维码分享区域 */
.qr-code-section {
  margin: 20px 0;
  padding: 20px;
  background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;
}

.qr-code-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
  border-radius: 16px 16px 0 0;
}

.qr-code-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;
  text-align: center;
  position: relative;
}

.qr-code-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.qr-code-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 2px;
  background: #3b82f6;
  border-radius: 1px;
}

.qr-icon {
  font-size: 18px;
  color: #3b82f6;
}

.qr-code-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
  min-height: 260px;
  position: relative;
}

.qr-code-image {
  border-radius: 16px;
  box-shadow: 
    0 10px 25px rgba(59, 130, 246, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.8),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  background: white;
  padding: 16px;
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.qr-code-image::before {
  content: '';
  position: absolute;
  top: -8px;
  left: -8px;
  right: -8px;
  bottom: -8px;
  background: linear-gradient(45deg, #3b82f6, #8b5cf6, #06b6d4, #10b981);
  border-radius: 24px;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.qr-code-image:hover {
  transform: scale(1.05);
  box-shadow: 
    0 20px 40px rgba(59, 130, 246, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.9),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.qr-code-image:hover::before {
  opacity: 0.1;
}

.qr-code-loading {
  color: #64748b;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 220px;
  background: white;
  border-radius: 16px;
  border: 2px dashed #cbd5e1;
}

.qr-code-wrapper {
  position: relative;
  display: inline-block;
}

.qr-code-corners {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  pointer-events: none;
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 3px solid #3b82f6;
}

.corner-tl {
  top: 0;
  left: 0;
  border-right: none;
  border-bottom: none;
  border-radius: 8px 0 0 0;
}

.corner-tr {
  top: 0;
  right: 0;
  border-left: none;
  border-bottom: none;
  border-radius: 0 8px 0 0;
}

.corner-bl {
  bottom: 0;
  left: 0;
  border-right: none;
  border-top: none;
  border-radius: 0 0 0 8px;
}

.corner-br {
  bottom: 0;
  right: 0;
  border-left: none;
  border-top: none;
  border-radius: 0 0 8px 0;
}

.qr-code-loading {
  flex-direction: column;
  gap: 12px;
}

.loading-icon {
  font-size: 24px;
  color: #3b82f6;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.qr-code-description {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 15px;
  line-height: 1.6;
  text-align: center;
  background: rgba(255, 255, 255, 0.7);
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(203, 213, 225, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.qr-code-description .el-icon {
  font-size: 14px;
  color: #3b82f6;
}

.qr-code-actions {
  text-align: center;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.share-btn,
.download-btn {
  border-radius: 20px;
  padding: 8px 20px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 120px;
}

.share-btn:hover,
.download-btn:hover {
  transform: translateY(-2px);
}

.share-btn .el-icon,
.download-btn .el-icon {
  margin-right: 4px;
}

.room-code-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.room-code-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  word-break: break-all;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 8px;
  border: 1px solid #eee;
  display: inline-block;
}

.room-actions-menu {
  margin-top: 20px;
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

/* 随机按钮样式 */
.room-form .el-input .el-button {
  color: #409EFF;
  font-size: 12px;
  padding: 0 8px;
}

.room-form .el-input .el-button:hover {
  color: #337ecc;
}

/* 加入游戏加载遮罩 */
.joining-game-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.joining-game-content {
  background: white;
  padding: 40px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-width: 320px;
  width: 90%;
}

.loading-spinner {
  margin-bottom: 20px;
}

.loading-spinner .el-icon {
  font-size: 48px;
  color: #409EFF;
}

.rotating {
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.loading-subtext {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

/* 历史详情底部按钮 */
.history-bottom-buttons {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.history-bottom-buttons .restart-btn {
  padding: 12px 40px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 25px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.history-bottom-buttons .restart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

/* 关于对话框样式 */
.about-content {
  padding: 20px 0;
}

.about-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.app-logo {
  font-size: 48px;
  margin-bottom: 15px;
}

.app-name {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0 0 8px 0;
}

.app-tagline {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.about-sections {
  display: grid;
  gap: 25px;
  margin-bottom: 30px;
}

.about-section-item {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid #409EFF;
}

.about-section-item h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.about-section-item ul {
  margin: 0;
  padding-left: 20px;
}

.about-section-item li {
  margin-bottom: 8px;
  line-height: 1.6;
  color: #555;
}

.about-section-item li:last-child {
  margin-bottom: 0;
}

.author-info {
  display: grid;
  gap: 12px;
}

.author-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #555;
}

.author-item strong {
  color: #333;
  min-width: 80px;
}

.author-item a {
  color: #409EFF;
  text-decoration: none;
  transition: color 0.3s;
}

.author-item a:hover {
  color: #337ecc;
  text-decoration: underline;
}

.version-info {
  display: grid;
  gap: 15px;
}

.version-item {
  background: white;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.version-item strong {
  color: #409EFF;
  font-size: 16px;
}

.version-item ul {
  margin: 10px 0 0 0;
  padding-left: 20px;
}

.version-item li {
  margin-bottom: 5px;
  font-size: 13px;
}

.about-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
}

.about-footer p {
  font-size: 16px;
  color: #666;
  margin: 0 0 20px 0;
}

.about-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.github-btn {
  background: linear-gradient(135deg, #24292e, #2f363d);
  border: none;
  color: white;
  transition: all 0.3s ease;
}

.github-btn:hover {
  background: linear-gradient(135deg, #2f363d, #24292e);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(36, 41, 46, 0.3);
}

</style> 