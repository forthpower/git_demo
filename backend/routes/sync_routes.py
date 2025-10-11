"""同步路由 - 导入和自动同步"""
from flask import request, jsonify, Blueprint
import os
import shutil
from ..services.parser import parse_model_file

bp = Blueprint('sync', __name__)

@bp.route("/api/import_folder", methods=["POST"])
def import_folder():
    """批量导入文件夹中的 schema 文件"""
    try:
        data = request.get_json()
        folder_path = data.get('folder_path', '').strip()
        
        if not folder_path:
            return jsonify({'success': False, 'error': '请提供文件夹路径'}), 400
        
        if not os.path.exists(folder_path):
            return jsonify({'success': False, 'error': f'文件夹不存在: {folder_path}'}), 400
        
        if not os.path.isdir(folder_path):
            return jsonify({'success': False, 'error': f'路径不是文件夹: {folder_path}'}), 400
        
        # 扫描所有 .py 文件
        py_files = []
        for filename in os.listdir(folder_path):
            if filename.endswith('.py') and not filename.startswith('__'):
                py_files.append(os.path.join(folder_path, filename))
        
        if not py_files:
            return jsonify({'success': False, 'error': f'文件夹中没有找到 .py 文件: {folder_path}'}), 400
        
        # 解析所有文件
        schemas = []
        parent_menus_dict = {}  # 使用字典去重
        failed_files = []
        
        for file_path in py_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 解析文件内容
                parsed = parse_model_file(content, 'json')
                
                if parsed and 'name' in parsed:
                    # 添加源文件路径信息，用于自动同步
                    parsed['source_file'] = file_path
                    schemas.append(parsed)
                    
                    # 提取父菜单信息
                    if 'parent' in parsed and parsed['parent']:
                        parent_info = parsed['parent']
                        if isinstance(parent_info, str):
                            # 如果parent是字符串
                            if parent_info and parent_info not in parent_menus_dict:
                                parent_menus_dict[parent_info] = {
                                    'name': parent_info,
                                    'label': parent_info.title()
                                }
                        elif isinstance(parent_info, dict) and 'name' in parent_info:
                            # 如果parent是字典
                            parent_name = parent_info['name']
                            if parent_name and parent_name not in parent_menus_dict:
                                parent_menus_dict[parent_name] = {
                                    'name': parent_name,
                                    'label': parent_info.get('label', parent_name.title())
                                }
                else:
                    failed_files.append(os.path.basename(file_path))
            except Exception as e:
                print(f"解析文件失败 {file_path}: {str(e)}")
                failed_files.append(os.path.basename(file_path))
        
        # 转换为列表
        parent_menus = list(parent_menus_dict.values())
        
        # 构建返回消息
        message = f"成功导入 {len(schemas)} 个模型"
        if parent_menus:
            message += f"，自动识别 {len(parent_menus)} 个父菜单"
        if failed_files:
            message += f"\n\n解析失败的文件 ({len(failed_files)}): {', '.join(failed_files)}"
        
        return jsonify({
            'success': True,
            'schemas': schemas,
            'parent_menus': parent_menus,
            'message': message,
            'total_files': len(py_files),
            'success_count': len(schemas),
            'failed_count': len(failed_files),
            'failed_files': failed_files
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route("/api/auto_sync", methods=["POST"])
def auto_sync():
    """自动同步功能 - 将生成的 schema 写回到源文件"""
    try:
        data = request.get_json()
        sync_data = data.get('sync_data', [])
        
        if not sync_data:
            return jsonify({
                "success": False,
                "error": "没有提供同步数据"
            }), 400
        
        success_count = 0
        failed_count = 0
        details = []
        
        for item in sync_data:
            file_path = item.get('file_path')
            schema_content = item.get('schema_content')
            model_name = item.get('model_name', 'Unknown')
            
            if not file_path or not schema_content:
                failed_count += 1
                details.append(f"❌ {model_name}: 缺少文件路径或内容")
                continue
            
            try:
                # 检查文件是否存在
                if not os.path.exists(file_path):
                    failed_count += 1
                    details.append(f"❌ {model_name}: 文件不存在 ({file_path})")
                    continue
                
                # 备份原文件
                backup_path = file_path + '.backup'
                shutil.copy2(file_path, backup_path)
                
                # 写入新的 schema 内容
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(schema_content)
                
                success_count += 1
                details.append(f"✅ {model_name}: 同步成功")
                
            except Exception as e:
                failed_count += 1
                details.append(f"❌ {model_name}: {str(e)}")
        
        return jsonify({
            "success": True,
            "success_count": success_count,
            "failed_count": failed_count,
            "details": details,
            "message": f"同步完成: 成功 {success_count} 个，失败 {failed_count} 个"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

