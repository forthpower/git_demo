/**
 * API 工具 - 封装所有 API 请求
 */

class API {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, finalOptions);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }

    // 模型相关
    async getModels() {
        return this.request('/models');
    }

    async saveModel(data) {
        return this.request('/models', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async deleteModel(id) {
        return this.request(`/models/${id}`, {
            method: 'DELETE'
        });
    }

    // 解析相关
    async parseModel(content, fileType) {
        return this.request('/parse_model', {
            method: 'POST',
            body: JSON.stringify({ content, file_type: fileType })
        });
    }

    // 同步相关
    async autoSync(syncData) {
        return this.request('/auto_sync', {
            method: 'POST',
            body: JSON.stringify({ sync_data: syncData })
        });
    }

    async importFolder(folderPath) {
        return this.request('/import_folder', {
            method: 'POST',
            body: JSON.stringify({ folder_path: folderPath })
        });
    }
}

// 导出 API 实例
window.api = new API();
