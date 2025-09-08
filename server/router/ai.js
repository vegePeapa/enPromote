const OpenAI = require("openai");
const express = require("express")
const router = express.Router();
const Conver = require('../modules/aiConversation')
const UserWord = require('../modules/UserWord');
const Word = require('../modules/Word');
const { apiKey, baseUrl } = require('../config/serve');
const { logger } = require('../utils/logger');
const aiPromptJson = require("../ai/aiPrompt.json");
const aiChatPrompts = require("../ai/aiChatPrompts.json");
const AiChatSession = require('../modules/AiChatSession');
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
                // 最多给ai10个单词，全给浪费我token
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
        logger.error('AI聊天处理错误:', err);
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
        logger.error('AI聊天处理错误:', err);
        res.status(500).json({
            code: 500,
            message: '服务器内部错误'
        });
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
        logger.error('AI聊天处理错误:', err);
        // console.log(`ai重置会话错误${err}`);
    }

})
// 生成题目
router.post('/ai_generate_question', async (req, res) => {
    try {
        // a酒店入住，b餐厅用餐 PositionType由前端处理
        const { PositionType, wordList } = req.body;
        if (!PositionType || !wordList) {
            logger.error("ai_generate_question请求体结构缺失");
            console.log(PositionType, wordList);
            res.json({
                code: 400,
                message: "请求体结构缺失"
            })
        }
        
        const aiPromptStr = JSON.stringify(aiPromptJson[PositionType]);
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: aiPromptStr }
            ],
            model: "deepseek-chat",
            stream: false
        })
        const custom = completion.choices[0].message.content;
        res.json({
            code: 200,
            message: "成功",
            data: JSON.parse(custom)
        })
    } catch (err) {
        console.log(`ai question${err}`);
    }
})

// 获取用户需要练习的单词列表
router.get('/practice_words', async (req, res) => {
    try {
        const { userid } = req.session;
        if (!userid) {
            return res.json({ code: 401, message: '未登录' });
        }

        // 和ai练习的单词一样10个
        const userWords = await UserWord
            .find({ userId: userid })
            .sort({ priority: -1 })
            .limit(10);

        const wordList = await Promise.all(userWords.map(async data => {
            const wordObj = await Word.findById(data['wordId']);
            if (!wordObj) {
                return null;
            }
            return {
                id: wordObj._id,
                word: wordObj.word,
                chineseMeaning: wordObj.chineseMeaning || '暂无中文释义',
                phonetic: wordObj.phonetics && wordObj.phonetics[0] ? wordObj.phonetics[0].text : '',
                status: data.status,
                priority: data.priority,
                reviewCounts: data.reviewCounts
            };
        }));

        const filteredWordList = wordList.filter(item => item !== null);

        res.json({
            code: 200,
            message: '获取成功',
            data: {
                words: filteredWordList,
                total: filteredWordList.length
            }
        });

    } catch (error) {
        logger.error('获取练习单词列表失败:', error);
        // console.error('获取练习单词列表失败:', error);
        res.json({
            code: 500,
            message: '服务器内部错误'
        });
    }
});
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
                            - 每轮回答必须使用2-4个练习单词
                            - 禁止使用超过4个练习单词
                            - 重复单词不算作多个使用
                            4. 对话尽量简洁
                            5. 安全规则:
                            - 不要暴露其他用户数据如userid
                            - 不讨论违法内容
                            6.用户useEnglish为${useEn},如果为true,则必须使用英文对话,如果为false,除了improtantList中的单词必须使用中文对话
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
        logger.error('AI聊天处理错误:', error);
        // console.error('AI聊天处理错误:', error);
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
        logger.error('保存对话失败:');
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
        logger.error('AI聊天处理错误:', err);
    }
}



