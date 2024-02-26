"""
module.name : mnglogger.py
module.purpose: AiBiseo Logger Manager
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

import logging
from logging.handlers import RotatingFileHandler
import os
import time
from datetime import datetime

class LoggingManager:   
     
    log_dir = None
    loggerApp = None
    loggerError = None
    loggerModel = None
    
    def __init__(self, log_dir):
        LoggingManager.log_dir = log_dir
        LoggingManager.loggerApp = self.create_logger('app_logger', 'webserver-app.log')
        LoggingManager.loggerError = self.create_logger('error_logger', 'webserver-error.log')
        LoggingManager.loggerModel = self.create_logger('model_logger', 'llm-model.log')
    
    # 로거가 정상적으로 생성되었는지 확인한다.
    def preparedLogger(self):
        return all([LoggingManager.loggerApp, LoggingManager.loggerError, LoggingManager.loggerModel])

    # 로거 공통 생성
    def create_logger(self, logger_name, file_name):        
        """공통 로거 생성 메서드."""
        logger = logging.getLogger(logger_name)
        logger.setLevel(logging.DEBUG)

        # 콘솔 핸들러 설정
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.DEBUG)
        formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

        # 파일 핸들러 설정
        log_file_path = os.path.join(LoggingManager.log_dir, file_name)
        file_handler = RotatingFileHandler(log_file_path, maxBytes=1024*1024*5, backupCount=5)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        
        return logger
    
    def getAppLogger(self):
        return LoggingManager.loggerApp
    
    def getErrorLogger(self):
        return LoggingManager.loggerError
    
    def getModelLogger(self):
        return LoggingManager.loggerModel
    
    @staticmethod 
    def StartWebserver():
        LoggingManager.loggerApp.info('')
        LoggingManager.loggerApp.info("-------------------------------------------------")
        current_time = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        log_message = f"BrainBiseo Daemon start time: {current_time}"
        LoggingManager.loggerApp.info(log_message)
        time.sleep(0.1)
    
    @staticmethod 
    def StopWebServer():
        current_time = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        log_message = f"Daemon stop time: {current_time}"
        LoggingManager.loggerApp.info(log_message)
        
    def printAppLogger(self, message):
        LoggingManager.loggerApp.info(message)  
        
    def printErrorLogger(self, message):
        LoggingManager.loggerError.info(message)      
        
    def printModelLogger(self, message):
        LoggingManager.loggerError.info(message)                       