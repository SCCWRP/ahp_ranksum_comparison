import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

import debounce from '../utils/debounce';

const IndexComparisonChart = ({ title, plotData, ahpColor, ranksumColor, debounceResizeTime = 250, topMargin = 35, bottomMargin = 30, leftMargin = 60, rightMargin = 20 }) => { // Adjusted leftMargin for Y axis label space
    const [plotWidth, setPlotWidth] = useState(window.innerWidth * 0.85)
    const [plotHeight, setPlotHeight] = useState(plotWidth * (9 / 16))

    useEffect(() => {
        const handleResize = debounce(() => {
            setPlotWidth(window.innerWidth * 0.85);
        }, debounceResizeTime);

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setPlotHeight(plotWidth * (9 / 16))
    }, [plotWidth])

    const d3Container = useRef(null);

    useEffect(() => {
        if (plotData && d3Container.current) {
            d3.select(d3Container.current).selectAll("*").remove();

            const margin = { top: topMargin, right: rightMargin, bottom: bottomMargin, left: leftMargin },
                width = plotWidth - margin.left - margin.right,
                height = plotHeight - margin.top - margin.bottom;

            const svg = d3.select(d3Container.current)
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            svg.append("text")
                .attr("x", width / 2)
                .attr("y", -margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .style("text-decoration", "underline")
                .text(title);

            const x = d3.scaleLinear()
                .domain([1, d3.max(plotData, d => d.n_params)])
                .range([0, width]);
            
            // Generate unique integer tick values from the plotData
            const uniqueTickValues = Array.from(new Set(plotData.map(d => Math.floor(d.n_params)))).sort((a, b) => a - b);
            
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).tickValues(uniqueTickValues).tickFormat(d3.format('d')));
            

            // X axis label
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", height + margin.bottom - 5)
                .style("text-anchor", "middle")
                .text("Number of Parameters");

            const y = d3.scaleLinear()
                .domain([
                    0,
                    d3.max(plotData, d => Math.max(d.ahp_mashup_score, d.ranksum_mashup_score))
                ])
                .range([height, 0]);
            svg.append("g")
                .call(d3.axisLeft(y));

            // Y axis label
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x", 0 - (height / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Mashup Index Score Value");

            svg.selectAll(".dot-ahp")
                .data(plotData)
                .enter().append("circle")
                .attr("class", "dot-ahp")
                .attr("cx", d => x(d.n_params))
                .attr("cy", d => y(d.ahp_mashup_score))
                .attr("r", 5)
                .style("fill", ahpColor);

            svg.selectAll(".dot-ranksum")
                .data(plotData)
                .enter().append("circle")
                .attr("class", "dot-ranksum")
                .attr("cx", d => x(d.n_params))
                .attr("cy", d => y(d.ranksum_mashup_score))
                .attr("r", 5)
                .style("fill", ranksumColor);
        }
    }, [plotData, ahpColor, ranksumColor, plotWidth, plotHeight]);

    return (
        <svg ref={d3Container} />
    );
};

export default IndexComparisonChart;
