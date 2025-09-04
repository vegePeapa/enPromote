// Please install OpenAI SDK first: `npm install openai`

const OpenAI = require("openai");

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: 'sk-2746233e02eb46ada9fe884e8d5678aa'
});

async function main() {
    const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: "You are a helpful assistant." }],
        model: "deepseek-chat",
    });

    console.log(completion.choices[0].message.content);
}

main();