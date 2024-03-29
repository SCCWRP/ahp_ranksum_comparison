function updateAnalytes(sitename, bmpname) {
    const url = `analytes?sitename=${encodeURIComponent(sitename)}&bmpname=${encodeURIComponent(bmpname)}`;

    const analyteContainer = document.getElementById('analyte-container');
    analyteContainer.innerHTML = '';

    const specialAnalyteDefauts = {
        Phosphorus: {
            threshold: 0.5,
            unit: 'mg/L'
        },
        Nitrogen: {
            threshold: 1,
            unit: 'mg/L'
        },
        Copper: {
            threshold: 15,
            unit: 'ug/L'
        },
        Zinc: {
            threshold: 15,
            unit: 'ug/L'
        }
    }

    fetch(url)
    .then(resp => resp.json())
    .then(data => {
        const analytes = data.analytes; // Assuming data.analytes is the array of analytes

        // Create the header row first
        const headerRow = document.createElement('div');
        headerRow.className = 'analyte-row analyte-header'; // Add the 'analyte-header' for specific header styling if needed

        // Add your header columns here
        const headers = [' ', 'Analyte', 'Threshold', 'Unit', 'Ranking']; // Space for the checkbox column
        headers.forEach(headerText => {
            const headerSpan = document.createElement('span');
            headerSpan.textContent = headerText;
            headerRow.appendChild(headerSpan);
        });
        
        // Append the header row to the container
        analyteContainer.appendChild(headerRow);

        analytes.forEach((analyte, i) => {

            
            // Create the main row div
            const row = document.createElement('div');
            row.className = 'analyte-row';
            row.setAttribute('data-analyte-name', analyte);

            // Create the checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'analyte-checkbox';
            checkbox.checked = true;

            // Create the analyte name span
            const nameSpan = document.createElement('span');
            nameSpan.className = 'analyte-name';
            nameSpan.textContent = analyte;

            // Create the threshold input
            const thresholdInput = document.createElement('input');
            thresholdInput.type = 'number';
            thresholdInput.className = 'threshold-input';
            thresholdInput.placeholder = 'Threshold';
            thresholdInput.value = specialAnalyteDefauts[analyte]?.threshold ?? 1;
            
            // Create the unit select after the threshold
            const unitSelect = document.createElement('select');
            unitSelect.className = 'unit-select';
            const ugOption = document.createElement('option');
            ugOption.value = 'ug/L';
            ugOption.textContent = 'ug/L';
            const mgOption = document.createElement('option');
            mgOption.value = 'mg/L';
            mgOption.textContent = 'mg/L';
            unitSelect.appendChild(ugOption);
            unitSelect.appendChild(mgOption);
            unitSelect.value = specialAnalyteDefauts[analyte]?.unit ?? 'mg/L';
            
            // Create the ranking input
            const rankingInput = document.createElement('input');
            rankingInput.type = 'number';
            rankingInput.className = 'ranking-input';
            rankingInput.placeholder = 'Ranking';
            rankingInput.value = i + 1;

            // Append elements to the row
            row.appendChild(checkbox);
            row.appendChild(nameSpan);
            row.appendChild(thresholdInput);
            row.appendChild(unitSelect);
            row.appendChild(rankingInput);

            // Append the row to the container
            analyteContainer.appendChild(row);

        });

        // disable them if they are unchecked
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



document.getElementById('show-analytes').addEventListener('change', function(){

    const analyteContainer = document.getElementById('analyte-container');
    if(this.checked){
        analyteContainer.style.display = 'block'
    } else {
        analyteContainer.style.display = 'none'
    }
})