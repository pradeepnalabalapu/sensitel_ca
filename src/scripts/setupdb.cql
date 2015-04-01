  match (n) 
  optional match (n)-[r]-()
  delete n,r;


LOAD CSV WITH HEADERS FROM 'file:///home/pradeep/projects/sensitel_ca/data/datacenters.csv' AS csvLine
CREATE (DC:datacenter {name: csvLine.dataCenter, country: csvLine.Country, state: csvLine.State, city: csvLine.City});


LOAD CSV WITH HEADERS FROM 'file:///home/pradeep/projects/sensitel_ca/out.csv' AS csvLine
MATCH (DC:datacenter {name: csvLine.dataCenter})
 with csvLine, DC
 merge (DB:database {sw: csvLine.dBProg}) with csvLine, DC, DB
 merge (DBVER:dbversion {version: csvLine.dBVersion}) with csvLine, DC, DB, DBVER
 merge (p: product {name: csvLine.product}) with csvLine, DC, DB, DBVER, p
 merge (s:server {id: csvLine.SerialNo, storage: toInt(csvLine.storage), dbSize: toInt(csvLine.dBSize), types: csvLine.dBType }) with s, csvLine, DC, DB, DBVER, p 
 create unique	(s)-[:IN]->(DC) with s, csvLine, DC, DB, DBVER, p
 create unique (p)<-[:SERVES]-(s)-[:RUNS]->(DBVER)-[:DBSW]->(DB) ;


LOAD CSV WITH HEADERS FROM 'file:///home/pradeep/projects/sensitel_ca/data/product_serviceline.csv' as csvLine
 merge (s:service {name : csvLine.Service}) with s, csvLine 
 MATCH (p: product {name: csvLine.Product}) with s,csvLine, p
 CREATE unique (p)-[:SERVICE_BY]->(s);
 
