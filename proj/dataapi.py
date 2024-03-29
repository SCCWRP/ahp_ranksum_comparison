import pandas as pd
from flask import Blueprint, request, render_template, jsonify, g

from .utils import get_raw_wq_data

dataapi = Blueprint('dataapi', __name__, template_folder = 'templates')

@dataapi.route('/sitenames', methods = ['GET'])
def sitenames():
    eng = g.eng
    
    # future proofing if they ask the app to analyze hydrology as well
    analysistype = request.args.get('analysistype','wq')
    
    # They should be specifying either water quality or hydrology
    # The above code makes it so if the query string arg is not give, the default is water quality
    if analysistype not in ('wq','hydrology'):
        resp = {
            "error": "Invalid query string arg",
            "message": "analysistype query string argument must be either wq (for water quality) or hydrology - Default is set to water quality"
        }
        return jsonify(resp), 400
    
    
    # SQL injection is prevented with the above early return
    tablename = f"analysis_{analysistype}"
    
    # I think it needs to be a list because i have a feeling it complains about serializing the numpy arrays (.values)
    sitenames = pd.read_sql(f"SELECT DISTINCT sitename FROM {tablename} ORDER BY 1", eng).sitename.tolist()
    
    return jsonify(sitenames=sitenames)


@dataapi.route('/bmpnames', methods = ['GET'])
def bmpnames():
    eng = g.eng
    
    # future proofing if they ask the app to analyze hydrology as well
    analysistype = request.args.get('analysistype', 'wq')
    sitename = request.args.get('sitename')
    bmpplacement = request.args.get('bmpplacement', 'first')
    firstbmp = request.args.get('firstbmp')
    
    # They should be specifying either water quality or hydrology
    # The above code makes it so if the query string arg is not give, the default is water quality
    if analysistype not in ('wq','hydrology'):
        resp = {
            "error": "Invalid query string arg",
            "message": "analysistype query string argument must be either wq (for water quality) or hydrology - Default is set to water quality"
        }
        return jsonify(resp), 400
    
    # SQL injection is prevented with the above early return
    tablename = f"analysis_{analysistype}"
    
    valid_sitenames = pd.read_sql(f"SELECT DISTINCT sitename FROM {tablename} ORDER BY 1", eng).sitename.values
    
    # prevent SQL injection by requiring that the provided sitename comes from the distinct sitenames in the analysis table
    if sitename not in valid_sitenames:
        resp = {
            "error": "Invalid sitename",
            "message": "sitename provided not found in the list of valid sitenames"
        }
        return jsonify(resp), 400
    
    # prevent SQL injection by requiring that the provided sitename comes from the distinct sitenames in the analysis table
    if bmpplacement not in ('first','last'):
        resp = {
            "error": "Invalid BMP placement",
            "message": "BMP Placement query string argument must be either first or last"
        }
        return jsonify(resp), 400
    
    # in this case they are essentially requesting firstbmp's while also providing the name of the firstbmp, which doesnt make sense
    if (bmpplacement == 'first') and (firstbmp is not None):
        resp = {
            "error": "Invalid request",
            "message": "firstbmp name was provided and the bmpplacement query string arg value was 'first' - if requesting firstbmp names, leave out the firstbmp query string arg and simply set the bmpplacement arg value to 'first'"
        }
        return jsonify(resp), 400
    
    # cant request lastbmp's without providing a sitename
    if (firstbmp is not None) and (sitename is None):
        resp = {
            "error": "Invalid request",
            "message": "If firstbmp name is specified, the sitename must also be specified"
        }
        return jsonify(resp), 400
    
    # Now we are ready to construct the query
    qry = "SELECT DISTINCT {}bmp AS bmpname FROM {} {} ORDER BY 1".format(
        bmpplacement,
        tablename,
        f"WHERE sitename = '{sitename}'" if sitename is not None else '',
        f"AND firstbmp = '{firstbmp}'" if firstbmp is not None else '',
    )
    
    bmpnames = pd.read_sql(qry, eng).bmpname.tolist()
    
    # return repsonse
    return jsonify(bmpnames=bmpnames)
    


