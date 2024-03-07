"""
module.name : conversition_blueprint.py
module.purpose: Index bluepoint
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

from flask import Blueprint, request, jsonify, Flask, render_template
import time
from datetime import datetime
import module.mhash as support_module
from model.system_prompt import composit_question
from module.mnglogger import LoggingManager
from module.dbsource import DBSource
from model.llm_server import LLMServer

class ConversitionBlueprint:
    def __init__(self, loggerManager, dbServer, llmServer):  
        self.loggerManager = loggerManager
        self.llmServer = llmServer
        self.dbServer = dbServer
            
    # 대화 함수(문장생성)        
    def conversition(self, reqJsonData):
                      
        # 데이터를 확인한다.
        result, json_dataset = self.validate_request_data(reqJsonData)
        if not result:
            return json_dataset
        
        # GenAI에 요청 시간
        assistant_start_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')  
                
        # 답변 요청
        response_answer = self.generation(json_dataset['question'], json_dataset['reference'], json_dataset['past_dialog'])
        
        # GenAI 답변 종료 시간
        assistant_end_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        json_dataset['answer'] = response_answer
        json_dataset['assistant_start_at'] = assistant_start_at
        json_dataset['assistant_end_at'] = assistant_end_at
        
        # 결과를 데이터베이스에 저장한다.
        result, db_write_response = self.write_database(json_dataset)
        if not result:
           return db_write_response
        
        # 반환 Dataset 을 생성한다.                    
        resultData = {
            "result": {
                "status": True,
                "code": "200",
                "question": json_dataset['question'],
                "answer": json_dataset['answer'],
                "past_dialog":json_dataset['past_dialog'],
                "user_id": json_dataset['user_id'],
                "dialog_id": json_dataset['dialog_id'],
                "dialog_create_at": json_dataset['dialog_create_at'],
                "start_at": json_dataset['assistant_start_at'],
                "end_at": json_dataset['assistant_end_at'],
                "qna_id": json_dataset['qna_id'],
                "db_insert": db_write_response['result']['code']
            }
        }                        
        return resultData
    
    # 데이터베이스에 저장
    def write_database(self, dataset):                      
        put_data = {
                "question": dataset['question'],
                "answer": dataset['answer'],
                "user_id": dataset['user_id'],
                "dialog_id": dataset['dialog_id'],
                "dialog_create_at": dataset['dialog_create_at'],
                "start_at": dataset['assistant_start_at'],
                "end_at": dataset['assistant_end_at'],
                "qna_id": dataset['qna_id']
            }
        # DB 에 저장하는 부분
        message, result = self.dbServer.insertDialog(put_data)
        return result, message
            
        
    # GenAI 와의 대화
    def generation(self, question, reference, past_dialog):        
        preprompt = "대화준비" 
        conversation = composit_question(preprompt, past_dialog, question, reference)            
                                                                                    
        if self.llmServer.is_alive():                            
            answer = self.llmServer.generate(conversation)
            return answer
        else:
            answer = self.llmServer.get_model_name() + " 모델이 로딩되지 않았습니다."
            return answer
    
    # 입력변수 재처리 함수
    def validate_request_data(self, reqJsonData):
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
            return False, resultData
                                  
        # 대화 ID 생성                                             
        if dialog_id == None or dialog_id == "":
            dialog_id = support_module.make_hash(str(time.time()))
            dialog_create_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S') 
                              
        # 질문답변 아이디 생성
        qna_id = support_module.make_hash(str(time.time()))        
        
        # 전처리된 데이터셋
        jsonDataset = {
            "question": question,
            "reference": reference,
            "past_dialog": past_dialog,
            "user_id": user_id,
            "dialog_id": dialog_id,
            "dialog_create_at": dialog_create_at,
            "qna_id": qna_id
        }
                
        return True, jsonDataset