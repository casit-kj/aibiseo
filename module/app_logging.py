import logging
from logging.handlers import RotatingFileHandler
import os

def setup_logging(logdir):
    logger = logging.getLogger('MyAppLogger')
    logger.setLevel(logging.DEBUG)

    # 콘솔 핸들러 설정
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # 파일 핸들러 설정
    log_file_path = os.path.join(logdir,'app.log')  # 로그 파일 경로 설정
    file_handler = RotatingFileHandler(log_file_path, maxBytes=1024*1024*5, backupCount=5)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    return logger