/* Creates scatter plot chart using D3. The user has the ability to change the x and y axis.
Use of global variables to keep track of user selection to allow for responsive layout where when 
the window is resized the chart is removed and then created again.

Scott McEachern
May 13, 2019
*/

console.log("--> app.js: Started initialization of application");


//- Constants
const CHARTDIVNAME = "#scatter";

const YAXISINACTIVECLASS = "aText inactive yAxis";  // class attribute for the SVG Y axis text elements that are not active

const YAXISACTIVECLASS = "aText active yAxis";    // class attribute for the SVG Y axis text element that is active

const XAXISINACTIVECLASS = "aText inactive xAxis";  // class attribute for the SVG X axis text elements that are not active

const XAXISACTIVECLASS = "aText active xAxis";  // class attribute for the SVG X axis text element that is active

const _chartMargin = {      // Margins to use to place the chart within the SVG container
    top : 60,
    right : 60,
    bottom : 90,
    left : 80
};


//- Prepare Globals
var _sourceChartData = null;    // census data from API used with charts; set when returned from API

var _chartDivWidth = 0; // width of the div that contains the chart SVG; set when chart is created

var _activeChart = {        // information on the currently selected chart; updated when the user changes selection
    xDisplayName : "In Poverty (%)",
    xColumnName : "poverty",
    yDisplayName : "Lack Healthcare (%)",
    yColumnName : "healthcare"
};



function getChartDivWidth(){
    /* Returns the width, in pixels, of the div that contains the SVG of the chart. This div
    that is column within a Bootstrap grid, resizes bases on the size of the browser.

    Accepts : nothing

    returns : (int) current width of the div; in pixels

    */

    return parseInt(d3.select("body").select(CHARTDIVNAME).style('width').slice(0, -2));
}


function getSvgHeight(){
    /* Returns the height of the svg container; it is always calculated to be 50% of window height

    Accepts : nothing

    Returns : (number) height of the container in px
    */

    return (window.innerHeight * 0.5);
}

function getTransitionDuration(){
    /* Returns the transition duration to be used with the animation of the charts

    Accepts : nothing

    Returns : (transition)
    */

    return d3.transition().duration(500);
}


