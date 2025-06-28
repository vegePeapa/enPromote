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
    // 401在后端设置的是未登录的错误码
    if (error.response.status === 401) {
        alert('请先登录')
        // 跳转到登录页面
        window.location.href = error.response.data.redirect;
    }
    return Promise.reject(error);
});

export default request;