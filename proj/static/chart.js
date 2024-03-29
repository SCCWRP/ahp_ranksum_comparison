const chartContainerWidth = document.getElementById('select-option-container').getBoundingClientRect().width
const chartContainerHeight = chartContainerWidth * 9 / 16

// Define adjusted margins to accommodate axis labels
const MARGIN = { top: 20, right: 20, bottom: 50, left: 60 }, // Increased bottom and left margins
    WIDTH = chartContainerWidth - MARGIN.left - MARGIN.right,
    HEIGHT = chartContainerHeight - MARGIN.top - MARGIN.bottom;

// Adjust SVG setup to include margins
const svg = d3.select("#chart").append("svg")
    .attr("width", WIDTH + MARGIN.left + MARGIN.right)
    .attr("height", HEIGHT + MARGIN.top + MARGIN.bottom)
    .append("g")
    .attr("transform", "translate(" + MARGIN.left + "," + MARGIN.top + ")");

// Function to clear the chart
function clearChart() {
    svg.selectAll("*").remove(); // Clear previous drawings
}

// create a tooltip
const tooltip = d3.select("#chart")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("position", "absolute")


// Function to draw axes and include axis labels, ensuring labels are visible
function drawAxes(svg, xScale, yScale, max_x) {
    // Remove existing axes if any, to redraw
    svg.selectAll(".axis").remove();
    svg.selectAll("text").remove();

    // Draw X Axis and append it to the SVG
    const xAxis = svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + HEIGHT + ")")
        .call(d3.axisBottom(xScale)
            .ticks(max_x) // Suggest using a maximum of max_n_params ticks
            .tickFormat(d3.format('d')) // Format the ticks as integers
        );

    // Draw Y Axis and append it to the SVG
    const yAxis = svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(yScale));

    // Add X-axis label
    svg.append("text")
        .attr("class", "label")
        .attr("x", WIDTH / 2 + MARGIN.left)
        .attr("y", HEIGHT + (2 * MARGIN.top)) // Adjust this if your X-axis label is too far or too close
        .style("text-anchor", "middle")
        .text("Number of Parameters");

    // Add Y-axis label
    svg.append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("x", -(HEIGHT / 2 + MARGIN.top))
        .attr("y", -(MARGIN.left / 1.5)) // Adjust this if your Y-axis label is too far or too close
        .style("text-anchor", "middle")
        .text("Mashup Index Score");
}


// Function to add dots with tooltip
function addDot(svg, xScale, yScale, n_params, score, data, color) {
    // Assuming you already have appended a div with class 'tooltip' to the body
    const tooltip = d3.select(".tooltip");

    svg.append("circle")
        .attr("cx", xScale(n_params))
        .attr("cy", yScale(score))
        .attr("r", 5)
        .style("fill", color)
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {

            console.log('event.clientX')
            console.log(event.clientX)
            console.log('event.clientY')
            console.log(event.clientY)


            tooltip
                .style("opacity", .9)
                .style("left", `${event.clientX + (MARGIN.left / 2)}px`)
                .style("top", `${event.clientY - MARGIN.top}px`)
                .style("z-index", '5')
                

            tooltip.html(
                `
                <div class="container">
                    <div class="row">
                        <div class="col-sm-6">N:</div>
                        <div class="col-sm-6">${n_params}</div>
                        </div>
                    <div class="row">
                        <div class="col-sm-6">${document.querySelector('input[name="mashup-index-method"]:checked').value == 'ahp' ? 'AHP' : 'Ranksum' } Score:</div>
                        <div class="col-sm-6">${
                            parseFloat(
                                Number(data[document.querySelector('input[name="mashup-index-method"]:checked').value + '_mashup_score'])
                            .toFixed(3))
                        }</div>
                    </div>
                    <br>
                    Analytes:
                    <div class="row">
                        ${
                            data.analytes.sort((a,b) => a.ranking - b.ranking).map(a => {
                                return '<div class="col-4">Analytename: ' + a.analytename + '</div>' +
                                '<div class="col-4">Ranking: ' + a.ranking + '</div>' +
                                '<div class="col-4">threshold: ' + a.threshold_value + a.unit + '</div>'
                            }).join('</div><br><div class="row">')
                        }
                    </div>
                </div>
                `
            )
            
        })
        .on("mousemove", function (event, d) {

            tooltip
                .style("left", `${event.clientX + (MARGIN.left / 2)}px`)
                .style("top", `${event.clientY - MARGIN.top}px`)
                    
        })
        .on("mouseout", function (d) {
            tooltip
                .style("opacity", 0)
                .style("left", '0px')
                .style("top", '0px')
                .style("z-index", '-5')
        });
}



