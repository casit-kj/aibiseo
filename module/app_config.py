# config_parse.py
import argparse
import json

def parse_args():
    parser = argparse.ArgumentParser(description='Process some data.')
    parser.add_argument('--basedir', type=str, required=True, help='a string for app root directory')
    parser.add_argument('--logdir', type=str, required=True, help='a string for log directory')
    parser.add_argument('--port', type=str, required=True, help='a string for service port')
    parser.add_argument('--config', type=str, required=True, help='a string for configuration file')
    args = parser.parse_args()
    return args

# JSON 파일을 열고 파싱하는 함수 정의
def load_config(config_path):
    with open(config_path, 'r') as file:
        config = json.load(file)
    return config