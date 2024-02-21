"""
module.name : webserver.py
module.purpose: AiBiseo Flask Web Server Management
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

from flask import Flask, request, jsonify
from webapps.webroutes import RouterManager

class WebServer:    
    loggerManager = None
    
    def __init__(self, name, loggerManager, configJsonData, flaskFolderStatic, flaskFoldertemplates):        
        self.app = Flask(name, static_folder=flaskFolderStatic, static_url_path='/static', 
                         template_folder=flaskFoldertemplates)
        
        # Blueprint를 Flask 애플리케이션에 등록
        router_manager = RouterManager(self.app)
        
        # 로그관리자 등록        
        WebServer.loggerManager = loggerManager
        self.configJsonData = configJsonData
        self.set_logger()        
        
    
    def set_logger(self):
        @self.app.after_request
        def after_request_logging(response):
            WebServer.loggerManager.loggerApp.info(f"Response: {response.status}")
            return response
        
        @self.app.before_request
        def before_request_logging():
            WebServer.loggerManager.loggerApp.info(f"Request: {request.method} {request.url}")

        @self.app.errorhandler(Exception)
        def handle_exception(e):
            # 여기에서 에러 로그를 분리하여 기록합니다.
            WebServer.loggerManager.loggerError.error("Unhandled Exception", exc_info=True)
            # 사용자에게 반환되는 에러 응답을 커스텀할 수 있습니다.
            return jsonify(error=str(e)), 500                
        
    def run(self, port=2000):
        self.app.run(debug=True, host='0.0.0.0', port=port)
        self.logger_app.info("Flask Web Daemon starting....")