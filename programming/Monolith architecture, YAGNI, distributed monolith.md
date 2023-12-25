Monolithic architecture is a traditional way of develop software where the entire application is a single, interconnected unit. It's straightforward for smaller projects but can become complex and inconvenient as the application grows larger. Especially, if a lot of different teams are working on the same codebase.
## Start with a monolith
Almost all the successful microservice stories have started with a monolith that got too big and was broken up.
Almost all the cases where a system was built as a microservice system from scratch, it has ended up in serious trouble.

The reason why you should always start with a monolith is [Yagni](https://martinfowler.com/bliki/Yagni.html).
**You aren't gonna need it.**

Yagni term comes from Extreme Programming. It advises against preemptive development. If you don't need feature X right now, do not waste time developing it. Even if you think you will need it in the future, you don't actually know it. Business requirements change, environment changes, priorities change. If you always go the preemptive development path, chances are you'll be losing time and productivity.

Another reason to consider Yagni is that you can always refactor. When thinking about building preemptive feature, try to also think about how hard it would be to refactor code to add this feature later if needed? Probably, not so hard, if you oblige with SOLID. Then why waste time now?

When starting a new project, think if it would be terribly hard to break down the project into microservices later. Probably not. And if yes, then it's likely a Business issue and you must go with monolith anyway. If you don't know yet, just go with monolith. It's called [Monolith-first approach](https://martinfowler.com/bliki/MonolithFirst.html).

Picture from Martin Fowler's blog.
Cost of carry - if your preemptive feature increases complexity of other software, it also increases cost of further development of other features.
Cost of delay - value lost from delaying current hottest feature in order to develop preemptive feature.

![[Pasted image 20231218200551.png]]

But! It does not mean that you shouldn't spend time making your software easy to modify. If you don't, Yagni might be expensive (in case you actually do need this previously preemptive feature, and it's hard to refactor). So **Yagni works good only if you oblige with SOLID principles**.

## Scaling
If you have a monolith application, and suddenly your app grows 1000x over 8 years (I'm looking at you, Netflix), and your application does not keep up with influx of new customers, **it's a good problem to have.**
Yes, management will be nervous because of constant uptime issues, bugs etc, but they will happily approve your migration budget! 

If at some point you do have to split to microservices, you can begin with a slow approach: peel off microservices "on the edges", that are "unnatural" for you monolithic app, or those that are the easiest to peel off.

But first, you have to answer this: is it REALLY impossible to scale vertically for you? Let's see how Stackexchange did it.

## Stackexchange
Stackexchange not only scaled a monolith up to 1.5 TB of DB RAM and 600 GB of Backend application RAM, but also never migrated to cloud! They are still on-prem.

Stackexchange is a [ASP.NET Core](https://dotnet.microsoft.com/en-us/apps/aspnet) monolith. It's a rich framework like Django or Laravel. It has it's own ecosystem of plugins, and things like [Blazor](https://dotnet.microsoft.com/en-us/apps/aspnet/web-apps/blazor) to write frontend in C#. See Microsoft's example project [here](https://github.com/dotnet-architecture/eShopOnWeb/blob/main/src/BlazorShared/Models/CatalogItem.cs).

A single monolith app on 9 machines hosts 200+ StackExchange websites. So you CAN scale vertically, until at least this size ^ (also, 5 billion requests per month, 55 TB of data transfers per month).

## Distributed monolith
Distributed monolith is a term that describes microservice architecture done wrong. If business logic does not allow you to split up your app into actually independent microservices, chances are you'll end up with a distributed monolith.

Five signs you have a distributed monolith:
1. You're duplicating data across databases, without transforming it.
2. Service X does not work without Y or Z, and/or you have no strategy for how to deal with one of them going down.
3. There is likely no way to meaningfully decouple the services. Service X can be "tolerant" of service Y's failure, but it cannot ever function without service Y.
4. You push all your data over an event-bus to keep your services "in-sync". Or you need to handle a lot of distributed transactions.
5. You, a developer, always have to make changes to several microservices in order to deliver a single new feature.

A distributed monolith takes the worst from both worlds. It adds complexity, and achieves nothing. 

Unexpected victim: Data analysts. One of the bigger reasons why Data WareHouses exist, are distributed monoliths. When your data lies in several different databases and is processed by several different microservices, but your business logic is still tightly coupled, Data Analyst is fucked. The most natural solution will be bringing data back together. Data Warehouse! Yay! 

The main beneficiaries of such systems are Cloud providers :) 
![[mvss-1628948754 1.png]]

## Organization structure
If you decide to go with microservices, it does not automatically mean that your organization will restructure. A couple of examples:
1. A team of 10 people develops a monolith. Good
2. Same app gets broken up into two microservices. A team of 10 people develops two microservices now.. Bad
3. You split up people into two teams. Each team manages 1 microservice.
	1. Every new feature requires communication *between* teams. Bad
	2. Each microservice is fairly independent and teams communicate rarely. Good

The point is, you have to take organization structure into account when discussing application structure. [Conway's law](https://en.wikipedia.org/wiki/Conway%27s_law).

![[Pasted image 20231225185531.png]]
## Final thoughts
Everything is a trade-off. 

## Sources
1. Yagni https://martinfowler.com/bliki/Yagni.html
2. Monlith first https://martinfowler.com/bliki/MonolithFirst.html
3. Netflix migration to cloud https://about.netflix.com/en/news/completing-the-netflix-cloud-migration
4. Stackexchange performance https://stackexchange.com/performance
5. Stackexchange monolith case study https://www.linkedin.com/pulse/case-study-how-stackoverflows-monolith-beats-navjot-bansal/
6. Stackexchange on-prem https://www.datacenterdynamics.com/en/news/stack-overflow-still-on-prem-runs-qa-platform-off-just-nine-servers/
7. Awesome Monolith https://github.com/canerbasaran/awesome-monolith
8. Monoliths are the future https://news.ycombinator.com/item?id=22193383
9. Conway's law. https://en.wikipedia.org/wiki/Conway%27s_law
10. Uncovering Stack Overflow's Shocking Architecture (ByteByteGo) https://www.youtube.com/watch?v=fKc050dvNIE
11.  Serverless was a big mistake... says Amazon (Fireship) https://www.youtube.com/watch?v=qQk94CjRvIs