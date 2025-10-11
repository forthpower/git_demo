"""Routes Package"""
from flask import Blueprint

# 创建蓝图
model_bp = Blueprint('model', __name__, url_prefix='/api')
parse_bp = Blueprint('parse', __name__, url_prefix='/api')
sync_bp = Blueprint('sync', __name__, url_prefix='/api')

def register_routes(app):
    """注册所有路由"""
    from . import model_routes, parse_routes, sync_routes
    app.register_blueprint(model_bp)
    app.register_blueprint(parse_bp)
    app.register_blueprint(sync_bp)
