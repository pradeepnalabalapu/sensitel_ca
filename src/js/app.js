

angular.module("sensitelApp", ['ui.bootstrap'])
    .controller("queryController", ["$scope", "$http", function($scope,$http) {

        $scope.tabs={};

        $scope.tabs.materials= [];
        $scope.tabs.material = '';
        $scope.tabs.nonCFSiMaterial = '';
        $scope.tabs.result_material_head = 'Results';

        $scope.tabs.suppliers=[];
        //$scope.result_material = '';
        //$scope.nonCFSiResult_material = '';

//-------------------------------
// process_result_fn - given a varname, returns a function
// that collects all results into an array and saves it as
// $scope[varname]
//---------------------------------
        $scope.process_result_fn = function(varname, debug) {
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
                //console.log(JSON.stringify(arr));
                var json_obj = convertTableToTree(varname, $scope.tabs[varname], 'Product', 'Version', 'NumServers');
                //console.log('json_obj = '+JSON.stringify(json_obj));
                groupCirclesJsonObj('chart0',json_obj, 'NumServers', 'Database');
            };
        };



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
        var numservers_query = 'match (s:server)-[:SERVES]->(p:product) '+
            'match server-[:RUNS]->(dbver)-[:DBSW]-(db:database) '+
            'where s=server '+
            'return count(distinct s.id) as NumServers, db.sw as Database, dbver.version as Version,  p.name as Product  '+
            'order by p.name';
        $scope.neoquery(numservers_query, $scope.process_result_fn('numservers'));

        /*
         $scope.watch("tabs['numservers']", function(table_data){
         console.log('scope.tabs[numservers] changed');
         if(table_data) {
         convertTableToTree('byProductNum', table_data, 'Product', 'Version');
         }
         }, true)
         */

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


/*

 $scope.$watch("tabs.material", function(value) {
 /// Query #1 is here
 var query = "match (sm)-[:SUPPLIES_MATERIAL]->(m) where m.name='"+value+"' return distinct sm order by sm.name";
 var processFn = $scope.process_result_fn("results_material");
 $scope.neoquery(query,processFn);
 } );

 $scope.$watch("tabs.nonCFSiMaterial", function(value) {
 // Query #2 is here
 var query = "match (sm)-[:SUPPLIES_MATERIAL]->(m) where m.name='"+value+"' and sm.cfs_status <> 'Certified' return distinct sm order by sm.name";
 var processFn = $scope.process_result_fn("results_nonCFSiMaterial");
 $scope.neoquery(query,processFn);
 } );

 $scope.countryobj = {
 supplier_country: "",
 material: "",
 smelter_country:""
 };


 //initial query
 $scope.neoquery('match (s:supplier) return distinct s.name',
 $scope.process_result_fn('suppliers'));

 $scope.$watch('tabs.supplier', function(value){
 if(!value) return;
 var query = 'match ({name: "'+value+'"}) <- [:SUPPLIES_TO]-(sm) -[:SUPPLIES_TO]-> (s:supplier) where s.name <> "'+value+'" and not sm.name =~ "Global High Tech HeadQuarters" return distinct sm.name, s.name order by sm.name';
 console.log('query = '+query);
 var processFn = $scope.process_result_fn('results_smelterSupplier');
 $scope.neoquery(query,processFn);

 });
 */


}]);






