# General
> [!warning]
> If you will try to run same queries you will get different results since data was generated randomly

A ***view*** is a **named query** stored in the PostgreSQL database server. A view is defined based on one or more tables which are known as **base tables**, and the query that defines the view is referred to as a **defining query**.

After creating a view, you can query data from it as you would from a regular table. Behind the scenes, PostgreSQL will rewrite the query against the view and its defining query, executing it to retrieve data from the base tables.
![[Pasted image 20240325123303.png]]
Views do not store data except the [materialized views](https://www.postgresqltutorial.com/postgresql-views/postgresql-materialized-views/). In PostgreSQL, you can create special views called materialized views that store data physically and periodically refresh it from the base tables.

The materialized views are handy in various scenarios, providing faster data access to a remote server and serving as an effective caching mechanism.

Views offer some advantages:
 1) Simplifying complex queries
	Views help simplify complex queries. Instead of dealing with [joins](https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-joins/), [aggregations](https://www.postgresqltutorial.com/postgresql-aggregate-functions/), or [filtering conditions](https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-where/), you can query from views as if they were regular tables.
	
	Typically, first, you create views based on complex queries and store them in the database. Then, you can use simple queries based on views instead of using complex queries.
 1) Security and access control
	Views enable fine-grained control over data access. You can create views that expose subsets of data in the base tables, hiding sensitive information.
	
	This is particularly useful when you have applications that require access to distinct portions of the data.

# Basic views
## Create view
Let's create 2 views and check them
```sql
CREATE VIEW joels AS 
-- You can also use CREATE OR REPLACE
SELECT *
FROM person
WHERE first_name = 'Joel';

select count(*) from joels limit 10;
select * from joels limit 10;

CREATE VIEW young_joels AS 
SELECT *
FROM joels
WHERE birthday > '2001-01-01' ;

select count(*) from young_joels limit 10;
select * from young_joels limit 10;
```
## List views
```sql
select * from INFORMATION_SCHEMA.views;

select * from INFORMATION_SCHEMA.views where table_name LIKE '%joels%';

-- get view definition
select pg_get_viewdef('joels', true);
```
Also u can get view definition in pg cli using `\d+ view_name` or list all view `\dv` (where `dv` stands for **d**isplay **v**iews)
## Drop view
General syntax:
```sql
DROP VIEW [IF EXISTS] view_name [CASCADE | RESTRICT];
```
- use _`CASCADE`_ option to remove dependent objects along with the view or 
- _`RESTRICT`_ option to reject the removal of the view if other objects depend on the view. **The `RESTRICT` option is the default.**

```sql
-- drop view that not exists
DROP VIEW bruh;

ERROR: view "bruh" does not exist SQL state: _42P01_
```

```sql
-- drop view that not exists safely
DROP VIEW IF EXISTS bruh;

NOTICE: view "bruh" does not exist, skipping 
DROP VIEW 
Query returned successfully in 34 msec.
```

```sql
-- try to drop view other objects (in our case another view) depends on
DROP VIEW joels; -- RESTRICT by default

ERROR:  view young_joels depends on view joelscannot drop view joels because other objects depend on it 

ERROR:  cannot drop view joels because other objects depend on it
SQL state: 2BP01
Detail: view young_joels depends on view joels
Hint: Use DROP ... CASCADE to drop the dependent objects too.
```

```sql
-- drop view CASCADE instead of RESTRICT
DROP VIEW joels CASCADE;

NOTICE:  drop cascades to view young_joels
DROP VIEW

Query returned successfully in 33 msec.
```

```sql
-- check if views were deleted
select * from INFORMATION_SCHEMA.views where table_name LIKE '%joels%';

Returns no rows
```

