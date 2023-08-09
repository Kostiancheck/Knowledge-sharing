A **data mart** is a more refined subset of a warehouse by Inmon designed to serve analytics and reporting, focused on a single suborganization, department, or line of business; every department has its own data mart, specific to its needs. This is in contrast to the full data warehouse that serves the broader organization or business. Data marts exist for two reasons. First, a data mart makes data more easily accessible to analysts and report developers. Second, data marts provide an additional stage of transformation beyond that provided by the initial ETL or ELT pipelines. This can significantly improve performance if reports or analytics queries require complex joins and aggregations of data, especially when the raw data is large. Transform processes can populate the data mart with joined and aggregated data to improve performance for live queries [^1].

![[Data Marts.png]]

In opposite of data marts approach (Bill Inmon approach) where we integrates data from across the business in the data warehouse, and serves department-specific analytics via data marts, the Kimball model is bottom-up, encouraging you to model and serve department or business analytics in the data warehouse itself.
![[Kimbal DWh.png]]
[^2]

[^1]: [[Fundamentals_of_Data_Engineering.pdf]] - page 150 and 414
[^2]: https://www.youtube.com/watch?v=Tff34jj_V-0&list=WL&index=8&t=50s&ab_channel=nullQueries - comparison of Kimball and Inmon Data Warehouse Architectures
