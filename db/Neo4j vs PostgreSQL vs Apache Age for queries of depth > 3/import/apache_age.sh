docker exec -it neo_postgres-postgres-1 bash

psql -U postgres neo4j

# CREATE EXTENSION AGE; # for existing server

LOAD 'age';

# something like PYTHONPATH
SET search_path = ag_catalog, "$user", public;

# create graph
SELECT * FROM ag_catalog.create_graph('persons');
# drop graph
SELECT * FROM ag_catalog.drop_graph('persons', true);

# show all graphs
SELECT * FROM ag_catalog.ag_graph;

# create labels
SELECT create_vlabel('persons','Person');
SELECT create_elabel('persons','FRIENDS_WITH'); 

# create index
CREATE UNIQUE INDEX person_id_index ON persons."Person" USING HASH ((properties -> 'id'));
# drop index
DROP INDEX persons."person_id_index";

# in pgAdmin
LOAD 'age';
SET search_path = ag_catalog, "$user", public;
SELECT * FROM ag_catalog.create_graph('persons');
SELECT create_vlabel('persons','Person');
SELECT create_elabel('persons','FRIENDS_WITH');
SELECT * FROM load_labels_from_file('persons', 
                      'Person',
                      '/var/lib/postgresql/nodes.csv');
CREATE INDEX person_id_index ON persons."Person" USING HASH ((properties -> 'id'));
SELECT load_edges_from_file('persons', 
                        'FRIENDS_WITH',
                        '/var/lib/postgresql/edges_age_1.csv');
SELECT load_edges_from_file('persons', 
                        'FRIENDS_WITH',
                        '/var/lib/postgresql/edges_age_2.csv');
