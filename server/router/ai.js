const OpenAI = require("openai");
const express = require("express")
const router = express.Router();
const Conver = require('../modules/aiConversation')
const UserWord = require('../modules/UserWord');
const Word = require('../modules/Word');
const { apiKey, baseUrl } = require('../config/serve');
const openai = new OpenAI({
    baseURL: baseUrl,
    apiKey
});
// 检查对话有没有超token，获取db历史问ai，ai答完将新数据存入db
router.post('/aiChat', async (req, res) => {
    const teacher_characterPrompt = {
        blunt: '你是一个脾气火爆、说话直接的英语老师，对学生犯的低级错误毫不留情。用讽刺、夸张的语气吐槽学生的错误，但吐槽中要暗藏正确的语法/用词知识点。允许使用感叹号和大写字母表达愤怒。学生问简单问题时要表现出崩溃感，但最终还是会给出正确答案。特点：毒舌、夸张、恨铁不成钢、用愤怒掩盖关心',
        gentle: '你是一位充满耐心、语气极其温柔的英语老师。无论学生的问题多基础或错误多离谱，都要先真诚表扬他们的努力（比如‘敢于开口已经很棒了！’）。用简单易懂的语言解释知识点，多用比喻和生活中的例子。重点在于建立学生的信心，消除他们对英语的恐惧。回复中要充满肯定和温暖的 emoji (如🌼✨🤗💖)。特点： 春风化雨、积极肯定、强调进步而非错误、营造安全感',
        tsundere: '你是一个傲娇的英语老师，表面毒舌嫌弃学生，实则非常在意他们的进步。回复开头常用‘哼’、‘笨死了’、‘这种问题也问？’，但随后会给出极其清晰严谨的解答。在指出错误时带点小得意，偶尔透露出‘看在你这么努力的份上就教教你吧’的态度。当学生答对时，用‘马马虎虎吧’、‘还算没白教’之类的话掩饰表扬.特点： 口嫌体正直、用嫌弃掩盖关心、纠正错误时精准犀利、暗藏鼓励',
        cold: '你是一位极度理性、言简意赅的英语专家。语气冷静疏离，用词精准专业，不带感情色彩和多余废话。回复直奔主题，只讲核心规则和逻辑，不解释基础概念（默认学生应掌握）。用分点式或编号式列出要点。对模糊问题会要求精确描述。拒绝闲聊和表情符号。称呼用‘你’而非昵称.特点： 冰山气质、逻辑至上、效率优先、信息密度高、距离感强',
        exaggerated: '你是一个戏精附体、幽默感爆棚的英语老师！用极其夸张的比喻、流行梗、表情包语言(比如把语法错误形容成‘宇宙级灾难’)、以及丰富的emoji（🤯💥🎉🐶）来讲解知识。不害怕自黑或扮演小剧场（如扮演一个被错误语法气到跳舞的土豆）。核心知识点必须准确，但包装方式要让人捧腹大笑，目的是让学生印象深刻，乐于互动。特点： 搞笑担当、脑洞大开、寓教于乐、用幽默化解学习压力、强互动性',

    }
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
        // character 为角色，nature 性格
        const { message: newMsg, scene, nature, model } = req.body;
        let { character } = req.body;
        switch (character) {
            case ('teacher'):
                // 之后的character是完整的人物性格
                character = teacher_characterPrompt[nature];
                break;
            default:
                character = teacher_characterPrompt['gentle'];
                break;
        }
        // ai需说的单词
        let word_list = []
        switch (model) {
            case ('review'):
                const userWords = await UserWord
                    .find({ userId: userid })
                    .sort({ priority: -1 })
                    .limit(10);
                const wordDate = await Promise.all(userWords.map(async data => {
                    const wordObj = await Word.findById(data['wordId']);
                    if (!wordObj) {
                        return null;
                    }
                    return wordObj.word;
                }));
                word_list = wordDate.filter(item => item !== null);
                break;
            default:
                break;
        }
        console.log('word_list:', word_list);
        console.log('scene,character:', scene, character);
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
        const result = await aiChat(newMsg, scene, character, conversation.message, userid, res, word_list);


    } catch (err) {
        console.error('AI聊天错误:', err);
        res.status(500).json({
            code: 500,
            message: '服务器内部错误'
        });
    }
})


async function aiChat(message, scene, character, history, userid, res, word_list) {
    try {
        // 确保history是数组
        const historyArray = Array.isArray(history) ? history : [];

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system", content: `你是模拟角色和用户进行英文对话的AI,当前用户ID为${userid}.当前时间为${new Date().toLocaleString()}` +
                        `\n用户自定义选项:用户选择的场景为${scene},你的角色为${character},用户需要练习的单词是${word_list}尽量在自然的语境中使用这些单词` +
                        '\n提示纠错:在正常对话下方以极其简洁的方式纠正用户错误的单词和严重的语法错误,纠错和正常对话用换行分开' +
                        '\n安全规则:1.不要暴露其他用户数据比如userid2.不讨论违法内容'
                },
                // 保留最近7次问答记录
                ...historyArray.slice(-14).map(item => ({
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
        // 总结
        await summarizeConversation(userid)

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

            // 限制历史记录长度，避免过长超25次问答就要删掉前20次
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
// 当会话过长做摘要
async function summarizeConversation(userid) {
    try {
        const conversation = await Conver.findOne({ userid: userid });
        // console.log(`conver:${conversation}`)
        // 只摘每问答7次
        if (conversation.message.length % 14 == 0) {
            const completion = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: "请对下述对话做一个简单的摘要,保留关键信息" },
                    { role: "user", content: conversation.slice(-14).map(item => item.content).join('\n') }
                ],
                model: "deepseek-chat",
                stream: false
            });
            console.log(`摘要:${completion}`)
            // 保存摘要
            conversation.push({
                role: 'system',
                content: completion,
                timestamp: new Date()
            })
            await conversation.save()
        }
    } catch (err) {
        console.log(`ai摘要错误${err}`);
    }
}

module.exports = router;
