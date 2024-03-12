"""
module.name : llama2hf.py
module.purpose: 라마2 허깅페이스 모델
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

import os
import torch
from transformers import pipeline, AutoModelForCausalLM, AutoTokenizer
from transformers import LlamaForCausalLM, LlamaTokenizer
from libs.mods.mnglogger import LoggingManager

class Llama2HF:
    def __init__(self, appLogger, model_dir, model_name, model_config):
        self.appLogger = appLogger
        self.model_name = model_name
        self.model_config_encodder = model_config['encode']
        self.model_config_decoder = model_config['decode']
        self.model_config_generater = model_config['generate']
        self.model_id = os.path.join(model_dir, model_name)
        
    # 모델로딩   
    def load(self):        
        model = LlamaForCausalLM.from_pretrained(self.model_id)          
        tokenizer = LlamaTokenizer.from_pretrained(self.model_id)   
        tokenizer.pad_token = tokenizer.eos_token
        pipeline = pipeline("text-generation", model=model, tokenizer=tokenizer)        
        return model, tokenizer, pipeline