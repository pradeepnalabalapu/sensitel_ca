LOAD CSV WITH HEADERS FROM 'file:///home/pradeep/projects/sensitel_ca/data/datacenters.csv' AS csvLine
CREATE (DC:datacenter {name: csvLine.dataCenter, country: csvLine.Country, state: csvLine.State, city: csvLine.City});

