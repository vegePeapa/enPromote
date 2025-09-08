<template>
  <div class="ai-chat-practice">
    <!-- 场景选择模态框 -->
    <div v-if="showSceneModal" class="guide-modal-overlay">
      <div class="guide-modal">
        <div class="guide-header">
          <h2>🎯 选择对话场景</h2>
          <p>选择一个场景开始任务导向的AI对话练习</p>
        </div>
        <div class="scene-options">
          <div v-for="scene in sceneOptions" :key="scene.value" class="scene-card"
            :class="{ active: selectedScene === scene.value }" @click="selectedScene = scene.value">
            <div class="scene-icon">{{ scene.icon }}</div>
            <h3>{{ scene.name }}</h3>
            <p>{{ scene.description }}</p>
            <div class="scene-tasks">
              <span class="tasks-label">主要任务：</span>
              <ul>
                <li v-for="task in scene.tasks" :key="task">{{ task }}</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="guide-actions">
          <button class="btn-primary" :disabled="!selectedScene" @click="startTaskChat">开始对话</button>
        </div>
      </div>
    </div>

    <!-- 聊天界面 -->
    <div v-if="!showSceneModal && sessionId" class="chat-interface">
      <!-- 聊天头部 -->
      <div class="chat-header">
        <div class="ai-info">
          <div class="ai-avatar">{{ sceneInfo.aiRole === '酒店前台接待员' ? '🏨' : '🍽️' }}</div>
          <div class="ai-details">
            <span class="ai-name">{{ sceneInfo.aiRole || 'AI助手' }}</span>
            <span class="ai-status">
              <span class="status-dot"></span>
              {{ sceneInfo.scene || '在线' }}
            </span>
          </div>
        </div>
        <div class="chat-actions">
          <button class="action-btn" @click="showTaskProgress = !showTaskProgress" title="任务进度">📋</button>
          <button class="action-btn" @click="showPracticeWords" title="练习单词">📚</button>
          <button class="action-btn" @click="exitChat" title="退出对话">❌</button>
        </div>
      </div>

      <!-- 任务进度条 -->
      <div v-if="showTaskProgress" class="task-progress-panel">
        <div class="progress-header">
          <h3>📋 任务进度</h3>
          <button class="close-btn" @click="showTaskProgress = false">✕</button>
        </div>
        <div class="progress-stats">
          <div class="stat-item">
            <span class="stat-label">已完成任务</span>
            <span class="stat-value">{{ progress.tasksCompleted }}/{{ progress.totalTasks }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已使用单词</span>
            <span class="stat-value">{{ progress.wordsUsed }}个</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">对话轮次</span>
            <span class="stat-value">{{ progress.turnCount }}轮</span>
          </div>
        </div>
        <div class="tasks-list">
          <div v-for="task in tasks" :key="task.id" class="task-item"
            :class="{ completed: task.completed, current: !task.completed && isCurrentTask(task) }">
            <div class="task-status">
              <span v-if="task.completed" class="status-icon completed">✅</span>
              <span v-else-if="isCurrentTask(task)" class="status-icon current">🔄</span>
              <span v-else class="status-icon pending">⏳</span>
            </div>
            <div class="task-content">
              <h4>{{ task.name }}</h4>
              <p>{{ task.description }}</p>
              <div class="task-words">
                <span class="words-label">需要单词：</span>
                <span v-for="word in task.requiredWords" :key="word" class="word-tag"
                  :class="{ used: task.usedWords && task.usedWords.includes(word) }">
                  {{ word }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 消息区域 -->
      <div class="messages-container" ref="messagesContainer">
        <div v-if="messages.length === 0" class="welcome-message">
          <div class="welcome-icon">👋</div>
          <h3>欢迎来到AI对话练习！</h3>
          <p>开始你的第一次对话吧，AI老师会帮助你练习英语单词。</p>
        </div>

        <div v-for="message in messages" :key="message.id" class="message-wrapper">
          <div class="message"
            :class="{ 'user-message': message.role === 'user', 'ai-message': message.role === 'assistant' }">
            <div class="message-avatar">
              {{ message.role === 'user' ? '👤' : '👨‍🏫' }}
            </div>
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
              <div v-if="message.streaming" class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input">
        <div class="input-container">
          <div class="input-wrapper">
            <input v-model="inputMessage" @keyup.enter="sendMessage"
              :placeholder="useEnglish ? 'Type your message in English...' : '请用英文输入你的消息...'" :disabled="loading"
              class="message-input" />
            <button class="send-btn" @click="sendMessage" :disabled="loading || !inputMessage.trim()">
              <span v-if="loading" class="loading-spinner">⏳</span>
              <span v-else class="send-icon">📤</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 练习单词侧边栏 -->
    <div v-if="showWordsSidebar" class="words-sidebar-overlay" @click="showWordsSidebar = false">
      <div class="words-sidebar" @click.stop>
        <div class="sidebar-header">
          <h3>📚 练习单词</h3>
          <button class="close-btn" @click="showWordsSidebar = false">✕</button>
        </div>
        <div class="words-list">
          <div v-for="word in practiceWords" :key="word.id" class="word-item">
            <div class="word-main">
              <span class="word-text">{{ word.word }}</span>
              <span class="word-phonetic">{{ word.phonetic_symbol }}</span>
            </div>
            <div class="word-meaning">{{ word.mean }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, computed } from 'vue'

// Props
const props = defineProps({
  chapter: {
    type: String,
    default: 'A'
  }
})

// Emits
const emit = defineEmits(['complete', 'exit'])

// 响应式数据
const showSceneModal = ref(true)
const selectedScene = ref('')
const sessionId = ref('')
const sceneInfo = ref({})

const inputMessage = ref('')
const messages = ref([])
const loading = ref(false)
const messagesContainer = ref(null)

// 任务相关数据
const tasks = ref([])
const progress = ref({
  tasksCompleted: 0,
  totalTasks: 0,
  wordsUsed: 0,
  turnCount: 0
})
const showTaskProgress = ref(false)
const completionReport = ref(null)

const showWordsSidebar = ref(false)
const practiceWords = ref([])

// 场景选项配置
const sceneOptions = ref([
  {
    value: 'A',
    name: '酒店入住',
    icon: '🏨',
    description: '模拟酒店前台办理入住手续的完整流程',
    tasks: ['确认预订信息', '检查身份证件', '介绍房间设施', '说明酒店政策', '完成入住登记']
  },
  {
    value: 'B',
    name: '餐厅用餐',
    icon: '🍽️',
    description: '模拟在餐厅用餐的完整服务流程',
    tasks: ['欢迎客人', '介绍菜单', '记录点餐', '询问特殊需求', '服务和结账']
  }
])

// 计算属性
const isCurrentTask = computed(() => {
  return (task) => {
    const incompleteTasks = tasks.value.filter(t => !t.completed)
    return incompleteTasks.length > 0 && incompleteTasks[0].id === task.id
  }
})

// 开始任务对话
const startTaskChat = async () => {
  if (!selectedScene.value) return

  try {
    const response = await fetch('/api/aiApi/startTaskChat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scene: selectedScene.value
      })
    })

    const data = await response.json()
    if (data.code === 200) {
      sessionId.value = data.data.sessionId
      sceneInfo.value = data.data.sceneInfo
      tasks.value = data.data.tasks
      progress.value = data.data.progress
      
      // 添加欢迎消息
      messages.value.push({
        id: Date.now(),
        role: 'assistant',
        content: data.data.welcomeMessage,
        timestamp: new Date()
      })

      showSceneModal.value = false
      showTaskProgress.value = true // 默认显示任务进度
    } else {
      console.error('创建会话失败:', data.message)
    }
  } catch (error) {
    console.error('创建会话失败:', error)
  }
}

