import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';

function App() {
    // State management
    const [siteName, setSiteName] = useState('');
    const [bmpName, setBmpName] = useState('');
    const [calcMethod, setCalcMethod] = useState('ahp');
    const [color, setColor] = useState('#0000FF');
    const [showAnalytes, setShowAnalytes] = useState(true);

    const [siteNames, setSiteNames] = useState([]);
    const [selectedSiteName, setSelectedSiteName] = useState('');
    const [bmpNames, setBmpNames] = useState([]);
    const [selectedBmpName, setSelectedBmpName] = useState('');
    const [analytes, setAnalytes] = useState([]);

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
        <div className="container">
            <div id="select-option-container">
                {/* Site Name Selector */}
                <label htmlFor="sitename-select">Site Name</label>
                <select value={selectedSiteName} onChange={(e) => setSelectedSiteName(e.target.value)}>
                    {siteNames.map((name) => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>


                <br />

                {/* BMP Name Selector */}
                <label htmlFor="bmp-select">BMP Name</label>
                <select value={selectedBmpName} onChange={(e) => setSelectedBmpName(e.target.value)}>
                    {bmpNames.map((name) => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>
                <br />

                {/* Mashup Index Calculation Method */}
                <div className="mt-3">
                    <p>Select a Mashup Index calculation method:</p>
                    <div className="d-flex align-items-center">
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="radio"
                                id="ahp"
                                name="mashup-index-method"
                                value="ahp"
                                checked={calcMethod === 'ahp'}
                                onChange={(e) => setCalcMethod(e.target.value)}
                            />
                            <label className="form-check-label" htmlFor="ahp">AHP</label>
                        </div>
                        <div className="form-check ms-3">
                            <input
                                className="form-check-input"
                                type="radio"
                                id="ranksum"
                                name="mashup-index-method"
                                value="ranksum"
                                checked={calcMethod === 'ranksum'}
                                onChange={(e) => setCalcMethod(e.target.value)}
                            />
                            <label className="form-check-label" htmlFor="ranksum">Rank Sum</label>
                        </div>
                    </div>
                </div>

                {/* Color Picker */}
                <div className="mt-3">
                    <label htmlFor="color-picker">Choose a color for the graph dots:</label>
                    <input
                        type="color"
                        id="color-picker"
                        name="color-picker"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                    />
                </div>

                {/* Show/Hide Analytes */}
                <div className="row mt-3">
                    <div className="col-4">
                        <input
                            type="checkbox"
                            id="show-analytes"
                            checked={showAnalytes}
                            onChange={(e) => setShowAnalytes(e.target.checked)}
                        />
                        <label htmlFor="show-analytes">Show/Hide list of analytes</label>
                    </div>
                    {/* Buttons for adding data to chart and clearing chart would go here */}
                </div>
            </div>

            <div>
                {analytes.map((analyte, index) => (
                    <div key={index} className="row analyte-row">
                        <div className="col-1">
                            <input type="checkbox" checked={analyte.isChecked} onChange={() => handleCheckboxChange(index)} />
                        </div>
                        <div className="col-3">{analyte.name}</div>
                        <div className="col-3">{analyte.threshold}</div>
                        <div className="col-2">{analyte.unit}</div>
                        <div className="col-3">{analyte.ranking}</div>
                    </div>
                ))}
            </div>


            {/* Chart Container */}
            <div className="container">
                <div id="chart"></div>
                {/* D3 integration would go here */}
            </div>
        </div>
    );
}

export default App;
