import React from 'react';
import AnalyteRow, { SimpleAnalyteRow } from './AnalyteRow'; // Assuming AnalyteRow is your component for rendering each row

const AnalyteTable = ({ showAnalytes, analytes, siteName, bmpName, universalThreshPercentile, consecutiveAnalytes, setAnalytes }) => {
    
    return (
        <div className="table-responsive" style={{ display: showAnalytes ? 'block' : 'none' }}>
            <table className="table">
                <thead>
                    <tr>
                        <th scope="col"></th> {/* For checkbox without header */}
                        <th scope="col">Analyte Name</th>
                        <th scope="col">Threshold Percentile</th>
                        <th scope="col">Threshold Value</th>
                        <th scope="col">Unit</th>
                        <th scope="col">Priority Ranking</th>
                    </tr>
                </thead>
                <tbody>
                    {analytes.map((analyte, index) => (
                        <AnalyteRow
                            key={index}
                            siteName={siteName}
                            bmpName={bmpName}
                            analytename={analyte.analytename}
                            unit={analyte.unit}
                            rank={analyte.rank}
                            isEnabled={analyte.isActive}
                            universalThreshPercentile={universalThreshPercentile}
                            consecutiveAnalytes={consecutiveAnalytes}
                            setAnalytes={setAnalytes} // so the checkbox can affect the active analytes
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};


export default AnalyteTable;


export const SimpleAnalyteTable = ({ showAnalytes, siteName, bmpName, analytes, consecutiveAnalytes, setAnalytes }) => {
    
    return (
        <div className="table-responsive" style={{ display: showAnalytes ? 'block' : 'none' }}>
            <table className="table">
                <thead>
                    <tr>
                        <th scope="col"></th> {/* For checkbox without header */}
                        <th scope="col">Analyte Name</th>
                        <th scope="col">Unit</th>
                        <th scope="col">Priority Ranking</th>
                    </tr>
                </thead>
                <tbody>
                    {analytes && analytes.map((analyte, index) => (
                        <SimpleAnalyteRow
                            key={index}
                            analytename={analyte.analytename}
                            unit={analyte.unit}
                            rank={analyte.rank}
                            isEnabled={analyte.isActive}
                            consecutiveAnalytes={consecutiveAnalytes}
                            setAnalytes={setAnalytes} // so the checkbox can affect the active analytes
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};
