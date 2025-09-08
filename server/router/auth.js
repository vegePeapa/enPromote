const express = require('express');
const User = require('../modules/User');
const { logger, logApiError, logUserAction } = require('../utils/logger');
const router = express.Router();
router.post('/login', async (req, res) => {
    let username, password;
    try {
        ({ username, password } = req.body);
    } catch (err) {
        logApiError(req, err, 400);
        return res.json({ code: 400, message: '错误的请求格式，请求体结构缺失' });
    }

    try {
        const user = await User.findOne({ username });

        if (!user) {
            logUserAction(req, 'LOGIN_FAILED', { username, reason: '用户不存在' });
            return res.json({ code: 400, message: '用户不存在' });
        }

        if (password === user.password) {
            // login success set session
            req.session.userid = user._id;
            req.session.isLogin = true;

            logUserAction(req, 'LOGIN_SUCCESS', { username, userId: user._id });
            logger.info(`用户登录成功: ${username}`);

            return res.json({ code: 200, message: '登录成功' });
        } else {
            logUserAction(req, 'LOGIN_FAILED', { username, reason: '密码错误' });
            return res.json({ code: 400, message: '密码错误' });
        }
    } catch (error) {
        logApiError(req, error, 500);
        return res.json({ code: 500, message: '服务器内部错误' });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.json({ code: 400, message: '用户名和密码不能为空' });
        }

        const user = await User.findOne({ username });
        if (user) {
            logUserAction(req, 'REGISTER_FAILED', { username, reason: '用户已存在' });
            return res.json({ code: 400, message: '用户已存在' });
        }

        const newUser = new User({ username, password });
        await newUser.save();

        logUserAction(req, 'REGISTER_SUCCESS', { username, userId: newUser._id });
        logger.info(`新用户注册成功: ${username}`);

        return res.json({ code: 200, message: '注册成功' });
    } catch (error) {
        logApiError(req, error, 500);
        return res.json({ code: 500, message: '服务器内部错误' });
    }
});

router.post('/logout', (req, res) => {
    try {
        const userId = req.session?.userid;

        req.session.destroy((err) => {
            if (err) {
                logApiError(req, err, 500);
                return res.json({ code: 500, message: '退出登录失败' });
            }

            res.clearCookie('sid');
            logUserAction(req, 'LOGOUT_SUCCESS', { userId });
            logger.info(`用户退出登录: ${userId}`);

            return res.json({ code: 200, message: '退出登录成功' });
        });
    } catch (error) {
        logApiError(req, error, 500);
        return res.json({ code: 500, message: '服务器内部错误' });
    }
});

router.get('/info', async (req, res) => {
    try {
        const { userid } = req.session;
        if (!userid || userid === undefined) {
            return res.json({ code: 400, message: `未登录${req.session.isLogin}` });
        }

        const user = await User.findById(userid);
        if (!user) {
            return res.json({ code: 400, message: '用户不存在' });
        }

        // 计算今日学习单词数
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayWords = user.cet4.todayStudiedWords || 0;

        // 计算连续学习天数
        const streakDays = user.cet4.streakDays || 0;

        logUserAction(req, 'GET_USER_INFO', { userId: userid });

        return res.json({
            code: 200,
            message: '获取用户信息成功',
            username: user.username,
            creatTime: user.createTime,
            cet4: user.cet4,
            todayWords: todayWords,
            streakDays: streakDays,
            totalWords: user.totalWords,
            planStudyWords: user.planStudyWords,
            planReviweWords: user.planReviweWords,
            question_completed: user.question_completed,
            ai_choose_completed: user.ai_choose_completed
        });
    } catch (error) {
        logger.error('获取用户信息失败:', error);
        logApiError(req, error, 500);
        return res.json({ code: 500, message: '服务器内部错误' });
    }
});

router.post('/changeinfo', async (req, res) => {
    try {
        const { userid } = req.session;

        if (!userid) {
            return res.json({ code: 401, message: '请先登录' });
        }

        if (!req.body || Object.keys(req.body).length === 0) {
            return res.json({ code: 400, message: '请求体不能为空' });
        }

        const { username, password, planStudyWords, planReviweWords, question_completed, ai_choose_completed,wordP,spellP,listenP,customsP, coverP } = req.body;
        const updateData = {};

        // 验证用户名
        if (username !== undefined) {
            if (!username || username.trim().length < 2) {
                return res.json({ code: 400, message: '用户名至少需要2个字符' });
            }

            // 检查用户名是否已存在（排除当前用户）
            const existingUser = await User.findOne({
                username: username.trim(),
                _id: { $ne: userid }
            });

            if (existingUser) {
                return res.json({ code: 400, message: '用户名已存在' });
            }

            updateData.username = username.trim();
        }
        // 验证问卷完成状态
        if (question_completed !== undefined) {
            updateData.question_completed = question_completed;
        }
        // 验证AI选择完成状态
        if (ai_choose_completed !== undefined) {
            updateData.ai_choose_completed = ai_choose_completed;
        }
        // 验证密码
        if (password !== undefined) {
            if (!password || password.length < 6) {
                return res.json({ code: 400, message: '密码至少需要6个字符' });
            }

            updateData.password = password;
        }

        // 验证学习计划
        if (planStudyWords !== undefined) {
            const studyWords = parseInt(planStudyWords);
            if (isNaN(studyWords) || studyWords < 1 || studyWords > 100) {
                return res.json({ code: 400, message: '每日学习单词数应在1-100之间' });
            }
            updateData.planStudyWords = studyWords;
        }

        if (planReviweWords !== undefined) {
            const reviewWords = parseInt(planReviweWords);
            if (isNaN(reviewWords) || reviewWords < 1 || reviewWords > 50) {
                return res.json({ code: 400, message: '每日复习单词数应在1-50之间' });
            }
            updateData.planReviweWords = reviewWords;
        }
        // 关卡进度
        allCostumPassage(wordP);
        allCostumPassage(spellP);
        allCostumPassage(listenP);
        allCostumPassage(customsP);
        allCostumPassage(coverP,true,userid);


        // 更新用户信息
        const updatedUser = await User.findByIdAndUpdate(
            userid,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.json({ code: 404, message: '用户不存在' });
        }

        // 记录操作日志
        logUserAction(req, 'UPDATE_USER_INFO', {
            userId: userid,
            updatedFields: Object.keys(updateData)
        });

        res.json({
            code: 200,
            message: '修改成功',
            data: {
                username: updatedUser.username,
                planStudyWords: updatedUser.planStudyWords,
                planReviweWords: updatedUser.planReviweWords
            }
        });

    } catch (err) {
        console.error('修改用户信息失败:', err);
        logApiError(req, err, 500);
        return res.json({ code: 500, message: '服务器内部错误' });
    }
})
// 关卡进度函数
async function allCostumPassage(cus, nextC = false, uesrid = "") {
      if(cus !== undefined){
            const cus = cus.toLowerCase() === "true" ? true : 
                 str.toLowerCase() === "false" ? false : 
                 false; // 默认值
            updateData.cus =  cus    
        }
        //如果nextC 说明倒了最后一关，需要更新position进度
        
        if(cus === true && nextC === true){
            const user = await User.findById(userid);
           
            const [letter, number] = user.position.split(':');
            const nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);
            user.position = `${nextLetter}:${number}`; 
            const cet4 = uesr.cet4
            // 重置关卡进度
            cet4.wordP = cet4.spellP = cet4.listenP = cet4.customsP = cet4.coverP = false;
            await user.save();
        }
       
}
module.exports = router;