// 发送任务导向消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || loading.value || !sessionId.value) return

  const userMessage = inputMessage.value.trim()

  // 添加用户消息
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: userMessage,
    timestamp: new Date()
  })

  // 添加AI消息占位符
  const aiMessageId = Date.now() + 1
  messages.value.push({
    id: aiMessageId,
    role: 'assistant',
    content: '',
    timestamp: new Date(),
    streaming: true
  })

  inputMessage.value = ''
  loading.value = true

  try {
    // 使用fetch处理SSE流式响应
    const response = await fetch('/api/aiApi/taskChat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: sessionId.value,
        message: userMessage
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          const event = line.slice(7)
          const nextLine = lines[lines.indexOf(line) + 1]
          
          if (nextLine && nextLine.startsWith('data: ')) {
            const data = nextLine.slice(6)
            
            if (event === 'delta') {
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  // 更新AI消息内容
                  const aiMessage = messages.value.find(msg => msg.id === aiMessageId)
                  if (aiMessage) {
                    aiMessage.content += parsed.content
                    scrollToBottom()
                  }
                }
              } catch (e) {
                // 忽略解析错误
              }
            } else if (event === 'progress') {
              try {
                const parsed = JSON.parse(data)
                if (parsed.progress) {
                  progress.value = parsed.progress
                }
                if (parsed.currentTask) {
                  // 更新任务状态
                  const taskIndex = tasks.value.findIndex(t => t.id === parsed.currentTask.id)
                  if (taskIndex !== -1) {
                    tasks.value[taskIndex] = parsed.currentTask
                  }
                }
              } catch (e) {
                console.error('解析进度数据失败:', e)
              }
            } else if (event === 'completion') {
              try {
                const parsed = JSON.parse(data)
                if (parsed.completed) {
                  completionReport.value = parsed.report
                  showCompletionModal()
                }
              } catch (e) {
                console.error('解析完成数据失败:', e)
              }
            } else if (event === 'end' && data === '[DONE]') {
              // 流结束
              const aiMessage = messages.value.find(msg => msg.id === aiMessageId)
              if (aiMessage) {
                aiMessage.streaming = false
              }
              break
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    // 移除失败的消息
    messages.value = messages.value.filter(msg => msg.id !== aiMessageId)
  } finally {
    loading.value = false
  }
}

