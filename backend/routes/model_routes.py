"""模型管理路由"""
from flask import request, jsonify, Blueprint
import json
import sqlite3

bp = Blueprint('model', __name__)

@bp.route("/api/models", methods=["GET"])
def get_models():
    conn = sqlite3.connect('models.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM models ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()
    
    models = []
    for row in rows:
        model = {
            "id": row[0],
            "name": row[1],
            "label": row[2],
            "primary_key": row[3],
            "entry": row[4],
            "parent": json.loads(row[5]) if row[5] else "",
            "action": json.loads(row[6]) if row[6] else [],
            "fields": json.loads(row[7]) if row[7] else [],
            "base_props": json.loads(row[8]) if row[8] else {},
            "custom_actions": json.loads(row[9]) if row[9] else [],
            "created_at": row[10],
            "updated_at": row[11]
        }
        models.append(model)
    
    return jsonify(models)

# 保存模型

@bp.route("/api/models", methods=["POST"])
def save_model():
    data = request.json
    
    conn = sqlite3.connect('models.db')
    cursor = conn.cursor()
    
    # 检查模型名称是否已存在
    cursor.execute('SELECT id FROM models WHERE name = ?', (data.get('name'),))
    existing = cursor.fetchone()
    
    if existing:
        # 更新现有模型
        cursor.execute('''
            UPDATE models SET 
                label = ?, primary_key = ?, entry = ?, parent = ?, 
                action = ?, fields = ?, base_props = ?, custom_actions = ?, 
                updated_at = CURRENT_TIMESTAMP
            WHERE name = ?
        ''', (
            data.get('label'),
            data.get('primary_key', ''),
            data.get('entry', 'list'),
            json.dumps(data.get('parent', '')),
            json.dumps(data.get('action', [])),
            json.dumps(data.get('fields', [])),
            json.dumps(data.get('base_props', {})),
            json.dumps(data.get('custom_actions', [])),
            data.get('name')
        ))
        model_id = existing[0]
    else:
        # 创建新模型
        cursor.execute('''
            INSERT INTO models (name, label, primary_key, entry, parent, action, fields, base_props, custom_actions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('name'),
            data.get('label'),
            data.get('primary_key', ''),
            data.get('entry', 'list'),
            json.dumps(data.get('parent', '')),
            json.dumps(data.get('action', [])),
            json.dumps(data.get('fields', [])),
            json.dumps(data.get('base_props', {})),
            json.dumps(data.get('custom_actions', []))
        ))
        model_id = cursor.lastrowid
    
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "model_id": model_id})

# 删除模型

@bp.route("/api/models/<int:model_id>", methods=["DELETE"])
def delete_model(model_id):
    conn = sqlite3.connect('models.db')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM models WHERE id = ?', (model_id,))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True})


@bp.route("/generate", methods=["POST"])
def generate():
    data = request.json
    
    # 保存到数据库
    conn = sqlite3.connect('models.db')
    cursor = conn.cursor()
    
    # 检查模型名称是否已存在
    cursor.execute('SELECT id FROM models WHERE name = ?', (data.get('name'),))
    existing = cursor.fetchone()
    
    if existing:
        # 更新现有模型
        cursor.execute('''
            UPDATE models SET 
                label = ?, primary_key = ?, entry = ?, parent = ?, 
                action = ?, fields = ?, base_props = ?, custom_actions = ?, 
                updated_at = CURRENT_TIMESTAMP
            WHERE name = ?
        ''', (
            data.get('label'),
            data.get('primary_key', ''),
            data.get('entry', 'list'),
            json.dumps(data.get('parent', '')),
            json.dumps(data.get('action', [])),
            json.dumps(data.get('fields', [])),
            json.dumps(data.get('base_props', {})),
            json.dumps(data.get('custom_actions', [])),
            data.get('name')
        ))
    else:
        # 创建新模型
        cursor.execute('''
            INSERT INTO models (name, label, primary_key, entry, parent, action, fields, base_props, custom_actions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('name'),
            data.get('label'),
            data.get('primary_key', ''),
            data.get('entry', 'list'),
            json.dumps(data.get('parent', '')),
            json.dumps(data.get('action', [])),
            json.dumps(data.get('fields', [])),
            json.dumps(data.get('base_props', {})),
            json.dumps(data.get('custom_actions', []))
        ))
    
    conn.commit()
    conn.close()
    
    return jsonify(data)

# LinkForms API

@bp.route("/api/link_forms", methods=["GET"])
def get_link_forms():
    conn = sqlite3.connect('models.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM link_forms')
    rows = cursor.fetchall()
    conn.close()
    
    link_forms = []
    for row in rows:
        link_forms.append({
            "id": row[0],
            "name": row[1],
            "fields": json.loads(row[2]),
            "created_at": row[3]
        })
    
    return jsonify(link_forms)


@bp.route("/api/link_forms", methods=["POST"])
def save_link_form():
    data = request.json
    conn = sqlite3.connect('models.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT id FROM link_forms WHERE name = ?', (data.get('name'),))
    existing = cursor.fetchone()
    
    if existing:
        cursor.execute('''
            UPDATE link_forms SET fields = ? WHERE name = ?
        ''', (json.dumps(data.get('fields', [])), data.get('name')))
    else:
        cursor.execute('''
            INSERT INTO link_forms (name, fields) VALUES (?, ?)
        ''', (data.get('name'), json.dumps(data.get('fields', []))))
    
    conn.commit()
    conn.close()
    
    return jsonify({"success": True})

# InlineModels API

@bp.route("/api/inline_models", methods=["GET"])
def get_inline_models():
    conn = sqlite3.connect('models.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM inline_models')
    rows = cursor.fetchall()
    conn.close()
    
    inline_models = []
    for row in rows:
        inline_models.append({
            "id": row[0],
            "name": row[1],
            "fields": json.loads(row[2]),
            "created_at": row[3]
        })
    
    return jsonify(inline_models)


@bp.route("/api/inline_models", methods=["POST"])
def save_inline_model():
    data = request.json
    conn = sqlite3.connect('models.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT id FROM inline_models WHERE name = ?', (data.get('name'),))
    existing = cursor.fetchone()
    
    if existing:
        cursor.execute('''
            UPDATE inline_models SET fields = ? WHERE name = ?
        ''', (json.dumps(data.get('fields', [])), data.get('name')))
    else:
        cursor.execute('''
            INSERT INTO inline_models (name, fields) VALUES (?, ?)
        ''', (data.get('name'), json.dumps(data.get('fields', []))))
    
    conn.commit()
    conn.close()
    
    return jsonify({"success": True})

# Configs API

@bp.route("/api/configs", methods=["GET"])
def get_configs():
    conn = sqlite3.connect('models.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM configs')
    rows = cursor.fetchall()
    conn.close()
    
    configs = []
    for row in rows:
        configs.append({
            "id": row[0],
            "name": row[1],
            "upload_type": row[2],
            "config": json.loads(row[3]),
            "created_at": row[4]
        })
    
    return jsonify(configs)


@bp.route("/api/configs", methods=["POST"])
def save_config():
    data = request.json
    conn = sqlite3.connect('models.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT id FROM configs WHERE name = ?', (data.get('name'),))
    existing = cursor.fetchone()
    
    if existing:
        cursor.execute('''
            UPDATE configs SET upload_type = ?, config = ? WHERE name = ?
        ''', (data.get('upload_type'), json.dumps(data.get('config', {})), data.get('name')))
    else:
        cursor.execute('''
            INSERT INTO configs (name, upload_type, config) VALUES (?, ?, ?)
        ''', (data.get('name'), data.get('upload_type'), json.dumps(data.get('config', {}))))
    
    conn.commit()
    conn.close()
    
    return jsonify({"success": True})

# 模型文件解析功能
def parse_model_file(content, file_type='auto'):
    """
    解析模型文件内容，支持多种格式：
    - Python SQLAlchemy Model（支持多个模型）
    - Django Model
    - SQL DDL
    - JSON Schema
    
    返回格式：
    - 单个模型：返回单个 schema 字典
    - 多个模型：返回包含多个 schema 的列表
    """
    
    # 类型映射字典
    type_mapping = {
        # Python/SQLAlchemy
        'Integer': 'Integer',
        'String': 'String',
        'Text': 'TextArea',
        'Boolean': 'Boolean',
        'DateTime': 'DateTime',
        'Float': 'Float',
        'Date': 'DateTime',
        'Time': 'String',
        'JSON': 'Json',
        'BigInteger': 'Integer',
        'SmallInteger': 'Integer',
        'Numeric': 'Float',
        'Decimal': 'Float',
        # SQL
        'INT': 'Integer',
        'INTEGER': 'Integer',
        'BIGINT': 'Integer',
        'SMALLINT': 'Integer',
        'VARCHAR': 'String',
        'CHAR': 'String',
        'TEXT': 'TextArea',
        'BOOLEAN': 'Boolean',
        'BOOL': 'Boolean',
        'DATETIME': 'DateTime',
        'TIMESTAMP': 'DateTime',
        'DATE': 'DateTime',
        'FLOAT': 'Float',
        'DOUBLE': 'Float',
        'DECIMAL': 'Float',
        'JSON': 'Json',
        'BLOB': 'File',
    }
    
    fields = []
    model_name = 'imported_model'
    
    # 自动检测文件类型
    if 'class' in content and ('db.Model' in content or 'models.Model' in content):
        # Python Model (SQLAlchemy or Django)
        file_type = 'python'
    elif 'CREATE TABLE' in content.upper():
        # SQL DDL
        file_type = 'sql'
    elif content.strip().startswith('{') or 'schema' in content and '=' in content and '{' in content:
        # JSON 或 Python schema定义
        file_type = 'json'
    
    if file_type == 'python':
        # 解析 Python Model - 支持多个模型
        schemas = []
        
        # 找到所有的类定义
        class_pattern = r'class\s+(\w+)\s*\([^)]*(?:db\.Model|models\.Model)[^)]*\):\s*\n((?:(?!^class\s).*\n)*)'
        class_matches = re.finditer(class_pattern, content, re.MULTILINE)
        
        for class_match in class_matches:
            class_name = class_match.group(1)
            class_body = class_match.group(2)
            
            # 跳过 Mixin 类和工具类
            if 'Mixin' in class_name or class_name in ['Tool']:
                continue
            
            model_name = class_name.lower()
            model_fields = []
            
            # 提取 __tablename__
            tablename_match = re.search(r'__tablename__\s*=\s*[\'"](\w+)[\'"]', class_body)
            if tablename_match:
                model_name = tablename_match.group(1)
            
            # 提取字段定义
            field_patterns = [
                r'(\w+)\s*=\s*db\.Column\s*\((.*?)\)',
                r'(\w+)\s*=\s*models\.\w+Field\s*\((.*?)\)',
                r'(\w+)\s*=\s*Column\s*\((.*?)\)',
            ]
            
            for pattern in field_patterns:
                matches = re.finditer(pattern, class_body, re.MULTILINE)
                for match in matches:
                    field_name = match.group(1)
                    field_def = match.group(2)
                    
                    # 跳过私有字段和特殊字段
                    if field_name.startswith('_') or field_name in ['metadata', 'query']:
                        continue
                    
                    # 推断类型
                    field_type = 'String'  # 默认类型
                    for py_type, schema_type in type_mapping.items():
                        if py_type in field_def:
                            field_type = schema_type
                            break
                    
                    # 特殊处理 JSON 类型
                    if 'JSON' in field_def or 'Json' in field_def:
                        field_type = 'Json'
                    
                    # 提取字段标签
                    label_match = re.search(r'comment=[\'"]([^\'"]+)[\'"]', field_def)
                    label = label_match.group(1) if label_match else field_name.replace('_', ' ').title()
                    
                    # 检查是否必填
                    nullable_match = re.search(r'nullable\s*=\s*(False|True)', field_def)
                    is_required = nullable_match and nullable_match.group(1) == 'False'
                    
                    # 检查是否为主键
                    is_primary = 'primary_key=True' in field_def or 'primary_key = True' in field_def
                    
                    # 检查默认值
                    default_match = re.search(r'default\s*=\s*[\'"]?([^\'",()\s]+)[\'"]?', field_def)
                    default_value = default_match.group(1) if default_match else None
                    
                    # 构建字段配置
                    field_config = {
                        'name': field_name,
                        'label': label,
                        'type': field_type
                    }
                    
                    # 添加验证器
                    if is_required and not is_primary:
                        field_config['validators'] = [{'name': 'data_required'}]
                    
                    # 主键设置为只读
                    if is_primary:
                        field_config['render_kw'] = {'readonly': True}
                    
                    if default_value and default_value not in ['None', 'null', 'datetime.now', 'datetime.utcnow']:
                        field_config['default'] = default_value
                    
                    model_fields.append(field_config)
            
            # 如果有字段，创建 schema
            if model_fields:
                # 查找主键字段
                primary_key = 'id'
                for field in model_fields:
                    if field.get('render_kw', {}).get('readonly') and field['name'] in ['id', f"{model_name}_id"]:
                        primary_key = field['name']
                        break
                
                schema = {
                    'name': model_name,
                    'label': class_name,
                    'primary_key': primary_key,
                    'entry': 'list',
                    'parent': '',
                    'action': [
                        {'name': 'list', 'template': 'tablebase'},
                        {'name': 'create', 'template': 'formbase'},
                        {'name': 'edit', 'template': 'editbase'},
                        {'name': 'delete', 'template': 'button'}
                    ],
                    'fields': model_fields,
                    'base_props': {
                        'column_list': [f['name'] for f in model_fields[:6]],
                        'form_columns': [f['name'] for f in model_fields if not f.get('render_kw', {}).get('readonly')],
                        'page_size': 20
                    },
                    'custom_actions': []
                }
                schemas.append(schema)
        
        # 如果找到多个模型，返回列表；否则返回单个或空
        if len(schemas) > 1:
            return schemas
        elif len(schemas) == 1:
            return schemas[0]
        # 如果没有找到任何模型，继续使用旧逻辑（向后兼容）
    
    
    if file_type == 'sql':
        # 解析 SQL DDL
        # 提取表名
        table_match = re.search(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?', content, re.IGNORECASE)
        if table_match:
            model_name = table_match.group(1).lower()
        
        # 提取字段定义
        # 匹配字段行
        field_pattern = r'`?(\w+)`?\s+([\w()]+)(?:\s+([^,\n]+))?'
        matches = re.finditer(field_pattern, content)
        
        for match in matches:
            field_name = match.group(1)
            sql_type = match.group(2).upper()
            constraints = match.group(3) or ''
            
            # 跳过 PRIMARY KEY, FOREIGN KEY 等约束
            if field_name.upper() in ['PRIMARY', 'FOREIGN', 'KEY', 'INDEX', 'CONSTRAINT', 'UNIQUE']:
                continue
            
            # 推断类型
            field_type = 'String'
            for sql_t, schema_type in type_mapping.items():
                if sql_type.startswith(sql_t):
                    field_type = schema_type
                    break
            
            # 检查是否必填
            is_required = 'NOT NULL' in constraints.upper()
            
            # 检查默认值
            default_match = re.search(r'DEFAULT\s+[\'"]?([^\'",()\s]+)[\'"]?', constraints, re.IGNORECASE)
            default_value = default_match.group(1) if default_match else None
            
            # 检查注释
            comment_match = re.search(r'COMMENT\s+[\'"]([^\'"]+)[\'"]', constraints, re.IGNORECASE)
            label = comment_match.group(1) if comment_match else field_name
            
            # 构建字段配置
            field_config = {
                'name': field_name,
                'label': label,
                'type': field_type
            }
            
            if is_required:
                field_config['validators'] = [{'name': 'data_required'}]
            
            if default_value and default_value.upper() not in ['NULL', 'CURRENT_TIMESTAMP']:
                field_config['default'] = default_value
            
            fields.append(field_config)
    
    elif file_type == 'json':
        # 解析 JSON Schema 或现有配置（支持Python格式的schema定义）
        data = None
        
        # 首先尝试用 JSON 解析
        try:
            data = json.loads(content)
        except json.JSONDecodeError:
            # 如果JSON解析失败，尝试作为Python代码解析
            try:
                # 提取 schema = {...} 的内容
                schema_match = re.search(r'schema\s*=\s*(\{.*\})', content, re.DOTALL)
                if schema_match:
                    schema_str = schema_match.group(1)
                else:
                    schema_str = content
                
                # 移除Python注释（行尾的 # 注释）
                lines = schema_str.split('\n')
                cleaned_lines = []
                for line in lines:
                    # 检查是否在字符串内
                    in_string = False
                    quote_char = None
                    cleaned_line = []
                    i = 0
                    while i < len(line):
                        char = line[i]
                        # 处理字符串
                        if char in ['"', "'"]:
                            if not in_string:
                                in_string = True
                                quote_char = char
                            elif char == quote_char and (i == 0 or line[i-1] != '\\'):
                                in_string = False
                                quote_char = None
                            cleaned_line.append(char)
                        # 处理注释
                        elif char == '#' and not in_string:
                            # 遇到注释，跳过剩余部分
                            break
                        else:
                            cleaned_line.append(char)
                        i += 1
                    cleaned_lines.append(''.join(cleaned_line))
                
                schema_str = '\n'.join(cleaned_lines)
                
                # 处理 copy_rule 的特殊格式
                # 1. {"开启"} -> 移除整行（使用默认行为）
                schema_str = re.sub(r'"copy_rule":\s*\{\s*["\']开启["\']\s*\}\s*,?\s*\n?', '', schema_str)
                # 2. {} 保持原样（可复制有按钮）
                # 3. "关闭" 保持原样（不可复制）
                
                # 使用 ast.literal_eval 安全地解析Python字面量
                data = ast.literal_eval(schema_str)
            except (ValueError, SyntaxError) as e:
                print(f"Python parsing error: {e}")
                print(f"Content: {schema_str[:500]}")  # 打印前500个字符用于调试
                pass
        
        # 如果成功解析了数据
        if data and isinstance(data, dict):
            # 如果是完整的 schema
            if 'name' in data and 'fields' in data:
                return data
            # 如果是字段定义
            elif 'properties' in data:
                # JSON Schema format
                model_name = data.get('title', 'imported_model').lower()
                for field_name, field_def in data['properties'].items():
                    json_type = field_def.get('type', 'string')
                    field_type = {
                        'string': 'String',
                        'integer': 'Integer',
                        'number': 'Float',
                        'boolean': 'Boolean',
                        'object': 'Json',
                        'array': 'Json'
                    }.get(json_type, 'String')
                    
                    fields.append({
                        'name': field_name,
                        'label': field_def.get('title', field_name),
                        'type': field_type
                    })
    
    # 向后兼容：如果没有解析到字段，尝试简单的键值对
    if not fields and file_type not in ['python']:  # Python 已经处理了多模型
        # 尝试解析简单的字段列表（一行一个字段名）
        lines = content.strip().split('\n')
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#') and not line.startswith('//'):
                # 简单的字段名
                field_name = re.sub(r'[^\w]', '', line)
                if field_name:
                    fields.append({
                        'name': field_name,
                        'label': field_name.replace('_', ' ').title(),
                        'type': 'String'
                    })
    
    # 构建完整的 schema（向后兼容单模型场景）
    if fields:
        schema = {
            'name': model_name,
            'label': model_name.replace('_', ' ').title(),
            'primary_key': 'id',
            'entry': 'list',
            'parent': '',
            'action': [
                {'name': 'list', 'template': 'tablebase'},
                {'name': 'create', 'template': 'formbase'},
                {'name': 'edit', 'template': 'editbase'},
                {'name': 'delete', 'template': 'button'}
            ],
            'fields': fields,
            'base_props': {
                'column_list': [f['name'] for f in fields[:6]],  # 默认显示前6个字段
                'form_columns': [f['name'] for f in fields if f['name'] != 'id'],
                'page_size': 20
            },
            'custom_actions': []
        }
        return schema
    
    # 如果什么都没解析到，返回空 schema
    return {
        'name': 'imported_model',
        'label': 'Imported Model',
        'primary_key': 'id',
        'entry': 'list',
        'parent': '',
        'action': [
            {'name': 'list', 'template': 'tablebase'},
            {'name': 'create', 'template': 'formbase'},
            {'name': 'edit', 'template': 'editbase'},
            {'name': 'delete', 'template': 'button'}
        ],
        'fields': [],
        'base_props': {
            'column_list': [],
            'form_columns': [],
            'page_size': 20
        },
        'custom_actions': []
    }


