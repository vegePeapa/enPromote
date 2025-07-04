<template>
  <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <div class="celebration-icon">🎉</div>
        <h2 class="modal-title">学习进度</h2>
      </div>
      
      <div class="modal-body">
        <div class="progress-info">
          <div class="words-count">
            <span class="count-number">{{ wordsCount }}</span>
            <span class="count-label">个单词</span>
          </div>
          <p class="congratulations">恭喜你完成了今天的学习目标！</p>
          <div class="progress-stats">
            <div class="stat-item">
              <div class="stat-icon">📚</div>
              <div class="stat-text">
                <span class="stat-number">{{ wordsCount }}</span>
                <span class="stat-label">已学单词</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">⏰</div>
              <div class="stat-text">
                <span class="stat-number">{{ studyTime }}</span>
                <span class="stat-label">学习时长</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="handleRest">
          <span class="btn-icon">☕</span>
          休息一下
        </button>
        <button class="btn btn-primary" @click="handleContinue">
          <span class="btn-icon">🚀</span>
          继续学习
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  wordsCount: {
    type: Number,
    default: 10
  },
  startTime: {
    type: Date,
    default: null
  }
});

const emit = defineEmits(['close', 'rest', 'continue']);

// 计算学习时长
const studyTime = computed(() => {
  if (!props.startTime) return '0分钟';
  const now = new Date();
  const diffMs = now - props.startTime;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return '1分钟';
  if (diffMins < 60) return `${diffMins}分钟`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}小时${mins}分钟`;
});

// 处理点击遮罩层
const handleOverlayClick = () => {
  // 可以选择是否允许点击遮罩关闭
  // emit('close');
};

// 处理休息按钮
const handleRest = () => {
  emit('rest');
  emit('close');
};

// 处理继续学习按钮
const handleContinue = () => {
  emit('continue');
  emit('close');
};

// 键盘事件处理
const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    emit('close');
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease-out;
}

.modal-container {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 480px;
  width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  text-align: center;
  position: relative;
}

.celebration-icon {
  font-size: 3rem;
  margin-bottom: 8px;
  animation: bounce 1s ease-in-out infinite alternate;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.modal-body {
  padding: 32px 24px;
}

.progress-info {
  text-align: center;
}

.words-count {
  margin-bottom: 16px;
}

.count-number {
  font-size: 3rem;
  font-weight: 800;
  color: #667eea;
  display: block;
  line-height: 1;
}

.count-label {
  font-size: 1.1rem;
  color: #666;
  font-weight: 500;
}

.congratulations {
  font-size: 1.1rem;
  color: #333;
  margin: 16px 0 24px 0;
  line-height: 1.5;
}

.progress-stats {
  display: flex;
  justify-content: space-around;
  gap: 16px;
  margin-top: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 12px;
  flex: 1;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stat-number {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
  line-height: 1;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
  margin-top: 2px;
}

.modal-footer {
  padding: 20px 24px 24px 24px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
  justify-content: center;
}

.btn-secondary {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e9ecef;
}

.btn-secondary:hover {
  background: #e9ecef;
  color: #495057;
  transform: translateY(-1px);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.btn-icon {
  font-size: 1.1rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes bounce {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-8px);
  }
}

@media (max-width: 480px) {
  .modal-container {
    width: 95vw;
    border-radius: 16px;
  }
  
  .progress-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>
