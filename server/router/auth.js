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
            streakDays: streakDays
        });
    } catch (error) {
        logApiError(req, error, 500);
        return res.json({ code: 500, message: '服务器内部错误' });
    }
});
module.exports = router;