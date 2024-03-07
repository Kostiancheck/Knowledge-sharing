File format is headless csv with following columns:

city,temperature

- city is string, contains only english letters and spaces
- temperature is float in range [-15.0, 36.0]

There are 500000 records for each city

The goal is to calculate min, mean, max temperatures for each city and save the results in .csv file with following columns:

city,min,mean,max

`test.py` - reference implementation, single core, 8.5 min

`test.csv` - reference results