import React from 'react';
import Modal from 'react-modal';

function DataDetailsModalWindow({ isOpen, onRequestClose, data, labelText }) {
    // Generate table rows dynamically based on data properties
    const generateTableRows = (data) => {
        return data.map((val, index) => (
            <tr key={index}>
                {Object.keys(val).map((key, idx) => (
                    <td key={idx}>{typeof val[key] === 'object' ? JSON.stringify(val[key]) : val[key]}</td>
                ))}
            </tr>
        ));
    };

    // Define table headers based on the first analyte's keys if available
    const tableHeaders = data && data.length > 0
        ? Object.keys(data[0]).map((key, index) => (
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

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            contentLabel="Details"
            ariaHideApp={false}
            style={modalStyle} // Apply the custom styles
        >
            <h3>{labelText}</h3>
            {data && (
                <div className="table-responsive"> {/* Responsive table container */}
                    <table className="table table-striped table-hover"> {/* Bootstrap classes added */}
                        <thead className="thead-dark"> {/* Added class for a dark table header */}
                            <tr>{tableHeaders}</tr>
                        </thead>
                        <tbody>{generateTableRows(data)}</tbody>
                    </table>
                </div>
            )}
            <button className="btn btn-secondary" onClick={onRequestClose}>Close</button> {/* Bootstrap button classes */}
        </Modal>
    );
}

export default DataDetailsModalWindow;
