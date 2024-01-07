A **data warehouse** is a central data hub used for reporting and analysis. Data in a data warehouse is typically highly formatted and structured for analytics use cases. 

The first data warehouse definition:
> A data warehouse is a subject oriented integrated nonvolatile and time variant collection of data in support of management’s decisions The data warehouse contains granular corporate data Data in the data warehouse is able to be used for many different purposes including sitting and waiting for future requirements which are unknown today
> \(c) Bill Inmon

Where 
1. Subject oriented
   The data warehouse focuses on a specific subject area, such as sales or marketing.
2. Nonvolatile
   Data remains unchanged after data is stored in a data warehouse.
3. Integrated
   Data from disparate sources is consolidated and normalized.
4. Time variant
   Varying time ranges can be queried.

But Ralph Kimball proposed opposite solution, whereas Inmon integrates data from across the business in the data warehouse, and serves department-specific analytics via data marts, the Kimball model is bottom-up, encouraging you to model and serve department or business analytics in the data warehouse itself.

Traditionally, a data warehouse pulls data from application systems by using ETL. The extract phase pulls data from source systems. The transformation phase cleans and standardizes data, organizing and imposing business logic in a highly modeled form. (Chapter 8 covers transformations and data models.) The load phase pushes data into the data warehouse target database system. [^1]

![[Basic data warehouse with ETL.png]]

Benefits of a data warehouse include the following: [^2]
- Informed data-driven decision making
- Consolidated data from many sources
- Historical data analysis
- Data quality, consistency, and accuracy
- Separation of analytics processing from transactional databases, which improves performance of both systems

## Do you need a DWh [^3]
Answer next questions to understand if you need DWh:
1. You need to run a lot of reports and you want to automate this process
2. You need to provide access to less-techical users (analytics, managers) in a simplified form (e.g. star-schema instead of 3rd normal form)
3. You want to track historical data for you analysis
4. You need to integrate data from different data sources


[^1]: [[Fundamentals_of_Data_Engineering.pdf]] - page 146 and 414
[^2]: https://aws.amazon.com/data-warehouse/ - AWS article about DWh
[^3]: https://www.youtube.com/watch?v=0DsaafI1fTQ&list=WL&index=14&t=200s&ab_channel=SeattleDataGuy - Seattle DataGuy video about DWh
[^4]: https://www.youtube.com/watch?v=rvURMymCpJM&list=WL&index=7&ab_channel=nullQueries - nice short video about DWh [^4]
[^5]: https://www.youtube.com/watch?v=Tff34jj_V-0&list=WL&index=8&t=50s&ab_channel=nullQueries comparison of Kimball and Inmon Data Warehouse Architectures [^5]
