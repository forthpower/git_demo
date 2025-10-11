/**
 * AdminSystem 核心类
 */

class AdminSystem {
    constructor() {
        this.models = []; // 存储所有模型
        this.currentModel = null; // 当前编辑的模型
        this.currentView = 'model-list'; // 当前视图：model-list 或 field-config
        this.modelIdToChipEl = new Map();
        this.parentMenus = []; // 存储父菜单列表
        this.init();
    }
    
    async init() {
        this.bindEvents();
        await this.loadModels();
        this.loadParentMenus();
        this.renderLeftModelMenu();
        this.showModelList();
    }
    
    bindEvents() {
        // 事件绑定
    }
    
    loadParentMenus() {
        // 从已有模型中提取所有不重复的父菜单
        const parentSet = new Set();
        this.models.forEach(model => {
            if (model.parent && model.parent.label && model.parent.name) {
                const key = `${model.parent.label}|||${model.parent.name}`;
                parentSet.add(key);
            }
        });
        
        this.parentMenus = Array.from(parentSet).map(key => {
            const [label, name] = key.split('|||');
            return { label, name };
        });
    }
    
    
    async loadModels() {
        try {
            const response = await fetch('/api/models');
            if (response.ok) {
                this.models = await response.json();
            } else {
                this.models = [];
            }
        } catch (error) {
            console.error('加载模型失败:', error);
            this.models = [];
        }
    }
    
    showModelList() {
        this.currentView = 'model-list';
        this.currentModel = null;
        document.getElementById('current-page').textContent = '模型列表';
        
        // 显示模型列表表格
        document.getElementById('model-list-view').style.display = 'block';
        document.getElementById('field-config-view').style.display = 'none';
        
        this.updateModelTable();
        this.renderLeftModelMenu();
        this.updateMenuActive('model-list');
    }
    
    showFieldManager() {
        this.currentView = 'field-config';
        
        // 更新面包屑显示 parent / model
        this.updateBreadcrumb();
        
        // 显示字段配置区域
        document.getElementById('model-list-view').style.display = 'none';
        document.getElementById('field-config-view').style.display = 'block';
        
        this.updateMenuActive('field-config');
        this.renderLeftModelMenu();
        this.updateConfigSections();
    }
    
    updateBreadcrumb() {
        const currentPageEl = document.getElementById('current-page');
        if (!this.currentModel) {
            if (currentPageEl) currentPageEl.textContent = '模型列表';
            return;
        }
        
        // 面包屑格式：parent / model
        let breadcrumbText = '';
        
        // 如果有父菜单，显示父菜单
        if (this.currentModel.parent && this.currentModel.parent.label) {
            breadcrumbText = this.currentModel.parent.label + ' / ';
        }
        
        // 添加模型label
        breadcrumbText += this.currentModel.label || this.currentModel.name || '未命名模型';
        
        if (currentPageEl) {
            currentPageEl.textContent = breadcrumbText;
        }
    }
    
    updateMenuActive(viewType) {
        // 更新菜单选中状态
        document.querySelectorAll('.submenu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        if (viewType === 'model-list') {
            document.querySelector('.submenu-item').classList.add('active');
        } else {
            document.querySelectorAll('.submenu-item')[1].classList.add('active');
        }
    }
    
