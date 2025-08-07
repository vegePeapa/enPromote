const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const User = require('../modules/User');
const fs = require('fs');
const path = require('path');
const { getWordFromApi } = require('./third_part/getword');
const { logger, logApiError, logUserAction, logDbError } = require('../utils/logger');
const { LEGAL_TLS_SOCKET_OPTIONS } = require('mongodb');

router.get('/getWordProgress', async (req, res) => {
    try {
        const userid = req.session.userid;
        if (!userid) {
            return res.json({
                code: 401,
                message: '请先登录'
            });
        }

        const user = await User.findById(userid);
        if (!user) {
            return res.json({
                code: 404,
                message: '用户不存在'
            });
        }

        logUserAction(req, 'GET_WORD_PROGRESS', { userId: userid });

        res.json({
            code: 200,
            data: user.cet4.position
        });
    } catch (error) {
        logApiError(req, error, 500);
        res.json({
            code: 500,
            message: '获取学习进度失败'
        });
    }
});


router.get('/getWordList', async (req, res) => {
    try {
        // 使用查询参数而不是请求体
        let letter = req.query.letter;
        let index = req.query.index;

        console.log(`请求获取单词列表: 字母=${letter}, 索引=${index}`);

        // 读取词汇表数据
        const vocabularyPath = path.join(__dirname, '..', 'vocabulary', 'CET-4.json');
        if (!fs.existsSync(vocabularyPath)) {
            return res.json({
                code: 404,
                message: '词汇表文件不存在'
            });
        }

        const vocabulary = JSON.parse(fs.readFileSync(vocabularyPath, 'utf-8'));

        // 检查请求的字母是否存在
        if (!letter || !vocabulary[letter]) {
            return res.json({
                code: 400,
                message: '无效的字母参数'
            });
        }

        // 获取对应字母下的单词列表
        const wordList = vocabulary[letter];

        // 确定返回的单词范围（每次返回10个单词）
        const startIdx = index ? parseInt(index) : 0;
        const endIdx = Math.min(startIdx + 10, wordList.length);

        // 检查索引是否大于词汇表长度，如果大于则更新用户进度
        if (startIdx >= wordList.length) {
            letter = String.fromCharCode(letter.charCodeAt(0) + 1); // 更新字母
            index = 0;
            const userid = req.session.userid;
            const user = await User.findById(userid);
            user.cet4.position = `${letter}:${index}`;
            await user.save();
        }

        // 提取要返回的单词列表
        const wordsToReturn = wordList.slice(startIdx, endIdx).map(wordItem => {
            // 如果是新格式（对象），返回完整对象
            // 如果是旧格式（字符串），只返回单词
            return typeof wordItem === 'string' ? wordItem : wordItem;
        });

        // console.log(`返回单词列表: ${JSON.stringify(wordsToReturn)}`);

        return res.json({
            code: 200,
            data: {
                words: wordsToReturn,
                total: wordList.length,
                currentIndex: startIdx,
                hasMore: endIdx < wordList.length
            }
        });
    } catch (error) {
        console.log(error);
        res.json({
            code: 500,
            message: '获取单词列表失败',
            error: error.message
        });
    }
});

router.post('/updateWordProgress', async (req, res) => {
    try {
        const studyWords = req.body.studyWords || 0;
        const userid = req.session.userid;

        if (!userid) {
            return res.json({
                code: 401,
                message: '请先登录'
            });
        }

        const user = await User.findById(userid);
        if (!user) {
            return res.json({
                code: 404,
                message: '用户不存在'
            });
        }

        const letter = user.cet4.position.split(':')[0];
        let index = user.cet4.position.split(':')[1];
        index = parseInt(index) + studyWords;
        user.cet4.position = `${letter}:${index}`;

        // 更新学习统计
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastStudyDate = new Date(user.cet4.lastStudyDate || new Date());
        lastStudyDate.setHours(0, 0, 0, 0);

        // 如果是今天第一次学习，重置今日学习数量
        if (today.getTime() !== lastStudyDate.getTime()) {
            user.cet4.todayStudiedWords = studyWords;

            // 计算连续天数
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastStudyDate.getTime() === yesterday.getTime()) {
                // 连续学习
                user.cet4.streakDays = (user.cet4.streakDays || 0) + 1;
            } else if (lastStudyDate.getTime() < yesterday.getTime()) {
                // 中断了，重新开始
                user.cet4.streakDays = 1;
            }

            user.cet4.lastStudyDate = today;
        } else {
            // 今天已经学习过，累加学习数量
            user.cet4.todayStudiedWords = (user.cet4.todayStudiedWords || 0) + studyWords;
        }

        user.cet4.lastStudyTime = new Date();

        await user.save();

        logUserAction(req, 'UPDATE_WORD_PROGRESS', {
            userId: userid,
            studyWords,
            newPosition: user.cet4.position,
            todayWords: user.cet4.todayStudiedWords,
            streakDays: user.cet4.streakDays
        });

        logger.info(`用户学习进度更新: ${userid}, 学习${studyWords}个单词`);

        res.json({
            code: 200,
            message: '更新成功'
        });
    } catch (error) {
        logApiError(req, error, 500);
        logDbError('UPDATE_WORD_PROGRESS', error, 'User');
        res.status(500).json({
            code: 500,
            message: '更新学习进度失败'
        });
    }
});

// 添加getWordInfo路由，直接使用getWordFromApi函数
router.get('/getWordInfo', async (req, res) => {
    const word = req.query.word;
    if (!word) {
        return res.json({ code: 400, message: '请输入单词' });
    }
    try {
        const data = await getWordFromApi(word);
        res.send(data);
    } catch (err) {
        console.error('API错误:', err.message);
        res.json({
            code: 500,
            message: '获取单词信息失败',
            error: err.message,
            suggestion: '请检查网络连接或代理设置'
        });
    }
});

// 获取单词听力
router.get('/getWordAudio', async (req, res) => {
    const word = req.query.word;
    if (!word) {
        return res.json({ code: 400, message: '请输入单词' });
    }
    try {
        const wordDocument = await getWordFromApi(word);
        if (!wordDocument) {
            return res.json({ code: 404, message: `${word}单词不存在` });
        }
        if (!wordDocument.phonetics || wordDocument.phonetics.length === 0) {
            return res.json({ code: 404, message: `${word}单词发音不存在` });
        }
        const phonetics = wordDocument.phonetics;

        // 查找有效的音频URL
        let resultAudio = null;
        for (let i = 0; i < phonetics.length; i++) {
            if (phonetics[i].audio) {
                resultAudio = phonetics[i].audio;
                break;
            }
        }

        // 如果没有找到音频，返回404
        if (!resultAudio) {
            return res.json({ code: 404, message: `${word}单词发音不存在` });
        }

        // 找到音频，返回成功响应
        res.json({
            code: 200,
            data: resultAudio,
        });
    } catch (err) {
        console.error('API错误:', err.message);
        res.json({
            code: 500,
            message: '获取单词信息失败',
            error: err.message,
            suggestion: '请检查网络连接或代理设置'
        });
    }
});

module.exports = router;