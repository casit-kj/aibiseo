"""
module.name : mngmodel.py
module.purpose: AiBiseo LLM Model Manager
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

class ModelManager:
    def __init__(self):
        self.model = None
        
    def load_model(self, model_path):
        self.model = model_path
        
    def unload_model(self):
        self.model = None
        
        
        
#model_manager = ModelManager()
#model_manager.load_model('path')
#model_manager.unload_model()
    
    
