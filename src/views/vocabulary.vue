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
import { ref, computed } from 'vue';
import { getUserInfo } from '@/api/auth';

getUserInfo().then(res => {
  console.log(res);
})
// 当前模式：select（选择页面）, practice（练习模式）, review（复习模式）
const currentMode = ref('select');

// 当前展示的单词
const currentWord = computed(() => {
  // 向后端请求单词信息
  
});



// 开始练习模式
const startPractice = () => {
  currentMode.value = 'practice';
  currentIndex.value = 0;
  showMeaning.value = false;
};

// 开始复习模式
const startReview = () => {
  currentMode.value = 'review';
  currentIndex.value = 0;
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
const nextWord = () => {
  if (currentIndex.value < words.length - 1) {
    currentIndex.value += 1;
    showMeaning.value = false;
  } else {
    // 练习完成，返回选择页面
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
