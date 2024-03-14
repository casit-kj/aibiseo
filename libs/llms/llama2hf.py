"""
module.name : llama2hf.py
module.purpose: 라마2 허깅페이스 모델
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

import os
import torch
from transformers import pipeline, AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from libs.mods.mnglogger import LoggingManager

class Llama2HF:
    def __init__(self, appLogger, model_dir, model_name):
        self.appLogger = appLogger
        self.model_name = model_name
        self.model_id = os.path.join(model_dir, model_name)
        
    def load(self):                
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16

        )
        
        model = AutoModelForCausalLM.from_pretrained(
            self.model_id,
            do_sample=True,
            device_map="auto",       
            low_cpu_mem_usage=True,
            temperature=0.1,
            quantization_config=bnb_config,

        )
                        
        # tokenizer
        tokenizer = AutoTokenizer.from_pretrained(self.model_id)
                
        # pipe line
        pipe = pipeline(
            "text-generation",
            model=model,
            tokenizer=self.model_id,
        )
                
        return model, pipe