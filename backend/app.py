from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return "Backend is running"  # または、簡単なメッセージを返す

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
