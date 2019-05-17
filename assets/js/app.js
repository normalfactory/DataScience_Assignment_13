/*


Scott McEachern
May 13, 2019


- Responsive

*/


console.log("--> app.js: Started initialization of application");


//- Prepare Globals
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


function getSvgHeight(){
    /* Returns the height of the svg container; it is always calculated to be 50% of window height

    Accepts : nothing

    Returns : (number) height of the container in px
    */

    return (window.innerHeight * 0.5);
}


function createChart(sourceData){
    /*

    Accepts : sourceData (list, dictionary) contains the dataset, one element in the array for each state

    Returns : undefined
    */

    console.log("--> createChart: Started function");


    var chartInfo = {
        xColumnName: "poverty",
        yColumnName: "healthcare",
        xDisplayName: "Poverty",
        yDisplayName: "Lacks Healthcare"
    }


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
    let toolTip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-8,0])
        .html( d => {
            return `<h6>${d.state}</h6>${chartInfo.xDisplayName}: ${d[chartInfo.xColumnName]}%<br/>` +
                `${chartInfo.yDisplayName}: ${d[chartInfo.yColumnName]}%`;
        });

    svgContainer.call(toolTip);



    //-- Create Chart
    //- Prepare X
    let xScale = d3.scaleLinear()
        .domain([d3.min(sourceData, d => d[chartInfo.xColumnName]) - 0.5, d3.max(sourceData, d => d[chartInfo.xColumnName])])
        .range([0, chartWidth]);

    let xAxis = d3.axisBottom(xScale);


    //- Prepare Y
    let yScale = d3.scaleLinear()
        .domain([d3.min(sourceData, d => d[chartInfo.yColumnName]) -0.5, d3.max(sourceData, d => d[chartInfo.yColumnName])])
        .range([chartHeight, 0]);
    
    let yAxis = d3.axisLeft(yScale);

    //- Create X-Y Axis
    svgChartGroup.append("g")
        .attr("transform", `translate(0, ${chartHeight})`)
        .call(xAxis);

    svgChartGroup.append("g")
        .attr("class", "yaxis")
        .call(yAxis);


    //- Create Points
    let circleGroup = svgChartGroup.selectAll("circle")
        .data(sourceData)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d[chartInfo.xColumnName]))
        .attr("cy", d => yScale(d[chartInfo.yColumnName]))
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
        .attr("x", d => xScale(d[chartInfo.xColumnName]) )
        .attr("y", d => yScale(d[chartInfo.yColumnName]) + 4)
        .attr("class", "stateText")
        .text(d => d.abbr);


    //-- Create Axis Labels
    let svgAxisLabelGroup = svgChartGroup.append("g");

    //- Y: Lacks Healthcare
    svgAxisLabelGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - _chartMargin.left + 55)
        .attr("x", 0 - (chartHeight / 2))
        .attr("class", YAXISACTIVECLASS)
        .attr("id", "healthcare")
        .text("Lacks Healthcare(%)")
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


function updateXAxisChartData(){
    /*

    */

   console.log("--> updateXAxisChartData");


   //-- Get Unique Identifer of data
   let dataId = this.id;

   console.log(`Unique identifier of data: ${dataId}`)


    //-- Update Buttons

    //- Set inactive class
    d3.select(CHARTDIVNAME).selectAll(".xAxis").attr("class", XAXISINACTIVECLASS);

    //- Make Active
    d3.select(`#${dataId}`).attr("class", XAXISACTIVECLASS);


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


    //-- Update Buttons

    //- Set inactive class
    d3.select(CHARTDIVNAME).selectAll(".yAxis").attr("class", YAXISINACTIVECLASS);

    //- Make Active
    d3.select(`#${dataId}`).attr("class", YAXISACTIVECLASS);



    //- Update Y-Axis
    let svgHeight = getSvgHeight();
    let chartHeight = (svgHeight - _chartMargin.top - _chartMargin.bottom);

    let yScale = d3.scaleLinear()
        .domain([d3.min(_sourceChartData, d => d[dataId]) -0.5, d3.max(_sourceChartData, d => d[dataId])])
        .range([chartHeight, 0]);

    let yAxis = d3.axisLeft(yScale);


    //- Update Chart: Y-Axis
    let transitionDuration = d3.transition().duration(500);

    d3.select(".yaxis")
        .transition(transitionDuration)
        .call(yAxis);


    //- Update Chart: Circles
    d3.selectAll("circle")
        .transition(transitionDuration)
        .attr("cy", d=> yScale(d[dataId]))
    

    //- Update Chart: Labels
    d3.selectAll(".stateText")
        .transition(transitionDuration)
        .attr("y", d=> yScale(d[dataId]) + 4)
    
}


// .on("mouseover", function(d) {
        //     d3.select(this).attr("fill", "red");
        //     toolTip.show(this);
        // })

        // .on("mouseover", toolTip.show)

/*

1 Create Chart
 -> include labels that are clickable

2 Update Chart
 -> based on click event, use transition
 - pass in object used with labels/x/y



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
