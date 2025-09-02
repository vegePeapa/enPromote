<!-- 个人主页 -->
<template>
    <div class="profile-container">
        <div class="profile-header">
            <div class="avatar-section">
                <img :src="userAvatar" alt="用户头像" class="avatar-large" />
                <h2>{{ username }}</h2>
            </div>
        </div>

        <div class="profile-content">
            <div class="stats-section">
                <div class="stat-card">
                    <h3>学习天数</h3>
                    <p>{{ studyDays }} 天</p>
                </div>
                <div class="stat-card">
                    <h3>掌握单词</h3>
                    <p>{{ masteredWords }} 个</p>
                </div>
                <div class="stat-card">
                    <h3>完成对话</h3>
                    <p>{{ completedChats }} 次</p>
                </div>
            </div>

            <div class="recent-activity">
                <h3>最近活动</h3>
                <ul class="activity-list">
                    <li v-for="activity in recentActivities" :key="activity.id" class="activity-item">
                        <span class="activity-time">{{ activity.time }}</span>
                        <span class="activity-desc">{{ activity.description }}</span>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUserInfo, changeInfo } from '@/api/auth'

const username = ref('')
const userAvatar = ref('/default-avatar.png') // 默认头像
const studyDays = ref(0)
const masteredWords = ref(0)
const completedChats = ref(0)
const recentActivities = ref([])

onMounted(async () => {
    try {
        const res = await getUserInfo()
        if (res.data.code === 200) {
            username.value = res.data.username
            // TODO: 获取用户其他统计数据
        }
    } catch (error) {
        console.error('获取用户信息失败:', error)
    }
})
</script>

<style scoped>
.profile-container {
    max-width: 1200px;
    margin: 20px auto;
    padding: 20px;
}

.profile-header {
    background: #fff;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
}

.avatar-section {
    display: flex;
    align-items: center;
    gap: 20px;
}

.avatar-large {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
}

.stats-section {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 30px;
}

.stat-card {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    text-align: center;
}

.stat-card h3 {
    color: #666;
    margin-bottom: 10px;
}

.stat-card p {
    font-size: 24px;
    font-weight: bold;
    color: #333;
}

.recent-activity {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.activity-list {
    list-style: none;
    padding: 0;
}

.activity-item {
    display: flex;
    padding: 15px 0;
    border-bottom: 1px solid #eee;
}

.activity-time {
    color: #999;
    width: 100px;
}

.activity-desc {
    flex: 1;
    color: #333;
}
</style>
