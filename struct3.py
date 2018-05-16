print(__doc__)

import numpy as np
import matplotlib.pyplot as plt
from pymongo import MongoClient 
from sklearn import datasets, linear_model
from sklearn.metrics import mean_squared_error, r2_score

#Connect to MongoDB
client = MongoClient(port=27017)
db = client.jsAppTest

#Query training data
query = db.train.find({})
X_train = [[item[key] for key in item if key != u'_id'] for item in query]

for item in X_train:
  item.reverse()

posPoints = {}
for item in X_train:
  if(posPoints.has_key(item[0])):
    posPoints[item[0]].append([item[1], item[2]])
  else:
    posPoints[item[0]] = [[item[1], item[2]]]

for pos in posPoints:
  posPoints[pos] = np.array(posPoints[pos])

x = posPoints[u'NP'][:, 0]
y = posPoints[u'NP'][:, 1]

fit = np.polyfit(x, y, 1)
fit_fn = np.poly1d(fit) 

plt.title("Test")

plt.plot(x, fit_fn(x), '--k')
plt.scatter(x, y, c='white', s=20, edgecolor='k')

plt.show()

print ''
