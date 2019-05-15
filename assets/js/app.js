/*


Scott McEachern
May 13, 2019


- Responsive

*/


console.log("--> app.js: Started initialization of application");


//- Prepare Globals
const CHARTDIVNAME = "#scatter";

var _sourceChartData = null;    // census data from API used with charts; set when returned from API

var _chartDivWidth = 0; // width of the div that contains the chart SVG; set when chart is created





function getChartDivWidth(){
    /* Returns the width, in pixels, of the div that contains the SVG of the chart. This div
    that is column within a Bootstrap grid, resizes bases on the size of the browser.

    Accepts : nothing

    returns : (int) current width of the div; in pixels

    */

    return parseInt(d3.select("body").select(CHARTDIVNAME).style('width').slice(0, -2));
}


function createChart(sourceData){
    /*

    Accepts : sourceData (list, dictionary) contains the dataset, one element in the array for each state

    Returns : undefined
    */

    console.log("--> createChart: Started function");

    //-- Prepare Chart Area

    //- Remove Existing Chart
    let svgArea = d3.select("body").select(CHARTDIVNAME).select("svg");

    if (!svgArea.empty()){
        svgArea.remove();
    }


    //- Determine SVG Size
    //  There is other content to be on the page; use 50% of height
    let svgHeight = (window.innerHeight * 0.5);
    _chartDivWidth = getChartDivWidth();

    //- Set Chart Margins within SVG
    let chartMargin = {
        top : 60,
        right : 60,
        bottom : 60,
        left : 60
    };

    //- Set Chart Area; excludes the margins
    let chartHeight = (svgHeight - chartMargin.top - chartMargin.bottom);
    let chartWidth = (_chartDivWidth - chartMargin.left - chartMargin.right);

    //- Create SVG Container
    let svgContainer = d3.select("body").select(CHARTDIVNAME).append("svg")
        .attr("height", svgHeight)
        .attr("width", _chartDivWidth);

    //- Create Chart Group within SVG
    //  Shift based on the margins
    let svgChartGroup = svgContainer.append("g")
        .attr("transform", `translate(${chartMargin.left}, ${chartMargin.top})`);


    //-- Create Chart

    let xColumnName = "poverty";
    let yColumnName = "healthcare";


    //- Prepare X
    let xScale = d3.scaleLinear()
        .domain([d3.min(sourceData, d => d[xColumnName]) - 0.5, d3.max(sourceData, d => d[xColumnName])])
        .range([0, chartWidth]);

    let xAxis = d3.axisBottom(xScale);


    //- Prepare Y
    let yScale = d3.scaleLinear()
        .domain([d3.min(sourceData, d => d[yColumnName]) -0.5, d3.max(sourceData, d => d[yColumnName])])
        .range([chartHeight, 0]);
    
    let yAxis = d3.axisLeft(yScale);


    //- Create X-Y Axis
    svgChartGroup.append("g")
        .attr("transform", `translate(0, ${chartHeight})`)
        .call(xAxis);

    svgChartGroup.append("g")
        .call(yAxis);


    //- Create Points
    let circleColor = d3.rgb(122, 182, 219)

    let circleGroup = svgChartGroup.selectAll("circle")
        .data(sourceData)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d[xColumnName]))
        .attr("cy", d => yScale(d[yColumnName]))
        .attr("r", "12")
        .attr("fill", circleColor)
        .attr("opacity", "0.9")


    //- Create Labels
    //  These labels are to be placed within own "g" otherwise the selectAll("text") picks up the 
    //  axis text that results in a number of labels not being displaced
    let svgLabelGroup = svgChartGroup.append("g");

    var textMarkerGroup = svgLabelGroup.selectAll("text")
        .data(sourceData)
        .enter()
        .append("text")
        .attr("x", d => xScale(d[xColumnName]) - 6.8 )
        .attr("y", d => yScale(d[yColumnName]) + 3.5)
        .text(d => d.abbr)
        .attr("font-family", "sans-serif")
        .attr("font-size", "10px")
        .attr("fill", "white");

}


function makeResponsive(){
    /* Method to be called when the browser is resized; redraws the chart to fit the new area.
    Determines if the current div that contains the chart has changed size and only updates the 
    chart when the size has changed.

    Accepts : nothing

    Returns : undefined
    */

    console.log("--> makeResponsive: Started function");


    if (_sourceChartData == null){
        console.log("Unable to update chart; missing reference to source chart data");
    }
    else
    {
        //- Determine if chart has resized
        //  Div that contains the chart is in Bootstrap grid
        let currentChartWidth = getChartDivWidth();

        if (_chartDivWidth == currentChartWidth){
            console.log("Chart not refreshed; same size");
        }
        else
        {
            console.log(`Refresh chart: Chart Width: ${_chartDivWidth} Current size ${currentChartWidth} `);
            createChart(_sourceChartData);
        }
    }
}


//- Request Data
d3.csv("assets/data/data.csv").then(function(chartData) {

    console.log("--> d3.csv: Request completed for census data");

    console.log(chartData);


    //- Convert to numeric values
    chartData.forEach(item => {
        item.age = +item.age;
        item.agoMoe = +item.agoMoe;
        item.healthcare = +item.healthcare;
        item.healthcareHigh = +item.healthcareHigh;
        item.healthcareLow = +item.healthcareLow;
        item.income = +item.income;
        item.incomeMoe = +item.incomeMoe;
        item.obesity = +item.obesity;
        item.obesityHigh = +item.obesityHigh;
        item.obesityLow = +item.obesityLow;
        item.poverty = +item.poverty;
        item.povertyMoe = +item.povertyMoe;
        item.smokes = +item.smokes;
        item.smokesHigh = +item.smokesHigh;
        item.smokesLow = +item.smokesLow;
    });


    //- Store data returned from endpoint in global variable; used with responsive design
    _sourceChartData = chartData;


    //- Update Chart
    createChart(chartData);

}).catch(function(error) {

    console.log("--> d3.csv: Error in getting census data");
    console.log(error);
});



//- Setup Responsive Chart
d3.select(window).on("resize", makeResponsive);



