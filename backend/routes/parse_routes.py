"""解析路由"""
from flask import request, jsonify, Blueprint
from ..services.parser import parse_model_file

bp = Blueprint('parse', __name__)

@bp.route("/api/parse_model", methods=["POST"])
def parse_model():
    """解析模型文件并返回 schema 配置（支持单个或多个模型）"""
    try:
        data = request.json
        content = data.get('content', '')
        file_type = data.get('file_type', 'auto')
        
        if not content:
            return jsonify({
                'success': False,
                'error': '请提供文件内容'
            }), 400
        
        # 解析模型文件
        result = parse_model_file(content, file_type)
        
        # 检查是否返回了多个模型
        if isinstance(result, list):
            # 返回多个模型
            return jsonify({
                'success': True,
                'is_multiple': True,
                'schemas': result
            })
        elif isinstance(result, dict):
            # 返回单个模型
            return jsonify({
                'success': True,
                'is_multiple': False,
                'schema': result
            })
        else:
            return jsonify({
                'success': False,
                'error': '解析失败，无法识别的格式'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

