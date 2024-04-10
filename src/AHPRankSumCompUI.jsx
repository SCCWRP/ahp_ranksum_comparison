import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';

// Component imports
import IndexComparisonChart from './components/IndexComparisonChart'
import ColorPicker from './components/ColorPicker';
import AnalyteTable from './components/AnalyteTable';
import uniqueIdForDataPoint from './utils/hash';

// Custom Hooks
import useLocalStorage from './hooks/useLocalStorage';

// Styles
import './styles/generic.css'
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

function AHPRankSumCompUI({ siteName, bmpName, displaySetting = 'block', loaderGifRoute = 'loader' }) {

    // State management
    const [ahpColor, setAhpColor] = useState('#00FF00');
    const [ranksumColor, setRanksumColor] = useState('#0000FF');

    const [showAnalytes, setShowAnalytes] = useState(true);
    const [consecutiveAnalytes, setConsecutiveAnalytes] = useState(true);
    const [analytes, setAnalytes] = useState([]);


    const [plotData, setPlotData] = useLocalStorage('bmpIndexComparisonPlotData', []);

    const [universalThreshPercentile, setUniversalThreshPercentile] = useState(0.25);

    const [isLoading, setIsLoading] = useState(false);


    // Fetch Analytes when a BMP name is selected
    useEffect(() => {
        if (!siteName || !bmpName) return;
        fetch(`analytes?sitename=${encodeURIComponent(siteName)}&bmpname=${encodeURIComponent(bmpName)}`) // Your API endpoint for fetching analytes
            .then((response) => response.json())
            .then((data) => {
                setAnalytes((a) => data.analytes.map((a, i) => { return { ...a, isActive: true, rank: i + 1 } }));
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

        const consecutiveRankings = ((activeAnalytes.map((a) => a.rank).reduce((prev, cur) => prev + cur, 0)) === (activeAnalytes.length * (activeAnalytes.length + 1) * 0.5));

        if (!consecutiveRankings) {
            const confirmed = confirm("Priority ranking values are not consecutive integers, which may produce unexpected results. Do you wish to proceed?")
            if (!confirmed) return;
        }

        fetch('direct-comparison-data', {
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
            .then(data => {
                // Generate a hashId for the incoming data object
                data.hashId = uniqueIdForDataPoint(data);

                setPlotData(existingData => {
                    const existingItemIndex = existingData.findIndex(item => item.hashId === data.hashId);

                    if (existingItemIndex !== -1) {
                        // Ignore the new data and keep existingData as is
                        return existingData;
                    } else {
                        // If no item with the same hashId exists, add the new data object to the array
                        return [...existingData, data];
                    }
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
            }).finally(() => {
                document.getElementById('index-comparison-chart').scrollIntoView();
            });
    }


    return (<div className="container my-1" style={{ display: displaySetting }}>
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


        <AnalyteTable
            showAnalytes={showAnalytes}
            analytes={analytes}
            siteName={siteName}
            bmpName={bmpName}
            universalThreshPercentile={universalThreshPercentile}
            consecutiveAnalytes={consecutiveAnalytes}
            setAnalytes={setAnalytes}
        />

        <div class="row my-5 d-flex align-items-end">
            <div className="col-4 form-check d-flex flex-column">
                <div className="mt-auto">
                    <button
                        id="download-current-data-btn"
                        className="btn btn-primary"
                        onClick={(e) => {
                            setIsLoading(true);
                            fetch(`rawdata?sitename=${encodeURIComponent(siteName)}`)
                                .then(async response => {
                                    if (!response.ok) {
                                        try {
                                            // Attempt to parse the JSON response
                                            const err = await response.json();
                                            // Log the detailed error message from the response
                                            console.error('Error from server:', err.error, err.message);
                                            // Throw a new error that includes the server's error message for further handling
                                            throw new Error(`Error from server: ${err.error} - ${err.message}`);
                                        } catch (parseError) {
                                            // Handle cases where the error response is not JSON or cannot be parsed
                                            console.error('Error parsing server response:', parseError);
                                            throw new Error('An unexpected error occurred');
                                        }
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
                                    console.error('There was a problem with the fetch operation:', error.message);
                                    alert('Failed to download the data. Please try again.'); // Example of user notification
                                })
                                .finally(() => setIsLoading(false));
                        }}

                    >
                        Download Raw Data for {siteName}
                    </button>
                </div>
            </div>
            <div className="col-4 form-check d-flex flex-column">
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
                                        // If the response is not ok, throw an error
                                        throw new Error(`HTTP error! Status: ${response.status}`);
                                    }
                                    return response.blob(); // Proceed to process the response as a blob if it is ok
                                })
                                .then(blob => {
                                    // Create a new object URL for the blob
                                    const fileUrl = window.URL.createObjectURL(blob);

                                    // Create a new anchor element and trigger a download
                                    const a = document.createElement('a');
                                    a.href = fileUrl;
                                    a.download = `${siteName} Plot Data.xlsx`; // Name of the downloaded file
                                    document.body.appendChild(a);
                                    a.click();

                                    document.body.removeChild(a);
                                    window.URL.revokeObjectURL(fileUrl); // Clean up
                                })
                                .catch(error => {
                                    // Handle any errors that occurred during the fetch or while processing the response
                                    console.error('Fetch error:', error.message);
                                    alert('An error occurred while downloading the file. Please try again.'); // Notify the user
                                })
                                .finally(() => {
                                    // This will run regardless of the previous operations succeeding or failing
                                    setIsLoading(false);
                                });

                        }}
                    >
                        Download Plot Data for {siteName}
                    </button>
                </div>
            </div>
            <div className="col-4 form-check d-flex flex-column">
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
                                    // First, check if the response is ok (status in the range 200-299)
                                    if (!response.ok) {
                                        // If the response is not ok, throw an error
                                        throw new Error(`HTTP error! Status: ${response.status}`);
                                    }
                                    return response.blob(); // Proceed to process the response as a blob if it is ok
                                })
                                .then(blob => {
                                    // Create a new object URL for the blob
                                    const fileUrl = window.URL.createObjectURL(blob);

                                    // Create a new anchor element and trigger a download
                                    const a = document.createElement('a');
                                    a.href = fileUrl;
                                    a.download = 'AHP_Ranksum_Direct_Comparison_All_Sites.xlsx'; // Name of the downloaded file
                                    document.body.appendChild(a);
                                    a.click();

                                    document.body.removeChild(a);
                                    window.URL.revokeObjectURL(fileUrl); // Clean up
                                })
                                .catch(error => {
                                    // Handle any errors that occurred during the fetch or while processing the response
                                    console.error('Fetch error:', error.message);
                                    alert('An error occurred while downloading the file. Please try again.'); // Notify the user
                                })
                                .finally(() => {
                                    setIsLoading(false);
                                });
                        }}
                    >
                        Download Plot data for all sites
                    </button>
                </div>
            </div>
        </div>

        <div id="index-comparison-chart" className="mt-5">
            <div class="chart-label" style={{ textAlign: 'center', fontSize: '20px' }}>Ranksum vs AHP Comparison plot</div>
            <IndexComparisonChart plotData={plotData.filter((d) => ((d.sitename == siteName) & (d.bmpname == bmpName)))} ahpColor={ahpColor} ranksumColor={ranksumColor} />
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

export default AHPRankSumCompUI;