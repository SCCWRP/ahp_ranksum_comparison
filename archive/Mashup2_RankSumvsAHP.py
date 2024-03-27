import numpy as np
import matplotlib.pyplot as plt
import ahpy

# This subroutine takes hardcoded performance index rankings and scores and outputs the Mashup scor
"""
This subroutine compares Rank Sum to Analytical Hierarchy Process (AHP)

Inputs: Hard-coded Performance index rankings, scores

Outputs: Rank weighting factors and Mash-Up scores for Rank Sum and AHP methods

"""

# Test Case - N = 6, sequential ranking
categories = ['TSS', 'TN', 'TP', 'Cu', 'Zn', 'FIB']
rankings = [1, 2, 3, 4, 5, 6]
scores = [2.5, 3.0, 1.8, 0.5, 0.9, 5.5]
marker_cycler = ["o", "v", "^", "<", ">", "x"]
label_cycler = ["TSS = " + str(rankings[0]), "TN = " + str(rankings[1]), "TP = " + str(rankings[2]), \
                "Cu = " + str(rankings[3]), "Zn = " + str(rankings[4]), "FIB = " + str(rankings[5]),]

# Rank Sum Algorithm
def calc_ranksum(rankings):
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

ranksum_weights = calc_ranksum(rankings)

print("Rank Sum:", ranksum_weights, sum(ranksum_weights))

# AHP algorithm

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
print("AHP Weights:", ahp_weights, sum(ahp_weights))

# Now calculate the Mashup2 from the hardcode rankings and scores
perf_weights_ahp = []
perf_weights_ranksum = []

# Weighted average is the score from each performance index category times the rank weight
for cat in range(len(categories)):
    perf_weights_ahp.append(scores[cat] * ahp_weights[cat])
    perf_weights_ranksum.append(scores[cat] * ranksum_weights[cat])

performance_index_AHP = sum(perf_weights_ahp)
performance_index_RankSum = sum(perf_weights_ranksum)
print("Mashup2 (Rank Sum): ", performance_index_RankSum)
print("Mashup2 (AHP):", performance_index_AHP)


"""
The rest of this code are plotting functions to look at the relative values between Rank Sum and AHP Weights
"""

def plot_ranksum_weights(categories, rankings, ranksum_weights):
    # Create a list of strings for the x-axis labels
    x_labels = [f'{cat} = {rank}' for cat, rank in zip(categories, rankings)]

    # Create the bar plot
    plt.bar(x_labels, ranksum_weights)

    # Decorate the plot
    plt.xlabel('Category, Ranking')
    plt.ylabel('Ranksum Weights')
    plt.title('Ranksum Weights by Category and Ranking')

    plt.show()
    return

# Call the function to create the plot
# plot_ranksum_weights(categories, rankings, ranksum_weights)

def plot_rankratios_weights(categories, rankings, ahp_list):
    # Create a list of strings for the x-axis labels
    x_labels = [f'{cat} = {rank}' for cat, rank in zip(categories, rankings)]

    # Create the bar plot
    plt.bar(x_labels, ahp_list)

    # Decorate the plot
    plt.xlabel('Category, Ranking')
    plt.ylabel('AHP Weights')
    plt.title('AHP Weights by Category and Ranking')

    plt.show()
    return

# Call the function to create the plot
# plot_rankratios_weights(categories, rankings, ahp_list)

def plot_weights(categories, rankings, ranksum_weights, ahp_list):
    # Create a list of strings for the x-axis labels
    x_labels = [f'{cat} = {rank}' for cat, rank in zip(categories, rankings)]

    # Create positions for the bars
    x_pos = np.arange(len(x_labels))

    # Width of a bar 
    width = 0.3

    # Create the bar plot for ranksum_weights
    plt.bar(x_pos - width/2, ranksum_weights, width, label='Rank Sum')

    # Create the bar plot for ahp_list
    plt.bar(x_pos + width/2, ahp_list, width, label='AHP')

    # Decorate the plot
    plt.xticks(x_pos, x_labels)
    plt.xlabel('Category, Ranking')
    plt.ylabel('Values')
    plt.title('Rank Sum vs AHP by Category and Ranking')
    plt.legend()

    plt.show()
    return
# Call the function to create the plot
plot_weights(categories, rankings, ranksum_weights, ahp_weights)