# All BMP Types
@dataapi.route('/bmptypes', methods = ['GET'])
def bmptypes():
    eng = g.eng

    qry = "SELECT bmpcode, bmpcategory FROM lu_bmptype ORDER BY bmpcode"
    bmptypes = pd.read_sql(qry, eng).to_dict('records')
    
    # return repsonse
    return jsonify(bmptypes=bmptypes)
    

    
    
# Only applies to Water Quality
@dataapi.route('/analytes', methods = ['GET'])
def analytes():
    eng = g.eng
    
    sitename = request.args.get('sitename')
    firstbmp = request.args.get('firstbmp', request.args.get('bmpname')) # we'll take firstbmp or bmpname
    lastbmp = request.args.get('lastbmp', firstbmp) # default to setting it the same as firstbmp
    bmptype = request.args.get('bmptype')
    
    if bmptype is None:
        # Sitename and firstbmp are required
        if sitename is None:
            resp = {
                "error": "Missing required data",
                "message": "sitename name must be provided via query string arg sitename"
            }
            return jsonify(resp), 400
        
        if firstbmp is None:
            resp = {
                "error": "Missing required data",
                "message": "firstbmp name must be provided via query string arg firstbmp"
            }
            return jsonify(resp), 400
        
        
        # prevent SQL injection by requiring that the provided sitename comes from the distinct sitenames in the analysis table
        valid_sitenames = pd.read_sql(f"SELECT DISTINCT sitename FROM analysis_wq ORDER BY 1", eng).sitename.values
        
        if sitename not in valid_sitenames:
            resp = {
                "error": "Invalid sitename",
                "message": "sitename provided not found in the list of valid sitenames"
            }
            return jsonify(resp), 400
        
            
        
        # Now we are ready to construct the query
        qry = f"SELECT DISTINCT analyte FROM analysis_wq WHERE sitename = '{sitename}' AND firstbmp = '{firstbmp}' AND lastbmp = '{lastbmp}' ORDER BY 1"
    
    else:
        
        if any([ x is not None for x in [sitename, firstbmp, lastbmp] ]):
            resp = {
                "error": "Invalid request",
                "message": "Either specify a BMP Type, or a sitename/bmp combination - not both"
            }
            return jsonify(resp), 400
        
        # future proofing in case they want to look at it by BMP type
        # prevent SQL injection by requiring that the provided sitename comes from the distinct sitenames in the analysis table
        valid_bmptypes = pd.read_sql(f"SELECT DISTINCT firstbmptype FROM analysis_wq ORDER BY 1", eng).firstbmptype.values
        if bmptype not in valid_bmptypes:
            resp = {
                "error": "Invalid bmptype",
                "message": "bmptype provided not found in the list of bmp types in the water quality analysis table"
            }
            return jsonify(resp), 400
        
        # Now we are ready to construct the query
        # Just go off firstbmptype
        qry = f"SELECT DISTINCT analyte FROM analysis_wq WHERE firstbmptype = '{bmptype}' ORDER BY 1"
        
        
    
    analytes = pd.read_sql(qry, eng).analyte.tolist()
    
    # return repsonse
    return jsonify(analytes=analytes)
    


    
    
