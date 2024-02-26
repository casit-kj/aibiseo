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

class LLMServer:
    def __init__(self, configJsonData):
        self.configJsonData = configJsonData
        self.appBaseDir = self.configJsonData['basedir']
        self.modelDir = self.configJsonData['modeldir']
        self.modelInfo = self.configJsonData['model']
        self.modelName = self.modelInfo['name']
        self.modelSequences = self.modelInfo['sequences']
        self.modelTemperature = self.modelInfo['temperature']
        self.modelMaxToken = self.modelInfo['max_token']
        self.tokenizer = None
        self.model = None
    
    '모델 로딩하기'    
    def load_model(self):
        model_name = os.path.join(self.modelDir, self.modelName)
        # 토큰라이저 설정        
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)        
        # 모델 로딩
        self.model = AutoModelForCausalLM.from_pretrained(model_name)        
                
        '모델 언로딩하기'                    
    def unload_model(self):
        self.tokenizer = None
        self.model = None
        
    def make_query(self, query, content):
        query_json = {
            "질문": "\{참고자료\}를 참조하여 \{요청\}에 대한 답변을 해줘",
            "\{요청\}": query,
            "\{참고자료\}": content
        }
        return query_json
                
    '문장 생성하기'
    def generate2(self, prompt):        
        #inputs = self.tokenizer.encode(prompt,return_tensors="pt")
        inputs = self.tokenizer(prompt, padding=True, truncation=True, return_tensors="pt")
        generate_ids = self.model.generate(input_ids=inputs['input_ids'],
                                      attention_mask=inputs['attention_mask'],
                                      max_length=self.modelMaxToken, 
                                      num_return_sequences=self.modelSequences,
                                      temperature=self.modelTemperature,
                                      )    
        llm_answer = self.tokenizer.decode(generate_ids[0], skip_special_tokens=True, clean_up_tokenization_spaces=False)
        return llm_answer
    
    '문장 생성하기'
    def generate(self, prompt):        
        #inputs = self.tokenizer.encode(prompt,return_tensors="pt")
        inputs = self.tokenizer(prompt, padding=True, truncation=True, return_tensors="pt")
        generate_ids = self.model.generate(input_ids=inputs['input_ids'],
                                      attention_mask=inputs['attention_mask'],
                                      max_length=self.modelMaxToken, 
                                      num_return_sequences=self.modelSequences,
                                      temperature=self.modelTemperature,
                                      )    
        llm_answer = self.tokenizer.decode(generate_ids[0], skip_special_tokens=True, clean_up_tokenization_spaces=False)
        return llm_answer    
        
    
    
