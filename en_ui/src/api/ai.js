import request from '@/utils/request';


function getHistoryMessages() {
    return request.get('/aiApi/history_messages');
}

export { getHistoryMessages };