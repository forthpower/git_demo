// 后台管理系统 JavaScript - 模型管理版本
// 全局函数
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

function toggleSubmenu(element) {
    const submenu = element.nextElementSibling;
    const arrow = element.querySelector('.menu-arrow');
    
    if (submenu && submenu.classList.contains('submenu')) {
        submenu.classList.toggle('show');
        element.classList.toggle('expanded');
    }
}

function showModelList() {
    adminSystem.showModelList();
}

function showFieldManager() {
    adminSystem.showFieldManager();
}

function openBasicConfig() {
    adminSystem.openBasicConfig();
}

function openNewModelBaseConfig() {
    // 新建模型并显示基础配置弹窗
    adminSystem.addNewModel(false);
    adminSystem.openBasicConfig();
}

function deleteCurrentModel() {
    if (!adminSystem.currentModel) {
        alert('当前没有选中的模型！');
        return;
    }
    
    const modelName = adminSystem.currentModel.label || adminSystem.currentModel.name;
    const modelId = adminSystem.currentModel.id;
    
    // 确认删除
    if (!confirm(`确定要删除模型 "${modelName}" 吗？\n\n此操作不可恢复！`)) {
        return;
    }
    
    // 二次确认
    if (!confirm(`最后确认：真的要删除模型 "${modelName}" 及其所有配置吗？`)) {
        return;
    }
    
    // 从列表中移除
    adminSystem.models = adminSystem.models.filter(m => m.id !== modelId);
    
    // 如果模型已保存到数据库，也需要删除
    if (modelId && !isNaN(modelId) && modelId < Date.now() - 1000000000) {
        // 调用后端删除接口
        fetch(`/api/models/${modelId}`, {
            method: 'DELETE'
        }).then(response => {
            if (response.ok) {
                console.log('模型已从数据库删除');
            }
        }).catch(error => {
            console.error('删除数据库记录失败:', error);
        });
    }
    
    // 清空当前模型
    adminSystem.currentModel = null;
    
    // 更新父菜单列表
    adminSystem.loadParentMenus();
    adminSystem.renderLeftModelMenu();
    
    // 更新界面
    adminSystem.renderLeftModelMenu();
    adminSystem.showModelList();
    
    // 显示成功消息
    adminSystem.showSuccessMessage(`模型 "${modelName}" 已删除！`);
}

function toggleParentSubmenu(parentName) {
    const subContainer = document.getElementById(`parent-models-${parentName}`);
    const parentItem = document.querySelector(`[data-parent-name="${parentName}"]`);
    const arrow = parentItem?.querySelector('.menu-icon');
    
    if (subContainer) {
        if (subContainer.style.display === 'none') {
            subContainer.style.display = 'block';
            if (arrow) arrow.textContent = '▼';
        } else {
            subContainer.style.display = 'none';
            if (arrow) arrow.textContent = '▶';
        }
    }
}

function openParentMenuModal(editIndex = null) {
    adminSystem.openParentMenuModal(editIndex);
}

function addParentMenuQuick() {
    adminSystem.openParentMenuModal();
}

function editParentMenuInline(index) {
    adminSystem.openParentMenuModal(index);
}

function removeParentMenu(index) {
    const parent = adminSystem.parentMenus[index];
    
    // 检查是否有模型在使用
    const usingModels = adminSystem.models.filter(m => 
        m.parent && m.parent.name === parent.name
    );
    
    if (usingModels.length > 0) {
        const modelNames = usingModels.map(m => m.label || m.name).join('、');
        if (!confirm(`以下模型正在使用此父菜单：\n${modelNames}\n\n删除后这些模型将移到一级菜单。\n\n确认删除吗？`)) {
            return;
        }
        
        // 清除这些模型的父菜单
        usingModels.forEach(model => {
            model.parent = '';
        });
    }
    
    adminSystem.parentMenus.splice(index, 1);
    adminSystem.renderLeftModelMenu();
    adminSystem.renderLeftModelMenu();
    adminSystem.showSuccessMessage(`父菜单 "${parent.label}" 已删除！`);
}

async function autoSyncSchemas() {
    // 收集所有有源文件路径的模型
    const modelsToSync = adminSystem.models.filter(m => m.source_file);
    
    if (modelsToSync.length === 0) {
        alert('没有可同步的模型！\n\n只有通过"批量导入(文件夹)"功能导入的模型才能自动同步。');
        return;
    }
    
    const confirmMsg = `准备同步 ${modelsToSync.length} 个模型到源文件：\n\n${modelsToSync.map(m => `• ${m.label || m.name} → ${m.source_file}`).join('\n')}\n\n确定要执行同步吗？`;
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    try {
        // 显示加载提示
        const loadingToast = document.createElement('div');
        loadingToast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3b82f6;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 3000;
            font-size: 14px;
            font-weight: 500;
        `;
        loadingToast.textContent = `正在同步 ${modelsToSync.length} 个模型...`;
        document.body.appendChild(loadingToast);
        
        // 为每个模型生成 schema
        const syncData = modelsToSync.map(model => {
            // 生成该模型的 schema
            const schemaObj = adminSystem.buildSchemaObject(model);
            const schemaContent = adminSystem.formatJSON(schemaObj);
            
            return {
                file_path: model.source_file,
                schema_content: schemaContent,
                model_name: model.name
            };
        });
        
        const response = await fetch('/api/auto_sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sync_data: syncData
            })
        });
        
        document.body.removeChild(loadingToast);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '同步失败');
        }
        
        const result = await response.json();
        
        // 显示成功消息
        let message = `✅ 同步完成！\n\n`;
        message += `成功: ${result.success_count || 0} 个\n`;
        if (result.failed_count > 0) {
            message += `失败: ${result.failed_count} 个\n`;
        }
        if (result.details) {
            message += `\n详情:\n${result.details.join('\n')}`;
        }
        
        alert(message);
        
    } catch (error) {
        console.error('自动同步失败:', error);
        alert('自动同步失败: ' + error.message);
    }
}

function openImportModelDialog() {
    // 打开导入模型对话框
    const modal = document.getElementById('config-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = '从文件导入模型';
    modalBody.innerHTML = `
        <div style="margin-bottom: 20px;">
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 8px 0; color: #0369a1; font-size: 14px;">📋 支持的导入方式</h4>
                <ul style="margin: 0; padding-left: 20px; color: #0c4a6e; font-size: 13px; line-height: 1.8;">
                    <li><strong>单文件导入</strong> - 支持 Python Model、SQL DDL、JSON Schema</li>
                    <li><strong>批量导入 (文件夹)</strong> - 批量导入文件夹中的所有 .py schema 文件，自动识别父菜单</li>
                </ul>
            </div>
            
            <!-- 导入方式选择 -->
            <div class="form-group">
                <label class="form-label">导入方式</label>
                <select class="form-input" id="import-mode" onchange="toggleImportMode()">
                    <option value="single">单文件导入</option>
                    <option value="folder">批量导入 (文件夹)</option>
                </select>
            </div>
            
            <!-- 单文件导入 -->
            <div id="single-file-import" style="display: block;">
                <div class="form-group">
                    <label class="form-label">选择文件类型</label>
                    <select class="form-input" id="import-file-type">
                        <option value="auto">自动识别</option>
                        <option value="python">Python Model (SQLAlchemy/Django)</option>
                        <option value="sql">SQL DDL (CREATE TABLE)</option>
                        <option value="json">JSON Schema</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">上传文件或粘贴内容</label>
                    <input type="file" class="form-input" id="import-file-input" accept=".py,.sql,.json,.txt" style="margin-bottom: 12px;">
                    <small style="display: block; color: #6b7280; font-size: 12px; margin-bottom: 8px;">或直接粘贴模型定义到下方文本框：</small>
                    <textarea class="form-input" id="import-content" rows="15" placeholder="粘贴您的模型定义...

示例 1 - Python SQLAlchemy Model:
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, comment='用户名')
    email = db.Column(db.String(120), nullable=False, comment='邮箱')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

示例 2 - SQL DDL:
CREATE TABLE user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(80) NOT NULL COMMENT '用户名',
    email VARCHAR(120) NOT NULL COMMENT '邮箱',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

示例 3 - JSON Schema:
{
  &quot;title&quot;: &quot;User&quot;,
  &quot;properties&quot;: {
    &quot;username&quot;: {&quot;type&quot;: &quot;string&quot;, &quot;title&quot;: &quot;用户名&quot;},
    &quot;email&quot;: {&quot;type&quot;: &quot;string&quot;, &quot;title&quot;: &quot;邮箱&quot;}
  }
}"></textarea>
                </div>
            </div>
            
            <!-- 文件夹批量导入 -->
            <div id="folder-import" style="display: none;">
                <div class="form-group">
                    <label class="form-label">文件夹路径</label>
                    <input type="text" class="form-input" id="folder-path" placeholder="/path/to/your/schemas" 
                           style="font-family: monospace;">
                    <small style="display: block; color: #6b7280; font-size: 12px; margin-top: 4px;">
                        输入包含 schema .py 文件的文件夹绝对路径，系统将自动扫描所有 .py 文件并解析
                    </small>
                </div>
                
                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px; margin-top: 12px;">
                    <h5 style="margin: 0 0 6px 0; color: #92400e; font-size: 13px;">⚠️ 注意事项</h5>
                    <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 12px; line-height: 1.6;">
                        <li>文件夹中的所有 .py 文件必须包含 <code>schema = {...}</code> 格式的配置</li>
                        <li>系统会自动识别 schema 中的 <code>parent</code> 字段并创建父菜单</li>
                        <li>相同 parent name 的模型会自动归类到同一父菜单下</li>
                        <li>请确保服务器有权限访问该文件夹</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
            <button type="button" class="btn btn-primary" id="import-btn" onclick="importModel()">
                <span>🚀</span>
                <span id="import-btn-text">导入并解析</span>
            </button>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    // 文件选择事件
    document.getElementById('import-file-input').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('import-content').value = event.target.result;
            };
            reader.readAsText(file);
        }
    });
}

