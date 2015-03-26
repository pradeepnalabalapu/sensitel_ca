#!/usr/bin/perl
use strict;

my $filename = shift;
my $fd;
open ($fd, $filename) or die "ERROR : Cannot read the file $filename\n";
my $tmpfile = "temp.csv";
my $fdout;
open($fdout,">".$tmpfile) or die "ERROR : unable to create file $tmpfile\n";

my $firstline = <$fd>;
printf $fdout $firstline;
my @matching_commas = ($firstline =~ m/,/g);
my $num_commas = @matching_commas;
printf ("num_commas = $num_commas\n");

my $n_commas=0;
my $cumul_line='';
while (my $line = <$fd>) {
#printf ("line=$line");
	my @commas = ($line =~ m/,/g);
	$n_commas += @commas;
#printf ("n_commas=$n_commas\n"); 
	if($n_commas >= $num_commas) {
		printf $fdout $cumul_line.$line;
	 	$n_commas=0;
		$cumul_line='';
	} else {
		$line =~ s:\n$::;
		$cumul_line.= $line;
	}
}

qx:mv $tmpfile $filename:;


