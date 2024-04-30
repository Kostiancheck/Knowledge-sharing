# [ES] Mappings & Analysis

Created: April 7, 2024 1:11 PM
Owner: Din Lester
Tags: databases, search engine
Status: Done

Analysis in Elasticsearch refers to the process of converting full text into terms or tokens that can be used in the inverted index. This is essential for effective full-text search.

![Untitled](%5BES%5D%20Mappings%20&%20Analysis%20af939b5c496142408c4a913d7593be88/Untitled.png)

**Character filters**

The character filter has the ability to perform addition,removal or replacement actions on the input text given to them. To understand it more clearly, if the input strings contains a misspelled word recurring and we need to replace it with the correct one, we can use character filters for the same. One of the most common applications of this filter is to strip down the `html` tags from the input text.

```bash
curl -XPOST 'localhost:9200/_analyze?pretty' -H 'Content-Type: application/json' -d '{
  "tokenizer": "standard",
  "char_filter": [
    "html_strip"
  ],
  "text": "The <b> Auto-generation </b> is a success"
}'

# RESPONSE
“The”,”Auto”,”generation”,”is”,”a”,”success”
```

**Tokenizer**

The input text after its transformation from the Character filter is passed to the tokeniser. The tokenizer would split this input text into individual tokens (or terms) at specific characters. The default tokenizer in elasticsearch is the “standard tokeniser”, which uses the grammar based tokenisation technique, which can be extended not only to English but also many other languages.

```bash
curl -XPOST 'localhost:9200/_analyze?pretty’ -H ‘Content-Type: application/json' -d '{
 "tokenizer": "standard",
 "text": "The Auto-generation is a success"
}'

# RESPONSE
"The","Auto","generation","is","a","success" 
```

[LINK TO ES TOKENISATORS](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-tokenizers.html)

**Token filters**

After the input text is split into tokens/terms, it is handed over to the final stage of analysis, the token filtering. Token filters can act on the tokens generated from the tokenizers and modify,add, or remove them.

```bash
curl -XPOST 'localhost:9200/_analyze?pretty' -H 'Content-Type: application/json' -d'{
  "tokenizer": "standard",
  "filter": [
    "lowercase"
  ],
  "text": "The Auto-generation is a success"
}'

# RESPONSE
“the”,”auto”,”generation”,”is”,”a”,”success”
```

**The combination of these 3 components (character filters,tokenizers and token filters) are called as Analyzers.**

### [Short review] Inverted index ???

![Untitled](%5BES%5D%20Mappings%20&%20Analysis%20af939b5c496142408c4a913d7593be88/Untitled%201.png)

