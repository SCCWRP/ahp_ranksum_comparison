import os
import pandas as pd
from io import BytesIO

from flask import Blueprint, request, render_template, jsonify, g, send_file

from .utils import format_existing_excel, get_raw_wq_data


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


@download.route('/rawdata', methods = ['GET'])
def rawdata():
    eng = g.eng
    
    sitename = request.args.get('sitename')

    # Sitename and firstbmp are required
    if sitename is None:
        resp = {
            "error": "Missing required data",
            "message": "sitename name must be provided via query string arg sitename"
        }
        return jsonify(resp), 400
    
    # prevent SQL injection by requiring that the provided sitename comes from the distinct sitenames in the analysis table
    valid_sitenames = pd.read_sql(f"SELECT DISTINCT sitename FROM vw_mashup_index_comparison_rawdata ORDER BY 1", eng).sitename.values
    
    if sitename not in valid_sitenames:
        resp = {
            "error": "Invalid sitename",
            "message": "sitename provided not found in the list of valid sitenames"
        }
        return jsonify(resp), 400
        
    df = get_raw_wq_data(conn=eng,sitename=sitename)
    
    
    # Use BytesIO as a buffer
    output = BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False)
    
    output.seek(0)
    
    newoutput = format_existing_excel(output)
    
    # Set the headers to send back an Excel file
    return send_file(newoutput, download_name=f"rawdata.xlsx", as_attachment=True, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    