 createPathFromNeo4J <- function(arg1){

	library ("igraph");
	library("RNeo4j");
	library("sqldf");
	library("plyr");
	library("rjson");
	graph <- startGraph("http://localhost:7474/db/data/", "neo4j", "foo");

    #  A bunch of cypher queries you might use for various things.
	
    #  Vader's people
	#q = "MATCH (t:Person {name: 'Darth Vader'})-[:CHILD_OF*0..6]-child RETURN child.personID as id, child.name as name, child.parent1 as parent1, child.parent2 as parent2, child.midichlorians as midichlorians, child.darkness as darkness";

	#  The Universe
	#q = "MATCH (t:Person)-[:CHILD_OF*1..1]-child RETURN child.personID as id, child.name as name, child.parent1 as parent1, child.parent2 as parent2, child.midichlorians as midichlorians, child.darkness as darkness";
	
    #  Families
	#q = "MATCH (n:Person) WHERE NOT (n)-[:CHILD_OF]->() OPTIONAL MATCH (child)-[:CHILD_OF*1..3]->(n) RETURN  child.personID as id, child.name as name, child.parent1 as parent1, child.parent2 as parent2, child.midichlorians as midichlorians, child.darkness as darkness";
    
    # set query string
    q <- arg1;
    # data frame based on results from neo4j
	rs1 = cypher(graph, q);
	
	# result of last query will include a fair numer of dupe rows based on *..6 in cypher query. Unique rows only, please
    rs2 = sqldf("Select id, name, parent1, parent2, midichlorians, darkness from rs1 GROUP BY id");
	
	# create from/to list from dataframe. Pull in midichlorians as betweeness for use in creating graph coords	
	rs3 = sqldf("Select p.name as 'from', r.name as 'to', r.id as childID, p.id as parentID, p.midichlorians from rs2 r 
	INNER JOIN  rs2 p on r.parent1 = p.id 
	UNION ALL 
	Select p.name as 'from', r.name as 'to', r.id as childID, p.id as parentID, p.midichlorians from rs2 r 
	INNER JOIN rs2 p on r.parent2 = p.id");


	# create graph
	mygraph <- graph.data.frame(rs3);
	# get coordinates for nodes
	coords <- layout.fruchterman.reingold(mygraph, weights=E(mygraph)$midichlorians);
	
	# add 'from' back in so we can join this info back to persons later
	c<-cbind(coords, data.frame(from=V(mygraph)$name));
	# rename columns (1,2) to x, y. 1 and 2 are a pain the ass as names.
	c <- rename(c, c("1"="x", "2"="y"));
	# bind coords back to persons and add a new pathOrder field for parents
	d <-join(c, rs3, by = 'from', type="left");
	# fields we don't care about anymore
	d$pathOrder <- 1;
	d$childID <-NULL;
	d$parentID <- NULL;
	d$midichlorians <- NULL;


	# now we need to add a second row for each parent-child combo. Doing so will create the 
	# second point in the path. We need the x, y coordinates to be those of the child,
	# not the parent.

	e <- sqldf("Select c.x as x, c.y as y, r.'from' as 'from', r.'to' as 'to', 2 as pathOrder from d r
	INNER JOIN c on r.'to' = c.'from'");
	f <- sqldf ("SELECT * from d UNION ALL SELECT * from e");


	# Merge node properties back to list of persons and coordinates
	g <- sqldf("Select r.x as x, r.y as y, r.'from' as 'from', r.'to' as 'to', i.midichlorians as midichlorians, i.darkness as darkness, r.pathOrder as pathOrder from f r
	INNER JOIN rs2 i on r.'from' = i.name");
    g <- toJSON(g);
    return(g);
}

