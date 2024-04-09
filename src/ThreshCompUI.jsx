import React, { useState, useEffect } from 'react';
import Modal from 'react-modal'

// Component imports
import IndexComparisonChart from './components/IndexComparisonChart'
import { SimpleAnalyteTable } from './components/AnalyteTable';
import ThreshSelector from './components/ThreshSelector';
import ThreshComparisonChart from './components/ThreshComparisonChart';

// Custom Hooks
import useLocalStorage from './hooks/useLocalStorage';


// Styles
import './styles/generic.css'
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

function ThreshCompUI({ siteName, bmpName, displaySetting = 'block', loaderGifRoute = 'loader' }) {

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

    const [plotData, setPlotData] = useLocalStorage('bmpThreshComparisonPlotData', []);



    const [isLoading, setIsLoading] = useState(false);
    // Preload the loading image when the component mounts
    useEffect(() => {
        const img = new Image();
        img.src = loaderGifRoute;
    }, [loaderGifRoute]); // Depend on imageUrl to reload if the URL changes


    // Fetch Analytes when a BMP name is selected
    useEffect(() => {
        if (!siteName || !bmpName) return;
        fetch(`analytes?sitename=${encodeURIComponent(siteName)}&bmpname=${encodeURIComponent(bmpName)}`) // Your API endpoint for fetching analytes
            .then((response) => response.json())
            .then((data) => {
                // start off all analytes as active
                setAnalytes((a) => data.analytes.map(d => { return {...d, isActive: true } } ));
            });
    }, [siteName, bmpName]);


    function updatePlotData() {

        const activeAnalytes = analytes.filter(a => a.isActive);

        if (activeAnalytes.length < 2) {
            alert("Mashup score cannot be calculated with less than 2 parameters")
            return;
        }

        if (new Set(threshVals.map(v => v.percentile)).size !== threshVals.length) {
            const conf = confirm("There are duplicated threshold values in your selections which may cause unexpected behavior. Do you wish to proceed?");
            if (!conf) return;
        }

        const consecutiveRankings = ((activeAnalytes.map((a) => a.rank).reduce((prev, cur) => prev + cur, 0)) === (activeAnalytes.length * (activeAnalytes.length + 1) * 0.5));

        if (!consecutiveRankings) {
            const confirmed = confirm("Priority ranking values are not consecutive integers, which may produce unexpected results. Do you wish to proceed?")
            if (!confirmed) return;
        }

        setIsLoading(true);
        fetch('thresh-comparison-data', { // the threshcomparison route is to be created later
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sitename: siteName,
                bmpname: bmpName,
                analytes: activeAnalytes,
                thresholds: threshVals // should simply return a list of threshold percentile values
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
            .then(data => {
                setPlotData(d => [...d, ...data])
            })
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
            })
            .finally(() => setIsLoading(false));
    }


    return (<div className="container my-1" style={{ display: displaySetting }}>
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
            siteName={siteName}
            bmpName={bmpName}
            analytes={analytes}
            setAnalytes={setAnalytes}
        />


        <div id="thresh-comparison-chart" className="mt-5">
            <div class="chart-area-label mb-5" style={{ textAlign: 'center', fontSize: '20px' }}>Threshold Comparison Plots (simulating mashup scores for high/low performing BMPs)</div>
            <div className="row">
                <div className="col-6">
                    <ThreshComparisonChart 
                        plotData={plotData.filter((d) => ((d.sitename == siteName) & (d.bmpname == bmpName)))} 
                        scoreProperty="ahp_mashup_score" 
                        colorProperty="threshold_color" 
                        xAxisLabelText = 'AHP Score'
                        title = 'AHP'
                        />
                </div>
                <div className="col-6">
                    <ThreshComparisonChart 
                        plotData={plotData.filter((d) => ((d.sitename == siteName) & (d.bmpname == bmpName)))} 
                        scoreProperty="ranksum_mashup_score" 
                        colorProperty="threshold_color" 
                        xAxisLabelText = 'Ranksum Score'
                        title = 'Ranksum'
                    />
                </div>
            </div>
        </div>
        
        {/* Loader GIF Modal Window */}
        <Modal
            isOpen={isLoading}
            style={{
                content: {
                    top: '50%',
                    left: '50%',
                    right: 'auto',
                    bottom: 'auto',
                    marginRight: '-50%',
                    transform: 'translate(-50%, -50%)',
                    border: 'none', // Optionally remove the border
                    background: 'transparent', // Optionally make the background transparent
                    overflow: 'hidden', // Hide overflow
                },
                overlay: {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
                },
            }}
            ariaHideApp={false} // Add this to avoid warning for apps not mounted on the root
            contentLabel="Loading"
        >
            <img src={loaderGifRoute} alt="Loading..." height={250} width={250} />
        </Modal>
    </div>)
}

export default ThreshCompUI;