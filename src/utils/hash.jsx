import CryptoJS from 'crypto-js';

function uniqueIdForDataPoint(d) {
    const dataString = JSON.stringify(d);
    const hash = CryptoJS.SHA256(dataString);
    return hash.toString(CryptoJS.enc.Hex);
}

export default uniqueIdForDataPoint;