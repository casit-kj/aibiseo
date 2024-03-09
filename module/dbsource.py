"""
module.name : dbsource.py
module.purpose: Database Connection Object
module.create.date: 2024. 03. 05
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""
import pymysql
from flask import Flask, request, jsonify,session
import module.mhash

class DBSource:        
    def __init__(self, datasource):
        self.url = datasource['url']
        self.port = datasource['port']
        self.dbname = datasource['dbname']
        self.user = datasource['user']
        self.passwd = datasource['passwd']
        self.charset = datasource['charset']
        self.DBConn = None
    
    def print(self):
        print("Databse Information ...")    
        print(f"url: {self.url}")
        print(f"port: {self.port}")    
        print(f"dbname: {self.dbname}")
        print(f"user: {self.user}")
        print(f"passwd: {self.passwd}")
        print(f"charset: {self.charset}")    
        
    def is_alive(self):
        if self.DBConn == None:
            return False
        else:
            return True
            
    def connection(self):
        if(self.DBConn == None):
            self.DBConn = pymysql.connect(host=self.url, port=self.port, db=self.dbname, 
                                          user=self.user, password=self.passwd, charset=self.charset)
        return self.DBConn
    def get_dbconn(self):
        return self.DBConn
    
    def disconnection(self):
        if(self.DBConn != None):
            self.DBConn.close()            
        self.DBConn = None
    
    def search(self):
        pass
    
    def insertDialog(self, data):   
            conn = self.connection()
            if(not self.is_alive()):
                return jsonify({"result":{
                    "status": False, "code": "201", "message": "database connection is not alive"}}), False
            else:
                try:
                    cursor = conn.cursor()
                    if cursor:
                        # SQL 쿼리 작성
                        dialogsql = "INSERT INTO `chat_dialog` (`chat_dialog_id`, `chat_user_id`, `chat_create_at`) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE `chat_dialog_id` = %s, `chat_user_id` = %s, `chat_create_at` = %s ;"
                        # 쿼리 실행
                        cursor.execute(dialogsql, (data['dialog_id'], data['user_id'], data['dialog_create_at'], data['dialog_id'], data['user_id'], data['dialog_create_at']))
                        # SQL 쿼리 작성
                        conn.commit()
                        sql = "INSERT INTO `chat_qna` ( `chat_qna_id`, `chat_user_content`, `chat_assistant_content`, `chat_assistant_endat`, `chat_assistant_startat`,`chat_dialog_id`) VALUES ( %s, %s, %s, %s, %s, %s);"
                        # 쿼리 실행
                        cursor.execute(sql, (data['qna_id'], data['question'], data['answer'], data['end_at'], data['start_at'], data['dialog_id']))
                        # 변경사항 저장
                        conn.commit()
                        
                        return ({"result":{
                            "status": True, "code": "200", "answer": "Data inserted into database"}}), True
                    else:
                        return ({"result":{
                            "status": False, "code": "201", "answer": "Failed to inserted dataset"}}), False              
                except Exception as e:                    
                        return ({"result":{
                            "status": False, "code": "400", "answer": str(e)}}), False     
                finally:
                    self.disconnection() 
                    
               
    def deleteDialog(self, delId):
            conn = self.connection()
            if(not self.is_alive()):
                return False
            else:
                try:
                    cursor = conn.cursor()
                    if cursor:
                        dialogsql = "DELETE FROM chat_dialog WHERE  chat_dialog_id = %s;"
                        # 쿼리 실행
                        cursor.execute(dialogsql, (delId['deleteId']))
                        # 변경사항 저장
                        conn.commit()                        
                        sql = "DELETE FROM chat_qna WHERE  chat_dialog_id = %s;"
                        # 쿼리 실행
                        cursor.execute(sql, (delId['deleteId']))
                        # 변경사항 저장
                        conn.commit()
                        return ({"result":{
                            "status": True, "code": "200", "answer": "Data delete into database"}}), True
                    else:
                        return ({"result":{
                            "status": False, "code": "201", "answer": "Failed to delete dataset"}}), False              
                except Exception as e:
                    return ({"result":{
                            "status": False, "code": "501", "answer": str(e)}}), False 
                finally:
                    self.disconnection()  
                    
                    
    def chatlist(self):
        conn = self.connection()
        if(not self.is_alive()):
            return "fail",False
        else:
            try:
                cursor = conn.cursor()
                if cursor:
                    # SELECT 쿼리 작성
                    sql = "SELECT cd.*, cq.* FROM chat_dialog cd LEFT JOIN chat_qna cq ON cd.chat_dialog_id = cq.chat_dialog_id INNER JOIN ( SELECT chat_dialog_id, MIN(chat_assistant_startat) AS earliest_created_at FROM chat_qna GROUP BY chat_dialog_id) AS earliest_cq ON cq.chat_dialog_id = earliest_cq.chat_dialog_id AND cq.chat_assistant_startat = earliest_cq.earliest_created_at ORDER BY cd.chat_dialog_id ASC;"

                    # 쿼리 실행
                    cursor.execute(sql)
                    
                    # 모든 결과 가져오기
                    result = cursor.fetchall()
                    return ({"result":{
                            "status": True, "code": "200", "answer": result}}), True
                else:
                    return ({"result":{
                            "status": False, "code": "201", "answer": "에러가 발생함"}}), False       
            except Exception as e:
                return e,False
            finally:
                self.disconnection()    
                
                
    def clearConversations(self):
            conn = self.connection()
            if(not self.is_alive()):
                return False
            else:
                try:
                    cursor = conn.cursor()
                    if cursor:
                        dialogsql = "TRUNCATE TABLE chat_dialog;"
                        # 쿼리 실행
                        cursor.execute(dialogsql)
                        # 변경사항 저장
                        conn.commit()                        
                        sql = "TRUNCATE TABLE chat_qna;"
                        # 쿼리 실행
                        cursor.execute(sql)
                        # 변경사항 저장
                        conn.commit()
                        return ({"result":{
                            "status": True, "code": "200", "answer": "Data clearConversations"}}), True
                    else:
                        return ({"result":{
                            "status": False, "code": "201", "answer": "Failed to clearConversations"}}), False              
                except Exception as e:
                    return ({"result":{
                            "status": False, "code": "400", "answer": str(e)}}), False  
                finally:
                    self.disconnection()       
                      
    def loadChat(self, loadChatId):
            conn = self.connection()
            if(not self.is_alive()):
                return False
            else:
                try:
                    cursor = conn.cursor()
                    if cursor:      
                        # 쿼리문               
                        sql = "SELECT * FROM chat_qna WHERE  chat_dialog_id = %s ORDER BY chat_assistant_startat ASC;"
                        # 쿼리 실행
                        cursor.execute(sql, (loadChatId['loadChatId']))
                        
                        # 검색결과문
                        result = cursor.fetchall()
                        # 변경사항 저장
                        conn.commit()
                        return ({"result":{
                            "status": True, "code": "200", "answer": result}}), True
                    else:
                        return ({"result":{
                            "status": True, "code": "200", "answer": "Failed to Chating dataset"}}), True           
                except Exception as e:
                    return ({"result":{
                            "status": False, "code": "400", "answer": str(e)}}), False  
                finally:
                    self.disconnection()

    def chatLogin(self, userInfo):
        conn = self.connection()
        if (not self.is_alive()):
            return False
        else:
            try:
                cursor = conn.cursor()
                if cursor:
                    sql = "SELECT * FROM chat_user WHERE chat_user_name = %s AND chat_user_password= %s;"
                    # 쿼리 실행
                    cursor.execute(sql, (userInfo['uname'],userInfo['upsw']))
                    # 변경사항 저장
                    conn.commit()
                    return ({"result": {
                        "status": True, "code": "200", "answer": "login seucess"}}), True
                else:
                    return ({"result": {
                        "status": False, "code": "201", "answer": "login Failed"}}), False
            except Exception as e:
                return ({"result": {
                    "status": False, "code": "501", "answer": str(e)}}), False
            finally:
                self.disconnection()
    def userRegister(self, userInfo):
        conn = self.connection()
        if (not self.is_alive()):
            return False
        else:
            try:
                cursor = conn.cursor()
                if cursor:
                    sql = "INSERT INTO `chat_user` (`chat_user_name`, `chat_user_password`) VALUES (%s,%s);"
                    # 쿼리 실행
                    cursor.execute(sql, (userInfo['uname'],userInfo['upsw']))
                    # 변경사항 저장
                    conn.commit()
                    session['userid'] = userInfo['uname']
                    return ({"result": {
                        "status": True, "code": "200", "answer": "register seucess"}}), True
                else:
                    return ({"result": {
                        "status": False, "code": "201", "answer": "register Failed"}}), False
            except Exception as e:
                return ({"result": {
                    "status": False, "code": "501", "answer": str(e)}}), False
            finally:
                self.disconnection()