function toggleImportMode() {
    const mode = document.getElementById('import-mode').value;
    const singleImport = document.getElementById('single-file-import');
    const folderImport = document.getElementById('folder-import');
    const btnText = document.getElementById('import-btn-text');
    
    if (mode === 'folder') {
        singleImport.style.display = 'none';
        folderImport.style.display = 'block';
        btnText.textContent = '批量导入';
    } else {
        singleImport.style.display = 'block';
        folderImport.style.display = 'none';
        btnText.textContent = '导入并解析';
    }
}

async function importModel() {
    const mode = document.getElementById('import-mode').value;
    
    // 文件夹批量导入模式
    if (mode === 'folder') {
        const folderPath = document.getElementById('folder-path').value.trim();
        
        if (!folderPath) {
            alert('请输入文件夹路径！');
            return;
        }
        
        try {
            // 显示加载状态
            const importBtn = document.getElementById('import-btn');
            const originalText = importBtn.innerHTML;
            importBtn.innerHTML = '<span>⏳</span><span>批量导入中...</span>';
            importBtn.disabled = true;
            
            // 调用后端批量导入接口
            const response = await fetch('/api/import_folder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    folder_path: folderPath
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // 关闭模态框
                closeModal();
                
                // 导入所有父菜单
                if (result.parent_menus && result.parent_menus.length > 0) {
                    result.parent_menus.forEach(parent => {
                        const exists = adminSystem.parentMenus.some(p => p.name === parent.name);
                        if (!exists) {
                            adminSystem.parentMenus.push(parent);
                        }
                    });
                }
                
                // 导入所有模型
                let importCount = 0;
                if (result.schemas && result.schemas.length > 0) {
                    result.schemas.forEach(schema => {
                        // 为每个字段添加唯一 ID
                        schema.fields = schema.fields.map(f => ({
                            ...f,
                            id: Date.now() + Math.random()
                        }));
                        
                        // 创建新模型，保存源文件路径用于自动同步
                        const newModel = {
                            id: Date.now() + Math.random(),
                            ...schema,
                            createdAt: new Date().toISOString().split('T')[0],
                            source_file: schema.source_file || null,  // 保存源文件路径
                            source_folder: folderPath  // 保存源文件夹路径
                        };
                        
                        adminSystem.models.push(newModel);
                        importCount++;
                    });
                }
                
                // 刷新UI
                adminSystem.renderLeftModelMenu();
                adminSystem.showSuccessMessage(`批量导入成功！导入了 ${result.parent_menus.length} 个父菜单和 ${importCount} 个模型`);
            } else {
                alert('导入失败: ' + (result.error || '未知错误'));
            }
            
            importBtn.innerHTML = originalText;
            importBtn.disabled = false;
            
        } catch (error) {
            console.error('批量导入失败:', error);
            alert('批量导入失败: ' + error.message);
            
            const importBtn = document.getElementById('import-btn');
            importBtn.innerHTML = '<span>🚀</span><span>批量导入</span>';
            importBtn.disabled = false;
        }
        
        return;
    }
    
    // 单文件导入模式（原有逻辑）
    const content = document.getElementById('import-content').value.trim();
    const fileType = document.getElementById('import-file-type').value;
    
    if (!content) {
        alert('请上传文件或粘贴模型定义！');
        return;
    }
    
    try {
        // 显示加载状态
        const importBtn = event.target.closest('button');
        const originalText = importBtn.innerHTML;
        importBtn.innerHTML = '<span>⏳</span><span>解析中...</span>';
        importBtn.disabled = true;
        
        // 调用后端解析接口
        const response = await fetch('/api/parse_model', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: content,
                file_type: fileType
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 关闭模态框
            closeModal();
            
            let importedModels = [];
            
            // 处理多个模型或单个模型
            if (result.is_multiple && result.schemas) {
                // 多个模型
                for (const schema of result.schemas) {
                    // 为每个字段添加唯一 ID
                    schema.fields = schema.fields.map(f => ({
                        ...f,
                        id: Date.now() + Math.random()
                    }));
                    
                    // 创建新模型
                    const newModel = {
                        id: Date.now() + Math.random(),
                        ...schema,
                        createdAt: new Date().toISOString().split('T')[0],
                        status: 'active'
                    };
                    
                    // 添加到模型列表
                    adminSystem.models.push(newModel);
                    importedModels.push(newModel);
                }
                
                // 设置最后一个为当前模型
                if (importedModels.length > 0) {
                    adminSystem.currentModel = importedModels[importedModels.length - 1];
                }
                
                // 更新父菜单列表
                adminSystem.loadParentMenus();
                adminSystem.renderLeftModelMenu();
                
                // 更新界面
                adminSystem.renderLeftModelMenu();
                adminSystem.showFieldManager();
                adminSystem.updateBreadcrumb();
                
                // 显示成功消息
                adminSystem.showSuccessMessage(
                    `🎉 成功导入 ${importedModels.length} 个模型！`
                );
                
                // 显示详细信息
                setTimeout(() => {
                    const modelList = importedModels.map((m, i) => 
                        `${i + 1}. ${m.label} - ${m.fields.length} 个字段`
                    ).join('\n');
                    
                    alert(`成功导入 ${importedModels.length} 个模型！\n\n${modelList}\n\n您可以在左侧菜单中切换查看和编辑每个模型。`);
                }, 500);
                
            } else if (result.schema) {
                // 单个模型
                const schema = result.schema;
                
                // 为每个字段添加唯一 ID
                schema.fields = schema.fields.map(f => ({
                    ...f,
                    id: Date.now() + Math.random()
                }));
                
                // 创建新模型
                const newModel = {
                    id: Date.now(),
                    ...schema,
                    createdAt: new Date().toISOString().split('T')[0],
                    status: 'active'
                };
                
                // 添加到模型列表
                adminSystem.models.push(newModel);
                
                // 设置为当前模型
                adminSystem.currentModel = newModel;
                
                // 更新父菜单列表
                adminSystem.loadParentMenus();
                adminSystem.renderLeftModelMenu();
                
                // 更新界面
                adminSystem.renderLeftModelMenu();
                adminSystem.showFieldManager();
                adminSystem.updateBreadcrumb();
                
                // 显示成功消息
                adminSystem.showSuccessMessage(`成功导入模型 "${schema.label}"，包含 ${schema.fields.length} 个字段！`);
                
                // 提示用户可以进行修改
                setTimeout(() => {
                    if (confirm('模型已成功导入！\n\n您可以在当前页面查看和修改字段配置、动作配置等。\n\n是否现在查看基础配置？')) {
                        adminSystem.openBasicConfig();
                    }
                }, 500);
            } else {
                throw new Error('解析结果为空');
            }
        } else {
            throw new Error(result.error || '解析失败');
        }
    } catch (error) {
        console.error('导入失败:', error);
        alert('导入失败：' + error.message + '\n\n请检查文件格式是否正确。');
        
        // 恢复按钮状态
        const importBtn = event.target.closest('button');
        if (importBtn) {
            importBtn.innerHTML = '<span>🚀</span><span>导入并解析</span>';
            importBtn.disabled = false;
        }
    }
}

function openFieldConfig() {
    adminSystem.openFieldConfig();
}

function openActionConfig() {
    adminSystem.openActionConfig();
}

function openBasePropsConfig() {
    adminSystem.openBasePropsConfig();
}

