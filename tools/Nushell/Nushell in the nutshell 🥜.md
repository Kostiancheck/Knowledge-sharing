# What is Nushell and why
It is new hyped shell with it's own language written in Rust 🦀 where everything is a structured data. Unlike traditional shells that work with plain text, Nushell treats everything as data—tables, lists, records, etc, making it much easier to filter, sort, and manipulate the output. It also has nice Rust error messaging.

# Examples
## Intro
Let's look into few examples and compare some Nu commands with regular boring bash (actually, I will compare it with zsh with oh-my-zsh installed*). 
```bash
bash ls -lh 
vs 
nu ls
```
But what if we want to use regular `ls`, not nu `ls`? Nu provides a set of commands that you can use across different operating systems ("internal" commands) and having this consistency is helpful when creating cross-platform code. Sometimes, though, you want to run an external command that has the same name as an internal Nu command. To run the external `ps`, `ls` or other commands preface it with the caret (^).
```bash
ls
^ls
echo 123 123
^echo 123 123
```
Nu and bash had some differences. Let's say you want to write into file using bash
```bash
echo bruh > bruh.txt
```
but in nu `>` is greater-than operator for comparisons, so it won't work. Instead you can use `out>` or `o>` or you can use `save` command
```bash
echo bruh out> bruh2.txt
"bruh" | save bruh3.txt
```
Here is the table of commands comparison and analogues for people who are coming from Bash https://www.nushell.sh/book/coming_from_bash.html#command-equivalents.

Now let's say we want to look into specific row in `ls`
```bash
ls --long | get 13
ls --long | get 13.modified
ls --long | get 13.size
(ls --long | get 13.size) / 1MiB
```

