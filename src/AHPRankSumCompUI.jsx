import React, { useState, useEffect } from 'react';

// Component imports
import IndexComparisonChart from './components/IndexComparisonChart'
import ColorPicker from './components/ColorPicker';
import AnalyteTable from './components/AnalyteTable';

// Custom Hooks
import useLocalStorage from './hooks/useLocalStorage';

// Styles
import './styles/generic.css'
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

function AHPRankSumCompUI({siteName, bmpName}) {

    // State management
    const [ahpColor, setAhpColor] = useState('#00FF00');
    const [ranksumColor, setRanksumColor] = useState('#0000FF');

    const [showAnalytes, setShowAnalytes] = useState(true);
    const [analytes, setAnalytes] = useState([]);
    const [activeAnalytes, setActiveAnalytes] = useState([]);
    
    
    const [plotData, setPlotData] = useLocalStorage('bmpIndexComparisonPlotData', []);

    const [universalThreshPercentile, setUniversalThreshPercentile] = useState(0.25);


    // Fetch Analytes when a BMP name is selected
    useEffect(() => {
        if (!siteName || !bmpName) return;
        fetch(`analytes?sitename=${encodeURIComponent(siteName)}&bmpname=${encodeURIComponent(bmpName)}`) // Your API endpoint for fetching analytes
            .then((response) => response.json())
            .then((data) => {
                setAnalytes((a) => data.analytes);
                setActiveAnalytes([]); // reset
            });
    }, [siteName, bmpName]);


    function updatePlotData() {

        if (activeAnalytes.length < 2) {
            alert("Mashup score cannot be calculated with less than 2 parameters")
            return;
        }

        const consecutiveRankings = ((activeAnalytes.map((a) => a.rank).reduce((prev, cur) => prev + cur, 0)) === (activeAnalytes.length * (activeAnalytes.length + 1) * 0.5));

        if (!consecutiveRankings) {
            const confirmed = confirm("Priority ranking values are not consecutive integers, which may produce unexpected results. Do you wish to proceed?")
            if (!confirmed) return;
        }

        fetch('getdata', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sitename: siteName,
                bmpname: bmpName,
                analytes: activeAnalytes
            })
        })
            .then(async response => {
                // Check if the response is ok (status in the range 200-299)
                if (!response.ok) {
                    // Try to parse the error body
                    const errorBody = await response.json();
                    // Throw an object that includes both the status and the parsed body
                    throw { status: response.status, ...errorBody };
                }
                return response.json();
            })
            .then(data => setPlotData(d => [...d, data]))
            .catch(error => {
                // Check if it's an expected error structure
                if (error.status && error.message) {
                    console.error(`Fetch error (${error.status}): ${error.message}`);
                    // If 'error.error' or similar contains additional info, log it as well
                    if (error.error) {
                        console.error(`Error details: ${error.error}`);
                    }
                } else {
                    // For unexpected errors (e.g., network errors), log the whole error
                    console.error('Unexpected error:', error);
                }
            });
    }


    return (<div className="container my-1">
        <div class="row mb-5">
            {/* Assume ColorPicker supports Bootstrap styling; otherwise, adapt it */}
            <div className="col-md-4">
                <ColorPicker
                    label="AHP Score Color"
                    id="ahp-color-picker"
                    name="ahp-color-picker"
                    color={ahpColor}
                    onChange={(e) => setAhpColor(e.target.value)}
                />
            </div>

            <div className="col-md-4">
                <ColorPicker
                    label="Ranksum Score Color"
                    id="ranksum-color-picker"
                    name="ranksum-color-picker"
                    color={ranksumColor}
                    onChange={(e) => setRanksumColor(e.target.value)}
                />
            </div>

        </div>


        <div class="row mb-5 d-flex align-items-end">
            <div className="col-3 form-check d-flex flex-column">
                <label htmlFor="universal-thresh-setter">Set all threshold percentiles to:</label>
                <input
                    id="universal-thresh-setter"
                    className="form-control"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={universalThreshPercentile}
                    onChange={(e) => setUniversalThreshPercentile(Number(e.target.value))}
                />

            </div>
            <div className="col-3 form-check d-flex flex-column">
                <div className="mt-auto">
                    <button
                        id="add-data-btn"
                        className="btn btn-primary"
                        onClick={updatePlotData}
                    >
                        Add data to plots
                    </button>
                </div>
            </div>
            <div className="col-3 form-check d-flex flex-column">
                <div className="mt-auto">
                    <button
                        id="delete-current-data-btn"
                        className="btn btn-primary"
                        onClick={(e) => {
                            const confirmed = confirm(`Are you sure you want to clear existing data for site ${siteName} and BMP ${bmpName} ?`)
                            if (!confirmed) return;
                            setPlotData((d) => d.filter(i => ((i.sitename != siteName) & (i.bmpname != bmpName))))
                        }}
                    >
                        Clear Plot Data for current site
                    </button>
                </div>
            </div>
            <div className="col-3 form-check d-flex flex-column">
                <div className="mt-auto">
                    <button
                        id="delete-all-data-btn"
                        className="btn btn-primary"
                        onClick={(e) => {
                            const confirmed = confirm(`Are you sure you want to clear existing data for all sites?`)
                            if (!confirmed) return;
                            setPlotData([])
                        }}
                    >
                        Clear Plot data for all sites
                    </button>
                </div>
            </div>
        </div>

        <div class="row mb-3">
            <div className="col-12">
                <div className="form-check">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id="show-analytes"
                        checked={showAnalytes}
                        onChange={(e) => setShowAnalytes(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="show-analytes">
                        Show/Hide list of analytes
                    </label>
                </div>
            </div>
        </div>


        <AnalyteTable
            showAnalytes={showAnalytes}
            analytes={analytes}
            siteName={siteName}
            bmpName={bmpName}
            universalThreshPercentile={universalThreshPercentile}
            setActiveAnalytes={setActiveAnalytes}
        />


        <div id="index-comparison-chart" className="mt-5">
            <div class="chart-label" style={{ textAlign: 'center', fontSize: '20px' }}>Ranksum vs AHP Comparison plot</div>
            <IndexComparisonChart plotData={plotData.filter((d) => ((d.sitename == siteName) & (d.bmpname == bmpName)))} ahpColor={ahpColor} ranksumColor={ranksumColor} />
        </div>
    </div>)
}

export default AHPRankSumCompUI;