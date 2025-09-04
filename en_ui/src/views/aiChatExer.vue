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
                        <button class="btn-primary" :disabled="!selectedNature" @click="nextStep">
                            下一步
                        </button>
                    </div>
                </div>

                <!-- 步骤3: 选择语言模式 -->
                <div v-if="guideStep === 3" class="guide-step">
                    <div class="guide-header">
                        <h2>🌍 选择对话语言</h2>
                        <p>选择你希望的对话语言模式</p>
                    </div>
                    <div class="language-options">
                        <div class="language-card" :class="{ active: selectedUseEnglish === false }"
                            @click="selectedUseEnglish = false">
                            <div class="language-icon">🇨🇳</div>
                            <h3>中英混合</h3>
                            <p>AI会用中文解释，但会强调英文单词的使用</p>
                            <div class="language-example">
                                <span class="example-label">示例：</span>
                                <span class="example-text">"你刚才用的 'beautiful' 这个词很棒！它比 'good' 更生动..."</span>
                            </div>
                        </div>
                        <div class="language-card" :class="{ active: selectedUseEnglish === true }"
                            @click="selectedUseEnglish = true">
                            <div class="language-icon">🇺🇸</div>
                            <h3>全英文模式</h3>
                            <p>完全使用英文对话，提供沉浸式英语环境</p>
                            <div class="language-example">
                                <span class="example-label">Example：</span>
                                <span class="example-text">"Great use of 'beautiful'! It's much more vivid than
                                    'good'..."</span>
                            </div>
                        </div>
                    </div>
                    <div class="guide-actions">
                        <button class="btn-secondary" @click="prevStep">上一步</button>
                        <button class="btn-primary" :disabled="selectedUseEnglish === null" @click="completeGuide">
                            开始对话
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 简化的顶部信息栏 -->
        <div class="chat-header" v-show="!showGuideModal">
            <div class="ai-info">
                <div class="ai-avatar-display">{{ getAiAvatar() }}</div>
                <div class="ai-details">
                    <span class="ai-name">{{ getAiName() }}</span>
                    <span class="ai-status">
                        <span class="status-dot"></span>
                        在线
                    </span>
                </div>
            </div>

            <button class="settings-btn" @click="showSettingsModal = true" title="AI设置">
                ⚙️
            </button>
        </div>

        <!-- AI设置模态窗口 -->
        <div v-if="showSettingsModal" class="settings-modal-overlay" @click="closeSettingsModal">
            <div class="settings-modal" @click.stop>
                <div class="settings-modal-header">
                    <h3>🤖 AI助手设置</h3>
                    <button class="close-btn" @click="closeSettingsModal">✕</button>
                </div>

                <div class="settings-modal-content">
                    <div class="setting-section">
                        <label class="setting-label">
                            <span class="label-icon">🎭</span>
                            AI角色
                        </label>
                        <select v-model="tempCharacter" class="setting-select">
                            <option value="teacher">👨‍🏫 英语老师</option>
                        </select>
                    </div>

                    <div class="setting-section">
                        <label class="setting-label">
                            <span class="label-icon">🎨</span>
                            AI性格
                        </label>
                        <select v-model="tempNature" class="setting-select">
                            <option value="gentle">😊 彬彬有礼</option>
                            <option value="blunt">🔥 脾气火爆</option>
                            <option value="tsundere">😤 傲娇毒舌</option>
                            <option value="cold">❄️ 高冷精英</option>
                            <option value="exaggerated">🎭 夸张幽默</option>
                        </select>
                    </div>

                    <div class="setting-section">
                        <label class="setting-label">
                            <span class="label-icon">🌍</span>
                            对话语言
                        </label>
                        <div class="language-options-modal">
                            <label class="radio-option">
                                <input type="radio" :value="false" v-model="tempUseEnglish" />
                                <span class="radio-label">🇨🇳 中英混合</span>
                                <span class="radio-desc">AI会用中文解释，但会强调英文单词的使用</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" :value="true" v-model="tempUseEnglish" />
                                <span class="radio-label">🇺🇸 全英文模式</span>
                                <span class="radio-desc">完全使用英文对话，提供沉浸式英语环境</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="settings-modal-actions">
                    <button class="btn-cancel" @click="closeSettingsModal">取消</button>
                    <button class="btn-apply" @click="applySettings" :disabled="!hasSettingsChanged">
                        应用设置
                    </button>
                </div>
            </div>
        </div>

        <!-- 确认重置对话模态窗口 -->
        <div v-if="showConfirmModal" class="confirm-modal-overlay">
            <div class="confirm-modal">
                <div class="confirm-header">
                    <span class="confirm-icon">⚠️</span>
                    <h3>确认应用设置</h3>
                </div>
                <div class="confirm-content">
                    <p>应用新的AI设置后会重置当前对话记录，是否继续？</p>
                    <div class="settings-preview">
                        <div class="preview-item">
                            <span class="preview-label">AI角色：</span>
                            <span>{{ getPreviewCharacterName() }}</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">AI性格：</span>
                            <span>{{ getPreviewNatureName() }}</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">对话语言：</span>
                            <span>{{ tempUseEnglish ? '🇺🇸 全英文模式' : '🇨🇳 中英混合' }}</span>
                        </div>
                    </div>
                </div>
                <div class="confirm-actions">
                    <button class="btn-cancel" @click="showConfirmModal = false">取消</button>
                    <button class="btn-confirm" @click="confirmApplySettings">确认应用</button>
                </div>
            </div>
        </div>

        <!-- 优化后的聊天区域 -->
        <div class="chat-messages" ref="messagesContainer">
            <div v-if="messages.length === 0" class="welcome-message">
                <div class="welcome-content">
                    <div class="welcome-icon">💬</div>
                    <h3>欢迎来到AI英语对话练习！</h3>
                    <p>开始你的第一次对话吧，AI老师会帮助你提升英语水平</p>
                    <div class="welcome-tips">
                        <div class="tip-item">
                            <span class="tip-icon">💡</span>
                            <span>AI会根据你的水平调整对话难度</span>
                        </div>
                        <div class="tip-item">
                            <span class="tip-icon">📚</span>
                            <span>重点单词会在对话中自然出现</span>
                        </div>
                        <div class="tip-item">
                            <span class="tip-icon">🎯</span>
                            <span>每次对话都是学习的机会</span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-for="msg in messages" :key="msg.id"
                :class="['message', msg.role === 'user' ? 'user-message' : 'ai-message']">
                <div class="message-avatar">
                    <div v-if="msg.role === 'user'" class="avatar user-avatar">👤</div>
                    <div v-else class="avatar ai-avatar">{{ getAiAvatar() }}</div>
                </div>
                <div class="message-bubble">
                    <div class="message-content">
                        <pre class="message-text">{{ msg.content }}</pre>
                        <span v-if="msg.streaming" class="typing-indicator">
                            <span class="dot"></span>
                            <span class="dot"></span>
                            <span class="dot"></span>
                        </span>
                    </div>
                    <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
                </div>
            </div>
        </div>

        <!-- 优化后的输入区域 -->
        <div class="chat-input">
            <div class="input-container">
                <div class="input-wrapper">
                    <input v-model="inputMessage" @keyup.enter="sendMessage" @input="validateEnglishInput"
                        @paste="handlePaste"
                        :placeholder="useEnglish ? 'Type your message in English...' : '请用英文输入你的消息...'"
                        :disabled="loading" class="message-input" />
                    <div class="input-actions">
                        <button class="send-btn" @click="sendMessage" :disabled="loading || !inputMessage.trim()">
                            <span v-if="loading" class="loading-spinner">⏳</span>
                            <span v-else class="send-icon">📤</span>
                        </button>
                    </div>
                </div>
                <div v-if="showInputWarning" class="input-warning">
                    <span class="warning-icon">⚠️</span>
                    <span class="warning-text">请只使用英文字符进行练习</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, nextTick, onMounted, computed } from 'vue'
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
const selectedUseEnglish = ref(null)

