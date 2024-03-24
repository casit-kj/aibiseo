"""
module.name : index_blueprint.py
module.purpose: Index bluepoint
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

from flask import Blueprint, request, jsonify, Flask, render_template
from libs.mods.mnglogger import LoggingManager
import chromadb
class IndexBlueprint:
    def __init__(self, loggerManager):  
        self.loggerManager = loggerManager
        
    def chroma(self):
        client = chromadb.HttpClient(host='118.217.7.2', port=5001)        
        collection = client.create_collection(name="bwdocs", embedding_function=emb_fn)
        return render_template('chromadb.html')