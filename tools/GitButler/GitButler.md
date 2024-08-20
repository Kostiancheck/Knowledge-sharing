Imagine that you've decided to combine Git and Jira together? Why? Idk, freaking psycho. But in any case it already exists and the name of this mystery creature is **GitButler** (GB). 

Created by Github co-founder and [PRO git book](https://git-scm.com/book/en/v2) author Scott Chacon.

# What is GitButler and why you maybe need it
GitButler is a new Source Code Management system designed to manage your branches, record and backup your work, be your Git client.

Git CLI is confusing, difficult to use, error prone and not originally designed or built for the workflows and processes that most developers today use. Ask yourself a question: are you using Git because it's the best way you can imagine accomplishing your daily tasks, or are you using it because it's what is there, it's what works with GitHub, it's the only real option?

The reality is that source code management tools have changed very little on a fundamental level in the last 40 years. If you look at the tools and commands and interface that RCS had in the 80s, or Subversion had in the 90s, is it really massively different than how you use Git today on a daily basis?

Yes, Git has easy branching, acceptable merging, a nice network transport method to move your code around, but you're still making manual checkins, you're still trying to remember 
obscure arguments, you're still losing work when things get complicated.

# Concepts
The main concept of GitButler are virtual branches. Virtual branches are just like normal Git branches, except that you can work on several of them at the same time.
> [!warning]
> You cannot use both GitButler virtual branches and normal Git branching commands at the same time, you will have to "commit" to one approach or the other

GitButler requires a "Base Branch". Generally this would be something like origin/master or origin/main. Once a base branch is specified, everything in your working directory that differs from it is branched code and must belong to a virtual branch.

This means that you don't have to create a new branch when you want to start working, you simply start working and then change the branch name later. There is no local "main" or "master" because it doesn't make sense. Everything is a branch, with work that is meant to eventually be integrated into your base branch. 

If you have 3 different changes in one file, you can drag each of the changes to a different virtual branch lane and commit and push them independently.

*You cannot have conflicting branches applied at the same time*. Any virtual branch that conflicts with branches that are currently applied will be noted you cannot apply them until you have unapplied the branch or branches they conflict with.
# Let's get our hands dirty
Now let's look into real world example of GitButler usage.

Let's say we are working on 2 tasks in parallel:
1. TASK-1: GitButler notes with links
2. TASK-2: write GitButler intro

Let's say developer **K1** created a branch and did some work for TASK-1 but now we need to also do some changes to it
1. `create and push branch TASK-1 with added file tools/GitButler/GitButler.md`
2. `in GitButler try to go back to integration branch`
3. it doesn't work 🥲

*Ok, that's it. GitButler is shit, don't use it. Thank you for your attention!*

Okay, okay. Let's give it a chance
> [!warning]
> Just remember that's for now it's really bad idea to use git and GitButler in parallel

`recreate project in GitButler and try one more time. Show Workspace in GitButler`

In GitButler workspace we can see a lot of `.DS_Store` files. Let's update `.gitignore` to remove them
`update .gitignore and show GitButler after that`

But wait a minute. We already made this changes in TASK-1 branch and we can see them in left-side panel. Let's try to king of "merge" them into current branch
1. `Show TASK-1 branch in GitButler and Apply it to base virtual branch`
2. `Show that we have conflict now`
3. `Go to IDE and resolve conflict`
4. `Mark resolved in GB and cry`

Okay. Now let's say we want to finish TASK-1 and write some text
1. `write link in GitButler.md to finish TASK-1`
2. `commit`
3. `undo commit`
4. `add more links`
5. `commit again`

Let's play around with commits more
1. `add another link`
2. `commit`
3. `create new file GitButlerIntro.md`
5. `squash this 2 commits (drag and drop one on another)`
6. `edit commit message`
7. `now let's split commits. Click 'insert empty commit' and drag changes from previous commit into this one`
8. `update commit messages in both commits`
9. `change order of commits (why?)`

Now I realized that Intro shouldn't be in TASK-1 branch but in TASK-2 branch, so I can simply drag it to another branch
1. `Add some lines into intro file to make case more complex`
2. `drag intro file changes into new branch`
3. `for fun let's remove intro creation commit from TASK-1 and don't add it to TASK-2`

And the final step is to create PR's
1. `show PR's in GitHub. Show created branches`
# So why do you need it?
At this stage I don't believe that GB will fit into regular developer's workflow, because sometimes we need to deal with some git stuff that will make GB crash

But I think it's really nice to in some cases:
1. You are working on repository alone and don't have difficult workflow but need to track a lot of changes
2. You are non/semi-technical person that uses git just for versioning and you want nice simple UI so you don't need interact with CLI
3. You are frontend developer that makes 100000000 changes every day in dozens of different files and want to separate this changes into different branches/PRs and have ability to switch between them
# Some links
1. Nice vid https://www.youtube.com/watch?v=oD8H3jh5xfQ&ab_channel=JoshCirre
2. CEO Demo https://www.youtube.com/watch?v=PWc4meBj4jo&ab_channel=GitButler
3. GitButler website https://gitbutler.com/