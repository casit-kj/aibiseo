"""
module.name : dbsource.py
module.purpose: Database Connection Object
module.create.date: 2024. 03. 05
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""
import pymysql
from flask import Flask, request, jsonify
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
                return False
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
                        sql = "INSERT INTO `chat_qna` ( `chat_qna_id`, `chat_user_content`, `chat_assistant_content`, `chat_assistant_endat`, `chat_assistant_startat`,`chat_dialog_id`) VALUES ( %s, %s, %s, %s, %s, %s)"
                        # 쿼리 실행
                        cursor.execute(sql, (data['qna_id'], data['question'], data['answer'], data['end_at'], data['start_at'], data['dialog_id']))
                        # 변경사항 저장
                        conn.commit()
                        return jsonify({"status": "success", "message": "Data inserted into database"}), True
                    else:
                        return jsonify({"status": "failed", "message": "Failed to inserted dataset"}), False               
                except Exception as e:
                    return jsonify({"status": "error", "message": str(e)}), False
                finally:
                    self.disconnection()                
    def delete(self):
        pass
    
    def update(self):
        pass
    def chatlist(self):
        conn = self.connection()
        print("확인")
        if(not self.is_alive()):
            return "fail",False 
        else:
            try:
                cursor = conn.cursor()
                if cursor:
                    # SELECT 쿼리 작성
                    sql = "SELECT * FROM chat_dialog"
                    
                    # 쿼리 실행
                    cursor.execute(sql)
                    
                    # 모든 결과 가져오기
                    result = cursor.fetchall()
                    print(result)
                    return result , True
                else:
                    return "fail",False               
            except Exception as e:
                return e,False
            finally:
                self.disconnection()    