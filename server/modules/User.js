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
    planReviweWords: {
        type: Number,
        default: 0
    },
    planStudyWords: {
        type: Number,
        default: 0
    },
    createTime: {
        type: Date,
        default: Date.now
    }
});
const User = mongoose.model('User', userSchema);
module.exports = User;