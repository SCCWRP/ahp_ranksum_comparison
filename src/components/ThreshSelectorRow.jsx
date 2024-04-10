import React from "react";
import ThreshSelector from "./ThreshSelector";

function ThreshSelectorRow({threshVals, setThreshVals, rowClassName="row mb-5", cellClassName="col-md-2" }) {
    return (
        <div className={rowClassName}>
            {
                threshVals.map((v, i) => {
                    return (
                        <div key={i} className={cellClassName}>
                            <ThreshSelector index={i} threshVals={threshVals} setThreshVals={setThreshVals} />
                        </div>
                    )
                })
            }
        </div>
    )
}

export default ThreshSelectorRow;