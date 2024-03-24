"""
module.name : webserver.py
module.purpose: AiBiseo Flask Web Server Management
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""
from datetime import timedelta

from flask import Flask, request, jsonify
from gevent.pywsgi import WSGIServer
from webapps.webroutes import RouterManager

class WebServer:    
    def __init__(self, name, loggerManager, dbServer, configJsonData, flaskFolderStatic, flaskFoldertemplates, modelConfig, adminConfig):
              
        self.app = Flask(name, static_folder=flaskFolderStatic, static_url_path='/static', 
                         template_folder=flaskFoldertemplates)
        self.loggerManager = loggerManager
        self.dbServer = dbServer
        self.configJsonData = configJsonData
        self.app.config['SECRET_KEY'] = 'casit'
        self.app.permanent_session_lifetime = timedelta(minutes=30)
        self.adminConfig = adminConfig
        # Blueprint를 Flask 애플리케이션에 등록
        router_manager = RouterManager(self.app, self.loggerManager, self.dbServer, modelConfig, self.adminConfig)
        self.set_logger()

        
    def set_logger(self):
        @self.app.after_request
        def after_request_logging(response):
            self.loggerManager.loggerApp.info(f"Response: {response.status}")
            return response
        
        @self.app.before_request
        def before_request_logging():
            self.loggerManager.loggerApp.info(f"Request: {request.method} {request.url}")

        @self.app.errorhandler(Exception)
        def handle_exception(e):
            # 여기에서 에러 로그를 분리하여 기록합니다.
            self.loggerManager.loggerError.error("Unhandled Exception", exc_info=True)
            # 사용자에게 반환되는 에러 응답을 커스텀할 수 있습니다.
            return jsonify(error=str(e)), 500                
        
    def run(self, port=2000):
        self.loggerManager.printAppLogger("Flask Web Daemon starting....")
        http_server = WSGIServer(('0.0.0.0', int(port)), self.app)
        http_server.serve_forever()
        #self.app.run(debug=True, host='0.0.0.0', port=port)
        