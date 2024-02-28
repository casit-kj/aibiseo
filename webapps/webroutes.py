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
            
            # Generate Login
            reqJsonData = request.get_json()
            
            # Create prompt for LLM           
            preprompt = "대화준비"
            query = reqJsonData['query']
            reference = reqJsonData['reference'] 
            history = reqJsonData['history']                      
            reQuery = self.llmServer.create_prompt(preprompt, query, reference, history)
                        
            if self.llmServer.is_alive():
                answer = self.llmServer.generate(reQuery)
            else:
                answer = self.llmServer.get_model_name() + " 모델이 로딩되지 않았습니다."
                       
            resultData = {
                "result": {
                    "status": True,
                    "code": "200",
                    "text": answer
                }
            }                          
            return resultData

        @self.app.route("/api/chat", methods=['GET'])
        def chatGet():                        
            return 'Welcome, get'            
           
  