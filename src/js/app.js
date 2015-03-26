

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
      console.log('query '+varname+' result='+JSON.stringify(data));
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
  var query1 = 'match (s:server)-[:SERVES]->(p:product) '+
  'match n-[:RUNS]->(dbver)-[:DBSW]-(db:database) '+
  'return distinct db.sw as database, dbver.version as version,  p.name as product  '+ 
  'order by p.name';
  $scope.neoquery(query1,
      $scope.process_result_fn('query1'));

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






