
function groupCircles(div_id, jsonfile, circleSizeField, circleColorField) {

    if(!circleSizeField) {
        circleSizeField = 'size';
    }
    if(!circleColorField){
        circleColorField = 'db_sw';
    }

    var margin = 20;
    var div = d3.select('#'+div_id);
    var height = parseInt(div.style('height'));
    div.style('width', height);
    var width = parseInt(div.style('width'));
    var diameter =  height - margin ;
    //console.log('height='+height+' width='+width+' diameter='+diameter);

    var db_types = { oracle: {descr: 'Oracle', color: d3.hsl(0, 0.8, 0.8) },
        mssql: { descr: "SQL SERVER", color: d3.hsl(300, 0.8, 0.8)},
        mysql: { descr: 'MySQL', color: d3.hsl(60, 0.8, 0.8)}};


    var db_type_color = function (db_type) {
        var color = (db_type in db_types) ? db_types[db_type].color : null;
        return color;
    };


    var color = d3.scale.linear()
        .domain([-1, 5])
        .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
        .interpolate(d3.interpolateHcl);

    var pack = d3.layout.pack()
        .padding(2)
        .size([diameter - margin, diameter - margin])
        .value(function (d) {
            return d[circleSizeField];
        })

    var svg = div.append("svg")
        .attr("width", diameter)
        .attr("height", diameter + 20)
        .append("g")
        .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

    d3.json(jsonfile, function (error, root) {
        if (error) return console.error(error);

        var focus = root,
            nodes = pack.nodes(root),
            view;

        var circle = svg.selectAll("circle")
            .data(nodes)
            .enter().append("circle")
            .attr("class", function (d) {
                return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root";
            })
            .style("fill", function (d) {
                return d.children ? color(d.depth) : db_type_color(d[circleColorField]);
            })
            .attr('data-legend', function (d) {
                return d.children ? null : db_types[d[circleColorField]].descr;
            })
            .on("click", function (d) {
                if (focus !== d) zoom(d), d3.event.stopPropagation();
            });

        var text = svg.selectAll("text")
            .data(nodes)
            .enter().append("text")
            .attr("class", "label")
            .style("fill-opacity", function (d) {
                return d.parent === root ? 1 : 0;
            })
            .style('font-weight', "bold")
            .style("display", function (d) {
                return d.parent === root ? null : "none";
            })
            .text(function (d) {
                return d.name + ( (circleSizeField in d) ? '(' + d[circleSizeField] + ')' : null);
            });

        var node = svg.selectAll("circle,text");

        d3.select("body")
            //.style("background", color(-1))
            .on("click", function () {
                zoom(root);
            });

        var legend = svg.append('g')
            .attr("class", "legend")
            .attr("transform", "translate(" + (diameter / 2 - 120) + "," + (30 - diameter / 2) + ")")
            .style("font-size", "12px")
            .call(d3.legend);


        svg.append('svg:image')
            .attr('xlink:href', '../images/SENS.PNG')
            .attr('x', -diameter / 2)
            .attr('y', -diameter / 2)
            .attr('width', 100)
            .attr('height', 40);

        zoomTo([root.x, root.y, root.r * 2 + margin]);

        //adding title


        function zoom(d) {
            var focus0 = focus;
            focus = d;

            var transition = d3.transition()
                .duration(d3.event.altKey ? 7500 : 750)
                .tween("zoom", function (d) {
                    var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
                    return function (t) {
                        zoomTo(i(t));
                    };
                });

            transition.selectAll("text")
                .filter(function (d) {
                    return d.parent === focus || this.style.display === "inline";
                })
                .style("fill-opacity", function (d) {
                    return d.parent === focus ? 1 : 0;
                })
                .each("start", function (d) {
                    if (d.parent === focus) this.style.display = "inline";
                })
                .each("end", function (d) {
                    if (d.parent !== focus) this.style.display = "none";
                });
        }

        function zoomTo(v) {
            var k = diameter / v[2];
            view = v;
            node.attr("transform", function (d) {
                return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
            });
            circle.attr("r", function (d) {
                return d.r * k;
            });
        }
    });

    d3.select(self.frameElement).style("height", diameter + "px")
        .style("background", color(-1));
}

