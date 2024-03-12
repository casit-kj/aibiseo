"""
module.name : userconfig_blueprint.py
module.purpose: Index bluepoint
module.create.date: 2024. 02. 21

"""

from flask import Blueprint, request, jsonify, Flask, render_template
from module.mnglogger import LoggingManager
from module.dbsource import DBSource


class ChatUserConfigBlueprint:
    def __init__(self, loggerManager, dbServer):  
        self.loggerManager = loggerManager
        self.dbServer = dbServer
        
    def chatLogin(self, reqJsonData):
        message, code = self.dbServer.chatLogin(reqJsonData)
        return jsonify({'result_Data': message,
                        'status':code})
    def chatUserRegister(self, reqJsonData):
        message, code = self.dbServer.userRegister(reqJsonData)
        return jsonify({'result_Data': message,
                        'status':code})

    def chatUserUpdate(self, reqJsonData):
        message, code = self.dbServer.userUpdate(reqJsonData)
        return jsonify({'result_Data': message,
                        'status':code})
    def chatUserDelete(self):
        message, code = self.dbServer.chatuserDelete()
        return jsonify({'result_Data': message,
                        'status':code})
   