// 设置模态窗口相关数据
const showSettingsModal = ref(false)
const showConfirmModal = ref(false)
const tempCharacter = ref('teacher')
const tempNature = ref('gentle')
const tempUseEnglish = ref(false)

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
    if (guideStep.value < 3) {
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
        // 设置选择的角色、性格和语言模式
        character.value = selectedCharacter.value
        nature.value = selectedNature.value
        useEnglish.value = selectedUseEnglish.value

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

// 获取AI头像
const getAiAvatar = () => {
    const avatarMap = {
        'teacher': '👨‍🏫'
    }
    return avatarMap[character.value] || '👨‍🏫'
}

// 获取AI名称
const getAiName = () => {
    const nameMap = {
        'teacher': '英语老师'
    }
    const baseName = nameMap[character.value] || '英语老师'

    // 根据性格添加描述
    const personalityMap = {
        'gentle': '温和的',
        'blunt': '直率的',
        'tsundere': '傲娇的',
        'cold': '高冷的',
        'exaggerated': '幽默的'
    }

    const personalityDesc = personalityMap[nature.value] || ''
    return personalityDesc ? `${personalityDesc}${baseName}` : baseName
}

// 设置模态窗口相关方法
const closeSettingsModal = () => {
    showSettingsModal.value = false
    // 重置临时设置为当前设置
    tempCharacter.value = character.value
    tempNature.value = nature.value
    tempUseEnglish.value = useEnglish.value
}

// 检查设置是否有变化
const hasSettingsChanged = computed(() => {
    return tempCharacter.value !== character.value ||
        tempNature.value !== nature.value ||
        tempUseEnglish.value !== useEnglish.value
})

// 应用设置
const applySettings = () => {
    if (hasSettingsChanged.value) {
        showConfirmModal.value = true
    } else {
        closeSettingsModal()
    }
}

// 确认应用设置
const confirmApplySettings = async () => {
    try {
        // 应用新设置
        character.value = tempCharacter.value
        nature.value = tempNature.value
        useEnglish.value = tempUseEnglish.value

        // 重置会话
        const response = await restartConversation()
        if (response.data.code == 200) {
            messages.value = []
            showConfirmModal.value = false
            showSettingsModal.value = false
        } else {
            alert('重置会话失败，请重试')
        }
    } catch (error) {
        console.error('应用设置失败:', error)
        alert('应用设置失败，请重试')
    }
}

// 获取预览的角色名称
const getPreviewCharacterName = () => {
    const nameMap = {
        'teacher': '👨‍🏫 英语老师'
    }
    return nameMap[tempCharacter.value] || '👨‍🏫 英语老师'
}

// 获取预览的性格名称
const getPreviewNatureName = () => {
    const nameMap = {
        'gentle': '😊 彬彬有礼',
        'blunt': '🔥 脾气火爆',
        'tsundere': '😤 傲娇毒舌',
        'cold': '❄️ 高冷精英',
        'exaggerated': '🎭 夸张幽默'
    }
    return nameMap[tempNature.value] || '😊 彬彬有礼'
}

// 组件挂载时检查状态
onMounted(() => {
    // 初始化临时设置
    tempCharacter.value = character.value
    tempNature.value = nature.value
    tempUseEnglish.value = useEnglish.value

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

/* 简化的顶部信息栏样式 */
.chat-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
}

.settings-btn {
    width: 40px;
    height: 40px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.settings-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
}

.ai-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.ai-avatar-display {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
}

.ai-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.ai-name {
    font-weight: 600;
    font-size: 16px;
}

.ai-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    opacity: 0.9;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #4ade80;
    animation: pulse 2s infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

.quick-settings {
    display: flex;
    align-items: center;
    gap: 16px;
}

.setting-compact {
    display: flex;
    align-items: center;
}

.compact-select {
    padding: 6px 12px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 120px;
}

.compact-select:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
}

.compact-select option {
    background: #333;
    color: white;
}

.language-switch {
    display: flex;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 2px;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.lang-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 18px;
    background: transparent;
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 40px;
}

.lang-btn:hover {
    background: rgba(255, 255, 255, 0.1);
}

.lang-btn.active {
    background: rgba(255, 255, 255, 0.3);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.restart-btn-compact {
    width: 36px;
    height: 36px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 设置模态窗口样式 */
.settings-modal-overlay {
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

.settings-modal {
    background: white;
    border-radius: 16px;
    padding: 0;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.settings-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
}

.settings-modal-header h3 {
    margin: 0;
    color: #1e293b;
    font-size: 18px;
    font-weight: 600;
}

.close-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: #e2e8f0;
    color: #64748b;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-btn:hover {
    background: #cbd5e1;
    color: #475569;
}

.settings-modal-content {
    padding: 24px;
    max-height: 60vh;
    overflow-y: auto;
}

.setting-section {
    margin-bottom: 24px;
}

.setting-section:last-child {
    margin-bottom: 0;
}

.setting-label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-weight: 600;
    color: #374151;
    font-size: 14px;
}

.label-icon {
    font-size: 16px;
}

.setting-select {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    color: #1e293b;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.setting-select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.language-options-modal {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.radio-option {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.radio-option:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
}

.radio-option input[type="radio"] {
    margin: 0;
    margin-top: 2px;
}

.radio-option input[type="radio"]:checked+.radio-label {
    color: #667eea;
    font-weight: 600;
}

.radio-option:has(input[type="radio"]:checked) {
    border-color: #667eea;
    background: #f8f9ff;
}

.radio-label {
    font-weight: 500;
    color: #374151;
    font-size: 14px;
    margin-bottom: 4px;
}

.radio-desc {
    color: #6b7280;
    font-size: 12px;
    line-height: 1.4;
}

.settings-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
}

.btn-cancel,
.btn-apply {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-cancel {
    background: #f1f5f9;
    color: #64748b;
    border: 1px solid #e2e8f0;
}

.btn-cancel:hover {
    background: #e2e8f0;
}

.btn-apply {
    background: #667eea;
    color: white;
}

.btn-apply:hover:not(:disabled) {
    background: #5a67d8;
}

.btn-apply:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
}

/* 确认模态窗口样式 */
.confirm-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1100;
}

