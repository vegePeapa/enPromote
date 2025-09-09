const mongoose = require('mongoose');
let userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    cet4: {
        position: {
            type: String,
            default: 'A:0'
        },
        // 移除冗余的关卡状态字段，只保留学习统计数据
        lastStudyTime: {
            type: Date,
            default: Date.now
        },
        learnedWords: {
            type: Number,
            default: 0
        },
        todayStudiedWords: {
            type: Number,
            default: 0
        },
        streakDays: {
            type: Number,
            default: 0
        },
        lastStudyDate: {
            type: Date,
            default: Date.now
        }
    },
    // 多章节进度支持
    chapters: {
        type: Map,
        of: {
            level: { type: Number, default: 1 },
            score: { type: Number, default: 0 },
            completedWords: { type: Number, default: 0 },
            wordP: { type: Boolean, default: false },
            spellP: { type: Boolean, default: false },
            listenP: { type: Boolean, default: false },
            customsP: { type: Boolean, default: false },
            coverP: { type: Boolean, default: false }
        },
        default: function() {
            return new Map([
                ['A', { level: 1, score: 0, completedWords: 0, wordP: false, spellP: false, listenP: false, customsP: false, coverP: false }],
                ['B', { level: 1, score: 0, completedWords: 0, wordP: false, spellP: false, listenP: false, customsP: false, coverP: false }]
            ]);
        }
    },
    currentChapter: {
        type: String,
        default: 'A'
    },
    totalWords: {
        type: Number,
        default: 0
    },
    planReviweWords: {
        type: Number,
        default: 15
    },
    planStudyWords: {
        type: Number,
        default: 15
    },
    question_completed: {
        type: Boolean,
        default: false
    },
    ai_choose_completed: {
        type: Boolean,
        default: false
    },
    createTime: {
        type: Date,
        default: Date.now
    }
});
const User = mongoose.model('User', userSchema);
module.exports = User;