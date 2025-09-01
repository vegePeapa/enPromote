import request from '@/utils/request';


function getHistoryMessages() {
    return request.get('/aiApi/history_messages');
}
function restartConversation() {
    return request.post('/aiApi/restartConversation');
}
export { getHistoryMessages, restartConversation };