// 开始任务导向的AI对话会话
router.post('/startTaskChat', async (req, res) => {
    try {
        const userid = req.session.userid;
        if (!userid) {
            return res.json({ code: 401, message: '请先登录' });
        }

        const { scene } = req.body; // A 或 B
        if (!scene || !aiChatPrompts[scene]) {
            return res.json({ code: 400, message: '无效的场景参数' });
        }

        // 检查是否有未完成的会话
        const existingSession = await AiChatSession.findOne({
            userid: userid,
            status: 'active'
        });

        if (existingSession) {
            return res.json({
                code: 200,
                message: '继续现有会话',
                data: {
                    sessionId: existingSession.sessionId,
                    scene: existingSession.scene,
                    progress: existingSession.progress,
                    tasks: existingSession.tasks
                }
            });
        }

        // 创建新的会话
        const sessionId = `${userid}_${Date.now()}`;
        const sceneConfig = aiChatPrompts[scene];
        
        const newSession = new AiChatSession({
            userid: userid,
            scene: scene,
            sessionId: sessionId,
            tasks: sceneConfig.tasks.map(task => ({
                ...task,
                usedWords: []
            })),
            completionCriteria: sceneConfig.completionCriteria,
            progress: {
                totalTasks: sceneConfig.tasks.length,
                totalWords: sceneConfig.tasks.reduce((sum, task) => sum + task.requiredWords.length, 0)
            }
        });

        await newSession.save();

        // 发送初始系统消息
        const welcomeMessage = `欢迎来到${sceneConfig.scene}场景！我是${sceneConfig.aiRole}，您是${sceneConfig.userRole}。让我们开始对话吧！`;
        newSession.addMessage('assistant', welcomeMessage);
        await newSession.save();

        res.json({
            code: 200,
            message: '会话创建成功',
            data: {
                sessionId: sessionId,
                scene: scene,
                sceneInfo: {
                    scene: sceneConfig.scene,
                    aiRole: sceneConfig.aiRole,
                    userRole: sceneConfig.userRole,
                    taskDescription: sceneConfig.taskDescription
                },
                progress: newSession.progress,
                tasks: newSession.tasks,
                welcomeMessage: welcomeMessage
            }
        });

    } catch (error) {
        logger.error('创建任务对话会话失败:', error);
        res.json({ code: 500, message: '服务器内部错误' });
    }
});

// 任务导向的AI对话
router.post('/taskChat', async (req, res) => {
    try {
        const userid = req.session.userid;
        if (!userid) {
            return res.json({ code: 401, message: '请先登录' });
        }

        const { sessionId, message: userMessage } = req.body;
        if (!sessionId || !userMessage) {
            return res.json({ code: 400, message: '缺少必要参数' });
        }

        // 查找会话
        const session = await AiChatSession.findOne({
            userid: userid,
            sessionId: sessionId,
            status: 'active'
        });

        if (!session) {
            return res.json({ code: 404, message: '会话不存在或已结束' });
        }

        // 设置 SSE 响应头
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        // 获取场景配置
        const sceneConfig = aiChatPrompts[session.scene];
        
        // 分析用户消息中使用的单词
        const usedWords = session.extractUsedWords(userMessage);
        
        // 确定当前任务
        const currentTask = session.tasks.find(task => !task.completed) || session.tasks[0];
        
        // 添加用户消息
        session.addMessage('user', userMessage, currentTask ? currentTask.id : null);

        // 构建AI提示词
        const systemPrompt = buildTaskSystemPrompt(sceneConfig, session, currentTask);
        
        // 调用AI
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                ...session.messages.slice(-10).map(msg => ({
                    role: msg.role,
                    content: msg.content
                }))
            ],
            model: "deepseek-chat",
            stream: true
        });

        let fullResult = '';
        for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content || "";
            res.write(`event: delta\n`);
            res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
            fullResult += delta;
        }

        // 添加AI回复
        session.addMessage('assistant', fullResult, currentTask ? currentTask.id : null);

        // 检查是否完成
        const isCompleted = session.checkCompletion();
        
        if (isCompleted) {
            session.status = 'completed';
            session.endTime = new Date();
            const report = session.generateCompletionReport();
            
            res.write(`event: completion\n`);
            res.write(`data: ${JSON.stringify({ 
                completed: true, 
                report: report,
                progress: session.progress 
            })}\n\n`);
        } else {
            res.write(`event: progress\n`);
            res.write(`data: ${JSON.stringify({ 
                progress: session.progress,
                currentTask: currentTask,
                usedWords: usedWords
            })}\n\n`);
        }

        res.write(`event: end\ndata: [DONE]\n\n`);
        res.end();

        await session.save();

    } catch (error) {
        logger.error('任务对话处理错误:', error);
        res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
});

