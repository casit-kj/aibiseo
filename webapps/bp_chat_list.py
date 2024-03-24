"""
module.name : chat_list_blueprint.py
module.purpose: Chat List bluepoint
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

from flask import Blueprint, request, jsonify, Flask, render_template, session
from libs.mnglogger import LoggingManager
from libs.dbsource import DBSource


class ChatListBlueprint:
    def __init__(self, loggerManager, dbServer):  
        self.loggerManager = loggerManager
        self.dbServer = dbServer
        
    def chatList(self):
        message, code = self.dbServer.chatlist()
        return jsonify({'result_Data': message,'status':code,'loginconfirm': session.get('logged_in')})
   