import request from '@/utils/request';

interface ApiResponse<T = any> {
    data: {
        code: number;
        message: string;
    } & T;
}

function getHistoryMessages(): Promise<ApiResponse> {
    return request.get('/aiApi/history_messages');
}

function restartConversation(): Promise<ApiResponse> {
    return request.post('/aiApi/restartConversation');
}

export { getHistoryMessages, restartConversation };
