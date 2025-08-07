const mongoose = require('mongoose');
let wordSchema = new mongoose.Schema({
    word: {
        type: String,
        required: true,
    },
    // 音标
    phonetics: [
        {
            text: String,
            audio: String
        }
    ],
    // 中文释义
    chineseMeaning: String,
    // 词义
    meanings: [
        {
            partOfSpeech: String,
            definitions: [
                {
                    definition: String,
                    example: String
                }
            ]
        }
    ],
    // 等级
    level: {
        type: String,
    },
    // 来源
    source: {
        type: String,
    },
    // 创建时间
    createTime: {
        type: Date,
        default: Date.now
    }
});
const Word = mongoose.model('Word', wordSchema);
module.exports = Word;