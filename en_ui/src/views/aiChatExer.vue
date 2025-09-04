<template>
    <div class="ai-chat-container">
        <!-- AI角色选择指引模态框 -->
        <div v-if="showGuideModal" class="guide-modal-overlay">
            <div class="guide-modal">
                <!-- 步骤1: 选择AI角色 -->
                <div v-if="guideStep === 1" class="guide-step">
                    <div class="guide-header">
                        <h2>🎭 选择你的AI老师角色</h2>
                        <p>选择一个适合你的AI老师角色来开始英语对话练习</p>
                    </div>
                    <div class="role-options">
                        <div class="role-card" :class="{ active: selectedCharacter === 'teacher' }"
                            @click="selectedCharacter = 'teacher'">
                            <div class="role-icon">👨‍🏫</div>
                            <h3>英语老师</h3>
                            <p>专业的英语教学，帮助你提升英语水平</p>
                        </div>
                        <!-- 可以在这里添加更多角色选项 -->
                    </div>
                    <div class="guide-actions">
                        <button class="btn-primary" :disabled="!selectedCharacter" @click="nextStep">
                            下一步
                        </button>
                    </div>
                </div>

                <!-- 步骤2: 选择AI性格 -->
                <div v-if="guideStep === 2" class="guide-step">
                    <div class="guide-header">
                        <h2>🎨 选择AI老师的性格</h2>
                        <p>选择一种你喜欢的教学风格</p>
                    </div>
                    <div class="personality-options">
                        <div v-for="personality in personalityOptions" :key="personality.value" class="personality-card"
                            :class="{ active: selectedNature === personality.value }"
                            @click="selectedNature = personality.value">
                            <div class="personality-icon">{{ personality.icon }}</div>
                            <h3>{{ personality.name }}</h3>
                            <p>{{ personality.description }}</p>
                        </div>
                    </div>
                    <div class="guide-actions">
                        <button class="btn-secondary" @click="prevStep">上一步</button>
                        <button class="btn-primary" :disabled="!selectedNature" @click="completeGuide">
                            开始对话
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 设置区域 -->
        <div class="chat-settings" v-show="!showGuideModal">


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
            <!-- 只有一个选项，所以不显示,其他功能后续再开发 -->
            <div class="setting-item" v-show="false">
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
            <button @click="restart">重置会话</button>
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
import { ref, nextTick, onMounted } from 'vue'
import { getHistoryMessages, restartConversation } from '@/api/ai';
import { getUserInfo, changeInfo } from '@/api/auth';

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

// 指引相关数据
const showGuideModal = ref(false)
const guideStep = ref(1)
const selectedCharacter = ref('')
const selectedNature = ref('')

// 性格选项配置
const personalityOptions = ref([
    {
        value: 'gentle',
        name: '彬彬有礼',
        icon: '😊',
        description: '温和耐心，循循善诱的教学风格'
    },
    {
        value: 'blunt',
        name: '脾气火爆',
        icon: '🔥',
        description: '直接犀利，用生动比喻纠正错误'
    },
    {
        value: 'tsundere',
        name: '傲娇毒舌',
        icon: '😤',
        description: '表面严厉内心关怀的教学方式'
    },
    {
        value: 'cold',
        name: '高冷精英',
        icon: '❄️',
        description: '专业严谨，追求完美的教学态度'
    },
    {
        value: 'exaggerated',
        name: '夸张幽默',
        icon: '🎭',
        description: '生动有趣，用夸张方式加深印象'
    }
])
// 重置
const restart = async () => {
    try {
        const respose = await restartConversation()
        if (respose.data.code == 200) {
            alert('会话已重置')
        }
        messages.value = []
    } catch (err) {
        console.log(err);

    }


}
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

// 检查用户AI选择状态
const checkAiChooseStatus = async () => {
    try {
        const response = await getUserInfo()
        if (response.data.code === 200) {
            // 如果用户未完成AI选择，显示指引模态框
            if (!response.data.ai_choose_completed) {
                showGuideModal.value = true
                // 设置默认选择
                selectedCharacter.value = 'teacher'
            } else {
                // 如果已完成选择，获取历史记录
                getHistory()
            }
        }
    } catch (error) {
        console.error('获取用户信息失败:', error)
        // 出错时也获取历史记录，保证功能正常
        getHistory()
    }
}

// 指引步骤控制
const nextStep = () => {
    if (guideStep.value < 2) {
        guideStep.value++
    }
}

const prevStep = () => {
    if (guideStep.value > 1) {
        guideStep.value--
    }
}

// 完成指引设置
const completeGuide = async () => {
    try {
        // 设置选择的角色和性格
        character.value = selectedCharacter.value
        nature.value = selectedNature.value

        // 更新用户的AI选择完成状态
        const response = await changeInfo({
            ai_choose_completed: true
        })

        if (response.data.code === 200) {
            showGuideModal.value = false
            // 获取历史记录
            getHistory()
        } else {
            console.error('保存AI选择失败:', response.data.message)
            alert('保存失败，请重试')
        }
    } catch (error) {
        console.error('完成AI选择指引失败:', error)
        alert('网络错误，请重试')
    }
}

// 组件挂载时检查状态
onMounted(() => {
    // 延迟检查，确保用户已登录
    setTimeout(() => {
        checkAiChooseStatus()
    }, 1000)
})

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

/* 指引模态框样式 */
.guide-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.guide-modal {
    background: white;
    border-radius: 16px;
    padding: 32px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.guide-header {
    text-align: center;
    margin-bottom: 32px;
}

.guide-header h2 {
    margin: 0 0 12px 0;
    color: #333;
    font-size: 24px;
}

.guide-header p {
    margin: 0;
    color: #666;
    font-size: 16px;
}

/* 角色选择卡片 */
.role-options {
    display: flex;
    justify-content: center;
    margin-bottom: 32px;
}

.role-card {
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 200px;
}

.role-card:hover {
    border-color: #007bff;
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 123, 255, 0.2);
}

.role-card.active {
    border-color: #007bff;
    background: #f8f9ff;
}

.role-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.role-card h3 {
    margin: 0 0 8px 0;
    color: #333;
    font-size: 18px;
}

.role-card p {
    margin: 0;
    color: #666;
    font-size: 14px;
}

/* 性格选择卡片 */
.personality-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
}

.personality-card {
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
}

.personality-card:hover {
    border-color: #007bff;
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 123, 255, 0.2);
}

.personality-card.active {
    border-color: #007bff;
    background: #f8f9ff;
}

.personality-icon {
    font-size: 32px;
    margin-bottom: 12px;
}

.personality-card h3 {
    margin: 0 0 8px 0;
    color: #333;
    font-size: 16px;
}

.personality-card p {
    margin: 0;
    color: #666;
    font-size: 12px;
    line-height: 1.4;
}

/* 指引操作按钮 */
.guide-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
}

.btn-primary,
.btn-secondary {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-primary {
    background: #007bff;
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background: #0056b3;
    transform: translateY(-1px);
}

.btn-primary:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.btn-secondary {
    background: #f8f9fa;
    color: #6c757d;
    border: 1px solid #dee2e6;
}

.btn-secondary:hover {
    background: #e9ecef;
    transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
    .guide-modal {
        padding: 24px;
        margin: 20px;
    }

    .personality-options {
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
    }

    .role-card {
        min-width: 160px;
        padding: 20px;
    }

    .guide-actions {
        flex-direction: column;
    }
}
</style>