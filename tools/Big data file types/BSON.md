#json #bson #file_type #mongodb
BSON, short for Bin­ary [JSON](http://json.org/), is a bin­ary-en­coded seri­al­iz­a­tion of JSON-like doc­u­ments. Like JSON, BSON sup­ports the em­bed­ding of doc­u­ments and ar­rays with­in oth­er doc­u­ments and ar­rays. BSON also con­tains ex­ten­sions that al­low rep­res­ent­a­tion of data types that are not part of the JSON spec. For ex­ample, BSON has a Date type and a BinData type.

BSON can be com­pared to bin­ary inter­change for­mats, like [Proto­col Buf­fers](http://code.google.com/p/protobuf/). BSON is more "schema-less" than Proto­col Buf­fers, which can give it an ad­vant­age in flex­ib­il­ity but also a slight dis­ad­vant­age in space ef­fi­ciency (BSON has over­head for field names with­in the seri­al­ized data).

BSON was de­signed to have the fol­low­ing three char­ac­ter­ist­ics:

1. **Lightweight**
    
    Keep­ing spa­tial over­head to a min­im­um is im­port­ant for any data rep­res­ent­a­tion format, es­pe­cially when used over the net­work.
    
2. **Traversable**
    
    BSON is de­signed to be tra­versed eas­ily. This is a vi­tal prop­erty in its role as the primary data rep­res­ent­a­tion for [Mon­goDB](http://www.mongodb.org/).
    
3. **Efficient**
    
    En­cod­ing data to BSON and de­cod­ing from BSON can be per­formed very quickly in most lan­guages due to the use of C data types.
    
### Sources
1. https://bsonspec.org/