<template>
  <div class="chapter-selection">
    <div class="header">
      <h1>选择学习章节</h1>
      <p>每个章节都有不同的学习场景和词汇</p>
    </div>
    
    <div class="chapters-container">
      <div 
        v-for="chapter in chapters" 
        :key="chapter.id"
        class="chapter-card"
        :style="{ background: chapter.backgroundColor }"
        @click="selectChapter(chapter.id)"
      >
        <div class="chapter-content">
          <div class="chapter-header">
            <h2>{{ chapter.name }}</h2>
            <div class="chapter-progress">
              <span class="progress-text">{{ getChapterProgress(chapter.id) }}/5</span>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: (getChapterProgress(chapter.id) / 5) * 100 + '%' }"
                ></div>
              </div>
            </div>
          </div>
          
          <p class="chapter-description">{{ chapter.description }}</p>
          
          <div class="chapter-stats">
            <div class="stat-item">
              <span class="stat-label">场景</span>
              <span class="stat-value">{{ chapter.scenario === 'hotel' ? '酒店' : '餐厅' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">词汇量</span>
              <span class="stat-value">{{ chapter.vocabulary?.length || 0 }}</span>
            </div>
          </div>
          
          <div class="chapter-levels">
            <div 
              v-for="level in 5" 
              :key="level"
              class="level-dot"
              :class="{ 
                'completed': isLevelCompleted(chapter.id, level),
                'current': isCurrentLevel(chapter.id, level)
              }"
            >
              {{ level }}
            </div>
          </div>
        </div>
        
        <div class="chapter-overlay">
          <button class="select-btn">
            {{ currentChapter === chapter.id ? '继续学习' : '开始学习' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { switchChapter, getUserInfo } from '@/api/auth'

const router = useRouter()
const userInfo = ref(null)
const currentChapter = ref('A')

// 章节配置
const chapters = ref([
  {
    id: 'A',
    name: '酒店场景',
    description: '学习酒店入住、退房等相关英语',
    scenario: 'hotel',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    vocabulary: ['reception', 'check-in', 'check-out', 'reservation', 'lobby']
  },
  {
    id: 'B',
    name: '餐厅场景', 
    description: '学习餐厅点餐、用餐等相关英语',
    scenario: 'restaurant',
    backgroundColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    vocabulary: ['menu', 'order', 'appetizer', 'main course', 'dessert']
  }
])

// 获取章节进度
const getChapterProgress = (chapterId) => {
  if (!userInfo.value?.chapters?.[chapterId]) return 0
  const chapter = userInfo.value.chapters[chapterId]
  let completed = 0
  if (chapter.wordP) completed++
  if (chapter.spellP) completed++
  if (chapter.listenP) completed++
  if (chapter.customsP) completed++
  if (chapter.coverP) completed++
  return completed
}

// 检查关卡是否完成
const isLevelCompleted = (chapterId, level) => {
  if (!userInfo.value?.chapters?.[chapterId]) return false
  const chapter = userInfo.value.chapters[chapterId]
  const levelKeys = ['wordP', 'spellP', 'listenP', 'customsP', 'coverP']
  return chapter[levelKeys[level - 1]] || false
}

// 检查是否为当前关卡
const isCurrentLevel = (chapterId, level) => {
  if (!userInfo.value?.chapters?.[chapterId]) return level === 1
  const chapter = userInfo.value.chapters[chapterId]
  return (chapter.level || 1) === level
}

// 选择章节
const selectChapter = async (chapterId) => {
  try {
    const response = await switchChapter(chapterId)
    console.log('API响应:', response) // 调试日志
    
    // axios 响应数据在 response.data 中
    const data = response.data || response
    
    if (data.code === 200) {
      currentChapter.value = chapterId
      // 跳转到冒险页面
      router.push('/adventure')
    } else {
      console.error('切换章节失败:', data.message || '未知错误')
    }
  } catch (error) {
    console.error('切换章节错误:', error)
    // 显示更友好的错误提示
    alert('切换章节失败，请检查网络连接或重新登录')
  }
}

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const response = await getUserInfo()
    console.log('用户信息API响应:', response) // 调试日志
    
    // axios 响应数据在 response.data 中
    const data = response.data || response
    
    if (data.code === 200) {
      userInfo.value = data
      currentChapter.value = data.currentChapter || 'A'
    } else {
      console.error('获取用户信息失败:', data.message || '未知错误')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.chapter-selection {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 3rem;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.header p {
  font-size: 1.1rem;
  opacity: 0.9;
}

.chapters-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  width: 100%;
}

.chapter-card {
  position: relative;
  border-radius: 20px;
  padding: 2rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  min-height: 300px;
}

.chapter-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.chapter-card:hover .chapter-overlay {
  opacity: 1;
}

.chapter-content {
  position: relative;
  z-index: 2;
}

.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.chapter-header h2 {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
}

.chapter-progress {
  text-align: right;
}

.progress-text {
  font-size: 0.9rem;
  opacity: 0.9;
  display: block;
  margin-bottom: 0.5rem;
}

.progress-bar {
  width: 80px;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  transition: width 0.3s ease;
}

.chapter-description {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.chapter-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
}

.chapter-levels {
  display: flex;
  gap: 0.5rem;
}

.level-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.level-dot.completed {
  background: rgba(255, 255, 255, 0.9);
  color: #333;
}

.level-dot.current {
  background: #FFD700;
  color: #333;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.chapter-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 3;
}

.select-btn {
  background: white;
  color: #333;
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.select-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .chapters-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .chapter-card {
    padding: 1.5rem;
    min-height: 250px;
  }
  
  .chapter-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .chapter-stats {
    gap: 1rem;
  }
}
</style>