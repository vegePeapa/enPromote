<template>
    <div class="ai-chat-container">
        <!-- 设置区域 -->
        <div class="chat-settings">
            <div class="setting-item">
                <label>场景:</label>
                <select v-model="scene">
                    <option value="daily">日常对话</option>
                    <option value="business">商务英语</option>
                    <option value="travel">旅游英语</option>
                    <option value="study">学习讨论</option>
                </select>
            </div>

            <div class="setting-item">
                <label>AI角色:</label>
                <select v-model="character">
                    <option value="teacher">英语老师</option>
                    <option value="friend">朋友</option>
                    <option value="colleague">同事</option>
                    <option value="guide">导游</option>
                </select>
            </div>
        </div>

        <!-- 聊天区域 -->
        <div class="chat-messages" ref="messagesContainer">
            <div v-for="msg in messages" :key="msg.id"
                :class="['message', msg.role === 'user' ? 'user-message' : 'ai-message']">
                <div class="message-content">{{ msg.content }}</div>
                <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
            </div>
        </div>

        <!-- 输入区域 -->
        <div class="chat-input">
            <input v-model="inputMessage" @keyup.enter="sendMessage" placeholder="输入你的消息..." :disabled="loading" />
            <button @click="sendMessage" :disabled="loading || !inputMessage.trim()">
                {{ loading ? '发送中...' : '发送' }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import axios from 'axios'

// 响应式数据
const scene = ref('daily')
const character = ref('teacher')
const inputMessage = ref('')
const messages = ref([])
const loading = ref(false)
const messagesContainer = ref(null)

// 发送消息
const sendMessage = async () => {
    if (!inputMessage.value.trim() || loading.value) return

    const userMessage = inputMessage.value.trim()

    // 添加用户消息
    messages.value.push({
        id: Date.now(),
        role: 'user',
        content: userMessage,
        timestamp: new Date()
    })

    inputMessage.value = ''
    loading.value = true

    try {
        const response = await axios.post('/aiApi/aiChat', {
            message: userMessage,
            scene: scene.value,
            character: character.value
        })

        if (response.data.code === 200) {
            // 添加AI回复
            messages.value.push({
                id: Date.now() + 1,
                role: 'assistant',
                content: response.data.data.reply,
                timestamp: new Date()
            })
        } else {
            throw new Error(response.data.message)
        }
    } catch (error) {
        console.error('发送消息失败:', error)
        messages.value.push({
            id: Date.now() + 1,
            role: 'assistant',
            content: '抱歉，发生了错误，请稍后重试。',
            timestamp: new Date()
        })
    } finally {
        loading.value = false
        scrollToBottom()
    }
}

// 滚动到底部
const scrollToBottom = () => {
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
    })
}

// 格式化时间
const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    })
}
</script>

<style scoped>
.ai-chat-container {
    max-width: 800px;
    margin: 0 auto;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f5f5f5;
}

.chat-settings {
    display: flex;
    gap: 20px;
    padding: 15px;
    background: white;
    border-bottom: 1px solid #ddd;
}

.setting-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.setting-item label {
    font-weight: 500;
}

.setting-item select {
    padding: 5px 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.message {
    max-width: 70%;
}

.user-message {
    align-self: flex-end;
}

.user-message .message-content {
    background: #007bff;
    color: white;
    padding: 10px 15px;
    border-radius: 18px 18px 5px 18px;
}

.ai-message .message-content {
    background: white;
    color: #333;
    padding: 10px 15px;
    border-radius: 18px 18px 18px 5px;
    border: 1px solid #ddd;
}

.message-time {
    font-size: 12px;
    color: #666;
    margin-top: 5px;
    text-align: right;
}

.ai-message .message-time {
    text-align: left;
}

.chat-input {
    display: flex;
    padding: 15px;
    background: white;
    border-top: 1px solid #ddd;
    gap: 10px;
}

.chat-input input {
    flex: 1;
    padding: 10px 15px;
    border: 1px solid #ddd;
    border-radius: 20px;
    outline: none;
}

.chat-input button {
    padding: 10px 20px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 20px;
    cursor: pointer;
}

.chat-input button:disabled {
    background: #ccc;
    cursor: not-allowed;
}
</style>