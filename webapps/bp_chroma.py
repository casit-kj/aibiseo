"""
module.name : index_blueprint.py
module.purpose: Index bluepoint
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

from flask import Blueprint, request, jsonify, Flask, render_template, session
from libs.mnglogger import LoggingManager
import chromadb


class ChromadbBlueprint:
    def __init__(self, loggerManager):
        self.loggerManager = loggerManager

    def chromapage(self):
        return render_template('chromadb.html')

    def chromaInsert(self, document, metadata, id, huggingface_ef):
        try:
            client = chromadb.HttpClient(host='118.217.7.2', port=5001)
            collection = client.get_or_create_collection(name="bwdocs", embedding_function=huggingface_ef)
            collection.add(
                documents=document,
                metadatas=metadata,
                ids=id
            )
            return jsonify({"result": "저장되었습니다."})
        except Exception as e:
            return jsonify({"error": str(e)})

    def chromaQuery(self, document, huggingface_ef):
        try:
            client = chromadb.HttpClient(host='118.217.7.2', port=5001)
            collection = client.get_or_create_collection(name="bwdocs",embedding_function=huggingface_ef)
            result = collection.get(
                include=['embeddings', 'documents', 'metadatas']
            )
            results = collection.query(
                query_texts=document,
                n_results=3,
                include=['embeddings','documents', 'metadatas']
            )
            client.delete_collection(name="bwdocs")
            return jsonify({"result": results,"status": True})
        except Exception as e:
            return jsonify({"error": str(e)})

    def chromaCollectionDelete(self):
        try:
            client = chromadb.HttpClient(host='118.217.7.2', port=5001)
            client.delete_collection(name="bwdocs")
            return jsonify({"result": "Collection삭제", "status": True})
        except Exception as e:
            return jsonify({"error": str(e)})

    def chromaListGet(self, huggingface_ef):
        try:
            client = chromadb.HttpClient(host='118.217.7.2', port=5001)
            collection = client.get_or_create_collection(name="bwdocs",embedding_function=huggingface_ef)
            result = collection.get(
                where={"index": 0},
                include=['metadatas']
            )
            return ({"result": {
                "status": True, "code": "200", "answer": result}},True)
        except Exception as e:
            return ({"result": {
                "status": False, "code": "400", "answer": str(e)}},False)
    def chromaDelte(self, docName, huggingface_ef):
        try:
            client = chromadb.HttpClient(host='118.217.7.2', port=5001)
            collection = client.get_or_create_collection(name="bwdocs",embedding_function=huggingface_ef)
            collection.delete(
                where={"name": docName}
            )
            return jsonify({"result": docName+"가 삭제되었습니다.","status": True})
        except Exception as e:
            return jsonify({"error": str(e)})

    def chromaContents(self, docName, huggingface_ef):
        try:
            client = chromadb.HttpClient(host='118.217.7.2', port=5001)
            collection = client.get_or_create_collection(name="bwdocs",embedding_function=huggingface_ef)
            result = collection.get(
                where={"name": docName},
                include=['documents', 'metadatas']
            )
            return ({"result": {
                "status": True, "code": "200", "answer": result}},True)
        except Exception as e:
            return ({"result": {
                "status": False, "code": "400", "answer": str(e)}},False)