function createChart(sourceData){
    /*

    Accepts : sourceData (list, dictionary) contains the dataset, one element in the array for each state

    Returns : undefined
    */

    console.log("--> createChart: Started function");


    // var chartInfo = {
    //     xColumnName: "poverty",
    //     yColumnName: "healthcare",
    //     xDisplayName: "Poverty",
    //     yDisplayName: "Lacks Healthcare"
    // }


    //-- Prepare Chart Area

    //- Remove Existing Chart
    let svgArea = d3.select("body").select(CHARTDIVNAME).select("svg");

    if (!svgArea.empty()){
        svgArea.remove();
    }


    //- Determine SVG Size
    //  There is other content to be on the page; use 50% of height
    let svgHeight = getSvgHeight();
    _chartDivWidth = getChartDivWidth();


    //- Set Chart Area; excludes the margins
    let chartHeight = (svgHeight - _chartMargin.top - _chartMargin.bottom);
    let chartWidth = (_chartDivWidth - _chartMargin.left - _chartMargin.right);

    //- Create SVG Container
    let svgContainer = d3.select("body").select(CHARTDIVNAME).append("svg")
        .attr("height", svgHeight)
        .attr("width", _chartDivWidth);

    //- Create Chart Group within SVG
    //  Shift based on the margins
    let svgChartGroup = svgContainer.append("g")
        .attr("transform", `translate(${_chartMargin.left}, ${_chartMargin.top})`);


    //- Prepare Tool-Tip
    let toolTip = createToolTip();

    svgContainer.call(toolTip);


    //-- Create Chart
    //- Prepare X
    let xScale = d3.scaleLinear()
        .domain([d3.min(sourceData, d => d[_activeChart.xColumnName]) - 0.5, d3.max(sourceData, d => d[_activeChart.xColumnName])])
        .range([0, chartWidth]);

    let xAxis = d3.axisBottom(xScale);


    //- Prepare Y
    let yScale = d3.scaleLinear()
        .domain([d3.min(sourceData, d => d[_activeChart.yColumnName]) -0.5, d3.max(sourceData, d => d[_activeChart.yColumnName])])
        .range([chartHeight, 0]);
    
    let yAxis = d3.axisLeft(yScale);

    //- Create X-Y Axis
    svgChartGroup.append("g")
        .attr("transform", `translate(0, ${chartHeight})`)
        .attr("class", "xaxis")
        .call(xAxis);

    svgChartGroup.append("g")
        .attr("class", "yaxis")
        .call(yAxis);


    //- Create Points
    let circleGroup = svgChartGroup.selectAll("circle")
        .data(sourceData)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d[_activeChart.xColumnName]))
        .attr("cy", d => yScale(d[_activeChart.yColumnName]))
        .attr("r", "12")
        .attr("class", "stateCircle")
        .on("mouseover", toolTip.show)
        .on("mouseout", toolTip.hide);


    //- Create Labels
    //  These labels are to be placed within own "g" otherwise the selectAll("text") picks up the 
    //  axis text that results in a number of labels not being displaced
    let svgLabelGroup = svgChartGroup.append("g");

    let textMarkerGroup = svgLabelGroup.selectAll("text")
        .data(sourceData)
        .enter()
        .append("text")
        .attr("x", d => xScale(d[_activeChart.xColumnName]) )
        .attr("y", d => yScale(d[_activeChart.yColumnName]) + 4)
        .attr("class", "stateText")
        .text(d => d.abbr)
        .on("mouseover", toolTip.show)
        .on("mouseout", toolTip.hide);


    //-- Create Axis Labels
    let svgAxisLabelGroup = svgChartGroup.append("g");

    //- Y: Lacks Healthcare
    svgAxisLabelGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - _chartMargin.left + 55)
        .attr("x", 0 - (chartHeight / 2))
        .attr("class", YAXISACTIVECLASS)
        .attr("id", "healthcare")
        .text("Lacks Healthcare (%)")
        .on("click", updateYAxisChartData);

    //- Y: Smokes
    svgAxisLabelGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - _chartMargin.left + 35)
        .attr("x", 0 - (chartHeight / 2))
        .attr("class", YAXISINACTIVECLASS)
        .attr("id", "smokes")
        .text("Smokes (%)")
        .on("click", updateYAxisChartData);

    //- Y: Obese
    svgAxisLabelGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - _chartMargin.left + 15)
        .attr("x", 0 - (chartHeight / 2))
        .attr("class", YAXISINACTIVECLASS)
        .attr("id", "obesity")
        .text("Obese (%)")
        .on("click", updateYAxisChartData);


    //- X: In Poverty
    svgAxisLabelGroup.append("text")
        .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + _chartMargin.top - 28})`)
        .attr("class", XAXISACTIVECLASS)
        .attr("id", "poverty")
        .text("In Poverty (%)")
        .on("click", updateXAxisChartData);

    //- X: Age
    svgAxisLabelGroup.append("text")
        .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + _chartMargin.top - 8})`)
        .attr("class", XAXISINACTIVECLASS)
        .attr("id", "age")
        .text("Age (Median)")
        .on("click", updateXAxisChartData);

    //- X: Income
    svgAxisLabelGroup.append("text")
        .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + _chartMargin.top +12})`)
        .attr("class", XAXISINACTIVECLASS)
        .attr("id", "income")
        .text("Household Income (Median)")
        .on("click", updateXAxisChartData);

}

function createToolTip(){
    /* Creates the d3.tip using metadata from the _activeChart

    Accepts : nothing

    Returns : (d3.tip) created using information from _activeChart
    */

    console.log("--> createToolTip");

    return d3.tip()
        .attr("class", "d3-tip")
        .offset([-8,0])
        .html(d => {
            return `<h6>${d.state}</h6>${_activeChart.xDisplayName}: ${d[_activeChart.xColumnName]}%<br/>` +
                         `${_activeChart.yDisplayName}: ${d[_activeChart.yColumnName]}%`;
        });
}


function updateToolTip(){
    /* Updates the tooltip that is to be used when the user changes the X or Y axis.
    Assumption that the _activeChart has been previously updated.

    Accepts : nothing

    Returns : undefined
    */

    console.log("--> updateToolTip");


    //- Create Tooltip with dataset
    let toolTip = createToolTip();

    //- Set with Circle
    d3.selectAll("circle")
        .on("mouseover", toolTip.show)
        .on("mouseout", toolTip.hide);

    //- Set with Labels
    d3.selectAll(".stateText")
        .on("mouseover", toolTip.show)
        .on("mouseout", toolTip.hide);

    //- Apply to SVG
    d3.select("svg").call(toolTip);
}


function updateXAxisChartData(){
    /* Updates the chart when user clicks button; the "this" object contains the text element that the user
    selected.  The ID of that element contains the unique identifier for the data to use.  Update the 
    active/inactive state of the buttons and then updates the chart.

    Accepts : nothing

    Returns : undefined
    */

   console.log("--> updateXAxisChartData");


   //-- Get Unique Identifer of data
   let dataId = this.id;
   
   console.log(`Unique identifier of data: ${dataId}`)


    //-- Update Active Chart
    if (dataId == "age"){
        _activeChart.xDisplayName = "Age (Median)";
        _activeChart.xColumnName = dataId;
    }
    else if (dataId == "poverty"){
        _activeChart.xDisplayName = "In Poverty (%)";
        _activeChart.xColumnName = dataId;
    }
    else if (dataId == "income")
    {
        _activeChart.xDisplayName = "Household Income (Median)";
        _activeChart.xColumnName = dataId;
    }
    else
    {
        throw(`Unable to update chart; invalid dataId: ${dataId}`);
    }


    //-- Update Buttons

    //- Set inactive class
    d3.select(CHARTDIVNAME).selectAll(".xAxis").attr("class", XAXISINACTIVECLASS);

    //- Make Active
    d3.select(`#${dataId}`).attr("class", XAXISACTIVECLASS);


    //-- Update Chart

    //- X-Axis
    let chartWidth = (_chartDivWidth - _chartMargin.left - _chartMargin.right);

    let xScale = d3.scaleLinear()
        .domain([d3.min(_sourceChartData, d => d[dataId]) - 0.5, d3.max(_sourceChartData, d => d[dataId])])
        .range([0, chartWidth]);

    let xAxis = d3.axisBottom(xScale);


    //- Update Chart: X-Axis
    let transitionDuration = getTransitionDuration();

    d3.select(".xaxis")
        .transition(transitionDuration)
        .call(xAxis);


    //- Update Chart: Circles
    d3.selectAll("circle")
        .transition(transitionDuration)
        .attr("cx", d => xScale(d[dataId]));


    //- Update Chart: Labels
    d3.selectAll(".stateText")
        .transition(transitionDuration)
        .attr("x", d=> xScale(d[dataId]));


    //-- Update Tool Tip
    updateToolTip()
}


