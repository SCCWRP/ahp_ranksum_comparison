import React, { useState, useEffect } from 'react';

// Component Imports
import AHPRankSumCompUI from './AHPRankSumCompUI';
import DropdownSelector from './components/DropdownSelector';



// Styles
import './styles/generic.css'
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';


function App() {
    

    const [siteNames, setSiteNames] = useState([]);
    const [selectedSiteName, setSelectedSiteName] = useState('');
    const [bmpNames, setBmpNames] = useState([]);
    const [selectedBmpName, setSelectedBmpName] = useState('');
    const [analytes, setAnalytes] = useState([]);
    const [activeAnalytes, setActiveAnalytes] = useState([]);


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
        <>
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
            </div>
            {
                selectedSiteName && selectedBmpName &&
                <AHPRankSumCompUI siteName={selectedSiteName} bmpName={selectedBmpName} analytes={analytes} activeAnalytes={activeAnalytes} setActiveAnalytes={setActiveAnalytes} />
            }
        
        </>
    );
}

export default App;
