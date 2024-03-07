"""
module.name : chat_list_blueprint.py
module.purpose: Chat List bluepoint
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

from flask import Blueprint, request, jsonify, Flask, render_template
from module.mnglogger import LoggingManager
from module.dbsource import DBSource


class ChatListBlueprint:
    def __init__(self, loggerManager, dbServer):  
        self.loggerManager = loggerManager
        self.dbServer = dbServer
        
    def chatList(self):
        message, code = self.dbServer.chatlist()
        return jsonify({'result_Data': message,'status':code})
   