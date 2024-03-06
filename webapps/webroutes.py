"""
module.name : webroutes.py
module.purpose: AiBiseo Flask Blue Routes
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

import time
from flask import Flask, render_template, jsonify, request
import module.mhash as support_module
from datetime import datetime
class RouterManager:
    def __init__(self, app, loggerManager, dbServer, llmServer):
        self.app = app
        self.loggerManager = loggerManager
        self.dbServer = dbServer
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
                      
            # 전송데이터
            reqJsonData = request.get_json()
            
            # 입력 변수 확인
            try:
                question = reqJsonData['question']
                reference = reqJsonData['reference'] 
                past_dialog = reqJsonData['past_dialog']
                user_id = reqJsonData['user_id']
                dialog_id = reqJsonData['dialog_id']
                dialog_create_at = reqJsonData['create_at'] 
            except:                
                resultData = {
                    "result": {
                        "status": False,
                        "code": "200",
                        "answer": "에러: 입력 파라메터 값을 확인하세요.",
                    }
                }
                return resultData                
            
            # 대화 ID 생성                                             
            if dialog_id == None or dialog_id == "":
                dialog_id = support_module.make_hash(str(time.time()))
                dialog_create_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')                   
            # 질문답변 아이디 생성
            qna_id = support_module.make_hash(str(time.time()))
            # GenAI LLM 답변 요청 
            # 질문을 가지고 LLM에 질문하는 시간           
            preprompt = "대화준비"                          
            assistant_start_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')                                                         
            if self.llmServer.is_alive():                            
                reQuery = self.llmServer.create_prompt(preprompt, question, reference, past_dialog)
                answer = self.llmServer.generate(reQuery)
                                
            else:
                answer = self.llmServer.get_model_name() + " 모델이 로딩되지 않았습니다."                           
            # 질문에 대한 LLM 답변이 끝나는 시간
            assistant_end_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S') 
            
            # 결과 저장                         

            data = {
                    "question":question,
                    "answer": answer,
                    "user_id": user_id,
                    "dialog_id": dialog_id,
                    "dialog_create_at": dialog_create_at,
                    "start_at": assistant_start_at,
                    "end_at": assistant_end_at,
                    "qna_id": qna_id
                }
            # DB 에 저장하는 부분
            message, code = self.dbServer.insertDialog(data)  
            print(f"데이터베이스 저장 결과: {code} : {message}")
                     
        
            resultData = {
                "result": {
                    "status": True,
                    "code": "200",
                    "question":question,
                    "answer": answer,
                    "past_dialog": past_dialog,
                    "user_id": user_id,
                    "dialog_id": dialog_id,
                    "dialog_create_at": dialog_create_at,
                    "start_at": assistant_start_at,
                    "end_at": assistant_end_at,
                    "qna_id": qna_id,
                    "db_insert": code
                }
            }                        
            return resultData
           
        @self.app.route("/api/delDialog", methods=['POST'])
        def chatDeleteDialog():   
            self.dbServer.connection()            
            # 작업            
            self.dbServer.disconnection()                    
            return 'Welcome, get'
        
        @self.app.route("/api/chatList", methods=['GET'])
        def chatList():              
            # 작업       
            message, code = self.dbServer.chatlist()
                       
            return jsonify({'result_Data': message,
                            'status':code})
    
               
                 
           
  