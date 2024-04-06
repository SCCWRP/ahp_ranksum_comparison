import React, { useState, useEffect } from 'react';

// Component imports
import IndexComparisonChart from './components/IndexComparisonChart'
import { SimpleAnalyteTable } from './components/AnalyteTable';
import ThreshSelector from './components/ThreshSelector';

// Custom Hooks
import useLocalStorage from './hooks/useLocalStorage';


// Styles
import './styles/generic.css'
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

function ThreshCompUI({ siteName, bmpName }) {

    const THRESHOLD_VALUE_LOCALSTORAGE_KEY = "threshCompPercentilesAndPlotColors";

    // State management

    // const [threshVals, setThreshVals] = useState(
    const [threshVals, setThreshVals] = useLocalStorage(THRESHOLD_VALUE_LOCALSTORAGE_KEY, 
        [
            {
                percentile: 0.1,
                plotcolor: "#1705e3"
            },
            {
                percentile: 0.25,
                plotcolor: "#0595e3"
            },
            {
                percentile: 0.5,
                plotcolor: "#05e374"
            },
            {
                percentile: 0.75,
                plotcolor: "#34ad34"
            },
            {
                percentile: 0.9,
                plotcolor: "#9934ad"
            }
        ]
    )

    const [showAnalytes, setShowAnalytes] = useState(true);
    const [analytes, setAnalytes] = useState([]);
    const [activeAnalytes, setActiveAnalytes] = useState([]);

    const [plotData, setPlotData] = useLocalStorage('bmpThreshComparisonPlotData', []);



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

        fetch('threshcomparison', { // the threshcomparison route is to be created later
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sitename: siteName,
                bmpname: bmpName,
                analytes: activeAnalytes,
                thresholds: thresholds // to later be created - i anticipate to be an array of threshold percentiles
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
            {
                threshVals.map((v, i) => {
                    return (
                        <div key={i} className="col-md-2">
                            <ThreshSelector index={i} threshVals={threshVals} setThreshVals={setThreshVals} />
                        </div>
                    )
                })
            }
        </div>


        <div class="row mb-4 d-flex align-items-end">

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
            <div className="col-3 form-check d-flex flex-column">
                <div className="mt-auto">
                    <button
                        id="thresh-reset-btn"
                        className="btn btn-primary"
                        onClick={(e) => {
                            const confirmed = confirm(`Are you sure you want to revert plot colors and thresholds to default?`)
                            if (!confirmed) return;
                            window.localStorage.removeItem(THRESHOLD_VALUE_LOCALSTORAGE_KEY);
                        }}
                    >
                        Reset Threshold Values
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


        <SimpleAnalyteTable
            showAnalytes={showAnalytes}
            analytes={analytes}
            siteName={siteName}
            bmpName={bmpName}
            setActiveAnalytes={setActiveAnalytes}
        />


        <div id="index-comparison-chart" className="mt-5">
            <div class="chart-label" style={{ textAlign: 'center', fontSize: '20px' }}>Ranksum vs AHP Comparison plot</div>
            {/* <IndexComparisonChart plotData={plotData.filter((d) => ((d.sitename == siteName) & (d.bmpname == bmpName)))} ahpColor={ahpColor} ranksumColor={ranksumColor} /> */}
        </div>
    </div>)
}

export default ThreshCompUI;