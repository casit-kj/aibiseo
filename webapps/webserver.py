from flask import Flask, request, jsonify

class WebServer:    

    def __init__(self, name, logger_app, logger_error):
        self.app = Flask(name)
        self.logger_app = logger_app
        self.logger_error = logger_error
        self.set_logger()   
        self.setup_routes() 
    
    def set_logger(self):
        @self.app.after_request
        def after_request_logging(response):
            self.logger_app.info(f"Response: {response.status}")
            return response
        
        @self.app.before_request
        def before_request_logging():
            self.logger_app.info(f"Request: {request.method} {request.url}")

        @self.app.errorhandler(Exception)
        def handle_exception(e):
            # 여기에서 에러 로그를 분리하여 기록합니다.
            self.logger_error.error("Unhandled Exception", exc_info=True)
            # 사용자에게 반환되는 에러 응답을 커스텀할 수 있습니다.
            return jsonify(error=str(e)), 500
                    
    def setup_routes(self):
        @self.app.route("/")
        def index():
            return "Welcome to the Home page!"
        
    def run(self, port=2000):
        self.app.run(debug=True, host='0.0.0.0', port=port)
        self.logger_app.info("Flask Web Daemon starting....")