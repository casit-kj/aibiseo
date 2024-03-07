"""
module.name : webroutes.py
module.purpose: AiBiseo Flask Blue Routes
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

from flask import Flask, render_template, jsonify, request

from webapps.delete_chat_dialog_blueprint import DeleteChatDialogBlueprint
from webapps.index_blueprint import IndexBlueprint
from webapps.load_chat_blueprint import LoadChatBlueprint
from webapps.clear_conversations_blueprint import ClearConversationsBlueprint
from webapps.chat_list_blueprint import ChatListBlueprint
from webapps.conversition_blueprint import ConversitionBlueprint

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
        
        @self.app.route("/api/loadChat", methods=['POST'])
        def loadChat():
            reqJsonData = request.get_json()
            handler = LoadChatBlueprint(self.loggerManager, self.dbServer)
            return handler.loadChat(reqJsonData)

        @self.app.route("/api/delDialog", methods=['POST'])
        def delDialog():
            reqJsonData = request.get_json()
            handler = DeleteChatDialogBlueprint(self.loggerManager, self.dbServer)
            return handler.chatDeleteDialog(reqJsonData)
        
        @self.app.route("/api/clearConversations", methods=['GET'])
        def clearConversations():
            handler = ClearConversationsBlueprint(self.loggerManager, self.dbServer)
            return handler.clearConversations()    
        
        @self.app.route("/api/chatList", methods=['GET'])        
        def chatList():
            handler = ChatListBlueprint(self.loggerManager, self.dbServer)
            return handler.chatList()     
        
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