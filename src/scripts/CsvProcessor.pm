our $DB_SW_NAME;
our $STORAGE_SIZE;
our $DB_SIZE;
package CsvProcessor;
use strict;
use List::Util 'max';

our $DEBUG_FLOW;

sub new {
	my $class = shift;
	my $filename = shift; #name of csv file
	my $db_sw_name = shift; #name of the db program (eg. oracle)
	my $keywordArray = shift; #an array of column names to expect in csv file
	my $debug = shift;
	my $fd;
	if ($debug & $DEBUG_FLOW) {
		printf "Creating Processor object for file $filename\n";
	}
	open ($fd, $filename) or die "ERROR : Can't read file $filename\n"; 

	my $self = {
		filename => $filename,
		fd => $fd,
		keywords => $keywordArray,
		debug => $debug,
		db_sw_name => $db_sw_name,
	};
	
	bless $self, $class;
	return $self;
}

# Reads header from the csvfile, 
# for the keys in $self->{keywords}, it finds matching position within header
#   the positions are stored as $self->{indexOfKey}
sub getHeader {
	my $self = shift;
	printf ("id=$self->{filename} fd=$self->{fd}\n") if ($self->{debug} & $DEBUG_FLOW);
	my $len = @{$self->{keywords}};
	my $line;

	my $fd = $self->{fd};

	while ( ($line = <$fd>) =~ /^,{10}/) {
	};
	if ($line =~ m:\n$:) {
		#printf ("found newline character at end of header\n");
		$line =~ s:\n$::;
	}
	#printf ("header = $line\n");
	my @headerTokens = split(',', $line);
	my @indexOfKey = ();
	my $headerlen = @headerTokens;
		
# foreach key in keywords array, find matching headerToken. 
#   set indexOfKey[$key] = index of the token (i.e. column number)
	for (my $i=0; $i < $len ; $i++){
		my $key = $self->{keywords}[$i];
		printf ("key = $key\n") if ($self->{debug} & $DEBUG_FLOW);
		if($key eq 'DB SW') {
			$indexOfKey[$i] = -1;
		} else {
			for (my $j=0; $j<$headerlen; $j++) {
				#printf ("\t\tkey=$key headerToken=$headerTokens[$j]\n");
				if ($headerTokens[$j] =~ m:$key:) {
					$indexOfKey[$i] = $j;
					printf ("indexOfKey[$key] = $j\n") if ($self->{debug} & $DEBUG_FLOW);
					last;
				}
			}
		}
	}

	printf ("indexOfKey = @indexOfKey\n") if ($self->{debug} & $DEBUG_FLOW);
	$self->{indexOfKey} = \@indexOfKey;
}

sub readData {
	my $self = shift;
	my $outArrayRef = shift; #referece to output array
	my $line;
	my $fd = $self->{fd};
	my @tokens;
	my @indexOfKeys = @{$self->{indexOfKey}};
	while ($line = <$fd>) {
		if ($line =~ /^[\s,]*$/) { next; } #skip empty lines
		$line =~ s/\n$//; #remove newline character at end of line if any
		my @tokens = split(/\s*,\s*/, $line); 
		my $storage_token= $tokens[$indexOfKeys[$STORAGE_SIZE]];

		#printf ("pre-storage_token = $storage_token\n");

		if($storage_token =~ m:(\d*\.\d*)\s*TB*:) {
			my $gb = ($1+0)*1000; 
			$storage_token =~ s:$&:$gb GB:;
		}
		#printf ("post-storage_token = $storage_token\n");

		my @numbers = ($storage_token =~ m:\d*\s*GB:g);
		#printf ("matching storage sizes = @numbers\n");
		my $max_size = max(@numbers);
		#printf ("max storage size $max_size\n");
		$max_size =~ s:\s*GB::;
		$tokens[$indexOfKeys[$STORAGE_SIZE]] = $max_size;
		$tokens[$indexOfKeys[$DB_SIZE]] =~ s:\s*GB::;



		my @info = ();
		for (my $i=0; $i < @indexOfKeys; $i++) {
			my $value;
			if($i == $DB_SW_NAME) {
				$value = $self->{db_sw_name};
			} else {
				$value = $tokens[$indexOfKeys[$i]];
			}
			push (@info, $value);
		}
		push @$outArrayRef, \@info;
	}

}

sub DESTROY {
	my $self=shift;
	close($self->{fd});
}

return 1;
