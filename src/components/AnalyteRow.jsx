import React, { useState, useEffect } from "react";
import '../styles/generic.css'
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css'

function AnalyteRow({ siteName, bmpName, analytename, initialThreshPercentile = 0.25, unit, initialRank, universalThreshPercentile = 0.25, setActiveAnalytes }) {
    const [isEnabled, setIsEnabled] = useState(true);
    const [rank, setRank] = useState(initialRank);
    const [threshPercentile, setThreshPercentile] = useState(initialThreshPercentile);
    const [threshVal, setThreshVal] = useState(1);

    // Flags to determine if the update was user-initiated
    const [userUpdatedPercentile, setUserUpdatedPercentile] = useState(false);
    const [userUpdatedThreshVal, setUserUpdatedThreshVal] = useState(false);


    // Inside AnalyteRow component

    function handleCheckboxChange() {
        setIsEnabled(prev => !prev); // Toggle the enabled/disabled state locally

        // Then update the activeAnalytes list in the parent component
        if (isEnabled) {
            // If it was enabled before, now remove it from the active list
            setActiveAnalytes(prev => prev.filter(a => a.analytename !== analytename));
        } else {
            // If it was disabled before, now add it back to the active list
            // You might want to include more data here depending on your needs
            setActiveAnalytes(prev => [...prev, { analytename: analytename, unit: unit, threshold_value: threshVal, rank: rank }]);
        }
    }

    // add to active analytes when the component mounts
    useEffect(() => {
        setActiveAnalytes(prev => [...prev, { analytename: analytename, unit: unit, threshold_value: threshVal, rank: rank }]);
    }, [])


    useEffect(() => {
        // Update the matching analyte in the activeAnalytes array
        setActiveAnalytes(prev => prev.map(analyte =>
            analyte.analytename === analytename
                ? { ...analyte, threshold_value: threshVal, rank: rank }
                : analyte
        ));
    }, [threshVal, rank])




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
                setThreshVal((t) => Math.round(data.threshval * 100) / 100)
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
                    setThreshPercentile(Math.round(data.percentile_rank * 100) / 100);
                    // Reset the flag after fetching
                    setUserUpdatedThreshVal(false);
                } catch (error) {
                    console.error('Error fetching percentile:', error);
                }
            };
            fetchThreshPercentile();
        }

        // Update the matching analyte in the activeAnalytes array
        setActiveAnalytes(prev => prev.map(analyte =>
            analyte.analytename === analytename
                ? { ...analyte, threshold_value: threshVal, rank: rank }
                : analyte
        ));


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
                    onChange={(e) => {setRank(Number(e.target.value));}
                    } />
            </td>
        </tr>
    );
}

export default AnalyteRow;
