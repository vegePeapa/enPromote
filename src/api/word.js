import request from '@/utils/request';

// 获取单词列表
function getWordList(params) {
    return request({
        url: '/word/getWordList',
        method: 'get',
        params
    });
}

// 更新单词学习进度
function updateWordProgress() {
    return request({
        url: '/word/updateWordProgress',
        method: 'post',
    });
}

function getWordInfo(params) {
    return request({
        url: '/word/getWordInfo',
        method: 'get',
        params
    })
}
// 获取用户单词进度
function getWordProgress() {
    return request.get('/word/getWordProgress');
}
export { getWordInfo, getWordProgress, updateWordProgress, getWordList };