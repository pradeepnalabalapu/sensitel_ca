

angular.module("sensitelApp", ['ui.bootstrap'])
    .controller("queryController", ["$scope", "$http", function($scope,$http) {

        $scope.tabs={};

        $scope.tabs.materials= [];
        $scope.tabs.material = '';
        $scope.tabs.nonCFSiMaterial = '';
        $scope.tabs.result_material_head = 'Results';

        $scope.tabs.suppliers=[];
        $scope.DEBUG = 0;
        //$scope.result_material = '';
        //$scope.nonCFSiResult_material = '';

//-------------------------------
// process_result_fn - given a varname, returns a function
// that collects all results into an array and saves it as
// $scope[varname]
//---------------------------------
        $scope.process_result_fn = function(varname, debug, cb) {
            return function(data, status, headers, config) {

                var arr;
                var i;
                //console.log('query '+varname+' result='+JSON.stringify(data));
                $scope.tabs[varname]={};

                if(data.results.length===0) {
                    if(data.errors.length) {
                        var keys = Object.keys(data.errors[0])
                        $scope.tabs[varname]['columns'] = keys;
                        var arr = [];
                        for (var i_err=0; i_err < data.errors.length; i_err++) {
                            arr[i_err] = [];
                            for (var i = 0; i < keys.length; i++) {
                                arr[i_err][i] = data.errors[0][keys[i]];
                            }
                        }
                        $scope.tabs[varname]['data'] = arr;
                    }
                    return;
                }
                if(data.results[0].data.length === 0) return;

                if(data.results[0].data[0].row.length>1) {
                    arr =[ ];
                    for(i=0; i< data.results[0].data.length; i++) {
                        var row = data.results[0].data[i].row;
                        arr[i]= [];
                        for(j=0;j<row.length; j++) {
                            arr[i].push(row[j]);
                        }
                    }
                }    else {
                    arr = [];
                    for(i=0; i< data.results[0].data.length; i++) {
                        arr.push(data.results[0].data[i].row[0]);
                    }
                }

                if(debug == 1 && arr.length>0 ) {
                    console.log('query result[0]='+JSON.stringify(data.results[0].data[0]));
                } else if(debug ==2 && arr.length> 0 ) {
                    console.log('query results='+JSON.stringify(data));
                }
                $scope.tabs[varname]['data']=arr;
                $scope.tabs[varname]['columns'] = data.results[0].columns;
                if(cb) cb($scope.tabs[varname]);
                //console.log(JSON.stringify(arr));

            };
        };

        // Json for the tree to show in the circles chart
        // nodefield is the field that we use for the circles top level group
        // namefield is the next level of hierarchy for the circles i.e. smaller circles
        //    inside the bigger circles
        // sizefield is the field used to determine size of circles
        // colorfield  determines which color circles are drawn in

        function convertToJsonFn(varname, nodefield, namefield, sizefield, colorfield) {
            return function() {
                var json_obj = convertTableToTree(varname, $scope.tabs[varname], nodefield, namefield, sizefield);
                //console.log('json_obj = '+JSON.stringify(json_obj));
                groupCirclesJsonObj('chart0', json_obj, sizefield, colorfield);
            }
        }


//---------------------------
//Function nequery -  runs given query and on success invokes
// callback function cb
//---------------------------
        $scope.neoquery = function (query, cb) {
            //console.log('query = '+query);
            var url = "http://localhost:7474/db/data/transaction/commit";
            var req = {
                method: 'POST',
                url: url,
                headers : {
                    'Accept' :"application/json; charset=UTF-8"
                },
                data : { "statements" : [ {
                    "statement" : query
                }]
                }
            };
            $http(req)
                .success(cb);
        };



        //----------- run some initial queries for
        //---- filling up dropdown boxes
        $scope.chart = {};
        var numservers={};
        numservers.match = 'match (s:server)-[:SERVES]->(p:product) '+
            'match s-[:RUNS]->(dbver)-[:DBSW]-(db:database) ';
        numservers.filter = '';
        numservers.return ='return p.name as Product ,  db.sw as Database, dbver.version as Version, count(distinct s.id) as NumServers '+
            'order by lower(Product), Database, Version'
        numservers.query = numservers.match + numservers.return;
        numservers.heading = 'Number of database servers, grouped by product type and database version';
        numservers.args=['Product', 'Version', 'NumServers', 'Database'];
        numservers.footnotes = 'The circles are scaled by number of servers';
        $scope.chart['footprint']=numservers;


        var clarityservers={};
        clarityservers.match = 'match (s:server)-[:SERVES]->(p:product) '+
            'match s-[:RUNS]->(dbver)-[:DBSW]-(db:database) ';
        clarityservers.return = 'return p.name as Product ,  db.sw as Database, dbver.version as Version, count(distinct s.id) as NumServers '+
            'order by Product, Database, Version';
        clarityservers.filter ='where p.name ="clarity" ';
        clarityservers.query = clarityservers.match+ clarityservers.filter + clarityservers.return;
        clarityservers.heading = 'Number of database servers hosting Clarity, grouped by database version';
        clarityservers.args=['Product', 'Version', 'NumServers', 'Database'];
        clarityservers.footnotes = 'The circles are scaled by number of servers';
        $scope.chart['clarity']=clarityservers;

        var dbsize={};
        dbsize.match = 'match (s:server)-[:SERVES]->(p:product) '+
            'match s-[:RUNS]->(dbver)-[:DBSW]-(db:database) ';
        dbsize.filter = '';
        dbsize.return ='return p.name as Product,  db.sw as Database, dbver.version as Version, sum(s.dbSize) as DbSizeGB '+
            'order by lower(Product), Database, Version';
        dbsize.query = dbsize.match+ dbsize.return ;
        dbsize.heading = 'Database sizes, grouped by product type and database version';
        dbsize.args=['Product', 'Version', 'DbSizeGB', 'Database'];
        dbsize.footnotes = 'The circles are scaled by database size';
        $scope.chart['dbSize']=dbsize;


        var datacenters= {};
        datacenters.match = 'match (s:server)-[:SERVES]->(p:product) '+
            'match s-[:RUNS]->(dbver)-[:DBSW]-(db:database) '+
            ' match s-[:IN]-(dc) ';
        datacenters.filter = '';
        datacenters.return ='return dc.name as Datacenter, p.name as Product , db.sw as Database, count(s.id) as NumServers '+
            'order by Datacenter, lower(Product), Database';
        datacenters.query = datacenters.match + datacenters.return;
        datacenters.heading = 'Number of database servers, grouped by datacenter and product';
        datacenters.args = [ 'Datacenter', 'Product', 'NumServers', 'Database'];
        datacenters.footnotes = 'The circles are scaled by number of servers';
        $scope.chart['datacenters'] = datacenters;


        var services_query = 'match (s:service) return s;';
        function createServices (table_data){
            var data = table_data.data;
            var data_length = data.length;
            for (var i=0; i<data_length; i++) {
                var name = data[i].name;
                $scope.services.push(name);
                $scope.selected_services.push(name);
            }
            $scope.service_filter = createServicesFilter($scope.services);
        };

        function createServicesFilter(services) {
            var service_filter = '';
            var service_length = services.length;
            if(service_length) {
                service_filter = 'match (p)-[:SERVICE_BY]->(se:service) where ';
                for (var i = 0; i < service_length; i++) {
                    service_filter += ' se.name ="' + services[i] + '"';
                    if ( i!= (service_length-1)) {
                        service_filter += ' OR ';
                    }
                }
                service_filter += ' ';
            }
            return service_filter;
        };

        $scope.services= [];
        $scope.selected_services=[];
        $scope.service_filter ='';
        $scope.neoquery(services_query, $scope.process_result_fn('services', $scope.DEBUG, createServices));

        $scope.$watch('selected_services', function(newValue, oldValue) {
            $scope.service_filter = createServicesFilter(newValue);
            if ($scope.button) {
                d3.select("svg")
                    .remove();
                var query_obj = $scope.chart[$scope.button];
                var query_str = query_obj.match + query_obj.filter + $scope.service_filter+ query_obj.return;
                var args = query_obj.args;
                $scope.neoquery(query_str, $scope.process_result_fn('result',$scope.DEBUG,
                    convertToJsonFn('result', args[0], args[1], args[2], args[3])));
            }
        },1);


        $scope.runQuery = function(key) {
            d3.select("svg")
                .remove();
            $scope.button = key;
            var query_obj = $scope.chart[key];
            var query_str = query_obj.match + query_obj.filter + $scope.service_filter+ query_obj.return;
            var args = query_obj.args;
            $scope.heading = query_obj.heading;
            $scope.footnotes = query_obj.footnotes;
            $scope.neoquery(query_str, $scope.process_result_fn('result',$scope.DEBUG,
                convertToJsonFn('result', args[0], args[1], args[2], args[3])));
        }


        function convertTableToTree (name,table_data, nodefield, namefield, sizefield) {
            //console.log('Inside convertTableToTree');
            var table_obj = {name: name, children: []};
            var nodeindex = table_data.columns.indexOf(nodefield);
            var nameindex = table_data.columns.indexOf(namefield);
            var sizeindex = table_data.columns.indexOf(sizefield);

            var tree_index = {};
            var tree_index_count =0;
            var cols = table_data.columns;
            table_data.data.forEach(function(row) {
                var field = row[nodeindex];
                if (!(field in tree_index)) {
                    var node = {name: field, children: []};
                    node[sizefield] = 0;
                    tree_index[field] = table_obj.children.length;
                    table_obj.children.push(node);
                }
                var node = table_obj.children[tree_index[field]];
                var obj = {};
                for (var i = 0; i < row.length; i++) {
                    if (i != nodeindex) {
                        if (i === nameindex) obj.name = row[nameindex];
                        else obj[cols[i]] = row[i];
                    }
                }
                node.children.push(obj);
                node[sizefield] += obj[sizefield];
            });
            return table_obj;
        };


}]);






