import os
from flask import Blueprint, request, render_template, jsonify, g, send_file

imgserver = Blueprint('imgserver', __name__, static_folder = 'static')

@imgserver.route('/logo')
def logo():
    return send_file( os.path.join(os.getcwd(), 'api','static', 'images', 'sccwrp-logo.jpeg') )

@imgserver.route('/loader')
def loader():
        
    return send_file( os.path.join(os.getcwd(), 'api','static', 'images', 'loader.gif') )