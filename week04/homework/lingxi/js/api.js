/**
 * 阿里百炼 API 集成
 * API Key 来自浏览器本地存储（localStorage）
 */

// ==================== 常量配置 ====================
const API_KEY_NAME = 'LINGXI_API_KEY';
const API_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const MODEL_NAME = 'qwen3.5-omni-plus-2026-03-15';

class BailianAPI {
    constructor() {
        // 从 localStorage 读取 API Key
        this.apiKey = this.loadAPIKeyFromStorage();
        this.baiLianURL = API_BASE_URL;
        this.modelName = MODEL_NAME;
        this.abortController = null;
    }

    /**
     * 从 localStorage 读取 API Key
     */
    loadAPIKeyFromStorage() {
        try {
            const key = localStorage.getItem(API_KEY_NAME);
            return key ? key.trim() : null;
        } catch (e) {
            console.warn('无法访问 localStorage:', e);
            return null;
        }
    }

    /**
     * 初始化 API - 从本地存储读取 API Key
     */
    initializeAPI() {
        this.apiKey = this.loadAPIKeyFromStorage();
        if (!this.isAPIKeyValid()) {
            console.warn('API Key 未设置。请在浏览器控制台执行: localStorage.setItem("' + API_KEY_NAME + '", "your-api-key")');
            return false;
        }
        return true;
    }

    /**
     * 设置 API Key（同时保存到 localStorage 和内存）
     */
    setAPIKey(key) {
        if (!key || typeof key !== 'string') {
            return false;
        }
        const trimmedKey = key.trim();
        try {
            localStorage.setItem(API_KEY_NAME, trimmedKey);
        } catch (e) {
            console.warn('无法保存到 localStorage:', e);
        }
        this.apiKey = trimmedKey;
        return true;
    }

    /**
     * 检查 API Key 是否有效
     */
    isAPIKeyValid() {
        return this.apiKey !== null && this.apiKey.length > 0;
    }

    /**
     * 获取当前 API Key（仅返回前几个字符用于展示）
     */
    getAPIKey() {
        if (!this.apiKey) return null;
        return this.apiKey.substring(0, 10) + '***';
    }

    /**
     * 清除 API Key（从内存和 localStorage 中）
     */
    clearAPIKey() {
        this.apiKey = null;
        try {
            localStorage.removeItem(API_KEY_NAME);
        } catch (e) {
            console.warn('无法从 localStorage 中清除 API Key:', e);
        }
        return true;
    }

    /**
     * 设置使用的模型
     */
    setModel(modelName) {
        this.modelName = modelName;
    }

    /**
     * 流式生成响应
     * @param {Array} messages
     * @param {Function} onChunk
     * @param {Function} onError
     * @param {Function} onComplete
     */
    async streamGenerate(messages, onChunk, onError, onComplete) {
        if (!this.isAPIKeyValid()) {
            onError?.('API Key 未设置或无效');
            onComplete?.();
            return;
        }

        this.abortController = new AbortController();

        try {
            const requestBody = {
                model: this.modelName,
                messages,
                stream: true,
                temperature: 0.7,
                top_p: 0.8
            };

            // 使用 CORS 代理调用 API
            // ✅ 正确：直接使用阿里云官方地址（阿里云原生支持跨域）
            const response = await fetch(this.baiLianURL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody),
                signal: this.abortController.signal
            });


            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API Error ${response.status}: ${errText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    onComplete?.();
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data:')) continue;

                    const dataStr = trimmed.slice(5).trim();

                    if (!dataStr || dataStr === '[DONE]') continue;

                    try {
                        const data = JSON.parse(dataStr);
                        const delta = data.choices?.[0]?.delta?.content || '';
                        if (delta) {
                            onChunk(delta);
                        }
                    } catch (e) {
                        console.warn('解析流式数据失败:', e, dataStr);
                    }
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                onComplete?.();
                return;
            }
            onError?.(error.message || '流式生成失败');
            onComplete?.();
        }
    }

    /**
     * 停止当前流
     */
    stopStream() {
        if (this.abortController) {
            this.abortController.abort();
        }
    }
}

const bailianAPI = new BailianAPI();
