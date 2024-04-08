import React from "react";
import ColorPicker from "./ColorPicker";

import { createRandomString, createRandomHexCode } from "../utils/randomGenerators";
import { useEffect, useState } from "react";

import debounce from '../utils/debounce'

function ThreshSelector({ index, threshVals, setThreshVals }) {


    const [colorVar, setColorVar] = useState(threshVals[index].plotcolor)
    const [threshPercentile, setThreshPercentile] = useState(threshVals[index].percentile)

    const randomId = createRandomString(8);

    const inputId = `thresh-percentile-input-${randomId}`;
    const colorPickerId = `thresh-color-picker-${randomId}`;
    const hexColorValue = createRandomHexCode();

    useEffect(() => {
        setThreshVals(
            prev => prev.map(
                (v, i) => {
                    return i === index ? { ...v, plotcolor: colorVar } : v
                }
            )
        )
    }, [colorVar])

    useEffect(() => {
        
        setThreshVals(
            prev => prev.map(
                (v, i) => {
                    return i === index ? { ...v, percentile: Number(threshPercentile) } : v
                }
            )
        )
    }, [threshPercentile])


    return (
        <div className="form-check" style={{ display: "flex", alignItems: "center", gap: "8px", flexDirection: "column" }}>
            <label for={inputId} style={{ marginBottom: 0 }}>Select a threshold percentile value</label>
            <input
                id={inputId}
                className="form-control"
                style={{ marginBottom: 0 }}
                type="numeric"
                value={threshPercentile}
                step="0.1" min="0"
                max="1"
                onChange={(e) => setThreshPercentile(e.target.value)}
            />
            <ColorPicker
                label="Select a color" 
                name={`color-picker-${randomId}`} 
                id={colorPickerId} 
                color={colorVar} 
                onChange={(e) => setColorVar(e.target.value)} />
        </div>
    )
}

export default ThreshSelector;