the database is spatial-temporal (no need to save more than one spatial state?)

the database is distributed using a spatial mesh

nodes connect to the clossest node in positive x and positive y. This makes for two loops of connected nodes.
space wraps around in the domain, so there will always be a node in every direction. if you are alone, this will be yourself.

nodes connect to their neighbours and their neighbours.
total number of connections is between 1 and 16. 4 + 4 * 3.
if one connection drops, a new one is immediatly established.
if multiple connections drop at the same time, the nodes will search for the right connections

When asking about a value in the database both the owner node and it's neigbours are asked.
from these 5 values the mean is calculated.
By changing the corresponding value in the local database to this mean, no weight is lost.

Values are checked once in a while depending on network stress.
If no packets are lost, there is no need to check.
