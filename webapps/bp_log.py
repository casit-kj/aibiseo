"""
module.name : chat_list_blueprint.py
module.purpose: Chat List bluepoint
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""
import os

from flask import Blueprint, request, jsonify, Flask, render_template, session
from libs.mods.mnglogger import LoggingManager
from libs.mods.dbsource import DBSource


class LogControlBlueprint:
    def __init__(self, loggerManager):
        self.loggerManager = loggerManager

    def getLogDir(self,adminConfig):
        message, code = self.loggerManager.get_log_dir(adminConfig)
        return jsonify({'result_Data': message, 'status': code, 'loginconfirm': session.get('logged_in')})
    def loadLogFile(self,reqJsonData):
        message, code = self.loggerManager.loadLogFile(reqJsonData)
        return jsonify({'result_Data': message, 'status': code})
