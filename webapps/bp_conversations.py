"""
module.name : conversition_blueprint.py
module.purpose: Index bluepoint
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

from flask import Blueprint, request, jsonify, Flask, render_template, session
import json, time
from datetime import datetime
import libs.mhash as support_module
from libs.mnglogger import LoggingManager
from libs.prompter import prompter
import requests

class ConversitionBlueprint:
    def __init__(self, loggerManager, dbServer, modelConfig):  
        self.loggerManager = loggerManager
        self.modelConfig = modelConfig
        self.dbServer = dbServer
            
    # 대화 함수(문장생성)        
    def conversition(self, reqJsonData):
                      
        # 데이터를 확인한다.
        result, json_dataset = self.validate_request_data(reqJsonData)
        
        if not result:
            return json_dataset               
        # 답변 요청
        ''' LLM 서버에 답변을 요청하는 부분
        '''
        assistant_start_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')  
        gen_result, response_answer = self.generation(json_dataset['question'], json_dataset['reference'], json_dataset['past_dialog'])
        assistant_end_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')        
                
        json_dataset['answer'] = response_answer
        json_dataset['assistant_start_at'] = assistant_start_at
        json_dataset['assistant_end_at'] = assistant_end_at

        # 결과를 데이터베이스에 저장한다.
        result, db_write_response = self.write_database(json_dataset, gen_result=True)
       
        # 반환 Dataset 을 생성한다.                    
        resultData = {
            "result": {
                "status": True,
                "code": "200",
                "question": json_dataset['question'],
                "answer": json_dataset['answer'],
                "past_dialog": json_dataset['past_dialog'],
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
    def write_database(self, dataset, gen_result=True):
        if session.get('logged_in'):
            chatuserid = session.get('uname')
        else:
            chatuserid = ""
        put_data = {
                "question": dataset['question'],
                "answer": dataset['answer'],
                "user_id": dataset['user_id'],
                "dialog_id": dataset['dialog_id'],
                "dialog_create_at": dataset['dialog_create_at'],
                "start_at": dataset['assistant_start_at'],
                "end_at": dataset['assistant_end_at'],
                "qna_id": dataset['qna_id'],
                "chat_user_id": chatuserid

            }
        if gen_result:
            message, result = self.dbServer.insertDialog(put_data)
        else:
            message = "모델이 로딩되지 않았습니다."
            result = False
        return result, message
    
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
            
    # GenAI 와의 대화
    # LLM 서버에 접속하여 데이터를 수신한다.
    def generation(self, question, reference, past_dialog):        
        preprompt = "대화준비" 
        conversation = prompter(preprompt, past_dialog, question, reference)                                                     
        endpoints = self.modelConfig['endpoints']
        params = self.modelConfig['parameters']
        url = endpoints['url'] + endpoints['func']
        
        if self.check_server_status(endpoints['url']):
            try:
                header = {"Content-Type": "application/json"}
                data = json.dumps({"prompt": conversation,"params": params})                
                #응답요청
                receive_data = requests.post(url, headers=header, data=data)
                if receive_data.status_code == 200:
                    try:
                        response = receive_data.json()
                        status = response['status']
                        answer = response['answer']                        
                        self.loggerManager.printAppLogger(response)
                        return True, answer
                    except ValueError:
                        return False, "Response content is not in JSON format."                    
                else:
                    return False, f"Error: {receive_data.status_code}"                              
            except requests.exceptions.RequestException as e: 
                return False, f"요청 중 오류가 발생했습니다: {e}"                       
        else:
            return False, "LLM 서버 상태를 확인하십시요."   
    
    # LLM Server Check   
    def check_server_status(self, url):
        try:
            response = requests.get(url + "/alive")
            if response.status_code == 200:
                return True
            else:
                return False            
        except requests.exceptions.RequestException as e:
            print(f"Error: {e}")
            return False