# Updatable views
Updatable view means that you can [insert](https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-insert/), [update](https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-update/), or [delete](https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-delete/) data from the underlying tables via the view. A view can be updatable if it meets certain conditions:
1.  the defining query of the view must have exactly one entry in the `FROM` clause, which can be a table or another updatable view.
2. the defining query must not contain one of the following clauses at the top level:
	- [GROUP BY](https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-group-by/)
	- [HAVING](https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-having/)
	- [LIMIT](https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-limit/)
	- [OFFSET FETCH](https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-fetch/)
	- [DISTINCT](https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-select-distinct/)
	- [WITH](https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-cte/)
	- [UNION](https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-union/)
	- [INTERSECT](https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-intersect/)
	- [EXCEPT](https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-tutorial/postgresql-except/)
	- [Window functions](https://www.postgresqltutorial.com/postgresql-window-function/)
	- [Set-returning function](https://www.postgresqltutorial.com/postgresql-plpgsql/plpgsql-function-returns-a-table/)
	- [Aggregate functions](https://www.postgresqltutorial.com/postgresql-aggregate-functions/)

An updatable view may contain both updatable and non-updatable columns. If you attempt to modify a non-updatable column, PostgreSQL will raise an error.

When you execute a modification statement such as [INSERT](https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-insert/), [UPDATE](https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-update/), or [DELETE](https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-delete/) to an updatable view, PostgreSQL will convert this statement into the corresponding statement of the underlying table.

If you have a `WHERE` condition in the defining query of a view, you still can update or delete the rows that are not visible through the view. However, if you want to avoid this, you can use the `WITH CHECK OPTION` to define the view.

Let's create and play around with updatable view. We will use same example as in [[#Basic views]] section
## Create view
```sql
CREATE OR REPLACE VIEW joels AS 
SELECT first_name, last_name, birthday
FROM person
WHERE first_name = 'Joel';

select * from INFORMATION_SCHEMA.views where table_name LIKE '%joels%';
```
as you can see in the output `is_updatable` and `is_insertable_into` are "YES" 
## Insert into view
```sql
select count(*) from joels;
-- 53529
insert into joels (first_name, last_name, birthday)
VALUES ('Joel', 'Joelson', '1999-09-09');

select count(*) from joels;
-- 53530
```
we can see that Joel Joelson was added into original table
```sql
select * from person
where first_name='Joel' and last_name='Joelson';
```
## Update in view
```sql
UPDATE joels
SET birthday = '1337-03-07'
WHERE first_name='Joel' and last_name='Joelson';

select count(*) from joels;
```
## Delete from view
```sql
select count(*) from joels;
-- 53530
DELETE FROM joels 
WHERE first_name='Joel' and last_name='Joelson';

select count(*) from joels;
-- 53529
```

## WITH CHECK OPTION
To ensure that any data modification made through a view stick to certain conditions in the view’s definition, you use the `WITH CHECK OPTION` clause. PostgreSQL will ensure that you can only modify data of the view that satisfies the condition in the view’s defining query.

In PostgreSQL, you can specify a scope of check:
- *`LOCAL`* scope restricts the check option enforcement to the current view only. It does not enforce the check to the views that the current view is based on.
- *`CASCADED`* scope extends the check option enforcement to all underlying views of the current view

Let's create view *WITHOUT check option*
```sql
CREATE OR REPLACE VIEW women AS 
SELECT *
FROM person
WHERE gender = 'F';
```

now select specific women's ID and update her
```sql
select * from women limit 10;

-- change gender
UPDATE women
SET gender='M', first_name='Charles', last_name='Dickens'
WHERE id=9858299; -- This women info: 9858299 Shane Cummings F 1995-06-17

-- she is not women anymore...
select * from women where id=9858299;
```
As you can see we successfully updated value for the women and changed gender from F to M via `women` view even that `women` view contains only gender=F. Same for inserting
```sql
-- we are able to insert man to the person table via women view. Bene Gesserit are mad
INSERT INTO women(first_name, last_name, gender, birthday)
VALUES ('Paul', 'Atreides', 'M', '19990-06-06');
```

Now let's try to do the same but *WITH check option*
```sql
CREATE OR REPLACE VIEW women AS 
SELECT *
FROM person
WHERE gender = 'F'
WITH CHECK OPTION; -- <----------
```
now select specific women's ID and update her
```sql
-- try to change gender
select * from women limit 10;

UPDATE women
SET gender='M', first_name='Charles', last_name='Dickens'
WHERE id=9858305; -- This women info: 9858305 Lisa Kim F 1996-11-04

ERROR:  Failing row contains (9858305, Charles, Dickens, M, 1996-11-04).new row violates check option for view "women" 

ERROR:  new row violates check option for view "women"
SQL state: 44000
Detail: Failing row contains (9858305, Charles, Dickens, M, 1996-11-04).
```
as you can see we cannot do this because we are trying to change gender to M but view `women` works only with gender F. Same for the inserting
```sql
-- we are not able to insert man to the person table via women view. Bene Gesserit says: 'No more Kwisatz Haderach'
INSERT INTO women(first_name, last_name, gender, birthday)
VALUES ('Kwisatz', 'Haderach', 'M', '19990-06-06');

ERROR:  Failing row contains (43000007, Kwisatz, Haderach, M, 19990-06-06).new row violates check option for view "women" 

ERROR:  new row violates check option for view "women"
SQL state: 44000
Detail: Failing row contains (43000007, Kwisatz, Haderach, M, 19990-06-06)
```

## Not updatable view
Now let's try to create some views that cannot be updated:
```sql
CREATE OR REPLACE VIEW youngest_joel AS 
SELECT MAX(birthday)
FROM person
WHERE first_name = 'Joel';

CREATE OR REPLACE VIEW some_joels AS 
SELECT *
FROM person
WHERE first_name = 'Joel'
LIMIT 10;

CREATE OR REPLACE VIEW window_joels AS 
SELECT first_name, last_name, LAG(last_name, 1) OVER (ORDER BY birthday) previous_last_name, birthday
FROM person
WHERE first_name = 'Joel';

select table_name,is_updatable, is_insertable_into
from INFORMATION_SCHEMA.views 
where table_name in ('youngest_joel', 'some_joels', 'window_joels');
```
as you can see in the output `is_updatable` and `is_insertable_into` are "NO" for all tables

![[Pasted image 20240325171124.png]]
# Materialized views
PostgreSQL extends the view concept to the next level which allows views to store data physically. These views are called **materialized views**. Materialized views cache the result set of an expensive query and allow you to refresh data periodically. The materialized views can be useful in many cases that require fast data access. Therefore, you often find them in data warehouses and business intelligence applications.

The differences between materialized view and table are that the materialized view cannot subsequently be directly updated and that the query used to create the materialized view is stored in exactly the same way that a view's query is stored, so that fresh data can be generated for the materialized view with:

**You can put and Index on materialized view**
## Create
To create a materialized view, you use the `CREATE MATERIALIZED VIEW` statement.
```sql
CREATE MATERIALIZED VIEW [IF NOT EXISTS] view_name AS query WITH [NO] DATA;
```

If you want to load data into the materialized view at the creation time, use the `WITH DATA` option; otherwise, you use `WITH NO DATA` option. If you use the `WITH NO DATA` option, the view is flagged as unreadable. It means that you cannot query data from the view until you load data into it. Pay attention that there is not `OR REPLACE` option.

Now let's create mat view and view
```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS mat_joels AS 
SELECT first_name, last_name, birthday
FROM person
WHERE first_name = 'Joel';


CREATE OR REPLACE VIEW joels AS 
SELECT first_name, last_name, birthday
FROM person
WHERE first_name = 'Joel';
```
Now we can see these views
```sql
select * from INFORMATION_SCHEMA.views where table_name LIKE '%joels%';
select * from pg_matviews;
```
Let's compare query speed for view, regular table and mat view 
```sql
-- speed test
EXPLAIN ANALYZE SELECT count(*), min(birthday), max(birthday) from joels;
-- "Execution Time: 1679.359 ms"
EXPLAIN ANALYZE SELECT count(*), min(birthday), max(birthday) from person where first_name = 'Joel';
-- "Execution Time: 1751.062 ms"
EXPLAIN ANALYZE SELECT count(*), min(birthday), max(birthday) from mat_joels;
-- "Execution Time: 37.228 ms"
```

```chart
type: bar
labels: [table, view, mat. view]
series:
  - title: time ms.
    data: [1679, 1751, 37]
tension: 0.2
width: 100%
labelColors: false
fill: true
beginAtZero: false
bestFit: false
bestFitTitle: undefined
bestFitNumber: 0
```

## Refresh
To load data into a materialized view, you use the  `REFRESH MATERIALIZED VIEW` statement.  *When you refresh data for a materialized view, PostgreSQL will lock the materialized view table while refreshing. Consequently, you will not be able to query the view* . Let's count number of Joels in both views and add one more Joel:
```sql
SELECT count(*) from joels;
-- 53528
SELECT count(*) from mat_joels;
-- 53528

-- insert new person into original table
INSERT INTO person(first_name, last_name, gender, birthday)
VALUES ('Joel', 'The Second', 'M', '1999-12-12');

SELECT count(*) from joels;
-- 53529
SELECT count(*) from mat_joels;
-- 53528
```

as you can see mat view `mat_joels` is not in sync with original table, so we need to refresh it. If we will try to refresh in concurrently we will get an error:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY mat_joels;

ERROR:  cannot refresh materialized view "public.mat_joels" concurrently
HINT:  Create a unique index with no WHERE clause on one or more columns of the materialized view. 

SQL state: 55000
```
So for now let's stick to default refreshing
```sql
REFRESH MATERIALIZED VIEW mat_joels;

SELECT count(*) from mat_joels;
-- 53529
```
After refresh mat view is in sync with original table and have the same number of rows.

Now let's create more complex view that will take ~60 seconds to run
```sql
EXPLAIN ANALYZE CREATE MATERIALIZED VIEW mat_joels_hard AS 
SELECT count(*), min(p2.birthday), max(p2.birthday)
FROM person as p, person as p2
WHERE p.first_name = 'Joel' and p.last_name='Hess' and p2.birthday > '2000-01-01';

```
simple select same as from mat view also takes around ~60 seconds
```sql
EXPLAIN ANALYZE SELECT count(*), min(p2.birthday), max(p2.birthday)
FROM person as p, person as p2
WHERE p.first_name = 'Joel' and p.last_name='Hess' and p2.birthday > '2000-01-01';
```

Now let's refresh this view and at the same time run some query on it (run query in separate tabs in pgAdmin)
```sql
EXPLAIN ANALYZE select * from mat_joels_hard limit 10;
-- "Execution Time: 0.015 ms" query completed in 167 ms.

-- next two queries will be running at the same time on different tabs

REFRESH MATERIALIZED VIEW mat_joels_hard; -- ~20 seconds

EXPLAIN ANALYZE select * from mat_joels_hard limit 10;
-- "Execution Time: 0.015 ms" but query completed in ~20 seconds
```
So we can see that second select query was waiting around 20 seconds for refresh to finish before execution due to the lock.

To avoid materialized view lock, you can use the `CONCURRENTLY` option. With the `CONCURRENTLY` option, PostgreSQL creates a temporary updated version of the materialized view, compares two versions, and performs `INSERT` and `UPDATE` only the differences (we will dive deeper into it later). One requirement for using `CONCURRENTLY` option is that the *materialized view must have a `UNIQUE` index*
Let's try to run concurrent refresh. First of all we need to create view and unique index, so let's add ID field to the view:
```sql
EXPLAIN ANALYZE CREATE MATERIALIZED VIEW mat_joels_hard_wit_id AS 
SELECT p.id, count(*)
FROM person as p, person as p2
WHERE p.first_name = 'Joel' and p.last_name='Hess' and p2.birthday > '2000-01-01'
GROUP BY p.id;

-- "Execution Time: 82680.368 ms"
```
after that we can create UNIQUE index based on `id` column:
```sql
CREATE UNIQUE INDEX unique_joel ON mat_joels_hard_wit_id (id);
```
now let's to concurrent refresh and run some select query on that view at the same time same as we did for regular refresh
```sql
EXPLAIN ANALYZE select * from mat_joels_hard_wit_id limit 10;
-- "Execution Time: 0.026 ms" query completed in 107 ms.

-- next two queries will be running at the same time on different tabs

REFRESH MATERIALIZED VIEW mat_joels_hard_wit_id; -- ~40 seconds

EXPLAIN ANALYZE select * from mat_joels_hard_wit_id limit 10;
-- "Execution Time: 0.026 ms" query completed in 128 ms.
```

As we can see in case of concurrent refresh took ~40 seconds comparing to ~20 or regular refresh, but at the same time we were able to run select query during refreshing using concurrent refresh.

> [!info]
> There is no build in method to schedule view refresh, but you can use external schedulers to execute refresh (e.g. Airflow) or use https://github.com/citusdata/pg_cron
### Dive deeper into REFRESH
> But how `REFRESH` works under the hood? (c) Nerd in my head

I'm not sure how exactly `REFRESH` works. My assumption was that it takes "snapshot" of the table at the first run and after that checks for updates in transaction logs that were made after "snapshot" time and applies them, because `REFRESH` works faster than view creation or simple select from view deffiniton.
At the same time different sources says that the old contents are discarded, that REFRESH is just combination of `TRUNCATE entire table + run view query and insert results to the table` . So to figure out let's do our favourite stuff and dive into some **C** code 🤿🥲. But in our case we need comments only 😌 

[How refresh executes](https://github.com/postgres/postgres/blob/89e5ef7e21812916c9cf9fcf56e45f0f74034656/src/backend/commands/matview.c#L112C1-L131C4)
```c
/*
 * ExecRefreshMatView -- execute a REFRESH MATERIALIZED VIEW command
 *
 * This refreshes the materialized view by creating a new table and swapping
 * the relfilenumbers of the new table and the old materialized view, so the OID
 * of the original materialized view is preserved. Thus we do not lose GRANT
 * nor references to this materialized view.
 *
 * If WITH NO DATA was specified, this is effectively like a TRUNCATE;
 * otherwise it is like a TRUNCATE followed by an INSERT using the SELECT
 * statement associated with the materialized view.  The statement node's
 * skipData field shows whether the clause was used.
 *
 * Indexes are rebuilt too, via REINDEX. Since we are effectively bulk-loading
 * the new heap, it's better to create the indexes afterwards than to fill them
 * incrementally while we load.
 *
 * The matview's "populated" state is changed based on whether the contents
 * reflect the result set of the materialized view's query.
 */
```


From [here](https://github.com/postgres/postgres/blob/89e5ef7e21812916c9cf9fcf56e45f0f74034656/src/backend/commands/matview.c#L548) we can get an idea how concurrent refresh works
```c
/*
 * refresh_by_match_merge
 *
 * Refresh a materialized view with transactional semantics, while allowing
 * concurrent reads.
 *
 * This is called after a new version of the data has been created in a
 * temporary table.  It performs a full outer join against the old version of
 * the data, producing "diff" results.  This join cannot work if there are any
 * duplicated rows in either the old or new versions, in the sense that every
 * column would compare as equal between the two rows.  It does work correctly
 * in the face of rows which have at least one NULL value, with all non-NULL
 * columns equal.  The behavior of NULLs on equality tests and on UNIQUE
 * indexes turns out to be quite convenient here; the tests we need to make
 * are consistent with default behavior.  If there is at least one UNIQUE
 * index on the materialized view, we have exactly the guarantee we need.
 *
 * The temporary table used to hold the diff results contains just the TID of
 * the old record (if matched) and the ROW from the new table as a single
 * column of complex record type (if matched).
 *
 * Once we have the diff table, we perform set-based DELETE and INSERT
 * operations against the materialized view, and discard both temporary
 * tables.
 *
 * Everything from the generation of the new data to applying the differences
 * takes place under cover of an ExclusiveLock, since it seems as though we
 * would want to prohibit not only concurrent REFRESH operations, but also
 * incremental maintenance.  It also doesn't seem reasonable or safe to allow
 * SELECT FOR UPDATE or SELECT FOR SHARE on rows being updated or deleted by
 * this command.
 */
```

But I still don't understand why REFRESH works faster than SELECT or CREATE VIEW. If you want to dive deeper you are welcome to look through materialized view logic [here](https://github.com/postgres/postgres/blob/89e5ef7e21812916c9cf9fcf56e45f0f74034656/src/backend/commands/matview.c)
## Vacuum
Materialized views need to be vacuumed:
1. At some point, old rows need to be [“frozen”](https://www.postgresql.org/docs/current/routine-vacuuming.html#VACUUM-FOR-WRAPAROUND) to prevent data loss when the transaction ID counter wraps around.
    
2. If you use `REFRESH MATERIALIZED VIEW CONCURRENTLY`, dead tuples are created and need to be removed by `VACUUM`.

So the materialized view is refreshed using temporary tables which is well supported by the unique index which we had created earlier. Since this is achieved by deleting expired records and inserting the new ones, it can lead to dead tuples and eventually the table starts bloating up.

It is obvious that you may see a lot of dead tuples because of the way that materialized view works. VACUUM may remove the dead rows, but it cannot reduce the bloat. The other way is to use Vacuum (FULL) which would lock the view itself and block all read and write operations.

This can be measured using _pgstattuple_ which is offered by postgres.
For more information see **Materialized views and dead tuples** section in the article https://engineering.rently.com/materialized-views-with-rails/

# Recursive view
In PostgreSQL, a recursive view is a view whose defining query references the view name itself.

A recursive view can be useful in performing hierarchical or recursive queries on hierarchical data structures stored in the database.

PostgreSQL 9.3 added a new syntax for creating a recursive view specified in the standard SQL. The `CREATE RECURSIVE VIEW` statement is syntax sugar for a standard

https://www.postgresqltutorial.com/postgresql-views/postgresql-recursive-view/
# Sources
1. https://www.postgresqltutorial.com/postgresql-views/
2. https://www.postgresql.org/docs/9.1/infoschema-views.html - tables with all views
3. https://www.postgresql.org/docs/current/rules-materializedviews.html - postgres materialized view
4. https://github.com/postgres/postgres/blob/89e5ef7e21812916c9cf9fcf56e45f0f74034656/src/backend/commands/matview.c#L548 - postgres mat view refresh with concurrent
5. https://engineering.rently.com/materialized-views-with-rails/ - nice article about mat view, also covers vacuum and dead tuples
6. https://www.timescale.com/blog/materialized-views-the-timescale-way/ - nice article about views
7. https://dba.stackexchange.com/questions/294302/is-vacuuming-a-postgresql-materialized-view-necessary - Is vacuuming a PostgreSQL materialized view necessary?