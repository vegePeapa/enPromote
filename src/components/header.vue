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
        <router-link to="/login" class="btn-login" v-if="currentModule === 'unlogin'">登录</router-link>
        <router-link to="/register" class="btn-register" v-if="currentModule === 'unlogin'">注册</router-link>
        <span class="username" v-if="currentModule === 'login'">你好!{{ username }}</span>
        <button @click="Logout" class="btn-logout" v-if="currentModule === 'login'">退出登陆</button>
      </div>
    </header>
    </template>

<script setup>
 import '@/assets/css/home_head.css'
 import { ref } from 'vue'
 import { logout, getUserInfo } from '@/api/auth'
 // 当前模块：unlogin（未登录）, login（已登录）
 const currentModule = ref('unlogin')
 const username = ref('')
 
 getUserInfo().then(res => {  
    
    if(res.data.code !== 200){
        currentModule.value = 'unlogin'
    }else{
        username.value = res.data.username
        currentModule.value = 'login'
    }
 })

 const Logout = () => {
  alert('确定退出登陆吗？')  
  logout().then(res => {
        currentModule.value = 'unlogin'
        username.value = ''
        
    })
 }
</script>