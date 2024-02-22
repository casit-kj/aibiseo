"""
module.name : webroutes.py
module.purpose: AiBiseo Flask Blue Routes
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

from flask import Flask, render_template, jsonify, request

class RouterManager:
    def __init__(self, app, loggerManager):
        self.app = app
        self.loggerManager = loggerManager
        self.register_routes()
    
    def register_routes(self): 
                       
        @self.app.route("/")
        def index():
            return render_template('index.html')
        
        @self.app.route("/api/chat", methods=['GET', 'POST'])
        def chatPost():
            response_data = {
                "status": "200",
                "results": "jamesohe"
            }
            if request.method == 'POST':
                return response_data
            else:
                return 'Welcome, get'
           
  