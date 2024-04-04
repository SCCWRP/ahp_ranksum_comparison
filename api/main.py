import os
from flask import Blueprint, render_template, session, redirect, url_for, request, jsonify

homepage = Blueprint('homepage', __name__, template_folder = 'templates')


@homepage.route('/')
def index():
    if not session.get('LOGGED_IN'):
        return redirect(url_for('homepage.login'))
        
    return render_template('index.jinja2')

@homepage.route('/login', methods=['GET','POST'])
def login():
    if request.method == 'POST':
        body = request.json
        pw = body.get('pw')
        print(pw)
        print('request.script_root')
        print(request.script_root)
        success = ((pw == os.getenv('APP_PASSWORD')) and (pw is not None))
        if success:
            session['LOGGED_IN'] = True
        else:
            session['LOGGED_IN'] = False
        return jsonify(success=success, redirect=request.script_root)
    
    return render_template('login.jinja2')

