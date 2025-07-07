<template>
  <div class="vocabulary-card">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <p>加载中...</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>
    
    <!-- 词汇内容 -->
    <div v-else-if="wordData" class="word-content">
      <!-- 单词和音标 -->
      <div class="word-header">
        <h2 class="word-title">{{ wordData.word }}</h2>
        <div class="phonetics" v-if="wordData.phonetics && wordData.phonetics.length">
          <span class="phonetic" v-for="(phonetic, index) in wordData.phonetics" :key="index">
            {{ phonetic.text || '' }}
            <button v-if="phonetic.audio" @click="playAudio(phonetic.audio)" class="audio-btn">
              <i class="audio-icon">🔊</i>
            </button>
          </span>
        </div>
        <button class="next-btn" @click="emit('next')">next</button>
      </div>
      
      <!-- 词性和释义 -->
      <div class="meanings" v-if="wordData.meanings && wordData.meanings.length">
        <div v-for="(meaning, mIndex) in wordData.meanings" :key="mIndex" class="meaning-item">
          <h3 class="part-of-speech">{{ meaning.partOfSpeech }}</h3>
          
          <div class="definitions">
            <div v-for="(definition, dIndex) in meaning.definitions" :key="dIndex" class="definition-item">
              <p class="definition">{{ definition.definition }}</p>
              
              <p v-if="definition.example" class="example">
                "{{ definition.example }}"
              </p>
              
              <div v-if="definition.synonyms && definition.synonyms.length" class="synonyms">
                <span>同义词: </span>
                <span v-for="(synonym, sIndex) in definition.synonyms" :key="sIndex">
                  {{ synonym }}{{ sIndex < definition.synonyms.length - 1 ? ', ' : '' }}
                </span>
              </div>
              
              <div v-if="definition.antonyms && definition.antonyms.length" class="antonyms">
                <span>反义词: </span>
                <span v-for="(antonym, aIndex) in definition.antonyms" :key="aIndex">
                  {{ antonym }}{{ aIndex < definition.antonyms.length - 1 ? ', ' : '' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 无数据状态 -->
    <div v-else class="no-data">
      <p>没有找到单词数据</p>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted } from 'vue';

// 定义属性
const props = defineProps({
  word: {
    type: String,
    required: true
  },
  wordData: {
    type: Object,
    default: null
  }
});

// 定义事件
const emit = defineEmits(['word-click', 'audio-play','next']);

// 状态管理
const loading = ref(false);
const error = ref(null);
const audioElement = ref(null);

// 播放发音
function playAudio(audioUrl) {
  if (!audioUrl) return;
  
  if (!audioElement.value) {
    audioElement.value = new Audio();
  }
  
  audioElement.value.src = audioUrl;
  audioElement.value.play().catch(err => {
    console.error('音频播放失败:', err);
    error.value = '音频播放失败';
  });
  
  emit('audio-play', audioUrl);
}

// 生命周期钩子
onMounted(() => {
  // 可以在这里添加初始化逻辑
});
</script>

<style scoped>
.next-btn {
  margin-top: 20px;
  padding: 10px 24px;
  background: #2196F3;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}
.next-btn:hover {
  background: #1769aa;
}
.vocabulary-card {
  width: 100%;
  max-width: 600px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin: 0 auto;
  transition: all 0.3s ease;
  position: fixed;
  left: 33%;
  
}

.vocabulary-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.loading, .error, .no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 150px;
  text-align: center;
  color: #666;
}

.error {
  color: #e74c3c;
}

.word-header {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.word-title {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin: 0 15px 0 0;
}

.phonetics {
  display: flex;
  gap: 10px;
}

.phonetic {
  font-family: Arial, sans-serif;
  color: #666;
  font-style: italic;
  display: flex;
  align-items: center;
}

.audio-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #3498db;
  margin-left: 5px;
}

.audio-icon {
  font-style: normal;
}

.meaning-item {
  margin-bottom: 20px;
}

.part-of-speech {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 10px;
  font-style: italic;
}

.definition-item {
  margin-bottom: 15px;
  padding-left: 15px;
  border-left: 3px solid #3498db;
}

.definition {
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 8px;
}

.example {
  font-style: italic;
  color: #7f8c8d;
  margin: 8px 0;
  padding-left: 10px;
}

.synonyms, .antonyms {
  font-size: 0.9rem;
  margin-top: 5px;
  color: #555;
}
</style>
