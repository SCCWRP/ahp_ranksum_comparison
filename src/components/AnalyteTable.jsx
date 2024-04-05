import React from 'react';
import AnalyteRow from './AnalyteRow'; // Assuming AnalyteRow is your component for rendering each row

const AnalyteTable = ({ showAnalytes, analytes, selectedSiteName, selectedBmpName, universalThreshPercentile, setActiveAnalytes }) => {
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
  );
};

export default AnalyteTable;
