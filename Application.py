import atexit
from module.app_logging import create_logger , app_print_start, app_print_stop
from webapps.webserver import WebServer
    
''' 응용프로그램 객체
'''
class BrainBiseoApplication:
    
    def __init__(self, args):
        print(args)
        self.args = args
        self.app_logger, self.err_logger, self.model_logger = self.get_logger(args.logdir)
        
    def get_logger(self, logdir):
        return create_logger(logdir=logdir)
    
    def get_app_logger(self):
        return self.app_logger
    
    def get_err_logger(self):
        return self.err_logger
    
    def get_module_logger(self):
        return self.model_logger
            
    def start_daemon(self, name):
        app_print_start(self.app_logger)
        atexit.register(lambda: app_print_stop(self.app_logger))
        daemon = WebServer(name, self.app_logger, self.err_logger)
        daemon.run(self.args.port)