from module.app_config import parse_args
from module.app_logging import get_logger, print_daemon_start

def main(args):
    app_logger, err_logger, model_logger = get_logger(args.logdir)    
    print_daemon_start(app_logger)

if __name__ == '__main__':
    args = parse_args()
    main(args)