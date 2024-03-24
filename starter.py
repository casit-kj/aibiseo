""" 
목  적: LLM을 활용한 AI 챗봇시스템
작성자: 오행언 광주AI융합연구소 이사
소유권: (주)씨에이에스

(주의) 시스템을 구동하기 위해서는 ${HOME}/config/requirements.txt 설치
pip install -r requirements.txt
"""


import os, sys
import atexit
from libs.mods.mngcfg import ConfigManager, ConsolePrint
from libs.mods.mnglogger import LoggingManager
from libs.mods.dbsource import DBSource
from libs.llms.llm_server import LLMServer
from webapps.webserver import WebServer


def callApplicationDispatch(name, appLogger, appConfig):
    LoggingManager.StartWebserver()
    atexit.register(lambda: LoggingManager.StopWebServer)
    
    basedir = appConfig.get_basedir()
    static_dir = os.path.join(basedir, "webapps/static")
    templates_dir = os.path.join(basedir, "webapps/templates")
    
    
    json_configset = appConfig.get_config_json()
    dbServer = DBSource(json_configset['datasource'])
    dbServer.connection()
    adminConfig  = json_configset['admin']
    if dbServer.is_alive():
        dbServer.disconnection()
        llmServer = LLMServer(appLogger, json_configset)
        llmServer.load_model()
    
        daemon = WebServer(name, appLogger, dbServer, llmServer, json_configset, static_dir, templates_dir,adminConfig['id'] )
        daemon.run(appConfig.get_port())
    else:
        appLogger.printAppLogger("데이터베이스 연결에 문제가 있어 종료합니다.")
    
if __name__ == '__main__':
    # Enviroment Config file Check
    appConfig = ConfigManager()    
    if not appConfig.exist_app_config_file():
        ConsolePrint.timeLog("[The server has shut down.] The server configuration file does not exist.")
        sys.exit(1)
    
    configJsonData = appConfig.get_config_json()
    if configJsonData is None:
        ConsolePrint.timeLog("[The server has shut down.] The server config json file does not exist.")
        sys.exit(1)
        
    # Logger Check
    appLogger = LoggingManager(appConfig.get_logdir())
    if not appLogger.preparedLogger():
        ConsolePrint.timeLog("[The server has shut down.] The log object was not created properly.")
        sys.exit(1)
        
    # Call MainApplication        
    callApplicationDispatch(__name__, appLogger, appConfig)