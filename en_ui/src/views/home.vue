<template>
  <div class="home-container">


    <!-- 主要内容区 -->
    <main>
      <!-- AI优先英雄区域 -->
      <section class="hero">
        <div class="hero-content">
          <div class="hero-badge">
            <span class="badge-icon">🤖</span>
            <span class="badge-text">AI驱动学习</span>
          </div>
          <h1 class="hero-title">与AI老师一对一<br><span class="highlight">英语对话练习</span></h1>
          <p class="hero-description">
            革命性的AI英语学习体验 - 24/7个人英语导师，实时纠错，个性化教学风格
          </p>
          <div class="hero-actions">
            <button class="btn-primary-large" @click="goToAiChat">
              <span class="btn-icon">💬</span>
              开始AI对话
            </button>
            <button class="btn-secondary-outline" @click="showAiPreview = true">
              <span class="btn-icon">👁️</span>
              预览体验
            </button>
          </div>
          <div class="hero-stats">
            <div class="stat-mini">
              <span class="stat-number">10,000+</span>
              <span class="stat-label">对话练习</span>
            </div>
            <div class="stat-mini">
              <span class="stat-number">5种</span>
              <span class="stat-label">AI性格</span>
            </div>
            <div class="stat-mini">
              <span class="stat-number">24/7</span>
              <span class="stat-label">随时可用</span>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <div class="ai-chat-preview" :class="{ 'preview-active': showAiPreview }">
            <div class="chat-window">
              <div class="chat-header">
                <div class="ai-avatar">👨‍🏫</div>
                <div class="ai-info">
                  <span class="ai-name">AI英语老师</span>
                  <span class="ai-status">在线</span>
                </div>
              </div>
              <div class="chat-messages">
                <div class="message ai-message">
                  <div class="message-content">
                    Hello! I'm your AI English teacher. Ready to practice?
                  </div>
                </div>
                <div class="message user-message" v-if="showUserMessage">
                  <div class="message-content">
                    Yes, I'd like to improve my speaking skills.
                  </div>
                </div>
                <div class="message ai-message" v-if="showAiResponse">
                  <div class="message-content">
                    Perfect! Let's start with a conversation about your hobbies. What do you enjoy doing in your free
                    time?
                  </div>
                </div>
              </div>
              <div class="chat-input-preview">
                <input type="text" placeholder="Type your message..." readonly>
                <button class="send-btn">📤</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- AI功能特色 -->
      <section class="ai-features">
        <div class="section-header">
          <h2 class="section-title">为什么选择AI英语老师？</h2>
          <p class="section-subtitle">体验前所未有的个性化英语学习</p>
        </div>
        <div class="feature-grid">
          <div class="feature-card primary">
            <div class="feature-icon-wrapper">
              <div class="feature-icon">🤖</div>
              <div class="feature-badge">核心功能</div>
            </div>
            <h3>AI对话练习</h3>
            <p>与智能AI老师进行真实对话，获得即时反馈和纠错，提升口语表达能力</p>
            <button class="feature-btn" @click="goToAiChat">立即体验</button>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <div class="feature-icon">🎭</div>
            </div>
            <h3>5种AI性格</h3>
            <p>选择适合你的AI老师性格：温和、严格、幽默、专业、鼓励式，个性化学习体验</p>
            <button class="feature-btn secondary" @click="goToAiChat">了解更多</button>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <div class="feature-icon">📚</div>
            </div>
            <h3>智能词汇推荐</h3>
            <p>AI分析你的学习进度，智能推荐需要重点练习的单词，高效提升词汇量</p>
            <button class="feature-btn secondary" @click="goToVocabulary">开始学习</button>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <div class="feature-icon">🎧</div>
            </div>
            <h3>个性化听力训练</h3>
            <p>根据你的水平和兴趣，AI推荐合适的听力材料，循序渐进提升听力技能</p>
            <button class="feature-btn secondary" @click="goToListening">开始训练</button>
          </div>
        </div>
      </section>

      <!-- AI老师介绍 -->
      <section class="ai-teachers">
        <div class="section-header">
          <h2 class="section-title">选择你的AI英语老师</h2>
          <p class="section-subtitle">每种性格都有独特的教学风格</p>
        </div>
        <div class="teachers-grid">
          <div class="teacher-card" @click="selectTeacher('gentle')">
            <div class="teacher-avatar">😊</div>
            <h3>温和老师</h3>
            <p>耐心细致，循循善诱</p>
            <div class="teacher-features">
              <span class="feature-tag">适合初学者</span>
              <span class="feature-tag">鼓励式教学</span>
            </div>
          </div>
          <div class="teacher-card" @click="selectTeacher('strict')">
            <div class="teacher-avatar">🔥</div>
            <h3>严格老师</h3>
            <p>直接犀利，快速纠错</p>
            <div class="teacher-features">
              <span class="feature-tag">适合进阶者</span>
              <span class="feature-tag">高效学习</span>
            </div>
          </div>
          <div class="teacher-card" @click="selectTeacher('humorous')">
            <div class="teacher-avatar">🎭</div>
            <h3>幽默老师</h3>
            <p>生动有趣，寓教于乐</p>
            <div class="teacher-features">
              <span class="feature-tag">轻松氛围</span>
              <span class="feature-tag">记忆深刻</span>
            </div>
          </div>
          <div class="teacher-card" @click="selectTeacher('professional')">
            <div class="teacher-avatar">❄️</div>
            <h3>专业老师</h3>
            <p>严谨专业，追求完美</p>
            <div class="teacher-features">
              <span class="feature-tag">商务英语</span>
              <span class="feature-tag">学术写作</span>
            </div>
          </div>
          <div class="teacher-card" @click="selectTeacher('encouraging')">
            <div class="teacher-avatar">😤</div>
            <h3>激励老师</h3>
            <p>积极鼓励，建立自信</p>
            <div class="teacher-features">
              <span class="feature-tag">提升自信</span>
              <span class="feature-tag">正面反馈</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 学习进度统计 -->
      <section class="stats">
        <h2 class="section-title">学习效果</h2>
        <div class="stats-container">
          <div class="stat-item">
            <div class="stat-number">5000+</div>
            <div class="stat-label">词汇量</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">200+</div>
            <div class="stat-label">练习题</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">50+</div>
            <div class="stat-label">阅读文章</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">30+</div>
            <div class="stat-label">听力材料</div>
          </div>
        </div>
      </section>

      <!-- 今日学习建议 -->
      <section class="daily-suggestion">
        <h2 class="section-title">今日学习建议</h2>
        <div class="suggestion-cards">
          <div class="card">
            <h3>词汇练习</h3>
            <p>掌握20个商务英语常用词汇</p>
            <button class="btn-secondary" @click="goToVocabulary">开始学习</button>
          </div>
          <div class="card">
            <h3>语法训练</h3>
            <p>完善过去完成时的用法</p>
            <button class="btn-secondary">开始练习</button>
          </div>
          <div class="card">
            <h3>阅读理解</h3>
            <p>阅读一篇科技新闻文章</p>
            <button class="btn-secondary">开始阅读</button>
          </div>
        </div>
      </section>
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3>关于我们</h3>
          <p>EnglishMastery致力于提供高质量的英语学习体验，帮助学习者轻松掌握英语。</p>
        </div>
        <div class="footer-section">
          <h3>联系方式</h3>
          <p>邮箱：contact@englishmastery.com</p>
          <p>电话：123-456-7890</p>
        </div>
        <div class="footer-section">
          <h3>关注我们</h3>
          <div class="social-icons">
            <!-- 社交媒体图标 -->
            <span>微信</span>
            <span>微博</span>
            <span>QQ</span>
          </div>
        </div>
      </div>
      <div class="copyright">
        <p>&copy; 2023 EnglishMastery. 保留所有权利。</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getUserInfo } from '@/api/auth';
