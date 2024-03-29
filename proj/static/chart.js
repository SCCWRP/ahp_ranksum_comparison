// Basic setup for D3 chart
const svg = d3.select("#chart").append("svg")
.attr("width", "100%")
.attr("height", "100%")
.append("g");


function clearChart(chartID='chart'){
    const svg = d3.select(`#${chartID}`)
    svg.selectAll("*").remove(); // Clear previous drawings
}

// Example function to update chart, replace with your actual logic
function updateChart() {
    // Here, you'll fetch the values from the inputs and use them to update the chart.
    const sitename = document.getElementById('sitename-select').value;
    const bmpname = document.getElementById('bmp-select').value;

    let analytes = []
    Array.from(document.getElementById('analyte-container').querySelectorAll('.analyte-row')).forEach(a => {
        analytes.push({
            analytename: a.dataset.analyteName,
            threshold_value: Number(a.querySelector('.threshold-input').value),
            units          : Number(a.querySelector('.unit-select').value),
            ranking: Number(a.querySelector('.ranking-input').value)
        })
    })

    const multiSelectValues = Array.from(document.getElementById('multiSelect').selectedOptions).map(option => option.value);
    const numericInputValue = document.getElementById('numericInput').value;

    // Now, use these values to fetch new data and update the chart accordingly
    console.log(dropdown1Value, dropdown2Value, multiSelectValues, numericInputValue);
    // For demonstration, just drawing a circle, replace with actual data-driven chart
    svg.selectAll("*").remove(); // Clear previous drawings
    svg.append("circle")
    .attr("cx", 200) // Example X position, replace with dynamic values
    .attr("cy", 200) // Example Y position, replace with dynamic values
    .attr("r", numericInputValue) // Example radius, replace with dynamic values
    .style("fill", "steelblue");
}

// Event listeners for inputs
// document.getElementById('dropdown1').addEventListener('change', updateChart);
// document.getElementById('dropdown2').addEventListener('change', updateChart);
// document.getElementById('multiSelect').addEventListener('change', updateChart);
// document.getElementById('numericInput').addEventListener('input', updateChart);

// Initialize chart
//updateChart();

