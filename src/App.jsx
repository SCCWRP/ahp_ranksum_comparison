import React, { useState, useEffect } from 'react';

// Component Imports
import ColorPicker from './components/ColorPicker';
import AnalyteTable from './components/AnalyteTable';
import DropdownSelector from './components/DropdownSelector';
import IndexComparisonChart from './components/IndexComparisonChart'

// Custom Hooks
import useLocalStorage from './hooks/useLocalStorage';

// Styles
import './styles/generic.css'
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';


function App() {
    // State management
    const [ahpColor, setAhpColor] = useState('#00FF00');
    const [ranksumColor, setRanksumColor] = useState('#0000FF');
    const [threshColor, setThreshColor] = useState('#000000');
    const [showAnalytes, setShowAnalytes] = useState(true);

    const [siteNames, setSiteNames] = useState([]);
    const [selectedSiteName, setSelectedSiteName] = useState('');
    const [bmpNames, setBmpNames] = useState([]);
    const [selectedBmpName, setSelectedBmpName] = useState('');
    const [analytes, setAnalytes] = useState([]);

    const [activeAnalytes, setActiveAnalytes] = useState([]);
    const [plotData, setPlotData] = useLocalStorage('bmpIndexComparisonPlotData', []);


    const [universalThreshPercentile, setUniversalThreshPercentile] = useState(0.25);

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
                sitename: selectedSiteName,
                bmpname: selectedBmpName,
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




    // Fetch Site Names
    useEffect(() => {
        fetch('sitenames') // Your API endpoint for fetching site names
            .then((response) => response.json())
            .then((data) => {
                setSiteNames(data.sitenames);
                // Automatically select the first site name (if available)
                if (data.sitenames.length > 0) {
                    setSelectedSiteName(data.sitenames[0]);
                }
            });
    }, []);

    // Fetch BMP Names when a site name is selected
    useEffect(() => {
        if (!selectedSiteName) return;
        fetch(`bmpnames?sitename=${encodeURIComponent(selectedSiteName)}`) // Your API endpoint for fetching BMP names
            .then((response) => response.json())
            .then((data) => {
                setBmpNames(data.bmpnames);
                // Automatically select the first BMP name (if available)
                if (data.bmpnames.length > 0) {
                    setSelectedBmpName(data.bmpnames[0]);
                }
            });
    }, [selectedSiteName]);

    // Fetch Analytes when a BMP name is selected
    useEffect(() => {
        if (!selectedSiteName || !selectedBmpName) return;
        fetch(`analytes?sitename=${encodeURIComponent(selectedSiteName)}&bmpname=${encodeURIComponent(selectedBmpName)}`) // Your API endpoint for fetching analytes
            .then((response) => response.json())
            .then((data) => {
                setAnalytes((a) => data.analytes);
                setActiveAnalytes([]); // reset
            });
    }, [selectedSiteName, selectedBmpName]);


    return (
        <div className="container my-4">
            <h2 className="mb-3">BMP Mashup Performance Index Comparison Tool</h2>
            <div className="row mb-3">
                <div className="col-md-6">
                    <DropdownSelector
                        id="sitename-select"
                        label="Site Name"
                        options={siteNames}
                        selectedValue={selectedSiteName}
                        onChange={(e) => setSelectedSiteName(e.target.value)}
                    />
                </div>

                <div className="col-md-6">
                    <DropdownSelector
                        id="bmp-select"
                        label="BMP Name"
                        options={bmpNames}
                        selectedValue={selectedBmpName}
                        onChange={(e) => setSelectedBmpName(e.target.value)}
                    />
                </div>
            </div>
            <div class="row mb-3">
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

                <div className="col-md-4">
                    <ColorPicker
                        label="Thresh Comparison Color"
                        id="thresh-color-picker"
                        name="thresh-color-picker"
                        color={threshColor}
                        onChange={(e) => setThreshColor(e.target.value)}
                    />
                </div>
            </div>


            <div class="row mb-3 d-flex align-items-end">
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
                                const confirmed = confirm(`Are you sure you want to clear existing data for site ${selectedSiteName} and BMP ${selectedBmpName} ?`)
                                if (!confirmed) return;
                                setPlotData((d) => d.filter(i => ((i.sitename != selectedSiteName) & (i.bmpname != selectedBmpName))))
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
                selectedSiteName={selectedSiteName}
                selectedBmpName={selectedBmpName}
                universalThreshPercentile={universalThreshPercentile}
                setActiveAnalytes={setActiveAnalytes}
            />


            <div id="index-comparison-chart" className="mt-5">
                <div class="chart-label" style={{ textAlign: 'center', fontSize: '20px' }}>Ranksum vs AHP Comparison plot</div>
                <IndexComparisonChart plotData={plotData.filter((d) => ((d.sitename == selectedSiteName) & (d.bmpname == selectedBmpName)))} ahpColor={ahpColor} ranksumColor={ranksumColor} />
            </div>
        </div>
    );
}

export default App;
