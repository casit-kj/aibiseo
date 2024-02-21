"""
module.name : webroutes.py
module.purpose: AiBiseo Flask Blue Routes
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

from flask import Flask, render_template

class RouterManager:
    def __init__(self, app):
        self.app = app
        self.register_routes()
    
    def register_routes(self):                
        @self.app.route("/")
        def index():
            return render_template('index.html')
     