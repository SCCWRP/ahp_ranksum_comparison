import pandas as pd
import numpy as np
import ahpy

# Rank Sum Algorithm
def calc_ranksum_weights(rankings):
    # rankings should be a list or array

    max_rank_plus1 = max(rankings) + 1
    ranksum = 0
    weights = np.zeros(len(rankings))

    # Iterate through the rankings
    for ii in range(len(rankings)):
        # The weight is the (max_rank + 1 - Rank) so that the lowest rankings get the highest weight 
        weights[ii] = max_rank_plus1 - rankings[ii]

        # Accumulate the weight
        ranksum = ranksum + (max_rank_plus1 - rankings[ii])
    
    # Normalize each rank weight by the cumulative weight so that sum(weights) = 1
    weights = weights/ranksum
    return weights


def calc_ahp_weights(constituents, rankings):
    # constituents should be a list or array
    # rankings should be a list or array
    
    # Initialize an empty dictionary to store the combinations and rankings
    comp_ratios = {}

    # Loop through the constituents and rankings to create the combinations, Matrix creation
    for i in range(len(constituents)):
        for j in range(i + 1, len(constituents)):
            constituent1 = constituents[i]
            constituent2 = constituents[j]
            ranking1 = rankings[i]
            ranking2 = rankings[j]
            
            # Calculate the combination ratio and add it to the dictionary
            comp_ratios[(constituent1, constituent2)] = float(ranking2)/float(ranking1)

    # print(comp_ratios)

    # Use ahpy library to calculate eigenvector for comp_ratios matrix
    ahp_weights_object = ahpy.Compare(name="Index", comparisons=comp_ratios, precision = 3, random_index = 'saaty')
    ahp_weights = np.array(list(ahp_weights_object.target_weights.values()))

    return ahp_weights

def mashup_index(scores, weights):
    # "scores" represents a list (or array) of scores (separate scores per constituent)
    # weights represents the AHP or Ranksum weights list (or array)
    
    # Now calculate the Mashup2 from the hardcode rankings and scores
    perf_weights = []

    # Weighted average is the score from each performance index category times the rank weight
    for i in range(len(scores)):
        perf_weights.append(scores[i] * weights[i])

    performance_index = sum(perf_weights)

    return performance_index

def wq_index(
    df, 
    default_threshold = 1, 
    
    # Default category score values
    category_score_values = {
        "Success"      : 0,
        "Excess"       : 1,
        "Marginal"     : 3,
        "Insufficient" : 4,
        "Failure"      : 10
    }
):
    """
    df represents the dataframe that has the waterquality data for various rain events at a BMP site
    It must contain the following columns:
    
    bmp
    inflow_emc
    outflow_emc
    analyte
    threshold
    
    Data must be prepared in such a way that there is no sitename/bmp separation - if analyzing a site/bmp combination then prep the data accordingly
    
    Prep the data such that there is only one threshold value per analyte. 
    If multple thresholds are found, the function will choose the lowest threshold value so please check the data appropriately and correctly
    
    """
    assert isinstance(category_score_values, dict), f"category_score_values parameter must be a dictionary, not {type(category_score_values)}"
    
    wq_index_categories = ["Success", "Excess", "Marginal", "Insufficient", "Failure"]
    assert set(wq_index_categories) == set(category_score_values.keys()), f"Category score values dictionary must have the keys {', '.join(wq_index_categories)}"
    
    # assign default threshold
    if 'threshold' not in df.columns:
        print(f"warning - threshold not provided - using default {default_threshold}")
        df = df.assign(threshold = default_threshold)
    
    
    # just a step to deal with if something got messed up and there were multiple thresholds within a bmp/analyte grouping 
    thresholds = (
        df[df.inflow_emc.notnull() & df.outflow_emc.notnull()] 
            .groupby(['bmp', 'analyte'])['threshold'].min()  
            .reset_index()
    )


    # After this we are ready to actually work
    df = df.drop('threshold', axis = 'columns').merge(thresholds, on = ['bmp','analyte'], how = 'inner')


    # Get the ratios
    df = df[df.inflow_emc.notnull() & df.outflow_emc.notnull()].assign(
        inf_thresh_ratio = df.inflow_emc / df.threshold,
        eff_thresh_ratio = df.outflow_emc / df.threshold,
    )


    # Get the categories based on the pre defined criteria
    df = df.assign(
        category = df.apply(
            lambda row:
                'Success' if ( (row['inf_thresh_ratio'] > 1) & (row['eff_thresh_ratio'] < 1) )
                else 'Excess' if ( row['eff_thresh_ratio'] < row['inf_thresh_ratio'] <= 1 )
                else 'Marginal' if  ( row['inf_thresh_ratio'] <= row['eff_thresh_ratio'] < 1 )
                else 'Failure' if ( row['eff_thresh_ratio'] >= 1) & (row['eff_thresh_ratio'] >= row['inf_thresh_ratio'] )
                else 'Insufficient' if ( 1 <= row['eff_thresh_ratio'] < row['inf_thresh_ratio'] )
                else pd.NA
            , axis = 1
        )
    )

    df = df.assign(
        category_score = df.category.apply(lambda val: category_score_values.get(val, pd.NA))
    )


    indexdf = df.groupby(['bmp','analyte']).apply(
        lambda df: pd.Series({
            "performance_index" : (
                ((df['category'].value_counts().get('Success', 0) / len(df)) * category_score_values.get('Success', pd.NA)) +
                ((df['category'].value_counts().get('Excess', 0) / len(df)) * category_score_values.get('Excess', pd.NA)) +
                ((df['category'].value_counts().get('Marginal', 0) / len(df)) * category_score_values.get('Marginal', pd.NA)) +
                ((df['category'].value_counts().get('Insufficient', 0) / len(df)) * category_score_values.get('Insufficient', pd.NA)) +
                ((df['category'].value_counts().get('Failure', 0) / len(df)) * category_score_values.get('Failure', pd.NA)) 
            ),
            "number_of_events" : int(len(df))
        })
    ).reset_index()
        
        
    return indexdf
        