    updateModelTable() {
        const tbody = document.getElementById('model-table-body');
        tbody.innerHTML = '';
        
        if (this.models.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #9ca3af; padding: 40px;">
                        No Data
                    </td>
                </tr>
            `;
            return;
        }
        
        this.models.forEach(model => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${model.name}</td>
                <td>${model.label}</td>
                <td>${model.fields.length}</td>
                <td>${model.primary_key}</td>
                <td>${model.createdAt}</td>
                <td>
                    <span style="color: #14b8a6; font-weight: 500;">${model.status}</span>
                </td>
                <td>
                    <button class="btn btn-primary btn-small" onclick="adminSystem.editModel(${model.id})" style="margin-right: 8px;">编辑</button>
                    <button class="btn btn-secondary btn-small" onclick="adminSystem.viewModel(${model.id})" style="margin-right: 8px;">查看</button>
                    <button class="btn btn-danger btn-small" onclick="adminSystem.deleteModel(${model.id})">删除</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    editModel(modelId) {
        const model = this.models.find(m => m.id === modelId);
        if (!model) return;
        
        this.currentModel = model;
        this.showFieldManager();
        this.updateBreadcrumb();
    }
    
    viewModel(modelId) {
        const model = this.models.find(m => m.id === modelId);
        if (!model) return;
        
        // 显示模型详情
        alert(`查看模型: ${model.label}\n字段数量: ${model.fields.length}\n主键: ${model.primary_key}`);
    }
    
    async deleteModel(modelId) {
        const model = this.models.find(m => m.id === modelId);
        if (!model) return;
        
        if (confirm(`确认删除模型 "${model.label}"？`)) {
            try {
                const response = await fetch(`/api/models/${modelId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    this.models = this.models.filter(m => m.id !== modelId);
                    this.loadParentMenus();
                    this.renderLeftModelMenu();
                    this.updateModelTable();
                    this.renderLeftModelMenu();
                    this.showSuccessMessage(`模型 "${model.label}" 已删除！`);
                } else {
                    throw new Error('删除失败');
                }
            } catch (error) {
                console.error('删除模型失败:', error);
                alert('删除模型失败，请重试');
            }
        }
    }
    
    addNewModel(autoShowFieldManager = true) {
        const newModel = {
            id: Date.now(),
            name: '',
            label: '',
            primary_key: '',
            entry: 'list',
            parent: '',
            action: [],
            fields: [],
            base_props: {},
            custom_actions: [],
            createdAt: new Date().toISOString().split('T')[0],
            status: 'active'
        };
        
        // 添加到模型列表
        this.models.push(newModel);
        this.currentModel = newModel;
        
        // 更新左侧显示
        this.renderLeftModelMenu();
        
        if (autoShowFieldManager) {
            this.showFieldManager();
            this.updateBreadcrumb();
        }
    }
    
    updateConfigSections() {
        if (!this.currentModel) return;
        
        const sections = document.querySelectorAll('.config-section');
        
        // 基础配置状态
        const basicConfig = sections[0];
        if (this.currentModel.name || this.currentModel.label || this.currentModel.primary_key) {
            basicConfig.classList.add('has-content');
            basicConfig.querySelector('.config-subtitle').textContent = `${this.currentModel.name || '未设置'} - ${this.currentModel.label || '未设置'}`;
        } else {
            basicConfig.classList.remove('has-content');
            basicConfig.querySelector('.config-subtitle').textContent = '点击配置模型名称、标签、主键等基础信息';
        }
        
        // 渲染字段卡片
        this.renderFieldCards();
    }
    
    renderFieldCards() {
        // 字段管理已集成到预览区域，这里只需要更新预览
        this.updatePreview();
    }
    
    updatePreview() {
        if (!this.currentModel) return;
        
        // 检查是否有各种动作
        const hasCreateAction = this.currentModel.action?.some(a => a.name === 'create');
        const hasEditAction = this.currentModel.action?.some(a => a.name === 'edit');
        const hasFormAction = hasCreateAction || hasEditAction;
        
        // 更新预览标签的显示状态
        const formTab = document.querySelector('.preview-tab:nth-child(2)');
        const editTab = document.querySelector('.preview-tab:nth-child(3)');
        const detailTab = document.querySelector('.preview-tab:nth-child(4)');
        
        // 表单页预览（create）
        if (formTab) {
            if (hasCreateAction) {
                formTab.style.display = 'block';
            } else {
                formTab.style.display = 'none';
                if (formTab.classList.contains('active')) {
                    document.querySelector('.preview-tab:nth-child(1)').click();
                }
            }
        }
        
        // 编辑页预览（edit）
        if (editTab) {
            if (hasEditAction) {
                editTab.style.display = 'block';
            } else {
                editTab.style.display = 'none';
                if (editTab.classList.contains('active')) {
                    document.querySelector('.preview-tab:nth-child(1)').click();
                }
            }
        }
        
        // 详情页预览（始终显示）
        if (detailTab) {
            detailTab.style.display = 'block';
        }
        
        this.renderListPreview();
        this.renderFormPreview();
        this.renderEditPreview();
        this.renderDetailPreview();
    }
    
    renderListPreview() {
        const previewList = document.getElementById('preview-list');
        if (!previewList) return;
        
        const allFields = this.currentModel.fields || [];
        const columnList = this.currentModel.base_props?.column_list || [];
        
        // 根据 column_list 筛选要显示的字段
        const fields = columnList.length > 0 
            ? allFields.filter(f => columnList.includes(f.name))
            : allFields;
        
        if (fields.length === 0) {
            previewList.innerHTML = `
                <div class="preview-empty">
                    <div class="preview-empty-icon">📋</div>
                    <div>暂无列表字段</div>
                    <div style="font-size: 12px; margin-top: 8px;">请在高级属性配置中设置 column_list</div>
                </div>
            `;
            return;
        }
        
        previewList.innerHTML = `
            <div style="overflow-x: auto;">
                <table class="preview-table field-horizontal-table">
                    <thead>
                        <tr>
                            <th style="width: 120px; position: sticky; left: 0; background: #f8fafc; z-index: 1;"></th>
                            ${fields.map((field, index) => `
                                <th style="min-width: 150px;">
                                    ${field.label}
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="font-weight: 500; background: #f8fafc; position: sticky; left: 0; z-index: 1;">字段名称</td>
                            ${fields.map(field => `
                                <td><code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-size: 12px;">${field.name}</code></td>
                            `).join('')}
                        </tr>
                        <tr>
                            <td style="font-weight: 500; background: #f8fafc; position: sticky; left: 0; z-index: 1;">字段类型</td>
                            ${fields.map(field => `
                                <td>
                                    <span style="background: #e0f2f1; color: #14b8a6; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                                        ${field.type}
                                    </span>
                                </td>
                            `).join('')}
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }
    
    renderFormPreview() {
        const previewForm = document.getElementById('preview-form');
        if (!previewForm) return;
        
        const fields = this.currentModel.fields || [];
        const formColumns = this.currentModel.base_props?.form_columns || fields.map(f => f.name);
        const hasCreateAction = this.currentModel.action?.some(a => a.name === 'create');
        const hasEditAction = this.currentModel.action?.some(a => a.name === 'edit');
        
        // 只有在配置了 create 或 edit 动作时才显示表单预览
        if (fields.length === 0 || (!hasCreateAction && !hasEditAction)) {
            previewForm.innerHTML = `
                <div class="preview-empty">
                    <div class="preview-empty-icon">📝</div>
                    <div>暂无字段或未配置表单动作</div>
                    <div style="font-size: 12px; margin-top: 8px;">添加字段并配置 create 或 edit 动作后将显示预览</div>
                </div>
            `;
            return;
        }
        
        // 获取应该显示的字段
        const displayFields = fields.filter(f => formColumns.includes(f.name));
        
        const createTemplate = this.currentModel.action?.find(a => a.name === 'create')?.template || '';
        const editTemplate = this.currentModel.action?.find(a => a.name === 'edit')?.template || '';
        
        previewForm.innerHTML = `
            <div style="margin-bottom: 12px;">
                <h4 style="margin: 0; font-size: 14px; color: #374151;">表单页效果预览 ${createTemplate || editTemplate ? '(' + (createTemplate || editTemplate) + ')' : ''}</h4>
            </div>
            <div class="preview-form">
                ${displayFields.map(f => `
                    <div class="preview-form-group">
                        <label class="preview-form-label">${f.label}${f.required ? ' *' : ''}</label>
                        <input type="text" class="preview-form-input" placeholder="${f.placeholder || '请输入' + f.label}" value="${f.default || ''}" readonly>
                    </div>
                `).join('')}
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                    <div class="preview-actions">
                        <button class="preview-action-btn">取消</button>
                        <button class="preview-action-btn primary">提交</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderEditPreview() {
        const previewEdit = document.getElementById('preview-edit');
        if (!previewEdit) return;
        
        const fields = this.currentModel.fields || [];
        const editFormColumns = this.currentModel.base_props?.edit_form_columns || this.currentModel.base_props?.form_columns || fields.map(f => f.name);
        const hasEditAction = this.currentModel.action?.some(a => a.name === 'edit');
        
        if (fields.length === 0 || !hasEditAction) {
            previewEdit.innerHTML = `
                <div class="preview-empty">
                    <div class="preview-empty-icon">✏️</div>
                    <div>暂无字段或未配置编辑动作</div>
                    <div style="font-size: 12px; margin-top: 8px;">添加字段并配置 edit 动作后将显示预览</div>
                </div>
            `;
            return;
        }
        
        const displayFields = fields.filter(f => editFormColumns.includes(f.name));
        const editTemplate = this.currentModel.action?.find(a => a.name === 'edit')?.template || '';
        
        previewEdit.innerHTML = `
            <div style="margin-bottom: 12px;">
                <h4 style="margin: 0; font-size: 14px; color: #374151;">编辑页效果预览 ${editTemplate ? '(' + editTemplate + ')' : ''}</h4>
            </div>
            <div class="preview-form">
                ${displayFields.map(f => `
                    <div class="preview-form-group">
                        <label class="preview-form-label">${f.label}${f.required ? ' *' : ''}</label>
                        <input type="text" class="preview-form-input" placeholder="${f.placeholder || '请输入' + f.label}" value="${this.getFieldSampleValue(f)}" readonly>
                    </div>
                `).join('')}
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                    <div class="preview-actions">
                        <button class="preview-action-btn">取消</button>
                        <button class="preview-action-btn primary">更新</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderDetailPreview() {
        const previewDetail = document.getElementById('preview-detail');
        if (!previewDetail) return;
        
        const fields = this.currentModel.fields || [];
        const detailColumns = this.currentModel.base_props?.column_details_list || fields.map(f => f.name);
        
        if (fields.length === 0) {
            previewDetail.innerHTML = `
                <div class="preview-empty">
                    <div class="preview-empty-icon">📄</div>
                    <div>暂无字段</div>
                    <div style="font-size: 12px; margin-top: 8px;">添加字段后将显示预览</div>
                </div>
            `;
            return;
        }
        
        const displayFields = fields.filter(f => detailColumns.includes(f.name));
        
        previewDetail.innerHTML = `
            <div style="margin-bottom: 12px;">
                <h4 style="margin: 0; font-size: 14px; color: #374151;">详情页效果预览</h4>
            </div>
            <div class="preview-form">
                ${displayFields.map(f => `
                    <div class="preview-form-group">
                        <label class="preview-form-label">${f.label}</label>
                        <div class="preview-form-input" style="background: #f9fafb; border-color: #e5e7eb;">${this.getFieldSampleValue(f)}</div>
                    </div>
                `).join('')}
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                    <div class="preview-actions">
                        ${this.currentModel.action?.some(a => a.name === 'edit') ? '<button class="preview-action-btn primary">编辑</button>' : ''}
                        <button class="preview-action-btn">返回</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    getFieldSampleValue(field) {
        // 根据字段类型返回示例值
        const sampleValues = {
            'String': 'sample text',
            'Integer': '123',
            'Float': '12.34',
            'DateTime': '2024-01-01 12:00:00',
            'Boolean': 'true',
            'Select': '选项1',
            'Image': '🖼️',
            'File': '📄 file.pdf'
        };
        return sampleValues[field.type] || field.label;
    }
    
    openBasicConfig() {
        if (!this.currentModel) {
            this.addNewModel(false);
        }
        
        const modal = document.getElementById('config-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        modalTitle.textContent = '基础配置';
        modalBody.innerHTML = `
            <form id="basic-config-form">
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">模型名称 *</label>
                        <input type="text" class="form-input" id="model-name" value="${this.currentModel.name}" placeholder="例如: user">
            </div>
                    <div class="form-group">
                        <label class="form-label">显示标签 *</label>
                        <input type="text" class="form-input" id="model-label" value="${this.currentModel.label}" placeholder="例如: 用户管理">
            </div>
        </div>

                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">主键字段</label>
                        <input type="text" class="form-input" id="primary-key" value="${this.currentModel.primary_key}" placeholder="例如: user_id">
            </div>
                    <div class="form-group">
                        <label class="form-label">入口类型</label>
                        <select class="form-input" id="entry-type">
                            <option value="list" ${this.currentModel.entry === 'list' ? 'selected' : ''}>列表页 (list)</option>
                            <option value="add" ${this.currentModel.entry === 'add' ? 'selected' : ''}>添加页 (add)</option>
                        </select>
            </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">父级菜单</label>
                    <select class="form-input" id="parent-select" onchange="onParentSelectChange()">
                        <option value="">无父菜单（一级菜单）</option>
                        ${this.parentMenus.map(p => {
                            const selected = this.currentModel.parent && this.currentModel.parent.name === p.name ? 'selected' : '';
                            return `<option value="${p.name}" ${selected}>${p.label} (${p.name})</option>`;
                        }).join('')}
                        <option value="__custom__">➕ 自定义父菜单...</option>
                    </select>
                    
                    <div id="custom-parent-inputs" style="display: none; margin-top: 8px;">
                        <input type="text" class="form-input" id="parent-label" placeholder="父菜单标签（如：系统管理）" style="margin-bottom: 8px;">
                        <input type="text" class="form-input" id="parent-name" placeholder="父菜单名称（如：system）">
                    </div>
        </div>

                <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                    <button type="button" class="btn btn-primary" onclick="saveBasicConfig()">保存</button>
                </div>
            </form>
        `;
        
        modal.style.display = 'flex';
        
        // 如果当前模型有自定义的父菜单（不在列表中），显示自定义输入框
        setTimeout(() => {
            const currentParent = this.currentModel.parent;
            if (currentParent && currentParent.name) {
                const existsInList = this.parentMenus.some(p => p.name === currentParent.name);
                if (!existsInList) {
                    // 自定义父菜单
                    document.getElementById('parent-select').value = '__custom__';
                    document.getElementById('custom-parent-inputs').style.display = 'block';
                    document.getElementById('parent-label').value = currentParent.label || '';
                    document.getElementById('parent-name').value = currentParent.name || '';
                }
            }
        }, 0);
    }
    
    openFieldConfig() {
        if (!this.currentModel) {
            this.addNewModel(false);
        }
        
        const modal = document.getElementById('config-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        modalTitle.textContent = '字段配置';
        modalBody.innerHTML = `
            <div>
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h4 style="margin: 0; color: #374151;">字段列表</h4>
                        <button type="button" class="btn btn-primary" id="add-field-btn">
                            <span>➕</span>
                            <span>添加字段</span>
                        </button>
                    </div>
                    
                    <div id="fields-list" style="border: 1px solid #e5e7eb; border-radius: 6px; max-height: 300px; overflow-y: auto;">
                        ${this.currentModel.fields.length === 0 ? 
                            '<div style="text-align: center; padding: 40px; color: #9ca3af;">暂无字段，点击"添加字段"开始配置</div>' :
                            this.currentModel.fields.map(field => this.renderFieldItem(field)).join('')
                        }
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                    <button type="button" class="btn btn-primary" onclick="saveFieldConfig()">保存</button>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        // 绑定添加字段按钮事件（使用 setTimeout 确保 DOM 已渲染）
        setTimeout(() => {
            const addFieldBtn = document.getElementById('add-field-btn');
            if (addFieldBtn) {
                addFieldBtn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    addField();
                };
            }
        }, 0);
    }
    
    renderFieldItem(field) {
        return `
            <div class="field-item" style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <div style="font-weight: 500; color: #374151;">${field.name}</div>
                    <div style="font-size: 12px; color: #6b7280;">${field.type} - ${field.label}</div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button type="button" class="btn btn-secondary btn-small" onclick="editField(${field.id})">编辑</button>
                    <button type="button" class="btn btn-danger btn-small" onclick="removeField(${field.id})">删除</button>
                </div>
            </div>
        `;
    }
    
    openActionConfig() {
        if (!this.currentModel) {
            this.addNewModel(false);
        }
        
        const modal = document.getElementById('config-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        const getActionTemplate = (actionName) => {
            const action = this.currentModel.action?.find(a => a.name === actionName);
            return action?.template || '';
        };
        
        modalTitle.textContent = '动作配置';
        modalBody.innerHTML = `
            <form id="action-config-form">
                <div style="margin-bottom: 20px;">
                    <h4 style="margin: 0 0 16px 0; color: #374151;">基础动作</h4>
                    
                    <!-- 两列网格布局 -->
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                        <!-- List 动作 -->
                        <div style="padding: 12px 8px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fafbfc;">
                            <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; margin-bottom: 8px;">
                                <input type="checkbox" id="action-list" ${this.hasAction('list') ? 'checked' : ''}>
                                📋 列表查看 (list)
                            </label>
                            <select class="form-input" id="template-list" style="margin-left: 20px;">
                                <option value="tablebase" ${getActionTemplate('list') === 'tablebase' ? 'selected' : ''}>tablebase - 基础列表模版</option>
                                <option value="batch_table" ${getActionTemplate('list') === 'batch_table' ? 'selected' : ''}>batch_table - 带批量操作的列表</option>
                            </select>
                            <small style="display: block; margin-left: 20px; margin-top: 4px; color: #6b7280; font-size: 12px;">显示数据列表，支持查询、排序、分页</small>
                        </div>
                        
                        <!-- Create 动作 -->
                        <div style="padding: 12px 8px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fafbfc;">
                            <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; margin-bottom: 8px;">
                                <input type="checkbox" id="action-create" ${this.hasAction('create') ? 'checked' : ''}>
                                ➕ 创建 (create)
                            </label>
                            <select class="form-input" id="template-create" style="margin-left: 20px;">
                                <option value="formbase" ${getActionTemplate('create') === 'formbase' ? 'selected' : ''}>formbase - 基础添加表单模版</option>
                            </select>
                            <small style="display: block; margin-left: 20px; margin-top: 4px; color: #6b7280; font-size: 12px;">添加新数据的表单页面</small>
                        </div>
                        
                        <!-- Edit 动作 -->
                        <div style="padding: 12px 8px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fafbfc;">
                            <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; margin-bottom: 8px;">
                                <input type="checkbox" id="action-edit" ${this.hasAction('edit') ? 'checked' : ''}>
                                ✏️ 编辑 (edit)
                            </label>
                            <select class="form-input" id="template-edit" style="margin-left: 20px;">
                                <option value="editbase" ${getActionTemplate('edit') === 'editbase' ? 'selected' : ''}>editbase - 基础编辑表单模版</option>
                                <option value="edit_single" ${getActionTemplate('edit') === 'edit_single' ? 'selected' : ''}>edit_single - 单独编辑模版（与添加表单不同）</option>
                            </select>
                            <small style="display: block; margin-left: 20px; margin-top: 4px; color: #6b7280; font-size: 12px;">编辑已有数据，edit_single用于添加和编辑表单完全不同的场景</small>
                        </div>
                        
                        <!-- Delete 动作 -->
                        <div style="padding: 12px 8px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fafbfc;">
                            <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; margin-bottom: 8px;">
                                <input type="checkbox" id="action-delete" ${this.hasAction('delete') ? 'checked' : ''}>
                                🗑️ 删除 (delete)
                            </label>
                            <select class="form-input" id="template-delete" style="margin-left: 20px;">
                                <option value="button" ${getActionTemplate('delete') === 'button' ? 'selected' : ''}>button - 删除按钮模版</option>
                            </select>
                            <small style="display: block; margin-left: 20px; margin-top: 4px; color: #6b7280; font-size: 12px;">删除数据功能</small>
                        </div>
                        
                        <!-- Export 动作 -->
                        <div style="padding: 12px 8px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fafbfc;">
                            <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; margin-bottom: 8px;">
                                <input type="checkbox" id="action-export" ${this.hasAction('export') ? 'checked' : ''}>
                                📥 导出 (export)
                            </label>
                            <select class="form-input" id="template-export" style="margin-left: 20px;">
                                <option value="exportbase" ${getActionTemplate('export') === 'exportbase' ? 'selected' : ''}>exportbase - 基础导出模版</option>
                            </select>
                            <small style="display: block; margin-left: 20px; margin-top: 4px; color: #6b7280; font-size: 12px;">导出数据到文件（CSV等）</small>
                        </div>
                        
                        <!-- Ajax 动作 -->
                        <div style="padding: 12px 8px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fafbfc;">
                            <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; margin-bottom: 8px;">
                                <input type="checkbox" id="action-ajax" ${this.hasAction('ajax') ? 'checked' : ''}>
                                ⚡ Ajax表单 (ajax)
                            </label>
                            <select class="form-input" id="template-ajax" style="margin-left: 20px;">
                                <option value="ajaxbase" ${getActionTemplate('ajax') === 'ajaxbase' ? 'selected' : ''}>ajaxbase - 基础ajax表单模版</option>
                                <option value="filterform" ${getActionTemplate('ajax') === 'filterform' ? 'selected' : ''}>filterform - 带查询的ajax表单</option>
                            </select>
                            <small style="display: block; margin-left: 20px; margin-top: 4px; color: #6b7280; font-size: 12px;">Ajax表单提交，filterform支持查询后渲染第一条数据</small>
                        </div>
                        
                        <!-- Chart 动作 -->
                        <div style="padding: 12px 8px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fafbfc;">
                            <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; margin-bottom: 8px;">
                                <input type="checkbox" id="action-chart" ${this.hasAction('chart') ? 'checked' : ''}>
                                📊 图表 (chart)
                            </label>
                            <select class="form-input" id="template-chart" style="margin-left: 20px;">
                                <option value="chartbase" ${getActionTemplate('chart') === 'chartbase' ? 'selected' : ''}>chartbase - 图表模版</option>
                            </select>
                            <small style="display: block; margin-left: 20px; margin-top: 4px; color: #6b7280; font-size: 12px;">数据可视化图表展示</small>
                        </div>
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                    <button type="button" class="btn btn-primary" onclick="saveActionConfig()">保存</button>
            </div>
            </form>
        `;
        
        modal.style.display = 'flex';
    }
    
    hasAction(actionName) {
        return this.currentModel.action.some(action => action.name === actionName);
    }
    
    openBasePropsConfig() {
        if (!this.currentModel) {
            this.addNewModel(false);
        }
        
        const modal = document.getElementById('config-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        const baseProps = this.currentModel.base_props || {};
        const fieldNames = this.currentModel.fields.map(f => f.name);
        
        // 如果没有字段，提示用户先添加字段
        if (fieldNames.length === 0) {
            alert('请先添加字段！');
            return;
        }
        
        // 生成可折叠的多选框HTML的辅助函数
        const generateFieldMultiSelect = (id, selectedFields, description, hint = '') => {
            const selected = selectedFields || [];
            const selectedCount = selected.length;
            const selectedText = selectedCount > 0 ? ` (已选 ${selectedCount} 个)` : ' (未选择)';
            
            return `
                <div class="form-group collapsible-field-group" style="margin-bottom: 0;">
                    <div class="field-select-header" onclick="toggleFieldSelector('${id}')" style="
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center; 
                        padding: 10px 8px; 
                        background: #f8fafc; 
                        border: 1px solid #e5e7eb; 
                        border-radius: 6px; 
                        cursor: pointer;
                        transition: all 0.3s;
                    ">
                        <div>
                            <span style="font-weight: 500; color: #374151; font-size: 13px;">${description}</span>
                            <span style="color: #14b8a6; font-size: 12px; margin-left: 8px;">${selectedText}</span>
                        </div>
                        <span class="toggle-icon" style="color: #6b7280; transition: transform 0.3s;">▼</span>
                    </div>
                    ${hint ? `<small style="color: #6b7280; font-size: 12px; display: block; margin-top: 4px;">${hint}</small>` : ''}
                    <div id="${id}-selector" class="field-selector-content" style="display: none; margin-top: 8px;">
                        <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; background: white; max-height: 200px; overflow-y: auto;">
                            ${fieldNames.map(fieldName => `
                                <label style="display: flex; align-items: center; gap: 6px; padding: 4px 0; cursor: pointer; font-size: 13px;">
                                    <input type="checkbox" 
                                        class="field-checkbox" 
                                        data-select-id="${id}" 
                                        value="${fieldName}" 
                                        ${selected.includes(fieldName) ? 'checked' : ''}
                                        onchange="updateFieldCount('${id}')"
                                        style="cursor: pointer;">
                                    <span style="color: #374151;">${fieldName}</span>
                                </label>
                            `).join('')}
                        </div>
                        <div style="margin-top: 8px; display: flex; gap: 8px;">
                            <button type="button" class="btn btn-secondary btn-small" onclick="toggleAllFields('${id}', true)">全选</button>
                            <button type="button" class="btn btn-secondary btn-small" onclick="toggleAllFields('${id}', false)">全不选</button>
                        </div>
                    </div>
                </div>
            `;
        };
        
        // 生成可折叠的过滤器配置HTML
        const generateFilterConfig = (id, filterType, filterData, description, hint = '') => {
            const selectedCount = Object.keys(filterData || {}).length;
            const selectedText = selectedCount > 0 ? ` (已配置 ${selectedCount} 个字段)` : ' (未配置)';
            
            return `
                <div class="form-group collapsible-field-group" style="margin-bottom: 12px;">
                    <div class="field-select-header" onclick="toggleFieldSelector('${id}')" style="
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center; 
                        padding: 10px 8px; 
                        background: #f8fafc; 
                        border: 1px solid #e5e7eb; 
                        border-radius: 6px; 
                        cursor: pointer;
                        transition: all 0.3s;
                    ">
                        <div>
                            <span style="font-weight: 500; color: #374151; font-size: 13px;">${description}</span>
                            <span style="color: #14b8a6; font-size: 12px; margin-left: 8px;">${selectedText}</span>
                        </div>
                        <span class="toggle-icon" style="color: #6b7280; transition: transform 0.3s;">▼</span>
                    </div>
                    ${hint ? `<small style="color: #6b7280; font-size: 12px; display: block; margin-top: 4px;">${hint}</small>` : ''}
                    <div id="${id}-selector" class="field-selector-content" style="display: none; margin-top: 8px;">
                        <div id="${id}-container" style="border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; background: white; max-height: 300px; overflow-y: auto;">
                            ${fieldNames.map(fieldName => {
                                const filters = filterData?.[fieldName] || [];
                                return `
                                    <div style="padding: 4px 0; border-bottom: 1px solid #f3f4f6;">
                                        <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 4px;">
                                            <input type="checkbox" 
                                                class="filter-field-checkbox" 
                                                data-filter-type="${filterType}" 
                                                value="${fieldName}" 
                                                ${filters.length > 0 ? 'checked' : ''}
                                                onchange="toggleFilterField(this)"
                                                style="cursor: pointer;">
                                            ${fieldName}
                                        </label>
                                        <div class="filter-operators" style="margin-left: 24px; display: ${filters.length > 0 ? 'flex' : 'none'}; gap: 8px; flex-wrap: wrap;">
                                            ${['$eq', '$like', '$gt', '$lt', '$gte', '$lte', '$in'].map(op => `
                                                <label style="font-size: 12px; cursor: pointer; color: #6b7280;">
                                                    <input type="checkbox" 
                                                        class="filter-operator-checkbox" 
                                                        data-field="${fieldName}" 
                                                        data-filter-type="${filterType}" 
                                                        value="${op}" 
                                                        ${filters.includes(op) ? 'checked' : ''}
                                                        style="cursor: pointer;">
                                                    ${op}
                                                </label>
                                            `).join('')}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        };
        
        // 获取action配置，用于条件显示
        const actions = this.currentModel.action || [];
        const hasAction = (actionName) => actions.some(a => a.name === actionName);
        const hasActionWithTemplate = (actionName, templateName) => actions.some(a => a.name === actionName && a.template === templateName);
        
        // 根据action配置决定显示哪些字段配置
        const showColumnList = hasAction('list');
        const showFormColumns = hasAction('create');
        const showEditFormColumns = hasActionWithTemplate('edit', 'edit_single');
        const showAjaxFormColumns = hasActionWithTemplate('ajax', 'ajaxbase');
        const showFilterFormColumns = hasActionWithTemplate('ajax', 'filterform');
        const showFormFilters = hasActionWithTemplate('ajax', 'filterform'); // form_filters 只在 filterform 模板时显示
        const showExportList = hasAction('export');
        
        modalTitle.textContent = 'Base Props 配置';
        modalBody.innerHTML = `
            <form id="baseprops-config-form">
                ${!showColumnList && !showFormColumns && !showEditFormColumns && !showAjaxFormColumns && !showFilterFormColumns && !showExportList ? `
                    <div style="padding: 20px; text-align: center; color: #6b7280; background: #f8fafc; border: 1px dashed #d1d5db; border-radius: 8px; margin-bottom: 20px;">
                        <div style="font-size: 14px; margin-bottom: 8px;">💡 提示</div>
                        <div style="font-size: 13px;">请先在"动作配置"中选择相应的操作（list、create、edit、export、ajax等），然后回到这里配置对应的字段。</div>
                    </div>
                ` : ''}
                
                <!-- 1. 字段配置 -->
                <div style="margin-bottom: 16px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <div onclick="toggleBasePropSection('fields')" style="cursor: pointer; padding: 12px 16px; background: linear-gradient(to bottom, #f8fafc, #f1f5f9); display: flex; justify-content: space-between; align-items: center; user-select: none;">
                        <div>
                            <h4 style="margin: 0; color: #374151; font-size: 14px; font-weight: 600;">1. 字段配置</h4>
                            <p style="margin: 0; color: #6b7280; font-size: 11px;">字段均为 fields 中配置的字段，按需使用</p>
                        </div>
                        <span id="bp-fields-toggle" style="font-size: 18px; color: #9ca3af; transition: transform 0.3s;">▼</span>
                    </div>
                    <div id="bp-fields-content" style="display: none; padding: 16px; background: white;">
                    
                    ${!showColumnList && !showFormColumns && !showEditFormColumns && !showAjaxFormColumns && !showFilterFormColumns && !showExportList ? `
                        <div style="padding: 16px; text-align: center; color: #9ca3af; background: #fafafa; border: 1px solid #f3f4f6; border-radius: 6px; font-size: 13px;">
                            暂无可配置的字段列表项（根据已选择的 action 操作显示）
                        </div>
                    ` : ''}
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                        ${showColumnList ? generateFieldMultiSelect('bp-column-list', baseProps.column_list || fieldNames, '列表页展示字段 (column_list)', '列表页要显示的字段') : ''}
                        
                        ${showFormColumns ? generateFieldMultiSelect('bp-form-columns', baseProps.form_columns || fieldNames, '添加编辑字段 (form_columns)', '与 create & edit 基础模版搭配使用') : ''}
                        
                        ${showEditFormColumns ? generateFieldMultiSelect('bp-edit-form-columns', baseProps.edit_form_columns || [], '单独编辑字段 (edit_form_columns)', '搭配 edit_single 模板使用') : ''}
                        
                        ${generateFieldMultiSelect('bp-column-details', baseProps.column_details_list || [], '详情页字段 (column_details_list)', '详情页展示字段')}
                        
                        ${showAjaxFormColumns ? generateFieldMultiSelect('bp-ajax-form-columns', baseProps.ajax_form_columns || [], 'Ajax表单字段 (ajax_form_columns)', '配置 ajax form 表单字段') : ''}
                        
                        ${showFilterFormColumns ? generateFieldMultiSelect('bp-filter-form-columns', baseProps.filter_form_columns || [], '查询表单字段 (filter_form_columns)', '搭配 filterform 模板使用') : ''}
                        
                        ${generateFieldMultiSelect('bp-column-editable', baseProps.column_editable_list || [], '行内编辑字段 (column_editable_list)', '支持在列表页直接编辑的字段')}
                        
                        ${generateFieldMultiSelect('bp-column-sortable', baseProps.column_sortable_list || [], '可排序字段 (column_sortable_list)', '列表页排序字段')}
                        
                        ${showExportList ? generateFieldMultiSelect('bp-export-list', baseProps.export_list || [], '导出字段 (export_list)', '指定导出文件的字段') : ''}
                    </div>
                    
                    ${showColumnList ? generateFilterConfig('bp-column-filters', 'column', baseProps.column_filters || {}, '可搜索字段 (column_filters)', '优先级为 base_props 中 filter 配置，支持操作符: $eq, $like, $gt, $lt, $gte, $lte, $in') : ''}
                    
                    ${showFormFilters ? generateFilterConfig('bp-form-filters', 'form', baseProps.form_filters || {}, '表单搜索字段 (form_filters)', '搭配 filterform 使用') : ''}
                    </div>
                </div>
                
                <!-- 2. 跳转配置 -->
                ${(hasAction('create') || hasAction('edit')) ? `
                    <div style="margin-bottom: 16px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                        <div onclick="toggleBasePropSection('jump')" style="cursor: pointer; padding: 12px 16px; background: linear-gradient(to bottom, #f8fafc, #f1f5f9); display: flex; justify-content: space-between; align-items: center; user-select: none;">
                            <div>
                                <h4 style="margin: 0; color: #374151; font-size: 14px; font-weight: 600;">2. 跳转配置</h4>
                                <p style="margin: 0; color: #6b7280; font-size: 11px;">配置表单提交后的跳转行为</p>
                            </div>
                            <span id="bp-jump-toggle" style="font-size: 18px; color: #9ca3af; transition: transform 0.3s;">▼</span>
                        </div>
                        <div id="bp-jump-content" style="display: none; padding: 16px; background: white;">
                        
                        <div class="form-grid">
                            ${hasAction('create') ? `
                                <div class="form-group">
                                    <label class="form-label">创建后跳转 (submit_jump)</label>
                                    <select class="form-input" id="bp-submit-jump">
                                        <option value="">默认（跳转到list）</option>
                                        <option value="detail" ${baseProps.custom_style?.submit_jump === 'detail' ? 'selected' : ''}>detail - 跳转到详情页</option>
                                    </select>
                                    <small style="color: #6b7280; font-size: 11px;">创建表单提交后跳转到detail，默认跳转list</small>
                                </div>
                            ` : ''}
                            ${hasAction('edit') ? `
                                <div class="form-group">
                                    <label class="form-label">编辑后跳转 (submit_jump_edit)</label>
                                    <select class="form-input" id="bp-submit-jump-edit">
                                        <option value="">默认（停留在编辑页）</option>
                                        <option value="list" ${baseProps.submit_jump_edit === 'list' ? 'selected' : ''}>list - 跳转到列表页</option>
                                    </select>
                                    <small style="color: #6b7280; font-size: 11px;">编辑保存后跳转位置</small>
                                </div>
                            ` : ''}
                        </div>
                        </div>
                    </div>
                ` : ''}
                
                <!-- 3. 样式配置 -->
                <div style="margin-bottom: 16px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <div onclick="toggleBasePropSection('style')" style="cursor: pointer; padding: 12px 16px; background: linear-gradient(to bottom, #f8fafc, #f1f5f9); display: flex; justify-content: space-between; align-items: center; user-select: none;">
                        <div>
                            <h4 style="margin: 0; color: #374151; font-size: 14px; font-weight: 600;">3. 样式配置 (custom_style)</h4>
                            <p style="margin: 0; color: #6b7280; font-size: 11px;">页面展示样式和交互行为配置</p>
                        </div>
                        <span id="bp-style-toggle" style="font-size: 18px; color: #9ca3af; transition: transform 0.3s;">▼</span>
                    </div>
                    <div id="bp-style-content" style="display: none; padding: 16px; background: white;">
                    
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">详情样式 (detail_style)</label>
                            <select class="form-input" id="bp-detail-style">
                                <option value="none">none - 不需要detail</option>
                                <option value="dropdown" ${baseProps.custom_style?.detail_style === 'dropdown' ? 'selected' : ''}>dropdown - 下拉式detail</option>
                                <option value="process" ${baseProps.custom_style?.detail_style === 'process' ? 'selected' : ''}>process - 流程图样式</option>
                            </select>
                            <small style="color: #6b7280; font-size: 11px;">process需配合process_details_list使用</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">表单提交样式 (form_submit_style)</label>
                            <select class="form-input" id="bp-form-submit-style">
                                <option value="">默认（显示提交按钮）</option>
                                <option value="none" ${baseProps.custom_style?.form_submit_style === 'none' ? 'selected' : ''}>none - 不显示提交按钮</option>
                            </select>
                            <small style="color: #6b7280; font-size: 11px;">form页是否展示提交按钮</small>
                        </div>
                    </div>
                    
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">字段展示方式 (field_style)</label>
                            <select class="form-input" id="bp-field-style">
                                <option value="">默认（左右展示）</option>
                                <option value="top" ${baseProps.custom_style?.field_style === 'top' ? 'selected' : ''}>top - 上下展示</option>
                            </select>
                            <small style="color: #6b7280; font-size: 11px;">默认不写正常左右展示，top为上下展示</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">行内编辑样式 (editable_list_style)</label>
                            <select class="form-input" id="bp-editable-list-style">
                                <option value="">默认（单元格内编辑）</option>
                                <option value="alert" ${baseProps.custom_style?.editable_list_style === 'alert' ? 'selected' : ''}>alert - 弹出编辑框</option>
                            </select>
                            <small style="color: #6b7280; font-size: 11px;">行内编辑的样式类型</small>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">提交验证</label>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <label style="display: flex; align-items: center; gap: 6px; font-size: 13px;">
                                <input type="checkbox" id="bp-submit-alert" ${baseProps.custom_style?.submit_alert ? 'checked' : ''}>
                                提交不完整时弹出提示 (submit_alert)
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">详情label宽度 (detail_label_width)</label>
                            <input type="number" class="form-input" id="bp-detail-label-width" value="${baseProps.custom_style?.detail_label_width || ''}" placeholder="40">
                            <small style="color: #6b7280; font-size: 11px;">单位px，下拉类型(dropdown)的detail中字段key的宽度</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">表单label宽度 (form_label_width)</label>
                            <input type="number" class="form-input" id="bp-form-label-width" value="${baseProps.custom_style?.form_label_width || ''}" placeholder="50">
                            <small style="color: #6b7280; font-size: 11px;">单位px，form页配置label的宽度</small>
                        </div>
                    </div>
                    
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">操作列宽度 (operation_width)</label>
                            <input type="number" class="form-input" id="bp-operation-width" value="${baseProps.custom_style?.operation_width || ''}" placeholder="300">
                            <small style="color: #6b7280; font-size: 11px;">单位px，列表页operation宽度配置</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">表格高度 (table_height)</label>
                            <input type="number" class="form-input" id="bp-table-height" value="${baseProps.custom_style?.table_height || ''}" placeholder="700">
                            <small style="color: #6b7280; font-size: 11px;">单位px，固定表头</small>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">固定列数 (table_column_fixed)</label>
                        <input type="number" class="form-input" id="bp-table-column-fixed" value="${baseProps.custom_style?.table_column_fixed || ''}" placeholder="1">
                        <small style="color: #6b7280; font-size: 11px;">固定第几列数据</small>
                    </div>
                    </div>
                </div>
                
                <!-- 4. 其他配置 -->
                <div style="margin-bottom: 16px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <div onclick="toggleBasePropSection('other')" style="cursor: pointer; padding: 12px 16px; background: linear-gradient(to bottom, #f8fafc, #f1f5f9); display: flex; justify-content: space-between; align-items: center; user-select: none;">
                        <div>
                            <h4 style="margin: 0; color: #374151; font-size: 14px; font-weight: 600;">4. 其他配置</h4>
                            <p style="margin: 0; color: #6b7280; font-size: 11px;">通用页面配置</p>
                        </div>
                        <span id="bp-other-toggle" style="font-size: 18px; color: #9ca3af; transition: transform 0.3s;">▼</span>
                    </div>
                    <div id="bp-other-content" style="display: none; padding: 16px; background: white;">
                    
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">页面大小 (page_size)</label>
                            <input type="number" class="form-input" id="bp-page-size" value="${baseProps.page_size || 10}" placeholder="10">
                        </div>
                        <div class="form-group">
                            <label class="form-label">导出条数 (import_size)</label>
                            <input type="number" class="form-input" id="bp-import-size" value="${baseProps.import_size || 3000}" placeholder="3000">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">说明文本 (explain)</label>
                        <input type="text" class="form-input" id="bp-explain" value="${baseProps.explain || ''}" placeholder="模型解释说明">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">超时配置 (timeout)</label>
                        <textarea class="form-input" id="bp-timeout" rows="2" placeholder='{"list": 120, "create": 120}'>${baseProps.timeout ? JSON.stringify(baseProps.timeout, null, 2) : ''}</textarea>
                        <small style="color: #6b7280; font-size: 11px;">单位：秒，默认20秒，最大120秒。格式: {"list": 120}</small>
                    </div>
                    
                    <div style="padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e5e7eb; margin-top: 16px;">
                        <h5 style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">前端搜索配置 (filter_style)</h5>
                        <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 11px;">启用前端搜索，关闭后端搜索。只针对当前页面假搜索，不实现假分页</p>
                        
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label">搜索类型 (filter_type)</label>
                                <select class="form-input" id="bp-filter-type">
                                    <option value="">默认（后端搜索）</option>
                                    <option value="front" ${baseProps.filter_style?.filter_type === 'front' ? 'selected' : ''}>front - 前端筛选页面数据</option>
                                    <option value="backend" ${baseProps.filter_style?.filter_type === 'backend' ? 'selected' : ''}>backend - 后端接口查询</option>
                                </select>
                                <small style="color: #6b7280; font-size: 11px;">front筛选页面数据，backend后端接口查询</small>
                            </div>
                            <div class="form-group">
                                <label class="form-label">全局搜索框 (filter_all)</label>
                                <div style="display: flex; align-items: center; gap: 8px; height: 38px;">
                                    <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer;">
                                        <input type="checkbox" id="bp-filter-all" ${baseProps.filter_style?.filter_all ? 'checked' : ''}>
                                        <span>展示全局搜索框</span>
                                    </label>
                                </div>
                                <small style="color: #6b7280; font-size: 11px;">是否展示全局搜索框（匹配model所有字段）</small>
                            </div>
                        </div>
                    </div>
                    
                    <div style="padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e5e7eb; margin-top: 12px;">
                        <h5 style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">编辑提交设置 (submit_style)</h5>
                        <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 11px;">配置表单提交的样式和提示</p>
                        
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label">提交类型 (type)</label>
                                <select class="form-input" id="bp-submit-type">
                                    <option value="">默认</option>
                                    <option value="alert" ${baseProps.submit_style?.type === 'alert' ? 'selected' : ''}>alert - 弹出提示</option>
                                </select>
                                <small style="color: #6b7280; font-size: 11px;">提交类型，alert为弹出式提交</small>
                            </div>
                            <div class="form-group">
                                <label class="form-label">提示文案 (alert_content)</label>
                                <input type="text" class="form-input" id="bp-alert-content" value="${baseProps.submit_style?.alert_content || ''}" placeholder="whether to execute the current configuration？">
                                <small style="color: #6b7280; font-size: 11px;">提交时的提示文案</small>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                    <button type="button" class="btn btn-primary" onclick="saveBasePropsConfig()">保存</button>
                </div>
            </form>
        `;
        
        modal.style.display = 'flex';
    }
    
    openCustomActionsConfig() {
        if (!this.currentModel) {
            this.addNewModel(false);
        }
        
        const modal = document.getElementById('config-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        const customActions = this.currentModel.custom_actions || [];
        
        modalTitle.textContent = 'Custom Actions 配置';
        modalBody.innerHTML = `
            <form id="customactions-config-form">
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h4 style="margin: 0; color: #374151;">自定义动作列表</h4>
                        <button type="button" class="btn btn-primary btn-small" onclick="addCustomAction()">
                            <span>➕</span>
                            <span>添加动作</span>
                        </button>
                    </div>
                    
                    <div id="custom-actions-list" style="border: 1px solid #e5e7eb; border-radius: 6px; max-height: 400px; overflow-y: auto;">
                        ${customActions.length === 0 ? 
                            '<div style="text-align: center; padding: 40px; color: #9ca3af;">暂无自定义动作，点击"添加动作"开始配置</div>' :
                            customActions.map((action, idx) => this.renderCustomActionItem(action, idx)).join('')
                        }
                    </div>
                </div>
                
                <div style="padding: 16px; background: #f8fafc; border-radius: 6px; border: 1px solid #e5e7eb;">
                    <h5 style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">自定义动作类型说明</h5>
                    <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #6b7280; line-height: 1.6;">
                        <li><strong>ajax</strong>: Ajax请求动作</li>
                        <li><strong>jump</strong>: 跳转动作（内部/外部/下载）</li>
                        <li><strong>alert</strong>: 弹框确认动作</li>
                        <li><strong>form</strong>: 二次弹窗表单</li>
                        <li><strong>qcr_code</strong>: 二维码生成</li>
                    </ul>
                </div>
                
                <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                    <button type="button" class="btn btn-primary" onclick="saveCustomActionsConfig()">保存</button>
                </div>
            </form>
        `;
        
        modal.style.display = 'flex';
    }
    
    renderCustomActionItem(action, index) {
        return `
            <div class="custom-action-item" data-index="${index}" style="padding: 12px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <div style="font-weight: 500; color: #374151;">${action.action_name || '未命名'}</div>
                    <div style="font-size: 12px; color: #6b7280;">
                        ${action.label || '无标签'} - ${action.action || '无类型'} 
                        ${action.location ? `(${action.location})` : ''}
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button type="button" class="btn btn-secondary btn-small" onclick="editCustomAction(${index})">编辑</button>
                    <button type="button" class="btn btn-danger btn-small" onclick="removeCustomAction(${index})">删除</button>
                </div>
            </div>
        `;
    }
    
    async generateAndCopy() {
        if (!this.currentModel) {
            alert('请先创建或选择一个模型！');
            return;
        }
        
        try {
            // 构建完整配置 - 按照Century Games规范
            // 清理字段：移除前端使用的id属性
            const cleanFields = this.currentModel.fields.map(field => {
                const { id, ...cleanField } = field;
                return cleanField;
            });
            
            const config = {
                name: this.currentModel.name || 'model_name',
                label: this.currentModel.label || 'label',
                primary_key: this.currentModel.primary_key || '',
                entry: this.currentModel.entry || 'list',
                parent: this.currentModel.parent || '',
                action: this.currentModel.action,
                fields: cleanFields,
                base_props: this.currentModel.base_props,
                custom_actions: this.currentModel.custom_actions
            };
            
            // 发送到后端处理
            const response = await fetch('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP 错误: ${response.status}`);
            }
            
            const result = await response.json();
            
            // 格式化JSON
            const formattedJson = this.formatJSON(result);
            
            // 直接复制到剪贴板
            await this.copyToClipboard(formattedJson);
            
            // 显示成功提示
            this.showSuccessMessage('配置已复制到剪贴板！');
            
            // 重新加载模型列表以更新左侧菜单
            await this.loadModels();
            this.renderLeftModelMenu();
            
        } catch (error) {
            console.error('生成配置失败:', error);
            alert('生成配置失败，请检查后端是否正常运行');
        }
    }
    
    formatJSON(obj) {
        const indent = '    '; // 4 spaces
        let result = 'schema = {\n';
        
        // 顶层字段顺序
        const topLevelOrder = ['name', 'label', 'primary_key', 'entry', 'parent', 'action', 'fields', 'base_props', 'custom_actions'];
        
        // Fields 内字段顺序
        const fieldOrder = ['name', 'label', 'type', 'placeholder', 'explain', 'default', 'coerce', 'choices', 'copy_rule', 'tooltip', 'show_rule', 'method', 'style', 'config'];
        
        // Base props 字段顺序
        const basePropsOrder = [
            'form_columns', 'column_list', 'column_details_list', 'column_filters',
            'edit_form_columns', 'column_editable_list', 'column_sortable_list',
            'ajax_form_columns', 'filter_form_columns', 'form_filters',
            'export_list', 'page_size', 'import_size',
            'submit_jump', 'submit_jump_edit',
            'detail_style', 'form_submit_style', 'field_style', 'editable_list_style',
            'submit_alert', 'detail_label_width', 'form_label_width',
            'operation_width', 'table_height', 'table_column_fixed',
            'explain', 'timeout', 'filter_style', 'submit_style', 'custom_style'
        ];
        
        topLevelOrder.forEach((key, idx) => {
            if (!(key in obj)) return;
            
            const value = obj[key];
            
            if (key === 'action') {
                // Action 数组紧凑格式
                result += `${indent}"action": [`;
                value.forEach((action, i) => {
                    if (i === 0) {
                        result += `{"name": "${action.name}", "template": "${action.template}"}`;
                    } else {
                        result += `,\n${indent}           {"name": "${action.name}", "template": "${action.template}"}`;
                    }
                });
                result += '],\n';
            } else if (key === 'fields') {
                // Fields 数组格式化
                result += `${indent}"fields": [\n`;
                value.forEach((field, i) => {
                    result += `${indent}${indent}{\n`;
                    
                    // 按特定顺序排列字段属性
                    fieldOrder.forEach(prop => {
                        if (!(prop in field)) return;
                        const val = field[prop];
                        result += `${indent}${indent}${indent}"${prop}": ${this.formatValue(val, 3)},\n`;
                    });
                    
                    // 处理不在预定义顺序中的其他字段
                    Object.keys(field).forEach(prop => {
                        if (fieldOrder.includes(prop)) return;
                        const val = field[prop];
                        result += `${indent}${indent}${indent}"${prop}": ${this.formatValue(val, 3)},\n`;
                    });
                    
                    result += `${indent}${indent}}${i < value.length - 1 ? ',' : ','}\n`;
                });
                result += `${indent}],\n`;
            } else if (key === 'base_props') {
                // Base props 格式化
                result += `${indent}"base_props": {\n`;
                
                basePropsOrder.forEach(prop => {
                    if (!(prop in value)) return;
                    
                    const val = value[prop];
                    
                    // 特殊处理带注释的字段
                    if (prop === 'form_submit_style') {
                        result += `${indent}${indent}"${prop}": ${this.formatValue(val, 2)},  # form 页是否展示提交按钮\n`;
                    } else if (prop === 'timeout' && typeof val === 'object') {
                        // Timeout 紧凑格式
                        result += `${indent}${indent}"${prop}": {\n`;
                        Object.keys(val).forEach((key, idx, arr) => {
                            result += `${indent}${indent}${indent}"${key}": ${val[key]}`;
                            result += idx < arr.length - 1 ? ',\n' : '\n';
                        });
                        result += `${indent}${indent}},\n`;
                    } else if (prop === 'submit_style' && val.type) {
                        result += `${indent}${indent}"${prop}": {\n`;
                        result += `${indent}${indent}${indent}'type': '${val.type}',  # 提交类型. alert(弹出)\n`;
                        if (val.alert_content) {
                            result += `${indent}${indent}${indent}'alert_content': "${val.alert_content}",  # 提交时提示文案\n`;
                        }
                        result += `${indent}${indent}},\n`;
                    } else if (prop === 'custom_style') {
                        result += `${indent}${indent}"${prop}": ${this.formatValue(val, 2)}\n`;
                    } else {
                        result += `${indent}${indent}"${prop}": ${this.formatValue(val, 2)},\n`;
                    }
                });
                
                result += `\n${indent}},\n`;
            } else if (key === 'custom_actions') {
                // Custom actions 格式化
                result += `${indent}# 自定义action\n`;
                result += `${indent}"custom_actions": [\n`;
                value.forEach((action, i) => {
                    result += `${indent}${indent}{\n`;
                    
                    const actionOrder = ['action_name', 'label', 'action', 'params', 'location', 'icon', 'config', 'jump'];
                    actionOrder.forEach(prop => {
                        if (!(prop in action)) return;
                        const val = action[prop];
                        result += `${indent}${indent}${indent}"${prop}": ${this.formatValue(val, 3)},\n`;
                    });
                    
                    result += `${indent}${indent}}${i < value.length - 1 ? ',' : ','}\n`;
                });
                result += `${indent}]\n`;
            } else {
                // 普通字段
                result += `${indent}"${key}": ${this.formatValue(value, 1)},\n`;
            }
        });
        
        result += '}\n';
        return result;
    }
    
    formatValue(value, indentLevel) {
        const indent = '    '.repeat(indentLevel);
        
        if (value === null) return 'None';
        if (value === true) return 'True';
        if (value === false) return 'False';
        if (typeof value === 'string') {
            // 处理特殊字符串（如 "关闭"）
            if (value === '关闭') return '"关闭"';
            return `"${value}"`;
        }
        if (typeof value === 'number') return value;
        
        if (Array.isArray(value)) {
            if (value.length === 0) return '[]';
            
            // 检查是否是简单数组（字符串或数字）
            if (value.every(v => typeof v === 'string' || typeof v === 'number')) {
                // 短数组在一行，长数组换行
                // 使用单引号格式化字符串（符合 Python 风格）
                if (JSON.stringify(value).length < 60) {
                    return '[' + value.map(v => typeof v === 'string' ? `'${v}'` : v).join(', ') + ']';
                } else {
                    return '[\n' + indent + '    ' + 
                        value.map(v => typeof v === 'string' ? `'${v}'` : v).join(',\n' + indent + '    ') + 
                        '\n' + indent + ']';
                }
            }
            
            // 元组数组（choices）
            if (value.length > 0 && Array.isArray(value[0])) {
                return '[' + value.map(v => '(' + v.map(x => typeof x === 'string' ? `'${x}'` : x).join(', ') + ')').join(', ') + ']';
            }
            
            // 复杂数组
            return '[\n' + value.map(v => indent + '    ' + this.formatValue(v, indentLevel + 1)).join(',\n') + '\n' + indent + ']';
        }
        
        if (typeof value === 'object') {
            const keys = Object.keys(value);
            if (keys.length === 0) return '{}';
            
            // 检查是否是 copy_rule 的特殊格式 {"开启"} 或空对象 {}
            if (keys.length === 1 && keys[0] === 'status' && value.status === '开启') {
                return '{"开启"}';
            }
            
            // 紧凑对象格式（单行，如 column_filters 中的值）
            if (keys.length <= 3 && keys.every(k => typeof value[k] !== 'object' || Array.isArray(value[k]))) {
                const isSimple = keys.every(k => {
                    const v = value[k];
                    return typeof v === 'string' || typeof v === 'number' || 
                           (Array.isArray(v) && v.length <= 2);
                });
                
                if (isSimple) {
                    const items = keys.map(k => `"${k}": ${this.formatValue(value[k], indentLevel + 1)}`).join(', ');
                    return `{${items}}`;
                }
            }
            
            // 多行对象格式
            let result = '{\n';
            keys.forEach((key, idx, arr) => {
                result += `${indent}${indent}"${key}": ${this.formatValue(value[key], indentLevel + 1)}`;
                result += idx < arr.length - 1 ? ',\n' : '\n';
            });
            result += `${indent}}`;
            return result;
        }
        
        return JSON.stringify(value);
    }
    
    async copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            // fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
    }
    
    showSuccessMessage(message) {
        // 创建成功提示
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 3000;
            font-size: 14px;
            font-weight: 500;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
    }
    
    closeModal() {
        document.getElementById('config-modal').style.display = 'none';
    }
    
    saveBasicConfig() {
        const name = document.getElementById('model-name').value.trim();
        const label = document.getElementById('model-label').value.trim();
        const primaryKey = document.getElementById('primary-key').value.trim();
        const entry = document.getElementById('entry-type').value;
        
        if (!name || !label) {
            alert('请填写必填项（模型名称、显示标签）');
            return;
        }
        
        this.currentModel.name = name;
        this.currentModel.label = label;
        this.currentModel.primary_key = primaryKey;
        this.currentModel.entry = entry;
        
        // 处理父菜单
        const parentSelect = document.getElementById('parent-select').value;
        
        if (parentSelect === '__custom__') {
            // 自定义父菜单
            const parentLabel = document.getElementById('parent-label').value.trim();
            const parentName = document.getElementById('parent-name').value.trim();
            
            if (parentLabel && parentName) {
                this.currentModel.parent = {
                    label: parentLabel,
                    name: parentName
                };
                
                // 添加到父菜单列表（如果不存在）
                const exists = this.parentMenus.some(p => p.name === parentName);
                if (!exists) {
                    this.parentMenus.push({ label: parentLabel, name: parentName });
                }
            } else {
                this.currentModel.parent = '';
            }
        } else if (parentSelect) {
            // 选择已有父菜单
            const selectedParent = this.parentMenus.find(p => p.name === parentSelect);
            if (selectedParent) {
                this.currentModel.parent = {
                    label: selectedParent.label,
                    name: selectedParent.name
                };
            } else {
                this.currentModel.parent = '';
            }
        } else {
            // 无父菜单
            this.currentModel.parent = '';
        }
        
        this.loadParentMenus();
        this.renderLeftModelMenu();
        this.renderLeftModelMenu();
        this.updateConfigSections();
        this.updatePreview();
        this.updateBreadcrumb();
        this.closeModal();
        this.showSuccessMessage('基础配置已保存！');
    }
    
    saveFieldConfig() {
        this.updateConfigSections();
        this.updatePreview();
        this.closeModal();
        this.showSuccessMessage('字段配置已保存！');
    }
    
    saveActionConfig() {
        const actions = [];
        const actionDefs = [
            { id: 'action-list', name: 'list', templateId: 'template-list' },
            { id: 'action-create', name: 'create', templateId: 'template-create' },
            { id: 'action-edit', name: 'edit', templateId: 'template-edit' },
            { id: 'action-delete', name: 'delete', templateId: 'template-delete' },
            { id: 'action-export', name: 'export', templateId: 'template-export' },
            { id: 'action-ajax', name: 'ajax', templateId: 'template-ajax' },
            { id: 'action-chart', name: 'chart', templateId: 'template-chart' }
        ];
        
        actionDefs.forEach(actionDef => {
            const checkbox = document.getElementById(actionDef.id);
            if (checkbox && checkbox.checked) {
                const templateSelect = document.getElementById(actionDef.templateId);
                const template = templateSelect ? templateSelect.value : '';
                actions.push({
                    name: actionDef.name,
                    template: template
                });
            }
        });
        
        this.currentModel.action = actions;
        this.updateConfigSections();
        this.updatePreview();
        this.closeModal();
        this.showSuccessMessage('动作配置已保存！');
    }
    
    saveModel() {
        if (!this.currentModel) return;
        
        // 如果是新模型，添加到模型列表
        const existingIndex = this.models.findIndex(m => m.id === this.currentModel.id);
        if (existingIndex === -1) {
            this.models.push(this.currentModel);
        } else {
            this.models[existingIndex] = this.currentModel;
        }
        
        this.updateModelTable();
        this.renderLeftModelMenu();
        this.showSuccessMessage('模型保存成功！');
    }

    renderLeftModelMenu() {
        this.renderModelTree();
    }
    
    updateActiveModel() {
        // 重置所有模型的激活状态
        document.querySelectorAll('.model-item').forEach(item => {
            item.style.background = '';
            item.classList.remove('active');
        });
        
        // 激活当前选中的模型
        if (this.currentModel) {
            const activeItem = document.querySelector(`[data-model-id="${this.currentModel.id}"]`);
            if (activeItem) {
                activeItem.style.background = 'rgb(110, 182, 172)';
                activeItem.classList.add('active');
            }
        }
    }
    
    renderModelTree() {
        const container = document.getElementById('model-tree-list');
        if (!container) return;
        container.innerHTML = '';
        
        // 获取所有父菜单（从parentMenus和models中合并）
        const modelParents = [...new Set(this.models
            .filter(m => m.parent && m.parent.name)
            .map(m => m.parent)
            .map(p => JSON.stringify(p))
        )].map(p => JSON.parse(p));
        
        // 合并parentMenus和modelParents，去重
        const allParents = [...this.parentMenus];
        modelParents.forEach(modelParent => {
            const exists = allParents.some(p => p.name === modelParent.name);
            if (!exists) {
                allParents.push(modelParent);
            }
        });
        
        const parentMenus = allParents;
        
        // 渲染父菜单及其子模型
        parentMenus.forEach(parent => {
            const parentItem = this.createParentMenuItem(parent);
            container.appendChild(parentItem);
            
            // 添加该父菜单下的子模型
            const childModels = this.models.filter(m => 
                m.parent && m.parent.name === parent.name
            );
            
            const subContainer = document.createElement('div');
            subContainer.id = `parent-models-${parent.name}`;
            subContainer.style.display = 'block';
            subContainer.style.background = 'rgb(225, 241, 239)';
            
            childModels.forEach(model => {
                const modelItem = this.createModelMenuItem(model, true);
                subContainer.appendChild(modelItem);
            });
            
            container.appendChild(subContainer);
        });
        
        // 渲染没有父菜单的模型
        const topLevelModels = this.models.filter(m => !m.parent || !m.parent.name);
        topLevelModels.forEach(model => {
            const item = this.createModelMenuItem(model);
            container.appendChild(item);
        });
        
        // 更新激活状态
        this.updateActiveModel();
    }
    
    createParentMenuItem(parent) {
        const parentItem = document.createElement('div');
        parentItem.className = 'submenu-item parent-menu';
        parentItem.style.cssText = 'position: relative;';
        parentItem.setAttribute('data-parent-name', parent.name);
        
        parentItem.innerHTML = `
            <div style="display: flex; align-items: center; width: 100%; gap: 8px;">
                <div class="menu-icon parent-arrow" style="cursor: pointer;">▼</div>
                <div class="menu-text" style="flex: 1; cursor: pointer;">${parent.label}</div>
                <div class="parent-menu-actions" style="opacity: 0; transition: opacity 0.2s; display: flex; gap: 4px;">
                    <span class="parent-edit-btn" style="cursor: pointer; font-size: 14px;" title="编辑">✏️</span>
                    <span class="parent-delete-btn" style="cursor: pointer; font-size: 14px; color: #ef4444;" title="删除">🗑️</span>
                </div>
            </div>
        `;
        
        // 点击整个父菜单区域展开/折叠（除了编辑和删除按钮）
        parentItem.addEventListener('click', (e) => {
            // 如果点击的是编辑或删除按钮，不触发展开/折叠
            if (e.target.closest('.parent-edit-btn') || e.target.closest('.parent-delete-btn')) {
                return;
            }
            toggleParentSubmenu(parent.name);
        });
        
        // 设置整个父菜单为可点击样式
        parentItem.style.cursor = 'pointer';
        
        // 点击编辑
        const editBtn = parentItem.querySelectorAll('.parent-menu-actions span')[0];
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = this.parentMenus.findIndex(p => p.name === parent.name);
                if (index >= 0) editParentMenuInline(index);
            });
        }
        
        // 点击删除
        const deleteBtn = parentItem.querySelectorAll('.parent-menu-actions span')[1];
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = this.parentMenus.findIndex(p => p.name === parent.name);
                if (index >= 0) removeParentMenu(index);
            });
        }
        
        // 悬停显示操作按钮和改变背景色
        parentItem.addEventListener('mouseenter', () => {
            parentItem.style.background = 'rgb(110, 182, 172)';
            const actions = parentItem.querySelector('.parent-menu-actions');
            if (actions) actions.style.opacity = '1';
        });
        
        parentItem.addEventListener('mouseleave', () => {
            parentItem.style.background = 'rgb(194, 219, 216)';
            const actions = parentItem.querySelector('.parent-menu-actions');
            if (actions) actions.style.opacity = '0';
        });
        
        // 支持拖拽放入
        parentItem.addEventListener('dragover', (e) => {
            e.preventDefault();
            parentItem.style.background = 'rgba(20, 184, 166, 0.2)';
        });
        
        parentItem.addEventListener('dragleave', (e) => {
            parentItem.style.background = 'rgb(194, 219, 216)';
        });
        
        parentItem.addEventListener('drop', (e) => {
            e.preventDefault();
            parentItem.style.background = 'rgb(194, 219, 216)';
            
            const modelId = e.dataTransfer.getData('modelId');
            if (modelId) {
                this.assignModelToParent(modelId, parent);
            }
        });
        
        return parentItem;
    }
    
    createModelMenuItem(model, isChild = false) {
        const item = document.createElement('div');
        item.className = isChild ? 'submenu-item model-item child-model' : 'submenu-item model-item';
        item.style.position = 'relative';
        item.setAttribute('draggable', 'true');
        item.setAttribute('data-model-id', model.id);
        
        item.innerHTML = `
            <div class="menu-icon">📄</div>
            <div class="menu-text">${model.label || model.name || '(未命名)'}</div>
            <div class="model-menu-delete" style="
                opacity: 0;
                transition: opacity 0.2s;
                cursor: pointer;
                padding: 4px;
                color: #ef4444;
                font-size: 16px;
            " title="删除此模型">🗑️</div>
        `;
        
        // 点击模型名切换（不隐藏左侧列表）
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('model-menu-delete') || 
                e.target.closest('.model-menu-delete')) {
                return;
            }
            this.currentModel = model;
            this.showFieldManager();
            this.updateBreadcrumb();
            this.updateActiveModel();
            // 保持父菜单展开
            if (model.parent && model.parent.name) {
                const subContainer = document.getElementById(`parent-models-${model.parent.name}`);
                const parentItem = document.querySelector(`[data-parent-name="${model.parent.name}"]`);
                const arrow = parentItem?.querySelector('.parent-arrow');
                if (subContainer) subContainer.style.display = 'block';
                if (arrow) arrow.textContent = '▼';
            }
        });
        
        // 拖拽事件
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('modelId', model.id);
            item.style.opacity = '0.5';
        });
        
        item.addEventListener('dragend', (e) => {
            item.style.opacity = '1';
        });
        
        // 悬停时显示删除按钮和改变背景色
        item.addEventListener('mouseenter', () => {
            // 只有在不是激活状态时才改变背景色
            if (!item.classList.contains('active')) {
                item.style.background = 'rgb(110, 182, 172)';
            }
            const deleteBtn = item.querySelector('.model-menu-delete');
            if (deleteBtn) deleteBtn.style.opacity = '1';
        });
        
        item.addEventListener('mouseleave', () => {
            // 只有在不是激活状态时才恢复背景色
            if (!item.classList.contains('active')) {
                item.style.background = '';
            }
            const deleteBtn = item.querySelector('.model-menu-delete');
            if (deleteBtn) deleteBtn.style.opacity = '0';
        });
        
        // 删除按钮点击事件
        const deleteBtn = item.querySelector('.model-menu-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.currentModel = model;
                deleteCurrentModel();
            });
        }
        
        return item;
    }
    
    
    assignModelToParent(modelId, parent) {
        const model = this.models.find(m => m.id == modelId);
        if (!model) return;
        
        model.parent = {
            label: parent.label,
            name: parent.name
        };
        
        // 更新界面
        this.renderLeftModelMenu();
        
        // 如果是当前模型，更新面包屑
        if (this.currentModel && this.currentModel.id == modelId) {
            this.updateBreadcrumb();
        }
        
        this.showSuccessMessage(`模型 "${model.label}" 已移动到 "${parent.label}" 下`);
    }
    
    openParentMenuModal(editIndex = null) {
        const modal = document.getElementById('config-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        const isEdit = editIndex !== null;
        const parent = isEdit ? this.parentMenus[editIndex] : null;
        
        modalTitle.textContent = isEdit ? '编辑父菜单' : '添加父菜单';
        modalBody.innerHTML = `
            <form id="parent-menu-form">
                <div class="form-group">
                    <label class="form-label">父菜单标签 (label) *</label>
                    <input type="text" class="form-input" id="parent-label" 
                           value="${parent ? parent.label : ''}" 
                           placeholder="例如: 系统管理">
                    <small style="color: #6b7280; font-size: 12px;">显示在菜单上的名称</small>
                </div>
                
                <div class="form-group">
                    <label class="form-label">父菜单名称 (name) *</label>
                    <input type="text" class="form-input" id="parent-name" 
                           value="${parent ? parent.name : ''}" 
                           placeholder="例如: system">
                    <small style="color: #6b7280; font-size: 12px;">英文标识，用于配置</small>
                </div>
                
                <div style="padding: 12px; background: #f0fdf4; border: 1px solid #22c55e; border-radius: 6px; margin-top: 16px;">
                    <p style="margin: 0; color: #166534; font-size: 12px; line-height: 1.6;">
                        ✅ ${isEdit ? '修改后，使用此父菜单的所有模型将自动更新' : '添加后，在模型的基础配置中可以选择此父菜单'}
                    </p>
                </div>
                
                <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                    <button type="button" class="btn btn-primary" onclick="adminSystem.saveParentMenu(${editIndex})">${isEdit ? '保存修改' : '添加'}</button>
                </div>
            </form>
        `;
        
        modal.style.display = 'flex';
    }
    
    saveParentMenu(editIndex = null) {
        const label = document.getElementById('parent-label').value.trim();
        const name = document.getElementById('parent-name').value.trim();
        
        if (!label || !name) {
            alert('请填写完整的父菜单信息！');
            return;
        }
        
        const isEdit = editIndex !== null;
        
        if (isEdit) {
            // 编辑模式
            const oldParent = this.parentMenus[editIndex];
            this.parentMenus[editIndex] = { label, name };
            
            // 更新使用此父菜单的所有模型
            this.models.forEach(model => {
                if (model.parent && model.parent.name === oldParent.name) {
                    model.parent = { label, name };
                }
            });
            
            this.closeModal();
            this.renderLeftModelMenu();
            this.showSuccessMessage(`父菜单 "${label}" 已更新！`);
        } else {
            // 添加模式
            // 检查是否已存在
            const exists = this.parentMenus.some(p => p.name === name);
            if (exists) {
                alert('该父菜单名称已存在！');
                return;
            }
            
            // 添加到列表
            this.parentMenus.push({ label, name });
            this.closeModal();
            this.renderLeftModelMenu();
            this.showSuccessMessage(`父菜单 "${label}" 已添加！`);
        }
    }


}

// 导出到全局
window.AdminSystem = AdminSystem;
