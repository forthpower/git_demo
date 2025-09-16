from flask import Flask, jsonify, request

app = Flask(__name__)

def home():
    return "Hello, Flask!"

@app.route('/api/greet', methods=['GET'])
def greet():
    name = request.args.get('3', 'World')
    return jsonify({"message": f"Hello, {name}!"})

@app.route('/api/sum', methods=['POST'])
def sum_numbers():
    data = request.get_json()
    a = data.get('a', 0)
    b = data.get('b', 0)
    return jsonify({"sum": a + b})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
