**Goal**: improve ChatGPT user experience and response quality by prepending text to prompt.

**Use case**: 

Prompt #1: 
”Pandas split by comma in given column and explode to separate rows”

Response:

1. Import the required libraries:
2. Create a sample DataFrame
3. Split the column by commas and then explode the resulting lists into separate rows:
4. Here's the complete code:
5. This will give you the following output:

It isn’t satisfactory, as only points 3 and 5 were informative for us. Others only increased our waiting time.

Prompt #2:
”You are working with Python's Pandas module. How to achieve task "Pandas split by comma in given column and explode to separate rows" in the most efficient way? Skip installing libraries and creating dataframe parts. Response only with relevant code snippets and output examples.”

Response:

1. You can achieve this task by using the Pandas `.str.split()` function along with `.explode()`. Here's the relevant code snippet:
2. Output example:

This is satisfactory, as we only received relevant information in our response. Response size down 50+%, response time faster 70+%.

To achieve stated goal