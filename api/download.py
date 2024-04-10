import os
from flask import Blueprint, request, render_template, jsonify, g, send_file

download = Blueprint('download', __name__, static_folder = 'static')

@download.route('/logo')
def logo():
    return send_file( os.path.join(os.getcwd(), 'api','static', 'images', 'sccwrp-logo.jpeg') )

@download.route('/loader')
def loader():
        
    return send_file( os.path.join(os.getcwd(), 'api','static', 'images', 'loader.gif') )