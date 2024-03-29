function updateAnalytes(sitename, bmpname) {
    
    // technically the api is set up for firstbmp and last bmp (for treatment trains) but we are not concerned with that right now
    const url = `analytes?sitename=${encodeURIComponent(sitename)}&bmpname=${encodeURIComponent(bmpname)}`;

    // Clear previous analyte rows
    const analyteContainer = document.getElementById('analyte-container');
    analyteContainer.innerHTML = '';

    fetch(url)
    .then(resp => resp.json())
    .then(data => {

        // Assuming data.analytes is the array of analytes
        const analytes = data.analytes;
        analytes.forEach(analyte => {
            // Create a new row for each analyte
            const row = document.createElement('div');
            row.className = 'analyte-row';
            row.setAttribute('data-analyte-name', analyte);

            // Checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'analyte-checkbox';
            checkbox.checked = true; // or some condition based on analyte data

            // Analyte name span
            const nameSpan = document.createElement('span');
            nameSpan.className = 'analyte-name';
            nameSpan.textContent = analyte;

            // Threshold input
            const thresholdInput = document.createElement('input');
            thresholdInput.type = 'number';
            thresholdInput.className = 'threshold-input';
            thresholdInput.placeholder = 'Threshold';

            // Ranking input
            const rankingInput = document.createElement('input');
            rankingInput.type = 'number';
            rankingInput.className = 'ranking-input';
            rankingInput.placeholder = 'Ranking';

            // Append everything to the row
            row.appendChild(checkbox);
            row.appendChild(nameSpan);
            row.appendChild(thresholdInput);
            row.appendChild(rankingInput);

            // Append the row to the container
            analyteContainer.appendChild(row);
        });
    })
    .catch(error => {
        console.error('Error fetching analytes:', error);
    });
}


function updateBMPNames(sitename) {
    const url = `bmpnames?sitename=${encodeURIComponent(sitename)}`; // Append the sitename as a query string parameter
        
    // Clear previous options
    const bmpSelect = document.getElementById('bmp-select');
    bmpSelect.innerHTML = '';

    fetch(url).then(
        resp => resp.json()
    ).then(
        data => {
            const bmpnames = data.bmpnames;
            const bmpSelect = document.getElementById('bmp-select');
            
            bmpnames.forEach(bmpname => {
                const option = document.createElement('option');
                option.value = bmpname;
                option.textContent = bmpname;
                bmpSelect.appendChild(option);
            });

            currentSiteName = document.getElementById('sitename-select').value
            currentBMPName = document.getElementById('bmp-select').value
            updateAnalytes(currentSiteName, currentBMPName)
        }
    ).catch(error => {
        console.error('Error fetching bmpnames:', error);
    });
}

function updateSitenames(){
    // fetch the sitenames
    fetch('sitenames').then(
        resp => resp.json()
    ).then(
        data => {
            const sitenames = data.sitenames;
            const sitenameSelect = document.getElementById('sitename-select');

            sitenames.forEach(sitename => {
                const option = document.createElement('option');
                option.value = sitename;
                option.textContent = sitename;
                sitenameSelect.appendChild(option);
            });
            
            currentSiteName = document.getElementById('sitename-select').value
            // updateSiteNames only gets called once anyways
            updateBMPNames(currentSiteName)
        }
    ).catch(error => {
        console.error('Error fetching sitenames:', error);
    });
}

(
    function() {
        // Ensure this code runs after the document has fully loaded
        document.addEventListener('DOMContentLoaded', function(){
            updateSitenames();
        });

        // Add the event listener for updating the BMP Names
        document.getElementById('sitename-select').addEventListener('change', function(){
            const selectedSitename = this.value; // Get the currently selected sitename value
            updateBMPNames(selectedSitename);
        })
    }
)()


document.querySelectorAll('.analyte-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        const row = this.closest('.analyte-row');
        if (this.checked) {
            row.classList.remove('disabled');
        } else {
            row.classList.add('disabled');
        }
    });
});

function getAnalytesData() {
    const analytes = [];
    document.querySelectorAll('#analyte-container .analyte-row').forEach(row => {
        if (row.querySelector('.analyte-checkbox').checked) {
            const analyteName = row.getAttribute('data-analyte-name');
            const threshold = row.querySelector('.threshold-input').value;
            const ranking = row.querySelector('.ranking-input').value;
            analytes.push({
                analytename: analyteName,
                threshold: threshold,
                ranking: ranking
            });
        }
    });
    return analytes;
}

// Example usage:
console.log(getAnalytesData());
