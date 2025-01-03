class ContractAnalysis {
    constructor() {
        this.supportedFormats = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.baiduOCR = {
            apiKey: 'WjsLulf3hGo599Y0iOwq6lN9',
            secretKey: 'tKHq26J52hMnVrIw6pYdXooLf2q4Q4Sb',
            accessToken: null,
            tokenExpireTime: 0
        };
        this.currentFile = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 文件拖放区域
        const dropArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        // 点击上传区域时触发文件选择
        dropArea.addEventListener('click', () => {
            fileInput.click();
        });

        // 拖拽相关事件
        dropArea.addEventListener('dragover', this.handleDragOver.bind(this));
        dropArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        dropArea.addEventListener('drop', this.handleDrop.bind(this));
        
        // 文件选择变化事件
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // 分析按钮
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.analyzeContract());
        }

        // 添加导出按钮事件监听
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReport());
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.validateAndProcessFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.validateAndProcessFile(files[0]);
        }
    }

    validateFile(file) {
        // 检查文件大小
        if (file.size > this.maxFileSize) {
            alert('文件大小不能超过10MB');
            return false;
        }

        // 检查文件类型
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (!this.supportedFormats.includes(extension)) {
            alert('不支持的文件格式');
            return false;
        }

        // 保存当前文件
        this.currentFile = file;
        return true;
    }

    validateAndProcessFile(file) {
        // 验证文件
        if (!this.validateFile(file)) {
            return;
        }

        // 更新UI显示已上传文件
        this.updateFileDisplay(file);

        // 启用分析按钮
        document.getElementById('analyzeBtn').disabled = false;
    }

    updateFileDisplay(file) {
        const uploadArea = document.getElementById('uploadArea');
        const defaultView = uploadArea.querySelector('.upload-default');
        const fileInfo = uploadArea.querySelector('.file-info');
        const fileName = fileInfo.querySelector('.file-name');
        const fileSize = fileInfo.querySelector('.file-size');

        // 更新文件信息
        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);

        // 切换显示
        defaultView.style.display = 'none';
        fileInfo.style.display = 'flex';
        uploadArea.classList.add('has-file');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeFile() {
        this.currentFile = null;
        document.getElementById('analyzeBtn').disabled = true;
        document.getElementById('uploadArea').innerHTML = this.getDefaultUploadUI();
    }

    getDefaultUploadUI() {
        return `
            <svg class="upload-icon" width="48" height="48" viewBox="0 0 24 24">
                <path d="M19 13h-4v4h-2v-4H9v-2h4V7h2v4h4v2zm-7-9C6.48 4 2 8.48 2 14s4.48 10 10 10 10-4.48 10-10S17.52 4 12 4z" fill="currentColor"/>
            </svg>
            <h3>拖放文件到这里</h3>
            <p>或点击上传</p>
            <div class="supported-formats">
                支持的格式：PDF、Word、图片
            </div>
        `;
    }

    async analyzeContract() {
        if (!this.currentFile) {
            alert('请先上传文件');
            return;
        }

        try {
            // 这里添加文件处理和分析逻辑
            // 模拟分析结果
            const result = {
                riskLevel: '中等风险',
                riskPoints: '1. 付款条件不够明确\n2. 违约责任条款不完整\n3. 合同终止条件模糊',
                suggestions: '1. 明确约定付款时间和条件\n2. 完善违约责任条款\n3. 详细规定合同终止的具体情形',
                compliance: '1. 基本条款齐全\n2. 主体资格合规\n3. 需要补充部分强制性条款'
            };

            // 更新显示结果
            this.updateAnalysisResult(result);
        } catch (error) {
            console.error('分析失败:', error);
            alert('分析失败，请重试');
        }
    }

    async extractText(file) {
        // 根据文件类型调用不同的文本提取方法
        const type = file.type.toLowerCase();
        
        if (type.includes('pdf')) {
            return await this.extractPDFText(file);
        } else if (type.includes('word') || type.includes('document')) {
            return await this.extractWordText(file);
        } else if (type.includes('image')) {
            return await this.performOCR(file);
        } else if (type.includes('text')) {
            return await this.readTextFile(file);
        }
        
        throw new Error('不支持的文件格式');
    }

    async extractPDFText(file) {
        // 使用 pdf.js 提取文本
        const pdfjsLib = window.pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let text = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map(item => item.str).join(' ') + '\n';
            }

            return text;
        } catch (error) {
            console.error('PDF文本提取错误:', error);
            throw new Error('PDF文件读取失败');
        }
    }

    async extractWordText(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        } catch (error) {
            console.error('Word文本提取错误:', error);
            throw new Error('Word文件读取失败');
        }
    }

    async getBaiduAccessToken() {
        // 如果 token 还在有效期内，直接返回
        if (this.baiduOCR.accessToken && Date.now() < this.baiduOCR.tokenExpireTime) {
            return this.baiduOCR.accessToken;
        }

        try {
            const response = await fetch(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.baiduOCR.apiKey}&client_secret=${this.baiduOCR.secretKey}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('获取百度 access token 失败');
            }

            const data = await response.json();
            this.baiduOCR.accessToken = data.access_token;
            // token 有效期为30天，这里设置为29天以确保安全
            this.baiduOCR.tokenExpireTime = Date.now() + 29 * 24 * 60 * 60 * 1000;
            return data.access_token;
        } catch (error) {
            console.error('获取百度 access token 错误:', error);
            throw new Error('OCR 服务初始化失败');
        }
    }

    async performOCR(file) {
        try {
            // 1. 获取 access token
            const accessToken = await this.getBaiduAccessToken();

            // 2. 将文件转换为 base64
            const base64 = await this.fileToBase64(file);
            const imageData = base64.split(',')[1]; // 移除 data:image/jpeg;base64, 前缀

            // 3. 调用百度 OCR API
            const response = await fetch(`https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `image=${encodeURIComponent(imageData)}`
            });

            if (!response.ok) {
                throw new Error('OCR 识别请求失败');
            }

            const data = await response.json();
            
            // 4. 处理识别结果
            if (data.error_code) {
                throw new Error(`OCR 识别错误: ${data.error_msg}`);
            }

            // 5. 将识别结果组合成文本
            const text = data.words_result
                .map(item => item.words)
                .join('\n');

            console.log('OCR 识别结果:', text);
            return text;

        } catch (error) {
            console.error('OCR 识别错误:', error);
            throw new Error('图片文字识别失败，请重试');
        }
    }

    // 将文件转换为 base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    async readTextFile(file) {
        try {
            return await file.text();
        } catch (error) {
            console.error('文本文件读取错误:', error);
            throw new Error('文本文件读取失败');
        }
    }

    async performAnalysis(text) {
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
                            content: `你是一位专业的法律顾问，请对提供的合同文本进行全面的风险分析。请按以下格式输出：

1. 风险等级评估
- 总体风险等级：（高/中/低）
- 风险评估摘要：用一段话描述整体风险状况

2. 主要风险点分析
针对每个风险点，请详细说明：
- 风险点标题
- 风险程度（严重/警告/提示）
- 具体问题描述
- 相关法律依据

3. 改进建议
针对每个风险点提供具体的改进建议，包括：
- 修改建议
- 补充条款建议
- 其他注意事项

4. 合规性检查
列出主要合规性检查项目：
- 合同主体合法性
- 合同条款完整性
- 权利义务对等性
- 违约责任明确性
- 争议解决机制

请用清晰、专业的语言描述，避免使用过于技术性的术语，确保普通人也能理解。`
                        },
                        {
                            role: "user",
                            content: text
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 4000
                })
            });

            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }

            const data = await response.json();
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('API返回数据格式错误');
            }

            // 解析返回的文本内容
            const analysisText = data.choices[0].message.content;
            
            // 将文本转换为结构化数据
            const analysis = this.parseAnalysisText(analysisText);
            return analysis;

        } catch (error) {
            console.error('合同分析错误:', error);
            throw new Error(`合同分析失败: ${error.message}`);
        }
    }

    // 新增：解析分析文本
    parseAnalysisText(text) {
        try {
            // 提取风险等级
            const riskLevelMatch = text.match(/总体风险等级：(高|中|低)/);
            const riskLevel = riskLevelMatch ? riskLevelMatch[1] === '高' ? 'high' : 
                                         riskLevelMatch[1] === '中' ? 'medium' : 'low'
                                         : 'medium';

            // 提取风险评估摘要
            const summaryMatch = text.match(/风险评估摘要：([\s\S]*?)(?=\n\d|$)/);
            const riskSummary = summaryMatch ? summaryMatch[1].trim() : '';

            // 提取风险点
            const riskPointsSection = text.match(/2\. 主要风险点分析([\s\S]*?)(?=3\. |$)/);
            const riskPoints = [];
            if (riskPointsSection) {
                const points = riskPointsSection[1].split(/(?=风险点标题)/);
                points.forEach(point => {
                    if (point.trim()) {
                        const titleMatch = point.match(/风险点标题[：:](.*?)(?=\n|$)/);
                        const severityMatch = point.match(/风险程度[：:](.*?)(?=\n|$)/);
                        const descriptionMatch = point.match(/具体问题描述[：:]([\s\S]*?)(?=相关法律依据|$)/);
                        const referenceMatch = point.match(/相关法律依据[：:]([\s\S]*?)(?=\n\n|$)/);

                        if (titleMatch) {
                            riskPoints.push({
                                title: titleMatch[1].trim(),
                                severity: this.mapSeverity(severityMatch ? severityMatch[1].trim() : ''),
                                description: descriptionMatch ? descriptionMatch[1].trim() : '',
                                reference: referenceMatch ? referenceMatch[1].trim() : ''
                            });
                        }
                    }
                });
            }

            // 提取建议
            const suggestionsSection = text.match(/3\. 改进建议([\s\S]*?)(?=4\. |$)/);
            const suggestions = [];
            if (suggestionsSection) {
                const suggestionPoints = suggestionsSection[1].split(/(?=-)/);
                suggestionPoints.forEach(point => {
                    const trimmedPoint = point.trim();
                    // 过滤掉只包含标点符号和空白字符的行
                    if (trimmedPoint && !/^[\s\p{P}]*$/u.test(trimmedPoint)) {
                        suggestions.push({
                            title: '改进建议',
                            description: trimmedPoint.replace(/^- /, '')
                                .split('\n')
                                // 过滤掉空行和只包含标点符号的行
                                .filter(line => {
                                    const trimmedLine = line.trim();
                                    return trimmedLine && !/^[\s\p{P}]*$/u.test(trimmedLine);
                                })
                                .join('\n')
                        });
                    }
                });
            }

            // 提取合规性检查
            const complianceSection = text.match(/4\. 合规性检查([\s\S]*?)$/);
            const compliance = [];
            if (complianceSection) {
                const compliancePoints = complianceSection[1].split(/(?=-)/);
                compliancePoints.forEach(point => {
                    const trimmedPoint = point.trim();
                    if (trimmedPoint) {
                        const [aspect, ...descriptionParts] = trimmedPoint.replace(/^- /, '').split('：');
                        const description = descriptionParts.join('：').trim();
                        if (aspect) {
                            compliance.push({
                                aspect: aspect.trim(),
                                status: description.includes('不符合') ? 'fail' : 'pass',
                                description: description || '需要进一步审查'
                            });
                        }
                    }
                });
            }

            return {
                riskLevel,
                riskSummary,
                riskPoints,
                suggestions,
                compliance
            };
        } catch (error) {
            console.error('解析分析文本错误:', error);
            return {
                riskLevel: 'medium',
                riskSummary: '合同分析结果解析出现问题，建议人工复核',
                riskPoints: [{
                    title: '解析错误',
                    severity: 'warning',
                    description: '无法正确解析AI返回的分析结果，请查看原始分析文本',
                    reference: '建议进行人工审查'
                }],
                suggestions: [{
                    title: '建议',
                    description: '请仔细阅读原始分析文本并进行人工复核'
                }],
                compliance: [{
                    aspect: '解析状态',
                    status: 'fail',
                    description: '需要人工复核'
                }]
            };
        }
    }

    mapSeverity(severity) {
        const severityMap = {
            '严重': 'critical',
            '警告': 'warning',
            '提示': 'notice'
        };
        return severityMap[severity] || 'notice';
    }

    showLoading() {
        const resultDiv = document.getElementById('analysisResult');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>正在分析合同内容，请稍候...</p>
            </div>
        `;
    }

    showAnalysisResult(analysis) {
        const resultDiv = document.getElementById('analysisResult');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div class="analysis-report">
                <div class="report-header">
                    <h2>合同风险分析报告</h2>
                    <button class="export-btn" onclick="contractAnalysis.exportReport()">
                        <svg width="16" height="16" viewBox="0 0 24 24">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
                        </svg>
                        导出报告
                    </button>
                </div>

                <div class="report-content">
                    <!-- 风险等级评估 -->
                    <div class="section">
                        <h3>风险等级评估</h3>
                        <div class="risk-level">
                            <div class="risk-level-text">
                                <p>风险等级：<strong>${this.getRiskLevelText(analysis.riskLevel)}</strong></p>
                                <p>${analysis.riskSummary}</p>
                            </div>
                        </div>
                    </div>

                    <!-- 主要风险点 -->
                    <div class="section">
                        <h3>主要风险点</h3>
                        <div class="risk-list">
                            ${analysis.riskPoints.map(point => `
                                <div class="risk-item">
                                    <div class="risk-item-header">
                                        <h4>${point.title}</h4>
                                        <span class="severity-badge">${this.getSeverityText(point.severity)}</span>
                                    </div>
                                    <p>${point.description}</p>
                                    ${point.reference ? `<div class="risk-item-reference">法律依据：${point.reference}</div>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- 改进建议 -->
                    <div class="section">
                        <h3>改进建议</h3>
                        <div class="suggestion-list">
                            ${analysis.suggestions.map((suggestion, index) => `
                                <div class="suggestion-item">
                                    <div class="suggestion-number">${index + 1}.</div>
                                    <div class="suggestion-content">
                                        <p>${suggestion.description}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- 合规性检查 -->
                    <div class="section">
                        <h3>合规性检查</h3>
                        <div class="compliance-list">
                            ${analysis.compliance.map(item => `
                                <div class="compliance-item">
                                    <div class="compliance-content">
                                        <h4>${item.aspect}</h4>
                                        <p>${item.description}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 辅助方法
    getRiskLevelClass(level) {
        const classes = {
            high: 'high-risk',
            medium: 'medium-risk',
            low: 'low-risk'
        };
        return classes[level] || 'unknown-risk';
    }

    getRiskLevelText(level) {
        const texts = {
            high: '高风险',
            medium: '中等风险',
            low: '低风险'
        };
        return texts[level] || '未知风险';
    }

    getSeverityText(severity) {
        const texts = {
            critical: '严重',
            warning: '警告',
            notice: '提示'
        };
        return texts[severity] || '未知';
    }

    getRiskLevelIcon(level) {
        const icons = {
            high: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>',
            medium: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>',
            low: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>'
        };
        return icons[level] || icons.medium;
    }

    getComplianceIcon(status) {
        return status === 'pass' 
            ? '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/></svg>'
            : '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/></svg>';
    }

    showError(message) {
        const resultDiv = document.getElementById('analysisResult');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div class="error-message">
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
                </svg>
                <div class="error-content">
                    <h4>分析失败</h4>
                    <p>${message}</p>
                    <button class="retry-btn" onclick="contractAnalysis.analyzeContract()">重试</button>
                </div>
            </div>
        `;
    }

    async exportReport() {
        try {
            if (!this.currentResult) {
                throw new Error('没有可导出的分析结果');
            }

            // 创建报告内容
            const reportContent = this.generateReportContent();
            
            // 创建Blob对象
            const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
            
            // 创建下载链接
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `合同分析报告_${new Date().toLocaleDateString()}.txt`;
            
            // 触发下载
            document.body.appendChild(link);
            link.click();
            
            // 清理
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('导出报告失败:', error);
            alert('报告导出失败，请重试');
        }
    }

    // 生成报告内容
    generateReportContent() {
        const result = this.currentResult;
        return `合同分析报告
生成时间：${new Date().toLocaleString()}

一、风险等级评估
${formatAnalysisResult(result.riskLevel)}

二、主要风险点
${formatAnalysisResult(result.riskPoints)}

三、改进建议
${formatAnalysisResult(result.suggestions)}

四、合规性检查
${formatAnalysisResult(result.compliance)}

----------------------------------------
由法槌槌智能合同分析系统生成
© ${new Date().getFullYear()} 法槌槌. All rights reserved.`;
    }

    // 更新分析结果时保存当前结果
    updateAnalysisResult(result) {
        this.currentResult = result;
        
        // 风险等级显示
        const riskLevelEl = document.getElementById('riskLevel');
        riskLevelEl.innerHTML = `<span class="risk-level medium">${formatAnalysisResult(result.riskLevel)}</span>`;
        
        // 其他内容显示
        document.getElementById('riskPoints').textContent = formatAnalysisResult(result.riskPoints);
        document.getElementById('suggestions').textContent = formatAnalysisResult(result.suggestions);
        document.getElementById('compliance').textContent = formatAnalysisResult(result.compliance);
        
        document.getElementById('analysisResult').style.display = 'block';
    }

    // 重置上传区域
    resetUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const defaultView = uploadArea.querySelector('.upload-default');
        const fileInfo = uploadArea.querySelector('.file-info');

        // 重置显示
        defaultView.style.display = 'flex';
        fileInfo.style.display = 'none';
        uploadArea.classList.remove('has-file');

        // 重置文件输入
        document.getElementById('fileInput').value = '';
        this.currentFile = null;
        document.getElementById('analyzeBtn').disabled = true;
    }
}

// 初始化
let contractAnalysis;
document.addEventListener('DOMContentLoaded', () => {
    contractAnalysis = new ContractAnalysis();
});

// 在分析完成后处理markdown格式
function formatAnalysisResult(markdown) {
    // 移除markdown标记
    let text = markdown
        .replace(/#{1,6}\s?/g, '') // 移除标题标记
        .replace(/\*\*/g, '')      // 移除加粗标记
        .replace(/\*/g, '')        // 移除斜体标记
        .replace(/`/g, '')         // 移除代码标记
        .replace(/>/g, '')         // 移除引用标记
        .replace(/\n\s*\n/g, '\n') // 将多个空行替换为单个换行
        .trim();

    return text;
}

// 更新显示结果的函数
function updateAnalysisResult(result) {
    document.getElementById('riskLevel').textContent = formatAnalysisResult(result.riskLevel);
    document.getElementById('riskPoints').textContent = formatAnalysisResult(result.riskPoints);
    document.getElementById('suggestions').textContent = formatAnalysisResult(result.suggestions);
    document.getElementById('compliance').textContent = formatAnalysisResult(result.compliance);
    
    document.getElementById('analysisResult').style.display = 'block';
} 