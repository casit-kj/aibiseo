"""
module.name : manager.py
module.purpose: AiBiseo 프로젝트 관리 모듈
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""
import os, json, argparse

class ConfigManager:
    
    config_filename = "aibiseo.json"                
    def __init__(self):
        self.app_config_file = None             
        parser = argparse.ArgumentParser(description='Process some data.')
        parser.add_argument('--basedir', type=str, required=True, help='a string for app root directory')
        parser.add_argument('--logdir', type=str, required=True, help='a string for log directory')
        parser.add_argument('--cfgdir', type=str, required=True, help='a string for configuration file')
        parser.add_argument('--port', type=str, required=True, help='a string for service port')
        
        try:   
            self.args = parser.parse_args()
            if self.args.cfgdir.strip():
                self.app_config_file = os.path.join(self.args.cfgdir, ConfigManager.config_filename)
        except Exception as e:
            raise
    
    # 실행인자 반환    
    def get_args(self):
        return self.args
    
    def get_port(self):
        return self.args.port
    
    # AiBiseo 실행 경로 반환
    def get_basedir(self):
        return self.args.basedir
    
    # AiBiseo 환경 경로 반환
    def get_cfgdir(self):
        return self.args.cfgdir    
    
    # AiBiseo 실행 경로 반환
    def get_logdir(self):
        return self.args.logdir    
    
    # AiBiseo 웹서비스 포트 반환
    def get_webserver_port(self):
        return self.args.port
    
    def get_cfgfile(self):
        return self.app_config_file
    
    def exist_app_config_file(self):
        if self.app_config_file is not None:
            return os.path.exists(self.app_config_file)
        else:
            return False

    def get_config_json(self):
        if self.exist_app_config_file():
            try:
                with open(self.app_config_file, 'r') as file:
                    config = json.load(file)
                    return config
            except Exception as e:
                raise
        return None
    

"""
module.name : manager.py
module.purpose: AiBiseo console log print
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""    
import time
class ConsolePrint:
    # 클래스 변수로 포맷 문자열 선언
    time_format = "%Y-%m-%d %H:%M:%S"

    @staticmethod
    def startLog(msg):
        local_time = time.localtime()
        formatted_time = time.strftime(ConsolePrint.time_format, local_time)
        print(f"{formatted_time}\t{msg}")
        
        
    @staticmethod      
    def timeLog(msg):
        local_time = time.localtime()
        formatted_time = time.strftime(ConsolePrint.time_format, local_time)
        print(f"{formatted_time}\t{msg}")
    
    @staticmethod    
    def msgLog(msg):
        local_time = time.localtime()
        formatted_time = time.strftime(ConsolePrint.time_format, local_time)
        spaces = ' ' * len(formatted_time)
        print(f"{spaces}\t{msg}")
     
