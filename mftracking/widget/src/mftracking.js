dojo.provide("mftracking.widget.mftracking");
dojo.require("mftracking.widget.lib.d3");
dojo.require("mftracking.widget.lib.d3_tip");

mf = {
    addons: [],
    inputargs: {
        title: ''
    },
    recordBtn: null,
    clearStatBtn: null,
    displayBtn: null,
    liveMfBtn: null,
    oldActionFunction: {isOverWritten: false, oldAction: null, redrawTimer: null},
    graphDlg: null,
    mfStatDict: {}, //todo: a class for this
    width: 800,
    isDataUpdated: false,
    height: 500,
    eventHandlers: [],
    summerizeTooltip: null,
    liveMfTooltip: null,
    summerizeChartId: "mfchart",
    liveMfChartId: "livemfchart",
    earliestTime: null,
    lastestTime: null,
    displayProp: function(d) {
        return d.sumData.duration / d.sumData.called_num;
    },
    postCreate: function() {
        mxui.dom.addCss("widgets/mftracking/widget/lib/mftracking.css");
        console.log("initializing...");
        this.createInterface();
        this.actLoaded();
    },
    createInterface: function() {
         if (!dojo.query("#mftracking")[0]) {
            if (!this.summerizeTooltip)
                this.summerizeTooltip = this.createSummerizedToolTip();
            if (!this.liveMfTooltip)
                this.liveMfTooltip = this.createLiveMfTooltip();       
            var mftrackingDiv = mxui.dom.div({'class': "mftracking"});
            mftrackingDiv.setAttribute("id", 'mftracking');//set ID
            var body = dojo.query("body")[0];
            this.createButtons(mftrackingDiv);
            body.appendChild(mftrackingDiv);//add as node
        }
    },
    createButtons: function(mftrackingDiv) {
        this.destroyBtnHandlers();//if any
        var $ = mxui.dom.create;
        //record
        this.recordBtn = $("button", {"class": "btn btn-primary record-btn", "title": "Record"}, $("i", {"class": "glyphicon glyphicon-record"}, ""));
        var recHandler = dojo.connect(this.recordBtn, "click", this.startStopRecord.bind(this));
        mftrackingDiv.appendChild(this.recordBtn);
        this.eventHandlers.push(recHandler);
        //if is currently recording
        if (this.oldActionFunction.isOverWritten) {//recording
            this.recordBtn.style.color = "red";
        }
        //clear
        this.clearStatBtn = $("button", {"class": "btn btn-primary clear-btn", "title": "Clear"}, $("i", {"class": "glyphicon glyphicon-ban-circle"}, ""));
        var clearHandler = dojo.connect(this.clearStatBtn, "click", this.clearCollectedData.bind(this));
        mftrackingDiv.appendChild(this.clearStatBtn);
        this.eventHandlers.push(clearHandler);
        //activity in live
        this.liveMfBtn = $("button", {"class": "btn btn-primary livemf-btn", "title": "Live"}, $("i", {"class": "glyphicon glyphicon-eye-open"}, ""));
        var liveMfHandler = dojo.connect(this.liveMfBtn, "click", this.toggleChart.bind(this, this.liveMfChartId, this.liveMfBtn));
        mftrackingDiv.appendChild(this.liveMfBtn);
        this.eventHandlers.push(liveMfHandler);
        //display
        this.displayBtn = $("button", {"class": "btn btn-primary display-btn", "title": "Summary"}, $("i", {"class": "glyphicon glyphicon-stats"}, ""));
        var displayHandler = dojo.connect(this.displayBtn, "click", this.toggleChart.bind(this, this.summerizeChartId, this.displayBtn));
        mftrackingDiv.appendChild(this.displayBtn);
        this.eventHandlers.push(displayHandler);

    },
    startStopRecord: function() {
        if (!this.oldActionFunction.isOverWritten) {//start
            this.overwriteFunc();
            this.recordBtn.style.color = "red";
            if (this.oldActionFunction.redrawTimer === null) {
                (this.createSummerizeGraph.bind(this))();
                this.oldActionFunction.redrawTimer = setInterval(this.createGraphs.bind(this), 1000);//redraw every 1s
            }
        }
        else {//stop
            this.resetMxDataAction();
            this.recordBtn.style.color = "white";
            clearInterval(this.oldActionFunction.redrawTimer);
            this.oldActionFunction.redrawTimer = null;
        }
    },
    createGraphs: function() {
        this.createSummerizeGraph();
        this.createLiveMfGraph();
        this.isDataUpdated = false;
    },
    getParentOfChart: function(chartId) {
        var chart = d3.select("#mftracking #" + chartId);
        if (!chart[0][0])
            return;
        return chart[0][0].parentNode;
    },
    toggleChart: function(chartId, sender) {
        var container = this.getParentOfChart(chartId);
        if (!container)
            return;
//        var allContainers=d3.select("#mftracking svg");
//        allContainers.style("display","none");
        var curDisplay = container.style.display;
        if (curDisplay === "none") {//if closed
            sender && (sender.style.color = "green");
            container.style.display = "block";
        }
        else {//if opened
            sender && (sender.style.color = "white");
            container.style.display = "none";
        }
    },
    initGraph: function(config, parendNodeId, chartId, title) {
        var margin = config.margin,
        innerWidth = config.width - margin.left - margin.right,
                innerHeight = config.height - margin.top - margin.bottom;
        var existedChart = d3.select("#" + chartId);
        if (existedChart && existedChart[0][0] === null) {
            var svg = d3.select(parendNodeId).append("svg")
                    .attr("width", config.width)
                    .style("left",((-1)*config.width+200 )+ "px")
                    .attr("height", config.height)
                    .style("top",((-1)*config.height)+"px")
                    .style("display", "none")
                    .call(config.tooltip);
            svg.append("rect")
                    .attr("class", "background")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("rx", 3)
                    .attr("ry", 3)
                    .attr("width", config.width)
                    .attr("height", config.height);
            //title
            svg.append("text")
                    .attr("class","title")
                    .attr("x", innerWidth/2)
                    .attr("y", 40)
                    .text(title);
            var chart = svg.append("g")
                    .attr("id", chartId)
                    .attr("transform", "translate(" + margin.left + "," + (innerHeight + margin.top) + ") scale(1,-1)");
            chart.innerWidth = innerWidth;
            chart.innerHeight = innerHeight;
            return chart;
        }
        existedChart.innerWidth = innerWidth;
        existedChart.innerHeight = innerHeight;
        return existedChart;
    },
    createSummerizeGraph: function() {
        var configObj = {"width": this.width, "height": this.height, "tooltip": this.summerizeTooltip};
        configObj.margin={top: 60, right: 75, bottom: 30, left: 5};
        var chart = this.initGraph(configObj, "#mftracking", this.summerizeChartId, "Summary");
        if (this.isDataUpdated) {
            this.updateSummerizedData(this.mfStatDict,
                    configObj,
                    this.displayProp,
                    chart);
        }
        return chart;
    },
    createSummerizedToolTip: function() {
        var displayProp = this.displayProp;
        return d3.tip()
                .attr('class', 'd3-tip')
                .offset([00, 00])
                .direction("s")
                .html(function(d) {
                    return   "<strong>Average latency: </strong> <span style='color:white'>" + parseInt(displayProp(d)) + " ms</span><br/>"
                            + "<strong> Error percentage: </strong> <span style='color:red'>" + parseInt(100 * (d.sumData.error / (d.sumData.error + d.sumData.success))) + "%</span>";
                });
    },
    summerizeData: function(colData) {
        var sum = {duration: 0, error: 0, success: 0, called_num: 0};
        colData.forEach(function(aResult) {
            sum.duration += (aResult.finish - aResult.start);
            !aResult.success ? sum.error++ : sum.success++;
            sum.called_num++;
        });
        return sum;
    },
    updateSummerizedData: function(mfStatDict, config, displayProp, chart) {
        d3.selectAll(".xAxis").remove();
        d3.selectAll(".yAxis").remove();
        var summerizeData = this.summerizeData;
        var statData = d3.entries(mfStatDict);//if the data manipulation takes too much time, think about use web worker here.
        statData.forEach(function(dataForAMf) {
            dataForAMf.sumData = summerizeData(dataForAMf.value);
        });
        function formatMiliSec(d) {
            return d === 0 ? "" : d + " ms";
        }
        var data = statData.sort(function(e1, e2) {
            return displayProp(e2) - displayProp(e1);
        });
        var innerWidth = chart.innerWidth,
                innerHeight = chart.innerHeight;
        var x = d3.scale.ordinal()
                .domain(data.map(function(d) {
                    return d["key"].split(".")[1];
                }))
                .rangeRoundBands([0, innerWidth], 0.1, 0);


        var xAxisFunc = d3.svg.axis()
                .scale(x)
                .orient("bottom");
        chart.append("g")
                .attr("class", "xAxis")
                .attr("transform", "translate(0,0) scale(1,-1)")
                .call(xAxisFunc);

        var y = d3.scale.linear()
                .domain([0, d3.max(statData, displayProp)])
                .range([0, innerHeight]);
        var yAxisFunc = d3.svg.axis()
                .scale(y)
                .tickSize(innerWidth + 20)
                .tickFormat(formatMiliSec)
                .orient("right")
                .ticks(10, "ms");
        var barWidth = x.rangeBand();
        //Join
        var bar = chart.selectAll(".bar")
                .data(data, function(d) {
                    return d.key;
                });
        //Update
        var barUpdate = bar.transition()
                .attr("transform", function(d, i) {
                    return "translate(" + x(d.key.split(".")[1]) + ",0)";
                });
        barUpdate.select("rect")
                .attr("width", barWidth)
                .attr("height", function(d) {
                    return y(displayProp(d));
                });
        //Enter
        var barEnter = bar.enter().append("g")
                .attr("class", "bar")
                .attr("transform", function(d, i) {
                    return "translate(" + x(d.key.split(".")[1]) + ",0)";
                });
        barEnter.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", barWidth)
                .attr("height", function(d) {
                    return y(displayProp(d));
                })
                .on('mouseover', config.tooltip.show)
                .on('mouseout', config.tooltip.hide);
        //Exit
        bar.exit().transition().remove();
        var yAxis = chart.append("g")
                .attr("class", "yAxis")
                .call(yAxisFunc);
        yAxis.selectAll("text")
                .attr("transform", "scale(1,-1)");
    },
    createLiveMfTooltip: function() {
        return d3.tip()
                .attr('class', 'd3-tip')
                .offset([00, 00])
                .direction("s")
                .html(function(d) {
                    return   "<strong>Average latency: </strong> <span style='color:white'>" + " ms</span><br/>";
                });
    },
    createLiveMfGraph: function() {
        var configObj = {"width": this.width, "height": this.height, "tooltip": this.liveMfTooltip};
        configObj.margin={top: 80, right: 20, bottom: 20, left: 20};
        var chart = this.initGraph(configObj, "#mftracking", this.liveMfChartId, "Microflow Latency");
        if (this.isDataUpdated) {
            this.updateLiveMfData(this.mfStatDict,
                    configObj,
                    chart);
        }
        return chart;
    },
    extractLiveItems: function(statData) {
        var result = [];
        statData.forEach(function(mfRecord) {
            var mfName = mfRecord.key;
            mfRecord.value.forEach(function(mf) {
                result.push({"mf": mfName, "value": mf});
            });
        });
        return result;
        //output: mf: mfname, value: {start,finish,...}
    },
    updateLiveMfData: function(mfStatDict, config, chart) {
        var statData = d3.entries(mfStatDict);
        var data = this.extractLiveItems(statData).sort(function(e1,e2){
                                                            return e1.value.start-e2.value.start;
                                                        });//sort based on start value
        if (data.length>21){
            data.splice(0,data.length-21);
        }
        var     mfTitleWidth=100,//for mf name
                marginLeft=10,
                innerWidth=chart.innerWidth-mfTitleWidth-marginLeft,
                innerHeight=chart.innerHeight;
            
        var x = d3.scale.linear()
                .domain([0,d3.max(data,function(d){return d.value.finish-d.value.start;})])
                .range([0,innerWidth]);
        var mfHeight=15,
            mfDis=4;
        
        var y = function(index){return innerHeight-(mfHeight+mfDis)*index;};
        
        var latencyMfFunc=function(d){
            return x(d.value.finish-d.value.start);
        };
        //join
        var liveMfs = chart.selectAll(".livemf")
                .data(data, function(d) {
                    return d.mf + d.value.start;
                });
        //Update
        var liveMfUpdate = liveMfs.transition()
                            .attr("transform",function(d,i){return "translate ("+0+","+y(i)+")";});
        liveMfUpdate.select(".bar")
                .attr("width", latencyMfFunc);
        //enter
        var liveMfEnter = liveMfs.enter()
                .append("g")
                .attr("class","livemf")
                .attr("transform",function(d,i){return "translate ("+0+","+y(i)+")";});
        liveMfEnter.append("rect")//background
                .attr("class","livebackground")
                .attr("x",0)
                .attr("y",0)
                .attr("rx", 3)
                .attr("ry", 3)
                .attr("width",chart.innerWidth)
                .attr("height",mfHeight+mfDis);
        liveMfEnter.append("rect")//bar
                .attr("class","bar")
                .attr("x",   mfTitleWidth)
                .attr("y", mfDis/2)
                .attr("rx", 3)
                .attr("ry", 3)
                .attr("width", latencyMfFunc)
                .attr("height", mfHeight)
                .style("fill",function(d){return d.value.success? "limegreen": "#CC0000";});
        liveMfEnter.append("text")//text
                .attr("x", 0)
                .attr("y", (-1)*mfDis/2)
                .attr("transform","scale(1,-1)")
                .text(function(d){return d.mf.split(".")[1];});
        liveMfEnter.append("title")
                .text(function(d){return (d.value.finish-d.value.start)+" ms";});
        //detele
        liveMfs.exit().transition().remove();
    },
    applyContext: function(context, callback) {
        callback && callback();
    },
    overwriteFunc: function() {
        this.overwriteMxCalls();
        //this.overwriteOnError();
        //this.overwriteConsoleError();
    },
    clearCollectedData: function() {
        for (var mf in this.mfStatDict) {
            delete this.mfStatDict[mf];
        }
        this.isDataUpdated = true;
        this.earliestTime=null;
        this.lastestTime=null;
        this.createGraphs();
    },
    logMfActionResult: function(mf, startTime, endTime, resultLength, isSuccess) {
        this.isDataUpdated = true;
        if (this.earliestTime === null)
            this.earliestTime = startTime;
        if (this.lastestTime === null || this.lastestTime < endTime)
            this.lastestTime = endTime;
        if (!this.mfStatDict[mf]) {
            this.mfStatDict[mf] = [];
        }
        this.mfStatDict[mf].push({start: startTime, finish: endTime, numOfObjs: resultLength, success: isSuccess});

    },
    overwriteMxDataAction: function() {
        var _oldActionFunction = this.oldActionFunction.oldAction = mx.data.action;
        this.oldActionFunction.isOverWritten = true;
        var thisWidget = this;
        mx.data.action = function(params) {
            var startTime = (new Date()).getTime();//performance.now()
            var mf = params.params.actionname;
            if (params.params.actionname) {
                var oldMfCallback = params.callback;
                if (oldMfCallback) {
                    params.callback = function(objs) {
                        var endTime = (new Date()).getTime();
                        thisWidget.logMfActionResult(mf, startTime, endTime, objs.length, true);
                        return oldMfCallback.apply(this, arguments);
                    };
                }
                var oldMfError = params.error;
                if (oldMfError) {
                    params.error = function(e) {
                        var endTime = (new Date()).getTime();
                        thisWidget.logMfActionResult(mf, startTime, endTime, null, false);
                        return oldMfError.apply(this, arguments);
                    };
                }
            }
            return _oldActionFunction.apply(this, arguments);
        };
    },
    resetMxDataAction: function() {
        mx.data.action = this.oldActionFunction.oldAction;
        this.oldActionFunction.isOverWritten = false;
        this.oldActionFunction.oldAction = null;
    },
    overwriteOnError: function() {
        var gOldOnError = window.onerror;
        window.onerror = function(errorMsg, url, lineNumber, error) {
            console.log("there is an error");
            console.log("send to server:");
            console.log(error);
            if (gOldOnError)
                return gOldOnError(errorMsg, url, lineNumber);
            return false;
        };
    },
    overwriteConsoleError: function() {
        var olderrlogger = console.error;
        console.error = function(e) {
            olderrlogger(e);
            console.log("send to server");
        };
    },
    overwriteMxCalls: function() {
        this.overwriteMxDataAction();
    },
    destroyBtnHandlers: function() {
        this.eventHandlers.forEach(function(handler) {
            dojo.disconnect(handler);
        });
    },
    uninitialize: function() {
        this.destroyBtnHandlers();
    }
};
mendix.widget.declare("mftracking.widget.mftracking", mf);
//todo: http://www.html5rocks.com/en/tutorials/webperformance/basics/#toc-introduction
//http://ejohn.org/blog/accuracy-of-javascript-time/
/*mfStatDict={
 mf1:[{start: 1,finish: 2, numOfObjs: 3, success: true},
 {start: 3,finish: 4, numOfObjs: 1, success: false},
 {start: 2,finish: 4, numOfObjs: 2, success: true}]
 mf2:[{start: 1,finish: 2, numOfObjs: 3, success: true},
 {start: 3,finish: 4, numOfObjs: 1, success: false},
 {start: 2,finish: 4, numOfObjs: 2, success: true}]
 }
 */