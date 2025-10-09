Problem:
- you need a quick dependency graph, for example - to communicate data flow of a particular subsystem
	- in other words, something you would use draw.io for if you had time to prepare, but now we're in the middle of the call and it needs to be done ultra-quickly
	- ideally, that can be rendered in terminal
Solution:
- diagram as a code
## Graph
``` mermaid
graph
  A-->B
  A-->C
  B-->D
```
Cool and simple, just what I needed.

## Sequence
Apparently it's an engineering tool to visualize chronologically several parties' interactions within a process.
``` mermaid
sequenceDiagram
    %% participant Client
    %% participant Server
    Client->>Server: SYN
    Server->>Client: SYN+ACK
    Client->>Server: ACK
    Client->>Server: GET
    Server->>Client: ACK
    Server->>Client: HTTP response
    Note left of Server: headers, body
    Server->>Client: FIN
    Client->>Server: ACK
```
It can be useful in certain scenarios, but syntax is harder and I don't see myself using it very often.

## Gantt
``` mermaid
gantt
title On-call schedule
Alice :active, s1, 2025-10-01, 7d
Bob   :        s2,   after s1, 7d
Creed :        s3,   after s2, 7d
Dave  :        s4,   after s3, 7d
```
The closest that I've seen to Gantt chart is on-call schedules. It's fine I guess, but you can already see some issues with formatting. Also, if you need to do something more complicated (like I wanted to have 1 overlapping day, rather than starting Bob's schedule right after Alice's), it can get ugly very quickly.

## Class
``` mermaid
classDiagram

Session
Session: uuid id
Session: int user_id
Session: datetime created_at
Session: getDuration()
Session: getActivities(status_filter) list[Activity]

Activity
Activity: uuid id
Activity: enum status 
Activity: datetime created_at

Session--*Activity
```
IMO, this is not supposed to be used live, but rather for creating documentation. It's OK, but I would use a specialized tool for that, if at all.
## Other
Git graph - skip
Entity relationship diagram - skip
User journey diagram - skip

## Quadrant chart
``` mermaid
quadrantChart
title Trash
x-axis low Dota skill --> high Dota skill
y-axis low Val skill --> high Val skill
quadrant-1 legends
quadrant-2 need to learn Dota
quadrant-3 play something bro
quadrant-4 need to learn Val
Serioha: [0.1, 0.1]
```

It's cool that it's possible at all, didn't expect this type of chart here. But not sure how useful it is in real world.

## XY chart
``` mermaid
xychart-beta
    title "Trump tweets"
    x-axis [jan, feb, mar]
    y-axis "Tweets count" 0 --> 1000
    bar [800, 950, 990]
    line [800, 950, 990]
```

Same as above: it's kind of cool, but is it really useful? It takes a few minutes to write down, and I need to remember that syntax, so IDK.
## Pie chart
``` mermaid
pie 
	title Trash
	"Time spent discussing politics" : 90
	"Time spent playing games" : 10
```
## Styling
```  mermaid
---
config: 
  theme: 'forest'
---
pie 
	title Trash
	"Time spent discussing politics" : 90
	"Time spent playing games" : 10
```
There are several built-in themes: default, neutral, dark, forest, base.
Also, you can customize 'base' theme:
``` mermaid
---
config: 
  theme: 'base'  
  themeVariables:
    pie1: '#DB5B44'
    pie2: '#DB7544'
---
pie 
	title Trash
	"Time spent discussing politics" : 90
	"Time spent playing games" : 10
```
## Underlying tech

How it's done? It's a JS app, that glues together [d3](https://d3js.org/) (~matplotlib), and [dagre](https://github.com/dagrejs/dagre) (~networkx?)
Does this mean that all those dependencies are included in Obisidan/Github/any other markdown rendered that supports mermaid?
>`github-markup` does _not_ handle rendering; it only chooses a markup library for use
>https://github.com/github/markup/issues/533
## Alternatives
mermaid-cli:
- takes md files as input and outputs md files with rendered graphs as images
- requires node and chrome to work (kmp)
mermaid-ascii:
- renders in terminal
- input is still md file (`-_-`)
- since it has 'interactive' feature, I guess also requires chrome
[PlantUML](https://crashedmind.github.io/PlantUMLHitchhikersGuide/) :
- feature-rich
- overkill for the use case I initially described
[Graph-Easy](http://github.com/ironcamel/Graph-Easy):
- ancient
- output is almost exactly what I want
- input is horrendous perl code though ;C
- no interactive mode
Gnuplot
## Conclusions
This tool is cool, but also a bit overengineered already. You need to be careful not to overcomplicate things, since the whole point is to make graphs/charts fast

It is open source, released under MIT license.

I failed in my quest to find easy-to-use tool for quick graph creation in terminal. But, web editor of mermaid seems nice and has more features than I would ever need.
## Sources
1. Get started https://mermaid.js.org/intro/
2. Live editor  https://mermaid.live/edit
3. Optimistic merging http://hintjens.com/blog:106