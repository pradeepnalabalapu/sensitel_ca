

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
                if(data.results.length===0 || data.results[0].data.length === 0) return;

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
                $scope.tabs[varname]={};
                $scope.tabs[varname]['data']=arr;
                $scope.tabs[varname]['columns'] = data.results[0].columns;
                cb($scope.tabs[varname]);
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
        numservers.query = 'match (s:server)-[:SERVES]->(p:product) '+
            'match s-[:RUNS]->(dbver)-[:DBSW]-(db:database) '+
            'return p.name as Product ,  db.sw as Database, dbver.version as Version, count(distinct s.id) as NumServers '+
            'order by lower(Product), Database, Version';
        numservers.heading = 'Number of database servers, grouped by product type and database version';
        numservers.args=['Product', 'Version', 'NumServers', 'Database'];
        $scope.chart['footprint']=numservers;

        var clarityservers={};
        clarityservers.query = 'match (s:server)-[:SERVES]->(p:product) '+
            'match s-[:RUNS]->(dbver)-[:DBSW]-(db:database) '+
            'where p.name ="clarity"'+
            'return p.name as Product ,  db.sw as Database, dbver.version as Version, count(distinct s.id) as NumServers '+
            'order by Product, Database, Version';
        clarityservers.heading = 'Number of database servers hosting Clarity, grouped by database version';
        clarityservers.args=['Product', 'Version', 'NumServers', 'Database'];
        $scope.chart['clarity']=clarityservers;

        var dbsize_query = 'match (s:server)-[:SERVES]->(p:product) '+
            'match serv-[:RUNS]->(dbver)-[:DBSW]-(db:database) '+
            'return distinct s.id as Id, sum(s.dbSize) as DbSize, db.sw as Database, dbver.version as Version,  p.name as Product  '+
            'order by p.name';

        var datacenters= {};
        datacenters.query = 'match (s:server)-[:SERVES]->(p:product) '+
            'match s-[:RUNS]->(dbver)-[:DBSW]-(db:database) '+
            ' match s-[:IN]-(dc) '+
            'return dc.name as Datacenter, p.name as Product , db.sw as Database, count(s.id) as NumServers '+
            'order by Datacenter, lower(Product), Database';
        datacenters.heading = 'Number of database servers, grouped by datacenter and product';
        datacenters.args = [ 'Datacenter', 'Product', 'NumServers', 'Database'];
        $scope.chart['datacenters'] = datacenters;


        $scope.runQuery = function(key) {
            d3.select("svg")
                .remove();
            var query_obj = $scope.chart[key];
            var query_str = query_obj.query;
            var args = query_obj.args;
            $scope.heading = query_obj.heading;
            $scope.neoquery(query_str, $scope.process_result_fn('result',$scope.DEBUG,
                convertToJsonFn('result', args[0], args[1], args[2], args[3])));
        }


        function convertTableToTree (name,table_data, nodefield, namefield, sizefield) {
            console.log('Inside convertTableToTree');
            var table_obj = {name: name, children: []};
            var nodeindex = table_data.columns.indexOf(nodefield);
            var nameindex = table_data.columns.indexOf(namefield);
            var sizeindex = table_data.columns.indexOf(sizefield);

            console.log('nodeindex='+nodeindex+' nameindex='+nameindex);
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






