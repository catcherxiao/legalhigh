class AIChat {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendButton');
        
        // 添加聊天历史记录数组
        this.messageHistory = [
            {
                role: "system",
                content: "你是一位专业的中国法律顾问，熟悉中国现行法律法规。请基于准确的法律依据，为用户提供专业的法律建议。回答要简明扼要，并在必要时引用相关法条。"
            }
        ];
        
        this.setupEventListeners();
        this.setupMarked();
    }

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 添加清除按钮事件监听
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('确定要清除所有对话记录吗？')) {
                    this.clearHistory();
                }
            });
        }
    }

    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;

        // 添加用户消息到界面
        this.addMessage(message, 'user');
        this.userInput.value = '';

        // 创建AI回复消息容器
        const aiMessageDiv = document.createElement('div');
        aiMessageDiv.className = 'message assistant';
        this.chatMessages.appendChild(aiMessageDiv);
        this.scrollToBottom();

        try {
            // 调用流式API
            await this.streamResponse(message, aiMessageDiv);
        } catch (error) {
            aiMessageDiv.textContent = '抱歉，服务出现了问题，请稍后再试。';
            console.error('API调用错误:', error);
        }
    }

    async streamResponse(message, messageDiv) {
        const API_KEY = 'sk-2fb50bb5208a43bb93cbadfb3febae60';
        const API_URL = 'https://api.deepseek.com/v1/chat/completions';
        
        try {
            // 添加用户消息到历史记录
            this.messageHistory.push({
                role: "user",
                content: message
            });

            // 打印当前的对话历史
            console.log('发送给 API 的完整对话历史：', JSON.stringify(this.messageHistory, null, 2));

            const requestBody = {
                model: "deepseek-chat",
                messages: this.messageHistory,
                temperature: 0.7,
                max_tokens: 2000,
                stream: true,
                presence_penalty: 0,
                frequency_penalty: 0
            };

            // 打印完整的请求内容
            console.log('API 请求内容：', JSON.stringify(requestBody, null, 2));

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API错误详情:', errorData);
                throw new Error(`API请求失败: ${response.status} - ${errorData.error?.message || '未知错误'}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let responseText = '';
            let buffer = '';
            let markdownBuffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    if (buffer) {
                        markdownBuffer += buffer;
                        messageDiv.innerHTML = this.formatResponse(markdownBuffer);
                    }
                    // 添加AI回复到历史记录
                    this.messageHistory.push({
                        role: "assistant",
                        content: markdownBuffer
                    });
                    // 打印完整的回复内容
                    console.log('AI 完整回复：', markdownBuffer);
                    messageDiv.classList.add('done');
                    break;
                }

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            if (line.includes('[DONE]')) continue;
                            
                            const data = JSON.parse(line.slice(6));
                            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                                const content = data.choices[0].delta.content;
                                responseText += content;
                                buffer += content;

                                // 当遇到段落结束符时更新UI
                                if (content.includes('\n') || 
                                    content.includes('。') || 
                                    content.includes('！') || 
                                    content.includes('？') ||
                                    content.includes('.') ||
                                    content.includes('!') ||
                                    content.includes('?')) {
                                    markdownBuffer += buffer;
                                    buffer = '';
                                    messageDiv.innerHTML = this.formatResponse(markdownBuffer);
                                    this.scrollToBottom();
                                }
                            }
                        } catch (e) {
                            if (!line.includes('[DONE]')) {
                                console.error('JSON解析错误:', e, line);
                            }
                        }
                    }
                }
            }

            // 打印更新后的对话历史长度
            console.log('当前对话历史长度：', this.messageHistory.length);
            
            // 限制历史记录长度，防止token超限
            if (this.messageHistory.length > 10) {
                console.log('对话历史超长，进行裁剪...');
                // 保留system消息和最近的4轮对话（8条消息）
                this.messageHistory = [
                    this.messageHistory[0],
                    ...this.messageHistory.slice(-8)
                ];
                console.log('裁剪后的对话历史长度：', this.messageHistory.length);
            }

        } catch (error) {
            console.error('流式API调用错误:', error);
            messageDiv.textContent = '抱歉，服务出现了问题，请稍后再试。';
            messageDiv.classList.add('error');
        }
    }

    setupMarked() {
        // 等待 marked 加载完成
        if (typeof marked === 'undefined') {
            setTimeout(() => this.setupMarked(), 100);
            return;
        }

        // 配置 marked 选项
        marked.use({
            mangle: false,
            headerIds: false,
            gfm: true,
            breaks: true
        });

        // 设置代码高亮
        const renderer = new marked.Renderer();
        renderer.code = (code, language) => {
            const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
            const highlightedCode = hljs.highlight(code, { language: validLanguage }).value;
            return `<pre><code class="hljs language-${validLanguage}">${highlightedCode}</code></pre>`;
        };
        
        marked.setOptions({ renderer });
    }

    formatResponse(text) {
        try {
            // 如果 marked 还没加载完成，先返回纯文本
            if (typeof marked === 'undefined') {
                return text;
            }

            // 处理法条引用的特殊格式
            text = text.replace(/《(.*?)》第(\d+)条[：:]([\s\S]*?)(?=\n\n|$)/g, (match, law, article, content) => {
                return `<div class="law-reference">
                    <div class="law-reference-title">《${law}》第${article}条</div>
                    <div class="law-reference-content">${content.trim()}</div>
                </div>`;
            });

            // 转换 Markdown
            return marked.parse(text);
        } catch (error) {
            console.error('Markdown 解析错误:', error);
            return text; // 发生错误时返回原始文本
        }
    }

    addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        if (type === 'assistant') {
            // 对 AI 回复使用 Markdown 渲染
            messageDiv.innerHTML = this.formatResponse(text);
            // 高亮代码块
            messageDiv.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightBlock(block);
            });
        } else {
            // 用户消息保持纯文本
            messageDiv.textContent = text;
        }
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addTypingAnimation() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant typing';
        typingDiv.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
        return typingDiv;
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    async callKimiAPI(message) {
        // 更新为 DeepSeek API
        const API_KEY = 'sk-2fb50bb5208a43bb93cbadfb3febae60';
        const API_URL = 'https://api.deepseek.com/v1/chat/completions';
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [
                        {
                            role: "system",
                            content: "你是一位专业的中国法律顾问，熟悉中国现行法律法规。请基于准确的法律依据，为用户提供专业的法律建议。回答要简明扼要，并在必要时引用相关法条。"
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }

            const data = await response.json();
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('API返回数据格式错误');
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('API调用错误:', error);
            throw new Error('AI服务暂时不可用，请稍后再试');
        }
    }

    // 添加清除历史记录的方法
    clearHistory() {
        this.messageHistory = [this.messageHistory[0]]; // 只保留system消息
        this.chatMessages.innerHTML = `
            <div class="message system">
                您好！我是AI法律助手，请问有什么法律问题需要咨询？
            </div>
        `;
    }
}

// 初始化聊天
document.addEventListener('DOMContentLoaded', () => {
    new AIChat();
}); 