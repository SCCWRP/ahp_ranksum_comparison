import pandas as pd
from funcs import mashup_index, calc_ahp_weights, calc_ranksum_weights

data = pd.DataFrame({
    'categories': ['TN','TP', 'Zinc'],
    'scores': [2.5, 3.0, 1.8],
    'rankings': [2,3,1]
})



rankweights = calc_ranksum_weights(data.rankings)
ahpweights = calc_ahp_weights(data.categories, data.rankings)

rankmash = mashup_index(data.scores, rankweights)
ahpmash = mashup_index(data.scores, ahpweights)

print("Rank Sum Mash Score: {}".format(rankmash))
print("AHP Mash Score: {}".format(ahpmash))