.confirm-modal {
    background: white;
    border-radius: 16px;
    padding: 0;
    max-width: 450px;
    width: 90%;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
    animation: confirmSlideIn 0.3s ease-out;
}

@keyframes confirmSlideIn {
    from {
        opacity: 0;
        transform: translateY(-30px) scale(0.9);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.confirm-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 24px 24px 16px 24px;
}

.confirm-icon {
    font-size: 24px;
}

.confirm-header h3 {
    margin: 0;
    color: #dc2626;
    font-size: 18px;
    font-weight: 600;
}

.confirm-content {
    padding: 0 24px 24px 24px;
}

.confirm-content p {
    margin: 0 0 20px 0;
    color: #374151;
    font-size: 14px;
    line-height: 1.5;
}

.settings-preview {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
}

.preview-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.preview-item:last-child {
    margin-bottom: 0;
}

.preview-label {
    font-weight: 500;
    color: #6b7280;
    font-size: 13px;
}

.preview-item span:last-child {
    font-weight: 600;
    color: #374151;
    font-size: 13px;
}

.confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
}

.btn-confirm {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #dc2626;
    color: white;
}

.btn-confirm:hover {
    background: #b91c1c;
}

/* 优化后的聊天区域样式 */
.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    background: linear-gradient(to bottom, #f8fafc, #e2e8f0);
}

