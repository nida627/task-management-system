from flask import Flask
from config import Config
from extensions import db , jwt
from flask_migrate import Migrate
from models import User, Task
from routes.auth import auth_bp
from routes.tasks import tasks_bp
from flask import Flask, render_template

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    jwt.init_app(app)
    Migrate(app, db)
    app.register_blueprint(auth_bp)
    app.register_blueprint(tasks_bp)
    return app

app = create_app()

@app.route("/")
def home():
    return render_template("login.html")

@app.route("/login")
def login_page():
    return render_template("login.html")

@app.route("/register")
def register_page():
    return render_template("register.html")

@app.route("/dashboard")
def dashboard_page():
    return render_template("dashboard.html")

@app.route("/tasks/create")
def create_task_page():
    return render_template("task_form.html", task_id=None)

@app.route("/tasks/edit/<int:task_id>")
def edit_task_page(task_id):
    return render_template("task_form.html", task_id=task_id)

if __name__ == "__main__":
    app.run(debug=True)