# Actually get the data (This route is for water quality - if they request for hydrology we can build that later - too much time to put in to build that right now)
@dataapi.route('/getdata', methods = ['GET', 'POST'])
def getdata():
    eng = g.eng
    
    params = request.json
    
    sitename = params.get('sitename')
    firstbmp = params.get('firstbmp')
    lastbmp = params.get('lastbmp', firstbmp) # default to setting it the same as firstbmp
    
    # analytes should be a list
    # [
    #     {
    #         "analytename"     : <actual name of the analyte>,
    #         "threshold_value" : <actual threshold value>,
    #         "ranking"         : <user-defined analyte priority ranking>
    #     },
    #     ....
    # ]
    analytes = params.get('analytes')
    
    if not isinstance(analytes, list):
        resp = {
            "error": "Invalid parameter value",
            "message": "analytes param should be a list"
        }
        return jsonify(resp), 400
    
    if not all([isinstance(a, dict) for a in analytes]):
        resp = {
            "error": "Invalid parameter value",
            "message": "analytes param should be a list of dictionaries"
        }
        return jsonify(resp), 400
    
    if not all([set(a.keys()).issubset(set('analytename','threshold_value','ranking')) for a in analytes]):
        resp = {
            "error": "Invalid parameter values",
            "message": "all dictionaries in the analytes list must have attributes analytename, threshold_value, and ranking"
        }
        return jsonify(resp), 400
    
    
    bmptype = params.get('bmptype')
    
    if bmptype is None:
        # Sitename and firstbmp are required
        if sitename is None:
            resp = {
                "error": "Missing required data",
                "message": "sitename name must be provided via query string arg sitename"
            }
            return jsonify(resp), 400
        
        if firstbmp is None:
            resp = {
                "error": "Missing required data",
                "message": "firstbmp name must be provided via query string arg firstbmp"
            }
            return jsonify(resp), 400
        
        
        # prevent SQL injection by requiring that the provided sitename comes from the distinct sitenames in the analysis table
        valid_sitenames = pd.read_sql(f"SELECT DISTINCT sitename FROM {tablename} ORDER BY 1", eng).sitename.values
        
        if sitename not in valid_sitenames:
            resp = {
                "error": "Invalid sitename",
                "message": "sitename provided not found in the list of valid sitenames"
            }
            return jsonify(resp), 400
        
    
    else:
        if any([ x is not None for x in [sitename, firstbmp, lastbmp] ]):
            resp = {
                "error": "Invalid request",
                "message": "Either specify a BMP Type, or a sitename/bmp combination - not both"
            }
            return jsonify(resp), 400
        
        # future proofing in case they want to look at it by BMP type
        # prevent SQL injection by requiring that the provided sitename comes from the distinct sitenames in the analysis table
        valid_bmptypes = pd.read_sql(f"SELECT DISTINCT firstbmptype FROM analysis_wq ORDER BY 1", eng).firstbmptype.values
        if bmptype not in valid_bmptypes:
            resp = {
                "error": "Invalid bmptype",
                "message": "bmptype provided not found in the list of bmp types in the water quality analysis table"
            }
            return jsonify(resp), 400
        
    # build threshold_values according to how the function specifies - a dictionary whose keys are the analyte names and values are the threshold values
    threshold_values = dict()
    for a in analytes:
        threshold_values[a.get('analytename')] = a.get('threshold_value')
    
    # anyways, if both are given it goes with threshold values
    # if neither are given it grabs all analytes
    # if analytes is not provided, it is none and its no big deal
    wqdata = get_raw_wq_data(conn=eng,sitename=sitename,firstbmp=firstbmp,lastbmp=lastbmp,bmptype=bmptype)
    
    wqindexdf = wq_index(wqdata)
    
    # build rankings dictionary in a convenient way to tack on to the index df
    rankings_dict = dict()
    for a in analytes:
        rankings_dict[a.get('analytename')] = a.get('ranking')
    
    wqindexdf['ranking'] = wqindexdf.analyte.apply(lambda a: rankings_dict.get(a))
    
    # AHP needs the constituents and the rankings for each (numpy arrays)
    wqindexdf['ahp_weights'] = calc_ahp_weights(wqindexdf.analyte.values, wqindexdf.ranking.values)

    # Ranksum just needs the rankings (numpy array)
    wqindexdf['ranksum_weights'] = calc_ranksum_weights(wqindexdf.ranking.values)
    
    ahpmash = mashup_index(indexdf.performance_index.values, indexdf.ahp_weights.values)
    rankmash = mashup_index(indexdf.performance_index.values, indexdf.ranksum_weights.values)
    
    resp = {
        "sitename"             : sitename,
        "firstbmp"             : firstbmp,
        "lastbmp"              : lastbmp,
        "analytes"             : analytes,
        "analytenames"         : [a.get('analytename') for a in analytes],
        "thresholds"           : threshold_values,
        "rankings"             : rankings_dict,
        "n_params"             : len(analytes),
        "ahp_mashup_score"     : ahpmash,
        "ranksum_mashup_score" : rankmash
    }
    
    # return repsonse
    return jsonify(resp), 200
    


    