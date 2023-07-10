#json #file_type 
### General

**JSON** (JavaScript Object Notation) is a text-based data format following JavaScript object syntax. JSON exists as a string — useful when you want to transmit data across a network and you don’t need any specific software to read these type of files. 

Main JSON characteristics:
* JSON string can be stored in its own file, which is basically just a text file with an extension of `.json`  
- JSON is purely a string with a specified data format — it contains only properties, no methods
- JSON requires double quotes to be used around strings and property names. Single quotes are not valid other than surrounding the entire JSON string
* Comments were intentionally excluded from JSON. In 2012, Douglas Crockford described his design decision thus: "I removed comments from JSON because I saw people were using them to hold parsing directives, a practice which would have destroyed interoperability."
* Whitespace is allowed and ignored around or between syntactic elements (values and punctuation, but not within a string value) 
* JSON disallows "trailing commas", a comma after the last value inside a data structure.
* Because Object is a valid data type you can create nested data structures

### Data types
JSON's basic **data types** are:
- **Number**: a signed decimal number that may contain a fractional part and may use exponential E notation, but cannot include non-numbers such as NaN. The format makes no distinction between integer and floating-point but deserializes in some languages can distinguish them.
- **String**: a sequence of zero or more Unicode characters. Strings are delimited with double quotation marks and support a backslash escaping syntax.
- **Boolean**: either of the values true or false
- **Array**: an ordered list of zero or more elements, each of which may be of any type. Arrays use square bracket notation with comma-separated elements.
- **Object**: a collection of name–value pairs where the names (also called keys) are strings. The current ECMA standard states: "The JSON syntax does not impose any restrictions on the strings used as names, does not require that name strings be unique, and does not assign any significance to the ordering of name/value pairs." Objects are delimited with curly brackets and use commas to separate each pair, while within each pair the colon ':' character separates the key or name from its value.
- **null**: an empty value, using the word null
Each of these data types by itself can be valid JSON, e.g. 2, "abc", true, [1,2,3] - all of these are valid JSONs

JSON Example:

```
{
  "firstName": "John",
  "lastName": "Smith",
  "isAlive": true,
  "age": 27,
  "address": {
    "streetAddress": "21 2nd Street",
    "city": "New York",
    "state": "NY",
    "postalCode": "10021-3100"
  },
  "phoneNumbers": [
    {
      "type": "home",
      "number": "212 555-1234"
    },
    {
      "type": "office",
      "number": "646 555-4567"
    }
  ],
  "children": [
    "Catherine",
    "Thomas",
    "Trevor"
  ],
  "spouse": null
}
```

### JSON lines
JSON Lines (JSONL) format or newline-delimited JSON is a format for storing structured data that may be processed one record at a time. In JSON Lines each line is a Valid JSON Value.  When working with very big files on devices with little RAM, reading a JSONL file dynamically parses it one line at a time. 
In Spark the file that is offered as _a json file_ is not a typical JSON file. Each line must contain a separate, self-contained valid JSON object. Using JSONL over JSON has two benefits:
1. You don't need to read-in and serialize entire JSON file, so you don't limited with your RAM
2. Using JSONL you are 100% sure that 1 line is 1 object, so there is no need to parse multiple rows at the same time and trying to find start and end of each object

JSONL and JSON
```
JSON:
[
    {
        "name": 1
    },
    {
        "name": 2
    }
]

JSONL:
{"name": 1}
{"name": 2}
```
  

### Sources
1. [https://www.json.org/json-en.html](https://www.json.org/json-en.html)
2. [https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON)
3. [https://medium.com/codebrace/working-with-json-jsonl-multiline-json-in-apache-spark-42b524a4724](https://medium.com/codebrace/working-with-json-jsonl-multiline-json-in-apache-spark-42b524a4724) 
4. [https://jsonlines.org/](https://jsonlines.org/)
5. [https://spark.apache.org/docs/latest/sql-data-sources-json.html](https://spark.apache.org/docs/latest/sql-data-sources-json.html)
    

