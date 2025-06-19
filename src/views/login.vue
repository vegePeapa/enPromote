<template>
        <div class="container">
        <div class="form-container">
            <h1>登录</h1>
            <form action="/login" method="post" id="login-form">
                <div class="form-group">
                    <label for="username">用户名</label>
                    <input type="text" id="username" name="username" v-model="username">
                </div>
                <div class="form-group">
                    <label for="password">密码</label>
                    <input type="password" id="password" name="password" v-model="password" >
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary" @click="clickLogin" >登录</button>
                </div>
                <div class="form-footer">
                    <p>还没有账号？<router-link to="/register">立即注册</router-link></p>
                </div>
            </form>
        </div>
    </div>
</template>
<script setup>
import { ref, watch } from 'vue';
import { login } from '@/api/auth';
const username = ref('');
const password = ref('');
function clickLogin(e){
    e.preventDefault();
    console.log(username.value);
    
    const data = {
        username: username.value,
        password: password.value
    }
    // api请求
    login(data).then(res => {
        console.log(res)
        return res.data
    }).then(data=>{
        console.log(data);
        if(data.code !== 200){
            alert(data.message)
        }
    }).catch(err => {
        console.log(err);
    });
}
</script>
<style scoped>
 @import '../assets/css/auth.css';
</style>