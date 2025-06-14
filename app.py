from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import json
import os
import openai
import PyPDF2
import io

app = Flask(__name__)
app.secret_key = os.urandom(24)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chatbot.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    settings = db.Column(db.Text, default=json.dumps({
        'theme': 'midnight',
        'fontSize': '16',
        'fontFamily': 'Inter',
        'lineHeight': '1.5',
        'model': 'gpt-4-turbo',
        'temperature': 0.7,
        'maxTokens': 2048,
        'topP': 0.9
    }))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)


class Chat(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    preview = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('chats', lazy=True))


class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.String(50), db.ForeignKey('chat.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    sender = db.Column(db.String(10), nullable=False)  # 'user' or 'bot'
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    chat = db.relationship('Chat', backref=db.backref('messages', lazy=True))


# Create database tables
with app.app_context():
    db.create_all()


# Routes
@app.route('/')
def home():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        return render_template('index.html', current_user=user)
    return redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        if not email or not password:
            return render_template('login.html', error='Please fill in all fields')

        user = User.query.filter_by(email=email).first()

        if user and user.check_password(password):
            session['user_id'] = user.id
            return redirect(url_for('home'))

        return render_template('login.html', error='Invalid email or password')

    return render_template('login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

        if not name or not email or not password or not confirm_password:
            return render_template('register.html', error='Please fill in all fields')

        if password != confirm_password:
            return render_template('register.html', error='Passwords do not match')

        if User.query.filter_by(email=email).first():
            return render_template('register.html', error='Email already registered')

        new_user = User(name=name, email=email)
        new_user.set_password(password)

        try:
            db.session.add(new_user)
            db.session.commit()
            session['user_id'] = new_user.id
            return redirect(url_for('home'))
        except Exception as e:
            db.session.rollback()
            return render_template('register.html', error='Error creating account. Please try again.')

    return render_template('register.html')


@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('login'))


@app.route('/api/chats', methods=['GET'])
def get_chats():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user_chats = Chat.query.filter_by(user_id=user.id).order_by(Chat.updated_at.desc()).all()
    chats_data = [{
        'id': chat.id,
        'title': chat.title,
        'preview': chat.preview,
        'timestamp': chat.updated_at.isoformat()
    } for chat in user_chats]

    return jsonify({
        'chats': chats_data,
        'user': {'name': user.name}
    })


@app.route('/api/chats', methods=['POST'])
def create_chat():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404

    new_chat = Chat(
        id=f"chat_{datetime.now().timestamp()}",
        user_id=user.id,
        title='New Chat',
        preview='Start a new conversation...'
    )
    db.session.add(new_chat)
    db.session.commit()

    return jsonify({
        'id': new_chat.id,
        'title': new_chat.title,
        'preview': new_chat.preview,
        'timestamp': new_chat.updated_at.isoformat()
    })


@app.route('/api/chats/<chat_id>/messages', methods=['GET'])
def get_messages(chat_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404

    chat = Chat.query.filter_by(id=chat_id, user_id=user.id).first()
    if not chat:
        return jsonify({'error': 'Chat not found'}), 404

    messages_data = [{
        'content': msg.content,
        'sender': msg.sender,
        'timestamp': msg.timestamp.isoformat()
    } for msg in chat.messages]

    return jsonify(messages_data)


@app.route('/api/chats/<chat_id>/messages', methods=['POST'])
def add_message(chat_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.json
    content = data.get('content')
    sender = data.get('sender')

    if not content or sender not in ['user', 'bot']:
        return jsonify({'error': 'Invalid data'}), 400

    chat = Chat.query.filter_by(id=chat_id, user_id=user.id).first()
    if not chat:
        return jsonify({'error': 'Chat not found'}), 404

    # Create new message
    new_message = Message(
        chat_id=chat_id,
        content=content,
        sender=sender
    )
    db.session.add(new_message)

    # Update chat preview
    if sender == 'user':
        chat.preview = content[:100] + '...' if len(content) > 100 else content
        db.session.commit()

    return jsonify({
        'id': new_message.id,
        'content': new_message.content,
        'sender': new_message.sender,
        'timestamp': new_message.timestamp.isoformat()
    })


@app.route('/api/settings', methods=['GET', 'PUT'])
def user_settings():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if request.method == 'GET':
        return jsonify(json.loads(user.settings))

    # Update settings
    new_settings = request.json
    if not new_settings:
        return jsonify({'error': 'Invalid data'}), 400

    # Merge new settings with existing ones
    current_settings = json.loads(user.settings)
    updated_settings = {
        **current_settings,
        **new_settings
    }

    # Validate settings
    valid_settings = {
        'theme': updated_settings.get('theme', 'midnight'),
        'fontSize': updated_settings.get('fontSize', '16'),
        'fontFamily': updated_settings.get('fontFamily', 'Inter'),
        'lineHeight': updated_settings.get('lineHeight', '1.5'),
        'model': updated_settings.get('model', 'gpt-4-turbo'),
        'temperature': float(updated_settings.get('temperature', 0.7)),
        'maxTokens': int(updated_settings.get('maxTokens', 2048)),
        'topP': float(updated_settings.get('topP', 0.9)),
        'apiKey': updated_settings.get('apiKey', '')
    }

    user.settings = json.dumps(valid_settings)
    db.session.commit()

    return jsonify(valid_settings)


# AI Integration
@app.route('/api/ai/generate', methods=['POST'])
def generate_response():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.json
    messages = data.get('messages', [])
    model = data.get('model', 'gpt-4-turbo')
    temperature = data.get('temperature', 0.7)
    max_tokens = data.get('maxTokens', 2048)
    top_p = data.get('topP', 0.9)

    user_settings = json.loads(user.settings)
    api_key = user_settings.get('apiKey', '')

    if not api_key:
        return jsonify({'error': 'API key not configured'}), 400

    try:
        openai.api_key = api_key
        response = openai.ChatCompletion.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=top_p
        )

        return jsonify({
            'content': response.choices[0].message['content'],
            'model': model
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# File Processing
@app.route('/api/process-file', methods=['POST'])
def process_file():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Process PDF files
    if file.filename.endswith('.pdf'):
        try:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return jsonify({'content': text})
        except Exception as e:
            return jsonify({'error': f'PDF processing error: {str(e)}'}), 500

    # Process text files
    elif file.filename.endswith('.txt'):
        try:
            text = file.read().decode('utf-8')
            return jsonify({'content': text})
        except Exception as e:
            return jsonify({'error': f'Text processing error: {str(e)}'}), 500

    else:
        return jsonify({'error': 'Unsupported file type'}), 400


if __name__ == '__main__':
    app.run(debug=True, port=5001)