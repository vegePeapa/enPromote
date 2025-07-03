import request from '@/utils/request';

// 获取单词列表
export function getWordList(params) {
    return request({
        url: '/word/getWordList',
        method: 'get',
        params
    });
}

// 更新单词学习进度
export function updateWordProgress(data) {
    return request({
        url: '/word/updateWordProgress',
        method: 'post',
        data
    });
}

function getWordInfo(data) {
    return request.get('/word/getWordInfo', data);
}
// 获取用户单词进度
function getWordProgress() {
    return request.get('/word/getWordProgress');
}
export { getWordInfo, getWordProgress };