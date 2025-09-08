<template>
  <div class="adventure-container">
    <!-- 闯关地图 -->
    <div class="adventure-map" v-if="currentView === 'map'">
      <div class="map-header">
        <h1 class="map-title">🗺️ 英语闯关之旅</h1>
        <p class="map-subtitle">完成每个关卡，提升你的英语水平</p>
      </div>

      <div class="levels-container">
        <div class="level-path">
          <!-- 第一关：词汇练习 -->
          <div class="level-node" :class="getLevelClass('wordP')" @click="enterLevel('wordP')">
            <div class="level-icon">📚</div>
            <div class="level-info">
              <h3 class="level-title">第一关</h3>
              <p class="level-name">词汇练习</p>
              <div class="level-progress">{{ getLevelProgress('wordP') }}</div>
            </div>
            <div class="level-status">{{ getLevelStatus('wordP') }}</div>
          </div>

          <!-- 连接线 -->
          <div class="level-connector" :class="{ 'unlocked': isLevelUnlocked('spellP') }"></div>

          <!-- 第二关：词汇拼写 -->
          <div class="level-node" :class="getLevelClass('spellP')" @click="enterLevel('spellP')">
            <div class="level-icon">✏️</div>
            <div class="level-info">
              <h3 class="level-title">第二关</h3>
              <p class="level-name">词汇拼写</p>
              <div class="level-progress">{{ getLevelProgress('spellP') }}</div>
            </div>
            <div class="level-status">{{ getLevelStatus('spellP') }}</div>
          </div>
        </div>
      </div>

      <!-- 总体进度 -->
      <div class="overall-progress">
        <h3>总体进度</h3>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: overallProgress + '%' }"></div>
        </div>
        <p>{{ completedLevels }}/2 关卡完成</p>
      </div>
    </div>

    <!-- 第一关：词汇练习 -->
    <div class="level-content" v-if="currentView === 'level-wordP'">
      <div class="level-header">
        <button class="back-btn" @click="backToMap">← 返回地图</button>
        <div class="level-info">
          <h2>📚 第一关：词汇练习</h2>
          <p>学习新单词，选择你对每个单词的熟悉程度</p>
        </div>
      </div>

      <!-- 使用词汇练习组件 -->
      <VocabularyPractice v-if="!showLevelComplete" :words="vocabularyWords" :currentIndex="currentWordIndex"
        @know="handleKnow" @vague="handleVague" @unknown="handleUnknown" @next="handleNext"
        @complete="handleVocabularyComplete" />
      <!-- 关卡完成 -->
      <div class="level-complete" v-if="showLevelComplete">
        <div class="complete-icon">🎉</div>
        <h3>第一关完成！</h3>
        <p>你已经完成了词汇练习，学习了 {{ vocabularyWords.length }} 个单词</p>
        <div class="complete-stats">
          <div class="stat-item">
            <span class="stat-number">{{ knownWords }}</span>
            <span class="stat-label">认识</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ vagueWords }}</span>
            <span class="stat-label">模糊</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ unknownWords }}</span>
            <span class="stat-label">不认识</span>
          </div>
        </div>
        <div class="complete-actions">
          <button class="btn-primary" @click="nextLevel">进入下一关</button>
          <button class="btn-secondary" @click="backToMap">返回地图</button>
        </div>
      </div>
    </div>

    <!-- 第二关：词汇拼写 -->
    <div class="level-content" v-if="currentView === 'level-spellP'">
      <div class="level-header">
        <button class="back-btn" @click="backToMap">← 返回地图</button>
        <div class="level-info">
          <h2>✏️ 第二关：词汇拼写</h2>
          <p>根据中文释义和发音，拼写出正确的单词</p>
        </div>
      </div>

      <!-- 使用拼写练习组件 -->
      <SpellingPractice v-if="!showSpellingComplete" :words="spellingWords" :startIndex="0"
        @complete="handleSpellingComplete" @next="handleSpellingNext" @correct="handleSpellingCorrect"
        @incorrect="handleSpellingIncorrect" />

      <!-- 关卡完成 -->
      <div class="level-complete" v-if="showSpellingComplete">
        <div class="complete-icon">🎉</div>
        <h3>第二关完成！</h3>
        <p>你已经完成了拼写练习，练习了 {{ spellingWords.length }} 个单词</p>
        <div class="complete-stats">
          <div class="stat-item">
            <span class="stat-number">{{ correctSpellings }}</span>
            <span class="stat-label">正确</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ incorrectSpellings }}</span>
            <span class="stat-label">错误</span>
          </div>
        </div>
        <div class="complete-actions">
          <button class="btn-primary" @click="backToMap">返回地图</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUserInfo, changeInfo } from '@/api/auth'