function openCustomActionsConfig() {
    adminSystem.openCustomActionsConfig();
}

function generateAndCopy() {
    adminSystem.generateAndCopy();
}

function closeModal() {
    adminSystem.closeModal();
}

function onParentSelectChange() {
    const parentSelect = document.getElementById('parent-select');
    const customInputs = document.getElementById('custom-parent-inputs');
    
    if (parentSelect.value === '__custom__') {
        customInputs.style.display = 'block';
    } else {
        customInputs.style.display = 'none';
    }
}

function saveBasicConfig() {
    adminSystem.saveBasicConfig();
}

function saveFieldConfig() {
    adminSystem.saveFieldConfig();
}

function saveActionConfig() {
    adminSystem.saveActionConfig();
}

function saveBasePropsConfig() {
    const helper = (id) => document.getElementById(id)?.value.trim();
    const helperNum = (id) => {
        const val = document.getElementById(id)?.value;
        return val ? parseInt(val) : undefined;
    };
    const helperJSON = (id) => {
        const val = helper(id);
        if (!val) return undefined;
        try { return JSON.parse(val); } catch(e) { return undefined; }
    };
    
    // 辅助函数：从多选框获取选中的字段
    const getSelectedFields = (selectId) => {
        const checkboxes = document.querySelectorAll(`input.field-checkbox[data-select-id="${selectId}"]:checked`);
        return Array.from(checkboxes).map(cb => cb.value);
    };
    
    // 辅助函数：获取过滤器配置
    const getFilterConfig = (filterType) => {
        const result = {};
        const fieldCheckboxes = document.querySelectorAll(`input.filter-field-checkbox[data-filter-type="${filterType}"]:checked`);
        
        fieldCheckboxes.forEach(fieldCb => {
            const fieldName = fieldCb.value;
            const operatorCheckboxes = document.querySelectorAll(`input.filter-operator-checkbox[data-field="${fieldName}"][data-filter-type="${filterType}"]:checked`);
            const operators = Array.from(operatorCheckboxes).map(cb => cb.value);
            
            if (operators.length > 0) {
                result[fieldName] = operators;
            }
        });
        
        return result;
    };
    
    const baseProps = {};
    
    // 字段列表配置 - 从多选框读取
    const columnList = getSelectedFields('bp-column-list');
    if (columnList.length > 0) baseProps.column_list = columnList;
    
    const formColumns = getSelectedFields('bp-form-columns');
    if (formColumns.length > 0) baseProps.form_columns = formColumns;
    
    const editFormColumns = getSelectedFields('bp-edit-form-columns');
    if (editFormColumns.length > 0) baseProps.edit_form_columns = editFormColumns;
    
    const ajaxFormColumns = getSelectedFields('bp-ajax-form-columns');
    if (ajaxFormColumns.length > 0) baseProps.ajax_form_columns = ajaxFormColumns;
    
    const filterFormColumns = getSelectedFields('bp-filter-form-columns');
    if (filterFormColumns.length > 0) baseProps.filter_form_columns = filterFormColumns;
    
    const columnDetails = getSelectedFields('bp-column-details');
    if (columnDetails.length > 0) baseProps.column_details_list = columnDetails;
    
    const columnEditable = getSelectedFields('bp-column-editable');
    if (columnEditable.length > 0) baseProps.column_editable_list = columnEditable;
    
    const columnSortable = getSelectedFields('bp-column-sortable');
    if (columnSortable.length > 0) baseProps.column_sortable_list = columnSortable;
    
    const exportList = getSelectedFields('bp-export-list');
    if (exportList.length > 0) baseProps.export_list = exportList;
    
    // 搜索过滤配置 - 从多选框读取
    const columnFilters = getFilterConfig('column');
    if (Object.keys(columnFilters).length > 0) baseProps.column_filters = columnFilters;
    
    const formFilters = getFilterConfig('form');
    if (Object.keys(formFilters).length > 0) baseProps.form_filters = formFilters;
    
    // 页面配置
    const pageSize = helperNum('bp-page-size');
    if (pageSize) baseProps.page_size = pageSize;
    
    const importSize = helperNum('bp-import-size');
    if (importSize) baseProps.import_size = importSize;
    
    const explain = helper('bp-explain');
    if (explain) baseProps.explain = explain;
    
    const submitJumpEdit = helper('bp-submit-jump-edit');
    if (submitJumpEdit) baseProps.submit_jump_edit = submitJumpEdit;
    
    const timeout = helperJSON('bp-timeout');
    if (timeout && typeof timeout === 'object' && Object.keys(timeout).length > 0) {
        // 验证每个超时值不超过120秒
        const validatedTimeout = {};
        let hasInvalid = false;
        
        Object.keys(timeout).forEach(key => {
            const value = parseInt(timeout[key]);
            if (value > 120) {
                validatedTimeout[key] = 120;
                hasInvalid = true;
            } else if (value < 1) {
                validatedTimeout[key] = 1;
                hasInvalid = true;
            } else {
                validatedTimeout[key] = value;
            }
        });
        
        if (hasInvalid) {
            alert('超时配置值必须在1-120秒之间，已自动调整超出范围的值');
        }
        
        baseProps.timeout = validatedTimeout;
    }
    
    // 样式配置
    const customStyle = {};
    
    const detailStyle = helper('bp-detail-style');
    if (detailStyle && detailStyle !== 'none') customStyle.detail_style = detailStyle;
    
    const formSubmitStyle = helper('bp-form-submit-style');
    if (formSubmitStyle) customStyle.form_submit_style = formSubmitStyle;
    
    const fieldStyle = helper('bp-field-style');
    if (fieldStyle) customStyle.field_style = fieldStyle;
    
    const editableListStyle = helper('bp-editable-list-style');
    if (editableListStyle) customStyle.editable_list_style = editableListStyle;
    
    const submitJump = helper('bp-submit-jump');
    if (submitJump) customStyle.submit_jump = submitJump;
    
    const submitAlert = document.getElementById('bp-submit-alert')?.checked;
    if (submitAlert) customStyle.submit_alert = true;
    
    const detailLabelWidth = helperNum('bp-detail-label-width');
    if (detailLabelWidth) customStyle.detail_label_width = detailLabelWidth;
    
    const formLabelWidth = helperNum('bp-form-label-width');
    if (formLabelWidth) customStyle.form_label_width = formLabelWidth;
    
    const operationWidth = helperNum('bp-operation-width');
    if (operationWidth) customStyle.operation_width = operationWidth;
    
    const tableHeight = helperNum('bp-table-height');
    if (tableHeight) customStyle.table_height = tableHeight;
    
    const tableColumnFixed = helperNum('bp-table-column-fixed');
    if (tableColumnFixed) customStyle.table_column_fixed = tableColumnFixed;
    
    if (Object.keys(customStyle).length > 0) {
        baseProps.custom_style = customStyle;
    }
    
    // 前端搜索配置 (filter_style)
    const filterType = helper('bp-filter-type');
    const filterAll = document.getElementById('bp-filter-all')?.checked;
    if (filterType || filterAll) {
        baseProps.filter_style = {};
        if (filterType) baseProps.filter_style.filter_type = filterType;
        if (filterAll) baseProps.filter_style.filter_all = true;
    }
    
    // 编辑提交设置 (submit_style)
    const submitType = helper('bp-submit-type');
    const alertContent = helper('bp-alert-content');
    if (submitType || alertContent) {
        baseProps.submit_style = {};
        if (submitType) baseProps.submit_style.type = submitType;
        if (alertContent) baseProps.submit_style.alert_content = alertContent;
    }
    
    adminSystem.currentModel.base_props = baseProps;
    adminSystem.updateConfigSections();
    adminSystem.closeModal();
    adminSystem.showSuccessMessage('Base Props 配置已保存！');
}

function saveCustomActionsConfig() {
    // custom_actions 在 addCustomAction 中已经动态更新
    adminSystem.closeModal();
    adminSystem.showSuccessMessage('Custom Actions 配置已保存！');
}

function addCustomAction() {
    // TODO: 实现添加自定义动作的界面
    alert('此功能将在下一步实现');
}

function editCustomAction(index) {
    // TODO: 实现编辑自定义动作的界面
    alert('此功能将在下一步实现');
}

function removeCustomAction(index) {
    if (!confirm('确认删除该自定义动作？')) return;
    adminSystem.currentModel.custom_actions.splice(index, 1);
    adminSystem.openCustomActionsConfig();
}

