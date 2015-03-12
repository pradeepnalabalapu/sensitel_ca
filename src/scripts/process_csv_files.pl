#!/usr/bin/perl

use strict;
use lib 'src/scripts';
use CsvProcessor;

my $DEBUG_FLOW = 1;
my $DEBUG=$DEBUG_FLOW;


my $SNO = 0;
my $DATACENTER = 1;
my $DB_SW_NAME = 2;
my $DB_TYPE = 3;
my $DB_VERSION = 4;
my $STORAGE_SIZE = 5;
my $DB_SIZE = 6;
my $PRODUCT = 7;

#mssql csv header - S.No,Data Center,Server Name,Database Type,Database Version,Storage Sizes,Database Sizes(GB),Product
#oracle csv header - Data Center,Server Name,Database Type,Database Version,Storage Sizes,Database Sizes,Product,,,,,
#mysql csv header - S.No,DB ServerName,Data Center,Product,Prod/Non Prod/ slave ,Mysql version ,Nimsoft Monitoring,Enerprise monitoring,DB Size,OS Size,Active / in active ,comments


#keyword order SNO,DATACENTER,DB_SW_NAME,DB_TYPE, DB_VERSION, STORAGE_SIZE, DB_SIZE, PRODUCT
my %keyword = (
	'mysql' => ['S.No', 'Data Center',,'Prod/Non Prod/ slave','Mysql version','OS Size','DB Size', 'Product' ],
	'mssql' => ['S.No', 'Data Center',,'Database Type','Database Version','Storage Sizes','Database Sizes','Product'],
	'oracle' => ['Server Name', 'Data Center',,'Database Type','Database Version','Storage Sizes','Database Sizes', 'Product' ]
);





	printf ("----------------\n") if ($DEBUG & $DEBUG_FLOW);

foreach my $csvfile (glob("data/*.csv")) {
	$csvfile =~ m:data/(\D*)\d*.csv:;
	my $key_keyword = $1;
	if ($DEBUG & $DEBUG_FLOW) {
		printf ("key for keyword hash is $key_keyword\n");
	}
	my $processor = new CsvProcessor($csvfile,$keyword{$key_keyword},$DEBUG);
	$processor->getHeader();

	printf ("----------------\n") if ($DEBUG & $DEBUG_FLOW);



}
