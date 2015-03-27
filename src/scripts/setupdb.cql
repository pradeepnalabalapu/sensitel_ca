  match (n) 
  optional match (n)-[r]-()
  delete n,r;


LOAD CSV WITH HEADERS FROM 'file:///home/pradeep/projects/sensitel_ca/data/datacenters.csv' AS csvLine
CREATE (DC:datacenter {name: csvLine.dataCenter, country: csvLine.Country, state: csvLine.State, city: csvLine.City});


LOAD CSV WITH HEADERS FROM 'file:///home/pradeep/projects/sensitel_ca/out.csv' AS csvLine
MATCH (DC:datacenter {name: csvLine.dataCenter})
 with csvLine, DC
 CREATE (DB:database {sw: csvLine.dBProg}),
	(DBVER:dbversion {version: csvLine.dBVersion}),
	(PROD: product {name: csvLine.product}),
	(s:server {id: csvLine.SerialNo, storage: toInt(csvLine.storage), dbSize: toInt(csvLine.dBSize), types: csvLine.dBType }),
 (PROD)<-[:SERVES]-(s)-[:RUNS]->(DBVER)-[:DBSW]->(DB),
	(s)-[:IN]->(DC);

