"""
module.name : llmserver.py
module.purpose: AiBiseo LLM Model Manager
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

import os
import torch
from transformers import LlamaForCausalLM, LlamaTokenizer
from module.mnglogger import LoggingManager
from model.koalpaca import KoAlpaca
from model.llama2hf import Llama2HF

class LLMServer:
    def __init__(self, appLogger, configJsonData):
        self.appLogger = appLogger
        self.configJsonData = configJsonData
        self.appBaseDir = self.configJsonData['basedir']
        self.modelDir = self.configJsonData['modeldir']
        self.selectModelName = self.configJsonData['select_model']
        self.Tokenizer = None
        self.Model = None
        self.Pipe = None
    
    # 로딩 상태 반환
    def is_alive(self):
        if self.Tokenizer is not None and self.Model is not None:
            return True
        else:
            return False
        
    # 선택 모델이름 반환
    def get_model_name(self):
        return self.selectModelName
            
    # 모델, 토큰라이즈 로딩    
    def load_model(self):        
        message = f"{self.selectModelName} 모델 로딩 중....."
        self.appLogger.printModelLogger(message)
            
        if self.selectModelName == "casllm-base-7b-hf":
            llama2Hf = Llama2HF(self.appLogger, self.modelDir, self.selectModelName, self.configJsonData['models'][self.selectModelName])
            self.Model, self.Tokenizer, self.Pipe = llama2Hf.load()            
        elif self.selectModelName == "KoAlpaca-Polyglot-12.8B":
            koalpaca = KoAlpaca(self.appLogger, self.modelDir, self.selectModelName, self.configJsonData['models'][self.selectModelName])
            self.Model, self.Tokenizer, self.Pipe = koalpaca.load()
            
        if self.is_alive():   
            message = f"{self.selectModelName} 모델을 로딩이 되었습니다."
            self.appLogger.printModelLogger(message)
        else:
            message = f"{self.selectModelName} 모델 로딩에 실패하였습니다."
            self.appLogger.printModelLogger(message)
                
    # 모델 내리기                  
    def unload_model(self):
        self.Model = None  
        self.Tokenizer = None
        self.Pipe = None
        message = f"{self.selectModelName} 모델을 언로딩 하였습니다."   
        self.appLogger.printModelLogger(message)
        
        
    # 문장 생성
    def generate(self, dialog_prompt):
        answer = self.Pipe(
            dialog_prompt,
            do_sample=True,
            max_new_tokens=2000,
            temperature=0.7,
            top_p=0.9,
            return_full_text=False,
            eos_token_id=2,
        )
        return answer[0]['generated_text']
            
    # 문장 생성
    def generate2(self, dialog_prompt):
        inputs = self.usingTokenizer(dialog_prompt, return_tensors="pt")
        generate_ids = self.usingModel.generate(inputs['input_ids'], max_length=2000)
        output = self.usingTokenizer.decode(generate_ids[0]['generated_text'], skip_special_tokens=False)
        self.appLogger.printModelLogger(output)
        return output            