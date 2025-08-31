<template>
    <div class="ai-chat-container">
        <!-- 设置区域 -->
        <div class="chat-settings">


            <div class="setting-item">
                <label>AI角色:</label>
                <select v-model="character">
                    <option value="teacher">英语老师</option>
                </select>
            </div>

            <div class="setting-item">
                <label>AI性格:</label>
                <select v-model="nature">
                    <option value="blunt">脾气火爆</option>
                    <option value="gentle">彬彬有礼</option>
                    <option value="tsundere">傲娇毒舌</option>
                    <option value="cold">高冷精英</option>
                    <option value="exaggerated">夸张幽默</option>
                </select>
            </div>
            <div class="setting-item">
                <label>单词:</label>
                <select v-model="model">
                    <option value="review">复习单词</option>
                </select>
            </div>
        </div>

        <!-- 聊天区域 -->
        <div class="chat-messages" ref="messagesContainer">
            <div v-for="msg in messages" :key="msg.id"
                :class="['message', msg.role === 'user' ? 'user-message' : 'ai-message']">
                <div class="message-content">
                    <pre class="message-text">{{ msg.content }}</pre>
                    <span v-if="msg.streaming" class="typing-indicator">▋</span>
                </div>
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
import { getHistoryMessages } from '@/api/ai';

// 响应式数据

const character = ref('teacher')
const nature = ref('gentle')
const model = ref('review')
const inputMessage = ref('')
const messages = ref([])
const loading = ref(false)
const messagesContainer = ref(null)
// 获取历史记录
const getHistory = async () => {
    try {
        const response = await getHistoryMessages()
        messages.value = response.data.data

    } catch (err) {
        console.log(err);
    }
}

getHistory()


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

    // 添加AI消息占位符
    const aiMessageId = Date.now() + 1
    messages.value.push({
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        streaming: true
    })

    inputMessage.value = ''
    loading.value = true

    try {
        // 使用fetch处理SSE流式响应
        const response = await fetch('api/aiApi/aiChat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userMessage,
                character: character.value,
                nature: nature.value,
                model: model.value
            })
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6)
                    if (data === '[DONE]') {
                        // 流结束
                        const aiMessage = messages.value.find(msg => msg.id === aiMessageId)
                        if (aiMessage) {
                            aiMessage.streaming = false
                        }
                        break
                    }

                    try {
                        const parsed = JSON.parse(data)
                        if (parsed.content) {
                            // 更新AI消息内容
                            const aiMessage = messages.value.find(msg => msg.id === aiMessageId)
                            if (aiMessage) {
                                aiMessage.content += parsed.content
                                scrollToBottom()
                            }
                        }
                    } catch (e) {
                        // 忽略解析错误
                    }
                }
            }
        }

    } catch (error) {
        console.error('发送消息失败:', error)
        // 更新AI消息为错误提示
        const aiMessage = messages.value.find(msg => msg.id === aiMessageId)
        if (aiMessage) {
            aiMessage.content = '抱歉，发生了错误，请稍后重试。'
            aiMessage.streaming = false
        }
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

/* 消息文本样式 */
.message-text {
    margin: 0;
    font-family: inherit;
    font-size: inherit;
    white-space: pre-wrap;
    word-wrap: break-word;
    line-height: 1.4;
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

/* 打字指示器 */
.typing-indicator {
    animation: blink 1s infinite;
    color: #007bff;
    font-weight: bold;
}

@keyframes blink {

    0%,
    50% {
        opacity: 1;
    }

    51%,
    100% {
        opacity: 0;
    }
}
</style>