function updateYAxisChartData(){
    /* Updates the chart when user clicks button; the "this" object contains the text element that the user
    selected.  The ID of that element contains the unique identifier for the data to use.  Update the 
    active/inactive state of the buttons and then updates the chart.

    Accepts : nothing

    Returns : undefined
    */

    console.log("--> updateYAxisChartData");


    //-- Get Unique Identifer of data
    let dataId = this.id;

    console.log(`Unique identifier of data: ${dataId}`)



    //-- Update Active Chart
    if (dataId == "obesity"){
        _activeChart.yDisplayName = "Obese (%)";
        _activeChart.yColumnName = dataId;
    }
    else if (dataId == "smokes"){
        _activeChart.yDisplayName = "Smokes (%)";
        _activeChart.yColumnName = dataId;
    }
    else if (dataId == "healthcare")
    {
        _activeChart.yDisplayName = "Lacks Healthcare (%)";
        _activeChart.yColumnName = dataId;
    }
    else
    {
        throw(`Unable to update chart; invalid dataId: ${dataId}`);
    }

    //-- Update Buttons

    //- Set inactive class
    d3.select(CHARTDIVNAME).selectAll(".yAxis").attr("class", YAXISINACTIVECLASS);

    //- Make Active
    d3.select(`#${dataId}`).attr("class", YAXISACTIVECLASS);


    //-- Update Chart
    //- Update Y-Axis
    let svgHeight = getSvgHeight();
    let chartHeight = (svgHeight - _chartMargin.top - _chartMargin.bottom);

    let yScale = d3.scaleLinear()
        .domain([d3.min(_sourceChartData, d => d[dataId]) -0.5, d3.max(_sourceChartData, d => d[dataId])])
        .range([chartHeight, 0]);

    let yAxis = d3.axisLeft(yScale);


    //- Update Chart: Y-Axis
    let transitionDuration = getTransitionDuration();

    d3.select(".yaxis")
        .transition(transitionDuration)
        .call(yAxis);


    //- Update Chart: Circles
    d3.selectAll("circle")
        .transition(transitionDuration)
        .attr("cy", d=> yScale(d[dataId]));
    

    //- Update Chart: Labels
    d3.selectAll(".stateText")
        .transition(transitionDuration)
        .attr("y", d=> yScale(d[dataId]) + 4);
    

   //-- Update Tooltip
   updateToolTip();
}


// .on("mouseover", function(d) {
        //     d3.select(this).attr("fill", "red");
        //     toolTip.show(this);
        // })

        // .on("mouseover", toolTip.show)

        // d3.select(".d3-tip").html(d => {return "scott";})
/*

// 1 Create Chart
//  -> include labels that are clickable

// 2 Update Chart
//  -> based on click event, use transition
//  - pass in object used with labels/x/y

3 Update tool tip with the multiple axis

4 responsive
 - height
 - keep selected axis; not return to default
*/




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
