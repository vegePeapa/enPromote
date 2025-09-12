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
const http = require('http');

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
        // 支持章节参数，优先使用章节参数
        const { chapter } = req.query; // 新增：章节参数 A, B, C...
        let letter = req.query.chapter;
        let index = req.query.index;

        console.log(`请求获取单词列表: 章节=${chapter}, 字母=${letter}, 索引=${index}`);

        let vocabularyPath;
        let vocabulary;



        vocabularyPath = path.join(__dirname, '..', 'vocabulary', 'CET-4.json');
        console.log(vocabularyPath)
        if (!fs.existsSync(vocabularyPath)) {
            return res.json({
                code: 404,
                message: `章节 ${chapter} 的词汇表文件不存在`
            });
        }
        vocabulary = JSON.parse(fs.readFileSync(vocabularyPath, 'utf-8'));
        // 章节文件直接包含单词数组，不需要字母索引
        const wordList = vocabulary[letter];


        // 确定返回的单词范围
        const user = await User.findOne({ _id: req.session.userid });
        const planStudyWord = user?.planStudyWords || 10;
        console.log(`planStudyWord=${planStudyWord}`);

        const startIdx = index ? parseInt(index) : 0;
        const endIdx = Math.min(startIdx + planStudyWord, wordList.length);

        // 章节模式下不需要更新 cet4.position，只有字母模式才需要
        if (!chapter && startIdx >= wordList.length) {
            letter = String.fromCharCode(letter.charCodeAt(0) + 1);
            index = 0;
            const userid = req.session.userid;
            const user = await User.findById(userid);
            user.cet4.position = `${letter}:${index}`;
            await user.save();
        }

        // 提取要返回的单词列表
        const wordsToReturn = wordList.slice(startIdx, endIdx).map(wordItem => {
            return typeof wordItem === 'string' ? wordItem : wordItem;
        });

        console.log(`返回单词列表 (章节=${chapter || '字母模式'}): ${wordsToReturn.length}个单词`);

        return res.json({
            code: 200,
            data: {
                words: wordsToReturn,
                wordListLen: wordsToReturn.length,
                total: wordList.length,
                currentIndex: startIdx,
                hasMore: endIdx < wordList.length,
                chapter: chapter || null, // 返回章节信息
                mode: chapter ? 'chapter' : 'letter' // 返回模式信息
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
        user.totalWords += studyWords;
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

            // 检查是否是第一次学习（lastStudyDate为默认值或很久以前）
            const isFirstTime = !user.cet4.lastStudyDate ||
                (today.getTime() - lastStudyDate.getTime()) > 7 * 24 * 60 * 60 * 1000; // 超过7天

            if (isFirstTime) {
                // 第一次学习或长时间未学习，重新开始
                user.cet4.streakDays = 1;
                console.log(`用户${userid}第一次学习或重新开始，连续天数重置为1`);
            } else if (lastStudyDate.getTime() === yesterday.getTime()) {
                // 连续学习（昨天学习了，今天继续）
                const oldStreak = user.cet4.streakDays || 0;
                user.cet4.streakDays = oldStreak + 1;
                console.log(`用户${userid}连续学习，连续天数从${oldStreak}增加到${user.cet4.streakDays}`);
            } else if (lastStudyDate.getTime() < yesterday.getTime()) {
                // 中断了（上次学习是前天或更早），重新开始
                const oldStreak = user.cet4.streakDays || 0;
                user.cet4.streakDays = 1;
                console.log(`用户${userid}学习中断，连续天数从${oldStreak}重置为1`);
            }
            // 如果 lastStudyDate > yesterday，说明时间有问题，保持原值

            user.cet4.lastStudyDate = today;
        } else {
            // 今天已经学习过，累加学习数量（连续天数不变）
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
        // 优先尝试有道词典音频(说真的如果有道的都没有下面的dictionaryapi也不会有，下面的就作废吧)
        const voiceType = 2 //美式发音
        const youDaoUrl = `http://dict.youdao.com/dictvoice?audio=${word}&type=${voiceType}`
        http.get(youDaoUrl, (youdaoRes) => {
            if (youdaoRes.statusCode !== 200) {
                console.error(`请求失败，状态码：${youdaoRes.statusCode}`);
                res.json({
                    code: 404,
                    message: `${word}单词发音不存在`
                })
                res.resume(); // 释放资源
                return;
            }
            res.json({
                code: 200,
                data: youDaoUrl
            })
        })



    } catch (err) {
        console.error('API错误:', err.message);
        res.status(500).json({
            code: 500,
            message: '获取单词信息失败',
            error: err.message,
            suggestion: '请检查网络连接或代理设置'
        });
    }
});

module.exports = router;