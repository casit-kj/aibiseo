from module.app_config import parse_args
from Application import BrainBiseoApplication as App

if __name__ == '__main__':   
    args = parse_args()
    app = App(args)
    app.start_daemon(__name__)