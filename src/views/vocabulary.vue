<template>
  <div class="vocabulary-container">
    <!-- 主页面 - 选择模式 -->
    <div class="mode-selection" v-if="currentMode === 'select'">
      <h1>词汇练习</h1>
      <div class="buttons">
        <button class="practice-btn" @click="startPractice">开始练习</button>
        <button class="review-btn" @click="startReview">开始复习</button>
      </div>
    </div>

    <!-- 练习模式 -->
    <div class="practice-mode" v-if="currentMode === 'practice' || currentMode === 'review'">
      <div class="word-card">
        <h2>{{ currentWord }}</h2>
        <p v-if="showMeaning">{{ currentMeaning }}</p>
      </div>

      <div class="action-buttons">
        <button class="know-btn" @click="handleKnow">认识</button>
        <button class="vague-btn" @click="handleVague">模糊</button>
        <button class="unknown-btn" @click="handleUnknown">不认识</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { getUserInfo } from '@/api/auth';
import { getWordList } from '@/api/word';

// 用户信息及进度
const userInfo = ref({});
const currentLetter = ref('A');
const currentIndex = ref(0);
const showMeaning = ref(false);

// 单词数据
const words = ref([]);
const currentWordIndex = ref(0);

// 当前模式：select（选择页面）, practice（练习模式）, review（复习模式）
const currentMode = ref('select');

// 加载用户信息和进度
onMounted(async () => {
  try {
    const res = await getUserInfo();
    if (res.code === 200) {
      userInfo.value = res.data;
      
      // 从进度中提取字母和索引
      if (userInfo.value.cet4 && userInfo.value.cet4.position) {
        const progress = userInfo.value.cet4.position.split(':');
        if (progress.length === 2) {
          currentLetter.value = progress[0];
          currentIndex.value = parseInt(progress[1]) || 0;
        }
      }
      
      // 预加载单词列表
      await loadWordList();
    }
  } catch (error) {
    console.error('获取用户信息失败', error);
  }
});

// 加载单词列表
async function loadWordList() {
  try {
    // 使用查询参数请求单词
    const response = await getWordList({ 
      letter: currentLetter.value, 
      index: currentIndex.value 
    });
    console.log(response);
    if(response.status === 200) {
      words.value = response.data.data;
      console.log('加载的单词列表:', words.value.words);
    } else {
      console.error('加载单词列表失败:', response.message);
    }
      
      // 重置单词索引
      currentWordIndex.value = 0;
    
  } catch (error) {
    console.error('请求单词列表错误:', error);
  }
}

// 计算属性：当前显示的单词
const currentWord = computed(() => {
  if (!words.value || words.value.length === 0) {
    return '加载中...';
  }
  
  if (currentWordIndex.value >= words.value.length) {
    return '本组单词学习完成';
  }
  
  return words.value[currentWordIndex.value];
});

// 计算属性：当前单词的释义（这里需要与后端API保持一致，暂时返回空）
const currentMeaning = computed(() => {
  return ''; // 实际项目中应返回单词释义
});

// 开始练习模式
const startPractice = async () => {
  currentMode.value = 'practice';
  await loadWordList(); // 确保加载了最新的单词列表
  currentWordIndex.value = 0;
  showMeaning.value = false;
};

// 开始复习模式
const startReview = async () => {
  currentMode.value = 'review';
  await loadWordList(); // 确保加载了最新的单词列表
  currentWordIndex.value = 0;
  showMeaning.value = false;
};

// 处理"认识"按钮点击
const handleKnow = () => {
  // 此处可添加逻辑，例如将单词标记为已掌握
  nextWord();
};

// 处理"模糊"按钮点击
const handleVague = () => {
  showMeaning.value = true;
  setTimeout(() => {
    nextWord();
  }, 2000); // 显示意思2秒后自动进入下一个单词
};

// 处理"不认识"按钮点击
const handleUnknown = () => {
  showMeaning.value = true;
  setTimeout(() => {
    nextWord();
  }, 2000); // 显示意思2秒后自动进入下一个单词
};

// 切换到下一个单词
const nextWord = async () => {
  if (currentWordIndex.value < words.value.length - 1) {
    currentWordIndex.value += 1;
    showMeaning.value = false;
  } else {
    // 当前批次单词学习完成，更新进度
    currentIndex.value += words.value.length;
    
    // 更新用户进度（实际项目中应调用API保存进度）
    // await updateWordProgress(`${currentLetter.value}:${currentIndex.value}`);
    
    // 练习完成，返回选择页面或加载下一批单词
    currentMode.value = 'select';
  }
};
</script>

<style scoped>
.vocabulary-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 20px;
}

.mode-selection {
  text-align: center;
}

h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #333;
}

.buttons {
  display: flex;
  gap: 20px;
}

button {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.practice-btn {
  background-color: #4CAF50;
  color: white;
}

.review-btn {
  background-color: #2196F3;
  color: white;
}

button:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.word-card {
  width: 300px;
  height: 200px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
}

.word-card h2 {
  font-size: 2rem;
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.know-btn {
  background-color: #4CAF50;
  color: white;
}

.vague-btn {
  background-color: #FF9800;
  color: white;
}

.unknown-btn {
  background-color: #F44336;
  color: white;
}
</style>
