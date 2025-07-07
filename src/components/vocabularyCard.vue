<template>
  <div class="vocabulary-card-overlay" @click="handleOverlayClick">
    <div class="vocabulary-card" @click.stop>
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在获取单词信息...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
      </div>

      <!-- 单词内容 -->
      <div v-else-if="wordData && wordData.word" class="word-content">
        <!-- 头部：单词和音标 -->
        <div class="word-header">
          <div class="word-main">
            <h1 class="word-title">{{ wordData.word }}</h1>
            <div class="phonetics" v-if="wordData.phonetics && wordData.phonetics.length">
              <span v-for="(phonetic, index) in wordData.phonetics.slice(0, 2)" :key="index" class="phonetic">
                {{ phonetic.text }}
                <button v-if="phonetic.audio" @click="playAudio(phonetic.audio)" class="audio-btn" title="播放发音">
                  🔊
                </button>
              </span>
            </div>
          </div>
          <button class="close-btn" @click="$emit('next')" title="下一个单词">
            ✕
          </button>
        </div>

        <!-- 内容区域 -->
        <div class="content-area">
          <!-- 词性和释义 -->
          <div class="meanings-section">
            <div v-for="(meaning, mIndex) in limitedMeanings" :key="mIndex" class="meaning-group">
              <!-- 词性标签 -->
              <div class="part-of-speech">
                {{ meaning.partOfSpeech }}
              </div>

              <!-- 释义列表 -->
              <div class="definitions-list">
                <div v-for="(definition, dIndex) in meaning.definitions.slice(0, 3)" :key="dIndex"
                  class="definition-item">
                  <div class="definition-main">
                    <span class="definition-number">{{ dIndex + 1 }}.</span>
                    <p class="definition-text">{{ truncateText(definition.definition, 100) }}</p>
                  </div>

                  <!-- 例句 -->
                  <div v-if="definition.example && definition.example.length < 80" class="example">
                    <span class="example-label">例:</span>
                    <span class="example-text">"{{ definition.example }}"</span>
                  </div>
                </div>

                <!-- 更多释义提示 -->
                <div v-if="meaning.definitions.length > 3" class="more-definitions">
                  还有 {{ meaning.definitions.length - 3 }} 个释义...
                </div>
              </div>
            </div>

            <!-- 更多词性提示 -->
            <div v-if="wordData.meanings && wordData.meanings.length > 2" class="more-meanings">
              还有 {{ wordData.meanings.length - 2 }} 个词性...
            </div>
          </div>
        </div>
      </div>

      <!-- 无数据状态 -->
      <div v-else class="no-data-state">
        <div class="waiting-icon">⏳</div>
        <p>请稍候...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  word: {
    type: String,
    required: true
  },
  wordData: {
    type: Object,
    default: () => ({})
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

const emit = defineEmits(['next', 'audio-play']);

// 限制显示的词性数量（最多2个）
const limitedMeanings = computed(() => {
  if (!props.wordData?.meanings) return [];
  return props.wordData.meanings.slice(0, 2);
});

// 文本截断函数
const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// 播放音频
const playAudio = (audioUrl) => {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(err => {
      console.error('音频播放失败:', err);
    });
    emit('audio-play', audioUrl);
  }
};

// 点击遮罩层关闭
const handleOverlayClick = () => {
  emit('next');
};
</script>

<style scoped>
.vocabulary-card-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.vocabulary-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 状态样式 */
.loading-state,
.error-state,
.no-data-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  text-align: center;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4285f4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.error-state {
  color: #e74c3c;
}

.error-icon,
.waiting-icon {
  font-size: 2rem;
  margin-bottom: 12px;
}

/* 单词头部 */
.word-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 24px 16px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.word-main {
  flex: 1;
}

.word-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.phonetics {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.phonetic {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  padding: 4px 10px;
  border-radius: 20px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.95);
}

.audio-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 2px;
  border-radius: 4px;
  transition: background 0.2s;
}

.audio-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

/* 内容区域 */
.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 24px 24px;
}

.content-area::-webkit-scrollbar {
  width: 6px;
}

.content-area::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.content-area::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

/* 词性和释义 */
.meaning-group {
  margin-bottom: 24px;
}

.meaning-group:last-child {
  margin-bottom: 0;
}

.part-of-speech {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}



.definition-item {
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.definition-main {
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

.definition-text {
  margin: 0;
  line-height: 1.5;
  color: #333;
  font-size: 0.95rem;
}

.example {
  padding: 8px 12px;
  background: rgba(102, 126, 234, 0.08);
  border-radius: 6px;
  border-left: 3px solid #667eea;
  font-size: 0.85rem;
  margin-left: 20px;
}

.example-label {
  color: #667eea;
  font-weight: 600;
  margin-right: 4px;
}

.example-text {
  color: #555;
  font-style: italic;
}

.more-definitions,
.more-meanings {
  text-align: center;
  color: #888;
  font-size: 0.8rem;
  font-style: italic;
  margin-top: 12px;
  padding: 8px;
  background: #f0f0f0;
  border-radius: 6px;
}

.more-meanings {
  margin-top: 16px;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .vocabulary-card {
    margin: 10px;
    max-height: 85vh;
  }

  .word-header {
    padding: 20px 16px 12px 16px;
  }

  .word-title {
    font-size: 1.6rem;
  }

  .content-area {
    padding: 16px;
  }

  .phonetics {
    gap: 8px;
  }

  .phonetic {
    font-size: 0.8rem;
    padding: 3px 8px;
  }
}
</style>
