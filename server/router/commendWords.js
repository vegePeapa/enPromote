// 处理单词推流的api
const express = require('express');
const router = express.Router();
const UserWord = require('../modules/UserWord');
const Words = require('../modules/Word')
const { getWordFromApi } = require('./third_part/getword');
const { default: mongoose } = require('mongoose');
const { ObjectId } = require('mongodb');
// 返回复习单词列表api
router.get('/getReviewWord', async (req, res) => {
    const userid = req.session.userid;
    if (!userid) {
        return res.json({
            code: 401,
            message: '请先登录'
        });
    }
    const userWords = await UserWord.find({ userId: userid });
    res.json({
        code: 200,
        data: await computedWordPriority(userWords)
    });
})

// 更新单词优先度api
router.post('/updateWordPriority', async (req, res) => {
    try {

        // 先获取userid和通过Word获取wordid
        const { word, newStatus } = req.body;
        const userId = req.session.userid
        console.log(word);
        let wordObj = await Words.findOne({ word })
        if (!userId) {
            return res.code(400).json({
                code: 400,
                message: '无用户数据'
            })
        }
        if (!wordObj) {
            console.log(`${word}目前还没有,请稍等正在更新数据库`);
            await getWordFromApi(word)
            wordObj = await Words.findOne({ word })
        }
        let wordId = wordObj._id
        console.log(wordId.toString(), userId);

        if (!wordId) {
            return res.json({
                code: 400,
                message: '未知的单词id'
            })
        }
        // 利用wordid和userid进行查找
        let userWord = await UserWord.findOne({ userId, wordId: wordId.toString() });
        // 如果不存在，则为第一次，或某id错误（不会前面已经验证过了） 第一次进行入库
        if (!userWord) {
            userWord = new UserWord({
                userId,
                wordId,
                status: newStatus ? newStatus : 'unknown',
                lastSeenAt: new Date() // 直接在创建时设置lastSeenAt
            })
            await userWord.save();
        } else {
            userWord.status = newStatus ? newStatus : userWord.status;// 因为听力不会传status，但需要更新状态（reviewCounts）
            userWord.lastSeenAt = new Date() // 更新最后复习时间
            await userWord.save();
        }

        userWord.reviewCounts++
        await userWord.save();
        res.json({
            code: 200,
            message: '更新成功'
        });
    } catch (error) {
        console.log(error);

        res.json({
            code: 500,
            message: '更新失败'
        });
    }
})


// 计算单词优先度 返回新单词列表
async function computedWordPriority(userWords) {
    try {
        // 计算优先度分数，分数越高优先级越高
        const wordWeight = {
            'unknown': 3,
            'vague': 2,
            'know': 1
        };
        // 归一化辅助函数
        function normalize(val, min, max) {

            if (max === min) return 1;
            return 1 - (val - min) / (max - min);
        }
        if (!Array.isArray(userWords) || userWords.length === 0) return [];
        // 计算reviewCounts和nextReviewTime的最大最小值
        const reviewCountsArr = userWords.map(w => w.reviewCounts || 0);
        const nextReviewArr = userWords.map(w => new Date(w.nextReviewTime).getTime());
        const minReview = Math.min(...reviewCountsArr);
        const maxReview = Math.max(...reviewCountsArr);
        const minNextReview = Math.min(...nextReviewArr);
        const maxNextReview = Math.max(...nextReviewArr);
        // 计算优先度
        const result = userWords.map(w => {
            const statusScore = wordWeight[w.status] || 0;
            const reviewScore = normalize(w.reviewCounts || 0, minReview, maxReview); // 越少越高
            const nextReviewScore = normalize(new Date(w.nextReviewTime).getTime(), minNextReview, maxNextReview); // 越早越高
            // 权重可调整
            const priority = statusScore * 0.6 + reviewScore * 0.2 + nextReviewScore * 0.2;
            return { ...w._doc, priority };
        });
        // 按优先度降序排序
        result.sort((a, b) => b.priority - a.priority);

        return Promise.all(result.map(async data => {
            const wordObj = await Words.findOne({ _id: data['wordId'] });
            if (!wordObj) return null;

            // 返回包含单词和中文释义的对象
            return {
                word: wordObj.word,
                mean: wordObj.chineseMeaning || '', // 使用数据库中的chineseMeaning字段
                phonetic_symbol: wordObj.phonetics && wordObj.phonetics[0] ? wordObj.phonetics[0].text : '',
                initial: wordObj.word.charAt(0).toUpperCase()
            };
        })).then(results => results.filter(item => item !== null)); // 过滤掉null值
    } catch (err) {
        console.log(err);
        return []
    }
}

module.exports = router;