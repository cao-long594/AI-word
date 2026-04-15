/**
 * 灵犀 AI 对话助手 - 主应用
 * 处理 UI 交互、消息传递和主题管理
 */

class LingXiApp {
    constructor() {
        
        this.welcomeSection = document.getElementById('welcomeSection');
        this.chatSection = document.getElementById('chatSection');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.scrollContainer = this.chatSection;

        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.themeToggle = document.getElementById('themeToggle');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.imageInput = document.getElementById('imageInput');
        this.imagePreviewArea = document.getElementById('imagePreviewArea');
        this.toast = document.getElementById('toast');

        this.isStreaming = false;
        this.uploadedImages = [];
        this.messages = [];
        this.darkMode = false;
        this.shouldAutoScroll = true;
        this.bottomThreshold = 40;

        this.init();
    }

    /**
     * 初始化应用
     */
    init() {
        this.loadTheme();
        this.loadChatHistory();
        this.setupEventListeners();
        
        // 初始化 API
        bailianAPI.initializeAPI();
        
        // 检查 API Key 是否存在，若不存在则提示用户
        if (!bailianAPI.isAPIKeyValid()) {
            console.info(
                '💡 设置 API Key 说明:\n' +
                '1. 打开浏览器控制台 (F12 或 Ctrl+Shift+I)\n' +
                '2. 在控制台中执行: localStorage.setItem("LINGXI_API_KEY", "your-api-key")\n' +
                '3. 刷新页面后即可开始使用'
            );
        }

        // 自动调整文本框高度
        this.messageInput.addEventListener('input', () => this.autoResizeTextarea());
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 主题切换
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // 发送按钮
        this.sendBtn.addEventListener('click', () => this.handleSendMessage());

        // 停止按钮
        this.stopBtn.addEventListener('click', () => this.handleStopGeneration());

        // 清空按钮
        this.clearBtn.addEventListener('click', () => this.handleClearChat());

        // 上传按钮
        this.uploadBtn.addEventListener('click', () => this.imageInput.click());
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));

        // 消息输入键盘处理
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // 建议卡片
        document.querySelectorAll('.suggestion-card').forEach(card => {
            card.addEventListener('click', () => {
                const suggestion = card.dataset.suggestion;
                this.messageInput.value = suggestion;
                this.autoResizeTextarea();
                this.messageInput.focus();
                this.showChatInterface();
                setTimeout(() => this.handleSendMessage(), 100);
            });
        });

        // 图片拖放
        this.messagesContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        this.messagesContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDroppedFiles(e.dataTransfer.files);
        });

        document.addEventListener('dragover', (e) => {
            if (e.dataTransfer.types.includes('Files')) {
                e.preventDefault();
            }
        });

        // 聊天区域滚动监听 - 判断是否在底部附近并维护自动滚动状态
        this.scrollContainer.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = this.scrollContainer;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
            const isNearBottom = distanceFromBottom <= this.bottomThreshold;

            this.shouldAutoScroll = isNearBottom;

            const backToBottomBtn = document.getElementById('backToBottomBtn');
            if (backToBottomBtn) {
                backToBottomBtn.style.display = isNearBottom ? 'none' : 'flex';
            }
        });

        const backToBottomBtn = document.getElementById('backToBottomBtn');
        if (backToBottomBtn) {
            backToBottomBtn.addEventListener('click', () => {
                this.shouldAutoScroll = true;
                this.scrollToBottom();
                backToBottomBtn.style.display = 'none';
            });
        }
    }

    autoScroll() {
        if (!this.shouldAutoScroll) return;

        requestAnimationFrame(() => {
            this.scrollContainer.scrollTo({
                top: this.scrollContainer.scrollHeight,
                behavior: 'smooth'
            });
        });
    }

    scrollToBottom() {
        this.scrollContainer.scrollTo({
            top: this.scrollContainer.scrollHeight,
            behavior: 'smooth'
        });
    }

    /**
     * 切换浅色和深色主题
     */
    toggleTheme() {
        this.darkMode = !this.darkMode;
        document.body.classList.toggle('dark-mode', this.darkMode);
        localStorage.setItem('LINGXI_THEME', this.darkMode ? 'dark' : 'light');
    }

    /**
     * 从 localStorage 加载主题偏好
     */
    loadTheme() {
        const savedTheme = localStorage.getItem('LINGXI_THEME');
        if (savedTheme === 'dark') {
            this.darkMode = true;
            document.body.classList.add('dark-mode');
        }
    }

    /**
     * 从 localStorage 加载聊天历史
     */
    loadChatHistory() {
        const savedMessages = localStorage.getItem('LINGXI_CHAT_HISTORY');
        if (savedMessages) {
            try {
                this.messages = JSON.parse(savedMessages);
            } catch (e) {
                console.error('Failed to load chat history:', e);
                this.messages = [];
            }
        }
    }

    /**
     * 保存聊天历史到 localStorage
     */
    saveChatHistory() {
        localStorage.setItem('LINGXI_CHAT_HISTORY', JSON.stringify(this.messages));
    }

    /**
     * 显示聊天界面（隐藏欢迎区域）
     */
    showChatInterface() {
        this.welcomeSection.style.display = 'none';
        this.chatSection.style.display = 'block';
        this.renderMessages();
    }

    /**
     * 显示欢迎区域
     */
    showWelcome() {
        this.welcomeSection.style.display = 'flex';
        this.chatSection.style.display = 'none';
        this.messagesContainer.innerHTML = '';
    }

    /**
     * 处理发送消息
     */
    async handleSendMessage() {
        const content = this.messageInput.value.trim();
        const hasImages = this.uploadedImages.length > 0;
        if ((!content && !hasImages) || this.isStreaming) return;

        if (!bailianAPI.isAPIKeyValid()) {
            this.showToast('API Key 未设置。请在浏览器控制台执行: localStorage.setItem("LINGXI_API_KEY", "your-api-key")');
            return;
        }

        // 用户主动发送新消息时，恢复跟踪到底部
        this.shouldAutoScroll = true;

        // 显示聊天界面
        this.showChatInterface();

        // 添加用户消息
        this.messages.push({
            role: 'user',
            content: content,
            images: [...this.uploadedImages],
        });

        // 显示用户消息
        this.displayMessage('user', content, this.uploadedImages);
        this.scrollToBottom();

        // 清空输入
        this.messageInput.value = '';
        this.uploadedImages = [];
        this.imagePreviewArea.innerHTML = '';
        this.autoResizeTextarea();

        // 为 API 准备消息（暂时不处理之前消息中的图片）
        const apiMessages = this.messages.map(msg => {
            if (msg.role === 'user' && msg.images && msg.images.length > 0) {
                return {
                    role: 'user',
                    content: [
                        { type: 'text', text: msg.content },
                        ...msg.images.map(img => ({
                            type: 'image_url',
                            image_url: { url: img }
                        }))
                    ]
                };
            }

            return {
                role: msg.role,
                content: msg.content
            };
        });

        // 获取 AI 响应
        await this.getAIResponse(apiMessages);

        // 保存聊天历史
        this.saveChatHistory();
    }

    /**
     * 通过流式方式获取 AI 响应
     */
    async getAIResponse(messages) {
        this.isStreaming = true;
        this.sendBtn.disabled = true;
        this.sendBtn.style.display = 'none';
        this.stopBtn.style.display = 'flex';

        // 显示加载消息
        const messageId = `msg-${Date.now()}`;
        this.messagesContainer.innerHTML += `
            <div class="message ai" data-message-id="${messageId}">
                <img class="message-avatar ai" src="./assets/avatar.png" alt="AI助手">
                <div class="message-bubble" id="bubble-${messageId}">
                    <div class="message-loading">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        
        this.autoScroll();

        let fullResponse = '';

        await bailianAPI.streamGenerate(
            messages,
            (chunk) => {
                fullResponse += chunk;
                this.updateMessageBubble(messageId, fullResponse);
                this.autoScroll();
            },
            (error) => {
                console.error('API Error:', error);
                this.showToast(`错误: ${error}`);
            },
            () => {
                this.isStreaming = false;
                this.sendBtn.style.display = 'flex';
                this.updateSendButtonState();
                this.stopBtn.style.display = 'none';

                // 接收到消息并添加到历史记录
                if (fullResponse) {
                    this.messages.push({
                        role: 'assistant',
                        content: fullResponse,
                    });
                    this.saveChatHistory();
                }
            }
        );
    }

    /**
     * 统一的Markdown内容渲染管线
     * 执行：Markdown解析 → 代码高亮 → 代码块增强
     */
    renderMarkdownToBubble(bubbleElement, content) {
        // 1. 解析Markdown为HTML
        let html = marked.parse(content);

        // 2. 进行代码块语法高亮
        html = this.highlightCodeBlocks(html);

        // 3. 将HTML渲染到气泡
        bubbleElement.innerHTML = html;

        // 4. 增强代码块（添加复制按钮、包装等）
        this.enhanceCodeBlocks(bubbleElement);
    }

    /**
     * 使用 Highlight.js 进行代码块语法高亮
     */
    highlightCodeBlocks(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        doc.querySelectorAll('pre code').forEach((codeBlock) => {
            try {
                hljs.highlightElement(codeBlock);
            } catch (e) {
                console.warn('Failed to highlight code:', e);
            }
        });

        return doc.body.innerHTML;
    }

    /**
     * 使用 Markdown 渲染更新消息气泡内容
     */
    updateMessageBubble(messageId, content) {
        const bubble = document.getElementById(`bubble-${messageId}`);
        if (!bubble) return;

        // 使用统一的Markdown渲染管线
        this.renderMarkdownToBubble(bubble, content);
    }

    getCodeLanguageLabel(pre) {
        const code = pre.querySelector('code');
        if (!code) return 'code';
        const cls = Array.from(code.classList || []);
        const langClass = cls.find((c) => c.startsWith('language-') || c.startsWith('lang-'));
        const raw = langClass ? langClass.replace(/^language-/, '').replace(/^lang-/, '') : '';
        const lang = (raw || code.getAttribute('data-language') || '').trim().toLowerCase();
        return lang || 'code';
    }

    enhanceCodeBlocks(container) {
        container.querySelectorAll('pre').forEach((pre) => {
            // 已经增强过：pre 外层是 code-block-wrapper
            if (pre.parentElement && pre.parentElement.classList.contains('code-block-wrapper')) return;

            // 清理旧的复制按钮（之前直接 append 到 pre 内）
            pre.querySelectorAll(':scope > .copy-btn').forEach((btn) => btn.remove());
            pre.style.position = '';

            const wrapper = document.createElement('div');
            wrapper.className = 'code-block-wrapper';

            const header = document.createElement('div');
            header.className = 'code-block-header';

            const lang = document.createElement('span');
            lang.className = 'code-lang';
            lang.textContent = this.getCodeLanguageLabel(pre);

            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.type = 'button';
            copyBtn.title = '复制';
            copyBtn.setAttribute('aria-label', '复制代码');
            copyBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" fill="none" stroke="currentColor" stroke-width="2"></path>
                </svg>
            `;

            copyBtn.addEventListener('click', () => {
                const codeContent = pre.querySelector('code')?.textContent || pre.textContent || '';
                navigator.clipboard.writeText(codeContent).then(() => {
                    copyBtn.classList.add('copied');
                    setTimeout(() => copyBtn.classList.remove('copied'), 1200);
                }).catch(() => {
                    this.showToast('复制失败');
                });
            });

            header.appendChild(lang);
            header.appendChild(copyBtn);

            // 组装结构：wrapper -> header + pre
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(header);
            wrapper.appendChild(pre);
        });
    }

    /**
     * 在聊天区域显示消息
     */
    displayMessage(role, content, images = []) {
        const messageId = `msg-${Date.now()}`;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        messageDiv.setAttribute('data-message-id', messageId);

        if (role === 'user') {
            let html = `
                <div class="message-bubble">
                    ${this.escapeHtml(content)}
            `;

            if (images.length > 0) {
                images.forEach((img) => {
                    html += `<div style="margin-top: 0.5rem;"><img src="${img}" style="max-width: 200px; border-radius: 8px;" alt="uploaded"></div>`;
                });
            }

            html += `</div>`;
            messageDiv.innerHTML = html;
        } else {
            messageDiv.innerHTML = `
                <img class="message-avatar ai" src="./assets/avatar.png" alt="AI助手">
                <div class="message-bubble" id="bubble-${messageId}">
                    <div class="message-loading">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            `;
        }

        this.messagesContainer.appendChild(messageDiv);

        this.autoScroll();

        return messageId;
    }

    /**
     * 从历史记录中渲染所有消息
     */
    renderMessages() {
        this.messagesContainer.innerHTML = '';
        this.messages.forEach((msg, index) => {
            if (msg.role === 'user') {
                this.displayMessage('user', msg.content, msg.images || []);
            } else {
                const messageId = `msg-${Date.now() + index}`;
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message ai';
                messageDiv.setAttribute('data-message-id', messageId);
                
                const avatarImg = document.createElement('img');
                avatarImg.className = 'message-avatar ai';
                avatarImg.src = './assets/avatar.png';
                avatarImg.alt = 'AI助手';
                
                const messageBubble = document.createElement('div');
                messageBubble.className = 'message-bubble';
                
                messageDiv.appendChild(avatarImg);
                messageDiv.appendChild(messageBubble);
                this.messagesContainer.appendChild(messageDiv);

                // 使用统一的Markdown渲染管线
                this.renderMarkdownToBubble(messageBubble, msg.content);
            }
        });
        this.autoScroll();
    }

    /**
     * 停止当前生成
     */
    handleStopGeneration() {
        bailianAPI.stopStream();
        this.isStreaming = false;
        this.sendBtn.style.display = 'flex';
        this.updateSendButtonState();
        this.stopBtn.style.display = 'none';
        this.showToast('已停止生成');
    }

    /**
     * 清空所有聊天
     */
    handleClearChat() {
        if (confirm('确定要清除所有对话吗？')) {
            this.messages = [];
            this.uploadedImages = [];
            localStorage.removeItem('LINGXI_CHAT_HISTORY');
            this.messageInput.value = '';
            this.messageInput.scrollTop = 0;
            this.messageInput.style.overflowY = 'hidden';
            this.autoResizeTextarea();
            this.imagePreviewArea.innerHTML = '';
            this.showWelcome();
            this.showToast('对话已清除');
        }
    }

    /**
     * 处理已丢弃的图像文件
     */
    handleDroppedFiles(files) {
        this.processFiles(files);
    }

    /**
     * 处理图片上传
     */
    handleImageUpload(event) {
        this.processFiles(event.target.files);
        // 重置输入
        this.imageInput.value = '';
    }

    /**
     * 处理上传文件
     */
    processFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.uploadedImages.push(e.target.result);
                    this.updateImagePreview();
                };
                reader.readAsDataURL(file);
            } else {
                this.showToast('只支持图片文件');
            }
        });
    }

    /**
     * 更新图片预览区域
     */
    updateImagePreview() {
        this.imagePreviewArea.innerHTML = '';
        this.uploadedImages.forEach((img, index) => {
            const preview = document.createElement('div');
            preview.className = 'image-preview';
            preview.innerHTML = `
                <img src="${img}" alt="preview">
                <button class="image-preview-remove" aria-label="删除图片">×</button>
            `;

            // 点击图片放大预览
            const imgElement = preview.querySelector('img');
            imgElement.style.cursor = 'pointer';
            imgElement.addEventListener('click', () => {
                this.showImagePreviewModal(img);
            });

            preview.querySelector('.image-preview-remove').addEventListener('click', () => {
                this.uploadedImages.splice(index, 1);
                this.updateImagePreview();
            });

            this.imagePreviewArea.appendChild(preview);
        });

        this.updateSendButtonState();
    }

    /**
     * Show image preview modal - 点击图片放大预览
     */
    showImagePreviewModal(imageSrc) {
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'image-preview-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
            box-sizing: border-box;
            overflow: hidden;
        `;

        // 创建图片容器
        const imgContainer = document.createElement('div');
        imgContainer.style.cssText = `
            position: relative;
            max-width: 100%;
            max-height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: auto;
        `;

        // 创建放大后的图片
        const img = document.createElement('img');
        img.src = imageSrc;
        img.style.cssText = `
            max-width: 100%;
            max-height: calc(100vh - 100px);
            object-fit: contain;
            border-radius: 8px;
            transition: transform 0.1s ease-out;
            cursor: grab;
        `;

        // 图片缩放状态
        let scale = 1;
        const minScale = 0.5;
        const maxScale = 5;

        // 创建关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            border: none;
            background-color: rgba(255, 255, 255, 0.8);
            color: #000;
            font-size: 28px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
            z-index: 10001;
        `;

        closeBtn.addEventListener('mouseover', () => {
            closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 1)';
        });
        closeBtn.addEventListener('mouseout', () => {
            closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        });

        // 关闭模态框
        const closeModal = () => {
            modal.remove();
            closeBtn.remove();
            // 移除事件监听
            document.removeEventListener('wheel', handleWheel, { passive: false });
            document.removeEventListener('keydown', escListener);
        };

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // 按 ESC 键关闭
        const escListener = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };
        document.addEventListener('keydown', escListener);

        // 处理滚轮事件 - 图片缩放，阻止页面缩放
        const handleWheel = (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                
                // 计算缩放方向和新的缩放值
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                const newScale = Math.max(minScale, Math.min(maxScale, scale + delta));
                
                if (newScale !== scale) {
                    scale = newScale;
                    img.style.transform = `scale(${scale})`;
                    
                    // 改变光标样式反馈
                    if (scale > 1) {
                        img.style.cursor = 'grabbing';
                    } else {
                        img.style.cursor = 'grab';
                    }
                }
            }
        };
        document.addEventListener('wheel', handleWheel, { passive: false });

        // 提示文字
        const tipText = document.createElement('div');
        tipText.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(255, 255, 255, 0.9);
            color: #000;
            padding: 10px 20px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 10001;
            pointer-events: none;
        `;
        tipText.textContent = 'Ctrl + 滚轮缩放图片 | ESC 关闭';

        imgContainer.appendChild(img);
        modal.appendChild(imgContainer);
        modal.appendChild(closeBtn);
        modal.appendChild(tipText);
        document.body.appendChild(modal);
    }

    /**
     * 自动调整 textarea 高度
     */
    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        const maxHeight = parseFloat(window.getComputedStyle(this.messageInput).maxHeight);
        const nextHeight = this.messageInput.scrollHeight;

        if (Number.isFinite(maxHeight) && maxHeight > 0) {
            const clampedHeight = Math.min(nextHeight, maxHeight);
            this.messageInput.style.height = `${clampedHeight}px`;
            this.messageInput.style.overflowY = nextHeight > maxHeight ? 'auto' : 'hidden';
        } else {
            this.messageInput.style.height = `${nextHeight}px`;
            this.messageInput.style.overflowY = 'hidden';
        }

        // 同时更新发送按钮启用/禁用状态
        this.updateSendButtonState();
    }

    hasSendableInput() {
        return this.messageInput.value.trim().length > 0 || this.uploadedImages.length > 0;
    }

    updateSendButtonState() {
        this.sendBtn.disabled = !this.hasSendableInput();
    }

    /**
     * 弹框通知
     */
    showToast(message) {
        this.toast.textContent = message;
        this.toast.classList.add('show');

        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化应用
const app = new LingXiApp();