Some info from this [gorgeous channel](https://www.youtube.com/watch?v=nu5Le4YDhPA) (implementing inverted index in JS 🫠)

What if we want to find `apple iphone`, but don’t find `iphone apple` ? Need to store position of a word also.

```bash
id | name
1 | "fastest apple iphone ios"
2 | "fastest apple ipad"
3 | "fastest android phone from samsung"

fastest: [[1,0], [2,0], [3,0]]
apple: [[1,1], [2,1]]
iphone: [[1,2]]
ios: [[1,3]]
ipad: [[2,2]]
android: [[3,1]]
phone: [[3,2]]
from: [[3,3]]
samsung: [[3,4]]
```

### Overview of data types

However, the responses I mentioned before is not accurate. In reality ES returns smth like this:

```bash
POST /_analyze?pretty
{
  "text": "Hello, world. My name - Cannon",
  "analyzer": "standard"
}
# RESPONE
{
  "tokens": [
    {
      "token": "hello",
      "start_offset": 0,
      "end_offset": 5,
      "type": "<ALPHANUM>",
      "position": 0
    },
    {
      "token": "world",
      "start_offset": 7,
      "end_offset": 12,
      "type": "<ALPHANUM>",
      "position": 1
    },
    {
      "token": "my",
      "start_offset": 14,
      "end_offset": 16,
      "type": "<ALPHANUM>",
      "position": 2
    },
    {
      "token": "name",
      "start_offset": 17,
      "end_offset": 21,
      "type": "<ALPHANUM>",
      "position": 3
    },
    {
      "token": "cannon",
      "start_offset": 24,
      "end_offset": 30,
      "type": "<ALPHANUM>",
      "position": 4
    }
  ]
}
```

Here is the best time to speak about data types and mapping in ES 😉

**Data types**

Object is any valid JSON. Need to mention, that as ES is built on top of Lucene, under the hood any nested object is flattened, so Lucene can index it

![Untitled](%5BES%5D%20Mappings%20&%20Analysis%20af939b5c496142408c4a913d7593be88/Untitled%202.png)

Okay, but what if we need to store array of objects ? How to flatten them ???

![Untitled](%5BES%5D%20Mappings%20&%20Analysis%20af939b5c496142408c4a913d7593be88/Untitled%203.png)

So, when you’re searching on field in array, you just search in that array

But what if I need to run such a query ?

```bash
match products where reviews.author == "Joe Doe" and reviews.rating >= 4.0;
```

The record will be returned, because in this sitation ES doesn’t know about relationship between author and rating, because of flatten. We can say that in this situation AND was transformed to OR 🧐

To solve this there is `nested` type.

![Untitled](%5BES%5D%20Mappings%20&%20Analysis%20af939b5c496142408c4a913d7593be88/Untitled%204.png)

Now query will work fine, that’s because it stored independetly.

They are just like regular documents, but they are `hidden`  and we cannot retrieve them if only call them directly

**Keyword**

This data type is used for exact matching of values. Typically used for aggregations, filtering and sorting. 

For this type of data, ES uses keyword analyzer, so called no-op, because no operation is performed on the value

```bash
POST /_analyze?pretty
{
  "text": "Hello, world. My name - Cannon",
  "analyzer": "keyword"
}
# RESPONSE
{
  "tokens": [
    {
      "token": "Hello, world. My name - Cannon",
      "start_offset": 0,
      "end_offset": 30,
      "type": "word",
      "position": 0
    }
  ]
}
```

**Type coercion**

![Untitled](%5BES%5D%20Mappings%20&%20Analysis%20af939b5c496142408c4a913d7593be88/Untitled%205.png)

But if we try to put a new document with `price: “7.4msd”` it will cause and error.

Need to mention, that if we then retrieve this `_doc/2`  we’ll get “7.4” not 7.4. This is is because search queries use indexed values, not _source. _source doesn’t reflect how values are indexed

 We can disable coercion, it is enabled by default.

**Mappings**

![Untitled](%5BES%5D%20Mappings%20&%20Analysis%20af939b5c496142408c4a913d7593be88/Untitled%206.png)

They can be explicit (we define them before inserting) and dynamic (they are creating when 1st document are inserted)

Apart from defining nested objects with new curly brackets, we can use dot notation.

```bash
PUT /index_name
{
"mappings": {
	"properties": {
			"author.name": {"type" : "text"},
			"author.score": {"type": "float"},
			"author.email": {"type": "keyword"}
		}
	}
}
```

We can also add mapping to existing indicies

```bash
PUT /index_name/_mapping
{
	"properties": {
			"created_at": {"type": "date"}
		}
}
```

> ***Mapping check for types, however all fields are OPTIONAL, so no error will be raised if some field is missing.***
> 

### **Review of some common mapping parameters**

- format is used to customize the format for date fields, using Java’s DateFormatter syntax

```bash
PUT /index_name
{
"mappings": {
	"properties": {
			"created_at": {
				"type": "date",
				"format": "dd/MM/yyyy"
			}
		}
	}
}
# OTHER EXAMPLES OF FORMAT
"epoch_second"
```

- coerce used to enable or disable coercion of values (enabled by default)

```bash
PUT /index_name
{
"mappings": {
	"properties": {
			"amount": {
				"type": "float",
				"coerce": false
			}
		}
	}
}
# OTHER EXAMPLES OF COERCE (WE CAN PUT THIS SETTING ON ALL INDEX)
{
"settings":{
	"index.mapping.coerce":false
},
"mappings": {
	"properties": {
			"amount": {
				"type": "float",
				"coerce": true
			}
		}
	}
}
```

- doc_values essentially an “unenverted” inverted index))) It is used for sorting, aggreagations and scripting. It’s and additional data structure. We can disable this data structure for save disk space and slightly increase indexing throughput.

*DISABLE ONLY IF NO AGGREGATION/SORTING/SCRIPTING*

```bash
PUT /index_name
{
"mappings": {
	"properties": {
			"email": {
				"type": "keyword",
				"doc_values": false
			}
		}
	}
}
```

- norms is used for ranging results of search by relevance. Also, additional data type. Can disable when no search are taken place. Can say oppossite to doc_values ?)
- index disables indexing for a field, values still stored in _source. When no used for search queries, saves disk space and often used for time series data. Still can aggregate.
- null_value can replace NULL values with another value. In ES NULL values cannot be indexed or searched.

```bash
PUT /index_name
{
"mappings": {
	"properties": {
			"email": {
				"type": "keyword",
				"null_value": "NULL"
			}
		}
	}
}
```

