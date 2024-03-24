"""
module.name : delete_chat_dialog_blueprint.py
module.purpose: Index bluepoint
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

from flask import Blueprint, request, jsonify, Flask, render_template
from libs.mnglogger import LoggingManager
from libs.dbsource import DBSource


class DeleteChatDialogBlueprint:
    def __init__(self, loggerManager, dbServer):  
        self.loggerManager = loggerManager
        self.dbServer = dbServer
        
    def chatDeleteDialog(self, reqJsonData):
        message, code = self.dbServer.deleteDialog(reqJsonData)
        return jsonify({'result_Data': message,
                        'status':code})
   