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
    <div v-else-if="wordData && wordData.word" class="word-content">
      <!-- 单词和音标 -->
      <div class="word-header">
        <div class="word-info">
          <h2 class="word-title">{{ wordData.word }}</h2>
          <div class="phonetics" v-if="wordData.phonetics && wordData.phonetics.length">
            <span class="phonetic" v-for="(phonetic, index) in wordData.phonetics" :key="index">
              {{ phonetic.text || '' }}
              <button v-if="phonetic.audio" @click="playAudio(phonetic.audio)" class="audio-btn">
                <i class="audio-icon">🔊</i>
              </button>
            </span>
          </div>
        </div>
        <button class="next-btn" @click="emit('next')">下一个</button>
      </div>

      <!-- 词性和释义 - 可滚动区域 -->
      <div class="meanings-container">
        <div class="meanings" v-if="wordData.meanings && wordData.meanings.length">
          <div v-for="(meaning, mIndex) in limitedMeanings" :key="mIndex" class="meaning-item">
            <!-- 词性标签 -->
            <div class="part-of-speech-tag">
              <span class="pos-label">{{ meaning.partOfSpeech }}</span>
            </div>

            <!-- 定义列表 -->
            <div class="definitions">
              <div v-for="(definition, dIndex) in meaning.definitions.slice(0, 2)" :key="dIndex"
                class="definition-item">
                <div class="definition-content">
                  <span class="definition-number">{{ dIndex + 1 }}.</span>
                  <p class="definition">{{ truncateText(definition.definition, 120) }}</p>
                </div>

                <p v-if="definition.example && definition.example.length < 100" class="example">
                  <span class="example-label">例句:</span>
                  "{{ definition.example }}"
                </p>

                <!-- 同义词和反义词 - 简化显示 -->
                <div class="word-relations" v-if="definition.synonyms?.length || definition.antonyms?.length">
                  <span v-if="definition.synonyms?.length" class="synonyms">
                    <strong>同义:</strong> {{ definition.synonyms.slice(0, 3).join(', ') }}
                    <span v-if="definition.synonyms.length > 3">...</span>
                  </span>
                  <span v-if="definition.antonyms?.length" class="antonyms">
                    <strong>反义:</strong> {{ definition.antonyms.slice(0, 3).join(', ') }}
                    <span v-if="definition.antonyms.length > 3">...</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- 显示更多定义的提示 -->
            <div v-if="meaning.definitions.length > 2" class="more-definitions">
              <span class="more-text">还有 {{ meaning.definitions.length - 2 }} 个定义...</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 无数据状态 -->
    <div v-else class="no-data">
      <p>请等待...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted, computed } from 'vue';

// 定义属性
const props = defineProps({
  word: {
    type: String,
    required: true
  },
  wordData: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  }
});

// 定义事件
const emit = defineEmits(['word-click', 'audio-play', 'next']);

// 状态管理
const audioElement = ref(null);

// 限制显示的词性数量（最多3个）
const limitedMeanings = computed(() => {
  if (!props.wordData?.meanings) return [];
  return props.wordData.meanings.slice(0, 3);
});

// 文本截断函数
const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// 播放发音
function playAudio(audioUrl) {
  if (!audioUrl) return;

  if (!audioElement.value) {
    audioElement.value = new Audio();
  }

  audioElement.value.src = audioUrl;
  audioElement.value.play().catch(err => {
    console.error('音频播放失败:', err);
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
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}

.next-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
}

.meanings-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  background: #fafafa;
}

.meanings-container::-webkit-scrollbar {
  width: 6px;
}

.meanings-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.meanings-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.meanings-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.vocabulary-card {
  width: 90vw;
  max-width: 700px;
  height: 80vh;
  max-height: 600px;
  min-height: 400px;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 0;
  margin: 0 auto;
  transition: all 0.3s ease;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.vocabulary-card:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.loading,
.error,
.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  text-align: center;
  color: #666;
  font-size: 1.1rem;
}

.error {
  color: #e74c3c;
}

.word-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.word-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 24px 16px 24px;
  border-bottom: 2px solid #f0f0f0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  flex-shrink: 0;
}

.word-info {
  flex: 1;
}

.word-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.phonetics {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.phonetic {
  font-family: 'Courier New', monospace;
  color: rgba(255, 255, 255, 0.9);
  font-style: italic;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.9rem;
}

.audio-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  cursor: pointer;
  color: white;
  margin-left: 6px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.2s;
}

.audio-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.audio-icon {
  font-style: normal;
  font-size: 0.8rem;
}

.meaning-item {
  margin-bottom: 24px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e8e8e8;
}

.part-of-speech-tag {
  margin-bottom: 12px;
}

.pos-label {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.definition-item {
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.definition-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.definition-number {
  color: #667eea;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.definition {
  font-size: 1rem;
  line-height: 1.6;
  color: #333;
  margin: 0;
  flex: 1;
}

.example {
  font-style: italic;
  color: #666;
  margin: 8px 0 0 0;
  padding: 8px 12px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 6px;
  border-left: 3px solid #667eea;
  font-size: 0.9rem;
}

.example-label {
  color: #667eea;
  font-weight: 600;
  font-style: normal;
  margin-right: 4px;
}

.word-relations {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  font-size: 0.85rem;
}

.synonyms,
.antonyms {
  padding: 4px 8px;
  border-radius: 6px;
  background: #f0f0f0;
  color: #555;
}

.synonyms {
  border-left: 3px solid #27ae60;
}

.antonyms {
  border-left: 3px solid #e74c3c;
}

.more-definitions {
  text-align: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #ddd;
}

.more-text {
  color: #888;
  font-size: 0.85rem;
  font-style: italic;
}
</style>
