import React from 'react';
import Modal from 'react-modal';

import '../styles/modal.css'

function DataDetailsModalWindow({ isOpen, onRequestClose, data, labelText }) {

    const detailedData = data.detailedData;
    const summaryData = data.summaryData;
    
    // Generate table rows dynamically based on data properties
    const generateTableRows = (detailedData) => {
        return detailedData.map((val, index) => (
            <tr key={index}>
                {Object.keys(val).map((key, idx) => (
                    <td key={idx}>{typeof val[key] === 'object' ? JSON.stringify(val[key]) : val[key]}</td>
                ))}
            </tr>
        ));
    };

    // Define table headers based on the first analyte's keys if available
    const tableHeaders = detailedData && detailedData.length > 0
        ? Object.keys(detailedData[0]).map((key, index) => (
            <th key={index} scope="col">{key.replace(/_/g, ' ').toUpperCase()}</th>
        ))
        : [];

    // Define custom styles for the modal
    const modalStyle = {
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            width: '80%', // Adjust based on your preference
            maxHeight: '90vh', // Adjust based on your preference
            overflowY: 'auto', // Allows scrolling within the modal
        },
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)' // Optional: Adds a semi-transparent backdrop
        }
    };

    // Generate list items dynamically based on summaryData properties
    const generateSummaryListItems = (summaryData) => {
        return Object.entries(summaryData).map(([key, value], index) => (
            <li key={index}><strong>{key}:</strong> {value}</li>
        ));
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            contentLabel="Details"
            ariaHideApp={false}
            style={modalStyle} // Apply the custom styles
        >
            <button
                onClick={onRequestClose}
                className="modal-close-button"
            >
                &times; {/* HTML entity for the multiplication sign, used as a close icon */}
            </button>
            <h3>{labelText}</h3>
            <ul className="summary-list">
                {summaryData && generateSummaryListItems(summaryData)}
            </ul>
            {detailedData && (
                <div className="table-responsive"> {/* Responsive table container */}
                    <table className="table table-striped table-hover"> {/* Bootstrap classes added */}
                        <thead className="thead-dark"> {/* Added class for a dark table header */}
                            <tr>{tableHeaders}</tr>
                        </thead>
                        <tbody>{generateTableRows(detailedData)}</tbody>
                    </table>
                </div>
            )}
        </Modal>
    );
}

export default DataDetailsModalWindow;