- copy_to used to copy multiple field values into a “group field” . The target field in not part of _source. [DETAILED INFO](https://medium.com/@andre.luiz1987/using-copy-to-parameter-elasticsearch-34a3622bca6e)

```bash
PUT /index_name
{
"mappings": {
	"properties": {
			"first_name": {
				"type": "text",
				"copy_to": "full_name"
			},
			"last_name": {
				"type": "text",
				"copy_to": "full_name"
			},
			"full_name": {
				"type":"text"
			}
	}
}
```

### Updating existing mappings

Generally, ES field mappings cannot be changed

In order to update mapping, we need to use `Reindex API` or write custom script on Python, for example)

```bash
POST /_reindex
{
	"source": {
		"index": "index_old"
	},
	"dest": {
		"index": "index_new"
	}
}
```

However, it’ll upgrade index, but copy _source, so if we change from string to float, for example and then query new index we’ll get string, because of this.

To transform data types, we can use ES `script` or do it in any program language we queary to ES

```bash
POST /_reindex
{
	"source": {
		"index": "index_old"
	},
	"dest": {
		"index": "index_new"
	},
	"script": {
		"source": """
			if(ctx._source.field != null){
				ctx._source.field = ctx._source.field.toString();
			}
		"""
	}
}
```

We can also reindex documents matching the query, like in SQL:

```bash
POST /_reindex
{
	"source": {
		"index": "index_old",
		"query": {
				"match_all": { }
		}
	},
	"dest": {
		"index": "index_new"
	}
}
```

We also can remove some field while making new index (only those will be included to destination index):

```bash
POST /_reindex
{
	"source": {
		"index": "index_old",
		"_source": ["field1", "field2"]
	},
	"dest": {
		"index": "index_new"
	}
}
```

Or we need to rename field:

```bash
POST /_reindex
{
	"source": {
		"index": "index_old"
	},
	"dest": {
		"index": "index_new"
	},
	"script": {
		"source": """
			ctx._source.new_field_name = ctx._source.remove("old_field_name");
			}
		"""
	}
}
```

### Multi-field mappings

Suppose, we have a site of reciepes and documents with columns `description`, `ingredients` . We need to apply functionality of searching by ingredients with raw user input and also aggregate those ingredients. In ES text data type is not considered to be used for aggregation.

To do so, we can use multi-field mappings:

```bash
# OUR DOC FOR EXAMPLE
POST /multi_field_index_test/_doc
{
	"description": "Some description",
	"ingredients": ["Spaghetti", "Bacon", "Eggs"]
}

# HOW TO CREATE MAPPING
PUT /multi_field_index_test
{
	"mappings": {
		"properties": {
			"description": {
				"type": "text"
			},
			"ingredients": {
				"type": "text",
				"fields": {
					"keyword": {
						"type": "keyword"
					}
				}
			}
		}
	}
}

# AND THEN WE CAN SEARCH
GET /multi_field_index_test/_search # TEXT SEARCH
{
	"query": {
		"match": {
			"ingredients": "Spaghetti"
		}
	}
}

GET /multi_field_index_test/_search # KEYWORD SEARCH
{
	"query": {
		"term": {
			"ingredients.keyword": "Spaghetti"
		}
	}
}
```

![Untitled](%5BES%5D%20Mappings%20&%20Analysis%20af939b5c496142408c4a913d7593be88/Untitled%207.png)

### Dynamic mapping

ES can automaticaly create a mapping when we firstly insert the document

![Untitled](%5BES%5D%20Mappings%20&%20Analysis%20af939b5c496142408c4a913d7593be88/Untitled%208.png)

Here we can see that for tags it creates 2 mappings: text and keyword.

Rules how ES detects mappings:

![Untitled](%5BES%5D%20Mappings%20&%20Analysis%20af939b5c496142408c4a913d7593be88/Untitled%209.png)

> *We can combine dynamic and explicit mappings, for example create mapping with only field1 and then push documents with additional field → mapping will be updated with additional field*
> 

**THEMES I DID NOT HAVE TIME TO COVER: STEMMING, BUILT-IN ANALYZERS, CUSTOM ANALYZERS, ADDING ANALYZERS TO EXISTING INDEXES, UPDATING ANALYZERS**

![https://media1.giphy.com/media/uqMQsE4HKYvfnjhIRQ/giphy.gif?cid=7941fdc6mcsnarnlf6mvt3m96qg6spjqdlhift6lsjtkq58w&ep=v1_gifs_search&rid=giphy.gif&ct=g](https://media1.giphy.com/media/uqMQsE4HKYvfnjhIRQ/giphy.gif?cid=7941fdc6mcsnarnlf6mvt3m96qg6spjqdlhift6lsjtkq58w&ep=v1_gifs_search&rid=giphy.gif&ct=g)