import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';

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
import uniqueIdForDataPoint from './utils/hash';

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
    const [consecutiveAnalytes, setConsecutiveAnalytes] = useState(true);
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
                setAnalytes((a) => data.analytes.map((d, i) => { return { ...d, isActive: true, rank: (i + 1) } }));
            });
    }, [siteName, bmpName]);


    function updatePlotData() {

        const activeAnalytes = analytes.filter(a => a.isActive);

        // ranking must be integers
        if (
            !activeAnalytes.map((a) => {
                return a.rank;
            }).every(val => typeof val === 'number')
        ) {
            alert("Ranking values must be integers");
            return;
        }

        // ranking must be positive integers
        if (
            !activeAnalytes.map((a) => {
                return a.rank;
            }).every(val => val > 0)
        ) {
            alert("Ranking values must be integers > 0");
            return;
        }


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
                // First, assign a hashId to each data object in the array
                const newData = data.map(d => ({
                    ...d,
                    hashId: uniqueIdForDataPoint(d)
                }));
            
                setPlotData(existingData => {
                    let existingDataClone = [...existingData];

                    newData.forEach(d => {

                        const existingItemIndex = existingData.findIndex(item => item.hashId === d.hashId);
                        
                        if (existingItemIndex === -1) {
                            // If no item with the same hashId exists, add the new data object to the array
                            existingDataClone = [...existingDataClone, d];
                        }
                    })

                    return existingDataClone;
                });
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
            .finally(() => {
                setIsLoading(false);
                document.getElementById('thresh-comparison-chart').querySelector('svg').scrollIntoView();
            });
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
            {plotData.filter(d => d.sitename == siteName).length > 0 &&
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
            }
            {plotData.length > 0 &&
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
            }

        </div>

        <div class="row mt-5 mb-3">
            <div className="col-3">
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
            <div className="col-4">
                <div className="form-check">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id="maintain-consecutive-thresh-analytes"
                        checked={consecutiveAnalytes}
                        onChange={(e) => setConsecutiveAnalytes(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="maintain-consecutive-thresh-analytes">
                        Maintain Consecutive Order for Analyte Ranking
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
            consecutiveAnalytes={consecutiveAnalytes}
        />


        <div class="row my-5 d-flex align-items-start">
            <div className="col-4 d-flex flex-column">
                <div className="mt-auto">
                    <button
                        id="download-current-data-btn"
                        className="btn btn-primary"
                        onClick={(e) => {
                            setIsLoading(true);
                            fetch(`rawdata?sitename=${encodeURIComponent(siteName)}`)
                                .then(response => {
                                    if (!response.ok) {
                                        // If the response status code is not in the 200-299 range
                                        // Throw an error and catch it later in the chain
                                        throw new Error('Network response was not ok');
                                    }
                                    return response.blob();
                                })
                                .then(blob => {
                                    // Create a new object URL for the blob
                                    const fileUrl = window.URL.createObjectURL(blob);

                                    // Create a new anchor element and trigger a download
                                    const a = document.createElement('a');
                                    a.href = fileUrl;
                                    a.download = `${siteName} Raw Data.xlsx`; // Name of the downloaded file
                                    document.body.appendChild(a);
                                    a.click();

                                    document.body.removeChild(a);
                                    window.URL.revokeObjectURL(fileUrl); // Clean up
                                })
                                .catch(error => {
                                    // Log the error or display an alert/message to the user
                                    console.error('There was a problem with the fetch operation:', error);
                                    alert('Failed to download the data. Please try again.'); // Example of user notification
                                })
                                .finally(() => setIsLoading(false));
                        }}

                    >
                        Download Raw Data for {siteName}
                    </button>
                </div>
            </div>
            <div className="col-4 d-flex flex-column">
                <div className="mt-auto">
                    <button
                        id="download-current-data-btn"
                        className="btn btn-primary"
                        onClick={(e) => {

                            const currentSitePlotData = plotData.filter(i => ((i.sitename == siteName))).map(d => {
                                return d.analytes.map(({ isActive, ...rest }) => {
                                    return {
                                        sitename: d.sitename,
                                        bmpname: d.bmpname,
                                        analytename: rest.analytename,
                                        individual_score: rest.individual_score,
                                        rank: rest.rank,
                                        threshold_value: rest.threshold_value,
                                        threshold_percentile: d.thresh_percentile,
                                        unit: rest.unit,
                                        ahp_weight: rest.ahp_weight,
                                        ranksum_weight: rest.ranksum_weight,
                                        ahp_mashup_score: d.ahp_mashup_score,
                                        ranksum_mashup_score: d.ranksum_mashup_score,
                                        number_of_events: rest.number_of_events,
                                        n_params: d.n_params
                                    }
                                })
                            }).flat()

                            setIsLoading(true);
                            fetch('json-to-excel', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(currentSitePlotData)
                            })
                                .then(response => {
                                    // First, check if the response is ok (status in the range 200-299)
                                    if (!response.ok) {
                                        // If response is not ok, we throw an error that includes the status
                                        throw new Error(`HTTP error! status: ${response.status}`);
                                    }
                                    // If the response is ok, proceed to process the blob
                                    return response.blob();
                                })
                                .then(blob => {
                                    // Process the blob here
                                    const fileUrl = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = fileUrl;
                                    a.download = `${siteName} Threshold Comparison Plot Data.xlsx`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    window.URL.revokeObjectURL(fileUrl);
                                })
                                .catch(error => {
                                    // Handle any errors that occurred during the fetch or processing
                                    console.error('Fetch error:', error.message);
                                    alert('An error occurred while downloading the file. Please try again.'); // Notify the user of the error in an appropriate way for your application
                                })
                                .finally(() => {
                                    // This will always run, regardless of whether the fetch was successful or not
                                    setIsLoading(false);
                                });

                        }}
                    >
                        Download Plot Data for {siteName}
                    </button>
                </div>
            </div>
            <div className="col-4 d-flex flex-column">
                <div className="mt-auto">
                    <button
                        id="download-all-data-btn"
                        className="btn btn-primary"
                        onClick={(e) => {

                            const allSitesPlotData = plotData.map(d => {
                                return d.analytes.map(({ isActive, ...rest }) => {
                                    return {
                                        sitename: d.sitename,
                                        bmpname: d.bmpname,
                                        analytename: rest.analytename,
                                        individual_score: rest.individual_score,
                                        rank: rest.rank,
                                        threshold_value: rest.threshold_value,
                                        threshold_percentile: d.thresh_percentile,
                                        unit: rest.unit,
                                        ahp_weight: rest.ahp_weight,
                                        ranksum_weight: rest.ranksum_weight,
                                        ahp_mashup_score: d.ahp_mashup_score,
                                        ranksum_mashup_score: d.ranksum_mashup_score,
                                        number_of_events: rest.number_of_events,
                                        n_params: d.n_params
                                    }
                                })
                            }).flat()

                            setIsLoading(true);
                            fetch('json-to-excel', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(allSitesPlotData)
                            })
                                .then(response => {
                                    if (!response.ok) {
                                        throw new Error("Network response was not ok")
                                    }
                                    return response.blob();
                                })
                                .then(blob => {
                                    // Create a new object URL for the blob
                                    const fileUrl = window.URL.createObjectURL(blob);

                                    // Create a new anchor element and trigger a download
                                    const a = document.createElement('a');
                                    a.href = fileUrl;
                                    a.download = 'Threshold_Comparison_All_Sites.xlsx'; // Name of the downloaded file
                                    document.body.appendChild(a);
                                    a.click();

                                    document.body.removeChild(a);
                                    window.URL.revokeObjectURL(fileUrl); // Clean up
                                })
                                .catch(error => {
                                    console.error("Error fetching Thresh all site comparison data", error);
                                    alert("Data did not download successfully - please try again")
                                })
                                .finally(() => setIsLoading(false))
                        }}
                    >
                        Download Plot data for all sites
                    </button>
                </div>
            </div>
        </div>


        <div id="thresh-comparison-chart" className="mt-5">
            <div class="chart-area-label mb-5" style={{ textAlign: 'center', fontSize: '20px' }}>Threshold Comparison Plots (simulating mashup scores for high/low performing BMPs)</div>
            <div className="row">
                <div className="col-6">
                    <ThreshComparisonChart
                        plotData={plotData.filter((d) => ((d.sitename == siteName) & (d.bmpname == bmpName)))}
                        scoreProperty="ahp_mashup_score"
                        colorProperty="threshold_color"
                        xAxisLabelText='AHP Score'
                        title='AHP'
                    />
                </div>
                <div className="col-6">
                    <ThreshComparisonChart
                        plotData={plotData.filter((d) => ((d.sitename == siteName) & (d.bmpname == bmpName)))}
                        scoreProperty="ranksum_mashup_score"
                        colorProperty="threshold_color"
                        xAxisLabelText='Ranksum Score'
                        title='Ranksum'
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