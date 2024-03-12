"""
module.name : load_chat_blueprint.py
module.purpose: Index bluepoint
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

from flask import Blueprint, request, jsonify, Flask, render_template
from libs.mods.mnglogger import LoggingManager
from libs.mods.dbsource import DBSource


class LoadChatBlueprint:
    
    def __init__(self, loggerManager, dbServer):  
        self.loggerManager = loggerManager
        self.dbServer = dbServer
        
    def loadChatList(self, reqJsonData):
        message, code = self.dbServer.loadChat(reqJsonData)       
        return jsonify({'result_Data': message,
                        'status':code})  
   