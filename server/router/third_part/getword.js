const express = require('express');
const axios = require('axios');
const router = express.Router();
const fs = require('fs');
const path = require('path'); // 添加path模块
const { HttpsProxyAgent } = require('https-proxy-agent');
const { proxyurl, proxyProt } = require('../../config/serve');
const proxy = `http://${proxyurl}:${proxyProt}`;
const httpsAgent = new HttpsProxyAgent(proxy);
const Word = require('../../modules/Word');

// 缓存CET-4.json数据，避免重复读取
let cet4Cache = null;

// 按需加载CET-4.json中特定字母的单词
async function loadCet4WordsByInitial(initial) {
    try {
        const cet4Path = path.join(__dirname, '..', '..', 'vocabulary', 'CET-4.json');

        // 如果缓存为空，则初始化缓存
        if (!cet4Cache) {
            // 使用流式读取大文件
            const data = fs.readFileSync(cet4Path, 'utf8');
            cet4Cache = JSON.parse(data);
            console.log('CET-4.json 已加载到缓存');
        }

        // 返回特定首字母的单词
        return cet4Cache[initial] || [];
    } catch (error) {
        console.error('加载CET-4.json失败:', error);
        return [];
    }
}

async function getWordFromApi(word) {
    console.log(`正在查询单词: ${word}`);
    // 先从数据库中查询
    const wordInfo = await Word.findOne({ word: word.toLowerCase() });
    if (wordInfo) {
        console.log(`数据库中已存在该单词: ${word}直接返回`);
        return wordInfo;
    }
    // 如果数据库中没有，则从API中查询
    console.log(`数据库中没有该单词: ${word}，从API中查询`);
    try {
        // 使用axios和明确配置的代理
        const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, {
            httpsAgent: httpsAgent,
            timeout: 10000,
            proxy: false, // 禁用默认代理检测，使用httpsAgent
            validateStatus: function (status) {
                return status >= 200 && status < 500; // 接受所有非500错误状态码
            }
        });

        // 处理数据 - 合并多个定义
        if (Array.isArray(response.data) && response.data.length > 0) {
            // 初始化合并后的数据结构
            let mergedData = {
                word: word.toLowerCase(),
                phonetics: [],
                meanings: []
            };

            // 遍历所有返回的定义，合并数据
            for (const definition of response.data) {
                // 合并音标数据，避免重复
                if (definition.phonetics && definition.phonetics.length > 0) {
                    for (const phonetic of definition.phonetics) {
                        // 检查是否已存在相同的音频URL，避免重复
                        const exists = mergedData.phonetics.some(p =>
                            (p.audio && phonetic.audio && p.audio === phonetic.audio) ||
                            (p.text && phonetic.text && p.text === phonetic.text)
                        );

                        if (!exists) {
                            mergedData.phonetics.push({
                                text: phonetic.text || '',
                                audio: phonetic.audio || ''
                            });
                        }
                    }
                }

                // 合并词义数据
                if (definition.meanings && definition.meanings.length > 0) {
                    for (const meaning of definition.meanings) {
                        // 查找是否已有相同词性的数据
                        const existingMeaningIndex = mergedData.meanings.findIndex(
                            m => m.partOfSpeech === meaning.partOfSpeech
                        );

                        if (existingMeaningIndex >= 0) {
                            // 如果已有相同词性，则合并definitions
                            for (const def of meaning.definitions) {
                                mergedData.meanings[existingMeaningIndex].definitions.push({
                                    definition: def.definition || '',
                                    example: def.example || ''
                                });
                            }
                        } else {
                            // 如果没有相同词性，添加新的meaning
                            const newMeaning = {
                                partOfSpeech: meaning.partOfSpeech,
                                definitions: meaning.definitions.map(def => ({
                                    definition: def.definition || '',
                                    example: def.example || ''
                                }))
                            };
                            mergedData.meanings.push(newMeaning);
                        }
                    }
                }
            }

            // 添加等级和来源信息
            mergedData.level = 'unknown'; // 可以根据需要设置
            mergedData.source = 'dictionaryapi.dev';

            // 添加中文释义
            try {
                const initial = word.slice(0, 1).toUpperCase();
                const cet4Words = await loadCet4WordsByInitial(initial);

                // 查找匹配的单词
                const matchedWord = cet4Words.find(item =>
                    typeof item === 'object' &&
                    item.word &&
                    item.word.toLowerCase() === word.toLowerCase()
                );

                if (matchedWord && matchedWord.mean) {
                    mergedData.chineseMeaning = matchedWord.mean;
                    console.log(`找到单词 ${word} 的中文释义: ${matchedWord.mean}`);
                } else {
                    console.log(`未找到单词 ${word} 的中文释义`);
                }
            } catch (error) {
                console.error('获取中文释义失败:', error);
            }

            // 创建并保存新的单词数据
            const wordDocument = new Word(mergedData);
            await wordDocument.save();
            console.log(`单词${word}数据已保存到数据库`);

            return wordDocument;
        }

        throw new Error('API返回数据格式不正确');

    } catch (error) {
        console.error('详细错误信息:', error.message);

        if (error.response) {
            // 服务器响应了，但状态码不是2xx
            console.error('状态码:', error.response.status);
            console.error('响应数据:', error.response.data);
        } else if (error.request) {
            // 请求已发送但没有收到响应
            console.error('没有收到响应，可能是代理连接问题');
            console.error('请求详情:', error.request._header);
        } else {
            // 设置请求时发生的错误
            console.error('请求设置错误:', error.message);
        }

        // 创建一个模拟响应，用于开发
        console.log('使用本地模拟数据作为后备方案');
        if (word.toLowerCase() === 'hello') {
            return getMockData('hello');
        }

        throw error; // 继续抛出错误以便上层处理
    }
}

