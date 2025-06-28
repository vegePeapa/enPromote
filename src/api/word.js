import request from '@/utils/request';
function getWordInfo(data) {
    return request.get('/word/getWordInfo', data);
}
// 获取用户单词进度
function getWordProgress() {
    return request.get('/word/getWordProgress');
}
// 更新用户单词进度
function updateWordProgress(data) {
    return request.post('/word/updateWordProgress', data);
}
export { getWordInfo, getWordProgress, updateWordProgress };