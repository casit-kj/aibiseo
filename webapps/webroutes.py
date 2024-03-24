"""
module.name : webroutes.py
module.purpose: AiBiseo Flask Blue Routes
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""
import os
from uuid import uuid1

from flask import Flask, render_template, jsonify, request, session
from werkzeug.utils import secure_filename

from libs import mnglogger
from libs.mnglogger import LoggingManager
from webapps.bp_chroma import ChromadbBlueprint
from webapps.bp_delete_chat_dialog import DeleteChatDialogBlueprint
from webapps.bp_index import IndexBlueprint
from webapps.bp_load_chat import LoadChatBlueprint
from webapps.bp_clear_conversations import ClearConversationsBlueprint
from webapps.bp_conversations import ConversitionBlueprint
from webapps.bp_chat_list import ChatListBlueprint
from webapps.bp_log import LogControlBlueprint
from webapps.bp_logpage import LogpageBlueprint
from webapps.bp_upload import UploadBlueprint
from webapps.bp_userconfig import ChatUserConfigBlueprint
from flask_cors import cross_origin
import chromadb.utils.embedding_functions as embedding_functions
import fitz

from webapps.bp_usermanage import UsermanageBlueprint


class RouterManager:
    def __init__(self, app, loggerManager, dbServer, modelConfig, adminConfig):
        self.app = app
        self.loggerManager = loggerManager
        self.dbServer = dbServer
        self.register_routes()
        self.modelConfig = modelConfig
        self.adminConfig = adminConfig

    def register_routes(self):

        @self.app.route("/")
        def index():
            handler = IndexBlueprint(self.loggerManager)
            return handler.index()

        @self.app.route("/usermanage")
        def usermanage():
            if session.get('logged_in'):
                handler = UsermanageBlueprint(self.loggerManager)
                return handler.usermanage()
            else:
                handler = IndexBlueprint(self.loggerManager)
                return handler.index()


        @self.app.route("/logpage")
        def logpage():
            if session.get('logged_in'):
                handler = LogpageBlueprint(self.loggerManager)
                return handler.logpage()
            else:
                handler = IndexBlueprint(self.loggerManager)
                return handler.index()

        @self.app.route("/upload")
        def upload():
            if session.get('logged_in'):
                handler = UploadBlueprint(self.loggerManager)
                return handler.upload()
            else:
                handler = IndexBlueprint(self.loggerManager)
                return handler.index()


        @self.app.route("/chroma")
        def chroma():
            if session.get('logged_in'):
                handler = ChromadbBlueprint(self.loggerManager)
                return handler.chromapage()
            else:
                handler = IndexBlueprint(self.loggerManager)
                return handler.index()


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
            return handler.userTableList(self.adminConfig)

        @self.app.route("/api/targetDelete", methods=['POST'])
        def targetDelete():
            reqJsonData = request.get_json()
            handler = ChatUserConfigBlueprint(self.loggerManager, self.dbServer)
            if session.get('uname') == reqJsonData['uName']:
                session.clear()
            return handler.targetDeleteUser(reqJsonData)

        @self.app.route("/api/chat", methods=["POST"])
        @cross_origin(origin="*", headers=['Content- Type', 'Authorization'])
        def conversition():                
            if request.content_type != 'application/json':
                response_data = {
                    "status": "405",
                    "results": {
                        "answer": "error: Content-Type must be application/json"
                    }
                }
                return response_data

            reqJsonData = request.get_json()
            handler = ConversitionBlueprint(self.loggerManager, self.dbServer, self.modelConfig)
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
            return handler.getLogDir(self.adminConfig)

        @self.app.route("/api/loadLogFile", methods=['POST'])
        def loadLogFile():
            reqJsonData = request.get_json()
            handler = LogControlBlueprint(self.loggerManager)
            return handler.loadLogFile(reqJsonData)

        UPLOAD_FOLDER = '/home/bwis/aibiseo/filesave'
        self.app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

        @self.app.route("/api/upload", methods=['POST'])
        def uploadfile():
            if 'file-upload' not in request.files:
                return jsonify({'error': 'No file part'})
            file = request.files['file-upload']
            description = request.form.get('file-name')  # 관련 데이터 접근
            if file.filename == '':
                return jsonify({'error': 'No selected file'})

            filename = secure_filename(file.filename)
            file.save(os.path.join(self.app.config['UPLOAD_FOLDER'], filename))

            return jsonify({
                'message': 'File and data successfully uploaded',
                'description': description
            })

        @self.app.route("/api/upLoadPage", methods=['GET'])
        def upLoadPage():
            response_data = {
                "status": True,
                "results": {
                    "answer": "로그인되어있습니다."
                },
                'loginconfirm': session.get('logged_in')
            }
            return response_data

        @self.app.route("/api/chromaQuery", methods=['POST'])
        def chromaQuery():
            query = request.form.get('file-name')
            document = [query]

            handler = ChromadbBlueprint(self.loggerManager)
            huggingface_ef = embedding_functions.HuggingFaceEmbeddingFunction(
                api_key="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",
                model_name="sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
                # model_name = "sentence-transformers/all-MiniLM-L6-v2"
            )
            result = handler.chromaQuery(document, huggingface_ef)
            return result

        @self.app.route("/api/chromaInsert", methods=['POST'])
        def chromaInsert():
            if 'file-content' not in request.files:
                return jsonify({'error': 'No file part'})
            file = request.files['file-content']
            if file.filename == '':
                return jsonify({'error': 'No selected file'})

            name = request.form.get('file-name')
            writer = request.form.get('file-writer')

            #pdf텍스트 추출
            text = extract_text_from_pdf(file)

            #텍스트 청크사이즈로 나누기
            chunks = split_text_into_chunks(text)

            metadata = []
            id = []
            document = []

            for i in range(len(chunks)):
                metadata.append({"writer": writer, "name": name})
                id.append(str(uuid1()))
                document.append(chunks[i])

            handler = ChromadbBlueprint(self.loggerManager)
            huggingface_ef = embedding_functions.HuggingFaceEmbeddingFunction(
                api_key="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",
                model_name="sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
                # model_name = "sentence-transformers/all-MiniLM-L6-v2"
            )
            result = handler.chromaInsert(document, metadata, id, huggingface_ef)

            return result

            # return jsonify({"metadata": metadata, "id": id, "document": document})

        def extract_text_from_pdf(pdf_file):
            pdf_bytes = pdf_file.read()  # 파일의 내용을 바이트로 읽습니다.

            # PyMuPDF를 사용하여 바이트 데이터에서 직접 PDF를 엽니다.
            doc = fitz.open("pdf", pdf_bytes)
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()

            # 추출된 텍스트를 반환하거나 처리합니다.
            return text

        def split_text_into_chunks(text, chunk_size=600):
            """주어진 텍스트를 chunk_size 문자로 나눕니다."""
            chunks = [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]
            return chunks

        @self.app.route("/api/ChromaData", methods=['POST'])
        def chromaData():
            reqJsonData = request.get_json()
            query = reqJsonData['message']
            document = [query]

            handler = ChromadbBlueprint(self.loggerManager)
            huggingface_ef = embedding_functions.HuggingFaceEmbeddingFunction(
                api_key="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",
                model_name="sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
                # model_name = "sentence-transformers/all-MiniLM-L6-v2"
            )
            result = handler.chromaQuery(document, huggingface_ef)
            return result