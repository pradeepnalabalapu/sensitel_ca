LOAD CSV WITH HEADERS FROM 'file:///home/pradeep/projects/sensitel_ca/out.csv' AS csvLine
MATCH (DC:datacenter {name: csvLine.dataCenter})
MERGE (DB:database {sw: csvLine.dBProg})
MERGE (DBVER:dbversion {version: csvLine.dBVersion})
MERGE (PROD: product {name: csvLine.product})
CREATE (SERVER:server {id: csvLine.SerialNo, storage: csvLine.storage, dbSize: csvLine.dBSize, types: csvLine.dBType })
CREATE (SERVER)-[:IN]->(DC)
CREATE (SERVER)-[:RUNS]->(DBVER)-[:DBSW]->(DB)
CREATE (SERVER)-[:SERVES]->(PROD);
