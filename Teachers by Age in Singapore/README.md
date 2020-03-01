# Tutorial

This is a tutorial on how to create a stacked and grouped bar chart using D3. The tools needed are as follows:

- D3 (either downloaded file or refer the D3 link in your file)
- A webserver (Apache / Xampp / Python / etc.)
- [Dataset](https://data.gov.sg/dataset/teachers-in-schools-academic-qualifications-and-length-of-service?resource_id=d1197eaf-4a73-4a7e-a7b9-e2fa6b6b41e5)

### Example result: [D3 - Teachers by Age in schools in Singapore](https://soulifyx.github.io/Teachers%20by%20Age%20in%20Singapore/groupedStackedBarChart.html)


## HTML

```html
<head>
	<meta charset="utf-8">
	<title>Teachers in Singapore Schools by Age</title>
	<style>
		.tooltip {
			background: #eee;
			box-shadow: 0 0 5px #999999;
			color: #333;
			display: block;
			font-size: 14px;
			left: 130px;
			padding: 10px;
			position: absolute;
			text-align: center;
			top: 95px;
			width: 120px;
			z-index: 10;
			opacity:0;
		}
		#selectYear {
			margin-left: 390px;
		}
	</style>
<head>
<body>
	<h1> Teachers in Singapore Schools by Age</h1>
	<div id="chart"></div>
	<script src="d3.v5.min.js"></script>
	<script src="groupedStackedBarChartJs.js"></script>
	<div id="selectYear">
		Year: <select id="year"></select>
	</div>
</body>
```

The HTML should more or less look like this. `.tooltip` css style is for the tooltip we are going to use when the mouse cursor hovers over the bar chart. Meanwhile, `#selectYear div` contains an interactive selection box that if changed by the user, the bar chart will display new data filtered by corresponding year. We will put all the chart-related elements inside the `#chart div`.

## Javascript

To create the bar chart, the process is split into multiple parts:

1. Initialisation
2. Read and process the data
3. Create D3 bar chart elements according to the data
4. Create legends

### 1. Initialisation

```javascript
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 1020 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var legendRectSize = 18;
var legendSpacing = 4;
var legendArea = 250;
var legendX = width - legendArea;
var legendY = 50;    

var x0 = d3.scaleBand()
		.rangeRound([0,width-legendArea])
		.padding(0.1);

var x1 = d3.scaleBand()
		.padding(0.2);

var y0 = d3.scaleLinear()
		.rangeRound([height,0]);

var male = d3.scaleOrdinal()
		.range(["#99ffff", "#00e6e6", "#006666"]);

var female = d3.scaleOrdinal()
		.range(["#ffb3d9", "#ff42a6", "#b30059"]);

var xAxis = d3.axisBottom(x0);

var yAxis = d3.axisLeft(y0);

var stack = d3.stack().offset(d3.stackOffsetZero);

var svg = d3.select("#chart").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
```

Within the initialisation process, we can actually break it down into more sections again for better ease of understanding of what each section does.

```javascript
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 1020 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
```

In this section we simply initialise the width and height of the `svg` to display the chart. Think of `svg` as a canvas and the chart is what you are going to draw on it. It should be big enough to contain the chart and legends.

```javascript
var legendRectSize = 18; //the size of the legend in form of a rectangle
var legendSpacing = 4; //spacing between rectangles and other elements
var legendArea = 250; //area for legend elements
var legendX = width - legendArea; //x value of legend area
var legendY = 50; //y value of legend area
```

These are the variables that are going to be used when creating legends. They can help a lot with calculating the space needed for legend elements.

```javascript
var x0 = d3.scaleBand()
		.rangeRound([0,width-legendArea])
		.padding(0.1);

var x1 = d3.scaleBand()
		.padding(0.2);

var y0 = d3.scaleLinear()
		.rangeRound([height,0]);

var male = d3.scaleOrdinal()
		.range(["#99ffff", "#00e6e6", "#006666"]);

var female = d3.scaleOrdinal()
		.range(["#ffb3d9", "#ff42a6", "#b30059"]);

var xAxis = d3.axisBottom(x0); //assign x0 as the main x axis

var yAxis = d3.axisLeft(y0); //assign y0 as the main y axis
```

`x0` represents the outer x axis of the chart. Conversely, `y0` represents the y axis which is on the left side of the chart. To be able to group the bars (in this case by sex), inner x axis, `x1`, is required. `scaleBand` is used to make multiple bands along the inner and outer x axis. Since the y axis is continuous, `scaleLinear` is used. `scaleOrdinal` range contains color range which is going to represent each layer of a stacked bar. Since we are also going to group the bars by gender, 2 different `scaleOrdinal` is created, with each range being the interpolation of colors.

```javascript
var stack = d3.stack().offset(d3.stackOffsetZero);
```

The above line is used for reorganising the data by stack later.

```javascript
var svg = d3.select("#chart").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
```

The canvas for the chart. `svg` is commonly used for graphs and charts because of its versatility in that department. It is not comprised of pixels unlike other file formats. Instead, it has vectors which is perfect for displaying graphs and charts since they are not as complex as photographic images, thus giving as the ability to zoom in on a chart or graph without losing quality (or become "pixelated"). `g` is a HTML DOM grouping element to group other multiple elements into one.

### 2. Read and Process the Data

```javascript
d3.csv("teachers-in-schools-age.csv").then(function(dataset){ //reads the dataset

	var groupedDatas = d3.nest()
			.key(function(d) {return d.year + " " + d.sex + " " + d.age;})
			.rollup(function(v) {
				var d2 = {Year: v[0].year, Sex: v[0].sex, Age: v[0].age, Total: 0};
				v.forEach(function(d){
					d2[d.level_of_school] = d.no_of_teachers;
				});
				d2.Total = d3.sum(v, function(d) {return +d.no_of_teachers;});
				return d2;
			})
			.entries(dataset)
			.map(function(d) {return d.value;});

	y0.domain([0, d3.max(groupedDatas, function(d) {
			return d.Total;
		})])
		.nice();

	update("1996"); //call function update below

	function update(year){
		
		d3.selectAll(".tooltip").remove();

		var data = dataset.filter(x => x.year == year);
		var year = [... new Set(dataset.map(function(d) {return d.year;}))]
		var ageGroups = [... new Set(data.map(function(d) { return d.age; }))];
		var sex = [... new Set(data.map(function(d) { return d.sex; }))];
		var level = [... new Set(data.map(function(d) { return d.level_of_school; }))].sort(d3.ascending);
    
    x0.domain(ageGroups);
		x1.domain(sex)
			.rangeRound([0,x0.bandwidth()]);

		male.domain(level);
		female.domain(level);

		var options = d3.select("#year")
			.selectAll("option")
			.data(year)
			.enter()
			.append("option")
			.text(function(d) {return d;});

		var groupedData = d3.nest()
			.key(function(d) {return d.sex + " " + d.age;})
			.rollup(function(v) {
				var d2 = {Sex: v[0].sex, Age: v[0].age, Total: 0};
				v.forEach(function(d){
					d2[d.level_of_school] = d.no_of_teachers;
				});
				d2.Total = d3.sum(v, function(d) {return +d.no_of_teachers;});
				return d2;
			})
			.entries(data)
			.map(function(d) {return d.value;});

		var stackData = stack.keys(level)(groupedData);
```

This section is important because we have to process and reorganise the data in a way that it will not bring unnecessary difficulty when going through the processed data in order to display them into a graph.

```javascript
var groupedDatas = d3.nest()
			.key(function(d) {return d.year + " " + d.sex + " " + d.age;})
			.rollup(function(v) {
				var d2 = {Year: v[0].year, Sex: v[0].sex, Age: v[0].age, Total: 0};
				v.forEach(function(d){
					d2[d.level_of_school] = d.no_of_teachers;
				});
				d2.Total = d3.sum(v, function(d) {return +d.no_of_teachers;});
				return d2;
			})
			.entries(dataset)
			.map(function(d) {return d.value;});

	y0.domain([0, d3.max(groupedDatas, function(d) {
			return d.Total;
		})])
		.nice();
```

In this part we try to obtain the maximum sum of teachers from all 3 level of schools grouped by year, age and sex. Then the value is set to be the ceiling for the y axis. For example, if the maximum value is 19,000 across all rows then the y axis scale will be from 0 to 19,000 (not exactly 19,000 but rounded to the next tick). `nice()` function shows the value label of the last tick.

```javascript
var select = d3.select("#year")
		.on("change", function() {
			update(this.value)
		})

function update(year){ //year input from year selection box
		
		d3.selectAll(".tooltip").remove();

		var data = dataset.filter(x => x.year == year); //filter data by selected year
		var year = [... new Set(dataset.map(function(d) {return d.year;}))]
		var ageGroups = [... new Set(data.map(function(d) { return d.age; }))];
		var sex = [... new Set(data.map(function(d) { return d.sex; }))];
		var level = [... new Set(data.map(function(d) { return d.level_of_school; }))].sort(d3.ascending);
    
    x0.domain(ageGroups);
		x1.domain(sex)
			.rangeRound([0,x0.bandwidth()]);

		male.domain(level);
		female.domain(level);
```

Each time the year in selection box changes, the update function is called thus rendering a new chart. In the beginning of update function, mappings of the data are done for each category / column from the dataset so they can be used as a domain input for each respective scale. `remove()` function is used so that everytime the update function is called (when the input year changes), the previous chart elements are removed so the new and previous chart will not be on top of the other. 

```javascript
var options = d3.select("#year")
			.selectAll("option")
			.data(year)
			.enter()
			.append("option")
			.text(function(d) {return d;});
```

Map all the distinct years from the data into options for the selection box. `data(year)` is for binding / joining the data to the `option` DOM element and `enter()` returns an array with length of distinct years not binded to any `option` element yet. In this case, the year ranges from 1996 to 2018 and there is 0 `option` existing so the `enter()` function returns an array with the length of 23 not yet binded to an `option` element. Essentially, in this step we are appending year `option` as many as the distinct years.

```javascript
var groupedData = d3.nest()
			.key(function(d) {return d.sex + " " + d.age;})
			.rollup(function(v) {
				var d2 = {Sex: v[0].sex, Age: v[0].age, Total: 0};
				v.forEach(function(d){
					d2[d.level_of_school] = d.no_of_teachers;
				});
				d2.Total = d3.sum(v, function(d) {return +d.no_of_teachers;});
				return d2;
			})
			.entries(data)
			.map(function(d) {return d.value;});

		var stackData = stack.keys(level)(groupedData);
```

Similar to when we searched for the maximum number of teachers, this time the grouping is done by sex and age only. After that the grouped data will be converted to stacks of level of school.

### 3. Create D3 bar chart elements

```javascript
var tooltip = d3.select('#chart')
					.append('div')
					.attr('class', 'tooltip');
				tooltip.append('div')
					.attr('class', 'label');
				tooltip.append('div')
					.attr('class', 'count');
				tooltip.append('div')
					.attr('class', 'total');

		svg.selectAll(".xAxis").remove();

		svg.append("g")
			.attr("class", "xAxis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis)
			.append("text")
			.attr("x", width - legendArea)
			.attr("y", -5)
			.attr("fill", "#000")
			.attr("font-weight", "bold")
	      	.attr("text-anchor", "start")
			.text("Age");

		svg.selectAll(".yAxis").remove();

		svg.append("g")
			.attr("class", "yAxis")
			.call(yAxis)
			.append("text")
			.attr("x", 2)
			.attr("y", 6)
			.attr("fill", "#000")
	      	.attr("font-weight", "bold")
	      	.attr("text-anchor", "start")
	      	.text("No. of teachers");

	    svg.selectAll(".barParent").remove();

	   	var barParent = svg.append("svg")
	   		.attr("class", "barParent")
	   		.attr("height", 0)
	   		.attr("width", width)
	   		.attr("y", height);

	    var stackBar = barParent.selectAll("barParent")
	    	.data(stackData)
	    	.enter()
	    	.append("g")
	    	.attr("class", "stackBar")
	    	.attr("level", function(d) {return d.key;})
	    	.selectAll("rect")
	    	.data(function(d) {return d;})
	    	.enter()
	    	.append("rect")
	    	.attr("class", "barRect")
	    	.attr("transform", function(d) {return "translate(" + x0(d.data.Age) + ",0)"})
	    	.attr("y", function(d) {return y0(d[0]);})
	    	.attr("width", x1.bandwidth())
	    	.attr("x", function(d) {return x1(d.data.Sex);})
	    	.attr("y", function(d) {return y0(d[1]);})
	    	.attr("height", function(d) {return y0(d[0]) - y0(d[1]);})
	    	.attr("fill", function(d) {
				var key = d3.select(this.parentNode).attr("level");
	    		if(d.data.Sex == "MF"){
	    			return male(key);
	    		}
	    		else if(d.data.Sex == "F")
	    			return female(key);
	    	})
	    	.on("mouseover", function(d){
	    		var key = d3.select(this.parentNode).attr("level");
	    		var gender = "";
	    		tooltip.select(".label").html(key + " SCHOOL");
	    		if(d.data.Sex == "MF")
	    			gender = "male";
	    		else if(d.data.Sex == "F")
	    			gender = "female";
	    		tooltip.select(".count").html(((d[0] - d[1]) * -1) + " " + gender + " teachers" );
	    		tooltip.select(".total").html(d.data.Total + " in total");
	    		tooltip.transition().style("opacity", 1).style("display", "block");
	    		d3.select(this).style("fill", "rgba(0,0,0,0.5)");
	    	})
	    	.on("mouseout", function(d){
	    		d3.select(this).style("fill", null);
	    		tooltip.transition().duration(600).style("opacity", 0).style("display", "none");
	    	})
	    	.on("mousemove", function(d){
	    		tooltip.style('top', (d3.event.layerY + 20) + 'px')
				.style('left', (d3.event.layerX + 20) + 'px');
	    	});

	    barParent
	    .transition()
	    .duration(600)
	    .attr("height", height)
	    .attr("y", 0);
```

All the chart elements including the tooltip is created during this process.

```javascript
var tooltip = d3.select('#chart')
					.append('div')
					.attr('class', 'tooltip');
				tooltip.append('div')
					.attr('class', 'label');
				tooltip.append('div')
					.attr('class', 'count');
				tooltip.append('div')
					.attr('class', 'total');
```

Tooltip element that will display 3 pieces of information, which are level of school, teachers count and total teachers across all levels.

```javascript
svg.selectAll(".xAxis").remove();

		svg.append("g")
			.attr("class", "xAxis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis)
			.append("text")
			.attr("x", width - legendArea)
			.attr("y", -5)
			.attr("fill", "#000")
			.attr("font-weight", "bold")
	      	.attr("text-anchor", "start")
			.text("Age");

		svg.selectAll(".yAxis").remove();

		svg.append("g")
			.attr("class", "yAxis")
			.call(yAxis)
			.append("text")
			.attr("x", 2)
			.attr("y", 6)
			.attr("fill", "#000")
	      	.attr("font-weight", "bold")
	      	.attr("text-anchor", "start")
	      	.text("No. of teachers");
```

X and Y axes are then displayed including the label for each axis.

```javascript
svg.selectAll(".barParent").remove();

	   	var barParent = svg.append("svg")
	   		.attr("class", "barParent")
	   		.attr("height", 0)
	   		.attr("width", width)
	   		.attr("y", height);

	    var stackBar = barParent.selectAll("g")
	    	.data(stackData)
	    	.enter()
	    	.append("g")
	    	.attr("class", "stackBar")
	    	.attr("level", function(d) {return d.key;})
	    	.selectAll("rect")
	    	.data(function(d) {return d;})
	    	.enter()
	    	.append("rect")
	    	.attr("class", "barRect")
	    	.attr("transform", function(d) {return "translate(" + x0(d.data.Age) + ",0)"})
	    	.attr("y", function(d) {return y0(d[0]);})
	    	.attr("width", x1.bandwidth())
	    	.attr("x", function(d) {return x1(d.data.Sex);}) //this groups 2 bars by sex
	    	.attr("y", function(d) {return y0(d[1]);})
	    	.attr("height", function(d) {return y0(d[0]) - y0(d[1]);})
	    	.attr("fill", function(d) {
				var key = d3.select(this.parentNode).attr("level");
	    		if(d.data.Sex == "MF"){
	    			return male(key);
	    		}
	    		else if(d.data.Sex == "F")
	    			return female(key);
	    	})
```

`barParent` functions as the parent for all the bars along the x axis, which has a main purpose of hiding the bars before transitioning and showing them altogether during animation. Remember that `stackData` consists of stacked data according to level of schools, so 3 `g` elements, which is the number of the levels, will be appended to the `barParent`. Inside each `g` element will have 16 rectangles appended. 16 signifies the number of data grouped by level of school. In short, the process is creating and appending 16 bars into a stack and there are 3 stacks existing (again, there are 3 `g` which is the number of levels). Since we want to differentiate male and female bars, a checking is performed to ensure the bar `fill` has the correct set of colors.

```javascript
		.on("mouseover", function(d){
	    		var key = d3.select(this.parentNode).attr("level");
	    		var gender = "";
	    		tooltip.select(".label").html(key + " SCHOOL");
	    		if(d.data.Sex == "MF")
	    			gender = "male";
	    		else if(d.data.Sex == "F")
	    			gender = "female";
	    		tooltip.select(".count").html(((d[0] - d[1]) * -1) + " " + gender + " teachers" );
	    		tooltip.select(".total").html(d.data.Total + " in total");
	    		tooltip.transition().style("opacity", 1).style("display", "block");
	    		d3.select(this).style("fill", "rgba(0,0,0,0.5)");
	    	})
	    	.on("mouseout", function(d){
	    		d3.select(this).style("fill", null);
	    		tooltip.transition().duration(600).style("opacity", 0).style("display", "none");
	    	})
	    	.on("mousemove", function(d){
	    		tooltip.style('top', (d3.event.layerY + 20) + 'px')
				.style('left', (d3.event.layerX + 20) + 'px');
	    	});
```

The mouse events are to enable and disable tooltip when a specific mouse event is triggered. Also, when the cursor hovers over one of the layers of a bar stack, it will turn gray to better indicate which layer the user is selecting. `mousemove` event enables the tooltip to follow wherever the cursor goes.

```javascript
barParent
	    .transition()
	    .duration(600)
	    .attr("height", height)
	    .attr("y", 0);
```

Last but not least, after all the bars have been created and make a whole chart, an animation is played to make the bars rise from bottom to top.

### 4. Create Legends

```javascript
svg.selectAll(".legend").remove();

  var legend = svg.append("g")
   		.attr("class", "legend")
   		.attr("transform", "translate(" + legendX + "," + legendY + ")");

	legend.selectAll('g')
		.data(sex)
		.enter()
		.append('text')
   		.attr('transform', function(d,i) {
			var horz = (2 * legendRectSize + legendSpacing) * i;
   			return 'translate(' + horz + ',0)';
   		})
   		.text(function(d) {return d;});

	var legendMale = legend
		.selectAll('.legendMale')
		.data(male.domain())
		.enter()
		.append('g')
		.attr('class', 'legendMale')
		.attr('transform', function(d, i) {
			var vert = i * (legendRectSize + legendSpacing) + legendSpacing;
			return 'translate(0,' + vert + ')';
		});

	legendMale.append('rect')
		.attr('width', legendRectSize)
		.attr('height', legendRectSize)
		.style('fill', male)
		.style('stroke', male);

	var legendFemale = legend
		.selectAll('.legendFemale')
		.data(female.domain())
		.enter()
		.append('g')
		.attr('class', 'legendFemale')
		.attr('transform', function(d, i) {
			var horz = 2 * legendRectSize;
			var vert = i * (legendRectSize + legendSpacing) + legendSpacing;
			return 'translate(' + horz + ',' + vert + ')';
		});

	legendFemale.append('rect')
		.attr('width', legendRectSize)
		.attr('height', legendRectSize)
		.style('fill', female)
		.style('stroke', female);

	legendFemale.append('text')
		.attr("x", legendSpacing + legendRectSize)
		.attr("y", legendRectSize - legendSpacing)
		.text(function(d) {
			return d + " SCHOOL";
		});
}
```

Legends are divided by sex and level of schools.

```javascript
var legend = svg.append("g")
   		.attr("class", "legend")
   		.attr("transform", "translate(" + legendX + "," + legendY + ")");
```

This is the outmost parent of the legend. All the legend text and rectangles are appended inside here.

```javascript
legend.selectAll('g')
		.data(sex)
		.enter()
		.append('text')
   		.attr('transform', function(d,i) {
			var horz = (2 * legendRectSize + legendSpacing) * i;
   			return 'translate(' + horz + ',0)';
   		})
   		.text(function(d) {return d;});
```

In this process we create 2 sex labels, one is for male and the other is female.

```javascript
var legendMale = legend
		.selectAll('.legendMale')
		.data(male.domain())
		.enter()
		.append('g')
		.attr('class', 'legendMale')
		.attr('transform', function(d, i) {
			var vert = i * (legendRectSize + legendSpacing) + legendSpacing;
			return 'translate(0,' + vert + ')';
		});

	legendMale.append('rect')
		.attr('width', legendRectSize)
		.attr('height', legendRectSize)
		.style('fill', male)
		.style('stroke', male);

	var legendFemale = legend
		.selectAll('.legendFemale')
		.data(female.domain())
		.enter()
		.append('g')
		.attr('class', 'legendFemale')
		.attr('transform', function(d, i) {
			var horz = 2 * legendRectSize;
			var vert = i * (legendRectSize + legendSpacing) + legendSpacing;
			return 'translate(' + horz + ',' + vert + ')';
		});

	legendFemale.append('rect')
		.attr('width', legendRectSize)
		.attr('height', legendRectSize)
		.style('fill', female)
		.style('stroke', female);
```

Rectangles acting as symbols for the legends are made here for both sex. Depending on the number of layers (or level of schools), each rectangle position is calculated accordingly.

```javascript
legendFemale.append('text')
		.attr("x", legendSpacing + legendRectSize)
		.attr("y", legendRectSize - legendSpacing)
		.text(function(d) {
			return d + " SCHOOL";
		});
	}
});
```

To finish the entire process, texts are needed to tell the user that each row of the rectangular symbols represents a level of school.
