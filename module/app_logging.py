import logging
from logging.handlers import RotatingFileHandler
import os
import time
from datetime import datetime

'''
create applocation logger
'''
def create_app_logger(logdir):
    logger = logging.getLogger('app_logger')
    logger.setLevel(logging.DEBUG)

    # 콘솔 핸들러 설정
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # 파일 핸들러 설정
    log_file_path = os.path.join(logdir,'app.log')  # 로그 파일 경로 설정
    file_handler = RotatingFileHandler(log_file_path, maxBytes=1024*1024*5, backupCount=5)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    return logger

'''
create error logger
'''
def create_error_logger(logdir):
    logger = logging.getLogger('error_logger')
    logger.setLevel(logging.DEBUG)

    # 콘솔 핸들러 설정
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # 파일 핸들러 설정
    log_file_path = os.path.join(logdir,'error.log')  # 로그 파일 경로 설정
    file_handler = RotatingFileHandler(log_file_path, maxBytes=1024*1024*5, backupCount=5)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    return logger

'''
create model logger
'''
def create_module_logger(logdir):
    logger = logging.getLogger('model_logger')
    logger.setLevel(logging.DEBUG)

    # 콘솔 핸들러 설정
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # 파일 핸들러 설정
    log_file_path = os.path.join(logdir,'model.log')  # 로그 파일 경로 설정
    file_handler = RotatingFileHandler(log_file_path, maxBytes=1024*1024*5, backupCount=5)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    return logger

def create_logger(logdir):
    return create_app_logger(logdir=logdir), create_error_logger(logdir=logdir), create_module_logger(logdir=logdir)

def app_print_start(logger):
    logger.info('')
    logger.info("-------------------------------------------------")
    current_time = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    log_message = f"BrainBiseo Daemon start time: {current_time}"
    logger.info(log_message)
    time.sleep(0.1)
    

def app_print_stop(logger):
    current_time = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    log_message = f"Daemon stop time: {current_time}"
    logger.info(log_message)
