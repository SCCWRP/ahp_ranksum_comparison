import React, { useState, useEffect } from "react";
import '../styles/generic.css'
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css'

function AnalyteRow({ siteName, bmpName, analytename, initialThreshPercentile = 0.25, unit, initialRank, universalThreshPercentile = 0.25}) {
    const [isEnabled, setIsEnabled] = useState(true);
    const [rank, setRank] = useState(initialRank);
    const [threshPercentile, setThreshPercentile] = useState(initialThreshPercentile);
    const [threshVal, setThreshVal] = useState(1);

    // Flags to determine if the update was user-initiated
    const [userUpdatedPercentile, setUserUpdatedPercentile] = useState(false);
    const [userUpdatedThreshVal, setUserUpdatedThreshVal] = useState(false);


    function handleCheckboxChange() {
        setIsEnabled(!isEnabled); // Toggle the enabled/disabled state
    }

    useEffect(() => {
        // Only update if there's no user-made change detected; you might need additional logic to track this
        setThreshPercentile(universalThreshPercentile);
        setUserUpdatedPercentile(true);
    }, [universalThreshPercentile]);
    

    // Fetch threshvalue
    useEffect(() => {
        fetch(`threshval?sitename=${encodeURIComponent(siteName)}&bmpname=${encodeURIComponent(bmpName)}&analyte=${encodeURIComponent(analytename)}&percentile=${encodeURIComponent(threshPercentile)}`) // Your API endpoint for fetching site names
            .then((response) => response.json())
            .then((data) => {
                console.log(data)
                setThreshVal((t) => Math.round(data.threshval * 100) / 100)
            });
    }, []);

    // Fetch threshvalue
    useEffect(() => {
        fetch(`percentileval?sitename=${encodeURIComponent(siteName)}&bmpname=${encodeURIComponent(bmpName)}&analyte=${encodeURIComponent(analytename)}&threshval=${encodeURIComponent(threshVal)}`) // Your API endpoint for fetching site names
            .then((response) => response.json())
            .then((data) => {
                console.log(data)
            });
    }, []);



    // Fetch threshval when threshPercentile changes
    useEffect(() => {
        if (userUpdatedPercentile) {
            const fetchThreshVal = async () => {
                try {
                    const response = await fetch(`threshval?sitename=${encodeURIComponent(siteName)}&bmpname=${encodeURIComponent(bmpName)}&analyte=${encodeURIComponent(analytename)}&percentile=${encodeURIComponent(threshPercentile)}`);
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    const data = await response.json();
                    console.log(data);
                    setThreshVal(Math.round(data.threshval * 100) / 100);
                    // Reset the flag after fetching
                    setUserUpdatedPercentile(false);
                } catch (error) {
                    console.error('Error fetching threshold value:', error);
                }
            };
            fetchThreshVal();
        }
    }, [threshPercentile, siteName, bmpName, analytename, userUpdatedPercentile]);

    // Fetch threshPercentile when threshVal changes
    useEffect(() => {
        if (userUpdatedThreshVal) {
            const fetchThreshPercentile = async () => {
                try {
                    const response = await fetch(`percentileval?sitename=${encodeURIComponent(siteName)}&bmpname=${encodeURIComponent(bmpName)}&analyte=${encodeURIComponent(analytename)}&threshval=${encodeURIComponent(threshVal)}`);
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    const data = await response.json();
                    console.log(data);
                    setThreshPercentile(Math.round(data.percentile_rank * 100) / 100);
                    // Reset the flag after fetching
                    setUserUpdatedThreshVal(false);
                } catch (error) {
                    console.error('Error fetching percentile:', error);
                }
            };
            fetchThreshPercentile();
        }
    }, [threshVal, siteName, bmpName, analytename, userUpdatedThreshVal]);

    return (
        <tr style={{ opacity: isEnabled ? 1 : 0.5 }}>
            <td>
                <input type="checkbox" checked={isEnabled} onChange={handleCheckboxChange} />
            </td>
            <td>{analytename}</td>
            <td>
                <input type="number" className="form-control" value={threshPercentile}
                    onChange={(e) => { setThreshPercentile(Number(e.target.value)); setUserUpdatedPercentile(true); }}
                    step="0.01" min="0" max="1" />
            </td>
            <td>
                <input type="number" className="form-control" value={threshVal}
                    onChange={(e) => { setThreshVal(Number(e.target.value)); setUserUpdatedThreshVal(true); }} />
            </td>
            <td>{unit}</td>
            <td>
                <input type="number" className="form-control" value={rank}
                    onChange={(e) => setRank(Number(e.target.value))} />
            </td>
        </tr>
    );
}

export default AnalyteRow;
