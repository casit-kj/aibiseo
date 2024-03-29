"""
module.name : clear_conversations_blueprint.py
module.purpose: Index bluepoint
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

from flask import Blueprint, request, jsonify, Flask, render_template
from libs.mnglogger import LoggingManager
from libs.dbsource import DBSource


class ClearConversationsBlueprint:
    def __init__(self, loggerManager, dbServer):  
        self.loggerManager = loggerManager
        self.dbServer = dbServer
        
    def clearConversations(self):  
        message, code = self.dbServer.clearConversations()       
        return jsonify({'result_Data': message,
                            'status':code})   
   