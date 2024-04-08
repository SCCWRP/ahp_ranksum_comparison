import traceback
import pandas as pd
from flask import Blueprint, request, render_template, jsonify, g

from .utils import get_raw_wq_data, wq_index, calc_ahp_weights, calc_ranksum_weights, fix_thresh_units, mashup_index

dataapi = Blueprint('dataapi', __name__, template_folder = 'templates')

# for printing
pd.set_option('display.max_columns', 15)

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


############################################################################################################################################
############################################################################################################################################
############################################################################################################################################


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
    
    
##############################################################################################################################
##############################################################################################################################
##############################################################################################################################


# All BMP Types
@dataapi.route('/bmptypes', methods = ['GET'])
def bmptypes():
    eng = g.eng

    qry = "SELECT bmpcode, bmpcategory FROM lu_bmptype ORDER BY bmpcode"
    bmptypes = pd.read_sql(qry, eng).to_dict('records')
    
    # return repsonse
    return jsonify(bmptypes=bmptypes)
    

##############################################################################################################################
##############################################################################################################################
##############################################################################################################################
    
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
        valid_sitenames = pd.read_sql(f"SELECT DISTINCT sitename FROM vw_mashup_index_comparison_rawdata ORDER BY 1", eng).sitename.values
        
        if sitename not in valid_sitenames:
            resp = {
                "error": "Invalid sitename",
                "message": "sitename provided not found in the list of valid sitenames"
            }
            return jsonify(resp), 400
        
            
        
        # Now we are ready to construct the query
        qry = f"SELECT DISTINCT analyte AS analytename, inflow_emc_unit AS unit FROM vw_mashup_index_comparison_rawdata WHERE sitename = '{sitename}' AND firstbmp = '{firstbmp}' AND lastbmp = '{lastbmp}' ORDER BY 1"
    
    else:
        
        if any([ x is not None for x in [sitename, firstbmp, lastbmp] ]):
            resp = {
                "error": "Invalid request",
                "message": "Either specify a BMP Type, or a sitename/bmp combination - not both"
            }
            return jsonify(resp), 400
        
        # future proofing in case they want to look at it by BMP type
        # prevent SQL injection by requiring that the provided sitename comes from the distinct sitenames in the analysis table
        valid_bmptypes = pd.read_sql(f"SELECT DISTINCT firstbmptype FROM vw_mashup_index_comparison_rawdata ORDER BY 1", eng).firstbmptype.values
        if bmptype not in valid_bmptypes:
            resp = {
                "error": "Invalid bmptype",
                "message": "bmptype provided not found in the list of bmp types in the water quality analysis table"
            }
            return jsonify(resp), 400
        
        # Now we are ready to construct the query
        # Just go off firstbmptype
        qry = f"SELECT DISTINCT analyte AS analytename, inflow_emc_unit AS unit FROM vw_mashup_index_comparison_rawdata WHERE firstbmptype = '{bmptype}' ORDER BY 1"
        
        
    
    analytes = pd.read_sql(qry, eng).to_dict('records')
    print("analytes")
    print(analytes)
    
    # return repsonse
    return jsonify(analytes=analytes)
    



