To setup sensitel_ca data into neo4j

1. If you don't have the unified csv file 'out.csv' 
	a. Ensure your individual csv files - mysql.csv, mssql.csv, oracle.csv 
			are under data/dbinfo directory
  b. Ensure datacenters.csv file is under direcotry data
	c. Run pre_process Or you can selectively run the individual commands 
			from that file
	d. Run src/scripts/process_csv_files.pl 
	
	The above generates file 'out.csv'

2. Once you have out.csv, to load data into neo4j, run the following commands
	a. neo4j-shell -file src/scripts/dropDb.cql
	b. neo4j-shell -file src/scripts/sendDataCenterToNeo4j.cql
	c. neo4j-shell -file src/scripts/sendToNeo4j.cql
