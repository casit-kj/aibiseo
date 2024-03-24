"""
module.name : index_blueprint.py
module.purpose: Index bluepoint
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

from flask import Blueprint, request, jsonify, Flask, render_template
from libs.mnglogger import LoggingManager
import chromadb
class UploadBlueprint:
    def __init__(self, loggerManager):  
        self.loggerManager = loggerManager
        

    def upload(self):
        return render_template('upload.html')