##########################################################################################################################################################
##########################################################################################################################################################
##########################################################################################################################################################
    
    
# Only applies to Water Quality
@dataapi.route('/threshval', methods = ['GET'])
def threshvals():
    eng = g.eng
    
    sitename = request.args.get('sitename')
    firstbmp = request.args.get('firstbmp', request.args.get('bmpname')) # we'll take firstbmp or bmpname
    lastbmp = request.args.get('lastbmp', firstbmp) # default to setting it the same as firstbmp
    bmptype = request.args.get('bmptype')
    percentile = request.args.get('percentile')
    analyte = request.args.get('analyte')
    inflow_or_outflow = request.args.get('inflow_or_outflow', 'inflow')
    
    print(f"sitename: {sitename}")
    print(f"firstbmp: {firstbmp}")
    print(f"percentile: {percentile}")
    print(f"bmptype: {bmptype}")
    print(f"inflow_or_outflow: {inflow_or_outflow}")
    print(f"analyte: {analyte}")
    
    if inflow_or_outflow not in ('inflow','outflow'):
        return jsonify({"error": "Invalid query string arg", "message": "inflow_or_outflow arg must be 'inflow' or 'outflow'"}), 400
    
    if percentile is not None:
        if not all([x.isdigit() for x in str(percentile).split('.')]):
            return jsonify({"error": "Invalid query string arg", "message": "Percentile query string arg is not a valid number"}), 400
    else:
        return jsonify({"error": "Missing required query string arg", "message": "percentile query string arg is required"}), 400
    
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
        valid_sitenames = pd.read_sql(f"SELECT DISTINCT sitename FROM vw_mashup_index_comparison_rawdata ORDER BY 1", eng).sitename.values
        
        if sitename not in valid_sitenames:
            resp = {
                "error": "Invalid sitename",
                "message": "sitename provided not found in the list of valid sitenames"
            }
            return jsonify(resp), 400
        
            
        
        # Now we are ready to construct the query
        analyteqry = f"SELECT DISTINCT analyte FROM vw_mashup_index_comparison_rawdata WHERE sitename = '{sitename}' AND firstbmp = '{firstbmp}' AND lastbmp = '{lastbmp}' ORDER BY 1"
    
    else:
        
        if any([ x is not None for x in [sitename, firstbmp, lastbmp] ]):
            resp = {
                "error": "Invalid request",
                "message": "Either specify a BMP Type, or a sitename/bmp combination - not both"
            }
            return jsonify(resp), 400
        
        # future proofing in case they want to look at it by BMP type
        # prevent SQL injection by requiring that the provided sitename comes from the distinct sitenames in the analysis table
        valid_bmptypes = pd.read_sql(f"SELECT DISTINCT firstbmptype FROM vw_mashup_index_comparison_rawdata ORDER BY 1", eng).firstbmptype.values
        if bmptype not in valid_bmptypes:
            resp = {
                "error": "Invalid bmptype",
                "message": "bmptype provided not found in the list of bmp types in the water quality analysis table"
            }
            return jsonify(resp), 400
        
        # Now we are ready to construct the query
        # Just go off firstbmptype
        analyteqry = f"SELECT DISTINCT analyte FROM vw_mashup_index_comparison_rawdata WHERE firstbmptype = '{bmptype}' ORDER BY 1"
        
    if analyte not in pd.read_sql(analyteqry, eng).analyte.values:
        return jsonify({"error": "Invalid query string arg", "message": f"Invalid analyte {analyte}"}), 400
    
    mainqry = f"""
        SELECT 
            PERCENTILE_CONT({percentile}) WITHIN GROUP (ORDER BY {inflow_or_outflow}_emc) AS threshval
        FROM 
            vw_mashup_index_comparison_rawdata
        WHERE 
            analyte = '{analyte}' 
    """
        
    if bmptype is None:
        mainqry += f"""
            AND sitename = '{sitename}'
            AND firstbmp = '{firstbmp}'
        """
    else:
        mainqry += f"""
            AND firstbmptype = '{bmptype}'
        """
    
    threshvallist = pd.read_sql(mainqry, eng).threshval.tolist()
    threshval = threshvallist[0] if len(threshvallist) > 0 else -88
    
    print(f"threshvallist: {threshvallist}")
    
    # return repsonse
    return jsonify(threshval=threshval)




#-----------------------------------------------------------------------------------------------------------------------------------------------
################################################################################################################################################
################################################################################################################################################
################################################################################################################################################
#-----------------------------------------------------------------------------------------------------------------------------------------------



