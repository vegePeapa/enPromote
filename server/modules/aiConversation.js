const mongoose = require('mongoose');
let conversationSchema = new mongoose.Schema({
    userid: {
        type: String,
        required: true,
    },
    message: [{
        role: String,
        content: String
    }],
    createTime: {
        type: Date,
        default: Date.now
    }
})
const Conver = mongoose.model('conversation', conversationSchema);
module.exports = Conver;