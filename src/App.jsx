import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import ColorPicker from './components/ColorPicker';
import AnalyteRow from './components/AnalyteRow';
import DropdownSelector from './components/DropdownSelector';
import IndexComparisonChart from './components/IndexComparisonChart'

import useLocalStorage from './hooks/useLocalStorage';

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
        fetch(
            'getdata',
            {
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
            .then(resp => resp.json())
            .then(data => setPlotData( (d) => [...d, data] ))
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
                console.log('analytes')
                console.log(data)
                setAnalytes((a) => data.analytes);
                setActiveAnalytes([]); // reset
            });
    }, [selectedSiteName, selectedBmpName]);


    return (
        <div className="container my-4">
            <h2 className="mb-3">Data Visualization Controls</h2>
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

            <div class="row mb-3">
                <div className="col-3 form-check">
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
                <div className="col-3 form-check">
                    <button
                        id="add-data-btn"
                        className="btn btn-primary"
                        onClick={updatePlotData}
                    >
                        Add data to plots
                    </button>

                </div>
                <div className="col-3 form-check">
                    <button
                        id="delete-current-data-btn"
                        className="btn btn-primary"
                        onClick={(e) => {
                            const confirmed = confirm(`Are you sure you want to clear existing data for site ${selectedSiteName} and BMP ${selectedBmpName} ?`)
                            if (!confirmed) return;
                            setPlotData((d) => d.filter(i => ((i.sitename != selectedSiteName) & (i.firstbmp != selectedBmpName)) ))
                        }}
                    >
                        Clear Plot Data for current site
                    </button>

                </div>
                <div className="col-3 form-check">
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

            {(
                <div className="table-responsive">
                    <table className="table" style={{ display: showAnalytes ? 'table' : 'none' }}>
                        <thead>
                            <tr>
                                <th scope="col"></th> {/* For checkbox without header */}
                                <th scope="col">Analyte Name</th>
                                <th scope="col">Threshold Percentile</th>
                                <th scope="col">Threshold Value</th>
                                <th scope="col">Unit</th>
                                <th scope="col">Ranking</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analytes.map((analyte, index) => (
                                <AnalyteRow
                                    key={index}
                                    siteName={selectedSiteName}
                                    bmpName={selectedBmpName}
                                    analytename={analyte.analytename}
                                    unit={analyte.unit}
                                    initialRank={index + 1}
                                    universalThreshPercentile={universalThreshPercentile}
                                    setActiveAnalytes={setActiveAnalytes} // so the checkbox can affect the active analytes
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div id="index-comparison-chart" className="mt-5">
                <div class="chart-label" style={{textAlign: 'center', fontSize: '20px'}}>Ranksum vs AHP Comparison plot</div>
                <IndexComparisonChart plotData={plotData} ahpColor={ahpColor} ranksumColor={ranksumColor}/>
            </div>
        </div>
    );
}

export default App;