# Only applies to Water Quality
@dataapi.route('/percentileval', methods = ['GET'])
def percentilevals():
    eng = g.eng
    
    sitename = request.args.get('sitename')
    firstbmp = request.args.get('firstbmp', request.args.get('bmpname')) # we'll take firstbmp or bmpname
    lastbmp = request.args.get('lastbmp', firstbmp) # default to setting it the same as firstbmp
    bmptype = request.args.get('bmptype')
    threshval = request.args.get('threshval')
    analyte = request.args.get('analyte')
    inflow_or_outflow = request.args.get('inflow_or_outflow', 'inflow')
    
    
    if inflow_or_outflow not in ('inflow','outflow'):
        return jsonify({"error": "Invalid query string arg", "message": "inflow_or_outflow arg must be 'inflow' or 'outflow'"}), 400
    
    
    if threshval is not None:
        if not all([x.isdigit() for x in str(threshval).split('.')]):
            return jsonify({"error": "Invalid query string arg", "message": "threshval query string arg is not a valid number"}), 400
    else:
        return jsonify({"error": "Missing required query string arg", "message": "threshval query string arg is required"}), 400
    
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
        valid_sitenames = pd.read_sql(f"SELECT DISTINCT sitename FROM vw_mashup_index_comparison_rawdata ORDER BY 1", eng).sitename.values
        
        if sitename not in valid_sitenames:
            resp = {
                "error": "Invalid sitename",
                "message": "sitename provided not found in the list of valid sitenames"
            }
            return jsonify(resp), 400
        
            
        
        # Now we are ready to construct the query
        analyteqry = f"SELECT DISTINCT analyte FROM vw_mashup_index_comparison_rawdata WHERE sitename = '{sitename}' AND firstbmp = '{firstbmp}' AND lastbmp = '{lastbmp}' ORDER BY 1"
    
    else:
        
        if any([ x is not None for x in [sitename, firstbmp, lastbmp] ]):
            resp = {
                "error": "Invalid request",
                "message": "Either specify a BMP Type, or a sitename/bmp combination - not both"
            }
            return jsonify(resp), 400
        
        # future proofing in case they want to look at it by BMP type
        # prevent SQL injection by requiring that the provided sitename comes from the distinct sitenames in the analysis table
        valid_bmptypes = pd.read_sql(f"SELECT DISTINCT firstbmptype FROM vw_mashup_index_comparison_rawdata ORDER BY 1", eng).firstbmptype.values
        if bmptype not in valid_bmptypes:
            resp = {
                "error": "Invalid bmptype",
                "message": "bmptype provided not found in the list of bmp types in the water quality analysis table"
            }
            return jsonify(resp), 400
        
        # Now we are ready to construct the query
        # Just go off firstbmptype
        analyteqry = f"SELECT DISTINCT analyte FROM vw_mashup_index_comparison_rawdata WHERE firstbmptype = '{bmptype}' ORDER BY 1"
        
    if analyte not in pd.read_sql(analyteqry, eng).analyte.values:
        return jsonify({"error": "Invalid query string arg", "message": "Invalid analyte"}), 400
    
    
    mainqry = f"""
        WITH RankedValues AS (
            SELECT
                inflow_emc,
                CUME_DIST() OVER (ORDER BY inflow_emc) AS cumulative_distribution
            FROM vw_mashup_index_comparison_rawdata
            WHERE analyte = '{analyte}' 
            {
                "AND sitename = '{}' AND firstbmp = '{}'".format(sitename, firstbmp) if bmptype is None else "AND firstbmptype = '{}'".format(bmptype)
            }
        ),
        PercentileRank AS (
            SELECT
                MAX(cumulative_distribution) AS percentile_rank
            FROM RankedValues
            WHERE inflow_emc <= {threshval}
        )
        SELECT percentile_rank
        FROM PercentileRank
    """

    percentile_val_list = pd.read_sql(mainqry, eng).percentile_rank.tolist()
    percentile_rank = percentile_val_list[0] if len(percentile_val_list) > 0 else -88
    
    # return repsonse
    return jsonify(percentile_rank=percentile_rank)



