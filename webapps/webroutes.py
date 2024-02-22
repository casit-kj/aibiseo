"""
module.name : webroutes.py
module.purpose: AiBiseo Flask Blue Routes
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

from flask import Flask, render_template, jsonify, request

class RouterManager:
    def __init__(self, app, loggerManager, llmServer):
        self.app = app
        self.loggerManager = loggerManager
        self.llmServer = llmServer
        self.register_routes()
    
    def register_routes(self): 
                       
        @self.app.route("/")
        def index():
            return render_template('index.html')
        
        @self.app.route("/api/chat", methods=["POST"])
        def chatPost():
            # Validate dataType                        
            if request.content_type != 'application/json':
                response_data = {
                    "status": "405",
                    "results": {
                        "answer": "error: Content-Type must be application/json"
                    }
                }
                return response_data
            
            # Validate LLM Model Loadding
            if self.llmServer.model == None:
                response_data = {
                    "status": "405",
                    "results": {
                        "answer": "error: CAS BW LLM model is not loaded."
                    }
                }
                return response_data
            
            # Generate Login
            reqJsonData = request.get_json()
            prompt = reqJsonData['prompt']
            reference = reqJsonData['reference']
            dialog = reqJsonData['dialog'] 
            
            self.llmServer.generate(prompt)
            answer = self.llmServer.generate(prompt)
                       
            resultData = {
                "status": "200",
                "results": {
                    "prompt": prompt,
                    "reference": reference,
                    "dialog": dialog,
                    "answer": answer
                }
            }                          
            return resultData

        @self.app.route("/api/chat", methods=['GET'])
        def chatGet():                        
            return 'Welcome, get'            
           
  