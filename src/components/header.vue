    <!-- 页面头部 -->
    <template>
        <header class="header">
      <div class="logo">
        <h1>EnglishMastery</h1>
      </div>
      <nav class="main-nav">
        <ul>
          <li><router-link to="/" class="active">首页</router-link></li>
          <li><router-link to="/vocabulary">词汇练习</router-link></li>
          <li><router-link to="/grammar">语法练习</router-link></li>
          <li><router-link to="/reading">阅读理解</router-link></li>
          <li><router-link to="/listening">听力训练</router-link></li>
        </ul>
      </nav>
      <div class="user-actions">
        <router-link to="/login" class="btn-login">登录</router-link>
        <router-link to="/register" class="btn-register">注册</router-link>
      </div>
    </header>
    </template>

<script>
 import '@/assets/css/home_head.css'
</script>