from funcs import mashup_index, calc_ranksum_weights, calc_ahp_weights, wq_index
from sqlalchemy import create_engine
import pandas as pd
import numpy as np
import os

CATEGORY_SCORES = {
    "Success"      : 0,
    "Excess"       : 1,
    "Marginal"     : 3,
    "Insufficient" : 4,
    "Failure"      : 10
}

eng = create_engine(os.getenv('DB_CONNECTION_STRING'))

df = pd.read_sql( "SELECT firstbmp AS bmp, analyte, inflow_emc, outflow_emc FROM analysis_wq WHERE firstbmp = 'Shop Creek Pond-Wetland System  (90-94)'; ", eng )

df = df.assign(threshold = 4)

indexdf = wq_index(df)

# priority ranking for the mashup
indexdf['ranking'] = np.random.permutation(range(1, len(indexdf) + 1))

# AHP needs the constituents and the rankings for each (numpy arrays)
indexdf['ahp_weights'] = calc_ahp_weights(indexdf.analyte.values, indexdf.ranking.values)

# Ranksum just needs the rankings  (numpy array)
indexdf['ranksum_weights'] = calc_ranksum_weights(indexdf.ranking.values)

print(f"AHP Mash Up: {mashup_index(indexdf.performance_index.values, indexdf.ahp_weights.values)}")
print(f"Rank Sum Mash Up: {mashup_index(indexdf.performance_index.values, indexdf.ranksum_weights.values)}")

