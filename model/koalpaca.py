"""
module.name : model_koalpaca.py
module.purpose: 코알파카 모델
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

import os
import torch
from transformers import pipeline, AutoModelForCausalLM, AutoTokenizer
from transformers import LlamaForCausalLM, LlamaTokenizer
from module.mnglogger import LoggingManager

class KoAlpaca:
    def __init__(self, appLogger, model_dir, model_name, model_config):
        self.appLogger = appLogger
        self.model_name = model_name
        self.model_config_encodder = model_config['encode']
        self.model_config_decoder = model_config['decode']
        self.model_config_generater = model_config['generate']
        self.model_id = os.path.join(model_dir, model_name)
        
    def load(self):
        # model
        model = AutoModelForCausalLM.from_pretrained(
            self.model_id,
            device_map="auto",
            load_in_8bit=True,
            revision="8bit",
            # max_memory=f'{int(torch.cuda.mem_get_info()[0]/1024**3)-2}GB'
        )
                
        # tokenizer
        tokenizer = AutoTokenizer.from_pretrained(self.model_id)
                
        # pipe line
        pipe = pipeline("text-generation", model=model, tokenizer=self.model_id,) # device=2,
                
        return model, tokenizer, pipe