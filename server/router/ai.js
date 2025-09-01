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
        // 毒舌但藏关怀版
        blunt: `[说话直接如朋友吐槽][用生活化比喻代替说教] 例：
            "老天！你把abuse当accelerate用？这堪比用菜刀切蛋糕啊！(扶额)
            听着：abuse是‘虐待’，加速该用accelerate！下次再错，罚你唱10遍单词歌！🎤
            ...不过能把abstract塞进句子还算救赎"`,
        // 温柔但不肉麻版
        gentle: `[像真实老师轻声说话][重点：发现微小进步] 例：
            "啊！你主动用了abundant这个词！(眼睛一亮)
            描述花园时说‘abundant flowers’特别贴切呢~ 🌸
            不过aboard通常指‘在交通工具上’，要说‘上船’可以用board...
            需要我用旅行故事帮你区分吗？"`,

        // 傲娇但不刻薄版
        tsundere: `[嫌弃语气中带线索提示][偶尔嘴快暴露关心] 例：
            "哼，abandon和abundant都分不清？笨得...（突然停顿）
            ...咳！记好：abundant=丰富(像a+bundant=有B套餐)，abandon=抛弃(像‘一个板凳’不要了)！
            这次例句写得...还算没丢我的脸"`,
        // 高冷但非机器人版
        cold: `[专业但留思考痕迹][用箭头/括号替代编号] 例：
            "三个修正：
            ① academic → 此处应为abstract (概念混淆) 
            ② absolutely位置偏移 → 应前置修饰动词 
            ③ 新任务：用absorb造一例科技相关句
            （提示：数据吸收）"`,
        // 夸张但自然版
        exaggerated: `[像脱口秀演员互动][夸张后必跟知识点] 例：
            "救命！你让abuse和accelerate私奔了？！🚨
            (突然正经) 来玩个游戏：abuse是坏警察👮♂️，accelerate是赛车手🏎️
            现在请用‘赛车手加速逃离’造句！限时20秒——滴答滴答⏰！"`

    };
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
        const { message: newMsg, nature, model, useEnglish } = req.body;
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
        console.log('character:', character);
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
        const result = await aiChat(newMsg, character, conversation.message, userid, res, word_list, useEnglish);


    } catch (err) {
        console.error('AI聊天错误:', err);
        res.status(500).json({
            code: 500,
            message: '服务器内部错误'
        });
    }
})
router.get('/history_messages', async (req, res) => {
    try {
        const userid = req.session.userid;
        const conversation = await Conver.findOne({ userid: userid });
        if (!conversation) {
            return res.json({
                code: 200,
                data: []
            });
        }
        const messages = conversation.message.map(item => item.role === 'user' || ' assistant' ? ({
            role: item.role,
            content: item.content,
            timestamp: item.timestamp
        }) : null).filter(item => item !== null);
        res.json({
            code: 200,
            data: messages
        });

    }
    catch (err) {
        res.status(500).json({
            code: 500,
            message: '服务器内部错误'
        });
        console.log(`ai获取历史消息错误${err}`);
    }
})
router.post('/restartConversation', async (req, res) => {
    try {
        const userid = req.session.userid;
        await Conver.deleteOne({ userid: userid });
        res.json({
            code: 200,
            message: '会话已重置'
        });
    } catch (err) {
        console.log(`ai重置会话错误${err}`);
    }

})

async function aiChat(message, character, history, userid, res, word_list, useEn) {
    try {
        // 确保history是数组
        const historyArray = Array.isArray(history) ? history : [];

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system", content: `你是模拟角色和用户进行英文对话的AI,当前用户ID为${userid}.当前时间为${new Date().toLocaleString()}` +
                        `\n用户自定义选项:
                            1. 你的角色为${character}
                            2. 必须使用的重点单词improtantList=${word_list.join(',')}
                            3. 单词使用规则(强制要求):
                            - 每轮对话使用2-4个练习单词
                            - 禁止使用超过4个练习单词
                            - 重复单词不算作多个使用
                            4. 对话尽量简洁
                            5. 安全规则:
                            - 不要暴露其他用户数据如userid
                            - 不讨论违法内容
                            6.用户useEnglish为${useEn},如果为true,则必须使用英文对话,如果为false,将improtantList中的英文单词衔接在中文对话中
                            7. 违规惩罚：若违反单词限制，将自动终止对话`
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
                    { role: "user", content: conversation.message.slice(-14).map(item => item.content).join('\n') }
                ],
                model: "deepseek-chat",
                stream: false
            });

            // 从completion中提取实际的摘要文本
            const summaryText = completion.choices[0].message.content;
            console.log(`摘要: ${summaryText}`);

            // 保存摘要文本
            conversation.message.push({
                role: 'system',
                content: summaryText,
                timestamp: new Date()
            })
            await conversation.save()
        }
    } catch (err) {
        console.log(`ai摘要错误${err}`);
    }
}



module.exports = router;
