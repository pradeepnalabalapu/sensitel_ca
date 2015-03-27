#!/bin/sh
sed -i 's/Date Center/Data Center/' data/dbinfo/*.csv 
sed -i 's/Clairty/Clarity/' data/dbinfo/*.csv
src/scripts/joinLines.pl data/dbinfo/oracle.csv
src/scripts/joinLines.pl data/dbinfo/mysql.csv
src/scripts/joinLines.pl data/dbinfo/mssql.csv

src/scripts/process_csv_files.pl
neo4j-shell -file src/scripts/setupdb.cql
