#!/usr/bin/perl

#################################################################
##  Program to process multiple csv files and to create a unified
##   csv file or json
## The input csv files sometimes may not have fields in the same 
##  columns. Also fields may not be named exactly the same in all 
##  files. Script takes care of those issues.
#################################################################

use strict;
use lib 'src/scripts';
use CsvProcessor;

my $outJSONFile = "out.json";
my $outCSVFile = "out.csv";

our $DEBUG_FLOW = 0;

my $DEBUG=$DEBUG_FLOW;

####################################################################
##  The constants below define which column numbers for different 
##    fields. The array @keys, holds the string representation of 
##    each field. It is used while printing out JSON objects
####################################################################

our $SNO = 0;
our $DATACENTER = 1;
our $DB_SW_NAME = 2;
our $DB_TYPE = 3;
our $DB_VERSION = 4;
our $STORAGE_SIZE = 5;
our $DB_SIZE = 6;
our $PRODUCT = 7;

my @keys = ();
$keys[$SNO] = 'SerialNo';
$keys[$DATACENTER] = 'dataCenter';
$keys[$DB_SW_NAME] = 'dBProg';
$keys[$DB_TYPE] = 'dBType';
$keys[$DB_VERSION] = 'dBVersion';
$keys[$STORAGE_SIZE] = 'storage';
$keys[$DB_SIZE] = 'dBSize';
$keys[$PRODUCT] = 'product';


#mssql csv header - S.No,Data Center,Server Name,Database Type,Database Version,Storage Sizes,Database Sizes(GB),Product
#oracle csv header - Data Center,Server Name,Database Type,Database Version,Storage Sizes,Database Sizes,Product,,,,,
#mysql csv header - S.No,DB ServerName,Data Center,Product,Prod/Non Prod/ slave ,Mysql version ,Nimsoft Monitoring,Enerprise monitoring,DB Size,OS Size,Active / in active ,comments

#keyword order SNO,DATACENTER,DB_SW_NAME,DB_TYPE, DB_VERSION, STORAGE_SIZE, DB_SIZE, PRODUCT
###############################################################################
##  keyword hash defines what headings to expect for fields in different csv 
##    files the key of this hash is the input csv type (which is also database 
##    program type here)
###############################################################################
my %keyword = (
	'mysql' => ['S.No', 'Data Center','DB SW','Prod/Non Prod/ slave','Mysql version','OS Size','DB Size', 'Product' ],
	'mssql' => ['S.No', 'Data Center','DB SW','Database Type','Database Version','Storage Sizes','Database Sizes','Product'],
	'oracle' => ['Server Name', 'Data Center','DB SW','Database Type','Database Version','Storage Sizes','Database Sizes', 'Product' ]
);



my @out = ();


	printf ("----------------\n") if ($DEBUG & $DEBUG_FLOW);

foreach my $csvfile (glob("data/dbinfo/*.csv")) {
	$csvfile =~ m:data/dbinfo/(\D*)\d*.csv:; #capture the non-number word part of the filename
	my $dbsw = $1;
	if ($DEBUG & $DEBUG_FLOW) {
		printf ("key for keyword hash is $dbsw\n");
	}
	my $processor = new CsvProcessor($csvfile,$dbsw,$keyword{$dbsw},$DEBUG);
	$processor->getHeader();
	$processor->readData(\@out);

	printf ("----------------\n") if ($DEBUG & $DEBUG_FLOW);
}

#printJSON(\@out);
printCSV(\@out);
#printJSONbyProduct(\@out);
#printJSONbyProductSize(\@out);

sub printJSON {
	my $fdout;
	open($fdout, ">".$outJSONFile) or die ("ERROR : Create file $outJSONFile failed\n");
	my $arrayRef = shift;

	printf $fdout (" data : [\n");

	for(my $i=0; $i<@$arrayRef; $i++){
		printf $fdout ("\t{ ");
		for(my $j=0; $j < @{$arrayRef->[$i]}; $j++) {
			if($j) {
				printf $fdout ", ";
			}
			printf $fdout ("$keys[$j] : ");
			my $value = $arrayRef->[$i][$j];
			if ($value =~ /\s/ ) {
				printf $fdout "\"$value\"";
			} else {
				printf $fdout $value;
			}
		}
		printf $fdout ("}\n");
	}

	printf $fdout ("]\n");
}



sub printCSV {
	my $fdout;
	my $arrayRef = shift;
	my $filename = shift;
 	$filename or $filename=$outCSVFile;
	open($fdout, ">".$filename) or die ("ERROR : Create file $filename failed\n");

	printf $fdout  join(",", @keys)."\n";

	for(my $i=0; $i<@$arrayRef; $i++){
		$arrayRef->[$i]->[$DATACENTER] =~ s:\(.*\)::; #removing any paranthesis
		printf $fdout join(",",@{$arrayRef->[$i]})."\n";
	}
}