// 获取会话状态
router.get('/getSessionStatus/:sessionId', async (req, res) => {
    try {
        const userid = req.session.userid;
        const { sessionId } = req.params;

        const session = await AiChatSession.findOne({
            userid: userid,
            sessionId: sessionId
        });

        if (!session) {
            return res.json({ code: 404, message: '会话不存在' });
        }

        res.json({
            code: 200,
            data: {
                sessionId: session.sessionId,
                scene: session.scene,
                status: session.status,
                progress: session.progress,
                tasks: session.tasks,
                messages: session.messages,
                completionReport: session.completionReport
            }
        });

    } catch (error) {
        logger.error('获取会话状态失败:', error);
        res.json({ code: 500, message: '服务器内部错误' });
    }
});

// 结束会话
router.post('/endSession', async (req, res) => {
    try {
        const userid = req.session.userid;
        const { sessionId } = req.body;

        const session = await AiChatSession.findOne({
            userid: userid,
            sessionId: sessionId,
            status: 'active'
        });

        if (!session) {
            return res.json({ code: 404, message: '会话不存在或已结束' });
        }

        session.status = 'abandoned';
        session.endTime = new Date();
        const report = session.generateCompletionReport();
        
        await session.save();

        res.json({
            code: 200,
            message: '会话已结束',
            data: {
                report: report,
                progress: session.progress
            }
        });

    } catch (error) {
        logger.error('结束会话失败:', error);
        res.json({ code: 500, message: '服务器内部错误' });
    }
});

// 构建任务系统提示词
function buildTaskSystemPrompt(sceneConfig, session, currentTask) {
    const progress = session.progress;
    const completedTasks = session.tasks.filter(task => task.completed);
    
    let prompt = `${sceneConfig.systemPrompt}\n\n`;
    prompt += `${sceneConfig.rolePrompt}\n\n`;
    
    prompt += `当前会话进度：\n`;
    prompt += `- 已完成任务：${progress.tasksCompleted}/${progress.totalTasks}\n`;
    prompt += `- 已使用单词：${progress.wordsUsed}个\n`;
    prompt += `- 对话轮次：${progress.turnCount}\n\n`;
    
    if (currentTask) {
        prompt += `当前任务：${currentTask.name}\n`;
        prompt += `任务描述：${currentTask.description}\n`;
        prompt += `需要使用的单词：${currentTask.requiredWords.join(', ')}\n`;
        prompt += `最少使用：${currentTask.minWords}个单词\n`;
        prompt += `已使用单词：${currentTask.usedWords.join(', ') || '无'}\n\n`;
    }
    
    prompt += `重要规则：\n`;
    prompt += `1. 严格按照${sceneConfig.scene}场景进行对话\n`;
    prompt += `2. 引导用户完成当前任务\n`;
    prompt += `3. 鼓励用户使用指定的练习单词\n`;
    prompt += `4. 当用户正确使用单词时给予积极反馈\n`;
    prompt += `5. 保持角色一致性，你是${sceneConfig.aiRole}\n`;
    prompt += `6. 对话要自然流畅，不要显得机械化\n`;
    prompt += `7. 当所有必要任务完成后，自然地结束对话\n`;
    
    return prompt;
}

module.exports = router;
