import React, { useState, useEffect } from 'react';

// Component Imports
import AHPRankSumCompUI from './AHPRankSumCompUI';
import DropdownSelector from './components/DropdownSelector';



// Styles
import './styles/generic.css'
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import ThreshCompUI from './ThreshCompUI';


function App() {

    const [activeUI, setActiveUI] = useState('ahp');

    const [siteNames, setSiteNames] = useState([]);
    const [selectedSiteName, setSelectedSiteName] = useState('');
    const [bmpNames, setBmpNames] = useState([]);
    const [selectedBmpName, setSelectedBmpName] = useState('');



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




    return (
        <>
            <div className="container mt-4 mb-1">
                <h2 className="mb-5">BMP Mashup Performance Index Comparison Tool</h2>
                <div className="row mt-4 mb-5">
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
                {/* Radio buttons for toggling UI components */}
                <div className="mb-3">
                    <div className="form-check form-check-inline">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="uiOptions"
                            id="ahpUI"
                            value="ahp"
                            checked={activeUI === 'ahp'}
                            onChange={(e) => setActiveUI(e.target.value)}
                        />
                        <label className="form-check-label" htmlFor="ahpUI">
                            AHP Rank Sum Comparison
                        </label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="uiOptions"
                            id="threshUI"
                            value="thresh"
                            checked={activeUI === 'thresh'}
                            onChange={(e) => setActiveUI(e.target.value)}
                        />
                        <label className="form-check-label" htmlFor="threshUI">
                            Threshold Comparison
                        </label>
                    </div>
                </div>
            </div>




            {/* Ternary operation to conditionally render UI based on activeUI state */}
            {/* Doing it this way makes it so both components render, but only one is displayed. This prevents them from re rendering when they toggle between the two */}

            <AHPRankSumCompUI siteName={selectedSiteName} bmpName={selectedBmpName} displaySetting={activeUI === 'ahp' ? 'block' : 'none'}/>

            <ThreshCompUI siteName={selectedSiteName} bmpName={selectedBmpName} displaySetting={activeUI === 'ahp' ? 'none' : 'block'}/>




        </>
    );
}

export default App;