// 字段管理相关函数
function addField() {
    if (!adminSystem.currentModel) {
        alert('请先选择或创建一个模型');
        return;
    }
    
    const modal = document.getElementById('config-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = '添加字段';
    
    // 使用 adminSystem 而不是 this
    const currentFields = adminSystem.currentModel.fields || [];
    const fieldOptions = currentFields.map(f => `<option value="${f.name}">${f.label} (${f.name})</option>`).join('');
    
    modalBody.innerHTML = `
        <form id="add-field-form">
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">字段名称 (name) *</label>
                    <input type="text" class="form-input" id="field-name" placeholder="例如: user_id">
                </div>
                <div class="form-group">
                    <label class="form-label">显示标签 (label) *</label>
                    <input type="text" class="form-input" id="field-label" placeholder="例如: 用户ID">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">字段类型 (type) *</label>
                <select class="form-input" id="field-type" onchange="onFieldTypeChange(this.value)">
                    <optgroup label="基础类型">
                        <option value="String">String - 字符串</option>
                        <option value="Integer">Integer - 整数</option>
                        <option value="Float">Float - 浮点数</option>
                        <option value="Boolean">Boolean - 布尔值</option>
                        <option value="DateTime">DateTime - 日期时间</option>
                    </optgroup>
                    <optgroup label="文本类型">
                        <option value="TextArea">TextArea - 多行文本</option>
                        <option value="Editor">Editor - 富文本编辑器</option>
                    </optgroup>
                    <optgroup label="选择类型">
                        <option value="Select">Select - 单选下拉</option>
                        <option value="SelectMulti">SelectMulti - 多选下拉</option>
                        <option value="Radio">Radio - 单选按钮</option>
                    </optgroup>
                    <optgroup label="文件类型">
                        <option value="File">File - 单文件上传</option>
                        <option value="FileMulti">FileMulti - 多文件上传</option>
                        <option value="Image">Image - 单图片上传</option>
                        <option value="ImageMulti">ImageMulti - 多图片上传</option>
                    </optgroup>
                    <optgroup label="关联类型">
                        <option value="LinkString">LinkString - 链接跳转</option>
                        <option value="LinkForm">LinkForm - 关联表单</option>
                        <option value="InlineModel">InlineModel - 内联模型</option>
                    </optgroup>
                    <optgroup label="高级类型">
                        <option value="Json">Json - JSON数据</option>
                        <option value="JsonEditor">JsonEditor - JSON编辑器</option>
                        <option value="Calculation">Calculation - 计算字段</option>
                        <option value="SourceForm">SourceForm - 动态表单</option>
                    </optgroup>
                </select>
            </div>
            
            <!-- 字段类型特定配置 -->
            <div id="field-type-specific" style="display: none;"></div>
            
            <button type="button" class="toggle-advanced" onclick="toggleAdvancedOptions()">
                显示高级选项
            </button>
            
            <div id="advanced-options" class="advanced-options" style="padding-top: 8px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                    <div>
                        <label style="font-size: 12px; color: #374151; font-weight: 500; display: block; margin-bottom: 4px;">说明 (explain)</label>
                        <input type="text" class="form-input" id="field-explain" placeholder="字段说明" style="font-size: 13px; padding: 6px 10px;">
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #374151; font-weight: 500; display: block; margin-bottom: 4px;">占位符 (placeholder)</label>
                        <input type="text" class="form-input" id="field-placeholder" placeholder="占位符" style="font-size: 13px; padding: 6px 10px;">
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #374151; font-weight: 500; display: block; margin-bottom: 4px;">默认值 (default)</label>
                        <input type="text" class="form-input" id="field-default" placeholder="默认值" style="font-size: 13px; padding: 6px 10px;">
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px; margin-bottom: 12px;">
                    <div>
                        <label style="font-size: 12px; color: #374151; font-weight: 500; display: block; margin-bottom: 4px;">宽度px (width)</label>
                        <input type="number" class="form-input" id="field-width" placeholder="120" style="font-size: 13px; padding: 6px 10px;">
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #374151; font-weight: 500; display: block; margin-bottom: 4px;">数据来源 (source)</label>
                        <input type="text" class="form-input" id="field-source" placeholder="动态数据URL" style="font-size: 13px; padding: 6px 10px;">
                    </div>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 12px; color: #374151; font-weight: 500; display: block; margin-bottom: 6px;">渲染选项 (render_kw)</label>
                    <div style="display: flex; gap: 16px;">
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer;">
                            <input type="checkbox" id="field-readonly">
                            只读 (readonly)
                        </label>
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer;">
                            <input type="checkbox" id="field-createonly">
                            仅创建时可见 (createonly)
                        </label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">显示规则 (show_rule)</label>
                    <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; background: #f9fafb;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                            <div>
                                <label style="font-size: 12px; color: #6b7280; display: block; margin-bottom: 4px;">关联字段</label>
                                <select class="form-input" id="show-rule-field" style="font-size: 13px;">
                                    <option value="">不设置</option>
                                    ${fieldOptions}
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 12px; color: #6b7280; display: block; margin-bottom: 4px;">匹配方式</label>
                                <select class="form-input" id="show-rule-match" style="font-size: 13px;">
                                    <option value="value">等于 (value)</option>
                                    <option value="contain">包含 (contain)</option>
                                </select>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <div>
                                <label style="font-size: 12px; color: #6b7280; display: block; margin-bottom: 4px;">匹配值</label>
                                <input type="text" class="form-input" id="show-rule-value" placeholder="输入值" style="font-size: 13px;">
                            </div>
                            <div>
                                <label style="font-size: 12px; color: #6b7280; display: block; margin-bottom: 4px;">执行动作</label>
                                <select class="form-input" id="show-rule-action" style="font-size: 13px;">
                                    <option value="true">隐藏字段 (hideis: true)</option>
                                    <option value="false">显示字段 (hideis: false)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <small style="color: #6b7280; font-size: 12px; display: block; margin-top: 4px;">控制字段根据其他字段值的显示/隐藏</small>
                </div>
                
                <div class="form-group">
                    <label class="form-label">复制规则 (copy_rule)</label>
                    <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; background: #f9fafb;">
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="radio" name="copy-rule" value="开启" checked>
                                <span style="font-size: 13px;">可复制无按钮 (默认)</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="radio" name="copy-rule" value="with-button">
                                <span style="font-size: 13px;">可复制有按钮 (显示复制按钮 🔗)</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="radio" name="copy-rule" value="关闭">
                                <span style="font-size: 13px;">不可复制 (字体变灰)</span>
                            </label>
                        </div>
                    </div>
                    <small style="color: #6b7280; font-size: 11px; display: block; margin-top: 3px;">配置字段的复制链接功能，默认可复制无按钮</small>
                </div>
                
                <div class="form-group">
                    <label class="form-label">提示折叠 (tooltip)</label>
                    <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; background: #f9fafb;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                            <div>
                                <label style="font-size: 12px; color: #6b7280; display: block; margin-bottom: 3px;">弹窗宽度 (width)</label>
                                <input type="number" class="form-input" id="tooltip-width" placeholder="900" style="font-size: 13px; padding: 6px;">
                            </div>
                            <div>
                                <label style="font-size: 12px; color: #6b7280; display: block; margin-bottom: 3px;">触发方式 (trigger)</label>
                                <select class="form-input" id="tooltip-trigger" style="font-size: 13px; padding: 6px;">
                                    <option value="hover">hover - 鼠标移入</option>
                                    <option value="click">click - 点击</option>
                                    <option value="focus">focus - 持续点击</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 12px; color: #6b7280; display: block; margin-bottom: 3px;">字符数 (length)</label>
                                <input type="number" class="form-input" id="tooltip-length" placeholder="100" style="font-size: 13px; padding: 6px;">
                            </div>
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #6b7280; display: block; margin-bottom: 3px;">展示行数 (row)</label>
                            <input type="number" class="form-input" id="tooltip-row" placeholder="不限制" style="font-size: 13px; padding: 6px;">
                        </div>
                    </div>
                    <small style="color: #6b7280; font-size: 11px; display: block; margin-top: 3px;">列表页字段折叠展示配置，length和row至少填一个</small>
                </div>
                
                <div class="form-group">
                    <label class="form-label">验证器 (validators)</label>
                    <div id="validators-list" style="margin-bottom: 8px;">
                        <!-- 验证器列表将在这里动态生成 -->
                    </div>
                    <button type="button" class="btn btn-secondary btn-small" onclick="addValidator()">
                        + 添加验证器
                    </button>
                    <small style="color: #6b7280; font-size: 12px; display: block; margin-top: 8px;">
                        常用验证器：data_required (必填)、length (长度限制)、regex (正则)
                    </small>
                </div>
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <button type="button" class="btn btn-secondary" onclick="closeFieldModal()">取消</button>
                <button type="button" class="btn btn-primary" onclick="saveField()">添加字段</button>
            </div>
        </form>
    `;
    
    modal.style.display = 'flex';
}

function toggleAdvancedOptions() {
    const advancedOptions = document.getElementById('advanced-options');
    const toggleBtn = document.querySelector('.toggle-advanced');
    
    if (advancedOptions.classList.contains('show')) {
        advancedOptions.classList.remove('show');
        toggleBtn.textContent = '显示高级选项';
    } else {
        advancedOptions.classList.add('show');
        toggleBtn.textContent = '隐藏高级选项';
    }
}

function addValidator() {
    const validatorsList = document.getElementById('validators-list');
    const validatorItem = document.createElement('div');
    validatorItem.className = 'validator-item';
    validatorItem.innerHTML = `
        <input type="text" class="validator-name" placeholder="验证器名称" value="data_required">
        <input type="text" class="validator-kws" placeholder='参数JSON，如: {"min":3,"max":12}' value="">
        <button type="button" class="btn btn-danger btn-small" onclick="removeValidator(this)">删除</button>
    `;
    validatorsList.appendChild(validatorItem);
}

function removeValidator(button) {
    button.closest('.validator-item').remove();
}

function saveField() {
    const name = document.getElementById('field-name').value.trim();
    const label = document.getElementById('field-label').value.trim();
    const type = document.getElementById('field-type').value;
    
    if (!name || !label || !type) {
        alert('请填写必填项（字段名、显示标签、类型）');
        return;
    }

    const field = {
        id: Date.now() + Math.random(),
        name: name,
        label: label,
        type: type
    };
    
    // 基础高级选项
    const explain = document.getElementById('field-explain')?.value.trim();
    const placeholder = document.getElementById('field-placeholder')?.value.trim();
    const defaultValue = document.getElementById('field-default')?.value.trim();
    const width = document.getElementById('field-width')?.value;
    const source = document.getElementById('field-source')?.value.trim();
    
    if (explain) field.explain = explain;
    if (placeholder) field.placeholder = placeholder;
    if (defaultValue) field.default = defaultValue;
    if (width) field.width = parseInt(width);
    if (source) field.source = source;
    
    // 显示规则 (show_rule)
    const showRuleField = document.getElementById('show-rule-field')?.value;
    const showRuleMatch = document.getElementById('show-rule-match')?.value;
    const showRuleValue = document.getElementById('show-rule-value')?.value.trim();
    const showRuleAction = document.getElementById('show-rule-action')?.value;
    
    if (showRuleField && showRuleValue) {
        field.show_rule = {
            name: showRuleField,
            hideis: showRuleAction === 'true'
        };
        // 根据匹配方式添加对应的key
        if (showRuleMatch === 'value') {
            field.show_rule.value = showRuleValue;
        } else {
            field.show_rule.contain = showRuleValue;
        }
    }
    
    // 复制规则 (copy_rule)
    const copyRuleRadio = document.querySelector('input[name="copy-rule"]:checked')?.value;
    if (copyRuleRadio === 'with-button') {
        field.copy_rule = {}; // 可复制有按钮
    } else if (copyRuleRadio === '关闭') {
        field.copy_rule = '关闭'; // 不可复制
    }
    // 如果是"开启"（默认），不设置copy_rule字段
    
    // 提示折叠 (tooltip)
    const tooltipWidth = document.getElementById('tooltip-width')?.value;
    const tooltipTrigger = document.getElementById('tooltip-trigger')?.value;
    const tooltipLength = document.getElementById('tooltip-length')?.value;
    const tooltipRow = document.getElementById('tooltip-row')?.value;
    
    if (tooltipWidth || tooltipTrigger || tooltipLength || tooltipRow) {
        field.tooltip = {};
        if (tooltipWidth) field.tooltip.width = parseInt(tooltipWidth);
        if (tooltipTrigger) field.tooltip.trigger = tooltipTrigger;
        if (tooltipLength) field.tooltip.length = parseInt(tooltipLength);
        if (tooltipRow) field.tooltip.row = parseInt(tooltipRow);
    }
    
    // 渲染选项
    const readonly = document.getElementById('field-readonly')?.checked;
    const createonly = document.getElementById('field-createonly')?.checked;
    if (readonly || createonly) {
        field.render_kw = {};
        if (readonly) field.render_kw.readonly = true;
        if (createonly) field.render_kw.createonly = true;
    }
    
    // 字段类型特定配置
    switch(type) {
        case 'Select':
        case 'SelectMulti':
        case 'Radio':
            const choices = document.getElementById('field-choices')?.value.trim();
            const coerce = document.getElementById('field-coerce')?.value;
            const fieldChains = document.getElementById('field-chains')?.value.trim();
            const allowCreate = document.getElementById('field-allow-create')?.checked;
            
            if (choices) {
                try {
                    field.choices = JSON.parse(choices);
                } catch(e) {
                    // 如果不是JSON，当作URL
                    field.choices = choices;
                }
            }
            if (coerce) field.coerce = coerce;
            if (fieldChains) {
                try { field.field_chains = JSON.parse(fieldChains); } catch(e) {}
            }
            if (allowCreate) field.allow_create = true;
            break;
            
        case 'Image':
        case 'File':
        case 'ImageMulti':
        case 'FileMulti':
            const style = document.getElementById('field-style')?.value;
            const config = document.getElementById('field-config')?.value.trim();
            if (style) field.style = style;
            if (config) field.config = config;
            break;
            
        case 'LinkString':
            const params = document.getElementById('field-params')?.value.trim();
            const model = document.getElementById('field-model')?.value.trim();
            if (params) {
                try { field.params = JSON.parse(params); } catch(e) {}
            }
            if (model) field.model = model;
            break;
            
        case 'LinkForm':
            const formName = document.getElementById('field-form-name')?.value.trim();
            if (formName) field.form_name = formName;
            const actions = [];
            document.querySelectorAll('.linkform-action:checked').forEach(cb => {
                actions.push(cb.value);
            });
            if (actions.length > 0) field.actions = actions;
            break;
            
        case 'InlineModel':
            const inlineFormName = document.getElementById('field-form-name')?.value.trim();
            if (inlineFormName) field.form_name = inlineFormName;
            break;
            
        case 'Calculation':
            const formula = document.getElementById('field-formula')?.value.trim();
            const conversion = document.getElementById('field-conversion')?.value.trim();
            if (formula || conversion) {
                field.method = {};
                if (formula) field.method.formula = formula;
                if (conversion) {
                    try { field.method.field_conversion = JSON.parse(conversion); } catch(e) {}
                }
            }
            break;
            
        case 'JsonEditor':
            const outSelected = document.getElementById('field-out-selected')?.checked;
            const expandAll = document.getElementById('field-expand-all')?.checked;
            const showDiff = document.getElementById('field-show-diff')?.checked;
            const remoteExplain = document.getElementById('field-remote-explain')?.value.trim();
            if (outSelected) field.out_selected = true;
            if (expandAll) field.expand_all = true;
            if (showDiff) field.show_diff = true;
            if (remoteExplain) field.remote_explain = remoteExplain;
            break;
            
        case 'DateTime':
            const filterRules = document.getElementById('field-filter-rules')?.value.trim();
            if (filterRules) {
                try { field.filter_rules = JSON.parse(filterRules); } catch(e) {}
            }
            break;
    }
    
    // 验证器
    const validatorItems = document.querySelectorAll('.validator-item');
    if (validatorItems.length > 0) {
        const validators = [];
        validatorItems.forEach(item => {
            const validatorName = item.querySelector('.validator-name').value.trim();
            const kwsStr = item.querySelector('.validator-kws').value.trim();
            if (validatorName) {
                const validator = { name: validatorName };
                if (kwsStr) {
                    try {
                        validator.kws = JSON.parse(kwsStr);
                    } catch (e) {
                        validator.kws = { raw: kwsStr };
                    }
                }
                validators.push(validator);
            }
        });
        if (validators.length > 0) {
            field.validators = validators;
        }
    }
    
    adminSystem.currentModel.fields.push(field);
    
    // 关闭模态框并更新预览
    adminSystem.closeModal();
    adminSystem.updatePreview();
    adminSystem.showSuccessMessage('字段添加成功！');
}

function closeFieldModal() {
    adminSystem.closeModal();
}

function editField(fieldId) {
    const field = adminSystem.currentModel.fields.find(f => f.id == fieldId);
    if (!field) return;
    
    const modal = document.getElementById('config-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = '编辑字段';
    modalBody.innerHTML = `
        <form id="edit-field-form">
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">字段名称 (name) *</label>
                    <input type="text" class="form-input" id="field-name" value="${field.name}" placeholder="例如: user_id">
                </div>
                <div class="form-group">
                    <label class="form-label">显示标签 (label) *</label>
                    <input type="text" class="form-input" id="field-label" value="${field.label}" placeholder="例如: 用户ID">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">字段类型 (type) *</label>
                <select class="form-input" id="field-type">
                    <option value="String" ${field.type === 'String' ? 'selected' : ''}>String</option>
                    <option value="Integer" ${field.type === 'Integer' ? 'selected' : ''}>Integer</option>
                    <option value="Float" ${field.type === 'Float' ? 'selected' : ''}>Float</option>
                    <option value="Boolean" ${field.type === 'Boolean' ? 'selected' : ''}>Boolean</option>
                    <option value="Datetime" ${field.type === 'Datetime' ? 'selected' : ''}>Datetime</option>
                    <option value="TextArea" ${field.type === 'TextArea' ? 'selected' : ''}>TextArea</option>
                    <option value="Editor" ${field.type === 'Editor' ? 'selected' : ''}>Editor</option>
                    <option value="Select" ${field.type === 'Select' ? 'selected' : ''}>Select</option>
                    <option value="SelectMulti" ${field.type === 'SelectMulti' ? 'selected' : ''}>SelectMulti</option>
                    <option value="Radio" ${field.type === 'Radio' ? 'selected' : ''}>Radio</option>
                    <option value="File" ${field.type === 'File' ? 'selected' : ''}>File</option>
                    <option value="Image" ${field.type === 'Image' ? 'selected' : ''}>Image</option>
                    <option value="ImageMulti" ${field.type === 'ImageMulti' ? 'selected' : ''}>ImageMulti</option>
                    <option value="FileMulti" ${field.type === 'FileMulti' ? 'selected' : ''}>FileMulti</option>
                    <option value="Json" ${field.type === 'Json' ? 'selected' : ''}>Json</option>
                    <option value="JsonEditor" ${field.type === 'JsonEditor' ? 'selected' : ''}>JsonEditor</option>
                    <option value="LinkString" ${field.type === 'LinkString' ? 'selected' : ''}>LinkString</option>
                    <option value="InlineModel" ${field.type === 'InlineModel' ? 'selected' : ''}>InlineModel</option>
                    <option value="LinkForm" ${field.type === 'LinkForm' ? 'selected' : ''}>LinkForm</option>
                    <option value="Calculation" ${field.type === 'Calculation' ? 'selected' : ''}>Calculation</option>
                    <option value="SourceForm" ${field.type === 'SourceForm' ? 'selected' : ''}>SourceForm</option>
                </select>
            </div>
            
            <button type="button" class="toggle-advanced" onclick="toggleAdvancedOptions()" style="background: #f3f4f6; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 6px; cursor: pointer; width: 100%; margin-bottom: 12px;">
                显示高级选项
            </button>
            
            <div id="advanced-options" class="advanced-options" style="padding-top: 8px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                    <div>
                        <label style="font-size: 12px; color: #374151; font-weight: 500; display: block; margin-bottom: 4px;">说明 (explain)</label>
                        <input type="text" class="form-input" id="field-explain" value="${field.explain || ''}" placeholder="字段说明" style="font-size: 13px; padding: 6px 10px;">
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #374151; font-weight: 500; display: block; margin-bottom: 4px;">占位符 (placeholder)</label>
                        <input type="text" class="form-input" id="field-placeholder" value="${field.placeholder || ''}" placeholder="占位符" style="font-size: 13px; padding: 6px 10px;">
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #374151; font-weight: 500; display: block; margin-bottom: 4px;">默认值 (default)</label>
                        <input type="text" class="form-input" id="field-default" value="${field.default || ''}" placeholder="默认值" style="font-size: 13px; padding: 6px 10px;">
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px; margin-bottom: 12px;">
                    <div>
                        <label style="font-size: 12px; color: #374151; font-weight: 500; display: block; margin-bottom: 4px;">宽度px (width)</label>
                        <input type="number" class="form-input" id="field-width" value="${field.width || ''}" placeholder="120" style="font-size: 13px; padding: 6px 10px;">
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #374151; font-weight: 500; display: block; margin-bottom: 4px;">数据来源 (source)</label>
                        <input type="text" class="form-input" id="field-source" value="${field.source || ''}" placeholder="动态数据URL" style="font-size: 13px; padding: 6px 10px;">
                    </div>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <label style="font-size: 12px; color: #374151; font-weight: 500; display: block; margin-bottom: 6px;">渲染选项 (render_kw)</label>
                    <div style="display: flex; gap: 16px;">
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer;">
                            <input type="checkbox" id="field-readonly" ${field.render_kw?.readonly ? 'checked' : ''}>
                            只读 (readonly)
                        </label>
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer;">
                            <input type="checkbox" id="field-createonly" ${field.render_kw?.createonly ? 'checked' : ''}>
                            仅创建时可见 (createonly)
                        </label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">显示规则 (show_rule)</label>
                    <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; background: #f9fafb;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                            <div>
                                <label style="font-size: 12px; color: #6b7280; display: block; margin-bottom: 4px;">关联字段</label>
                                <select class="form-input" id="show-rule-field" style="font-size: 13px;">
                                    <option value="">不设置</option>
                                    ${adminSystem.currentModel.fields.filter(f => f.id !== field.id).map(f => `<option value="${f.name}" ${field.show_rule?.name === f.name ? 'selected' : ''}>${f.label} (${f.name})</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 12px; color: #6b7280; display: block; margin-bottom: 4px;">匹配方式</label>
                                <select class="form-input" id="show-rule-match" style="font-size: 13px;">
                                    <option value="value" ${field.show_rule?.value !== undefined ? 'selected' : ''}>等于 (value)</option>
                                    <option value="contain" ${field.show_rule?.contain !== undefined ? 'selected' : ''}>包含 (contain)</option>
                                </select>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <div>
                                <label style="font-size: 12px; color: #6b7280; display: block; margin-bottom: 4px;">匹配值</label>
                                <input type="text" class="form-input" id="show-rule-value" placeholder="输入值" value="${field.show_rule?.value || field.show_rule?.contain || ''}" style="font-size: 13px;">
                            </div>
                            <div>
                                <label style="font-size: 12px; color: #6b7280; display: block; margin-bottom: 4px;">执行动作</label>
                                <select class="form-input" id="show-rule-action" style="font-size: 13px;">
                                    <option value="true" ${field.show_rule?.hideis === true ? 'selected' : ''}>隐藏字段 (hideis: true)</option>
                                    <option value="false" ${field.show_rule?.hideis === false ? 'selected' : ''}>显示字段 (hideis: false)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <small style="color: #6b7280; font-size: 12px; display: block; margin-top: 4px;">控制字段根据其他字段值的显示/隐藏</small>
                </div>
                
                <div class="form-group">
                    <label class="form-label">复制规则 (copy_rule)</label>
                    <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; background: #f9fafb;">
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="radio" name="copy-rule" value="开启" ${!field.copy_rule || (typeof field.copy_rule === 'object' && field.copy_rule.status === '开启') ? 'checked' : ''}>
                                <span style="font-size: 13px;">可复制无按钮 (默认)</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="radio" name="copy-rule" value="with-button" ${typeof field.copy_rule === 'object' && field.copy_rule !== null && Object.keys(field.copy_rule).length === 0 ? 'checked' : ''}>
                                <span style="font-size: 13px;">可复制有按钮 (显示复制按钮 🔗)</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="radio" name="copy-rule" value="关闭" ${field.copy_rule === '关闭' ? 'checked' : ''}>
                                <span style="font-size: 13px;">不可复制 (字体变灰)</span>
                            </label>
                        </div>
                    </div>
                    <small style="color: #6b7280; font-size: 11px; display: block; margin-top: 3px;">配置字段的复制链接功能，默认可复制无按钮</small>
                </div>
                
                <div class="form-group">
                    <label class="form-label">提示折叠 (tooltip)</label>
                    <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; background: #f9fafb;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                            <div>
                                <label style="font-size: 12px; color: #6b7280; display: block; margin-bottom: 3px;">弹窗宽度 (width)</label>
                                <input type="number" class="form-input" id="tooltip-width" placeholder="900" value="${field.tooltip?.width || ''}" style="font-size: 13px; padding: 6px;">
                            </div>
                            <div>
                                <label style="font-size: 12px; color: #6b7280; display: block; margin-bottom: 3px;">触发方式 (trigger)</label>
                                <select class="form-input" id="tooltip-trigger" style="font-size: 13px; padding: 6px;">
                                    <option value="hover" ${field.tooltip?.trigger === 'hover' ? 'selected' : ''}>hover - 鼠标移入</option>
                                    <option value="click" ${field.tooltip?.trigger === 'click' ? 'selected' : ''}>click - 点击</option>
                                    <option value="focus" ${field.tooltip?.trigger === 'focus' ? 'selected' : ''}>focus - 持续点击</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 12px; color: #6b7280; display: block; margin-bottom: 3px;">字符数 (length)</label>
                                <input type="number" class="form-input" id="tooltip-length" placeholder="100" value="${field.tooltip?.length || ''}" style="font-size: 13px; padding: 6px;">
                            </div>
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #6b7280; display: block; margin-bottom: 3px;">展示行数 (row)</label>
                            <input type="number" class="form-input" id="tooltip-row" placeholder="不限制" value="${field.tooltip?.row || ''}" style="font-size: 13px; padding: 6px;">
                        </div>
                    </div>
                    <small style="color: #6b7280; font-size: 11px; display: block; margin-top: 3px;">列表页字段折叠展示配置，length和row至少填一个</small>
                </div>
                
                <div class="form-group">
                    <label class="form-label">验证器 (validators)</label>
                    <div id="validators-list" style="margin-bottom: 8px;">
                        ${(field.validators || []).map(v => `
                            <div class="validator-item" style="display: flex; gap: 8px; margin-bottom: 8px;">
                                <input type="text" class="validator-name" placeholder="验证器名称" value="${v.name}" style="flex: 1; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <input type="text" class="validator-kws" placeholder='参数JSON' value='${JSON.stringify(v.kws || {})}' style="flex: 2; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                                <button type="button" class="btn btn-danger btn-small" onclick="removeValidator(this)">删除</button>
                            </div>
                        `).join('')}
                    </div>
                    <button type="button" class="btn btn-secondary btn-small" onclick="addValidator()">
                        + 添加验证器
                    </button>
                    <small style="color: #6b7280; font-size: 12px; display: block; margin-top: 8px;">
                        常用验证器：data_required (必填)、length (长度限制)、regex (正则)
                    </small>
                </div>
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <button type="button" class="btn btn-secondary" onclick="closeFieldModal()">取消</button>
                <button type="button" class="btn btn-primary" onclick="updateField('${fieldId}')">保存修改</button>
            </div>
        </form>
    `;
    
    modal.style.display = 'flex';
}

function updateField(fieldId) {
    const field = adminSystem.currentModel.fields.find(f => f.id == fieldId);
    if (!field) return;
    
    const name = document.getElementById('field-name').value.trim();
    const label = document.getElementById('field-label').value.trim();
    const type = document.getElementById('field-type').value;
    
    if (!name || !label || !type) {
        alert('请填写必填项（字段名、显示标签、类型）');
        return;
    }
    
    // 更新字段基本信息
    field.name = name;
    field.label = label;
    field.type = type;
    
    // 高级选项
    const explain = document.getElementById('field-explain').value.trim();
    const placeholder = document.getElementById('field-placeholder').value.trim();
    const defaultValue = document.getElementById('field-default').value.trim();
    const width = document.getElementById('field-width').value;
    const source = document.getElementById('field-source').value.trim();
    
    if (explain) field.explain = explain; else delete field.explain;
    if (placeholder) field.placeholder = placeholder; else delete field.placeholder;
    if (defaultValue) field.default = defaultValue; else delete field.default;
    if (width) field.width = parseInt(width); else delete field.width;
    if (source) field.source = source; else delete field.source;
    
    // 渲染选项
    const readonly = document.getElementById('field-readonly').checked;
    const createonly = document.getElementById('field-createonly').checked;
    if (readonly || createonly) {
        field.render_kw = {};
        if (readonly) field.render_kw.readonly = true;
        if (createonly) field.render_kw.createonly = true;
    } else {
        delete field.render_kw;
    }
    
    // 显示规则 (show_rule)
    const showRuleField = document.getElementById('show-rule-field')?.value;
    const showRuleMatch = document.getElementById('show-rule-match')?.value;
    const showRuleValue = document.getElementById('show-rule-value')?.value.trim();
    const showRuleAction = document.getElementById('show-rule-action')?.value;
    
    if (showRuleField && showRuleValue) {
        field.show_rule = {
            name: showRuleField,
            hideis: showRuleAction === 'true'
        };
        // 根据匹配方式添加对应的key
        if (showRuleMatch === 'value') {
            field.show_rule.value = showRuleValue;
        } else {
            field.show_rule.contain = showRuleValue;
        }
    } else {
        delete field.show_rule;
    }
    
    // 复制规则 (copy_rule)
    const copyRuleRadio = document.querySelector('input[name="copy-rule"]:checked')?.value;
    if (copyRuleRadio === 'with-button') {
        field.copy_rule = {}; // 可复制有按钮
    } else if (copyRuleRadio === '关闭') {
        field.copy_rule = '关闭'; // 不可复制
    } else {
        delete field.copy_rule; // 如果是"开启"（默认），不设置copy_rule字段
    }
    
    // 提示折叠 (tooltip)
    const tooltipWidth = document.getElementById('tooltip-width')?.value;
    const tooltipTrigger = document.getElementById('tooltip-trigger')?.value;
    const tooltipLength = document.getElementById('tooltip-length')?.value;
    const tooltipRow = document.getElementById('tooltip-row')?.value;
    
    if (tooltipWidth || tooltipTrigger || tooltipLength || tooltipRow) {
        field.tooltip = {};
        if (tooltipWidth) field.tooltip.width = parseInt(tooltipWidth);
        if (tooltipTrigger) field.tooltip.trigger = tooltipTrigger;
        if (tooltipLength) field.tooltip.length = parseInt(tooltipLength);
        if (tooltipRow) field.tooltip.row = parseInt(tooltipRow);
    } else {
        delete field.tooltip;
    }
    
    // 验证器
    const validatorItems = document.querySelectorAll('.validator-item');
    if (validatorItems.length > 0) {
        const validators = [];
        validatorItems.forEach(item => {
            const validatorName = item.querySelector('.validator-name').value.trim();
            const kwsStr = item.querySelector('.validator-kws').value.trim();
            if (validatorName) {
                const validator = { name: validatorName };
                if (kwsStr) {
                    try {
                        validator.kws = JSON.parse(kwsStr);
                    } catch (e) {
                        validator.kws = { raw: kwsStr };
                    }
                }
                validators.push(validator);
            }
        });
        if (validators.length > 0) {
            field.validators = validators;
        } else {
            delete field.validators;
        }
    } else {
        delete field.validators;
    }
    
    adminSystem.closeModal();
    adminSystem.updatePreview();
    adminSystem.showSuccessMessage('字段已更新！');
}

function removeField(fieldId) {
    if (!confirm('确认删除该字段？')) return;
    
    adminSystem.currentModel.fields = adminSystem.currentModel.fields.filter(f => f.id != fieldId);
    
    // 刷新字段配置模态框中的字段列表
    const fieldsList = document.getElementById('fields-list');
    if (fieldsList) {
        if (adminSystem.currentModel.fields.length === 0) {
            fieldsList.innerHTML = '<div style="text-align: center; padding: 40px; color: #9ca3af;">暂无字段，点击"添加字段"开始配置</div>';
        } else {
            fieldsList.innerHTML = adminSystem.currentModel.fields.map(field => adminSystem.renderFieldItem(field)).join('');
        }
    }
    
    // 更新预览
    adminSystem.updatePreview();
    adminSystem.showSuccessMessage('字段已删除！');
}

// deleteField 是 removeField 的别名，用于在表格中调用
function deleteField(fieldId) {
    removeField(fieldId);
}

// 切换预览标签
function switchPreviewTab(tab) {
    // 切换标签激活状态
    document.querySelectorAll('.preview-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    // 隐藏所有内容
    document.getElementById('preview-list').style.display = 'none';
    document.getElementById('preview-form').style.display = 'none';
    document.getElementById('preview-edit').style.display = 'none';
    document.getElementById('preview-detail').style.display = 'none';
    
    // 显示选中的内容
    if (tab === 'list') {
        document.getElementById('preview-list').style.display = 'block';
    } else if (tab === 'form') {
        document.getElementById('preview-form').style.display = 'block';
    } else if (tab === 'edit') {
        document.getElementById('preview-edit').style.display = 'block';
    } else if (tab === 'detail') {
        document.getElementById('preview-detail').style.display = 'block';
    }
}

// 字段类型改变时的处理函数
function onFieldTypeChange(fieldType) {
    const specificDiv = document.getElementById('field-type-specific');
    if (!specificDiv) return;
    
    specificDiv.innerHTML = '';
    specificDiv.style.display = 'none';
    
    // 根据字段类型显示特定配置
    switch(fieldType) {
        case 'Select':
        case 'SelectMulti':
        case 'Radio':
            specificDiv.innerHTML = `
                <div class="form-group">
                    <label class="form-label">选项配置 (choices)</label>
                    <textarea class="form-input" id="field-choices" rows="4" placeholder='格式: [["key1", "label1"], ["key2", "label2"]] 或 URL地址'></textarea>
                    <small style="color: #6b7280; font-size: 12px;">支持常量数组或动态URL</small>
                </div>
                <div class="form-group">
                    <label class="form-label">值类型 (coerce)</label>
                    <select class="form-input" id="field-coerce">
                        <option value="string">string - 字符串</option>
                        <option value="int">int - 整数</option>
                        <option value="text_image">text_image - 图文</option>
                    </select>
                </div>
                ${fieldType !== 'SelectMulti' ? `
                <div class="form-group">
                    <label class="form-label">级联配置 (field_chains)</label>
                    <textarea class="form-input" id="field-chains" rows="3" placeholder='[{"child": "field_name", "params": ["param1"]}]'></textarea>
                </div>
                ` : ''}
                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 6px;">
                        <input type="checkbox" id="field-allow-create">
                        <span>允许输入自定义选项 (allow_create)</span>
                    </label>
                </div>
            `;
            specificDiv.style.display = 'block';
            break;
            
        case 'Image':
        case 'File':
        case 'ImageMulti':
        case 'FileMulti':
            specificDiv.innerHTML = `
                <div class="form-group">
                    <label class="form-label">上传方式 (style)</label>
                    <select class="form-input" id="field-style">
                        <option value="url">url - URL方式(S3)</option>
                        <option value="stream">stream - 二进制流</option>
                        <option value="large">large - 大文件(>10MB)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">配置名称 (config)</label>
                    <input type="text" class="form-input" id="field-config" placeholder="config_name">
                    <small style="color: #6b7280; font-size: 12px;">仅 url/large 方式需要</small>
                </div>
            `;
            specificDiv.style.display = 'block';
            break;
            
        case 'LinkString':
            specificDiv.innerHTML = `
                <div class="form-group">
                    <label class="form-label">跳转参数 (params)</label>
                    <input type="text" class="form-input" id="field-params" placeholder='["field1", "field2"]'>
                </div>
                <div class="form-group">
                    <label class="form-label">跳转模型 (model)</label>
                    <input type="text" class="form-input" id="field-model" placeholder="model_name 或 external-links">
                    <small style="color: #6b7280; font-size: 12px;">内部跳转填写模型名，外部跳转填 external-links</small>
                </div>
            `;
            specificDiv.style.display = 'block';
            break;
            
        case 'LinkForm':
        case 'InlineModel':
            specificDiv.innerHTML = `
                <div class="form-group">
                    <label class="form-label">表单名称 (form_name)</label>
                    <input type="text" class="form-input" id="field-form-name" placeholder="lf_form_name">
                </div>
                ${fieldType === 'LinkForm' ? `
                <div class="form-group">
                    <label class="form-label">可用动作 (actions)</label>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        <label><input type="checkbox" class="linkform-action" value="add"> add</label>
                        <label><input type="checkbox" class="linkform-action" value="delete"> delete</label>
                        <label><input type="checkbox" class="linkform-action" value="edit"> edit</label>
                        <label><input type="checkbox" class="linkform-action" value="import"> import</label>
                    </div>
                </div>
                ` : ''}
            `;
            specificDiv.style.display = 'block';
            break;
            
        case 'Calculation':
            specificDiv.innerHTML = `
                <div class="form-group">
                    <label class="form-label">计算公式 (formula)</label>
                    <input type="text" class="form-input" id="field-formula" placeholder="field1 * field2">
                </div>
                <div class="form-group">
                    <label class="form-label">字段映射 (field_conversion)</label>
                    <textarea class="form-input" id="field-conversion" rows="3" placeholder='{"field1": "real_field1", "field2": "real_field2"}'></textarea>
                </div>
            `;
            specificDiv.style.display = 'block';
            break;
            
        case 'JsonEditor':
            specificDiv.innerHTML = `
                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 6px;">
                        <input type="checkbox" id="field-out-selected">
                        <span>显示外部选择控件 (out_selected)</span>
                    </label>
                </div>
                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 6px;">
                        <input type="checkbox" id="field-expand-all">
                        <span>展开所有字段 (expand_all)</span>
                    </label>
                </div>
                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 6px;">
                        <input type="checkbox" id="field-show-diff">
                        <span>显示修改对比 (show_diff)</span>
                    </label>
                </div>
                <div class="form-group">
                    <label class="form-label">字段说明URL (remote_explain)</label>
                    <input type="text" class="form-input" id="field-remote-explain" placeholder="https://api.example.com/explains">
                </div>
            `;
            specificDiv.style.display = 'block';
            break;
            
        case 'DateTime':
            specificDiv.innerHTML = `
                <div class="form-group">
                    <label class="form-label">筛选规则 (filter_rules)</label>
                    <textarea class="form-input" id="field-filter-rules" rows="4" placeholder='{"value": "now", "range": 4, "left_interval": 3, "right_interval": 4}'></textarea>
                    <small style="color: #6b7280; font-size: 12px;">用于限制时间查询范围</small>
                </div>
            `;
            specificDiv.style.display = 'block';
            break;
    }
}

// 辅助函数：切换字段选择器的展开/收起
function toggleFieldSelector(id) {
    const selector = document.getElementById(`${id}-selector`);
    const header = selector.previousElementSibling.tagName === 'SMALL' 
        ? selector.previousElementSibling.previousElementSibling 
        : selector.previousElementSibling;
    const icon = header.querySelector('.toggle-icon');
    
    if (selector.style.display === 'none') {
        selector.style.display = 'block';
        icon.style.transform = 'rotate(180deg)';
        header.style.backgroundColor = '#e0f2f1';
    } else {
        selector.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
        header.style.backgroundColor = '#f8fafc';
    }
}

function toggleOtherFieldsSection() {
    const section = document.getElementById('other-fields-section');
    const icon = document.getElementById('other-fields-toggle');
    
    if (section.style.display === 'none') {
        section.style.display = 'block';
        icon.textContent = '▲';
    } else {
        section.style.display = 'none';
        icon.textContent = '▼';
    }
}

function toggleBasePropSection(sectionName) {
    const content = document.getElementById(`bp-${sectionName}-content`);
    const toggle = document.getElementById(`bp-${sectionName}-toggle`);
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '▲';
        toggle.style.transform = 'rotate(180deg)';
    } else {
        content.style.display = 'none';
        toggle.textContent = '▼';
        toggle.style.transform = 'rotate(0deg)';
    }
}

// 辅助函数：更新字段计数显示
function updateFieldCount(id) {
    const checkboxes = document.querySelectorAll(`input.field-checkbox[data-select-id="${id}"]:checked`);
    const count = checkboxes.length;
    const header = document.getElementById(`${id}-selector`).previousElementSibling;
    const countSpan = header.querySelector('span[style*="color: #14b8a6"]') || header.querySelector('span:last-child');
    
    if (header.tagName === 'SMALL') {
        const actualHeader = header.previousElementSibling;
        const actualCountSpan = actualHeader.querySelector('span[style*="color: #14b8a6"]') || actualHeader.querySelector('span:last-child');
        if (actualCountSpan) {
            actualCountSpan.textContent = count > 0 ? ` (已选 ${count} 个)` : ' (未选择)';
        }
    } else if (countSpan) {
        countSpan.textContent = count > 0 ? ` (已选 ${count} 个)` : ' (未选择)';
    }
}

// 辅助函数：全选/全不选字段
function toggleAllFields(selectId, checked) {
    const checkboxes = document.querySelectorAll(`input.field-checkbox[data-select-id="${selectId}"]`);
    checkboxes.forEach(cb => {
        cb.checked = checked;
    });
    // 更新计数
    updateFieldCount(selectId);
}

// 辅助函数：切换过滤字段的操作符显示
function toggleFilterField(checkbox) {
    const parent = checkbox.closest('div').parentElement;
    const operatorsDiv = parent.querySelector('.filter-operators');
    
    if (checkbox.checked) {
        operatorsDiv.style.display = 'flex';
        // 默认选中第一个操作符
        const firstOperator = operatorsDiv.querySelector('input[type="checkbox"]');
        if (firstOperator && !operatorsDiv.querySelector('input[type="checkbox"]:checked')) {
            firstOperator.checked = true;
        }
    } else {
        operatorsDiv.style.display = 'none';
        // 取消所有操作符的选中
        const operatorCheckboxes = operatorsDiv.querySelectorAll('input[type="checkbox"]');
        operatorCheckboxes.forEach(cb => cb.checked = false);
    }
}

// 初始化系统
let adminSystem;
