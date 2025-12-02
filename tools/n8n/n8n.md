# How to pronounce

n8n = nodemation = node automation.

> n8n is always written in lowercase and pronounced "n eight n".
> While looking for a good name for the project with a free domain, Jan quickly realized that all the good ones he could think of were already taken. So, in the end, he chose nodemation. 'node-' in the sense that it uses a Node-View and that it uses Node.js and '-mation' for 'automation' which is what the project is supposed to help with. However, he did not like how long the name was and could not imagine writing something that long every time in the CLI. That is when he ended up on 'n8n'. (c) [n8n website](https://n8n.io/press/) "Our name" section

For simplification I will call it neightn (like Nathan)
# What is n8n
> n8n is a free and open node-based Workflow Automation Tool. It can be self-hosted, easily extended, and used with third party web applications or custom in-house tools to automate repetitive tasks...n8n is headquartered in Berlin and was founded by Jan Oberhauser in 2019.

Let's click through GitHub repo https://github.com/n8n-io/n8n. 
160k of ⭐️s. Impressive. #33 in [Top-100 repos](https://github.com/EvanLi/Github-Ranking/blob/master/Top100/Top-100-stars.md) by stars on GitHub. Written in TS 🤢

and the website https://n8n.io/

It has over 400+ official integrations (nodes) and 600+ community integrations with ability to built your custom once.

n8n has both cloud and open source version*
\*It is not really open-source, it's [fair-code](https://faircode.io/)/source available. Here is the [old discussion](https://github.com/n8n-io/n8n/issues/40#issuecomment-539714634) about it. So you need to be carefully if you want to use it in commercial purposes
> You may use or modify the software only for your own internal business purposes or for non-commercial or personal use (c) [LICENSE.md](https://github.com/n8n-io/n8n/blob/master/LICENSE.md)

But I think most of the use cases for n8n will fall into `own internal business purposes` category

Cloud version costs from 20 to 700€ (it can cost up to 5k if you want increase number of workflow executions) https://n8n.io/pricing/

# Let's play with it
Set up with Docker https://docs.n8n.io/hosting/installation/docker/

By default it comes with SQLite (God bless SQLite) but you can switch to Postgres, if you want (God bless Postgres).

After you open it will ask you some weird questions, but you can skip them. Also, you can get activation key on your email to unblock paid features forever (?)

Now let's click through all tabs on the left-side pannel:
- if we go to settings 
	- you will see that most of the features like SSO, secrets, etc are `Available on the Enterprise plan`. At least you can use 2FA
	- they have MCP Access out-of-the-box
	- you can install community nodes as npm packages (because you are fearless)
- On Main page we can
	- create workflow,  
	- create workflow from template
	- we can see executions and some other metrics
	- create credentials (because you are going to interact with a lot of APIs)
	- create data tables (it is local variables/local database to share some data between workflows to avoid using external datasources)

At this point I don't have a specific idea for a workflow, so let's try to use some of the [templates](https://n8n.io/workflows/). The problem is that there are 7k+ of them... How to choose?

Okay, let's just click through the workflow and try to come up with some random workflow:
- add sticky note
- create a trigger node for notion
	- when adding credentials you can apply TypeScript functions to it (to calculate some kind of hash?)
	- show that there are simplified version and raw version
- show JS functions that can be used to shape data

Some interesting templates:
- [AI video generator and publishing](https://n8n.io/workflows/3442-fully-automated-ai-video-generation-and-multi-platform-publishing/)
- [Personalized RSS feed](https://n8n.io/workflows/10196-create-a-personalized-daily-newsletter-with-google-gemini-ai-and-rss-feeds/)
- [Daily Hydration 💧 Reminder for 12$](https://n8n.io/workflows/7986-daily-hydration-reminder-with-slackdiscord-and-airtable-reaction-tracking/). Because, apparently, evolution didn't make enough for this
# Use cases
- Some sort of news/blogs feed
	- pull data from HN and send to telegram
	- pull data from different blogs, summarize with AI and send as email
- DevOps
	- you can combine bash and python + Jenkins + Grafana into some CD workflow
- Data scrapping
- Trading
- Content generation and distribution
- 100500 use cases for e-commerce with google drive, google sheets, salesforce, telegram, email, etc
- AI, AI, AI, AI, AI, AI, AI

# What I like
 - Nice UI
 - a lot of official integration, even more community ones
 - enough customization. You can even [create](https://docs.n8n.io/integrations/creating-nodes/overview/) your own nodes
 
 It looks like n8n paid to hostings like Histinger to promote them
# What I don't like
- A lot of triggers are pull-based (pull data from sources every N)
- a lot of enterprise options (sso, external secret management, etc) are only available in cloud paid version. License is not open-source
- TypeScript and npm
# Alternatives
- Windmill https://github.com/windmill-labs/windmill
- Apache NiFi https://nifi.apache.org/
- Zapier https://zapier.com/
- Node Red https://nodered.org/
# Random thoughts
Few words about types of projects. Looks like open-source it is part or marketing strategy where users can easily set up and play with your product, but if they try to use it in prod they will probably face some issues and will be forced to switch to your enterprise subscription. It is still better then completely closed systems, because at least you can play around with it freely and don't need to ask for demo of even pay for it. But they hook you with free version enough for you to be dependant on it and you will be forced to switch to enterprise at some point (or switch to another tool and start from the beginning)

With tools like this are we going in circle where broad skills will not metter so much since we have so many AI stuff and you will be more valuable if you become expert in one field?

# Some links
1. NetworkChuck video on n8n https://www.youtube.com/watch?v=ONgECvZNI3o
2. Hacker news post https://news.ycombinator.com/item?id=43879282
3. Fireship video on n8n https://www.youtube.com/watch?v=bS9R6aCVEzw