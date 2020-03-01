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
		//.range(["#99ffff", "#00e6e6", "#006666"]);
		.range(["#00ffff", "#00ccff", "#0099ff"]);

var female = d3.scaleOrdinal()
		.range(["#ffff00", "#ff8800", "#ff0000"]);

var xAxis = d3.axisBottom(x0);

var yAxis = d3.axisLeft(y0);

var stack = d3.stack().offset(d3.stackOffsetZero);

var svg = d3.select("#chart").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv("teachers-in-schools-age.csv").then(function(dataset){

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

	update("1996");

	function update(year){
		
		d3.selectAll(".tooltip").remove();

		var data = dataset.filter(x => x.year == year);
		var year = [... new Set(dataset.map(function(d) {return d.year;}))]
		var ageGroups = [... new Set(data.map(function(d) { return d.age; }))];
		var sex = [... new Set(data.map(function(d) { return d.sex; }))];
		var level = [... new Set(data.map(function(d) { return d.level_of_school; }))].sort(d3.ascending);

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

		x0.domain(ageGroups);
		x1.domain(sex)
			.rangeRound([0,x0.bandwidth()]);

		male.domain(level);
		female.domain(level);

		var stackData = stack.keys(level)(groupedData);

		//tooltip

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

	//legend

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

    var select = d3.select("#year")
		.on("change", function() {
			update(this.value)
		})
});