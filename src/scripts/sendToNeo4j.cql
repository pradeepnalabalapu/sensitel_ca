LOAD CSV WITH HEADERS FROM 'file:///home/pradeep/projects/sensitel_ca/out.csv' AS csvLine
MATCH (DC:datacenter {name: csvLine.dataCenter})
 with csvLine, DC
 CREATE (DB:database {sw: csvLine.dBProg}),
	(DBVER:dbversion {version: csvLine.dBVersion}),
	(PROD: product {name: csvLine.product}),
	(s:server {id: csvLine.SerialNo, storage: csvLine.storage, dbSize: csvLine.dBSize, types: csvLine.dBType }),
 (PROD)<-[:SERVES]-(s)-[:RUNS]->(DBVER)-[:DBSW]->(DB),
	(s)-[:IN]->(DC);
