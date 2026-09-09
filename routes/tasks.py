from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import Task
from sqlalchemy import or_

tasks_bp = Blueprint("tasks", __name__)


@tasks_bp.route("/api/tasks", methods=["POST"])
@jwt_required()
def create_task():
    data = request.get_json()

    title = data.get("title")
    description = data.get("description")
    status = data.get("status", "pending")
    priority = data.get("priority", "medium")
    due_date = data.get("due_date")

    if not title:
        return {"error": "Title is required"}, 400

    if status not in ["pending", "in_progress", "completed"]:
        return {"error": "Invalid status"}, 400

    if priority not in ["low", "medium", "high"]:
        return {"error": "Invalid priority"}, 400

    user_id = int(get_jwt_identity())

    task = Task(
    title=title,
    description=description,
    status=status,
    priority=priority,
    due_date=due_date,
    user_id=user_id
)

    db.session.add(task)
    db.session.commit()

    return {
        "message": "Task created successfully",
        "task": {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "user_id": task.user_id
        }
    }, 201
    
@tasks_bp.route("/api/tasks", methods=["GET"])
@jwt_required()
def get_tasks():
    user_id = int(get_jwt_identity())

    status = request.args.get("status")
    priority = request.args.get("priority")
    search = request.args.get("search")

    query = Task.query.filter_by(user_id=user_id)

    # Filter by status
    if status:
        if status not in ["pending", "in_progress", "completed"]:
            return {"error": "Invalid status"}, 400

        query = query.filter(Task.status == status)

    # Filter by priority
    if priority:
        if priority not in ["low", "medium", "high"]:
            return {"error": "Invalid priority"}, 400

        query = query.filter(Task.priority == priority)

    # Search in title or description
    if search:
        query = query.filter(
            or_(
                Task.title.ilike(f"%{search}%"),
                Task.description.ilike(f"%{search}%")
            )
        )

    tasks = query.all()

    return {
        "tasks": [
            {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "status": task.status,
                "priority": task.priority,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "created_at": task.created_at.isoformat(),
                "updated_at": task.updated_at.isoformat()
            }
            for task in tasks
        ]
    }, 200
    
@tasks_bp.route("/api/tasks/<int:task_id>", methods=["GET"])
@jwt_required()
def get_task(task_id):
    user_id = int(get_jwt_identity())

    task = Task.query.filter_by(
        id=task_id,
        user_id=user_id
    ).first()

    if not task:
        return {"error": "Task not found"}, 404

    return {
        "task": {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat()
        }
    }, 200
    
@tasks_bp.route("/api/tasks/<int:task_id>", methods=["PUT", "PATCH"])
@jwt_required()
def update_task(task_id):
    user_id = int(get_jwt_identity())

    task = Task.query.filter_by(
        id=task_id,
        user_id=user_id
    ).first()

    if not task:
        return {"error": "Task not found"}, 404

    data = request.get_json()

    if "title" in data:
        if not data["title"]:
            return {"error": "Title cannot be empty"}, 400
        task.title = data["title"]

    if "description" in data:
        task.description = data["description"]

    if "status" in data:
        if data["status"] not in ["pending", "in_progress", "completed"]:
            return {"error": "Invalid status"}, 400
        task.status = data["status"]

    if "priority" in data:
        if data["priority"] not in ["low", "medium", "high"]:
            return {"error": "Invalid priority"}, 400
        task.priority = data["priority"]

    if "due_date" in data:
        task.due_date = data["due_date"]

    db.session.commit()

    return {
        "message": "Task updated successfully",
        "task": {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "due_date": task.due_date,
            "updated_at": task.updated_at.isoformat()
        }
    }, 200
    
@tasks_bp.route("/api/tasks/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    user_id = int(get_jwt_identity())

    task = Task.query.filter_by(
        id=task_id,
        user_id=user_id
    ).first()

    if not task:
        return {"error": "Task not found"}, 404

    db.session.delete(task)
    db.session.commit()

    return {
        "message": "Task deleted successfully"
    }, 200
    
