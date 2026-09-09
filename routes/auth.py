from flask import Blueprint, request
from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
)

from extensions import db
from models import User
import re


auth_bp = Blueprint("auth", __name__)
bcrypt = Bcrypt()


@auth_bp.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    
    # Required fields
    if not name or not email or not password:
        return {"error": "Name, email and password are required"}, 400

    # Name validation
    if not re.fullmatch(r"[A-Za-z ]+", name):
        return {"error": "Name can contain only letters and spaces"}, 400

    # Email validation
    if not re.fullmatch(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        return {"error": "Invalid email format"}, 400

    # Password validation
    if len(password) < 6:
        return {"error": "Password must be at least 6 characters"}, 400

    if not name or not email or not password:
        return {
            "error": "Name, email and password are required"
        }, 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return {
            "error": "Email already registered"
        }, 409

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

    user = User(
        name=name,
        email=email,
        password=hashed_password
    )

    db.session.add(user)
    db.session.commit()

    return {
        "message": "User registered successfully"
    }, 201
    
@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return {"error": "Email and password are required"}, 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return {"error": "Invalid email or password"}, 401

    if not bcrypt.check_password_hash(user.password, password):
        return {"error": "Invalid email or password"}, 401

    access_token = create_access_token(identity=str(user.id))

    return {
        "message": "Login successful",
        "access_token": access_token
    }, 200
    
@auth_bp.route("/api/auth/profile", methods=["GET"])
@jwt_required()
def profile():
    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if not user:
        return {"error": "User not found"}, 404

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "created_at": user.created_at.isoformat()
    }, 200