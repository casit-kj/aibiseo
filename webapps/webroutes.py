"""
module.name : webroutes.py
module.purpose: AiBiseo Flask Blue Routes
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""
import os

from flask import Flask, render_template, jsonify, request, session

from libs.mods import mnglogger
from libs.mods.mnglogger import LoggingManager
from webapps.delete_chat_dialog_blueprint import DeleteChatDialogBlueprint
from webapps.index_blueprint import IndexBlueprint
from webapps.load_chat_blueprint import LoadChatBlueprint
from webapps.clear_conversations_blueprint import ClearConversationsBlueprint
from webapps.chat_list_blueprint import ChatListBlueprint
from webapps.conversition_blueprint import ConversitionBlueprint
from webapps.log_blueprint import LogControlBlueprint
from webapps.userconfig_blueprint import ChatUserConfigBlueprint


class RouterManager:
    def __init__(self, app, loggerManager, dbServer, llmServer):
        self.app = app
        self.loggerManager = loggerManager
        self.dbServer = dbServer
        self.llmServer = llmServer
        self.register_routes()

    def register_routes(self): 
                       
        @self.app.route("/")
        def index():
            handler = IndexBlueprint(self.loggerManager)
            return handler.index()      
        @self.app.route("/usermanage")
        def usermanage():
            handler = IndexBlueprint(self.loggerManager)
            return handler.usermanage()
        @self.app.route("/logpage")
        def logpage():
            handler = IndexBlueprint(self.loggerManager)
            return handler.logpage()
        @self.app.route("/api/loadChat", methods=['POST'])
        def loadChat():
            reqJsonData = request.get_json()
            handler = LoadChatBlueprint(self.loggerManager, self.dbServer)
            return handler.loadChatList(reqJsonData)

        @self.app.route("/api/delDialog", methods=['POST'])
        def delDialog():
            reqJsonData = request.get_json()
            handler = DeleteChatDialogBlueprint(self.loggerManager, self.dbServer)
            return handler.chatDeleteDialog(reqJsonData)
        @self.app.route("/api/login", methods=['POST'])
        def loginUser():
            reqJsonData = request.get_json()
            handler = ChatUserConfigBlueprint(self.loggerManager, self.dbServer)
            return handler.chatLogin(reqJsonData)
        @self.app.route("/api/register", methods=['POST'])
        def registerUser():
            reqJsonData = request.get_json()
            handler = ChatUserConfigBlueprint(self.loggerManager, self.dbServer)
            return handler.chatUserRegister(reqJsonData)
        @self.app.route("/api/updateUser", methods=['POST'])
        def updateUser():
            reqJsonData = request.get_json()
            handler = ChatUserConfigBlueprint(self.loggerManager, self.dbServer)
            return handler.chatUserUpdate(reqJsonData)
        @self.app.route("/api/deleteUser", methods=['GET'])
        def deleteUser():
            handler = ChatUserConfigBlueprint(self.loggerManager, self.dbServer)
            return handler.chatUserDelete()
        @self.app.route("/api/clearConversations", methods=['GET'])
        def clearConversations():
            handler = ClearConversationsBlueprint(self.loggerManager, self.dbServer)
            return handler.clearConversations()    
        
        @self.app.route("/api/chatList", methods=['GET'])        
        def chatList():
            handler = ChatListBlueprint(self.loggerManager, self.dbServer)
            return handler.chatList()

        @self.app.route("/api/userTable", methods=['GET'])
        def userTable():
            handler = ChatUserConfigBlueprint(self.loggerManager, self.dbServer)
            return handler.userTableList()
        @self.app.route("/api/targetDelete", methods=['POST'])
        def targetDelete():
            reqJsonData = request.get_json()
            handler = ChatUserConfigBlueprint(self.loggerManager, self.dbServer)
            if session.get('uname') == reqJsonData['uName']:
                session.clear()
            return handler.targetDeleteUser(reqJsonData)
        @self.app.route("/api/chat", methods=["POST"])
        def conversition():
            # Validate dataType                      
            if request.content_type != 'application/json':
                response_data = {
                    "status": "405",
                    "results": {
                        "answer": "error: Content-Type must be application/json"
                    }
                }
                return response_data
            
            reqJsonData = request.get_json()
            handler = ConversitionBlueprint(self.loggerManager, self.dbServer, self.llmServer)
            return handler.conversition(reqJsonData)
        @self.app.route("/api/logout", methods=['GET'])
        def chatLogout():
            session.clear()
            response_data = {
                "status": True,
                "results": {
                    "answer": "로그아웃 되었습니다."
                }
            }
            return response_data

        @self.app.route("/api/dirPathLog", methods=['GET'])
        def dirPathLog():
            handler = LogControlBlueprint(self.loggerManager)
            return handler.getLogDir()