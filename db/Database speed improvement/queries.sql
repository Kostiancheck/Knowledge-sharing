create index person_first_name_birthday on person(first_name, birthday);

explain analyze select * from person where first_name='Angela' and birthday = '1980-04-13';

explain analyze select * from person where first_name='Angela' and birthday between '1980-02-13' and '2000-02-13';

explain analyze select * from person where starts_with(first_name, 'An') and birthday = '1980-04-13';