import VocabularyPractice from '@/components/VocabularyPractice.vue'
import SpellingPractice from '@/components/SpellingPractice.vue'

// 响应式数据
const currentView = ref('map')
const userInfo = ref(null)

// 词汇练习相关数据
const vocabularyWords = ref([])
const currentWordIndex = ref(0)
const showMeaning = ref(false)
const showLevelComplete = ref(false)
const knownWords = ref(0)
const vagueWords = ref(0)
const unknownWords = ref(0)

// 拼写练习相关数据
const spellingWords = ref([])
const showSpellingComplete = ref(false)
const correctSpellings = ref(0)
const incorrectSpellings = ref(0)

// 计算属性
const currentVocabularyWord = computed(() => {
  return vocabularyWords.value[currentWordIndex.value]
})

const vocabularyProgress = computed(() => {
  if (vocabularyWords.value.length === 0) return 0
  return (currentWordIndex.value / vocabularyWords.value.length) * 100
})

const overallProgress = computed(() => {
  if (!userInfo.value) return 0
  const cet4 = userInfo.value.cet4
  let completed = 0
  if (cet4.wordP) completed++
  if (cet4.spellP) completed++
  return (completed / 2) * 100
})

const completedLevels = computed(() => {
  if (!userInfo.value) return 0
  const cet4 = userInfo.value.cet4
  let completed = 0
  if (cet4.wordP) completed++
  if (cet4.spellP) completed++
  return completed
})

// 方法
const getLevelClass = (level) => {
  if (!userInfo.value) return 'locked'
  const cet4 = userInfo.value.cet4
  if (cet4[level]) return 'completed'
  if (isLevelUnlocked(level)) return 'unlocked'
  return 'locked'
}

const getLevelProgress = (level) => {
  if (!userInfo.value) return '未开始'
  const cet4 = userInfo.value.cet4
  if (cet4[level]) return '✅ 已完成'
  return '未开始'
}

const getLevelStatus = (level) => {
  if (!userInfo.value) return '🔒'
  const cet4 = userInfo.value.cet4
  if (cet4[level]) return '✅'
  if (isLevelUnlocked(level)) return '🔓'
  return '🔒'
}

const isLevelUnlocked = (level) => {
  if (!userInfo.value) return false
  const cet4 = userInfo.value.cet4

  if (level === 'wordP') return true // 第一关总是解锁的
  if (level === 'spellP') return cet4.wordP // 第二关需要完成第一关

  return false
}

const enterLevel = (level) => {
  if (!isLevelUnlocked(level)) return

  if (level === 'wordP') {
    startVocabularyPractice()
  } else if (level === 'spellP') {
    startSpellingPractice()
  }
}

const backToMap = () => {
  currentView.value = 'map'
  resetVocabularyPractice()
}

const startVocabularyPractice = async () => {
  try {
    // 获取当前用户位置
    const position = userInfo.value.cet4.position
    const [letter, index] = position.split(':')

    // 获取单词列表
    const response = await fetch(`/api/word/getWordList?letter=${letter}&index=${index}`)
    const data = await response.json()

    if (data.code === 200) {
      vocabularyWords.value = data.data.words || []
      currentWordIndex.value = 0
      showMeaning.value = false
      showLevelComplete.value = false
      knownWords.value = 0
      vagueWords.value = 0
      unknownWords.value = 0
      currentView.value = 'level-wordP'
    }
  } catch (error) {
    console.error('获取单词列表失败:', error)
  }
}

const resetVocabularyPractice = () => {
  vocabularyWords.value = []
  currentWordIndex.value = 0
  showMeaning.value = false
  showLevelComplete.value = false
}

const startSpellingPractice = async () => {
  try {
    // 获取当前用户位置
    const position = userInfo.value.cet4.position
    const [letter, index] = position.split(':')

    // 获取单词列表（复用词汇练习的单词）
    const response = await fetch(`/api/word/getWordList?letter=${letter}&index=${index}`)
    const data = await response.json()

    if (data.code === 200) {
      spellingWords.value = data.data.words || []
      showSpellingComplete.value = false
      correctSpellings.value = 0
      incorrectSpellings.value = 0
      currentView.value = 'level-spellP'
    }
  } catch (error) {
    console.error('获取拼写单词列表失败:', error)
  }
}

