#!/bin/bash
#

SERVER_PORT=5000
SERVER_HOME=/data/bwllm/brainbiseo
SERVER_LOG=${SERVER_HOME}/logs
SERVER_CONFIG=${SERVER_HOME}/config/app.config

function start()
{
   if lsof -i :$SERVER_PORT &>/dev/null; then
      echo "Server start is aborted because port $SERVER_PORT is in use."
   else
      echo "Starting the BrainBiseo on port $SERVER_PORT ..."
      nohup python ${SERVER_HOME}/app.py --basedir=${SERVER_HOME} --port=${SERVER_PORT} --config=${SERVER_CONFIG} >${SERVER_LOG}/start_$(date +%Y-%m-%d).log 2>&1 &
   fi
}

function status() 
{
   ps -ef | grep jupyter
}

function list()
{
   jupyter server list
}

function kernel()
{
   jupyter kernelspec list
}

function observer()
{
   watch -d -n 0.5 nvidia-smi
}

function stop()
{
   target_pid=$(getPid)
   if kill -0 $target_pid 2>/dev/null; then
     echo "Process $target_pid is running. Attempting to terminate..."

    # SIGTERM 신호를 사용하여 프로세스 종료 시도
     if kill $target_pid; then
        echo "Process $target_pid has been terminated successfully."
     else
        echo "Failed to terminate process $target_pid with SIGTERM. Attempting SIGKILL..."
        # SIGKILL 신호를 사용하여 강제 종료 시도
        if kill -9 $target_pid; then
            echo "Process $target_pid has been killed successfully."
        else
            echo "Failed to kill process $target_pid."
        fi
     fi
   else
     echo "No process is using port $SERVER_PORT"	   
   fi
     echo "Jupyter stopping ... PID : $target_pid"
}


function getPid() 
{
   local pid=$(lsof -t -i :$SERVER_PORT -sTCP:LISTEN)
   if [[ -n $pid ]]; then
        echo $pid
        return 0  # 성공적으로 PID를 찾았을 때
    else
        return 1  # 해당 포트를 사용하는 프로세스가 없을 때
    fi
}

# User specific environment and startup programs
case "$1" in
    start)
        start
    ;;
    status)
	status
    ;;
    list)
	list
    ;;
    kernel)
	kernel
    ;;
    observer)
        observer
    ;;
    stop)
        stop
        sleep 0.1
    ;;
    *)
        echo "Usage: $0 {start|stop|list|kernel|observer|status}"
esac