import { useRouter } from 'vue-router';

const router = useRouter();

// 响应式数据
const username = ref('');
const showAiPreview = ref(false);
const showUserMessage = ref(false);
const showAiResponse = ref(false);

// 页面加载时的逻辑
onMounted(() => {
  console.log('首页加载完成');
  getUserInfo().then(res => {
    if (res.data && res.data.username) {
      username.value = res.data.username;
    }
  }).catch(err => {
    console.log('获取用户信息失败:', err);
  });

  // 启动AI预览动画
  startAiPreviewAnimation();
});

// AI预览动画
const startAiPreviewAnimation = () => {
  setTimeout(() => {
    showAiPreview.value = true;
    setTimeout(() => {
      showUserMessage.value = true;
      setTimeout(() => {
        showAiResponse.value = true;
      }, 1500);
    }, 1000);
  }, 2000);
};

// 导航函数
function goToVocabulary() {
  router.push('/vocabulary');
}

function goToAiChat() {
  router.push('/aiChatExer');
}

function goToListening() {
  router.push('/listening');
}

// 选择AI老师
function selectTeacher(teacherType) {
  // 可以保存用户选择的老师类型到localStorage
  localStorage.setItem('selectedTeacher', teacherType);
  // 直接跳转到AI对话页面
  router.push('/aiChatExer');
}
</script>
<script>
import '@/assets/css/home_head.css'
import '@/assets/css/ai-home.css'
</script>
