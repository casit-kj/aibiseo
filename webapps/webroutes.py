"""
module.name : webroutes.py
module.purpose: AiBiseo Flask Blue Routes
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

from flask import render_template, jsonify, request

class RouterManager:
    def __init__(self, app):
        self.app = app
        self.register_routes()
    
    def register_routes(self):                
        @self.app.route("/")
        def index():
            return render_template('index.html')
        
        @self.app.route("/api/chat", methods=['POST'])
        def chat_post():
            request_data = request.json  # 클라이언트로부터 받은 JSON 데이터
            response_data = {
                "message": "Data received",
                "yourData": request_data
            }
            return jsonify(response_data)