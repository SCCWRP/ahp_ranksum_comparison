from flask import Blueprint, render_template

homepage = Blueprint('homepage', __name__, template_folder = 'templates')

@homepage.route('/')
def index():
    return render_template('index.jinja2')