router.get('/getwordinfo', async (req, res) => {
    const word = req.query.word;
    if (!word) {
        return res.json({ code: 400, message: '请输入单词' });
    }
    try {
        const data = await getWordFromApi(word);
        res.send(data);
    } catch (err) {
        console.error('API错误:', err.message);
        res.json({
            code: 500,
            message: '获取单词信息失败',
            error: err.message,
            suggestion: '请检查网络连接或代理设置'
        });
    }
});
// 提供一个模拟数据，当API调用失败时使用
function getMockData(word) {
    if (word.toLowerCase() === 'hello') {
        return [
            {
                "word": "hello",
                "phonetics": [
                    {
                        "audio": "https://api.dictionaryapi.dev/media/pronunciations/en/hello-au.mp3",
                        "sourceUrl": "https://commons.wikimedia.org/w/index.php?curid=75797336",
                        "license": {
                            "name": "BY-SA 4.0",
                            "url": "https://creativecommons.org/licenses/by-sa/4.0"
                        }
                    },
                    {
                        "text": "/həˈləʊ/",
                        "audio": "https://api.dictionaryapi.dev/media/pronunciations/en/hello-uk.mp3"
                    }
                ],
                "meanings": [
                    {
                        "partOfSpeech": "noun",
                        "definitions": [
                            {
                                "definition": "\"Hello!\" or an equivalent greeting.",
                                "synonyms": [],
                                "antonyms": []
                            }
                        ],
                        "synonyms": ["greeting"],
                        "antonyms": []
                    },
                    {
                        "partOfSpeech": "interjection",
                        "definitions": [
                            {
                                "definition": "A greeting said when meeting someone or acknowledging someone's arrival.",
                                "synonyms": [],
                                "antonyms": [],
                                "example": "Hello, everyone."
                            }
                        ],
                        "synonyms": [],
                        "antonyms": ["goodbye"]
                    }
                ]
            }
        ];
    }
    return { "error": "Word not found in mock data", "fallback": true };
}


module.exports = { router, getWordFromApi };