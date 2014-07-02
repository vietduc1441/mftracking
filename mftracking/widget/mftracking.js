/*! mftracking 2014-07-02 */

dojo.provide("mftracking.widget.mftracking"),dojo.require("mftracking.widget.lib.d3"),dojo.require("mftracking.widget.lib.d3_tip"),mf={addons:[],inputargs:{title:""},recordBtn:null,clearStatBtn:null,displayBtn:null,liveMfBtn:null,oldActionFunction:{isOverWritten:!1,oldAction:null,redrawTimer:null},graphDlg:null,mfStatDict:{},width:800,isDataUpdated:!1,height:500,eventHandlers:[],summerizeTooltip:null,liveMfTooltip:null,summerizeChartId:"mfchart",liveMfChartId:"livemfchart",earliestTime:null,lastestTime:null,displayProp:function(a){return a.sumData.duration/a.sumData.called_num},postCreate:function(){mxui.dom.addCss("widgets/mftracking/widget/lib/mftracking.css"),console.log("initializing..."),this.createInterface(),this.actLoaded()},createInterface:function(){if(!dojo.query("#mftracking")[0]){this.summerizeTooltip||(this.summerizeTooltip=this.createSummerizedToolTip()),this.liveMfTooltip||(this.liveMfTooltip=this.createLiveMfTooltip());var a=mxui.dom.div({"class":"mftracking"});a.setAttribute("id","mftracking");var b=dojo.query("body")[0];this.createButtons(a),b.appendChild(a)}},createButtons:function(a){this.destroyBtnHandlers();var b=mxui.dom.create;this.recordBtn=b("button",{"class":"btn btn-primary record-btn",title:"Record"},b("i",{"class":"glyphicon glyphicon-record"},""));var c=dojo.connect(this.recordBtn,"click",this.startStopRecord.bind(this));a.appendChild(this.recordBtn),this.eventHandlers.push(c),this.oldActionFunction.isOverWritten&&(this.recordBtn.style.color="red"),this.clearStatBtn=b("button",{"class":"btn btn-primary clear-btn",title:"Clear"},b("i",{"class":"glyphicon glyphicon-ban-circle"},""));var d=dojo.connect(this.clearStatBtn,"click",this.clearCollectedData.bind(this));a.appendChild(this.clearStatBtn),this.eventHandlers.push(d),this.liveMfBtn=b("button",{"class":"btn btn-primary livemf-btn",title:"Live"},b("i",{"class":"glyphicon glyphicon-eye-open"},""));var e=dojo.connect(this.liveMfBtn,"click",this.toggleChart.bind(this,this.liveMfChartId,this.liveMfBtn));a.appendChild(this.liveMfBtn),this.eventHandlers.push(e),this.displayBtn=b("button",{"class":"btn btn-primary display-btn",title:"Summary"},b("i",{"class":"glyphicon glyphicon-stats"},""));var f=dojo.connect(this.displayBtn,"click",this.toggleChart.bind(this,this.summerizeChartId,this.displayBtn));a.appendChild(this.displayBtn),this.eventHandlers.push(f)},startStopRecord:function(){this.oldActionFunction.isOverWritten?(this.resetMxDataAction(),this.recordBtn.style.color="white",clearInterval(this.oldActionFunction.redrawTimer),this.oldActionFunction.redrawTimer=null):(this.overwriteFunc(),this.recordBtn.style.color="red",null===this.oldActionFunction.redrawTimer&&(this.createSummerizeGraph.bind(this)(),this.oldActionFunction.redrawTimer=setInterval(this.createGraphs.bind(this),1e3)))},createGraphs:function(){this.createSummerizeGraph(),this.createLiveMfGraph(),this.isDataUpdated=!1},getParentOfChart:function(a){var b=d3.select("#mftracking #"+a);if(b[0][0])return b[0][0].parentNode},toggleChart:function(a,b){var c=this.getParentOfChart(a);if(c){var d=c.style.display;"none"===d?(b&&(b.style.color="green"),c.style.display="block"):(b&&(b.style.color="white"),c.style.display="none")}},initGraph:function(a,b,c,d){var e=a.margin,f=a.width-e.left-e.right,g=a.height-e.top-e.bottom,h=d3.select("#"+c);if(h&&null===h[0][0]){var i=d3.select(b).append("svg").attr("width",a.width).style("left",-1*a.width+200+"px").attr("height",a.height).style("top",-1*a.height+"px").style("display","none").call(a.tooltip);i.append("rect").attr("class","background").attr("x",0).attr("y",0).attr("rx",3).attr("ry",3).attr("width",a.width).attr("height",a.height),i.append("text").attr("class","title").attr("x",f/2).attr("y",40).text(d);var j=i.append("g").attr("id",c).attr("transform","translate("+e.left+","+(g+e.top)+") scale(1,-1)");return j.innerWidth=f,j.innerHeight=g,j}return h.innerWidth=f,h.innerHeight=g,h},createSummerizeGraph:function(){var a={width:this.width,height:this.height,tooltip:this.summerizeTooltip};a.margin={top:60,right:75,bottom:30,left:5};var b=this.initGraph(a,"#mftracking",this.summerizeChartId,"Summary");return this.isDataUpdated&&this.updateSummerizedData(this.mfStatDict,a,this.displayProp,b),b},createSummerizedToolTip:function(){var a=this.displayProp;return d3.tip().attr("class","d3-tip").offset([0,0]).direction("s").html(function(b){return"<strong>Average latency: </strong> <span style='color:white'>"+parseInt(a(b))+" ms</span><br/><strong> Error percentage: </strong> <span style='color:red'>"+parseInt(100*(b.sumData.error/(b.sumData.error+b.sumData.success)))+"%</span>"})},summerizeData:function(a){var b={duration:0,error:0,success:0,called_num:0};return a.forEach(function(a){b.duration+=a.finish-a.start,a.success?b.success++:b.error++,b.called_num++}),b},updateSummerizedData:function(a,b,c,d){function e(a){return 0===a?"":a+" ms"}d3.selectAll(".xAxis").remove(),d3.selectAll(".yAxis").remove();var f=this.summerizeData,g=d3.entries(a);g.forEach(function(a){a.sumData=f(a.value)});var h=g.sort(function(a,b){return c(b)-c(a)}),i=d.innerWidth,j=d.innerHeight,k=d3.scale.ordinal().domain(h.map(function(a){return a.key.split(".")[1]})).rangeRoundBands([0,i],.1,0),l=d3.svg.axis().scale(k).orient("bottom");d.append("g").attr("class","xAxis").attr("transform","translate(0,0) scale(1,-1)").call(l);var m=d3.scale.linear().domain([0,d3.max(g,c)]).range([0,j]),n=d3.svg.axis().scale(m).tickSize(i+20).tickFormat(e).orient("right").ticks(10,"ms"),o=k.rangeBand(),p=d.selectAll(".bar").data(h,function(a){return a.key}),q=p.transition().attr("transform",function(a){return"translate("+k(a.key.split(".")[1])+",0)"});q.select("rect").attr("width",o).attr("height",function(a){return m(c(a))});var r=p.enter().append("g").attr("class","bar").attr("transform",function(a){return"translate("+k(a.key.split(".")[1])+",0)"});r.append("rect").attr("x",0).attr("y",0).attr("width",o).attr("height",function(a){return m(c(a))}).on("mouseover",b.tooltip.show).on("mouseout",b.tooltip.hide),p.exit().transition().remove();var s=d.append("g").attr("class","yAxis").call(n);s.selectAll("text").attr("transform","scale(1,-1)")},createLiveMfTooltip:function(){return d3.tip().attr("class","d3-tip").offset([0,0]).direction("s").html(function(){return"<strong>Average latency: </strong> <span style='color:white'> ms</span><br/>"})},createLiveMfGraph:function(){var a={width:this.width,height:this.height,tooltip:this.liveMfTooltip};a.margin={top:80,right:20,bottom:20,left:20};var b=this.initGraph(a,"#mftracking",this.liveMfChartId,"Microflow Latency");return this.isDataUpdated&&this.updateLiveMfData(this.mfStatDict,a,b),b},extractLiveItems:function(a){var b=[];return a.forEach(function(a){var c=a.key;a.value.forEach(function(a){b.push({mf:c,value:a})})}),b},updateLiveMfData:function(a,b,c){var d=d3.entries(a),e=this.extractLiveItems(d).sort(function(a,b){return a.value.start-b.value.start});e.length>21&&e.splice(0,e.length-21);var f=100,g=10,h=c.innerWidth-f-g,i=c.innerHeight,j=d3.scale.linear().domain([0,d3.max(e,function(a){return a.value.finish-a.value.start})]).range([0,h]),k=15,l=4,m=function(a){return i-(k+l)*a},n=function(a){return j(a.value.finish-a.value.start)},o=c.selectAll(".livemf").data(e,function(a){return a.mf+a.value.start}),p=o.transition().attr("transform",function(a,b){return"translate (0,"+m(b)+")"});p.select(".bar").attr("width",n);var q=o.enter().append("g").attr("class","livemf").attr("transform",function(a,b){return"translate (0,"+m(b)+")"});q.append("rect").attr("class","livebackground").attr("x",0).attr("y",0).attr("rx",3).attr("ry",3).attr("width",c.innerWidth).attr("height",k+l),q.append("rect").attr("class","bar").attr("x",f).attr("y",l/2).attr("rx",3).attr("ry",3).attr("width",n).attr("height",k).style("fill",function(a){return a.value.success?"limegreen":"#CC0000"}),q.append("text").attr("x",0).attr("y",-1*l/2).attr("transform","scale(1,-1)").text(function(a){return a.mf.split(".")[1]}),q.append("title").text(function(a){return a.value.finish-a.value.start+" ms"}),o.exit().transition().remove()},applyContext:function(a,b){b&&b()},overwriteFunc:function(){this.overwriteMxCalls()},clearCollectedData:function(){for(var a in this.mfStatDict)delete this.mfStatDict[a];this.isDataUpdated=!0,this.earliestTime=null,this.lastestTime=null,this.createGraphs()},logMfActionResult:function(a,b,c,d,e){this.isDataUpdated=!0,null===this.earliestTime&&(this.earliestTime=b),(null===this.lastestTime||this.lastestTime<c)&&(this.lastestTime=c),this.mfStatDict[a]||(this.mfStatDict[a]=[]),this.mfStatDict[a].push({start:b,finish:c,numOfObjs:d,success:e})},overwriteMxDataAction:function(){var a=this.oldActionFunction.oldAction=mx.data.action;this.oldActionFunction.isOverWritten=!0;var b=this;mx.data.action=function(c){var d=(new Date).getTime(),e=c.params.actionname;if(c.params.actionname){var f=c.callback;f&&(c.callback=function(a){var c=(new Date).getTime();return b.logMfActionResult(e,d,c,a.length,!0),f.apply(this,arguments)});var g=c.error;g&&(c.error=function(){var a=(new Date).getTime();return b.logMfActionResult(e,d,a,null,!1),g.apply(this,arguments)})}return a.apply(this,arguments)}},resetMxDataAction:function(){mx.data.action=this.oldActionFunction.oldAction,this.oldActionFunction.isOverWritten=!1,this.oldActionFunction.oldAction=null},overwriteOnError:function(){var a=window.onerror;window.onerror=function(b,c,d,e){return console.log("there is an error"),console.log("send to server:"),console.log(e),a?a(b,c,d):!1}},overwriteConsoleError:function(){var a=console.error;console.error=function(b){a(b),console.log("send to server")}},overwriteMxCalls:function(){this.overwriteMxDataAction()},destroyBtnHandlers:function(){this.eventHandlers.forEach(function(a){dojo.disconnect(a)})},uninitialize:function(){this.destroyBtnHandlers()}},mendix.widget.declare("mftracking.widget.mftracking",mf);
//# sourceMappingURL=mftracking/widget/sourcemap.map