// Example function to update chart, replace with your actual logic
function updateChart() {


    // Here, you'll fetch the values from the inputs and use them to update the chart.
    const sitename = document.getElementById('sitename-select').value;
    const bmpname = document.getElementById('bmp-select').value;

    // all possible analytes
    const allAnalytes = Array.from(document.getElementById('analyte-container').querySelectorAll('.analyte-row'));
    const max_n_params = allAnalytes.length;

    // Adjusted scales to fit within the new width and height
    const xScale = d3.scaleLinear().domain([1, max_n_params + 1]).range([0, WIDTH]);
    const yScale = d3.scaleLinear().domain([0, 10]).range([HEIGHT, 0]);

    let analytes = []
    allAnalytes.forEach(a => {
        if (!a.classList.contains('disabled')) {
            analytes.push({
                analytename: a.dataset.analyteName,
                threshold_value: Number(a.querySelector('.threshold-input').value),
                unit: a.querySelector('.unit-select').value,
                ranking: Number(a.querySelector('.ranking-input').value)
            })
        }
    })

    console.log(analytes)

    if (analytes.length < 2) {
        alert("Mashup Index can only be calculated if there is more than one parameter selected")
        return;
    }


    // Now, use these values to fetch new data and update the chart accordingly
    fetch(
        'getdata',
        {
            method: 'post',
            headers: {
                'Content-Type': 'application/json' // This specifies that the body will be a JSON string
            },
            body: JSON.stringify({
                sitename: sitename,
                bmpname: bmpname,
                analytes: analytes
            })
        }
    ).then(
        resp => resp.json()
    ).then(
        data => {
            console.log('data')
            console.log(data)

            const scoreType = document.querySelector('input[name="mashup-index-method"]:checked').value;
            const score = data[`${scoreType}_mashup_score`];
            const color = document.getElementById('color-picker').value;

            // Assuming svg, xScale, yScale are defined and set up
            addDot(svg, xScale, yScale, data.n_params, score, data, color);

            // Redraw axes in case scale has changed
            drawAxes(svg, xScale, yScale, max_n_params);
        }
    )

    // For demonstration, just drawing a circle, replace with actual data-driven chart
    // svg.append("circle")
    // .attr("cx", 200) // Example X position, replace with dynamic values
    // .attr("cy", 200) // Example Y position, replace with dynamic values
    // .attr("r", numericInputValue) // Example radius, replace with dynamic values
    // .style("fill", "steelblue");
}

// Event listeners for inputs
document.getElementById('add-data-button').addEventListener('click', function(){
    const rankingsArray = Array.from(document.getElementById('analyte-container').querySelectorAll('.analyte-row'))
        .filter(x => !x.classList.contains('disabled'))
        .map(x => Number(x.querySelector('input.ranking-input').value))

    const rankingsAreConsecutive = rankingsArray.reduce((a,b) => a + b) === (rankingsArray.length * (rankingsArray.length + 1) / 2);

    if (!rankingsAreConsecutive) {
        let proceed = confirm("Rankings of analytes are not consecutive, do you wish to proceed?")
        if (!proceed) {
            return;
        }
    }

    updateChart();

});
document.getElementById('clear-chart-button').addEventListener('click', clearChart);
document.getElementById('sitename-select').addEventListener('change', clearChart);
document.getElementById('bmp-select').addEventListener('change', clearChart);
Array.from(document.querySelectorAll('input[name="mashup-index-method"]')).forEach(elem => elem.addEventListener('change', clearChart));

// Initialize chart
//updateChart();

