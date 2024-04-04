import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

import debounce from '../utils/debounce';

const IndexComparisonChart = ({ title, plotData, ahpColor, ranksumColor, debounceResizeTime = 250, topMargin = 35, bottomMargin = 30, leftMargin = 40, rightMargin = 20}) => {
    const [plotWidth, setPlotWidth] = useState( window.innerWidth * 0.85 )
    const [plotHeight, setPlotHeight ] = useState( plotWidth * (9/16) )

    // Adjust useEffect dependency to just [] to setup event listener once
    useEffect(() => {
        // Using debounce to limit resize event handling
        const handleResize = debounce(() => {
            setPlotWidth(window.innerWidth * 0.85);
        }, debounceResizeTime); // Adjust debounce time (ms) as needed

        window.addEventListener('resize', handleResize);

        // Cleanup the event listener on component unmount
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        
        setPlotHeight(plotWidth * (9/16))
        console.log(plotWidth);
        console.log(plotHeight);

    }, plotWidth)

    const d3Container = useRef(null);

    useEffect(() => {
        if (plotData && d3Container.current) {
            // Clear the SVG canvas
            d3.select(d3Container.current).selectAll("*").remove();

            const margin = { top: topMargin, right: rightMargin, bottom: bottomMargin, left: leftMargin },
                width = plotWidth - margin.left - margin.right,
                height = plotHeight - margin.top - margin.bottom;

            // Append the SVG object to the container
            const svg = d3.select(d3Container.current)
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            // Append the title
            svg.append("text")
                .attr("x", width / 2) 
                .attr("y", -margin.top / 2) // Adjust title position
                .attr("text-anchor", "middle")  
                .style("font-size", "20px") 
                .style("text-decoration", "underline")  
                .style("color", "black")  
                .text(title);

            // X axis
            const x = d3.scaleLinear()
                .domain([0, d3.max(plotData, d => d.n_params)])
                .range([0, width]);
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x));

            // Y axis
            const y = d3.scaleLinear()
                .domain([
                    0,
                    d3.max(plotData, d => Math.max(d.ahp_mashup_score, d.ranksum_mashup_score))
                ])
                .range([height, 0]);
            svg.append("g")
                .call(d3.axisLeft(y));

            // Add AHP mashup score dots
            svg.selectAll(".dot-ahp")
                .data(plotData)
                .enter().append("circle")
                .attr("class", "dot-ahp")
                .attr("cx", d => x(d.n_params))
                .attr("cy", d => y(d.ahp_mashup_score))
                .attr("r", 5)
                .style("fill", ahpColor);

            // Add Ranksum mashup score dots
            svg.selectAll(".dot-ranksum")
                .data(plotData)
                .enter().append("circle")
                .attr("class", "dot-ranksum")
                .attr("cx", d => x(d.n_params))
                .attr("cy", d => y(d.ranksum_mashup_score))
                .attr("r", 5)
                .style("fill", ranksumColor);
        }
    }, [plotData, ahpColor, ranksumColor, plotWidth, plotHeight]); // Redraw chart if data or colors change

    return (
        <svg ref={d3Container} />
    );
};

export default IndexComparisonChart;
