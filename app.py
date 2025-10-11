"""Schema Generator - 主应用"""
from flask import Flask, send_from_directory
from flask_cors import CORS

# 创建应用
app = Flask(__name__, static_folder="static")
CORS(app)

# 初始化数据库
from backend.utils.db import init_db
init_db()

# 注册路由模块
from backend.routes import model_routes, parse_routes, sync_routes
app.register_blueprint(model_routes.bp)
app.register_blueprint(parse_routes.bp)
app.register_blueprint(sync_routes.bp)

# 静态文件路由
@app.route("/")
def index():
    """首页"""
    return app.send_static_file("index.html")

@app.route("/<path:filename>")
def static_files(filename):
    """其他静态文件"""
    return send_from_directory(app.static_folder, filename)

# 启动应用
if __name__ == "__main__":
    print('\n' + '='*60)
    print('  Schema Generator 启动中...')
    print('='*60)
    print(f'\n  📦 模块化架构')
    print(f'  🌐 访问: http://localhost:5010')
    print(f'  ⛔ 按 Ctrl+C 停止\n')
    app.run(debug=True, port=5010, host='0.0.0.0')
