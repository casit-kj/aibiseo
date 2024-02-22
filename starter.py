from module.mngcfg import ConfigManager, ConsolePrint
from module.mnglogger import LoggingManager
from model.llmserver import LLMServer
from webapps.webserver import WebServer
import os, sys
import atexit


def callApplicationDispatch(name, appLogger, appConfig):
    LoggingManager.StartWebserver()
    atexit.register(lambda: LoggingManager.StopWebServer)
    
    basedir = appConfig.get_basedir()
    static_dir = os.path.join(basedir, "webapps/static")
    templates_dir = os.path.join(basedir, "webapps/templates")

    llmServer = LLMServer(appConfig.get_config_json())
    llmServer.load_model()
    
    daemon = WebServer(name, appLogger, llmServer, appConfig.get_config_json(), static_dir, templates_dir)
    daemon.run(appConfig.get_port())
    
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