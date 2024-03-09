"""
module.name : login_blueprint.py
module.purpose: Index bluepoint
module.create.date: 2024. 02. 21

"""

from flask import Blueprint, request, jsonify, Flask, render_template
from module.mnglogger import LoggingManager
from module.dbsource import DBSource


class ChatUserRegisterBlueprint:
    def __init__(self, loggerManager, dbServer):  
        self.loggerManager = loggerManager
        self.dbServer = dbServer
        
    def chatUserRegister(self, reqJsonData):
        message, code = self.dbServer.userRegister(reqJsonData)
        return jsonify({'result_Data': message,
                        'status':code})
   