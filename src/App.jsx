import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import ColorPicker from './components/ColorPicker';
import AnalyteRow from './components/AnalyteRow';
import DropdownSelector from './components/DropdownSelector';

import './styles/generic.css'
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';


function App() {
    // State management
    const [ahpColor, setAhpColor] = useState('#00FF00');
    const [ranksumColor, setRanksumColor] = useState('#0000FF');
    const [showAnalytes, setShowAnalytes] = useState(true);

    const [siteNames, setSiteNames] = useState([]);
    const [selectedSiteName, setSelectedSiteName] = useState('');
    const [bmpNames, setBmpNames] = useState([]);
    const [selectedBmpName, setSelectedBmpName] = useState('');
    const [analytes, setAnalytes] = useState([]);

    const [universalThreshPercentile, setUniversalThreshPercentile] = useState(0.25);


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
                setAnalytes(data.analytes);
            });
    }, [selectedSiteName, selectedBmpName]);

    return (
        <div className="container my-4">
            <h2 className="mb-3">Data Visualization Controls</h2>
            <div className="row">
                <div className="col-md-4 mb-3">
                    <DropdownSelector
                        id="sitename-select"
                        label="Site Name"
                        options={siteNames}
                        selectedValue={selectedSiteName}
                        onChange={(e) => setSelectedSiteName(e.target.value)}
                    />
                </div>

                <div className="col-md-4 mb-3">
                    <DropdownSelector
                        id="bmp-select"
                        label="BMP Name"
                        options={bmpNames}
                        selectedValue={selectedBmpName}
                        onChange={(e) => setSelectedBmpName(e.target.value)}
                    />
                </div>
            </div>
            <div class="row">
                {/* Assume ColorPicker supports Bootstrap styling; otherwise, adapt it */}
                <div className="col-md-4 mb-3">
                    <ColorPicker
                        label="AHP Score Color"
                        id="ahp-color-picker"
                        name="ahp-color-picker"
                        color={ahpColor}
                        onChange={(e) => setAhpColor(e.target.value)}
                    />
                </div>

                <div className="col-md-4 mb-3">
                    <ColorPicker
                        label="Ranksum Score Color"
                        id="ranksum-color-picker"
                        name="ranksum-color-picker"
                        color={ranksumColor}
                        onChange={(e) => setRanksumColor(e.target.value)}
                    />
                </div>
            </div>
            <div class="row">
                <div className="col-12 mb-3">
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

            <div class="row">
                <div className="col-6 mb-3 form-check">
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
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div id="chart" className="mt-5">
                {/* Chart integration remains the same */}
            </div>
        </div>
    );
}

export default App;