#JSON : byProduct : { name : 'product', children :[
#           { name: dbversion, size: num_servers, color: db_sw } ... ]
#        }
sub printJSONbyProduct {
	my $fdout;
	my $outJSONFile_byProductNum = 'src/html/byProdNumServers.json';
	open($fdout, ">".$outJSONFile_byProductNum) or die ("ERROR : Create file $outJSONFile_byProductNum failed\n");
	my $arrayRef = shift;

	my %hash= ();

    for (my $i=0; $i <@$arrayRef; $i++) {
        my $product = product_filter($arrayRef->[$i][$PRODUCT]);

        my $db_version = $arrayRef->[$i][$DB_VERSION];
        my $db_sw_name = $arrayRef->[$i][$DB_SW_NAME];
        if(! exists $hash{$product}) {
            $hash{$product} = { };
        } 
				if (!exists $hash{$product}{$db_version}) {
					$hash{$product}{$db_version} = { sw => $db_sw_name, count => 0}
				}
        $hash{$product}{$db_version}{count}++;
    }

	printf $fdout qq({\n "name" : "byProductNum", "children" : [\n);

	my @prods = keys %hash;
	foreach my $prod (@prods) {
		printf $fdout qq(\t{ "name" : "$prod", "children" : [\n);
		my @db_vers = keys $hash{$prod};
		my $count = 0;
		foreach my $db_ver (@db_vers) {
			printf $fdout qq(\t\t{ "name" : "$db_ver", "size": $hash{$prod}{$db_ver}{count}, "db_sw" : "$hash{$prod}{$db_ver}{sw}"});
			printf $fdout "%s\n", ($db_ver ne $db_vers[-1]) ? ',':'';
			$count += $hash{$prod}{$db_ver}{count};
		}
		printf $fdout qq(\t\t], "size" : $count\n\t});
		printf $fdout "%s\n", ($prod ne $prods[-1])?',':'';
	}

	printf $fdout qq( ]\n});

	close($fdout);

}


sub printJSONbyProductSize {
	my $fdout;
	my $outJSONFile= 'src/html/byProdDbSize.json';
	open($fdout, ">".$outJSONFile) or die ("ERROR : Create file $outJSONFile failed\n");
	my $arrayRef = shift;

	my %hash= ();

    for (my $i=0; $i <@$arrayRef; $i++) {
        my $product = product_filter($arrayRef->[$i][$PRODUCT]);

        my $db_version = $arrayRef->[$i][$DB_VERSION];
        my $db_sw_name = $arrayRef->[$i][$DB_SW_NAME];
				my $db_size = $arrayRef->[$i][$DB_SIZE] ;
        if(! exists $hash{$product}) {
            $hash{$product} = { };
        } 
				if (!exists $hash{$product}{$db_version}) {
					$hash{$product}{$db_version} = { sw => $db_sw_name, db_size => 0}
				}
        $hash{$product}{$db_version}{db_size}+= $db_size;
    }
	printf $fdout qq({\n "name" : "byProductNum", "children" : [\n);

	my @prods = keys %hash;
	foreach my $prod (@prods) {
		printf $fdout qq(\t{ "name" : "$prod", "children" : [\n);
		my  $size = 0;
		my @db_vers = keys $hash{$prod};
		foreach my $db_ver (@db_vers) {
			printf $fdout qq(\t\t{ "name" : "$db_ver", "size": $hash{$prod}{$db_ver}{db_size}, "db_sw" : "$hash{$prod}{$db_ver}{sw}"});
			printf $fdout "%s\n", ($db_ver ne $db_vers[-1]) ? ',':'';
			$size += $hash{$prod}{$db_ver}{db_size};
		}
		if ($size < 1000 ) { $size .= "GB"; }
		else { $size = (int ($size/1000))."TB"; }
		printf $fdout qq(\t\t], "size" : "$size" \n\t});
		printf $fdout "%s\n", ($prod ne $prods[-1])?',':'';
	}

	printf $fdout qq( ]\n});

	close($fdout);

}

#
# sanitize product field. Need to fix this to be more accurate.
#
sub product_filter {
	my $prod = shift;
	if($prod =~ m:\n$:) {
		$prod =~ s:$&::;
	}
	
	if ($prod =~ m:clarity:i) {
		$prod = 'clarity';
	} elsif ($prod =~ m:csm:i){
		$prod = 'csm';
	} elsif ($prod =~ m:N/A:) {
		$prod = 'unused';
	} elsif ($prod =~ m:This server hosts no customers:){
		$prod = 'unused';
	} elsif ($prod =~ m:^\s*$:) {
		$prod = 'unused';
	}

	return $prod;
}

# 
# sanitize datacenter field. Need to fix this
#
sub datacenter_filter {
	my $datacenter = shift;
	$datacenter =~ s:\(.*\):: ; # remove anything in parantheses
}