// 显示完成模态框
const showCompletionModal = () => {
  // 这里可以显示任务完成的模态框
  alert(`恭喜完成任务！\n${completionReport.value.feedback}`)
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 格式化时间
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 显示练习单词
const showPracticeWords = async () => {
  try {
    const response = await fetch('/api/aiApi/getPracticeWords')
    const data = await response.json()
    if (data.code === 200) {
      practiceWords.value = data.data
      showWordsSidebar.value = true
    }
  } catch (error) {
    console.error('获取练习单词失败:', error)
  }
}

// 退出对话
const exitChat = () => {
  emit('complete', {
    messageCount: messages.value.length,
    userMessages: messages.value.filter(msg => msg.role === 'user').length,
    aiMessages: messages.value.filter(msg => msg.role === 'assistant').length
  })
}

// 生命周期
onMounted(() => {
  // 组件挂载后的初始化
})
</script>

<style scoped>
.ai-chat-practice {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 指引模态框样式 */
.guide-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.guide-modal {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.guide-header {
  text-align: center;
  margin-bottom: 2rem;
}

.guide-header h2 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.8rem;
}

.guide-header p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.personality-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.personality-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.personality-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.personality-card.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.personality-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.personality-card h3 {
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.personality-card p {
  font-size: 0.9rem;
  opacity: 0.8;
}

.language-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.language-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.language-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
}

.language-card.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.language-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.language-card h3 {
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.language-card p {
  margin-bottom: 1rem;
  opacity: 0.8;
}

.language-example {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.8rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.language-card:not(.active) .language-example {
  background: #f8f9fa;
}

.example-label {
  font-weight: bold;
  margin-right: 0.5rem;
}

.guide-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f8f9fa;
  color: #666;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #e9ecef;
}

/* 聊天界面样式 */
.chat-interface {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: white;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ai-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.ai-avatar {
  font-size: 2rem;
}

.ai-details {
  display: flex;
  flex-direction: column;
}

.ai-name {
  font-weight: bold;
  color: #333;
}

.ai-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #4CAF50;
  border-radius: 50%;
}

.chat-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.3s ease;
}

.action-btn:hover {
  background: #f0f0f0;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: #f8f9fa;
}

.welcome-message {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.welcome-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.welcome-message h3 {
  margin-bottom: 0.5rem;
  color: #333;
}

.message-wrapper {
  margin-bottom: 1rem;
}

.message {
  display: flex;
  gap: 1rem;
  max-width: 80%;
}

.user-message {
  margin-left: auto;
  flex-direction: row-reverse;
}

.user-message .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.ai-message .message-content {
  background: white;
  border: 1px solid #e0e0e0;
}

.message-avatar {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f0f0f0;
  flex-shrink: 0;
}

.message-content {
  padding: 1rem;
  border-radius: 12px;
  position: relative;
}

.message-text {
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.message-time {
  font-size: 0.8rem;
  opacity: 0.6;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  margin-top: 0.5rem;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {

  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.3;
  }

  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.chat-input {
  padding: 1rem 1.5rem;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.input-container {
  max-width: 800px;
  margin: 0 auto;
}

.input-wrapper {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.message-input {
  flex: 1;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 25px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;
}

.message-input:focus {
  border-color: #667eea;
}

.send-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.1);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 练习单词侧边栏 */
.words-sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.words-sidebar {
  width: 350px;
  background: white;
  height: 100vh;
  overflow-y: auto;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.sidebar-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 场景选择样式 */
.scene-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.scene-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.scene-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
}

.scene-card.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.scene-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  text-align: center;
}

.scene-card h3 {
  margin-bottom: 0.5rem;
  font-size: 1.3rem;
  text-align: center;
}

.scene-card p {
  margin-bottom: 1rem;
  opacity: 0.8;
  text-align: center;
}

.scene-tasks {
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.scene-card:not(.active) .scene-tasks {
  background: #f8f9fa;
}

.tasks-label {
  font-weight: bold;
  margin-bottom: 0.5rem;
  display: block;
}

.scene-tasks ul {
  margin: 0;
  padding-left: 1.2rem;
}

.scene-tasks li {
  margin-bottom: 0.3rem;
}

/* 任务进度面板样式 */
.task-progress-panel {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.progress-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.progress-stats {
  display: flex;
  justify-content: space-around;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.3rem;
}

.stat-value {
  display: block;
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}

.tasks-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 1rem;
}

.task-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.task-item.completed {
  background: #e8f5e8;
  border-left: 4px solid #4CAF50;
}

.task-item.current {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
}

.task-item:not(.completed):not(.current) {
  background: #f8f9fa;
  border-left: 4px solid #dee2e6;
}

.task-status {
  flex-shrink: 0;
}

.status-icon {
  font-size: 1.2rem;
}

.task-content h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #333;
}

.task-content p {
  margin: 0 0 0.8rem 0;
  font-size: 0.9rem;
  color: #666;
  line-height: 1.4;
}

.task-words {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.words-label {
  font-size: 0.8rem;
  color: #666;
  margin-right: 0.5rem;
}

.word-tag {
  background: #e9ecef;
  color: #495057;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.word-tag.used {
  background: #d4edda;
  color: #155724;
  font-weight: bold;
}

.words-list {
  padding: 1rem;
}

.word-item {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.word-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.word-text {
  font-weight: bold;
  color: #333;
  font-size: 1.1rem;
}

.word-phonetic {
  color: #667eea;
  font-style: italic;
}

.word-meaning {
  color: #666;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .guide-modal {
    width: 95%;
    padding: 1.5rem;
  }

  .personality-options {
    grid-template-columns: 1fr;
  }

  .language-options {
    grid-template-columns: 1fr;
  }

  .words-sidebar {
    width: 100%;
  }

  .message {
    max-width: 95%;
  }
}
</style>
