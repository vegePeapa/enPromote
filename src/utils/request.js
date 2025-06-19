import axios from 'axios';
const request = axios.create({
    baseURL: '/api', // 所有请求自动添加/api前缀
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json;charset=utf-8',
    },
});
// 请求拦截器
request.interceptors.request.use(config => {
    return config;
}, error => {
    return Promise.reject(error);
});
// 响应拦截器
request.interceptors.response.use(response => {
    return response;
}, error => {
    return Promise.reject(error);
});

export default request;