import request from '@/utils/request';

function login(data) {
    return request.post('/auth/login', data);
}
function register(data) {
    return request.post('/auth/register', data);
}
function logout() {
    return request.post('/auth/logout');
}
function getUserInfo() {
    return request.get('/auth/info');
}
function changeInfo(data) {
    return request.post('/auth/changeinfo', data);
}

export { login, register, logout, getUserInfo, changeInfo };