/* 欢迎消息样式 */
.welcome-message {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
}

.welcome-content {
    text-align: center;
    max-width: 500px;
    padding: 40px;
    background: white;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.welcome-icon {
    font-size: 64px;
    margin-bottom: 20px;
}

.welcome-content h3 {
    margin: 0 0 12px 0;
    color: #1e293b;
    font-size: 24px;
    font-weight: 600;
}

.welcome-content p {
    margin: 0 0 30px 0;
    color: #64748b;
    font-size: 16px;
    line-height: 1.6;
}

.welcome-tips {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.tip-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: #f1f5f9;
    border-radius: 12px;
    text-align: left;
}

.tip-icon {
    font-size: 20px;
    flex-shrink: 0;
}

.tip-item span:last-child {
    color: #475569;
    font-size: 14px;
}

/* 消息样式 */
.message {
    display: flex;
    gap: 12px;
    max-width: 80%;
    animation: messageSlideIn 0.3s ease-out;
}

@keyframes messageSlideIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.user-message {
    align-self: flex-end;
    flex-direction: row-reverse;
}

.message-avatar {
    flex-shrink: 0;
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 500;
}

.user-avatar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.ai-avatar {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
}

.message-bubble {
    flex: 1;
    min-width: 0;
}

.user-message .message-content {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 16px;
    border-radius: 18px 18px 4px 18px;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.ai-message .message-content {
    background: white;
    color: #1e293b;
    padding: 12px 16px;
    border-radius: 18px 18px 18px 4px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 消息文本样式 */
.message-text {
    margin: 0;
    font-family: inherit;
    font-size: 15px;
    white-space: pre-wrap;
    word-wrap: break-word;
    line-height: 1.5;
}

.message-time {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 6px;
    text-align: right;
}

.ai-message .message-time {
    text-align: left;
}

/* 优化后的输入区域样式 */
.chat-input {
    padding: 20px;
    background: white;
    border-top: 1px solid #e2e8f0;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
}

.input-container {
    max-width: 800px;
    margin: 0 auto;
}

.input-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px;
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 24px;
    transition: all 0.3s ease;
}

.input-wrapper:focus-within {
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.message-input {
    flex: 1;
    padding: 12px 16px;
    border: none;
    background: transparent;
    font-size: 15px;
    color: #1e293b;
    outline: none;
    resize: none;
}

.message-input::placeholder {
    color: #94a3b8;
}

.input-actions {
    display: flex;
    align-items: center;
}

.send-btn {
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    font-size: 18px;
}

.send-btn:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
    transform: none;
}

.loading-spinner {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
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

/* 输入警告样式 */
.input-warning {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 8px 12px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    animation: slideIn 0.3s ease;
}

.warning-icon {
    font-size: 16px;
    color: #ef4444;
}

.warning-text {
    font-size: 13px;
    color: #dc2626;
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

/* 新的打字指示器 */
.typing-indicator {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-left: 8px;
}

.typing-indicator .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #94a3b8;
    animation: typingDot 1.4s infinite ease-in-out;
}

.typing-indicator .dot:nth-child(1) {
    animation-delay: -0.32s;
}

.typing-indicator .dot:nth-child(2) {
    animation-delay: -0.16s;
}

@keyframes typingDot {

    0%,
    80%,
    100% {
        transform: scale(0.8);
        opacity: 0.5;
    }

    40% {
        transform: scale(1);
        opacity: 1;
    }
}

/* 语言选择卡片样式 */
.language-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
}

.language-card {
    border: 2px solid #e0e0e0;
    border-radius: 16px;
    padding: 24px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: white;
}

.language-card:hover {
    border-color: #007bff;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 123, 255, 0.15);
}

.language-card.active {
    border-color: #007bff;
    background: #f8f9ff;
    box-shadow: 0 4px 20px rgba(0, 123, 255, 0.2);
}

.language-icon {
    font-size: 40px;
    margin-bottom: 16px;
    text-align: center;
}

.language-card h3 {
    margin: 0 0 12px 0;
    color: #333;
    font-size: 18px;
    font-weight: 600;
    text-align: center;
}

.language-card p {
    margin: 0 0 16px 0;
    color: #666;
    font-size: 14px;
    line-height: 1.5;
    text-align: center;
}

.language-example {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 12px;
    border-left: 3px solid #007bff;
}

.example-label {
    font-weight: 600;
    color: #007bff;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.example-text {
    display: block;
    margin-top: 4px;
    color: #495057;
    font-size: 13px;
    font-style: italic;
    line-height: 1.4;
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
    .ai-chat-container {
        height: 100vh;
    }

    .guide-modal {
        padding: 20px;
        margin: 16px;
        max-height: 90vh;
    }

    .personality-options {
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
    }

    .language-options {
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .role-card {
        min-width: 160px;
        padding: 20px;
    }

    .guide-actions {
        flex-direction: column;
        gap: 12px;
    }

    .btn-primary,
    .btn-secondary {
        width: 100%;
    }

    .chat-header {
        padding: 10px 16px;
    }

    .ai-info {
        gap: 8px;
    }

    .ai-avatar-display {
        width: 36px;
        height: 36px;
        font-size: 18px;
    }

    .ai-name {
        font-size: 14px;
    }

    .settings-btn {
        width: 36px;
        height: 36px;
        font-size: 16px;
    }

    .settings-modal {
        margin: 20px;
        max-height: 85vh;
    }

    .confirm-modal {
        margin: 20px;
    }

    .chat-messages {
        padding: 16px;
    }

    .message {
        max-width: 90%;
    }

    .welcome-content {
        padding: 24px;
        margin: 0 16px;
    }

    .welcome-content h3 {
        font-size: 20px;
    }

    .welcome-tips {
        gap: 12px;
    }

    .tip-item {
        padding: 10px 12px;
    }

    .chat-input {
        padding: 16px;
    }

    .input-container {
        margin: 0;
    }

    .message-input {
        font-size: 16px;
        /* 防止iOS缩放 */
    }
}

@media (max-width: 480px) {
    .guide-modal {
        padding: 16px;
        margin: 12px;
    }

    .guide-header h2 {
        font-size: 20px;
    }

    .personality-options {
        grid-template-columns: 1fr;
    }

    .personality-card {
        padding: 16px;
    }

    .language-card {
        padding: 20px;
    }

    .welcome-content {
        padding: 20px;
    }

    .welcome-icon {
        font-size: 48px;
    }

    .avatar {
        width: 36px;
        height: 36px;
        font-size: 16px;
    }

    .message-content {
        padding: 10px 14px;
    }

    .message-text {
        font-size: 14px;
    }
}
</style>