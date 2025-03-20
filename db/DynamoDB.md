DynamoDB = serverless NoSQL database.

Note serverless. It was designed from the very beginning to be used with serverless applications, primarily AWS Lambda. Fully managed by AWS.

Note NoSQL database (rather than key-value store). While key-value paradigm is core in DynamoDB, it has a wide range of other use cases that expand it's capabilities greatly.

## CAP

It's AP.

However, there is optional support for consistent reads. Such reads are subject to all the same old problems of network delays and outages, hence lower availability.

## Data types
```json
{
 "userId": {
  "S": "123"
 },
 "age": {
  "N": "35"
 },
 "createdAt": {
  "S": "2022-08-20"
 },
 "firstname": {
  "S": "Sandro"
 },
 "lastname": {
  "S": "Volpicella"
 },
 "orderIds": {
    "L": [
      {
        "S": "123"
      },
      {
        "N": "456"
      }
    ]
 },
 "subscription": {
    "M": {
          "customer_id": {
              "S": "cus_123"
          },
          "plan_id": {
              "S": "plan_123"
          }
    }
 },
 "favoriteFruits": {
    "SS": [ "apple", "pear"]
 }
}
```

That's why boto3 has de/serializer for dynamo: https://github.com/boto/boto3/blob/develop/boto3/dynamodb/types.py
## Primary key
**Partition Key** = id. Only one field. DynamoDB uses hash of this field to determine partition.
You can use numeric id, or some sort of composite string id to form partition key.

| SongId (Partition Key)    | Title         | Artist      | Album          | PublishedDate |
| ------------------------- | ------------- | ----------- | -------------- | ------------- |
| better-but-us-brother-ali | Better But Us | Brother Ali | Satisfied Soul | 2025-02-14    |

**Partition Key + Sort Key** = partition is created the same way, but sort key is used to determine sorting inside partition. 

| Artist (Partition Key) | Title (Sort Key) | Album          | PublishedDate |
| ---------------------- | ---------------- | -------------- | ------------- |
| Brother Ali            | Better But Us    | Satisfied Soul | 2025-02-14    |
Artist + Title -> given that no artist releases two songs with the same title.

Drawbacks of this approach:
- if you cannot narrow down your query by partition, query instantly becomes wildly inefficient
- pagination has to be cursor-based

## Secondary index
To mitigate this, secondary index was implemented.

Query: find all songs of album "Satisfied Soul".

Secondary index appropriate for this use case:

| Album (Partition Key) | Title (Sort Key) | Artist      |
| --------------------- | ---------------- | ----------- |
| Satisfied Soul        | Better But Us    | Brother Ali |
(given that no album contains two same titles)

Title and Artist here are included to construct a primary key to fetch the whole record later. Alternatively, any number of fields may be included in index itself. For this use case, we would definitely choose to include PublishedDate in index.

Any number of such secondary indices may be created.

## Client
boto3 can be used to communicate with DynamoDB. Unfortunately, it is quite low-level. Fortunately, it follows API specs closely.

``` python
client = boto3.client('dynamodb')
response = client.put_item(
	TableName='Songs',
	Item={
		'Artist': {
			'S': 'Brother Ali'
		},
		'Song': {
			'S': 'Uncle Sam Goddamn'
		},
		'Album': {
			'S': 'The Undisputed Truth'
		},
		'PublishedDate': {
			'S': '2007-05-04'
		}
	},
	ConditionalExpression='attribute_not_exists("Artist") AND attribute_not_exists("Song")'
)
```

Yes, by default PutItem operation overwrites record.

## Resource
Resource is a bit higher-level. But the capabilities are not at all the same as client, only `batch_get_item`, `batch_write_item`, `create_table` operations are allowed.

``` python
resource = boto3.resource('dynamodb')
response = resource.batch_get_item(
	RequestItems = {
		'Songs': {
			'Keys': [
				{
					'Artist': 'Brother Ali'
				}
			]
		}
	}
)
```

For all the other operations you will need another resource - `Table`.

``` python
resource = boto3.resource('dynamodb')
table = resource.Table('Songs')
print(table.item_count)
response = table.put_item(
	# TableName is ommited since we are already using Table resource
	Item={
		'Artist': {
			'S': 'Brother Ali'
		},
		'Song': {
			'S': 'Uncle Sam Goddamn'
		},
		'Album': {
			'S': 'The Undisputed Truth'
		},
		'PublishedDate': {
			'S': '2007-05-04'
		}
	},
	ConditionalExpression='attribute_not_exists("Artist") AND attribute_not_exists("Song")'
)
```

## Automatic scaling
Process:
- set target utilization
- if for two consecutive minutes usage is higher than target, auto scaling is triggered
- auto scaling down too
It has to be applied to all relevant table and secondary indices.

There is also a cool feature called 'Warm throughput'. It defines how many read (or write) operations can table handle at a given moment. So you can increase this value for relevant tables if you know that some event will drive temporarily increased traffic.
## DAX
While DynamoDB is fast enough, there is an optional in-memory cache layer. It works best for eventually consistent data.

The interface is the same as for Dynamo, you just have to replace 'dynamo' client with 'DAX' client.

In my experience, it is up to 10x faster than regular DynamoDB operations, especially simple PK lookups.

## Change Data Capture
AWS docs present item-level CDC as one of the major offerings of DynamoDB. I don't care much for this feature, so don't really know what to say.

## Comparisons
Redis: 
- you can't really compare. DynamoDB is an actual database, albeit with focus on key lookups. Redis, even with 'persistent storage', is not.

MongoDB:
- for fair comparison, we should only take MongoDB Atlas or similar managed services into consideration
- more comprehensive data types (and bson in general)
- powerful aggregation pipelines
- less limitations (doc size, # of writes per transaction etc)
- IDK exactly about pricing, but Dynamo is quite costly
- BUT... Dynamo performance is unmatched. All the limitations are a conscious choice made to optimize performance, availability, scalability.

## Conclusions
I think I'd like to work with managed Postgres.

If you're building on Lambdas, Dynamo seems like the way to go.

If you need doc store but also run analytical queries on it, or want to self-host, or need consistency, MongoDB is the appropriate choice.
