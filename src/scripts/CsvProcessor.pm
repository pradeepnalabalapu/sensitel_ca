package CsvProcessor;
use strict;

my $DEBUG_FLOW = 1;
sub new {
	my $class = shift;
	my $filename = shift;
	my $keywordArray = shift;
	my $debug = shift;
	my $fd;
	if ($debug & $DEBUG_FLOW) {
		printf "Creating Processor object for file $filename\n";
	}
	open ($fd, $filename) or die "Can't read file $filename\n"; 

	my $self = {
		filename => $filename,
		fd => $fd,
		keywords => $keywordArray,
		debug => $debug,
	};
	
	bless $self, $class;
	return $self;
}

# Reads header from the csvfile, 
# for the keys in $self->{keywords}, it finds matching position within header
#   the positions are stored as $self->{indexOfKeys}
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
		
	for (my $i=0; $i < $len ; $i++){
		my $key = $self->{keywords}[$i];
		for (my $j=0; $j<$headerlen; $j++) {
			#printf ("\t\tkey=$key headerToken=$headerTokens[$j]\n");
			if ($headerTokens[$j] =~ m:$key:) {
				$indexOfKey[$i] = $j;
				printf ("indexOfKey[$key] = $j\n") if ($self->{debug} & $DEBUG_FLOW);
				last;
			}
		}
	}
	$self->{indexOfKey} = \@indexOfKey;
}

sub readData {
	my $self = shift;
	my $outArray = shift;
	my $line;
	my $fd = $self->{fd};
	while ($line = <$fd>) {

	}


}

sub DESTROY {
	my $self=shift;
	close($self->{fd});
}

return 1;
