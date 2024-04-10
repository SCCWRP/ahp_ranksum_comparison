import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';

import '../styles/modal.css'

function DataDetailsModalWindow({ isOpen, onRequestClose, data, labelText }) {

    // data should be an array of 1 or more datasets, structured how we originally had
    const [currentPage, setCurrentPage] = useState(0);
    const [detailedData, setDetailedData] = useState(data[currentPage]?.detailedData);
    const [summaryData, setSummaryData] = useState(data[currentPage]?.summaryData);

    const [summaryListItems, setSummaryListItems] = useState(
        summaryData && Object.entries(summaryData).map(([key, value], index) => (
            <li key={index}><strong>{key}:</strong> {value}</li>
        ))
    );

    const [tableHeaders, setTableHeaders] = useState(
        detailedData && detailedData.length > 0
            ? Object.keys(detailedData[0]).map((key, index) => (
                <th key={index} scope="col">{key.replace(/_/g, ' ').toUpperCase()}</th>
            ))
            : []
    );


    const [tableRows, setTableRows] = useState(
        detailedData && detailedData.map((val, index) => (
            <tr key={index}>
                {Object.keys(val).map((key, idx) => (
                    <td key={idx}>{typeof val[key] === 'object' ? JSON.stringify(val[key]) : val[key]}</td>
                ))}
            </tr>
        ))
    );


    // Ensure we reset the current page when data changes
    useEffect(() => {
        setCurrentPage(0);
    }, [data]);

    useEffect(() => {
        setDetailedData(data[currentPage]?.detailedData);
        setSummaryData(data[currentPage]?.summaryData);
    }, [currentPage, data])

    // Generate table rows dynamically based on data properties
    //const generateTableRows = (detailedData) => {
    useEffect(() => {
        setTableRows(
            detailedData && detailedData.map((val, index) => (
                <tr key={index}>
                    {Object.keys(val).map((key, idx) => (
                        <td key={idx}>{typeof val[key] === 'object' ? JSON.stringify(val[key]) : val[key]}</td>
                    ))}
                </tr>
            ))
        );
    }, [detailedData])

    // Define table headers based on the first analyte's keys if available
    useEffect(() => {
        setTableHeaders(
            detailedData && detailedData.length > 0
                ? Object.keys(detailedData[0]).map((key, index) => (
                    <th key={index} scope="col">{key.replace(/_/g, ' ').toUpperCase()}</th>
                ))
                : []
        )
    }, detailedData)

    // Generate list items dynamically based on summaryData properties
    useEffect(() => {
        setSummaryListItems(
            summaryData && Object.entries(summaryData).map(([key, value], index) => (
                <li key={index}><strong>{key}:</strong> {value}</li>
            ))
        );

    }, [summaryData])

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
            {data.length > 1 && <p>(Page {currentPage + 1} of {data.length})</p>}
            <ul className="summary-list">
                {summaryListItems}
            </ul>
            {detailedData && (
                <div className="table-responsive"> {/* Responsive table container */}
                    <table className="table table-striped table-hover"> {/* Bootstrap classes added */}
                        <thead className="thead-dark"> {/* Added class for a dark table header */}
                            <tr>{tableHeaders}</tr>
                        </thead>
                        <tbody>{tableRows}</tbody>
                    </table>
                </div>
            )}
            {data.length > 1 && (
                <div className="d-flex justify-content-between mt-3">
                    <button style={{marginLeft: '12%'}} className="btn btn-primary" onClick={() => setCurrentPage(current => Math.max(current - 1, 0))} disabled={currentPage === 0}>Previous</button>
                    <button style={{marginRight: '12%'}} className="btn btn-primary" onClick={() => setCurrentPage(current => Math.min(current + 1, data.length - 1))} disabled={currentPage === data.length - 1}>Next</button>
                </div>
            )}

        </Modal>
    );
}





export default DataDetailsModalWindow;