#############################################################################################################################################################    
#############################################################################################################################################################    
#############################################################################################################################################################    
    
    
# Actually get the data (This route is for water quality - if they request for hydrology we can build that later - too much time to put in to build that right now)
@dataapi.route('/getdata', methods = ['GET', 'POST'])
def getdata():
    eng = g.eng
    
    params = request.json
    
    sitename = params.get('sitename')
    firstbmp = params.get('firstbmp', params.get('bmpname'))
    lastbmp = params.get('lastbmp', firstbmp) # default to setting it the same as firstbmp
    
    # analytes should be a list
    # [
    #     {
    #         "analytename"     : <actual name of the analyte>,
    #         "threshold_value" : <actual threshold value>,
    #         "unit" : <units of threshold value>,
    #         "rank"         : <user-defined analyte priority rank>
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
    
    if len(analytes) < 2:
        resp = {
            "error": "Invalid parameter value",
            "message": "Analytes param only has one value - a mashup index score requires two"
        }
        return jsonify(resp), 400
        
    
    if not all([isinstance(a, dict) for a in analytes]):
        resp = {
            "error": "Invalid parameter value",
            "message": "analytes param should be a list of dictionaries"
        }
        return jsonify(resp), 400
    
    if not all([set(a.keys()).issubset(set(['analytename','threshold_value','unit','rank'])) for a in analytes]):
        resp = {
            "error": "Invalid parameter values",
            "message": "all dictionaries in the analytes list must have attributes analytename, threshold_value, unit and rank"
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
        valid_sitenames = pd.read_sql(f"SELECT DISTINCT sitename FROM vw_mashup_index_comparison_rawdata ORDER BY 1", eng).sitename.values
        
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
        valid_bmptypes = pd.read_sql(f"SELECT DISTINCT firstbmptype FROM vw_mashup_index_comparison_rawdata ORDER BY 1", eng).firstbmptype.values
        if bmptype not in valid_bmptypes:
            resp = {
                "error": "Invalid bmptype",
                "message": "bmptype provided not found in the list of bmp types in the water quality analysis table"
            }
            return jsonify(resp), 400
        
    # build threshold_values according to how the function specifies - a dictionary whose keys are the analyte names and values are the threshold values
    threshold_values = dict()
    for a in analytes:
        threshold_values[a.get('analytename')] = {
            "threshold_value" : a.get('threshold_value'),
            "unit"  : a.get('unit')
        }
    
    print('threshold_values')
    print(threshold_values)
    
    # anyways, if both are given it goes with threshold values
    # if neither are given it grabs all analytes
    # if analytes is not provided, it is none and its no big deal
    wqdata = get_raw_wq_data(conn=eng,sitename=sitename,firstbmp=firstbmp,lastbmp=lastbmp,bmptype=bmptype,threshold_values=threshold_values)
    
    print('wqdata')
    print(wqdata)
    
    wqdata = fix_thresh_units(wqdata)
    
    print('wqdata after fix thresh units')
    print(wqdata)
    
    wqindexdf = wq_index(wqdata, grouping_columns = ['sitename', 'firstbmp', 'lastbmp'])
    
    print('wqindexdf')
    print(wqindexdf)
    
    # build rankings dictionary in a convenient way to tack on to the index df
    rankings_dict = dict()
    for a in analytes:
        rankings_dict[a.get('analytename')] = a.get('rank')
    
    wqindexdf['rank'] = wqindexdf.analyte.apply(lambda a: rankings_dict.get(a))
    
    # AHP needs the constituents and the rankings for each (numpy arrays)
    wqindexdf['ahp_weights'] = calc_ahp_weights(wqindexdf.analyte.values, wqindexdf['rank'].values)

    # Ranksum just needs the rankings (numpy array)
    wqindexdf['ranksum_weights'] = calc_ranksum_weights(wqindexdf['rank'].values)
    
    ahpmash = mashup_index(wqindexdf.performance_index.values, wqindexdf.ahp_weights.values)
    rankmash = mashup_index(wqindexdf.performance_index.values, wqindexdf.ranksum_weights.values)
    
    resp = {
        "sitename"             : sitename,
        "bmpname"              : firstbmp,
        "firstbmp"             : firstbmp,
        "lastbmp"              : lastbmp,
        "analytes"             : analytes,
        "analytenames"         : [a.get('analytename') for a in analytes],
        "thresholds"           : threshold_values,
        "rankings"             : rankings_dict,
        "n_params"             : len(analytes),
        "ahp_mashup_score"     : round(ahpmash, 2),
        "ranksum_mashup_score" : round(rankmash, 2)
    }
    
    # return repsonse
    return jsonify(resp)
    


    
#############################################################################################################################################################    
#############################################################################################################################################################    
#############################################################################################################################################################    
    
    
# Actually get the data (This route is for water quality - if they request for hydrology we can build that later - too much time to put in to build that right now)
@dataapi.route('/thresh-comparison-data', methods = ['GET', 'POST'])
def threshdata():
    eng = g.eng
    
    params = request.json
    
    sitename = params.get('sitename')
    firstbmp = params.get('firstbmp', params.get('bmpname'))
    lastbmp = params.get('lastbmp', firstbmp) # default to setting it the same as firstbmp
    
    
    analytes = params.get('analytes')
    # analytes should be a list
    # [
    #     {
    #         "analytename"     : <actual name of the analyte>,
    #         "unit" : <units of threshold value>,
    #         "rank"         : <user-defined analyte priority rank>
    #     },
    #     ....
    # ]
    
    
    thresh_percentiles_and_colors = params.get('thresholds')
    # thresh_percentiles_and_colors will look like
    # [
    #     {
    #         percentile: 0.1,
    #         plotcolor: "#1705e3"
    #     },
    #     ... so on and so forth
    # ]
    
    if not isinstance(analytes, list):
        resp = {
            "error": "Invalid parameter value",
            "message": "analytes param should be a list"
        }
        return jsonify(resp), 400
    
    if len(analytes) < 2:
        resp = {
            "error": "Invalid parameter value",
            "message": "Analytes param only has one value - a mashup index score requires two"
        }
        return jsonify(resp), 400
        
    
    if not all([isinstance(a, dict) for a in analytes]):
        resp = {
            "error": "Invalid parameter value",
            "message": "analytes param should be a list of dictionaries"
        }
        return jsonify(resp), 400
    
    if not all([set(a.keys()).issubset(set(['analytename','unit','rank'])) for a in analytes]):
        resp = {
            "error": "Invalid parameter values",
            "message": "all dictionaries in the analytes list must have attributes analytename, threshold_value, unit and rank"
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
        valid_sitenames = pd.read_sql(f"SELECT DISTINCT sitename FROM vw_mashup_index_comparison_rawdata ORDER BY 1", eng).sitename.values
        
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
        valid_bmptypes = pd.read_sql(f"SELECT DISTINCT firstbmptype FROM vw_mashup_index_comparison_rawdata ORDER BY 1", eng).firstbmptype.values
        if bmptype not in valid_bmptypes:
            resp = {
                "error": "Invalid bmptype",
                "message": "bmptype provided not found in the list of bmp types in the water quality analysis table"
            }
            return jsonify(resp), 400
        
    if not all([ str(t.get('percentile')).replace('.','').isdigit() for t in thresh_percentiles_and_colors ]):
            resp = {
                "error": "Invalid thresh percentiles value",
                "message": "Threshold percentile value must be numeric"
            }
            return jsonify(resp), 400
    
    
    
    percentile_cont_str = ',\n'.join(
        [
            f"PERCENTILE_CONT({t.get('percentile')}) WITHIN GROUP ( ORDER BY inflow_emc ) AS thresh_{round(t.get('percentile') * 100)}" 
            for t in thresh_percentiles_and_colors
        ]
    )
    
    
    thresh_percentiles_sql = f"""
        SELECT
            analyte,
            {percentile_cont_str}
        FROM
            vw_mashup_index_comparison_rawdata
        WHERE
            analyte IN ( '{"', '".join([a.get('analytename') for a in analytes])}' ) 
        GROUP BY
            analyte
    """
    
    thresh_percentiles_df = pd.read_sql(thresh_percentiles_sql, eng)
    
    thresh_units_df = pd.DataFrame(analytes).rename(columns = {'analytename': 'analyte'})
    
    thresh_percentiles_df = thresh_percentiles_df.merge(thresh_units_df, how = 'left', on = 'analyte')
    
    print("thresh_percentiles_df")
    print(thresh_percentiles_df)
    
    # build threshold_values according to how the function specifies - a dictionary whose keys are the analyte names and values are the threshold values
    
    all_scores = []
    for col in [c for c in thresh_percentiles_df.columns if 'thresh' in str(c)]:
        threshold_values = thresh_percentiles_df[['analyte', col, 'unit', 'rank']].rename(columns = {col: 'threshold_value'}).set_index('analyte').to_dict(orient='index')
        print("threshold_values")
        print(threshold_values)
        
        # anyways, if both are given it goes with threshold values
        # if neither are given it grabs all analytes
        # if analytes is not provided, it is none and its no big deal
        wqdata = get_raw_wq_data(conn=eng,sitename=sitename,firstbmp=firstbmp,lastbmp=lastbmp,bmptype=bmptype,threshold_values=threshold_values)
        
        wqdata = fix_thresh_units(wqdata)
        
        wqindexdf = wq_index(wqdata, grouping_columns = ['sitename', 'firstbmp', 'lastbmp'])
        
        # build rankings dictionary in a convenient way to tack on to the index df
        rankings_dict = dict()
        for a in analytes:
            rankings_dict[a.get('analytename')] = a.get('rank')
        
        wqindexdf['rank'] = wqindexdf.analyte.apply(lambda a: rankings_dict.get(a))
        
        # AHP needs the constituents and the rankings for each (numpy arrays)
        wqindexdf['ahp_weights'] = calc_ahp_weights(wqindexdf.analyte.values, wqindexdf['rank'].values)

        # Ranksum just needs the rankings (numpy array)
        wqindexdf['ranksum_weights'] = calc_ranksum_weights(wqindexdf['rank'].values)
        
        ahpmash = mashup_index(wqindexdf.performance_index.values, wqindexdf.ahp_weights.values)
        rankmash = mashup_index(wqindexdf.performance_index.values, wqindexdf.ranksum_weights.values)
        
        thresh_percentile = (float(col.replace('thresh_','')) / 100)
        
        try:
            thresh_color = str([ v.get('plotcolor', "#000000") for v in thresh_percentiles_and_colors if v.get('percentile') == thresh_percentile][0]).upper()
            warning_message = ""
        except IndexError as e:
            print("ERROR getting thresh color - not found")
            traceback.print_exc()
            warning_message = f"Plot color not found for percentile {thresh_percentile}"
            thresh_color = "#000000"
        
        
        all_scores.append({
            "thresh_percentile"    : thresh_percentile,
            "threshold_color"      : thresh_color,
            "threshold_values"     : threshold_values,
            "sitename"             : sitename,
            "bmpname"              : firstbmp,
            "firstbmp"             : firstbmp,
            "lastbmp"              : lastbmp,
            "analytes"             : analytes,
            "analytenames"         : list(threshold_values.keys()),
            "rankings"             : rankings_dict,
            "n_params"             : len(thresh_percentiles_df),
            "ahp_mashup_score"     : round(ahpmash, 2),
            "ranksum_mashup_score" : round(rankmash, 2),
            "warning_message"      : warning_message
        })
    
    # return repsonse
    return jsonify(all_scores), 200
    


    