import numpy as np
import matplotlib.pyplot as plt
import ahpy

# Rank Sum Algorithm
def calc_ranksum_weights(rankings):
    # rankings should be a list or array

    max_rank_plus1 = max(rankings) + 1
    cum_ranksum = 0
    weights = np.zeros(len(rankings))

    # Iterate through the rankings
    for ii in range(len(rankings)):
        # The weight is the (max_rank + 1 - Rank) so that the lowest rankings get the highest weight 
        weights[ii] = max_rank_plus1 - rankings[ii]

        # Accumulate the weight
        cum_ranksum = cum_ranksum + (max_rank_plus1 - rankings[ii])
    
    # Normalize each rank weight by the cumulative weight so that sum(weights) = 1
    weights = weights/cum_ranksum
    return weights


def calc_ahp_weights(categories, rankings):
    # categories should be a list or array
    # rankings should be a list or array
    
    # Initialize an empty dictionary to store the combinations and rankings
    comp_ratios = {}

    # Loop through the categories and rankings to create the combinations, Matrix creation
    for i in range(len(categories)):
        for j in range(i + 1, len(categories)):
            category1 = categories[i]
            category2 = categories[j]
            ranking1 = rankings[i]
            ranking2 = rankings[j]
            
            # Calculate the combination ratio and add it to the dictionary
            comp_ratios[(category1, category2)] = float(ranking2)/float(ranking1)

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