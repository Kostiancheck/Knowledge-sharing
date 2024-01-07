# Taxi service
1. OLTP database (e.g. postgres) contains information about users, drivers and orders (list of orders for each user)
2. OLAP db contains all historical data (all events/transactions):

DWh use case:
1. we want to know average time between "User created order" and "Driver accepted the order" events
2. we want to know average number of free drivers in radius of 5 km. from the order by day of week
3. we found that from 1000 order 5 of them have "driving time" 1000 years. Using historical data we can find that this outlier happens when specific combination of events occurs, so we can go and update backend logic
4. we found that specific driver has a big difference between actual time of arrival and predicted one. We can join users' review to see if they are satisfied of this driver
5. find correlation between average speed drivers speed and users' satisfaction (stupid example, but I like it :) 

Data Lake use case:
1. Store GPS pings and Google Maps suggested routes in Geo JSON format to compare suggested vs actual routes
2. Based on previous point train our own route suggestion model or select best maps to use (google, waze, etc.)
3. Store some photos 
4. If there are multiple microservices that operates in chain you can use data from DL to find at what step (what microservice) data was deleted/updated etc.

## TV architecuture
![[TV data architecture.png]]