Yes, we can do math here! Let's do what all mathematicians loves to do - divide by zero
```bash
~> 1 / 0
Error: nu::shell::division_by_zero

  × Division by zero.
   ╭─[entry #11:1:3]
 1 │ 1 / 0
   ·   ┬
   ·   ╰── division by zero
   ╰────
```
Look at this gorgeous error message! It tells us in what command error occurred (#11), and shows exactly the place. If we do the same in bash
```bash
echo $((1/0))
zsh: division by zero
```
There is no rizz in this millennial shit bra. I need more attractiveness in my terminal!
Here is one more example of nice error messaging in Nu
```bash
~> 1 ^ 5
Error: nu::parser::unknown_operator

  × Unknown operator
   ╭─[entry #13:1:3]
 1 │ 1 ^ 5
   ·   ┬
   ·   ╰── Operator '^' not supported
   ╰────
  help: Use '**' for exponentiation or 'bit-xor' for bitwise XOR.
```

But why would you need to do math in shell? Because I can! And also because nu supports different data types, so it can be really useful when you work with dates or file sizes:
```bash
(ls --long | get 13.size) + 10KiB
(date now) + 1day
```
It is a bit annoying that you need to put entire expression inside parentheses! But there is a way to fix it.

As you already understood we are using `|` to create kind of pipelines that transforms data (since in Nu everything is a data structure). You can think about it as a function composition `f(g(x))` or even more like `map` from functional programming `lst.map(f()).map(g())`. So if in the *best programming language in the world* - Python 🐍 - you can write `map(lambda x: f"it is x: {x}", lst)` and in Scala you can write `lst.map(x => s"it is x: $x")` how can you do similar in Nu? How to refer to input variable `x` ? To do so nu has special variable `$in`
```bash
ls | get 0.size | echo $in
ls | get 0.size | echo the size is $in
ls | get 0.size | ^echo the size is $in
ls | get 0.size | into string | ^echo the size is $in
ls | get 0.size | echo $"the size is ($in)"
```
Another use case for `$in`  is that we can avoid parentheses
```bash
ls --long | get 13.size | $in + 10KiB
date now | $in + 1day
```

To get list of commands run `help commands` . Nushell includes a built-in `explore` command that lets you not only scroll, but also telescope-in to nested data `help commands | explore`. Press `Enter` to start navigating over files, use `/` for a search like in vim and go to `params` column and you will see `table N rows`, click `Enter` again and it will open it.
## Processes
Let's look into list of current processes running in the system. Run `ps` in both nu and bash. The traditional Unix `ps` only shows the current process and its parents by default. Nushell's implementation shows all of the processes on the system by default.

```bash
ps | where status == Running
ps | describe
```
## Curl
Now let's query some data from world wide web
```bash
curl -s https://api.github.com/repos/nushell/nushell
vs 
http get https://api.github.com/repos/nushell/nushell
===============
curl -s https://api.github.com/repos/nushell/nushell | jq '.license.name'
vs 
http get https://api.github.com/repos/nushell/nushell | get license.name
==============
http get https://api.github.com/repos/nushell/nushell | get size | into filesize
```
Looks pretty similar to `jq` tbh. But a bit nicer.
## Files
I want to pick up some random yml or json file and look into it
```bash
open config/config.yml
open config/config.yml | columns
open config/config.yml | get staging | columns
open config/config.yml | get staging.ebr
open config/config.yml | explore
```
To do the same in bash you need to install `yq` but I'm too lazy, sorry. 

Now let's create test yml file, convert it into json, update some value and write to the file:
```bash
{
  debug: false,
  version: "1.0",
  settings: {
    theme: "light",
    autosave: true
  }
} | to yaml | save nutest.yml

open nutest.yml --raw
```

And convert it to json
```bash
open nutest.yml
| upsert debug true
| upsert settings.theme dark
| to json
| save --force nutest.json

open nutest.json
open nutest.json --raw
```

Nushell supports [a lot of file types](https://www.nushell.sh/book/loading_data.html#opening-files) including json, yml, xml, SQLite database (because why not), and the king of databases - xls.
## File system
Let's go to our file system and play more with data (because I'm DE, it is what I'm doing for a living)
```bash
cd IdeaProjects/kitchensink-etl
ls | sort-by size | reverse
ls | where size > 10kb
```

But what if we use command that is not offered by Nushell?
```bash
man df
df
df | detect columns
df | detect columns | get Used | first | describe
df | detect columns | get 0 | describe
df | detect columns | upsert "Used" { |item| $item.Used | into filesize}
```
upsert is here to "Update an existing column to have a new value, or insert a new column."

Now let's do something that I need for a work. I have a folder with a bunch of files and I want to count number of files in this folder recursively excluding `venv` folders, IDE cache files and other things that have nothing to do with actual code.
```bash
cd pyspark/
ls
ls | sort-by type
ls *.md # why error?
ls *.py
```
Now how to make it recursive? `-r` doesn't work, instead we need to use `**` for nested paths. Let's test it on one subfolder first:
```bash
ls search_ranking_layer_expanded_index/
cd search_ranking_layer_expanded_index
ls **/*
ls **/*.py
ls **/* | group-by type
ls **/* | group-by type --to-table | upsert count { |row| $row.items | length } | select type count
```
For the entire folder
```bash
cd ..
ls **/*
| where type == "file"
| where not ($it.path | str contains '/venv/' or '/.git/' or '/.idea/' or '/__pycache__/')
| where not ($it.name | str ends-with '.pyc' or '.log' or '.tmp' or '.iml')
| length
```
53614 0_o ?  Going line-by-line I've found that previous command is incorrect and doesn't work, but when I'm adding `length` at the end it returns result, instead of error. WTF!? I think where returns error when it's incorrect, but when we wrap it into `length` it handles errors as NONEs or false and it works 🤷🏻‍♂️.
```bash
ls | get bruh
Error: nu::shell::column_not_found

  × Cannot find column 'bruh'
   ╭─[entry #334:1:1]
 1 │ ls | get bruh
   · ─┬       ──┬─
   ·  │         ╰── cannot find column 'bruh'
   ·  ╰── value originates here
   ╰────

~> ls | get bruh | length
28 <--------------------- 🙈
```

But back to my task. Need to fix filters. But how can I be sure that I filtered all unwanted files? Let's get statistics by file extension:
```bash
cd ..
ls **/*
| where type == "file"
| where not ($it.name | str contains 'venv')
| where ($it.name | str contains ".")
| upsert extension { |f| $f.name | split row '.' | last } 
| group-by extension --to-table
| upsert count { |row| $row.items | length } 
| select extension count
| sort-by count -r
```
after analysis I came up with next filters. Let's save this huge filtered table into variable so we can reuse it:
```bash
let files = ls **/* --all
| where type == "file"
| where not (
    ($it.name | str contains 'venv/') or
    ($it.name | str contains 'pytest_cache/') or
    ($it.name | str contains '.git/') or
    ($it.name | str contains '.idea/') or
    ($it.name | str contains '/build/') or   
    ($it.name | str contains '/dist/') or   
    ($it.name | str contains 'target/') or
    ($it.name | str contains 'egg-info/') or
    ($it.name | str ends-with '.pyc') or
    ($it.name | str ends-with '.log') or
    ($it.name | str ends-with '.tmp') or
    ($it.name | str ends-with '.iml') or
    ($it.name | str ends-with '.csv') or
    ($it.name | str ends-with '.tsv') or
    ($it.name | str ends-with '.jsonl') or
    ($it.name | str ends-with '.json') or
    ($it.name | str ends-with '.xlsx') or
    ($it.name | str ends-with '.jsonl') or
    ($it.name | str ends-with '.parquet') or
    ($it.name | str ends-with '.tar') or
    ($it.name | str ends-with '.xml') or
    ($it.name | str ends-with '.jar') or
    ($it.name | str ends-with '.crc') or
    ($it.name | str ends-with 'DS_Store')
)
| where ($it.name | str contains ".")

$files
| upsert extension { |f| $f.name | split row '.' | last } 
| group-by extension --to-table
| upsert count { |row| $row.items | length } 
| select extension count
| sort-by count -r
```

Now I want to calculate number files `pyspark` directory:
```bash
$files | where ($it.name | str contains pyspark/)
```
Number of files is 167. Now let's go crazy and count number of lines in each of these files:
```bash
$files | where ($it.name | str contains pyspark/)
| upsert lines { |f| open $f.name --raw | lines | length }
| select name lines
| sort-by lines -r
```
and to get total sum
```bash
$files 
| where ($it.name | str contains pyspark/)
| upsert lines { |f| open $f.name --raw | lines | length }
| get lines
| math sum
```
22311 lines, not bad. I'm going to delete them all 🔥
Now let's go to parent folder and count number of files
```bash
$files | length
```
2409, okay. What if I will try to count lines in the entire repo? 
```bash
cd ..
$files 
| upsert lines { |f| open $f.name --raw | lines | length }
| get lines
| math sum
```
Total number of lines is `292 221`! 

Now let's include all files, without any filters, and count number of lines in all of them 😈. 
```bash
ls **/* --all 
| where type == "file"
| length
```
So total number of files in this repo is `230 996`. What is the number of lines in all of them?Adding `timeit` to measure run time
```bash
timeit { ls **/* --all 
| where type == "file"
| upsert lines { |f| open $f.name --raw | lines | length }
| get lines
| math sum
}
```
As I've found after the run `timeit` doesn't return command output , only time -\_-. 
It didn't return the result, so I need to run it again, bruh. And this command took 2 minutes. I don't want to wait so long again. 
What about bash?
```bash
find . -type f -print0 | xargs -0 wc -l | tail -n 1
```
It returned wrong result `286039 total`. Fixing with chatgpt:
```bash
find . -type f -exec cat {} + | wc -l
```
Took only 50 seconds and returned 35 199 654!!! Bash vs Nu 1-0

Okay, nu takes to long. Let's use parallelism via `par-each` command in nu and timeit
```bash
timeit { ls **/* --all 
| where type == "file"
| par-each { |f|  { lines: (open $f.name --raw | lines | length) } } 
| get lines 
| math sum
}
```
It took only 16 seconds!!! Nice! And the number of lines is `35 372 268`

Now I want to calculate number of lines by file extension:
```bash
$files
| where ($it.name | str contains ".")
| par-each { |f| { 
	lines: (open $f.name --raw | lines | length), 
	extension: ($f.name | split row '.' | last),
	name: ($f.name)
	} 
}
| group-by extension --to-table
| upsert total_lines { |row| $row.items.lines | math sum }
| upsert total_files { |row| ($row.items | length ) }
| upsert lines_per_file { |row| $row.total_lines / $row.total_files | into int }
| select extension total_lines total_files lines_per_file
| sort-by lines_per_file -r   
```

As an icing on a cake let's get number of lines by folder
```bash
$files
| upsert folder { |p| $p.name | str replace -r '/[^/]+$' '' }
| upsert lines { |f| open $f.name --raw | lines | length }
| group-by folder --to-table
| upsert count { |row| $row.items.lines | math sum } | select folder count
| sort-by count -r
```

Was it simple? Not really. 
Was it useful? No. 
Can you do it with bash? Yep.
Was it fun? Hell yeah!!!

## Git history
After I've found about parallelism I thought maybe I can get number of lines in repo over time? I just need to checkout multiple commits over some period of time and count number of lines in each commit.  Let's create a function to count lines using commands from above:
```bash
def count-lines [] { 
	ls **/* --all
	| where type == "file"
	| where not (
	    ($it.name | str contains 'venv/') or
	    ($it.name | str contains 'pytest_cache/') or
	    ($it.name | str contains '.git/') or
	    ($it.name | str contains '.idea/') or
	    ($it.name | str contains '/build/') or   
	    ($it.name | str contains '/dist/') or   
	    ($it.name | str contains 'target/') or
	    ($it.name | str contains 'egg-info/') or
	    ($it.name | str ends-with '.pyc') or
	    ($it.name | str ends-with '.log') or
	    ($it.name | str ends-with '.tmp') or
	    ($it.name | str ends-with '.iml') or
	    ($it.name | str ends-with '.csv') or
	    ($it.name | str ends-with '.tsv') or
	    ($it.name | str ends-with '.jsonl') or
	    ($it.name | str ends-with '.json') or
	    ($it.name | str ends-with '.xlsx') or
	    ($it.name | str ends-with '.jsonl') or
	    ($it.name | str ends-with '.parquet') or
	    ($it.name | str ends-with '.tar') or
	    ($it.name | str ends-with '.xml') or
	    ($it.name | str ends-with '.jar') or
	    ($it.name | str ends-with '.crc') or
	    ($it.name | str ends-with 'DS_Store')
	)
	| upsert lines { |f| open $f.name --raw | lines | length }
	| get lines
	| math sum
}
timeit { count-lines }
```
6 seconds, not bad.

Now we need to get one commit per each day and count lines. To do this we can get list of commits with formatted date and group by this date taking only the first commit per day
```bash
git log --pretty=format:"%ad %H %s" --date=short
| lines
| parse "{date} {hash} {rest}"
| group-by date --to-table
| each {|entry| $entry.items.0 }
```
Number of commits is 1188. If `timeit { count-lines }` took ~6 seconds then total time will be
```bash
6sec * 1188
1hr 58min 48sec
```
Yes, I used nu to calculate it. And it was cool. But 2 hrs is to much. And I don't think we can parallelize git checkout. It's too long!  What about bash? I uploaded commit hashes into file and asked chat to write similar script but in bash:
```bash
commit_file="commits.txt"
output_file="commits_stats.txt"

: > "$output_file"
while read -r commit; do
  echo "Checking out commit: $commit"
  git checkout --quiet "$commit" || { echo "Failed to checkout $commit"; continue; }

  # Count all lines in tracked files
  lines=$(git ls-files -z --deduplicate | xargs -0 wc -l | awk '{print $1}')
  echo "$commit, $lines" | tee -a "$output_file"
done < "$commit_file"
```
after 25 seconds I got the file with all information I needed. Bash vs Nu 2-0

Probably I would get the best result if used `git ls-files` and `wc -l` from the beginning... So let's rewrite my entire pipeline!

```bash
def count-lines-v2 [] { 
	git ls-files -z --deduplicate | xargs -0 wc -l | tail -n 1 | str trim | parse "{count} total" | get count | into int | get 0
}

timeit { count-lines-v2 }
count-lines
count-lines-v2

git log --pretty=format:"%ad %H %s" --date=iso-strict
| lines
| parse "{datetime} {hash} {rest}"
| upsert datetime { |r| $r.datetime | into datetime }
| where datetime > ("2025-05-01" | into datetime)
| sort-by datetime
| each { |commit| { 
	lines: (git reset --hard ($commit.hash) | count-lines-v2), 
	datetime: $commit.datetime,
	hash: $commit.hash
	} 
}
| to yml
| save -f commits_stats_v3.yml

open commits_stats_v3.yml
```
It took only 22 seconds! Bash + Nu = 🫶🏻
\*  Look at `b17072d956126de135d655bcb91dc27f2628f053` and `95e60cab227cdc7e9659a85977e31582733ace10`  commits *
## Dataframe
You can use polars inside nu via plugin. I don't know why would you do that, but just in case [here is the link](https://www.nushell.sh/book/dataframes.html#lazy-dataframes)

# Thoughts
You can do all of this using bash+python with polars/pandas/regular python, but if you need to do it more than once in a while I think it could be a useful tool in your sleeve. It is intuitive, but documentation is not the best. Will I use it? Maybe sometimes. Will I set it as my default shell? 100% no. Was it fun? Yes, it was!
# Sources
1. https://www.nushell.sh/ - nushell site. They also have nice documentation https://www.nushell.sh/book/getting_started.html
2. https://www.nushell.sh/book/cheat_sheet.html - Cheat sheet
3. https://github.com/nushell/nushell - Nu repo