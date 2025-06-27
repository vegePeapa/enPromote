<template>
  <div class="home-container">


    <!-- 主要内容区 -->
    <main>
      <!-- 英雄区域 -->
      <section class="hero">
        <div class="hero-content">
          <h2>提升您的英语水平</h2>
          <p>通过互动练习、实时反馈和个性化学习路径，让英语学习变得轻松有趣</p>
          <button class="btn-primary">立即开始</button>
        </div>
        <div class="hero-image">
          <!-- 可以放置一个学习相关的图片 -->
        </div>
      </section>

      <!-- 功能介绍 -->
      <section class="features">
        <h2 class="section-title">我们提供的服务</h2>
        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-icon">📚</div>
            <h3>词汇扩充</h3>
            <p>通过智能记忆系统学习新单词，建立强大的词汇基础</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔤</div>
            <h3>语法提升</h3>
            <p>掌握英语语法规则，提高写作和口语表达的准确性</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📖</div>
            <h3>阅读理解</h3>
            <p>阅读各种文章，提高理解能力和阅读速度</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎧</div>
            <h3>听力练习</h3>
            <p>通过多样化的听力材料，提高听力理解能力</p>
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
            <button class="btn-secondary">开始学习</button>
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

// 可以在这里添加一些首页需要的交互逻辑

onMounted(() => {
  console.log('首页加载完成');
});
</script>
<script>
    import '@/assets/css/home_head.css'
</script>
