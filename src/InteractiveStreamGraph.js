import React, { Component } from "react";
import * as d3 from "d3";

class InteractiveStreamGraph extends Component {
    componentDidUpdate(){
    const chartData = this.props.csvData;
    console.log("Rendering chart with data:", chartData);
    // Don't render if data is empty
    if (!chartData || chartData.length === 0) {
        return;
    }
    
    // Define the LLM model names to visualize
    const llmModels = ["GPT-4", "Gemini", "PaLM-2", "Claude", "LLaMA-3.1"];

    // Write the D3.js code to create the interactive streamgraph visualization here

    const svg = d3.select(".svg_parent")
      .attr("width", 650)
      .attr("height", 500);

    const width = 300;
    const height = 420;
    const margin = { top: 140, right: 10, bottom: 10, left: 10 };

    const colors = {
      "GPT-4": "#e41a1c",
      "Gemini": "#377eb8",
      "PaLM-2": "#4daf4a",
      "Claude": "#984ea3",
      "LLaMA-3.1": "#ff7f00"
    };



    let cleaned = chartData.filter(d => d.Date && d["GPT-4"] !== undefined);
    cleaned = cleaned.map(d => {
      const obj = {};
      Object.keys(d).forEach(key => obj[key.trim()] = d[key]);
      
      obj.Date = new Date(obj.Date);
      llmModels.forEach(m => obj[m] = +obj[m] || 0);
      return obj; //for some reason the data kept giving an error, so had to sanitize it first and then it started working
    });

    const x = d3.scaleTime().domain(d3.extent(cleaned, d => d.Date)).range([margin.left, width - margin.right - 40]);

    const y = d3.scaleLinear().range([height - margin.bottom, margin.top]);

    const stackGenerator = d3.stack().keys(llmModels).offset(d3.stackOffsetWiggle);

    const stackedData = stackGenerator(cleaned);

    y.domain([
      d3.min(stackedData, layer => d3.min(layer, d => d[0])),
      d3.max(stackedData, layer => d3.max(layer, d => d[1]))
    ]);

    const area = d3.area()
      .x(d => x(d.data.Date))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveBasis);

    svg.append("g").selectAll("path").data(stackedData).join("path").attr("fill", d => colors[d.key])
      .attr("d", area).on("mouseover mousemove", (event, d) => showTooltip(event, d)).on("mouseout", hideTooltip);//added functions to make it easier

    svg.append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b"))); //short month format

    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right}, ${margin.top+120})`);

    llmModels.forEach((m, i) => {
      const g = legend.append("g").attr("transform", `translate(0, ${i * -22})`);
        
      g.append("rect").attr("width", 14).attr("height", 14).attr("fill", colors[m]);

      g.append("text").attr("x", 20).attr("y", 12).text(m).style("font-size", "12px");
    });

    const tooltip = d3.select("body").append("div").attr("id", "tooltip").style("position", "absolute")
      .style("opacity", 0).style("background", "lightgray").style("padding", "8px").style("border-radius", "5px")

    function showTooltip(event, modelLayer) {
      const modelName = modelLayer.key;

      tooltip.style("opacity", 1)
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 40 + "px");

      tooltip.html("");

      const w = 250;
      const h = 200;

      const svgMini = tooltip.append("svg").attr("width", w).attr("height", h);

      const xMini = d3.scaleBand().domain(chartData.map(d => d3.timeFormat("%b")(d.Date))).range([30, w - 10])


      const yMini = d3.scaleLinear().domain([0, d3.max(chartData, d => d[modelName])]).range([h - 25, 10]);

      svgMini.selectAll("rect").data(chartData).join("rect").attr("x", d => xMini(d3.timeFormat("%b")(d.Date)))
        .attr("y", d => yMini(d[modelName]))
        .attr("width", xMini.bandwidth())
        .attr("height", d => (h - 25) - yMini(d[modelName]))
        .attr("fill", colors[modelName]);

      svgMini.append("g")
        .attr("transform", `translate(0, ${h - 25})`)
        .call(d3.axisBottom(xMini).tickSize(0).tickFormat(d => d));

      svgMini.append("g")
        .attr("transform", `translate(30,0)`).call(d3.axisLeft(yMini));
    }

    function hideTooltip() {
      tooltip.style("opacity", "0");
    }
  }

  render() {
    return (
      <svg style={{ width: 600, height: 500 }} className="svg_parent">
        
      </svg>
    );
  }
}

export default InteractiveStreamGraph;
