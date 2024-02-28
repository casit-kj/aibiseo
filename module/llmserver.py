"""
module.name : mngmodel.py
module.purpose: AiBiseo LLM Model Manager
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from module.mnglogger import LoggingManager

class LLMServer:
    def __init__(self, appLogger, configJsonData):
        self.appLogger = appLogger
        self.configJsonData = configJsonData
        self.appBaseDir = self.configJsonData['basedir']
        self.modelDir = self.configJsonData['modeldir']
        self.selectModelName = self.configJsonData['select_model']     
        self.usingTokenizer = None
        self.usingModel = None
    
    # 로딩 상태 반환
    def is_alive(self):
        if self.usingTokenizer is not None and self.usingModel is not None:
            return True
        else:
            return False
        
    # 선택 모델이름 반환
    def get_model_name(self):
        return self.selectModelName
            
    # 모델, 토큰라이즈 로딩    
    def load_model(self):
        self.usingModelConfigEncode = self.get_config_setting(self.configJsonData, self.selectModelName, "encode")
        self.usingModelConfigDecode = self.get_config_setting(self.configJsonData, self.selectModelName, "decode")        
        self.usingModelConfigGenerate = self.get_config_setting(self.configJsonData, self.selectModelName, "generate")
                
        message = f"{self.selectModelName} 모델 로딩.."
        self.appLogger.printModelLogger(message)
        load_model_path = os.path.join(self.modelDir, self.selectModelName)
        self.usingModel = AutoModelForCausalLM.from_pretrained(load_model_path)          
        self.usingTokenizer = AutoTokenizer.from_pretrained(load_model_path)      
        self.usingTokenizer.pad_token = self.usingTokenizer.eos_token
                
    # 모델 내리기                  
    def unload_model(self):
        self.usingModel = None  
        self.usingTokenizer = None
        message = f"{self.selectModelName} 모델 언로딩.."   
        self.appLogger.printModelLogger(message)   
    
    # 모델에 대한 설정 반환
    def get_config_setting(self, config_dataset, model_name, option_name):
        prompt_config = None
        for model in config_dataset['models']:
            # 주어진 모델 이름과 일치하는 경우
            if model['name'] == model_name:
                # 해당 모델의 프롬프트 설정을 반환합니다.
                prompt_config = model[option_name]
                if not prompt_config:
                    for key, value in prompt_config.items():                        
                        if value == 'true':    # 문자열 'true'는 불리언 True로 변환
                            prompt_config[key] = True
                        elif value == 'false': # 문자열 'false'는 불리언 False로 변환
                            prompt_config[key] = False          
        self.appLogger.printModelLogger(prompt_config)
        return prompt_config
    
          
    # 과거 질문에 대한 메시지 준비
    def create_previous_conversations(self, messages):        
        conversation = "" # 대화 텍스트 준비
        for message in messages:
            if message['sender'] == 'user':            
                conversation += f"\n질문: {message['content']}</s>\n" # 사용자 메시지 처리
            elif message['sender'] == 'assistant':            
                conversation += f"답변: {message['content']}</s>\n\n"    # 보조자(AI) 메시지 처리
        return conversation
    
    # LLM에 질문하기 위한 프롬프트 생성
    def create_prompt(self, preprompt, question, reference, history):
        prompt_text = f"\n{preprompt}</s>\n"  # 대화 텍스트 준비        
        prompt_text += "질문: " + question + "</s>\n\n"  # 질문 추가

        if reference:    
            prompt_text += "참고자료:\n"  # 참고자료 시작
            for i, material in enumerate(reference, start=1):
                prompt_text += f"{i}. {material}\n"
            prompt_text += "</s>\n\n"  # 참고자료 섹션 끝에 추가적인 줄바꿈  
         
        if history:                  
            prompt_text += "과거 대화:\n" + self.create_previous_conversations(history) + "</s>\n"  # 과거 대화 섹션 

        return prompt_text
    
    # 문장 생성
    def generate(self, dialog_prompt):
        inputs = self.usingTokenizer.encode_plus(dialog_prompt, **self.usingModelConfigEncode)
        generate_ids = self.usingModel.generate(input_ids=inputs['input_ids'], **self.usingModelConfigGenerate)
        output = self.usingTokenizer.decode(generate_ids[0], **self.usingModelConfigDecode)
        return output    