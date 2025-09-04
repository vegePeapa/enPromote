const axios = require('axios');

async function testWordAPI() {
    console.log('测试单词API...');
    
    try {
        // 测试新的getWordInfo路由
        console.log('测试 /word/getWordInfo 路由...');
        const response = await axios.get('http://localhost:3000/word/getWordInfo', {
            params: { word: 'hello' },
            timeout: 20000
        });
        
        console.log('响应状态:', response.status);
        console.log('响应数据:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('测试失败:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
    
    try {
        // 测试原有的getwordinfo路由
        console.log('\n测试 /word/getwordinfo 路由...');
        const response = await axios.get('http://localhost:3000/word/getwordinfo', {
            params: { word: 'hello' },
            timeout: 20000
        });
        
        console.log('响应状态:', response.status);
        console.log('响应数据:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('测试失败:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
}

testWordAPI();
