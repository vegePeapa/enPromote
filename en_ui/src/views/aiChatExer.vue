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
            <div class="setting-item">
                <label>全英语</label>
                <select v-model="useEnglish">
                    <option value=false>no</option>
                    <option value=true>yes</option>
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
            <input v-model="inputMessage" @keyup.enter="sendMessage" @input="validateEnglishInput" @paste="handlePaste"
                placeholder="Please type in English only..." :disabled="loading" class="english-only-input" />
            <button @click="sendMessage" :disabled="loading || !inputMessage.trim()">
                {{ loading ? '发送中...' : '发送' }}
            </button>
            <div v-if="showInputWarning" class="input-warning">
                ⚠️ 请只使用英文字符进行练习
            </div>
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
const useEnglish = ref(false)
const inputMessage = ref('')
const messages = ref([])
const loading = ref(false)
const messagesContainer = ref(null)
const showInputWarning = ref(false)
// 获取历史记录
const getHistory = async () => {
    try {
        const response = await getHistoryMessages()
        messages.value = response.data.data
        console.log(messages.value);

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
                model: model.value,
                useEnglish: useEnglish.value
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

// 英文输入验证
const validateEnglishInput = (event) => {
    const value = event.target.value
    // 正则表达式：只允许英文字母、数字、标点符号、空格
    const englishOnlyRegex = /^[a-zA-Z0-9\s.,!?;:'"()\-_@#$%^&*+=<>{}[\]|\\\/~`]*$/

    if (!englishOnlyRegex.test(value)) {
        // 移除非英文字符
        const filteredValue = value.replace(/[^a-zA-Z0-9\s.,!?;:'"()\-_@#$%^&*+=<>{}[\]|\\\/~`]/g, '')
        inputMessage.value = filteredValue

        // 显示警告
        showInputWarning.value = true
        setTimeout(() => {
            showInputWarning.value = false
        }, 3000)
    }
}

// 处理粘贴事件
const handlePaste = (event) => {
    event.preventDefault()
    const pastedText = (event.clipboardData || window.clipboardData).getData('text')

    // 过滤非英文字符
    const englishOnlyRegex = /[a-zA-Z0-9\s.,!?;:'"()\-_@#$%^&*+=<>{}[\]|\\\/~`]/g
    const filteredText = pastedText.match(englishOnlyRegex)?.join('') || ''

    if (filteredText !== pastedText) {
        showInputWarning.value = true
        setTimeout(() => {
            showInputWarning.value = false
        }, 3000)
    }

    // 插入过滤后的文本
    const input = event.target
    const start = input.selectionStart
    const end = input.selectionEnd
    const currentValue = inputMessage.value

    inputMessage.value = currentValue.substring(0, start) + filteredText + currentValue.substring(end)

    // 设置光标位置
    nextTick(() => {
        input.setSelectionRange(start + filteredText.length, start + filteredText.length)
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

/* 英文输入限制样式 */
.english-only-input {
    border: 1px solid #ddd;
    transition: border-color 0.3s ease;
}

.english-only-input:focus {
    border-color: #007bff;
    outline: none;
}

.input-warning {
    position: absolute;
    bottom: -30px;
    left: 15px;
    background: #ff6b6b;
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    animation: slideIn 0.3s ease;
    z-index: 10;
}

.chat-input {
    position: relative;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
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