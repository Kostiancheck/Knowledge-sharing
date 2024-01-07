#csv #tsv #dsv #file_type 
### CSV
**CSV** (comma-separated values) file is a delimited text file that uses a comma to separate values. Each line of the file is a data record. Each record consists of one or more fields, separated by commas.

General constraints
1. [plain text](https://en.wikipedia.org/wiki/Plain_text "Plain text") using a character encoding such as [ASCII](https://en.wikipedia.org/wiki/ASCII "ASCII"), various [Unicode](https://en.wikipedia.org/wiki/Unicode "Unicode") character encodings (e.g. [UTF-8](https://en.wikipedia.org/wiki/UTF-8 "UTF-8")), [EBCDIC](https://en.wikipedia.org/wiki/EBCDIC "EBCDIC"), or [Shift JIS](https://en.wikipedia.org/wiki/Shift_JIS "Shift JIS"),
2. consists of records (typically one record per line),
3. with the records divided into [fields](https://en.wikipedia.org/wiki/Field_(computer_science) "Field (computer science)") separated by [delimiters](https://en.wikipedia.org/wiki/Delimiter "Delimiter") (typically a single reserved character such as comma, semicolon, or tab; sometimes the delimiter may include optional spaces),
4. where every record has the same sequence of fields.
5. the first record may be a "header", which contains column names in each of the fields (there is no reliable way to tell whether a file does this or not; however, it is uncommon to use characters other than letters, digits, and underscores in such column names).

Within these general constraints, many variations are in use. Therefore, without additional information (such as whether RFC 4180 is honored), a file claimed simply to be in "CSV" format is not fully specified.

Databases that include multiple [relations](https://en.wikipedia.org/wiki/Relation_(database) "Relation (database)") cannot be exported as a single CSV file. Similarly, CSV cannot naturally represent [hierarchical](https://en.wikipedia.org/wiki/Hierarchical "Hierarchical") (nested) or [object-oriented](https://en.wikipedia.org/wiki/Object-oriented "Object-oriented") data.

Data types and rules:
- the only dat type in CSV i a string
- any field may be quoted
  `"abc"` and `abc` are the same
- Fields with embedded commas or double-quote characters must be quoted
  ```
  description, year
  "Super, luxurious truck", 1999
  ```
- Each of the embedded double-quote characters must be represented by a pair of double-quote characters
  ```
  1997,Ford,E350,"Bad, ""luxurious"" truck"
  ```
- Fields with embedded line breaks must be quoted (however, many CSV implementations do not support embedded line breaks)

CSV Example
```
Year,Make,Model,Description,Price
1997,Ford,E350,"ac, abs, moon",3000.00
1999,Chevy,"Venture ""Extended Edition""","",4900.00
1999,Chevy,"Venture ""Extended Edition, Very Large""","",5000.00
1996,Jeep,Grand Cherokee,"MUST SELL!
air, moon roof, loaded",4799.00
```

### TSV and Other SVs
TSV is the same as CSV but with tab characters instead of comma. You can also use whatever delimiter you like, most common: a comma (,), a semicolon (;), a tab (\\t), a space ( ) and a pipe (|).

By itself, using different field delimiters is not especially significant. Far more important is the approach to delimiters occurring in the data. CSV uses an escape syntax to represent commas and newlines in the data. TSV takes a different approach, disallowing TABs and newlines in the data. 

Because comma is a common character in text and also can be used in float numbers (3,14) or as a thousands separator (10,000), you need to use  escape syntax in CSV to fully represent common written text. As a result it becomes harder to parse and it is still easy to do incorrectly.

In case of TSV you just need to check if there is no tabs on-write, so on-read you can simply split by tab and there is no need for additional parsing

So why do we need so many SVs (or DSV - delimiter-separated values)? The answer is obvious - in case when your delimiter occurs in the values themself you need additional mechanism to escape/wrap it, so it won't be identified as the delimiter. As the result parsing process becomes more complicated and consuming.

If you need to choose delimiter - check your data and select the least common character that occurs in data 🤷

### Sources
1. https://en.wikipedia.org/wiki/Comma-separated_values
2. https://en.wikipedia.org/wiki/Tab-separated_values
3. https://github.com/eBay/tsv-utils/blob/master/docs/comparing-tsv-and-csv.md