const toggleMeaning = () => {
  showMeaning.value = !showMeaning.value
}

const handleKnow = (index) => {
  knownWords.value++
}

const handleVague = (index) => {
  vagueWords.value++
}

const handleUnknown = (index) => {
  unknownWords.value++
}

const handleNext = (index) => {
  currentWordIndex.value = index
}

const handleVocabularyComplete = async () => {
  // 完成第一关
  await completeLevel('wordP')
}

const handleSpellingComplete = async () => {
  // 完成第二关
  showSpellingComplete.value = true
  await completeLevel('spellP')
}

const handleSpellingNext = (index) => {
  // 处理拼写练习下一个单词
}

const handleSpellingCorrect = (index) => {
  correctSpellings.value++
}

const handleSpellingIncorrect = (index) => {
  incorrectSpellings.value++
}

const completeLevel = async (level) => {
  try {
    // 更新用户进度
    await changeInfo({ [level]: true })

    // 刷新用户信息
    await loadUserInfo()

    if (level === 'wordP') {
      showLevelComplete.value = true
    }
  } catch (error) {
    console.error('更新关卡进度失败:', error)
  }
}

const nextLevel = () => {
  // 进入下一关（暂时返回地图）
  backToMap()
}

const loadUserInfo = async () => {
  try {
    const response = await getUserInfo()
    if (response.data) {
      userInfo.value = response.data
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 页面加载时获取用户信息
onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.adventure-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.adventure-map {
  max-width: 800px;
  margin: 0 auto;
}

.map-header {
  text-align: center;
  color: white;
  margin-bottom: 2rem;
}

.map-title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.levels-container {
  margin-bottom: 2rem;
}

.level-path {
  display: flex;
  align-items: center;
  gap: 2rem;
  justify-content: center;
}

.level-node {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  min-width: 150px;
  text-align: center;
  cursor: pointer;
  position: relative;
}

.level-node.completed {
  background: #4CAF50;
  color: white;
}

.level-node.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.level-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.level-title {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.level-name {
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
}

.level-progress {
  font-size: 0.7rem;
}

.level-status {
  position: absolute;
  top: -8px;
  right: -8px;
  background: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.level-connector {
  width: 40px;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
}

.level-connector.unlocked {
  background: #4CAF50;
}

.overall-progress {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  color: white;
}

.progress-bar {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  height: 16px;
  margin: 0.5rem 0;
}

.progress-fill {
  background: #4CAF50;
  height: 100%;
  border-radius: 8px;
  transition: width 0.3s ease;
}

.level-content {
  max-width: 600px;
  margin: 0 auto;
}

.level-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  color: white;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.vocabulary-practice,
.spelling-practice {
  background: white;
  border-radius: 12px;
  padding: 2rem;
}

.practice-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.practice-progress .progress-bar {
  flex: 1;
  background: #f0f0f0;
  height: 6px;
  border-radius: 3px;
}

.practice-progress .progress-fill {
  background: #667eea;
  height: 100%;
  border-radius: 3px;
}

.progress-text {
  font-size: 14px;
  color: #666;
}

.word-card {
  text-align: center;
  margin-bottom: 2rem;
}

.word-text {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.phonetic {
  color: #666;
  margin-bottom: 1rem;
}

.hint-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  margin-bottom: 1rem;
}

.hint-btn.active {
  background: #4CAF50;
}

.meaning-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  min-width: 80px;
}

.know-btn {
  background: #4CAF50;
  color: white;
}

.vague-btn {
  background: #FF9800;
  color: white;
}

.unknown-btn {
  background: #f44336;
  color: white;
}

.action-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.level-complete {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
}

.complete-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.complete-stats {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 1rem 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
}

.complete-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-secondary {
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
  padding: 8px 18px;
  border-radius: 6px;
  cursor: pointer;
}

.placeholder-content {
  text-align: center;
  padding: 2rem;
}

@media (max-width: 768px) {
  .level-path {
    flex-direction: column;
    gap: 1rem;
  }

  .level-connector {
    width: 3px;
    height: 30px;
    transform: rotate(90deg);
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
