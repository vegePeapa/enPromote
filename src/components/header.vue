<template>
    <header>
        <div class="header-left">
            <RouterLink :to="{path:'/'}">首页</RouterLink>
        </div>
        <div class="nav">
            <RouterLink :to="{name:'Login'}">登陆</RouterLink>
            <RouterLink :to="{name:'Register'}">注册</RouterLink>
        </div>
    </header>
</template>
<script setup lang="ts">

</script>
<style scoped>
RouterLink{
    text-decoration: none;
    color: #fff;
}
.header-left {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100px;
    height: 100px;
    background-color: #333;
    color: #ffffff;
    text-decoration: none;
}
header {
    width: 100%;
    height: 100px;
    background-color: #333;
    color: #fff;
    /* padding: 20px; */
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.nav a {
    color: #fff;
}
</style>