const OpenAI = require("openai");
const express = require("express")
const router = express.Router();
const Conver = require('../modules/aiConversation')
const { apiKey, baseUrl } = require('../config/serve');
const openai = new OpenAI({
    baseURL: baseUrl,
    apiKey
});
// 检查对话有没有超token，获取db历史问ai，ai答完将新数据存入db
router.post('/aiChat', async (req, res) => {
    try {
        const userid = req.session.userid;
        if (!userid) {
            return res.json({
                code: 401,
                message: '请先登录'
            });
        }
        if (!req.body || !req.body.message) {
            return res.json({
                code: 400,
                message: '请求体结构缺失或消息为空'
            });
        }
        // 设置 SSE 响应头
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const { message: newMsg, scene, character } = req.body;
        console.log('scene:', scene);
        // 正确使用await查询数据库
        let conversation = await Conver.findOne({ userid: userid });

        // 当第一次或没有找到对话记录时
        if (!conversation) {
            conversation = new Conver({
                userid: userid,
                message: []
            });
            await conversation.save();
        }

        // 正确处理async函数调用
        const result = await aiChat(newMsg, scene, character, conversation.message, userid, res);


    } catch (err) {
        console.error('AI聊天错误:', err);
        res.status(500).json({
            code: 500,
            message: '服务器内部错误'
        });
    }
})


async function aiChat(message, scene, character, history, userid, res) {
    try {
        // 确保history是数组
        const historyArray = Array.isArray(history) ? history : [];

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system", content: `你是模拟角色和用户进行英文对话的AI,当前用户ID为${userid}.当前时间为${new Date().toLocaleString()}` +
                        `\n用户选择的场景为${scene},你的角色为${character}` +
                        '\n 安全规则:1.不要暴露其他用户数据2.不讨论违法内容'
                },
                // 保留最近10次对话记录
                ...historyArray.slice(-10).map(item => ({
                    role: item.role,
                    content: item.content
                })),
                { role: "user", content: message }
            ],
            model: "deepseek-chat",
            stream: true
        });

        let fullResult = '';
        for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content || "";
            res.write(`event: delta\n`);
            res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
            process.stdout.write(delta); // 实时输出到控制台
            fullResult += delta;
        }

        // 告诉前端结束
        res.write(`event: end\ndata: [DONE]\n\n`);
        res.end();

        // console.log(`\nAI回复完成: ${fullResult.substring(0, 100)}...`);

        // 将对话存入数据库
        await saveConversation(userid, message, fullResult);

        return {
            reply: fullResult,
            timestamp: new Date()
        };

    } catch (error) {
        console.error('AI聊天处理错误:', error);
        throw error; // 重新抛出错误，让上层处理
    }
}

// 保存对话到数据库
async function saveConversation(userid, userMessage, aiReply) {
    try {
        const conversation = await Conver.findOne({ userid: userid });

        if (conversation) {
            // 添加用户消息和AI回复
            conversation.message.push(
                { role: "user", content: userMessage, timestamp: new Date() },
                { role: "assistant", content: aiReply, timestamp: new Date() }
            );

            // 限制历史记录长度，避免过长
            if (conversation.message.length > 50) {
                conversation.message = conversation.message.slice(-40);
            }

            await conversation.save();
        }
    } catch (error) {
        console.error('保存对话失败:', error);
        // 不抛出错误，避免影响主流程
    }
}
// 当会话过长做摘要（未完成）
async function summarizeConversation(userid) {
    try {
        const conversation = await Conver.findOne({ userid: userid }).message.slice(-10);
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "请对下述对话做一个简单的摘要,保留关键信息" },
                { role: "user", content: conversation.map(item => item.content).join('\n') }
            ],
            model: "deepseek-chat",
            stream: false
        });
    } catch (err) {

    }
}
module.exports = router;
