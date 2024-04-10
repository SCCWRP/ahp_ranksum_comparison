import React, { useState, useEffect } from "react";
import '../styles/generic.css'
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css'

function AnalyteRow({ siteName, bmpName, analytename , unit, rank, isEnabled, consecutiveAnalytes, setAnalytes, initialThreshPercentile = 0.25, universalThreshPercentile = 0.25 }) {
    const [threshPercentile, setThreshPercentile] = useState(initialThreshPercentile);
    const [threshVal, setThreshVal] = useState(1);

    // Flags to determine if the update was user-initiated
    const [userUpdatedPercentile, setUserUpdatedPercentile] = useState(false);
    const [userUpdatedThreshVal, setUserUpdatedThreshVal] = useState(false);


    // Inside AnalyteRow component

    function handleCheckboxChange(e) {
        const isChecked = e.target.checked;
    
        // Step 1: Update isActive for the changed analyte
        setAnalytes(prev =>
            prev.map(a =>
                a.analytename === analytename ? { ...a, isActive: isChecked } : a
            )
        );
    
        // Step 2: Adjust the rankings in a separate operation to keep logic clear
        setAnalytes(prev => {
            // Filter active analytes and sort them by their current rank to maintain order
            const activeAnalytes = prev.filter(a => a.isActive).sort((a, b) => a.rank - b.rank);
    
            // Assign new consecutive ranks to active analytes
            activeAnalytes.forEach((a, index) => {
                a.rank = index + 1;
            });
    
            // Merge back with inactive analytes and sort by name or another stable property to maintain list order
            return [...activeAnalytes, ...prev.filter(a => !a.isActive)].sort((a, b) => a.analytename.localeCompare(b.analytename));
        });
    }


    useEffect(() => {
        // Update the matching analyte in the activeAnalytes array
        setAnalytes(prev => prev.map(analyte =>
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
        if (siteName && bmpName) {
            fetch(`threshval?sitename=${encodeURIComponent(siteName)}&bmpname=${encodeURIComponent(bmpName)}&analyte=${encodeURIComponent(analytename)}&percentile=${encodeURIComponent(threshPercentile)}`) // Your API endpoint for fetching site names
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
                .then(data => setThreshVal((t) => Math.round(data.threshval * 100) / 100))
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
        setAnalytes(prev => prev.map(analyte =>
            analyte.analytename == analytename
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
                    onChange={(e) => {
                        const newRank = Number(e.target.value) == 0 ? '' : Number(e.target.value); 


                        setAnalytes(prev => {
                            const updatedAnalytes = [...prev]; // Clone the array to avoid direct mutation
                            const currentAnalyteIndex = updatedAnalytes.findIndex(a => a.analytename === analytename);
                            const currentAnalyte = updatedAnalytes[currentAnalyteIndex];
                            const oldRank = currentAnalyte.rank;

                            if (!consecutiveAnalytes) {
                                return prev.map(analyte => analyte.analytename == analytename ? {...analyte, rank: newRank} : analyte)
                            }
                    
                            if (newRank === oldRank) {
                                // No rank change, just return the original array
                                return prev;
                            }
                    
                            // Adjust ranks
                            updatedAnalytes.forEach(analyte => {
                                if (analyte.isActive) {
                                    if (newRank > oldRank) {
                                        // Moving down in the list (increasing rank number)
                                        if (analyte.rank > oldRank && analyte.rank <= newRank) {
                                            analyte.rank--;
                                        }
                                    } else {
                                        // Moving up in the list (decreasing rank number)
                                        if (analyte.rank < oldRank && analyte.rank >= newRank) {
                                            analyte.rank++;
                                        }
                                    }
                                }
                            });
                    
                            // Finally, update the rank of the current analyte
                            currentAnalyte.rank = newRank;
                    
                            // Re-sort based on the original positions to maintain visual order
                            return updatedAnalytes.sort((a, b) => prev.findIndex(item => item.analytename === a.analytename) - prev.findIndex(item => item.analytename === b.analytename));
                        });
                    }} 
                />
            </td>
        </tr>
    );
}

export default AnalyteRow;



export function SimpleAnalyteRow({analytename, unit, rank, isEnabled, consecutiveAnalytes, setAnalytes }) {

    // Inside AnalyteRow component

    function handleCheckboxChange(e) {
        const isChecked = e.target.checked;
    
        // Step 1: Update isActive for the changed analyte
        setAnalytes(prev =>
            prev.map(a =>
                a.analytename === analytename ? { ...a, isActive: isChecked } : a
            )
        );
    
        // Step 2: Adjust the rankings in a separate operation to keep logic clear
        setAnalytes(prev => {
            // Filter active analytes and sort them by their current rank to maintain order
            const activeAnalytes = prev.filter(a => a.isActive).sort((a, b) => a.rank - b.rank);
    
            // Assign new consecutive ranks to active analytes
            activeAnalytes.forEach((a, index) => {
                a.rank = index + 1;
            });
    
            // Merge back with inactive analytes and sort by name or another stable property to maintain list order
            return [...activeAnalytes, ...prev.filter(a => !a.isActive)].sort((a, b) => a.analytename.localeCompare(b.analytename));
        });
    }
    

    return (
        <tr style={{ opacity: isEnabled ? 1 : 0.5 }}>
            <td>
                <input type="checkbox" checked={isEnabled} onChange={handleCheckboxChange} />
            </td>
            <td>{analytename}</td>
            <td>{unit}</td>
            <td>
                <input type="number" className="form-control" value={rank}
                    onChange={(e) => {
                        const newRank = Number(e.target.value) == 0 ? '' : Number(e.target.value); 

                        
                        setAnalytes(prev => {
                            const updatedAnalytes = [...prev]; // Clone the array to avoid direct mutation
                            const currentAnalyteIndex = updatedAnalytes.findIndex(a => a.analytename === analytename);
                            const currentAnalyte = updatedAnalytes[currentAnalyteIndex];
                            const oldRank = currentAnalyte.rank;
                            
                            if (!consecutiveAnalytes) {
                                return prev.map(analyte => analyte.analytename == analytename ? {...analyte, rank: newRank} : analyte)
                            }
                    
                            if (newRank === oldRank) {
                                // No rank change, just return the original array
                                return prev;
                            }
                    
                            // Adjust ranks
                            updatedAnalytes.forEach(analyte => {
                                if (analyte.isActive) {
                                    if (newRank > oldRank) {
                                        // Moving down in the list (increasing rank number)
                                        if (analyte.rank > oldRank && analyte.rank <= newRank) {
                                            analyte.rank--;
                                        }
                                    } else {
                                        // Moving up in the list (decreasing rank number)
                                        if (analyte.rank < oldRank && analyte.rank >= newRank) {
                                            analyte.rank++;
                                        }
                                    }
                                }
                            });
                    
                            // Finally, update the rank of the current analyte
                            currentAnalyte.rank = newRank;
                    
                            // Re-sort based on the original positions to maintain visual order
                            return updatedAnalytes.sort((a, b) => prev.findIndex(item => item.analytename === a.analytename) - prev.findIndex(item => item.analytename === b.analytename));
                        });
                    }}
                    
                />
            </td>
        </tr>
    );
}
