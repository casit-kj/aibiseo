"""
module.name : webroutes.py
module.purpose: AiBiseo Flask Blue Routes
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

from flask import Flask, render_template, jsonify, request

class RouterManager:
    def __init__(self, app):
        self.app = app
        self.register_routes()
    
    def register_routes(self): 
                       
        @self.app.route("/")
        def index():
            return render_template('index.html')
        
        @self.app.route("/api/chat", methods=['POST'])
        def chatPost():
            print("왜 에러가 나는 거지")
            if request.content_type != 'application/json':
                return jsonify({"error": "Content-Type must be application/json"}), 415            
            answer = request.get_data()
            dialog = {
                'request' : answer,
                'response' : 'my name is haengun'
            }            
            return dialog
  