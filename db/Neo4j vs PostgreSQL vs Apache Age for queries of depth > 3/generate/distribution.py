import numpy as np

outcomes = np.arange(1, 1001)  # Possible outcomes from 1 to 1000
probabilities = np.zeros(1000)  # Initialize array for probabilities

# Assign probabilities to each outcome based on intervals
probabilities[0:5] = 1
probabilities[5:25] = 100
probabilities[25:35] = 15
probabilities[35:990] = 0.01
probabilities[990:] = 0.02

# Normalize probabilities to ensure their sum is 1
probabilities /= np.sum(probabilities)

# Test
# sample = np.random.choice(outcomes, size=1000, p=probabilities)
# print(list(filter(lambda x: x > 990, sample)))