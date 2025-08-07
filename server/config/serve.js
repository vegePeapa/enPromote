// 配置服务器
const port = 3000;
const host = 'localhost';
// 配置数据库
const dbUrl = 'mongodb://localhost:27017/EnglishPro';
//访问外网代理代理
const proxyurl = '127.0.0.1';
const proxyProt = 7897;

module.exports = { port, host, dbUrl, proxyurl, proxyProt };