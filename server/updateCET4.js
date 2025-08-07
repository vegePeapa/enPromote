const fs = require('fs');
const path = require('path');

// 文件路径
const cet4Path = path.join(__dirname, 'vocabulary', 'CET-4.json');
const jsonFolderPath = path.join(__dirname, 'vocabulary', 'JSON');

// 读取CET-4.json文件
const cet4Data = JSON.parse(fs.readFileSync(cet4Path, 'utf-8'));

// 创建新的CET-4数据结构
const newCET4Data = {};

// 处理每个字母
async function processLetters() {
    // 获取所有字母文件
    const letters = Object.keys(cet4Data);

    for (const letter of letters) {
        console.log(`处理字母 ${letter}...`);

        // 读取对应的JSON文件
        const jsonFilePath = path.join(jsonFolderPath, `${letter}.json`);

        try {
            if (fs.existsSync(jsonFilePath)) {
                const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

                // 创建单词映射，方便查找
                const wordMap = {};
                jsonData.forEach(item => {
                    wordMap[item.word.trim()] = item;
                });

                // 更新CET-4中的单词
                newCET4Data[letter] = cet4Data[letter].map(word => {
                    const wordInfo = wordMap[word];
                    if (wordInfo) {
                        return {
                            word: word,
                            mean: wordInfo.mean || '',
                            phonetic_symbol: wordInfo.phonetic_symbol || '',
                            initial: letter
                        };
                    } else {
                        // 如果在JSON中找不到单词信息，保留原始单词
                        return {
                            word: word,
                            mean: '',
                            phonetic_symbol: '',
                            initial: letter
                        };
                    }
                });
            } else {
                console.log(`警告: 字母 ${letter} 的JSON文件不存在，保留原始单词列表`);
                newCET4Data[letter] = cet4Data[letter].map(word => ({
                    word: word,
                    mean: '',
                    phonetic_symbol: '',
                    initial: letter
                }));
            }
        } catch (error) {
            console.error(`处理字母 ${letter} 时出错:`, error);
            // 出错时保留原始单词列表
            newCET4Data[letter] = cet4Data[letter].map(word => ({
                word: word,
                mean: '',
                phonetic_symbol: '',
                initial: letter
            }));
        }
    }

    // 保存更新后的CET-4.json文件
    fs.writeFileSync(cet4Path, JSON.stringify(newCET4Data, null, 2), 'utf-8');
    console.log('CET-4.json 文件已更新完成!');
}

// 执行更新
processLetters().catch(err => {
    console.error('更新过程中出错:', err);
}); 