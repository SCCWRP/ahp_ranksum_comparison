import os
import pandas as pd
from io import BytesIO

from flask import Blueprint, request, render_template, jsonify, g, send_file

from .utils import format_existing_excel


download = Blueprint('download', __name__, static_folder = 'static')

@download.route('/json-to-excel', methods = ['POST'])
def json_to_excel_route():
    
    dat = request.json
    df = pd.DataFrame(dat)
    
    # Use BytesIO as a buffer
    output = BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False)
    
    output.seek(0)
    
    output = format_existing_excel(output)

    # Set the headers to send back an Excel file
    return send_file(output, download_name=f"converted_json.xlsx", as_attachment=True, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')


@download.route('/loader')
def loader():
        
    return send_file( os.path.join(os.getcwd(), 'api','static', 'images', 'loader.gif') )