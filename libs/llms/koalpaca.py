"""
module.name : model_koalpaca.py
module.purpose: 코알파카 모델
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

import os
import torch
from transformers import pipeline, AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from libs.mods.mnglogger import LoggingManager

class KoAlpaca:
    def __init__(self, appLogger, model_dir, model_name):
        self.appLogger = appLogger
        self.model_name = model_name
        self.model_id = os.path.join(model_dir, model_name)
        
    def load(self):                
        bnb_config = BitsAndBytesConfig(
            load_in_8bit=True,
            bnb_8bit_use_double_quant=True,
            bnb_8bit_quant_type="nf4",
            bnb_8bit_compute_dtype=torch.bfloat16,
        )
        
        model = AutoModelForCausalLM.from_pretrained(
            self.model_id,
            device_map="auto",
            revision="8bit",
            low_cpu_mem_usage=True,
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
                
        return model, tokenizer, pipe